"use server";

import { EMAIL_ADDRESS } from "@/lib/email-address";
import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { authClient, authorise, getAdmin } from "@/lib/auth";
import { audit, db, dbConfigured, type RegistrationRow } from "@/lib/db";
import { APPLICATION_STATUSES, isRole, MESSAGE_STATUSES, REGISTRATION_STATUSES, ROLE_LABELS } from "@/lib/permissions";
import { clientIpFrom, rateLimiter } from "@/lib/request-guard";
import { mailConfigured, sendRegistrationEmail } from "@/lib/zoho-mail";

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
