import Link from "next/link";
import InsightCard from "@/components/insight-card";
import SectionHeading from "@/components/section-heading";
import { getInsights } from "@/lib/insights";

export default async function Research() {
    const latest = (await getInsights()).slice(0, 3);

    return (
        <section id="research" aria-labelledby="research-title">
            <div className="mx-auto max-w-[84rem] px-6 py-24 sm:px-10 sm:py-32">
                <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                    <SectionHeading id="research-title" title="From the desk." />
                    <Link href="/insights" className="link-draw w-fit font-display text-base font-semibold text-ink [font-stretch:112%]">
                        All insights
                    </Link>
                </div>

                {latest.length > 0 ? (
                    <ul className="mt-16 grid gap-x-12 gap-y-14 sm:mt-20 lg:grid-cols-12">
                        {latest.map((insight, i) => (
                            // The lead piece takes the wide column; the rest stack beside it.
                            <li key={insight.slug} className={i === 0 ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5"}>
                                <InsightCard insight={insight} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="mt-12 grid gap-6 lg:grid-cols-12">
                        <p className="text-[clamp(1.5rem,2.4vw,2rem)] italic leading-[1.35] text-ink lg:col-span-6">
                            The first pieces are on their way.
                        </p>
                        <p className="max-w-[30rem] text-base text-muted-ink lg:col-span-5 lg:col-start-8">
                            Commentary, analysis and policy writing on geopolitics, security and statecraft. Want to
                            write for us?{" "}
                            <a href="#join" className="link-draw text-ink">
                                Here&rsquo;s how
                            </a>
                            .
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
