import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";

const principles = [
    {
        name: "Churn",
        body: "Every idea is tested against its strongest opposition — across disciplines, generations, and viewpoints. Nothing is exempt from scrutiny.",
    },
    {
        name: "Confront",
        body: "The churning raised poison before it raised nectar. We name hard truths first, rather than offering comfortable conclusions.",
    },
    {
        name: "Distil",
        body: "What survives deliberation is refined into clear, actionable thinking for India's strategic future.",
    },
];

export default function About() {
    return (
        <section id="about" aria-labelledby="about-title" className="border-t border-line">
            <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 sm:py-32 lg:grid-cols-12 lg:gap-16">
                <Reveal className="lg:col-span-5">
                    <SectionHeading
                        index="01"
                        eyebrow="Our Philosophy"
                        id="about-title"
                        title="Truth emerges from the churning."
                    />
                </Reveal>

                <div className="lg:col-span-7">
                    <Reveal delay={0.1}>
                        <p className="font-serif text-2xl leading-snug text-paper/90 text-pretty sm:text-[1.75rem]">
                            Manthanam (<span lang="sa">मन्थनम्</span>) means <em className="italic">churning</em>.
                        </p>
                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-ink sm:text-lg">
                            In the Samudra Manthan, the cosmic ocean was churned with Mount Mandara as the rod and the
                            serpent Vasuki as the rope. It yielded poison before it yielded <em>amrita</em>. We take that
                            as our method: ideas must be churned against one another, hard truths faced first, and only
                            what survives carried forward.
                        </p>
                    </Reveal>

                    <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-3">
                        {principles.map((p, i) => (
                            <li key={p.name} className="bg-ink">
                                <Reveal delay={0.15 + i * 0.08} className="h-full bg-ink-2/60 p-6">
                                    <span className="text-sm tabular-nums text-saffron">0{i + 1}</span>
                                    <h3 className="mt-3 font-serif text-2xl text-paper">{p.name}</h3>
                                    <p className="mt-3 text-base text-muted-ink">{p.body}</p>
                                </Reveal>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
