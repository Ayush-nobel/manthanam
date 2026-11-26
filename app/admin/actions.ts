"use server";

import { EMAIL_ADDRESS } from "@/lib/email-address";
import { randomBytes, randomInt } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { authClient, authorise, getAdmin } from "@/lib/auth";
import { audit, db, dbConfigured, type RegistrationRow } from "@/lib/db";
import { APPLICATION_STATUSES, isRole, MESSAGE_STATUSES, REGISTRATION_STATUSES, ROLE_LABELS } from "@/lib/permissions";
import { clientIpFrom, rateLimiter } from "@/lib/request-guard";
import { awaitingPaymentEmail, paymentEmailCounts } from "@/lib/admin-data";
import { getConference, type ConferenceContent } from "@/lib/site-content";
import { site } from "@/lib/site";
import { mailConfigured, mailFrom, sendApplicationReply, sendMessageReply, sendPaymentEmail, sendRegistrationEmail, sendSeatConfirmedEmail } from "@/lib/zoho-mail";

/**
 * Every change the admin dashboard can make. Each action checks the session and the role itself:
 * a server action is a public endpoint, whatever the page that shows its button.
 */

export interface FormState {
    error?: string;
    ok?: string;
    /** A one-time password to hand to a new admin (shown once, never stored). */
    secret?: string;
}

/**
 * What the admin sees when the database or Supabase refuses something: a plain sentence. The detail goes
 * to the server log only. The "last owner" database rule is the one message worth passing on.
 */
function failed(what: string, err: { message?: string } | null | undefined): FormState {
    const detail = err?.message ?? "unknown error";
    console.error(`${what} failed:`, detail);
    if (/at least one owner/i.test(detail)) return { error: "There must always be at least one owner." };
    return { error: `${what} didn’t work. Try again in a minute; if it keeps failing, tell the website’s maintainer.` };
}

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const EMAIL = EMAIL_ADDRESS;

// Sign-in attempts: 10 per 15 minutes per connection, and 10 per 15 minutes per account (the second can't be
// dodged by faking addresses). Per server instance; Supabase adds its own limits on top.
const perIp = rateLimiter(10, 15 * 60_000);
const perAccount = rateLimiter(10, 15 * 60_000);
async function tooManyAttempts(email: string) {
    const ip = clientIpFrom(await headers());
    const a = perIp(ip);
    const b = perAccount(email);
    return a || b;
}

/** A readable one-time password, e.g. "mango-7Kq3-river-x9Pz". */
function tempPassword() {
    const words = ["river", "mango", "cedar", "lotus", "falcon", "harbor", "monsoon", "saffron", "comet", "ember", "delta", "summit"];
    const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    const chunk = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("");
    return `${words[randomInt(words.length)]}-${chunk()}-${words[randomInt(words.length)]}-${chunk()}`;
}

// Sign in and out -------------------------------------------------------------------------------

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
    if (!dbConfigured()) return { error: "The admin dashboard isn’t connected to its database yet." };
    const email = str(form, "email", 254).toLowerCase();
    if (await tooManyAttempts(email)) return { error: "Too many attempts. Wait 15 minutes and try again." };
    const password = String(form.get("password") ?? "");
    if (!EMAIL.test(email) || !password) return { error: "Enter your email address and password." };

    const supabase = await authClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: "That email and password don’t match an admin account." };

    const { data: row } = await db().from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
    if (!row || !isRole(row.role)) {
        await supabase.auth.signOut();
        return { error: "That email and password don’t match an admin account." };
    }
    await audit({ id: data.user.id, email }, "admin.sign_in", "admin", data.user.id);
    redirect("/admin");
}

export async function signOut() {
    const supabase = await authClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
}

export async function changeOwnPassword(_: FormState, form: FormData): Promise<FormState> {
    const admin = await getAdmin();
    if (!admin) return { error: "Your session has ended. Sign in again." };
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    if (next.length < 12) return { error: "Use at least 12 characters for the new password." };
    if (next !== String(form.get("confirm") ?? "")) return { error: "The two new passwords don’t match." };

    // Re-check the current password, so an unattended signed-in laptop can't be used to take the account over.
    const supabase = await authClient();
    const { error: wrong } = await supabase.auth.signInWithPassword({ email: admin.email, password: current });
    if (wrong) return { error: "Your current password isn’t right." };
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
        console.error("Password change failed:", error.message);
        return { error: "Your password couldn’t be changed. If it’s a common or very simple password, try a different one." };
    }
    // Sign out every other browser and device that was signed in as this admin, and lift the one-time flag.
    await supabase.auth.signOut({ scope: "others" });
    if (admin.mustChangePassword) await db().auth.admin.updateUserById(admin.id, { app_metadata: { must_change_password: false } });
    await audit(admin, "admin.password_change", "admin", admin.id);
    refresh();
    return { ok: "Password changed. Any other devices signed in to your account have been signed out." };
}

// Registrations ---------------------------------------------------------------------------------

export async function updateRegistration(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("registrations.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    const status = str(form, "status", 40);
    const notes = str(form, "notes", 5000);
    const guardianVerified = form.get("guardianVerified") === "on";
    if (!(REGISTRATION_STATUSES as readonly string[]).includes(status)) return { error: "Choose a status." };

    const { data: before } = await db().from("registrations").select("status, notes, minor, guardian_verified_at, reference").eq("id", id).maybeSingle<Pick<RegistrationRow, "status" | "notes" | "minor" | "guardian_verified_at" | "reference">>();
    if (!before) return { error: "That registration no longer exists." };

    const patch: Partial<RegistrationRow> = { status, notes };
    if (before.minor && guardianVerified !== !!before.guardian_verified_at) {
        patch.guardian_verified_at = guardianVerified ? new Date().toISOString() : null;
        patch.guardian_verified_by = guardianVerified ? admin.id : null;
    }
    const { error: dbError } = await db().from("registrations").update(patch).eq("id", id);
    if (dbError) return failed("Save", dbError);

    const changes: Record<string, unknown> = {};
    if (before.status !== status) changes.status = [before.status, status];
    if (before.notes !== notes) changes.notes = "edited";
    if ("guardian_verified_at" in patch) changes.guardianVerified = guardianVerified;
    if (Object.keys(changes).length) await audit(admin, "registration.update", "registration", id, { reference: before.reference, ...changes });
    refresh();
    return { ok: "Saved." };
}

/** "Mark verified" for the parents or guardians ticked on /admin/registrations?minor=pending. */
export async function verifyGuardians(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("registrations.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const ids = [...new Set(form.getAll("ids").map(String))].filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 200);
    if (!ids.length) return { error: "Tick at least one registration first." };
    const { data, error } = await db()
        .from("registrations")
        .update({ guardian_verified_at: new Date().toISOString(), guardian_verified_by: admin.id })
        .in("id", ids)
        .eq("minor", true)
        .is("guardian_verified_at", null)
        .select("id, reference");
    if (error) return failed("Verifying", error);
    const done = (data ?? []) as { id: string; reference: string }[];
    await Promise.all(done.map((r) => audit(admin, "registration.update", "registration", r.id, { reference: r.reference, guardianVerified: true })));
    refresh();
    const skipped = ids.length - done.length;
    return { ok: `Marked ${done.length} parent${done.length === 1 ? "" : "s"} or guardian${done.length === 1 ? "" : "s"} as verified.${skipped ? ` ${skipped} were already verified or aren’t under 18.` : ""}` };
}

export async function resendRegistrationEmail(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("registrations.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    if (!mailConfigured()) return { error: "Email sending isn’t set up." };
    const id = str(form, "id", 64);
    const { data: r } = await db().from("registrations").select("full_name, email, reference, minor, guardian_email").eq("id", id).maybeSingle<RegistrationRow>();
    if (!r) return { error: "That registration no longer exists." };
    try {
        await sendRegistrationEmail({ name: r.full_name, email: r.email, reference: r.reference, guardianEmail: r.minor ? r.guardian_email || undefined : undefined });
    } catch (err) {
        console.error("Resend failed for", r.reference, err);
        return { error: "The email couldn’t be sent. Try again in a minute." };
    }
    await db().from("registrations").update({ email_sent_at: new Date().toISOString() }).eq("id", id);
    await audit(admin, "registration.email_resent", "registration", id, { reference: r.reference });
    refresh();
    return { ok: `Confirmation sent to ${r.email}${r.minor && r.guardian_email ? ` (copy to ${r.guardian_email})` : ""}.` };
}

// Payment emails --------------------------------------------------------------------------------

/**
 * Zoho decides how many emails an hour this mailbox may send (roughly 50 to 500, rising with sender
 * reputation). Once it starts refusing, every further try fails too and looks like spam to Zoho, so a bulk
 * send stops at the first sign of it. Returns the reason to show the admin, or null to keep going.
 */
function sendingStopped(err: unknown, consecutiveFailures: number): string | null {
    const text = String(err instanceof Error ? err.message : err);
    if (/hourly email limit/i.test(text)) return "This website’s own hourly limit was reached. Press again in an hour.";
    if (/limit|exceed|too many|blocked|suspend|unusual|quota|spam|429|550|553|554/i.test(text) || consecutiveFailures >= 2) {
        const zoho = text.replace(/^Zoho Mail send failed:\s*/, "").slice(0, 200);
        return `Zoho Mail stopped accepting emails (it said: “${zoho}”). This is usually Zoho’s hourly sending limit for a new sender: wait an hour and press again. If it keeps happening, sign in to mail.zoho.in as the sending address and check for a “sending blocked” notice.`;
    }
    return null;
}

type PaymentTarget = Pick<RegistrationRow, "id" | "reference" | "full_name" | "email" | "minor" | "guardian_email" | "guardian_verified_at" | "status" | "payment_token">;
const PAYMENT_COLUMNS = "id, reference, full_name, email, minor, guardian_email, guardian_verified_at, status, payment_token";

/** Why payment emails can't go out at all right now, or null if they can. */
function paymentBlocked(c: ConferenceContent): string | null {
    if (!mailConfigured()) return "Email sending isn’t set up.";
    if (!c.paymentInstructions.trim()) return "Add the payment instructions (UPI ID or bank details) in Content → Conference first. The email shows them.";
    if (!c.fees.length) return "Add the fee in Content → Conference first. The email shows it.";
    return null;
}

/**
 * Emails one registrant the payment details and their personal proof-of-payment link. The link's token is
 * made once and kept, so a resent email carries the same link as the first. New registrations move to
 * "Payment pending"; any other status is left alone.
 */
async function deliverPaymentEmail(admin: { id: string; email: string }, r: PaymentTarget, c: ConferenceContent) {
    let token = r.payment_token;
    if (!token) {
        token = randomBytes(24).toString("base64url");
        const { data, error } = await db().from("registrations").update({ payment_token: token }).eq("id", r.id).is("payment_token", null).select("id");
        if (error) throw new Error(`token not saved: ${error.message}`);
        if (!data?.length) {
            // Another admin's send got there first: use the token it saved, so both emails carry the same link.
            const { data: saved } = await db().from("registrations").select("payment_token").eq("id", r.id).maybeSingle<{ payment_token: string | null }>();
            if (!saved?.payment_token) throw new Error("token not saved");
            token = saved.payment_token;
        }
    }
    await sendPaymentEmail({
        name: r.full_name,
        email: r.email,
        guardianEmail: r.minor ? r.guardian_email || undefined : undefined,
        reference: r.reference,
        minor: r.minor,
        fees: c.fees,
        instructions: c.paymentInstructions,
        dueBy: c.paymentDueBy,
        link: `${site.url}/pay/${token}`,
    });
    const patch: Partial<RegistrationRow> = { payment_email_sent_at: new Date().toISOString() };
    if (r.status === "new") patch.status = "payment_pending";
    await db().from("registrations").update(patch).eq("id", r.id);
    await audit(admin, "registration.payment_email", "registration", r.id, { reference: r.reference, ...(patch.status ? { status: [r.status, patch.status] } : {}) });
}

/** "Send payment email" on one registration (also resends). */
export async function sendPaymentRequest(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("registrations.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const c = await getConference();
    const blocked = paymentBlocked(c);
    if (blocked) return { error: blocked };
    const id = str(form, "id", 64);
    const { data: r } = await db().from("registrations").select(PAYMENT_COLUMNS).eq("id", id).maybeSingle<PaymentTarget>();
    if (!r) return { error: "That registration no longer exists." };
    if (r.status === "cancelled" || r.status === "refunded") return { error: "This registration is cancelled or refunded. Change its status first if they should pay." };
    if (r.minor && !r.guardian_verified_at) return { error: "Verify the parent or guardian first: tick “Parent or guardian verified” and save, then send." };
    try {
        await deliverPaymentEmail(auth.admin, r, c);
    } catch (err) {
        console.error("Payment email failed for", r.reference, err);
        return { error: sendingStopped(err, 2) ?? "The email couldn’t be sent. Try again in a minute." };
    }
    refresh();
    return { ok: `Payment email sent to ${r.email}${r.minor && r.guardian_email ? ` (copy to ${r.guardian_email})` : ""}.` };
}

/** How many registrations go per click: small enough to finish well inside a server request's time limit. */
const PAYMENT_BATCH = 20;


/** "Send payment emails": the next batch of registrants who haven't had one. Press again for the rest. */
export async function sendPaymentRequests(): Promise<FormState> {
    const auth = await authorise("registrations.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const c = await getConference();
    const blocked = paymentBlocked(c);
    if (blocked) return { error: blocked };
    const { data, error } = await awaitingPaymentEmail(PAYMENT_COLUMNS).order("created_at", { ascending: true }).limit(PAYMENT_BATCH);
    if (error) return failed("Loading registrations", error);
    const rows = (data ?? []) as unknown as PaymentTarget[];
    if (!rows.length) return { ok: "Everyone who can be emailed has had their payment email." };

    let sent = 0;
    const failedRefs: string[] = [];
    let stopped = "";
    let streak = 0;
    for (const r of rows) {
        try {
            await deliverPaymentEmail(auth.admin, r, c);
            sent++;
            streak = 0;
        } catch (err) {
            console.error("Payment email failed for", r.reference, err);
            streak++;
            const reason = sendingStopped(err, streak);
            if (reason) {
                stopped = ` Sending stopped. ${reason}`;
                break;
            }
            failedRefs.push(r.reference);
        }
    }
    await audit(auth.admin, "registration.payment_emails", "registration", "bulk", { sent, failed: failedRefs.length });
    const { waiting } = await paymentEmailCounts();
    refresh();
    const parts = [`Sent ${sent} payment email${sent === 1 ? "" : "s"}.`];
    if (failedRefs.length) parts.push(`Couldn’t send to ${failedRefs.join(", ")}; they’ll be tried again next time.`);
    if (stopped) parts.push(stopped.trim());
    else if (waiting) parts.push(`${waiting} still to send: press the button again.`);
    return failedRefs.length && !sent ? { error: parts.join(" ") } : { ok: parts.join(" ") };
}

// Seat confirmation -------------------------------------------------------------------------------

type SeatTarget = Pick<RegistrationRow, "id" | "reference" | "full_name" | "email" | "minor" | "guardian_email" | "guardian_verified_at" | "status" | "payment_amount" | "payment_reference">;
const SEAT_COLUMNS = "id, reference, full_name, email, minor, guardian_email, guardian_verified_at, status, payment_amount, payment_reference";

/** Why this registration can't be confirmed yet, or null. */
function seatBlocked(r: SeatTarget): string | null {
    if (r.status === "cancelled" || r.status === "refunded") return "it is cancelled or refunded";
    if (r.minor && !r.guardian_verified_at) return "the parent or guardian isn’t verified yet";
    return null;
}

/** Sets the status to Confirmed (if it isn't already) and emails "Your place is confirmed". */
async function confirmSeat(admin: { id: string; email: string }, r: SeatTarget, venue: string | null) {
    await sendSeatConfirmedEmail({
        name: r.full_name,
        email: r.email,
        guardianEmail: r.minor ? r.guardian_email || undefined : undefined,
        reference: r.reference,
        minor: r.minor,
        venue,
        amount: r.payment_amount,
        transactionId: r.payment_reference,
    });
    if (r.status !== "confirmed") await db().from("registrations").update({ status: "confirmed" }).eq("id", r.id);
    await audit(admin, "registration.seat_confirmed", "registration", r.id, { reference: r.reference, ...(r.status !== "confirmed" ? { status: [r.status, "confirmed"] } : { resent: true }) });
}

/** "Confirm seat and email" on one registration (also resends the confirmation). */
export async function confirmSeatAction(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("registrations.edit");
    if (auth.error !== undefined) return { error: auth.error };
    if (!mailConfigured()) return { error: "Email sending isn’t set up." };
    const { data: r } = await db().from("registrations").select(SEAT_COLUMNS).eq("id", str(form, "id", 64)).maybeSingle<SeatTarget>();
    if (!r) return { error: "That registration no longer exists." };
    const blocked = seatBlocked(r);
    if (blocked) return { error: `Can’t confirm: ${blocked}.` };
    try {
        await confirmSeat(auth.admin, r, (await getConference()).venue);
    } catch (err) {
        console.error("Seat confirmation failed for", r.reference, err);
        return { error: `The seat wasn’t confirmed. ${sendingStopped(err, 2)}` };
    }
    refresh();
    return { ok: `Seat confirmed and email sent to ${r.email}${r.minor && r.guardian_email ? ` (copy to ${r.guardian_email})` : ""}.` };
}

/** "Confirm ticked seats" on /admin/registrations?payment=proof. At most 25 per click, to finish in time. */
export async function confirmSeats(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("registrations.edit");
    if (auth.error !== undefined) return { error: auth.error };
    if (!mailConfigured()) return { error: "Email sending isn’t set up." };
    const ids = [...new Set(form.getAll("ids").map(String))].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (!ids.length) return { error: "Tick at least one registration first." };
    if (ids.length > 25) return { error: `You ticked ${ids.length}. Confirm up to 25 at a time, so every email has time to send.` };
    const { data, error } = await db().from("registrations").select(SEAT_COLUMNS).in("id", ids);
    if (error) return failed("Loading registrations", error);
    const venue = (await getConference()).venue;

    let sent = 0;
    const skipped: string[] = [];
    const failedRefs: string[] = [];
    let stopped = "";
    let streak = 0;
    for (const r of (data ?? []) as SeatTarget[]) {
        if (r.status === "confirmed" || seatBlocked(r)) {
            skipped.push(r.reference);
            continue;
        }
        try {
            await confirmSeat(auth.admin, r, venue);
            sent++;
            streak = 0;
        } catch (err) {
            console.error("Seat confirmation failed for", r.reference, err);
            failedRefs.push(r.reference);
            streak++;
            const reason = sendingStopped(err, streak);
            if (reason) {
                stopped = `Sending stopped, so the rest weren’t tried. ${reason}`;
                break;
            }
        }
    }
    refresh();
    const parts = [`Confirmed ${sent} seat${sent === 1 ? "" : "s"} and emailed ${sent === 1 ? "them" : "each one"}.`];
    if (skipped.length) parts.push(`Skipped ${skipped.join(", ")} (already confirmed, cancelled, or guardian not verified).`);
    if (failedRefs.length) parts.push(`Couldn’t email ${failedRefs.join(", ")}, so they weren’t confirmed; try them again.`);
    if (stopped) parts.push(stopped);
    return failedRefs.length && !sent ? { error: parts.join(" ") } : { ok: parts.join(" ") };
}

// Internship applications ---------------------------------------------------------------------

export async function updateApplication(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("applications.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    const status = str(form, "status", 40);
    const notes = str(form, "notes", 5000);
    if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) return { error: "Choose a status." };
    const { data: before } = await db().from("applications").select("status, notes").eq("id", id).maybeSingle();
    if (!before) return { error: "That application no longer exists." };
    const { error: dbError } = await db().from("applications").update({ status, notes }).eq("id", id);
    if (dbError) return failed("Save", dbError);
    const changes: Record<string, unknown> = {};
    if (before.status !== status) changes.status = [before.status, status];
    if (before.notes !== notes) changes.notes = "edited";
    if (Object.keys(changes).length) await audit(admin, "application.update", "application", id, changes);
    refresh();
    return { ok: "Saved." };
}

/** Emails a reply to an internship applicant and keeps a copy. The status is left as it is: set it separately. */
export async function replyToApplication(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("applications.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    const body = String(form.get("body") ?? "").trim();
    const invalid = replyProblem(body);
    if (invalid) return { error: invalid };

    const { data: a } = await db().from("applications").select("id, email, role, created_at").eq("id", id).maybeSingle();
    if (!a) return { error: "That application no longer exists." };
    const to = String(a.email).trim();
    if (!EMAIL.test(to)) return { error: "This application’s email address isn’t valid, so it can’t be replied to." };
    if (repliesPerAdmin(admin.id)) return { error: "You’ve sent a lot of replies in the last hour. Try again later." };

    try {
        await sendApplicationReply({ to, role: a.role, body, signedBy: admin.name || admin.email, appliedAt: a.created_at });
    } catch (err) {
        return sendFailed(err);
    }

    // The email has gone; from here on, failures only affect the record of it.
    const { error: saveError } = await db().from("application_replies").insert({ application_id: id, body, sent_to: to, sent_from: mailFrom(), sent_by: admin.id, sent_by_name: admin.name, sent_by_email: admin.email });
    if (saveError) console.error("Saving the reply failed:", saveError.message);
    await audit(admin, "application.reply", "application", id, { to });
    refresh();
    return { ok: saveError ? `Sent to ${to}. (A copy couldn’t be kept here.)` : `Sent to ${to}.` };
}

// Contact messages ------------------------------------------------------------------------------

export async function updateMessage(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("messages.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    const status = str(form, "status", 40);
    const notes = str(form, "notes", 5000);
    if (!(MESSAGE_STATUSES as readonly string[]).includes(status)) return { error: "Choose a status." };
    const { data: before } = await db().from("contact_messages").select("status").eq("id", id).maybeSingle();
    if (!before) return { error: "That message no longer exists." };
    const { error: dbError } = await db().from("contact_messages").update({ status, notes }).eq("id", id);
    if (dbError) return failed("Save", dbError);
    await audit(admin, "message.update", "contact_message", id, before.status !== status ? { status: [before.status, status] } : { notes: "edited" });
    refresh();
    return { ok: "Saved." };
}

/** Why a reply can't be sent as written, or null. */
function replyProblem(body: string): string | null {
    if (!body) return "Write a reply first.";
    if (body.length > 10000) return "Keep the reply under 10,000 characters.";
    if (!mailConfigured()) return "Email isn’t set up on this server, so replies can’t be sent. Reply from your mailbox instead.";
    return null;
}

function sendFailed(err: unknown): FormState {
    console.error("Reply email failed:", (err as Error).message);
    const limit = /limit/i.test((err as Error).message);
    return { error: limit ? "The email limit for this address or this hour has been reached. Try again later, or reply from your mailbox." : "The email couldn’t be sent. Nothing went out; try again in a minute." };
}

// Up to 40 replies an hour per admin (per server instance), on top of the mail limits in lib/zoho-mail.ts.
const repliesPerAdmin = rateLimiter(40, 60 * 60_000);

/** Emails a reply to whoever sent a contact message, keeps a copy, and marks the message Replied. */
export async function replyToMessage(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("messages.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    const body = String(form.get("body") ?? "").trim();
    const invalid = replyProblem(body);
    if (invalid) return { error: invalid };

    const { data: m } = await db().from("contact_messages").select("id, name, email, topic, message, created_at, status").eq("id", id).maybeSingle();
    if (!m) return { error: "That message no longer exists." };
    if (m.status === "spam") return { error: "This message is marked Spam. Change its status first if you really want to reply." };
    const to = String(m.email).trim();
    if (!EMAIL.test(to)) return { error: "This message’s email address isn’t valid, so it can’t be replied to." };
    if (repliesPerAdmin(admin.id)) return { error: "You’ve sent a lot of replies in the last hour. Try again later." };

    try {
        await sendMessageReply({ to, topic: m.topic, body, signedBy: admin.name || admin.email, original: m.message, originalAt: m.created_at });
    } catch (err) {
        return sendFailed(err);
    }

    // The email has gone; from here on, failures only affect the record of it.
    const { error: saveError } = await db().from("message_replies").insert({ message_id: id, body, sent_to: to, sent_from: mailFrom(), sent_by: admin.id, sent_by_name: admin.name, sent_by_email: admin.email });
    if (saveError) console.error("Saving the reply failed:", saveError.message);
    if (m.status !== "replied") await db().from("contact_messages").update({ status: "replied" }).eq("id", id);
    await audit(admin, "message.reply", "contact_message", id, { to });
    refresh();
    return { ok: saveError ? `Sent to ${to}. (A copy couldn’t be kept here.)` : `Sent to ${to}.` };
}

// Team ------------------------------------------------------------------------------------------

export async function addAdmin(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("team.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const email = str(form, "email", 254).toLowerCase();
    const name = str(form, "name", 100);
    const role = str(form, "role", 40);
    if (!EMAIL.test(email)) return { error: "Enter a valid email address." };
    if (!isRole(role)) return { error: "Choose a role." };

    // Never touch an existing admin from here: changing their role or password has its own guarded actions.
    const { data: existing } = await db().from("admin_users").select("user_id").eq("email", email).maybeSingle();
    if (existing) return { error: "That person is already an admin. Use Change role or Reset password on their row instead." };

    const password = tempPassword();
    let userId: string | undefined;
    const created = await db().auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name }, app_metadata: { must_change_password: true } });
    if (created.data.user) userId = created.data.user.id;
    else if (/already|registered|exists/i.test(created.error?.message ?? "")) {
        // A sign-in account with no admin role (e.g. someone removed earlier): reuse it with a new password.
        const found = await findUserByEmail(email);
        if (!found) return { error: "That email has an account that couldn’t be found. Try again." };
        const { data: isAdmin } = await db().from("admin_users").select("user_id").eq("user_id", found).maybeSingle();
        if (isAdmin) return { error: "That person is already an admin. Use Change role or Reset password on their row instead." };
        const { error: e } = await db().auth.admin.updateUserById(found, { password, app_metadata: { must_change_password: true } });
        if (e) return failed("Reusing that account", e);
        userId = found;
    } else return failed("Creating the account", created.error);

    const { error: dbError } = await db().from("admin_users").insert({ user_id: userId, email, name, role, created_by: admin.id });
    if (dbError) return failed("Save", dbError);
    await audit(admin, "admin.add", "admin", userId!, { email, role });
    refresh();
    return { ok: `${name || email} can now sign in as ${ROLE_LABELS[role].name}. Give them this one-time password privately (not by email to a shared inbox). They’ll be asked to set their own the first time they sign in.`, secret: password };
}

async function findUserByEmail(email: string): Promise<string | undefined> {
    for (let page = 1; page <= 20; page++) {
        const { data } = await db().auth.admin.listUsers({ page, perPage: 200 });
        const hit = data?.users.find((u) => u.email?.toLowerCase() === email);
        if (hit) return hit.id;
        if (!data || data.users.length < 200) return undefined;
    }
}

/** Owners can't demote or remove themselves, and the last owner can't be removed, so the team is never locked out. */
async function guardOwners(actorId: string, targetId: string, nextRole: string | null) {
    if (targetId === actorId) return "You can’t change your own role or remove yourself. Ask another owner.";
    if (nextRole === "owner") return null;
    const { data } = await db().from("admin_users").select("user_id").eq("role", "owner");
    const owners = (data ?? []).map((r) => r.user_id);
    if (owners.includes(targetId) && owners.length <= 1) return "There must always be at least one owner.";
    return null;
}

export async function changeAdminRole(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("team.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    const role = str(form, "role", 40);
    if (!isRole(role)) return { error: "Choose a role." };
    const blocked = await guardOwners(admin.id, id, role);
    if (blocked) return { error: blocked };
    const { data: before } = await db().from("admin_users").select("email, role").eq("user_id", id).maybeSingle();
    if (!before) return { error: "That admin no longer exists." };
    const { error: dbError } = await db().from("admin_users").update({ role }).eq("user_id", id);
    if (dbError) return failed("Save", dbError);
    await audit(admin, "admin.role", "admin", id, { email: before.email, role: [before.role, role] });
    refresh();
    return { ok: `${before.email} is now ${ROLE_LABELS[role].name}.` };
}

export async function removeAdmin(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("team.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    const blocked = await guardOwners(admin.id, id, null);
    if (blocked) return { error: blocked };
    const { data: before } = await db().from("admin_users").select("email").eq("user_id", id).maybeSingle();
    if (!before) return { error: "That admin no longer exists." };
    // Delete the sign-in account too, which also ends any session they have open.
    const { error: e } = await db().auth.admin.deleteUser(id);
    if (e) return failed("Removing the admin", e);
    await db().from("admin_users").delete().eq("user_id", id);
    await audit(admin, "admin.remove", "admin", id, { email: before.email });
    refresh();
    return { ok: `${before.email} can no longer sign in.` };
}

export async function resetAdminPassword(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("team.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const id = str(form, "id", 64);
    if (id === admin.id) return { error: "Change your own password under Account." };
    const { data: target } = await db().from("admin_users").select("email").eq("user_id", id).maybeSingle();
    if (!target) return { error: "That admin no longer exists." };
    const password = tempPassword();
    const { error: e } = await db().auth.admin.updateUserById(id, { password, app_metadata: { must_change_password: true } });
    if (e) return failed("Resetting the password", e);
    await audit(admin, "admin.password_reset", "admin", id, { email: target.email });
    return { ok: `New one-time password for ${target.email}. Give it to them privately; they’ll be asked to set their own when they sign in.`, secret: password };
}
