import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightEditor } from "@/components/admin/insight-editor";
import { describe, NoAccess, StatusBadge, when } from "@/components/admin/format";
import { getInsightRow } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditInsightPage({ params }: PageProps<"/admin/content/insights/[id]">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "content.edit")) return <NoAccess />;
    const found = await getInsightRow((await params).id);
    if (!found) notFound();
    const { insight: i, history } = found;

    return (
        <>
            <p className="text-sm">
                <Link href="/admin/content" className="underline underline-offset-4">Insights</Link>
            </p>
            <div className="mb-8 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <h1 className="font-display text-[1.875rem] font-[650] leading-tight [font-stretch:115%]">{i.title}</h1>
                <StatusBadge status={i.status} kind="insight" />
                {i.status === "published" && (
                    <a href={`/insights/${i.slug}`} target="_blank" rel="noopener" className="text-sm underline underline-offset-4">
                        View on the site
                    </a>
                )}
            </div>
            <InsightEditor
                key={i.updated_at}
                canPublish={can(admin.role, "content.publish")}
                initial={{
                    id: i.id,
                    title: i.title,
                    slug: i.slug,
                    category: i.category,
                    summary: i.summary,
                    body: i.body,
                    authorName: i.author_name,
                    authorBio: i.author_bio,
                    displayDate: i.display_date ?? "",
                    status: i.status,
                    reviewNote: i.review_note,
                }}
            />
            <section aria-labelledby="history" className="mt-12 max-w-2xl">
                <h2 id="history" className="font-display text-lg font-[650]">History</h2>
                <ol className="mt-2 border-t border-ink text-sm">
                    {history.map((h) => (
                        <li key={h.id} className="border-b border-line py-2.5">
                            <span className="block text-ink">{describe(h.action, h.detail)}</span>
                            <span className="text-faint">
                                {when(h.at)}, {h.actor_email}
                            </span>
                        </li>
                    ))}
                </ol>
            </section>
        </>
    );
}
