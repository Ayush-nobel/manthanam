import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { team, type TeamMember } from "@/lib/team";

/** Only use a photo if the file is actually in /public — otherwise show initials. */
function photoExists(photo?: string): photo is string {
    return !!photo && existsSync(path.join(process.cwd(), "public", photo));
}

function initials(name: string): string {
    const words = name.replace(/^TODO\b/i, "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    return ((words[0][0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

function Avatar({ member }: { member: TeamMember }) {
    if (photoExists(member.photo)) {
        return (
            <Image
                src={member.photo}
                alt={`Portrait of ${member.name}`}
                width={400}
                height={400}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-square w-full rounded-xl object-cover"
            />
        );
    }
    return (
        <div
            role="img"
            aria-label={member.todo ? "Photo to be added" : `${member.name} (photo to be added)`}
            className="flex aspect-square w-full items-center justify-center rounded-xl bg-[radial-gradient(circle_at_30%_25%,rgb(255_153_51/0.18),transparent_60%)] bg-ink-3 ring-1 ring-line"
        >
            <span aria-hidden="true" className="font-serif text-5xl text-paper/80">
                {initials(member.name)}
            </span>
        </div>
    );
}

export default function Team() {
    return (
        <section id="team" aria-labelledby="team-title" className="border-t border-line bg-ink-2/40">
            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
                <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
                    <Reveal className="lg:col-span-7">
                        <SectionHeading index="04" eyebrow="Team" id="team-title" title="The people doing the churning." />
                    </Reveal>
                    <Reveal delay={0.1} className="lg:col-span-5">
                        <p className="text-base leading-relaxed text-muted-ink sm:text-lg">
                            Students, researchers, and young professionals building an institution for India&rsquo;s
                            strategic conversation.
                        </p>
                    </Reveal>
                </div>

                <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {team.map((member, i) => (
                        <li key={`${member.name}-${i}`}>
                            <Reveal delay={i * 0.06} className="h-full">
                                <article
                                    className={`flex h-full flex-col rounded-2xl border bg-ink-2 p-4 ${member.todo ? "border-dashed border-saffron/40" : "border-line"}`}
                                >
                                    <Avatar member={member} />
                                    <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                                        {member.todo && (
                                            <p className="mb-3 inline-flex w-fit rounded-full bg-saffron/10 px-2.5 py-1 text-xs font-medium text-saffron">
                                                To be added
                                            </p>
                                        )}
                                        <h3 className="font-serif text-2xl text-paper">{member.name}</h3>
                                        <p className="mt-1 text-sm font-medium text-saffron">{member.role}</p>
                                        <p className="mt-3 flex-1 text-base text-muted-ink">{member.bio}</p>
                                        {member.link && (
                                            <a
                                                href={member.link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-paper/90 transition-colors hover:text-saffron"
                                            >
                                                {member.link.label}
                                                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                                                <span className="sr-only">(opens in a new tab)</span>
                                            </a>
                                        )}
                                    </div>
                                </article>
                            </Reveal>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
