import type { Metadata } from "next";
import ApplicationForm from "@/components/application-form";
import Breadcrumbs from "@/components/breadcrumbs";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { PERKS } from "@/lib/application";

export const metadata: Metadata = {
    title: "Join Manthanam’s marketing team — remote internships",
    description: "Three remote internships at Manthanam: social media and content, outreach and partnerships, and PR and media. Applications are open on a rolling basis.",
    alternates: { canonical: "/join" },
};

const FACTS: [string, string][] = [
    ["Where", "Remote, from anywhere in India"],
    ["Type", "Unpaid internship"],
    ["Applications", "Open on a rolling basis"],
];

export default function JoinPage() {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-[84rem] px-6 pt-12 sm:px-10 sm:pt-16">
                    <Breadcrumbs items={[{ name: "Join the team" }]} />
                    <p className="mt-10 text-base italic text-signal">Remote internships</p>
                    <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(2.25rem,6vw,4.5rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">
                        Join Manthanam’s marketing team.
                    </h1>
                    <p className="mt-6 max-w-[40rem] text-lg text-muted-ink">
                        On 19 December we host the International Youth Summit 2026 in New Delhi. We need people who can get the country talking about it, and about
                        everything Manthanam does after it.
                    </p>
                </div>

                <section aria-labelledby="apply-title" className="mx-auto grid max-w-[84rem] gap-16 px-6 pb-24 pt-14 sm:px-10 sm:pb-32 lg:grid-cols-12 lg:gap-10">
                    <aside className="lg:col-span-4" aria-label="About the internships">
                        <div className="lg:sticky lg:top-8">
                            <dl className="grid gap-5 border-[5px] border-double border-ink bg-paper px-6 py-7">
                                {FACTS.map(([k, v]) => (
                                    <div key={k}>
                                        <dt className="text-sm text-faint">{k}</dt>
                                        <dd className="mt-0.5 font-display text-lg font-semibold text-ink [font-stretch:112%]">{v}</dd>
                                    </div>
                                ))}
                            </dl>

                            <h2 className="mt-12 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">What you get</h2>
                            <ul className="mt-4 border-t border-ink">
                                {PERKS.map((p) => (
                                    <li key={p} className="border-b border-line py-3 text-base text-ink">
                                        {p}
                                    </li>
                                ))}
                            </ul>

                            <h2 className="mt-12 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">Who we’re looking for</h2>
                            <p className="mt-3 text-base text-muted-ink">
                                You write clearly. You follow up without being chased. You’re curious about geopolitics, policy and India’s place in the world. You must be
                                18 or older.
                            </p>
                        </div>
                    </aside>

                    <div className="lg:col-span-7 lg:col-start-6">
                        <h2 id="apply-title" className="sr-only">
                            Application form
                        </h2>
                        <p className="mb-12 max-w-[36rem] text-lg text-muted-ink">
                            It takes about five minutes. Choose one role; to apply for another as well, send the form again.
                        </p>
                        <ApplicationForm />
                    </div>
                </section>
            </main>
            <SiteFooter />
        </>
    );
}
