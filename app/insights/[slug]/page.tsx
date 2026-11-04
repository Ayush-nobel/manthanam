import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Markdown from "@/components/markdown";
import { formatDate, getInsight, getInsights } from "@/lib/insights";

// With Cache Components this must return at least one entry, so fall back to a
// placeholder (which 404s) when content/insights/ is empty.
export async function generateStaticParams() {
    const all = await getInsights();
    return all.length ? all.map((i) => ({ slug: i.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/insights/[slug]">): Promise<Metadata> {
    const insight = await getInsight((await params).slug);
    if (!insight) return {};
    return {
        title: `${insight.title} — Manthanam`,
        description: insight.summary,
        ...(insight.sample ? { robots: { index: false, follow: false } } : {}),
    };
}

export default async function InsightPage({ params }: PageProps<"/insights/[slug]">) {
    const insight = await getInsight((await params).slug);
    if (!insight) notFound();

    return (
        <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
            <Link href="/insights" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-ink transition-colors hover:text-saffron">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                All insights
            </Link>

            <header className="mt-8">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-[0.16em]">
                    <Link href={`/insights/category/${insight.categorySlug}`} className="text-saffron hover:underline">{insight.category}</Link>
                    <span aria-hidden="true" className="text-faint">·</span>
                    <time dateTime={insight.date} className="text-faint">{formatDate(insight.date)}</time>
                    {insight.sample && (
                        <span className="ml-1 rounded-full border border-saffron/40 px-2 py-0.5 normal-case tracking-normal text-saffron">Sample</span>
                    )}
                </p>
                <h1 className="mt-5 font-serif text-4xl leading-[1.15] text-paper text-balance sm:text-5xl">{insight.title}</h1>
                <p className="mt-5 text-lg leading-relaxed text-muted-ink">{insight.summary}</p>
                <p className="mt-6 text-sm text-faint">By <span className="text-paper/90">{insight.author}</span></p>
            </header>

            <div className="mt-10 border-t border-line pt-4 text-base sm:text-lg">
                <Markdown>{insight.body}</Markdown>
            </div>
        </article>
    );
}
