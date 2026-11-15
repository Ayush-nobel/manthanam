import { randomInt } from "node:crypto";
import { conference } from "@/lib/conference";
import {
    clean,
    CONSENT_TEXT,
    GUARDIAN_CONSENT_TEXT,
    isMinor,
    PLACE_TEXT,
    PRIVACY_POLICY_VERSION,
    validate,
    type Values,
} from "@/lib/registration";
import { connection } from "next/server";
import { clientIp, fromThisSite, rateLimiter } from "@/lib/request-guard";
import { adminWith } from "@/lib/auth";
import { audit, db, dbConfigured, dbMissing } from "@/lib/db";
import { diagnoseMail, mailConfigured, sendRegistrationEmail } from "@/lib/zoho-mail";
import { addRow, diagnose, hasValue, zohoConfigured, zohoDataCentre, zohoMissing } from "@/lib/zoho-sheet";

/**
 * Registration gateway for the BRICS India Youth Conference 2026.
 *
 * The browser posts here (same origin, so no third party sees the form); this route validates
 * everything again, then saves it in the website's database (docs/backend.md), where the admin
 * dashboard shows it. If Zoho Sheet is set up, a copy also goes there (docs/registration-sheet.md);
 * without a database, Zoho Sheet is the only store. All credentials are server-only.
 */

// Best-effort limit per IP: 5 registrations per 10 minutes on each server instance.
const limited = rateLimiter(5, 10 * 60 * 1000);

/** Unambiguous characters only (no 0/O, 1/I/L), e.g. BIYC26-7KQ3XM. */
function reference() {
    const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    let s = "";
    for (let i = 0; i < 6; i++) s += alphabet[randomInt(alphabet.length)];
    return `${conference.refPrefix}-${s}`;
}

/** Stops a value like =HYPERLINK(...) from running as a formula when the sheet is opened or exported to Excel. */
const cell = (v: string | undefined) => (v && /^[=+\-@\t\r]/.test(v) ? `'${v}` : (v ?? ""));

const json = (body: unknown, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
    // Only accept posts from this site's own pages.
    if (!fromThisSite(request)) return json({ error: "This form can only be sent from manthanam.in." }, 403);

    if (limited(clientIp(request))) return json({ error: "Too many registrations from this connection. Please wait ten minutes and try again." }, 429);

    if (!conference.registrationOpen) return json({ error: "Registration is closed." }, 403);

    let raw: Record<string, unknown>;
    try {
        const text = await request.text();
        if (text.length > 20_000) return json({ error: "The form is too long." }, 413);
        raw = JSON.parse(text);
    } catch {
        return json({ error: "The form could not be read. Please try again." }, 400);
    }

    // Honeypot: people never see this field. Answer as if it worked and store nothing (logged, so a false
    // positive shows up in the server logs rather than as a silently missing registration).
    if (typeof raw.x_hp_9 === "string" && raw.x_hp_9 !== "") {
        console.warn("Registration honeypot triggered; nothing saved.");
        return json({ ok: true, reference: reference() });
    }

    const v: Values = clean(raw);
    const errors = validate(v);
    if (Object.keys(errors).length) return json({ errors }, 422);

    const useDb = dbConfigured();
    if (!useDb && !zohoConfigured()) {
        console.error("No registration store: database missing", dbMissing().join(", "), "and Zoho missing", zohoMissing().join(", "));
        return json({ error: "Registration isn’t connected yet." }, 503);
    }

    const minor = isMinor(v.dateOfBirth!);
    const email = v.email!.toLowerCase();
    let ref = reference();
    const duplicate = () => json({ errors: { email: "This email address is already registered. To change your registration, email us." } }, 409);

    let id: string | undefined;
    if (useDb) {
        const record = {
            full_name: v.fullName!,
            email,
            phone: v.phone!,
            date_of_birth: v.dateOfBirth!,
            minor,
            participant_type: v.status!,
            institution: v.institution ?? "",
            city: v.city!,
            state: v.state ?? "",
            country: v.country!,
            motivation: v.motivation ?? "",
            heard_from: v.heardFrom ?? "",
            access_needs: v.accessNeeds ?? "",
            guardian_name: minor ? (v.guardianName ?? "") : "",
            guardian_relation: minor ? (v.guardianRelation ?? "") : "",
            guardian_email: minor ? (v.guardianEmail?.toLowerCase() ?? "") : "",
            guardian_phone: minor ? (v.guardianPhone ?? "") : "",
            consent_text: CONSENT_TEXT,
            guardian_consent_text: minor ? GUARDIAN_CONSENT_TEXT : "",
            place_terms_text: PLACE_TEXT,
            privacy_policy_version: PRIVACY_POLICY_VERSION,
        };
        try {
            // A clash on the reference (1 in ~900 million) just gets a new number.
            for (let attempt = 0; ; attempt++) {
                const { data, error } = await db().from("registrations").insert({ ...record, reference: ref }).select("id").single();
                if (!error) {
                    id = data.id as string;
                    break;
                }
                if (error.code === "23505" && /email/.test(error.message + (error.details ?? ""))) return duplicate();
                if (error.code === "23505" && attempt < 2) {
                    ref = reference();
                    continue;
                }
                throw new Error(`${error.code} ${error.message}`);
            }
            console.info("Registration saved:", ref);
            await audit(null, "registration.create", "registration", id!, { reference: ref });
        } catch (err) {
            console.error("Registration not saved:", err);
            return json({ error: "We couldn’t save your registration right now." }, 502);
        }
    }

    // Keys are the worksheet's header row, exactly (docs/registration-sheet.md lists them in order).
    const row: Record<string, string> = {
        Reference: ref,
        "Submitted (UTC)": new Date().toISOString().replace("T", " ").slice(0, 19),
        "Full name": cell(v.fullName),
        Email: cell(email),
        Phone: cell(v.phone),
        "Date of birth": v.dateOfBirth!,
        "Under 18": minor ? "Yes - verify guardian" : "No",
        Status: v.status!,
        Institution: cell(v.institution),
        City: cell(v.city),
        State: cell(v.state),
        Country: cell(v.country),
        "Why they want to attend": cell(v.motivation),
        "Heard about it from": v.heardFrom ?? "",
        "Access needs": cell(v.accessNeeds),
        "Guardian name": minor ? cell(v.guardianName) : "",
        "Guardian relation": minor ? (v.guardianRelation ?? "") : "",
        "Guardian email": minor ? cell(v.guardianEmail?.toLowerCase()) : "",
        "Guardian phone": minor ? cell(v.guardianPhone) : "",
        "Consent given": CONSENT_TEXT,
        "Guardian consent": minor ? GUARDIAN_CONSENT_TEXT : "",
        "Place terms accepted": PLACE_TEXT,
        "Privacy policy version": PRIVACY_POLICY_VERSION,
        "Registration status": "New",
    };

    if (useDb) {
        // The database has it; the sheet copy is a convenience, so a failure is logged, not shown.
        if (zohoConfigured()) {
            try {
                await addRow(row);
                await db().from("registrations").update({ sheet_synced_at: new Date().toISOString() }).eq("id", id!);
            } catch (err) {
                console.error("Zoho Sheet copy failed for", ref, err);
            }
        }
    } else {
        try {
            if (await hasValue("Email", email)) return duplicate();
            await addRow(row);
            console.info("Registration saved:", ref);
        } catch (err) {
            console.error("Registration not saved:", err);
            return json({ error: "We couldn’t save your registration right now." }, 502);
        }
    }

    // The registration is saved; a failed email must not undo that, so it's reported, not thrown.
    let emailed = false;
    if (mailConfigured()) {
        try {
            await sendRegistrationEmail({ name: v.fullName!, email, reference: ref, guardianEmail: minor ? v.guardianEmail?.toLowerCase() : undefined });
            emailed = true;
            if (id) await db().from("registrations").update({ email_sent_at: new Date().toISOString() }).eq("id", id);
        } catch (err) {
            console.error("Confirmation email not sent for", ref, err);
        }
    }
    return json({ ok: true, reference: ref, emailed });
}

/**
 * Setup check, for owners only (sign in at /admin first). Says whether the database and Zoho settings
 * reached the server, naming (never showing) any that are missing; ?check=zoho also tries each Zoho step.
 * Everyone else gets a plain 404, so the public can't read configuration or spend Zoho API quota.
 */
export async function GET(request: Request) {
    await connection();
    const admin = await adminWith("team.manage");
    if (!admin) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    const status = {
        database: dbConfigured() ? "connected" : `not set up (missing ${dbMissing().join(", ")})`,
        connected: zohoConfigured(),
        dataCentre: zohoDataCentre(),
        missing: zohoMissing(),
    };
    if (status.connected && new URL(request.url).searchParams.get("check") === "zoho") return json({ ...status, ...(await diagnose()), email: await diagnoseMail() });
    return json(status);
}
