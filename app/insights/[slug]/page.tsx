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
            <Link href="/insights" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-ink transition-colors hover:text-signal">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                All insights
            </Link>

            <header className="mt-8">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <Link href={`/insights/category/${insight.categorySlug}`} className="link-draw font-medium text-signal">{insight.category}</Link>
                    <time dateTime={insight.date} className="text-faint">{formatDate(insight.date)}</time>
                    {insight.sample && (
                        <span className="border border-signal/50 px-2 text-xs text-signal">Sample</span>
                    )}
                </p>
                <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-[650] leading-[1.05] tracking-[-0.015em] text-ink [font-stretch:118%] text-balance">{insight.title}</h1>
                <p className="mt-5 text-lg leading-relaxed text-muted-ink">{insight.summary}</p>
                <p className="mt-6 text-sm text-faint">By <span className="text-ink/90">{insight.author}</span></p>
            </header>

            <div className="mt-10 border-t border-ink pt-4 text-base sm:text-lg">
                <Markdown>{insight.body}</Markdown>
            </div>

            <aside aria-label="About the author" className="mt-16 grid gap-2 border-t border-ink pt-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
                <p className="text-sm text-faint">About the author</p>
                <div>
                <p className="font-display text-xl font-semibold text-ink [font-stretch:112%]">{insight.author}</p>
                {insight.authorBio && <p className="mt-2 text-base text-muted-ink">{insight.authorBio}</p>}
                </div>
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
