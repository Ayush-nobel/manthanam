import Link from "next/link";
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
        `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
            isActive ? "bg-saffron text-ink" : "bg-white/5 text-paper/80 ring-1 ring-white/10 hover:bg-white/10 hover:text-paper"
        }`;

    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-24">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-faint">
                <span className="text-saffron">Insights</span>
                {activeName && (
                    <>
                        <span aria-hidden="true" className="h-px w-8 bg-line" />
                        {activeName}
                    </>
                )}
            </p>
            <h1 className="mt-5 font-serif text-[clamp(2rem,8vw,3.75rem)] leading-[1.1] text-paper">
                {activeName ?? "Insights"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-ink sm:text-lg">
                Commentary, analysis, and policy writing from Manthanam on geopolitics, security, and statecraft.
            </p>

            <nav aria-label="Filter by category" className="mt-10">
                <ul className="flex flex-wrap gap-2">
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
                <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shown.map((i) => (
                        <li key={i.slug}>
                            <InsightCard insight={i} headingLevel="h2" />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mt-12 rounded-2xl border border-dashed border-line p-10 text-center">
                    <p className="font-serif text-2xl text-paper">Nothing here yet.</p>
                    <p className="mt-2 text-muted-ink">
                        {activeName ? `No ${activeName.toLowerCase()} pieces have been published yet.` : "No insights have been published yet."}{" "}
                        <Link href="/insights" className="text-saffron underline underline-offset-2">See all insights</Link>
                    </p>
                </div>
            )}
        </div>
    );
}
