import Link from "next/link";
import { ArrowRight } from "lucide-react";
import InsightCard from "@/components/insight-card";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { getInsights } from "@/lib/insights";

export default async function Research() {
    const latest = (await getInsights()).slice(0, 3);

    return (
        <section id="research" aria-labelledby="research-title" className="border-t border-line">
            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <Reveal>
                        <SectionHeading index="03" eyebrow="Latest Research" id="research-title" title="From the desk." />
                    </Reveal>
                    <Reveal delay={0.1}>
                        <Link href="/insights" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-5 py-3 text-sm font-medium text-paper/90 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-paper">
                            All insights
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </Reveal>
                </div>

                {latest.length > 0 ? (
                    <ul className="mt-16 grid gap-6 md:grid-cols-3">
                        {latest.map((insight, i) => (
                            <li key={insight.slug}>
                                <Reveal delay={i * 0.08} className="h-full">
                                    <InsightCard insight={insight} />
                                </Reveal>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-16 text-muted-ink">The first pieces are on their way.</p>
                )}
            </div>
        </section>
    );
}
