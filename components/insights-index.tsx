import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs";
import InsightCard from "@/components/insight-card";
import { CATEGORIES, type InsightMeta } from "@/lib/insights";

interface Props {
    insights: InsightMeta[];
    /** Slug of the active category, or undefined for "All". */
    active?: string;
}

export default function InsightsIndex({ insights, active }: Props) {
    const activeName = CATEGORIES.find((c) => c.slug === active)?.name;
    const shown = active ? insights.filter((i) => i.categorySlug === active) : insights;
    const chip = (isActive: boolean) =>
        `inline-flex min-h-11 items-center border-b-2 text-base transition-colors ${
            isActive ? "border-signal font-medium text-ink" : "border-transparent text-muted-ink hover:border-ink hover:text-ink"
        }`;

    return (
        <div className="mx-auto w-full max-w-[84rem] px-6 py-16 sm:px-10 sm:py-24">
            <Breadcrumbs items={activeName ? [{ name: "Insights", href: "/insights" }, { name: activeName }] : [{ name: "Insights" }]} />
            <h1 className="mt-10 font-display text-[clamp(2.5rem,7vw,4.5rem)] font-[650] leading-[1] tracking-[-0.02em] text-ink [font-stretch:122%]">
                {activeName ?? "Insights"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-ink">
                Commentary, analysis, and policy writing from Manthanam on geopolitics, security, and statecraft.
            </p>

            <nav aria-label="Filter by category" className="mt-10">
                <ul className="flex flex-wrap gap-x-8 gap-y-1 border-b border-line">
                    <li>
                        <Link href="/insights" aria-current={!active ? "page" : undefined} className={chip(!active)}>All</Link>
                    </li>
                    {CATEGORIES.map((c) => (
                        <li key={c.slug}>
                            <Link href={`/insights/category/${c.slug}`} aria-current={active === c.slug ? "page" : undefined} className={chip(active === c.slug)}>
                                {c.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {shown.length > 0 ? (
                <ul className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
                    {shown.map((i) => (
                        <li key={i.slug}>
                            <InsightCard insight={i} headingLevel="h2" />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mt-16 border-t border-ink pt-8">
                    <p className="text-2xl italic text-ink">Nothing here yet.</p>
                    <p className="mt-2 text-muted-ink">
                        {activeName ? `No ${activeName.toLowerCase()} pieces have been published yet.` : "No insights have been published yet."}{" "}
                        <Link href="/insights" className="link-draw text-ink">See all insights</Link>
                    </p>
                </div>
            )}
        </div>
    );
}
