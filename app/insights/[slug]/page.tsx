import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import Markdown from "@/components/markdown";
import { formatDate, getInsight, getInsights } from "@/lib/insights";
import { site } from "@/lib/site";

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
        alternates: { canonical: `/insights/${insight.slug}` },
        authors: [{ name: insight.author }],
        openGraph: { type: "article", publishedTime: insight.date, authors: [insight.author] },
        ...(insight.sample ? { robots: { index: false, follow: false } } : {}),
    };
}

export default async function InsightPage({ params }: PageProps<"/insights/[slug]">) {
    const insight = await getInsight((await params).slug);
    if (!insight) notFound();

    return (
        <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
            <Breadcrumbs
                items={[
                    { name: "Insights", href: "/insights" },
                    { name: insight.category, href: `/insights/category/${insight.categorySlug}` },
                    { name: insight.title },
                ]}
            />
            <Link href="/insights" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-ink transition-colors hover:text-saffron">
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

            <aside aria-label="About the author" className="mt-14 rounded-2xl border border-line bg-ink-2 p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-faint">About the author</p>
                <p className="mt-3 font-serif text-2xl text-paper">{insight.author}</p>
                {insight.authorBio && <p className="mt-2 text-base text-muted-ink">{insight.authorBio}</p>}
            </aside>

            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: insight.title,
                    description: insight.summary,
                    datePublished: insight.date,
                    inLanguage: "en-IN",
                    mainEntityOfPage: `${site.url}/insights/${insight.slug}`,
                    author: { "@type": "Person", name: insight.author, ...(insight.authorBio ? { description: insight.authorBio } : {}) },
                    publisher: { "@type": "NGO", name: site.legal.name, url: site.url },
                }}
            />
        </article>
    );
}
