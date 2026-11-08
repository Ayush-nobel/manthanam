import { randomInt } from "node:crypto";
import { conference } from "@/lib/conference";
import { site } from "@/lib/site";
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
import { addRow, hasValue, zohoConfigured, zohoDataCentre, zohoMissing } from "@/lib/zoho-sheet";

/**
 * Registration gateway for the BRICS India Youth Conference 2026.
 *
 * The browser posts here (same origin, so no third party sees the form); this route validates
 * everything again, then appends one row to Manthanam's Zoho Sheet (see docs/registration-sheet.md).
 * The Zoho credentials are server-only environment variables: they never reach the browser.
 */

// Best-effort limit per IP: 5 registrations per 10 minutes on each server instance.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();
function limited(ip: string) {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > MAX_PER_WINDOW;
}

/**
 * Only accept posts made by this site's own pages. Browsers mark every request with
 * Sec-Fetch-Site, which a web page cannot forge: "same-origin" means our own form sent it.
 * Older browsers that don't send it fall back to comparing the Origin header with our domains.
 */
function fromThisSite(request: Request) {
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite) return fetchSite === "same-origin";
    const origin = request.headers.get("origin");
    if (!origin) return false;
    let host: string;
    try {
        host = new URL(origin).host.replace(/\.$/, "").replace(/\.:/, ":");
    } catch {
        return false;
    }
    const allowed = new Set([new URL(site.url).host, "manthanam.in"]);
    // "www.manthanam.in." (trailing dot) is the same host written as a fully qualified name.
    for (const h of [request.headers.get("host"), request.headers.get("x-forwarded-host")]) if (h) allowed.add(h.replace(/\.$/, "").replace(/\.:/, ":"));
    try {
        allowed.add(new URL(request.url).host);
    } catch {}
    if (!allowed.has(host)) console.warn("Registration refused: origin", origin, "host", request.headers.get("host"), "x-forwarded-host", request.headers.get("x-forwarded-host"));
    return allowed.has(host);
}

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

    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    if (limited(ip)) return json({ error: "Too many registrations from this connection. Please wait ten minutes and try again." }, 429);

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

    if (!zohoConfigured()) {
        console.error("Zoho Sheet settings missing:", zohoMissing().join(", "), "— see docs/registration-sheet.md.");
        return json({ error: "Registration isn’t connected yet." }, 503);
    }

    const minor = isMinor(v.dateOfBirth!);
    const email = v.email!.toLowerCase();
    const ref = reference();
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

    try {
        if (await hasValue("Email", email))
            return json({ errors: { email: "This email address is already registered. To change your registration, email us." } }, 409);
        await addRow(row);
        console.info("Registration saved:", ref);
        return json({ ok: true, reference: ref });
    } catch (err) {
        console.error("Registration not saved:", err);
        return json({ error: "We couldn’t save your registration right now." }, 502);
    }
}

/** Setup check: says whether the Zoho settings reached the server, naming (never showing) any that are missing. */
export async function GET() {
    await connection();
    return json({ connected: zohoConfigured(), dataCentre: zohoDataCentre(), missing: zohoMissing() });
}
