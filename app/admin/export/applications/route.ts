import { listApplications } from "@/lib/admin-data";
import { roleName } from "@/lib/application";
import { adminWith } from "@/lib/auth";
import { audit } from "@/lib/db";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/permissions";

/** Internship applications as a CSV that opens in Excel (same safeguards as the registrations download). */
export async function GET(request: Request) {
    const admin = await adminWith("applications.export");
    if (!admin) return new Response("Sign in as an admin whose role allows downloads.", { status: 403 });

    const sp = new URL(request.url).searchParams;
    const { rows } = await listApplications({ q: sp.get("q") ?? "", status: sp.get("status") ?? "", role: sp.get("role") ?? "" }, { all: true });
    const ist = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }).replace(",", "") : "");
    const columns: [string, (r: (typeof rows)[number]) => string][] = [
        ["Applied (IST)", (r) => ist(r.created_at)],
        ["Role", (r) => roleName(r.role)],
        ["Status", (r) => APPLICATION_STATUS_LABELS[r.status as ApplicationStatus] ?? r.status],
        ["Full name", (r) => r.full_name],
        ["Email", (r) => r.email],
        ["Phone", (r) => r.phone],
        ["College or work", (r) => r.organisation],
        ["City", (r) => r.city],
        ["Why them", (r) => r.motivation],
        ["Link to work", (r) => r.portfolio],
        ["Notes", (r) => r.notes],
    ];
    const cell = (v: string) => {
        const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
        return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const csv = "﻿" + [columns.map(([h]) => cell(h)).join(","), ...rows.map((r) => columns.map(([, get]) => cell(get(r) ?? "")).join(","))].join("\r\n") + "\r\n";
    await audit(admin, "application.export", "application", "", { rows: rows.length });
    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="internship-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
            "Cache-Control": "private, no-store",
        },
    });
}
