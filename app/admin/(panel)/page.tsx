import type { Metadata } from "next";
import Link from "next/link";
import { describe, NoAccess, PageTitle, StatusBadge, when } from "@/components/admin/format";
import { overview, recentActivity } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { conference } from "@/lib/conference";
import { can, REGISTRATION_STATUS_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
    const admin = await requireAdmin();
    if (!can(admin.role, "registrations.view")) {
        return (
            <>
                <PageTitle>Welcome, {admin.name || admin.email}</PageTitle>
                {can(admin.role, "content.edit") ? <p className="text-lg text-muted-ink">Content editing arrives in the next update.</p> : <NoAccess />}
            </>
        );
    }
    const [o, activity] = await Promise.all([overview(), can(admin.role, "team.manage") ? recentActivity(12) : Promise.resolve([])]);
    const figures = [
        { label: "Registrations", value: o.total, href: "/admin/registrations" },
        { label: "In the last 24 hours", value: o.today, href: "/admin/registrations" },
        { label: "Under 18, guardian not yet verified", value: o.guardianPending, href: "/admin/registrations?minor=pending" },
        { label: "Unread contact messages", value: o.newMessages, href: "/admin/messages?status=new" },
    ];

    return (
        <>
            <PageTitle>{conference.title}</PageTitle>
            <dl className="grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
                {figures.map((f) => (
                    <Link key={f.label} href={f.href} className="group bg-white px-5 py-5 hover:bg-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal">
                        <dt className="text-sm text-muted-ink">{f.label}</dt>
                        <dd className="mt-1 font-display text-[2.25rem] font-[650] leading-none tabular-nums text-ink [font-stretch:115%] group-hover:text-signal-deep">{f.value}</dd>
                    </Link>
                ))}
            </dl>

            <div className="mt-12 grid gap-12 lg:grid-cols-12">
                <section className="lg:col-span-4" aria-labelledby="by-status">
                    <h2 id="by-status" className="font-display text-lg font-[650] text-ink">By status</h2>
                    <table className="mt-3 w-full border-t border-ink text-base">
                        <tbody>
                            {o.byStatus.map(([s, n]) => (
                                <tr key={s} className="border-b border-line">
                                    <th scope="row" className="py-2.5 text-left font-normal">
                                        <Link href={`/admin/registrations?status=${s}`} className="hover:text-signal">
                                            {REGISTRATION_STATUS_LABELS[s]}
                                        </Link>
                                    </th>
                                    <td className="py-2.5 text-right tabular-nums">{n}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="lg:col-span-8" aria-labelledby="latest">
                    <h2 id="latest" className="font-display text-lg font-[650] text-ink">Latest registrations</h2>
                    {o.recent.length ? (
                        <ul className="mt-3 border-t border-ink">
                            {o.recent.map((r) => (
                                <li key={r.id} className="border-b border-line">
                                    <Link href={`/admin/registrations/${r.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-white sm:grid-cols-[8rem_1fr_auto_auto]">
                                        <span className="font-mono text-sm text-faint">{r.reference}</span>
                                        <span className="font-semibold text-ink">
                                            {r.full_name}
                                            <span className="font-normal text-muted-ink">, {r.city}</span>
                                            {r.minor && <span className="ml-2 text-xs text-signal">under 18</span>}
                                        </span>
                                        <span className="text-sm text-faint">{when(r.created_at)}</span>
                                        <StatusBadge status={r.status} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-base text-muted-ink">
                            No registrations yet. They appear here as soon as someone registers at{" "}
                            <Link href="/register" className="underline underline-offset-4">
                                manthanam.in/register
                            </Link>
                            .
                        </p>
                    )}
                </section>
            </div>

            {activity.length > 0 && (
                <section className="mt-14" aria-labelledby="activity">
                    <h2 id="activity" className="font-display text-lg font-[650] text-ink">Recent activity</h2>
                    <ul className="mt-3 border-t border-ink text-sm">
                        {activity.map((a) => (
                            <li key={a.id} className="grid gap-x-4 border-b border-line py-2 sm:grid-cols-[11rem_14rem_1fr]">
                                <span className="text-faint">{when(a.at)}</span>
                                <span className="truncate text-muted-ink">{a.actor_email}</span>
                                <span className="text-ink">{describe(a.action, a.detail)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    );
}
