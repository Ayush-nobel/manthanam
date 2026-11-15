import type { Metadata } from "next";
import Link from "next/link";
import { InsightEditor } from "@/components/admin/insight-editor";
import { NoAccess, PageTitle } from "@/components/admin/format";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "New article" };

export default async function NewInsightPage() {
    const admin = await requireAdmin();
    if (!can(admin.role, "content.edit")) return <NoAccess />;
    return (
        <>
            <p className="text-sm">
                <Link href="/admin/content" className="underline underline-offset-4">Insights</Link>
            </p>
            <div className="mt-3">
                <PageTitle>New article</PageTitle>
            </div>
            <InsightEditor
                canPublish={can(admin.role, "content.publish")}
                initial={{ title: "", slug: "", category: "Commentary", summary: "", body: "", authorName: "", authorBio: "", displayDate: "", status: "draft", reviewNote: "" }}
            />
        </>
    );
}
