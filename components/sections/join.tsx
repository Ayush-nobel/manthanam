import { ArrowRight, Megaphone, PenLine, Users } from "lucide-react";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";

const paths = [
    {
        title: "Write",
        body: "Contribute research papers, policy briefs, and commentary — with editorial support from peers.",
        icon: PenLine,
    },
    {
        title: "Debate",
        body: "Take part in roundtables and discussions where arguments are tested, not merely aired.",
        icon: Users,
    },
    {
        title: "Build",
        body: "Help run events, outreach, and the institution itself as Manthanam grows across India.",
        icon: Megaphone,
    },
];

export default function Join() {
    return (
        <section id="join" aria-labelledby="join-title" className="border-t border-line">
            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
                <div className="relative overflow-hidden rounded-3xl border border-line bg-ink-2 px-6 py-14 sm:px-12 sm:py-20">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-saffron/10 blur-3xl"
                    />
                    <div className="relative grid gap-12 lg:grid-cols-12 lg:gap-16">
                        <Reveal className="lg:col-span-6">
                            <SectionHeading
                                index="05"
                                eyebrow="Join the Mission"
                                id="join-title"
                                title={
"Bring your mind to the churning."
                                }
                            />
                            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-ink sm:text-lg">
                                Manthanam is built by students, young professionals, and scholars who want to think
                                seriously about India. If you would rather shape the debate than follow it, there is a
                                place for you here.
                            </p>
                            <a
                                href="#contact"
                                className="mt-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-saffron px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-saffron-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
                            >
                                Express your interest
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </Reveal>

                        <ul className="grid gap-4 lg:col-span-6">
                            {paths.map((path, i) => {
                                const Icon = path.icon;
                                return (
                                    <li key={path.title}>
                                        <Reveal delay={0.1 + i * 0.08} className="flex gap-5 rounded-2xl border border-line bg-ink/60 p-6">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-saffron/10 text-saffron">
                                                <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} />
                                            </span>
                                            <div>
                                                <h3 className="font-serif text-2xl text-paper">{path.title}</h3>
                                                <p className="mt-2 text-base text-muted-ink">{path.body}</p>
                                            </div>
                                        </Reveal>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
