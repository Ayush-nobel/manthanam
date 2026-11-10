import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess, PageTitle, StatusBadge, when } from "@/components/admin/format";
import { listRegistrations, PAGE_SIZE } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { can, REGISTRATION_STATUSES, REGISTRATION_STATUS_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Registrations" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function RegistrationsPage({ searchParams }: PageProps<"/admin/registrations">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "registrations.view")) return <NoAccess />;
    const sp = await searchParams;
    const f = { q: one(sp.q), status: one(sp.status), minor: one(sp.minor), page: Math.max(1, Number(one(sp.page)) || 1) };
    const { rows, total } = await listRegistrations(f);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const qs = (over: Record<string, string | number>) => {
        const p = new URLSearchParams(Object.entries({ ...f, ...over }).filter(([, v]) => v !== "" && v !== 1 && v !== "1").map(([k, v]) => [k, String(v)]));
        const s = p.toString();
        return s ? `?${s}` : "";
    };
    const filtered = !!(f.q || f.status || f.minor);

    return (
        <>
            <PageTitle
                aside={
                    can(admin.role, "registrations.export") && (
                        <a href={`/admin/export/registrations${qs({ page: 1 })}`} className="inline-flex min-h-10 items-center border border-ink px-4 text-sm font-semibold text-ink hover:bg-white">
                            Download for Excel{filtered ? " (these results)" : ""}
                        </a>
                    )
                }
            >
                Registrations
            </PageTitle>

            <form className="flex flex-wrap items-end gap-3 border-y border-line py-4" role="search">
                <label className="block min-w-[16rem] flex-1">
                    <span className="text-sm font-semibold">Search</span>
                    <input name="q" defaultValue={f.q} placeholder="Name, email, phone, number, institution, city" className="mt-1 block min-h-11 w-full border border-line-strong bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-signal" />
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Status</span>
                    <select name="status" defaultValue={f.status} className="mt-1 block min-h-11 border border-line-strong bg-white px-3 text-base">
                        <option value="">Any</option>
                        {REGISTRATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {REGISTRATION_STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Age</span>
                    <select name="minor" defaultValue={f.minor} className="mt-1 block min-h-11 border border-line-strong bg-white px-3 text-base">
                        <option value="">Anyone</option>
                        <option value="yes">Under 18</option>
                        <option value="pending">Under 18, guardian not verified</option>
                    </select>
                </label>
                <button type="submit" className="min-h-11 bg-ink px-5 text-sm font-semibold text-paper hover:bg-signal-deep">
                    Show
                </button>
                {filtered && (
                    <Link href="/admin/registrations" className="min-h-11 content-center px-2 text-sm underline underline-offset-4">
                        Clear
                    </Link>
                )}
            </form>

            <p className="mt-4 text-sm text-muted-ink" aria-live="polite">
                {total === 0 ? (filtered ? "No registrations match." : "No registrations yet.") : `${total} registration${total === 1 ? "" : "s"}${filtered ? " match" : ""}`}
            </p>

            {rows.length > 0 && (
                <div className="mt-3 overflow-x-auto border-t border-ink">
                    <table className="w-full min-w-[56rem] text-left text-sm">
                        <thead>
                            <tr className="border-b border-ink text-muted-ink">
                                <th scope="col" className="py-2 pr-4 font-semibold">Number</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Contact</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">From</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Registered</th>
                                <th scope="col" className="py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-line align-top hover:bg-white">
                                    <td className="py-3 pr-4 font-mono text-faint">{r.reference}</td>
                                    <td className="py-3 pr-4">
                                        <Link href={`/admin/registrations/${r.id}`} className="font-semibold text-ink underline-offset-4 hover:text-signal hover:underline">
                                            {r.full_name}
                                        </Link>
                                        <span className="block text-muted-ink">
                                            {r.participant_type}
                                            {r.institution && `, ${r.institution}`}
                                        </span>
                                        {r.minor && <span className="block text-xs text-signal">Under 18{r.guardian_verified_at ? ", guardian verified" : ", verify guardian"}</span>}
                                    </td>
                                    <td className="py-3 pr-4 break-all">
                                        {r.email}
                                        <span className="block text-muted-ink">{r.phone}</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {r.city}
                                        <span className="block text-muted-ink">{[r.state, r.country].filter(Boolean).join(", ")}</span>
                                    </td>
                                    <td className="py-3 pr-4 whitespace-nowrap text-muted-ink">{when(r.created_at)}</td>
                                    <td className="py-3">
                                        <StatusBadge status={r.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pages > 1 && (
                <nav aria-label="Pages" className="mt-6 flex items-center gap-4 text-sm">
                    {f.page > 1 && (
                        <Link href={`/admin/registrations${qs({ page: f.page - 1 })}`} className="underline underline-offset-4">
                            Previous
                        </Link>
                    )}
                    <span className="text-muted-ink">
                        Page {f.page} of {pages}
                    </span>
                    {f.page < pages && (
                        <Link href={`/admin/registrations${qs({ page: f.page + 1 })}`} className="underline underline-offset-4">
                            Next
                        </Link>
                    )}
                </nav>
            )}
        </>
    );
}
