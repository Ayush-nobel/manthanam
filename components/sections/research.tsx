import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { latestResearch } from "@/lib/research";

export default function Research() {
    return (
        <section id="research" aria-labelledby="research-title" className="border-t border-line">
            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
                <Reveal>
                    <SectionHeading
                        index="03"
                        eyebrow="Latest Research"
                        id="research-title"
                        title={
                            <>
                                From the <em className="italic text-saffron">desk.</em>
                            </>
                        }
                    />
                </Reveal>

                <div className="mt-16 grid gap-6 md:grid-cols-3">
                    {latestResearch.map((item, i) => (
                        <Reveal key={item.title} delay={i * 0.08} className="h-full">
                            <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-ink-2 p-7 transition-colors duration-200 hover:border-saffron/50 focus-within:border-saffron/50">
                                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-[0.16em]">
                                    <span className="whitespace-nowrap text-saffron">{item.type}</span>
                                    <span aria-hidden="true" className="text-faint">·</span>
                                    <span className="whitespace-nowrap text-faint">{item.area}</span>
                                </p>
                                <h3 className="mt-5 font-serif text-2xl leading-snug text-paper text-balance">
                                    <a href={item.href} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-saffron">
                                        {item.title}
                                    </a>
                                </h3>
                                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-ink">{item.summary}</p>
                                <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-paper/90 transition-colors group-hover:text-saffron">
                                    Read
                                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                                </span>
                            </article>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
