const paths = [
    {
        title: "Write",
        body: "Contribute research papers, policy briefs, and commentary for publication on Manthanam’s Insights.",
    },
    {
        title: "Debate",
        body: "Help shape the discussions and roundtables Manthanam plans to host, where arguments are tested, not merely aired.",
    },
    {
        title: "Build",
        body: "Help run events, outreach, and the institution itself as Manthanam grows.",
    },
];

/** Deep water: the page's one navy band, for the call to join. */
export default function Join() {
    return (
        <section id="join" aria-labelledby="join-title" className="bg-ink text-paper">
            <div className="mx-auto grid max-w-[84rem] gap-14 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-6">
                    <h2
                        id="join-title"
                        className="font-display text-[clamp(2.25rem,4.8vw,4rem)] font-[620] leading-[1.02] tracking-[-0.015em] text-paper [font-stretch:120%]"
                    >
                        Bring your mind to the churning.
                    </h2>
                    <p className="mt-8 max-w-[32rem] text-lg text-on-ink-muted">
                        Manthanam is built by students and young professionals who want to think seriously about India.
                        If you would rather shape the debate than follow it, there is a place for you here.
                    </p>
                    <a href="#contact" className="link-draw-on-ink mt-10 inline-block font-display text-lg font-semibold text-paper [font-stretch:112%]">
                        Tell us how you&rsquo;d like to help
                    </a>
                </div>

                <dl className="grid gap-10 lg:col-span-5 lg:col-start-8 lg:self-end">
                    {paths.map((path) => (
                        <div key={path.title}>
                            <dt className="font-display text-2xl font-[620] text-paper [font-stretch:115%]">{path.title}</dt>
                            <dd className="mt-2 text-base text-on-ink-muted">{path.body}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
