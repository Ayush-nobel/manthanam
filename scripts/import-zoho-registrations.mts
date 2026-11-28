/**
 * One-off: copy registrations made before the database existed from the Zoho Sheet into Supabase.
 *
 *   npx tsx scripts/import-zoho-registrations.mts [file.csv]           dry run: shows what it would import
 *   npx tsx scripts/import-zoho-registrations.mts [file.csv] --apply   imports
 *
 * With a file, reads the sheet downloaded from Zoho (File → Download as → CSV); without one, reads it
 * through the Zoho Sheet API. Reads the Zoho and Supabase settings from .env.local. Safe to run again: rows whose registration
 * number or email is already in the database are skipped. Nothing in the Zoho Sheet is changed.
 */
import { readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const env = (k: string) => process.env[k]?.trim() || undefined;
const apply = process.argv.includes("--apply");
const file = process.argv.slice(2).find((a) => !a.startsWith("--"));

/** RFC 4180 CSV (quoted fields, doubled quotes, line breaks inside quotes) into objects keyed by the header row. */
function readCsv(path: string): Record<string, string>[] {
    const src = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
    const rows: string[][] = [];
    let row: string[] = [], field = "", quoted = false;
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (quoted) {
            if (c === '"' && src[i + 1] === '"') {
                field += '"';
                i++;
            } else if (c === '"') quoted = false;
            else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ",") {
            row.push(field);
            field = "";
        } else if (c === "\n" || c === "\r") {
            if (c === "\r" && src[i + 1] === "\n") i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else field += c;
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    const [header, ...body] = rows;
    return body.filter((r) => r.some((v) => v.trim())).map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const DC = (env("ZOHO_DC") ?? "in").toLowerCase().replace(/^(https?:\/\/)?([a-z]+\.)?zoho\./, "").replace(/^\./, "");
const WORKSHEET = env("ZOHO_SHEET_WORKSHEET") ?? "Registrations";

async function zohoToken() {
    const res = await fetch(`https://accounts.zoho.${DC}/oauth/v2/token`, {
        method: "POST",
        body: new URLSearchParams({ refresh_token: env("ZOHO_REFRESH_TOKEN")!, client_id: env("ZOHO_CLIENT_ID")!, client_secret: env("ZOHO_CLIENT_SECRET")!, grant_type: "refresh_token" }),
    });
    const body = (await res.json()) as { access_token?: string; error?: string };
    if (!body.access_token) throw new Error(`Zoho sign-in failed: ${body.error}`);
    return body.access_token;
}

async function sheetRows(token: string): Promise<Record<string, string>[]> {
    const rows: Record<string, string>[] = [];
    for (let start = 1; ; start += 500) {
        const res = await fetch(`https://sheet.zoho.${DC}/api/v2/${encodeURIComponent(env("ZOHO_SHEET_RESOURCE_ID")!)}`, {
            method: "POST",
            headers: { Authorization: `Zoho-oauthtoken ${token}` },
            body: new URLSearchParams({ method: "worksheet.records.fetch", worksheet_name: WORKSHEET, header_row: "1", start_index: String(start), count: "500" }),
        });
        const body = (await res.json()) as { status: string; records?: Record<string, unknown>[]; error_message?: string };
        if (body.status !== "success") throw new Error(`Zoho Sheet read failed: ${body.error_message}`);
        const page = (body.records ?? []).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "").trim()])));
        rows.push(...page);
        if (page.length < 500) return rows;
    }
}

/** Undo the ' the website put in front of values starting with = + - @ (formula protection). */
const text = (v: string | undefined) => (v ?? "").replace(/^'(?=[=+\-@\t\r])/, "");

/** Dates as the website wrote them (2010-05-04), or as Zoho may display them (04/05/2010, 4-May-2010). */
function isoDate(v: string): string | null {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; // day first (India)
    const d = new Date(`${v} UTC`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function submittedAt(v: string): string | null {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(:\d{2})?)/);
    if (m) return new Date(`${m[1]}T${m[2]}${m[3] ? "" : ":00"}Z`).toISOString();
    const d = new Date(`${v} UTC`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function newReference() {
    const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    return "IYS26-" + Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
}
function ageOn(dob: string, day: string) {
    const [y, m, d] = dob.split("-").map(Number);
    const [cy, cm, cd] = day.split("-").map(Number);
    return cy - y - (cm < m || (cm === m && cd < d) ? 1 : 0);
}

const STATUS: Record<string, string> = {
    new: "new",
    "payment pending": "payment_pending",
    "awaiting payment": "payment_pending",
    paid: "paid",
    confirmed: "confirmed",
    cancelled: "cancelled",
    canceled: "cancelled",
    refunded: "refunded",
};

const db = createClient(new URL(env("SUPABASE_URL")!).origin, env("SUPABASE_SECRET_KEY")!, { auth: { persistSession: false } });

const sheet = file ? readCsv(file) : await sheetRows(await zohoToken());
const { data: existing, error } = await db.from("registrations").select("reference, email");
if (error) throw new Error(error.message);
const haveRef = new Set(existing!.map((r) => r.reference));
const haveEmail = new Set(existing!.map((r) => r.email.toLowerCase()));

const toInsert: Record<string, unknown>[] = [];
const skipped: string[] = [];
for (const r of sheet) {
    const email = text(r["Email"]).toLowerCase();
    // Rows saved on 8 November while the sheet's header cells were merged lost their number: give them a new one.
    const lostNumber = !text(r["Reference"]);
    let reference = text(r["Reference"]);
    while (!reference || (lostNumber && haveRef.has(reference))) reference = newReference();
    const label = lostNumber ? `${reference} (new number)` : reference;
    if (!email) {
        skipped.push(`${label}: no email address`);
        continue;
    }
    if ((!lostNumber && haveRef.has(reference)) || haveEmail.has(email)) {
        skipped.push(`${label}: already in the database`);
        continue;
    }
    const dob = isoDate(text(r["Date of birth"]));
    const created = submittedAt(text(r["Submitted (UTC)"]));
    if (!dob) {
        skipped.push(`${label}: date of birth "${r["Date of birth"]}" not understood`);
        continue;
    }
    const under18 = text(r["Under 18"]);
    const minor = under18 ? /^yes/i.test(under18) : ageOn(dob, "2026-12-19") < 18;
    const sheetStatus = text(r["Registration status"]);
    const status = STATUS[sheetStatus.toLowerCase()] ?? "new";
    const notes = [
        "Imported from the Zoho Sheet (registered before the database existed).",
        lostNumber ? "Their original registration number wasn't saved in the sheet, so this number was given on import. The number on their confirmation email or screen will be different; check by name and email." : "",
        !created ? "The time they registered wasn't saved in the sheet (about 8 November 2026)." : "",
        status === "new" && sheetStatus && sheetStatus.toLowerCase() !== "new" ? `Status in the sheet was: ${sheetStatus}` : "",
    ]
        .filter(Boolean)
        .join("\n");
    toInsert.push({
        reference,
        created_at: created ?? "2026-11-08T07:00:00Z",
        full_name: text(r["Full name"]),
        email,
        phone: text(r["Phone"]),
        date_of_birth: dob,
        minor,
        participant_type: text(r["Status"]),
        institution: text(r["Institution"]),
        city: text(r["City"]),
        state: text(r["State"]),
        country: text(r["Country"]),
        motivation: text(r["Why they want to attend"]),
        heard_from: text(r["Heard about it from"]),
        access_needs: text(r["Access needs"]),
        guardian_name: text(r["Guardian name"]),
        guardian_relation: text(r["Guardian relation"]),
        guardian_email: text(r["Guardian email"]).toLowerCase(),
        guardian_phone: text(r["Guardian phone"]),
        consent_text: text(r["Consent given"]),
        guardian_consent_text: text(r["Guardian consent"]),
        place_terms_text: text(r["Place terms accepted"]),
        privacy_policy_version: text(r["Privacy policy version"]),
        status,
        notes,
        ...(created ? { sheet_synced_at: created } : {}),
    });
    haveRef.add(reference);
    haveEmail.add(email);
}

console.log(`Rows in the Zoho Sheet: ${sheet.length}`);
console.log(`To import: ${toInsert.length}${toInsert.length ? ` (${toInsert.filter((r) => r.minor).length} under 18)` : ""}`);
for (const r of toInsert) console.log(`  + ${r.reference}${String(r.notes).includes("given on import") ? " (new number)" : ""}  ${String(r.created_at ?? "").slice(0, 10)}  status ${r.status}${r.minor ? "  under 18" : ""}`);
if (skipped.length) {
    console.log(`Skipped: ${skipped.length}`);
    for (const s of skipped) console.log(`  - ${s}`);
}

if (!apply) {
    console.log("\nDry run: nothing was written. Run again with --apply to import.");
} else if (toInsert.length) {
    const { data, error: e } = await db.from("registrations").insert(toInsert).select("id, reference");
    if (e) throw new Error(`Import failed, nothing was imported: ${e.message}`);
    await db.from("audit_log").insert(data!.map((r) => ({ actor_email: "import", action: "registration.import", entity: "registration", entity_id: r.id, detail: { reference: r.reference, from: "Zoho Sheet" } })));
    console.log(`\nImported ${data!.length}.`);
}
