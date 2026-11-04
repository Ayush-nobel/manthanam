import { BookOpen, Globe, Landmark, MessagesSquare, Shield, type LucideIcon } from "lucide-react";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";

const areas: { title: string; body: string; icon: LucideIcon }[] = [
    {
        title: "Geopolitics & Foreign Policy",
        body: "India's place in a multipolar order — from the Indo-Pacific and its neighbourhood to the Global South.",
        icon: Globe,
    },
    {
        title: "National Security & Defence",
        body: "Strategic doctrine, defence preparedness, and internal security in an age of hybrid and grey-zone threats.",
        icon: Shield,
    },
    {
        title: "Statecraft & Governance",
        body: "The craft of running the state: institutions, federalism, and the machinery that turns intent into policy.",
        icon: Landmark,
    },
    {
        title: "Civilisational Thought",
        body: "Recovering the strategic and political wisdom of India's intellectual traditions, from Kautilya to the present.",
        icon: BookOpen,
    },
    {
        title: "Policy & Public Discourse",
        body: "Turning research into briefs, debates, and public conversation that informs decisions and shapes opinion.",
        icon: MessagesSquare,
    },
];

export default function FocusAreas() {
    return (
        <section id="focus" aria-labelledby="focus-title" className="border-t border-line bg-ink-2/40">
            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
                <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
                    <Reveal className="lg:col-span-7">
                        <SectionHeading
                            index="02"
                            eyebrow="Focus Areas"
                            id="focus-title"
                            title={
                                <>
                                    Five lenses on <em className="italic text-saffron">India&rsquo;s future.</em>
                                </>
                            }
                        />
                    </Reveal>
                    <Reveal delay={0.1} className="lg:col-span-5">
                        <p className="text-base leading-relaxed text-muted-ink sm:text-lg">
                            Our work sits where geopolitics, security, and statecraft meet — and where India&rsquo;s own
                            traditions of strategic thought still have much to say.
                        </p>
                    </Reveal>
                </div>

                <ul className="mt-16 border-t border-line">
                    {areas.map((area, i) => {
                        const Icon = area.icon;
                        return (
                            <li key={area.title} className="border-b border-line">
                                <Reveal
                                    delay={i * 0.06}
                                    className="grid gap-4 py-8 sm:grid-cols-12 sm:items-baseline sm:gap-6"
                                >
                                    <span className="font-mono text-xs text-faint sm:col-span-1">0{i + 1}</span>
                                    <h3 className="flex items-center gap-3 font-serif text-2xl text-paper sm:col-span-5 sm:text-3xl">
                                        <Icon className="h-5 w-5 shrink-0 text-saffron" aria-hidden="true" strokeWidth={1.5} />
                                        {area.title}
                                    </h3>
                                    <p className="text-base leading-relaxed text-muted-ink sm:col-span-6">{area.body}</p>
                                </Reveal>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
