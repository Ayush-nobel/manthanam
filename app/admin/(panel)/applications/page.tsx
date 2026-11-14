import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess, PageTitle, StatusBadge, when } from "@/components/admin/format";
import { listApplications, PAGE_SIZE } from "@/lib/admin-data";
import { APPLICATION_ROLES, roleName } from "@/lib/application";
import { requireAdmin } from "@/lib/auth";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Applications" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "applications.view")) return <NoAccess />;
    const sp = await searchParams;
    const f = { q: one(sp.q), status: one(sp.status), role: one(sp.role), page: Math.max(1, Number(one(sp.page)) || 1) };
    const { rows, total } = await listApplications(f);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const qs = (over: Record<string, string | number>) => {
        const p = new URLSearchParams(Object.entries({ ...f, ...over }).filter(([, v]) => v !== "" && v !== 1).map(([k, v]) => [k, String(v)]));
        const s = p.toString();
        return s ? `?${s}` : "";
    };
    const filtered = !!(f.q || f.status || f.role);
    const select = "mt-1 block min-h-11 border border-line-strong bg-white px-3 text-base";

    return (
        <>
            <PageTitle
                aside={
                    can(admin.role, "applications.export") && (
                        <a href={`/admin/export/applications${qs({ page: 1 })}`} className="inline-flex min-h-10 items-center border border-ink px-4 text-sm font-semibold text-ink hover:bg-white">
                            Download for Excel{filtered ? " (these results)" : ""}
                        </a>
                    )
                }
            >
                Internship applications
            </PageTitle>

            <form className="flex flex-wrap items-end gap-3 border-y border-line py-4" role="search">
                <label className="block min-w-[16rem] flex-1">
                    <span className="text-sm font-semibold">Search</span>
                    <input name="q" defaultValue={f.q} placeholder="Name, email, phone, college, city or words in the answer" className={`${select} w-full`} />
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Role</span>
                    <select name="role" defaultValue={f.role} className={select}>
                        <option value="">Any</option>
                        {APPLICATION_ROLES.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Status</span>
                    <select name="status" defaultValue={f.status} className={select}>
                        <option value="">Any</option>
                        {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {APPLICATION_STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit" className="min-h-11 bg-ink px-5 text-sm font-semibold text-paper hover:bg-signal-deep">
                    Show
                </button>
                {filtered && (
                    <Link href="/admin/applications" className="min-h-11 content-center px-2 text-sm underline underline-offset-4">
                        Clear
                    </Link>
                )}
            </form>

            <p className="mt-4 text-sm text-muted-ink">
                {total === 0 ? (filtered ? "No applications match." : "No applications yet. They appear here as soon as someone applies at manthanam.in/join.") : `${total} application${total === 1 ? "" : "s"}${filtered ? " match" : ""}`}
            </p>

            {rows.length > 0 && (
                <div className="mt-3 overflow-x-auto border-t border-ink">
                    <table className="w-full min-w-[52rem] text-left text-sm">
                        <thead>
                            <tr className="border-b border-ink text-muted-ink">
                                <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Role</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Contact</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Applied</th>
                                <th scope="col" className="py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr key={a.id} className="border-b border-line align-top hover:bg-white">
                                    <td className="py-3 pr-4">
                                        <Link href={`/admin/applications/${a.id}`} className="font-semibold text-ink underline-offset-4 hover:text-signal hover:underline">
                                            {a.full_name}
                                        </Link>
                                        <span className="block text-muted-ink">
                                            {a.organisation}, {a.city}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4">{roleName(a.role)}</td>
                                    <td className="py-3 pr-4 break-all">
                                        {a.email}
                                        <span className="block text-muted-ink">{a.phone}</span>
                                    </td>
                                    <td className="py-3 pr-4 whitespace-nowrap text-muted-ink">{when(a.created_at)}</td>
                                    <td className="py-3">
                                        <StatusBadge status={a.status} kind="application" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pages > 1 && (
                <nav aria-label="Pages" className="mt-6 flex items-center gap-4 text-sm">
                    {f.page > 1 && <Link href={`/admin/applications${qs({ page: f.page - 1 })}`} className="underline underline-offset-4">Previous</Link>}
                    <span className="text-muted-ink">Page {f.page} of {pages}</span>
                    {f.page < pages && <Link href={`/admin/applications${qs({ page: f.page + 1 })}`} className="underline underline-offset-4">Next</Link>}
                </nav>
            )}
        </>
    );
}
