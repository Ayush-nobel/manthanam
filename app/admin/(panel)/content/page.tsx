import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess, PageTitle, StatusBadge, when } from "@/components/admin/format";
import { listInsightRows } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { can, INSIGHT_STATUSES, INSIGHT_STATUS_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Content" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "content.edit")) return <NoAccess />;
    const status = one((await searchParams).status);
    const filter = (INSIGHT_STATUSES as readonly string[]).includes(status) ? status : "";
    const { rows, byStatus } = await listInsightRows(filter || undefined);
    const editor = can(admin.role, "content.publish");
    const tabs = [["", "All", Object.values(byStatus).reduce((a, b) => a + b, 0)] as const, ...INSIGHT_STATUSES.map((s) => [s, INSIGHT_STATUS_LABELS[s], byStatus[s] ?? 0] as const)];

    return (
        <>
            <PageTitle
                aside={
                    <div className="flex flex-wrap gap-3">
                        {editor && (
                            <Link href="/admin/content/conference" className="inline-flex min-h-10 items-center border border-ink px-4 text-sm font-semibold text-ink hover:bg-white">
                                Conference details
                            </Link>
                        )}
                        <Link href="/admin/content/insights/new" className="inline-flex min-h-10 items-center bg-ink px-4 text-sm font-semibold text-paper hover:bg-signal-deep">
                            New article
                        </Link>
                    </div>
                }
            >
                Insights
            </PageTitle>

            {editor && (byStatus.in_review ?? 0) > 0 && filter !== "in_review" && (
                <p className="mb-6 border-l-4 border-signal bg-white px-4 py-3 text-base">
                    {byStatus.in_review} article{byStatus.in_review === 1 ? " is" : "s are"} waiting for review.{" "}
                    <Link href="/admin/content?status=in_review" className="font-semibold underline underline-offset-4">
                        Review now
                    </Link>
                </p>
            )}

            <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 border-b border-line">
                {tabs.map(([s, label, n]) => (
                    <Link
                        key={s || "all"}
                        href={s ? `/admin/content?status=${s}` : "/admin/content"}
                        aria-current={filter === s ? "page" : undefined}
                        className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold ${filter === s ? "border-signal text-ink" : "border-transparent text-muted-ink hover:text-ink"}`}
                    >
                        {label} <span className="ml-1.5 font-normal text-faint">{n}</span>
                    </Link>
                ))}
            </nav>

            {rows.length === 0 ? (
                <p className="mt-8 text-lg text-muted-ink">
                    {filter ? "Nothing here." : "No articles yet. Start one with New article; it stays a private draft until it’s published."}
                </p>
            ) : (
                <ul className="mt-2">
                    {rows.map((r) => (
                        <li key={r.id} className="border-b border-line">
                            <Link href={`/admin/content/insights/${r.id}`} className="grid gap-x-6 gap-y-1 py-4 hover:bg-white sm:grid-cols-[1fr_auto]">
                                <span>
                                    <span className="block font-display text-lg font-semibold text-ink [font-stretch:112%]">{r.title}</span>
                                    <span className="text-sm text-muted-ink">
                                        {r.category}
                                        {r.author_name && `, by ${r.author_name}`}. Edited {when(r.updated_at)}
                                    </span>
                                </span>
                                <span className="self-center">
                                    <StatusBadge status={r.status} kind="insight" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
