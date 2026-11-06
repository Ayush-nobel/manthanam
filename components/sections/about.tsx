import SectionHeading from "@/components/section-heading";

// The method is a sequence, so it is numbered. Confront is the poison stage: it carries the
// same magenta as the chart's danger line in the hero.
const method = [
    {
        name: "Churn",
        body: "Every idea is tested against its strongest opposition — across disciplines, generations, and viewpoints. Nothing is exempt from scrutiny.",
    },
    {
        name: "Confront",
        body: "The churning raised poison before it raised nectar. We name hard truths first, rather than offering comfortable conclusions.",
        danger: true,
    },
    {
        name: "Distil",
        body: "What survives deliberation is refined into clear, actionable thinking for India's strategic future.",
    },
];

export default function About() {
    return (
        <section id="about" aria-labelledby="about-title">
            <div className="mx-auto max-w-[84rem] px-6 py-24 sm:px-10 sm:py-32">
                <div className="grid gap-10 lg:grid-cols-12">
                    <SectionHeading id="about-title" title="Truth emerges from the churning." className="lg:col-span-5" />
                    <div className="max-w-[38rem] space-y-6 text-lg text-muted-ink lg:col-span-6 lg:col-start-7">
                        <p className="text-ink">
                            Manthanam (<span lang="sa">मन्थनम्</span>) means churning.
                        </p>
                        <p>
                            In the Samudra Manthan, the cosmic ocean was churned with Mount Mandara as the rod and the
                            serpent Vasuki as the rope. It yielded poison before it yielded <em>amrita</em>. We take that
                            as our method: ideas must be churned against one another, hard truths faced first, and only
                            what survives carried forward.
                        </p>
                    </div>
                </div>

                <h3 className="sr-only">Our method</h3>
                <ol className="mt-20 grid gap-12 md:grid-cols-3 md:gap-10">
                    {method.map((step, i) => (
                        <li key={step.name}>
                            <div className="flex items-center gap-4">
                                <span
                                    aria-hidden="true"
                                    className={`font-display text-6xl font-[300] leading-none tabular-nums [font-stretch:125%] ${step.danger ? "text-signal" : "text-ink"}`}
                                >
                                    {i + 1}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className={`h-0 flex-1 border-t-2 ${step.danger ? "border-dashed border-signal" : "border-ink/30"}`}
                                />
                            </div>
                            <h4 className="mt-6 font-display text-2xl font-[620] text-ink [font-stretch:115%]">{step.name}</h4>
                            <p className="mt-3 max-w-[24rem] text-base text-muted-ink">{step.body}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
