import Link from "next/link";
import { formatDate, type InsightMeta } from "@/lib/insights";

/** One entry in a list of writing: ruled above, no box. The whole entry is the link target. */
export default function InsightCard({ insight, headingLevel = "h3" }: { insight: InsightMeta; headingLevel?: "h2" | "h3" }) {
    const Heading = headingLevel;
    return (
        <article className="group relative flex h-full flex-col">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="italic text-signal">{insight.category}</span>
                <time dateTime={insight.date} className="text-faint">{formatDate(insight.date)}</time>
                {insight.sample && <span className="border border-signal/50 px-2 text-xs text-signal">Sample</span>}
            </p>
            <Heading className="mt-4 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-[620] leading-[1.12] tracking-[-0.01em] text-ink [font-stretch:112%]">
                <Link
                    href={`/insights/${insight.slug}`}
                    className="outline-none transition-colors group-hover:text-signal after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-signal"
                >
                    {insight.title}
                </Link>
            </Heading>
            <p className="mt-4 max-w-[36rem] flex-1 text-base text-muted-ink">{insight.summary}</p>
            <p className="mt-6 text-sm text-faint">By {insight.author}</p>
        </article>
    );
}
