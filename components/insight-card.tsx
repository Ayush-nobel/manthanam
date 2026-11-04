import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDate, type InsightMeta } from "@/lib/insights";

export default function InsightCard({ insight, headingLevel = "h3" }: { insight: InsightMeta; headingLevel?: "h2" | "h3" }) {
    const Heading = headingLevel;
    return (
        <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-ink-2 p-7 transition-colors duration-200 hover:border-saffron/50 focus-within:border-saffron/50">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-[0.16em]">
                <span className="whitespace-nowrap text-saffron">{insight.category}</span>
                <span aria-hidden="true" className="text-faint">·</span>
                <time dateTime={insight.date} className="whitespace-nowrap text-faint">{formatDate(insight.date)}</time>
                {insight.sample && (
                    <span className="ml-1 rounded-full border border-saffron/40 px-2 py-0.5 normal-case tracking-normal text-saffron">Sample</span>
                )}
            </p>
            <Heading className="mt-5 font-serif text-2xl leading-snug text-paper text-balance">
                <Link href={`/insights/${insight.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-saffron">
                    {insight.title}
                </Link>
            </Heading>
            <p className="mt-4 flex-1 text-base text-muted-ink">{insight.summary}</p>
            <p className="mt-8 flex items-center justify-between gap-4 text-sm">
                <span className="text-faint">{insight.author}</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-paper/90 transition-colors group-hover:text-saffron">
                    Read
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </p>
        </article>
    );
}
