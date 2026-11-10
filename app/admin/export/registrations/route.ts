import { listRegistrations } from "@/lib/admin-data";
import { getAdmin } from "@/lib/auth";
import { audit } from "@/lib/db";
import { can, REGISTRATION_STATUS_LABELS, type RegistrationStatus } from "@/lib/permissions";

/**
 * Registrations as a CSV file that opens straight in Excel (UTF-8 with a byte-order mark, so names in
 * any script come through). Values that start like a formula are prefixed with ' so Excel shows them
 * as text instead of running them.
 */
export async function GET(request: Request) {
    const admin = await getAdmin();
    if (!admin) return new Response("Sign in first.", { status: 401 });
    if (!can(admin.role, "registrations.export")) return new Response("Your role doesn’t allow downloads.", { status: 403 });

    const sp = new URL(request.url).searchParams;
    const { rows } = await listRegistrations({ q: sp.get("q") ?? "", status: sp.get("status") ?? "", minor: sp.get("minor") ?? "" }, { all: true });

    const ist = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }).replace(",", "") : "");
    const columns: [string, (r: (typeof rows)[number]) => string][] = [
        ["Registration number", (r) => r.reference],
        ["Registered (IST)", (r) => ist(r.created_at)],
        ["Status", (r) => REGISTRATION_STATUS_LABELS[r.status as RegistrationStatus] ?? r.status],
        ["Full name", (r) => r.full_name],
        ["Email", (r) => r.email],
        ["Phone", (r) => r.phone],
        ["Date of birth", (r) => r.date_of_birth],
        ["Under 18", (r) => (r.minor ? "Yes" : "No")],
        ["Guardian verified", (r) => (r.minor ? (r.guardian_verified_at ? `Yes, ${ist(r.guardian_verified_at)}` : "Not yet") : "")],
        ["Participant", (r) => r.participant_type],
        ["Institution", (r) => r.institution],
        ["City", (r) => r.city],
        ["State", (r) => r.state],
        ["Country", (r) => r.country],
        ["Why they want to attend", (r) => r.motivation],
        ["Heard about it from", (r) => r.heard_from],
        ["Access needs", (r) => r.access_needs],
        ["Guardian name", (r) => r.guardian_name],
        ["Guardian relation", (r) => r.guardian_relation],
        ["Guardian email", (r) => r.guardian_email],
        ["Guardian phone", (r) => r.guardian_phone],
        ["Confirmation emailed (IST)", (r) => ist(r.email_sent_at)],
        ["Notes", (r) => r.notes],
        ["Privacy policy version", (r) => r.privacy_policy_version],
    ];
    const cell = (v: string) => {
        const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
        return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const csv = "﻿" + [columns.map(([h]) => cell(h)).join(","), ...rows.map((r) => columns.map(([, get]) => cell(get(r) ?? "")).join(","))].join("\r\n") + "\r\n";

    await audit(admin, "registration.export", "registration", "", { rows: rows.length, filters: Object.fromEntries(sp) });
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="biyc-2026-registrations-${stamp}.csv"`,
            "Cache-Control": "private, no-store",
        },
    });
}
