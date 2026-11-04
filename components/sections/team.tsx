import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Mail } from "lucide-react";
import { InstagramIcon, LinkedInIcon } from "@/components/brand-icons";
import ObfuscatedEmailLink from "@/components/obfuscated-email-link";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { encodeEmail } from "@/lib/obfuscate";
import { team, type TeamMember } from "@/lib/team";

/** Only use a photo if the file is actually in /public — otherwise show initials. */
function photoExists(photo?: string): photo is string {
    return !!photo && existsSync(path.join(process.cwd(), "public", photo));
}

function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    return ((words[0][0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

/** Square portrait, same crop and size for every member; initials when there's no photo. */
function Avatar({ member, sizes }: { member: TeamMember; sizes: string }) {
    const frame = "relative aspect-square w-full overflow-hidden rounded-xl bg-ink-3 ring-1 ring-line";
    if (photoExists(member.photo)) {
        return (
            <div className={frame}>
                <Image
                    src={member.photo}
                    alt={`Portrait of ${member.name}`}
                    fill
                    sizes={sizes}
                    className="object-cover object-center"
                />
            </div>
        );
    }
    return (
        <div role="img" aria-label={`${member.name} (photo to be added)`} className={`${frame} flex items-center justify-center bg-[radial-gradient(circle_at_30%_25%,rgb(255_153_51/0.18),transparent_60%)]`}>
            <span aria-hidden="true" className="font-serif text-5xl text-paper/80">{initials(member.name)}</span>
        </div>
    );
}

const iconLink =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-paper/80 ring-1 ring-white/10 transition-colors hover:bg-saffron hover:text-ink hover:ring-saffron focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron";

function SocialLinks({ member }: { member: TeamMember }) {
    if (!member.linkedin && !member.instagram && !member.email) return null;
    return (
        <ul className="mt-6 flex gap-2" aria-label={`${member.name} — links`}>
            {member.linkedin && (
                <li>
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`} title={`${member.name} on LinkedIn`} className={iconLink}>
                        <LinkedInIcon className="h-4 w-4" />
                    </a>
                </li>
            )}
            {member.instagram && (
                <li>
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on Instagram`} title={`${member.name} on Instagram`} className={iconLink}>
                        <InstagramIcon className="h-4 w-4" />
                    </a>
                </li>
            )}
            {member.email && (
                <li>
                    <ObfuscatedEmailLink encoded={encodeEmail(member.email)} label={`Email ${member.name}`} className={iconLink}>
                        <Mail className="h-4 w-4" aria-hidden="true" />
                    </ObfuscatedEmailLink>
                </li>
            )}
        </ul>
    );
}

export default function Team() {
    const single = team.length === 1;

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

                <ul className={`mt-16 grid gap-6 ${single ? "max-w-4xl" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
                    {team.map((member, i) => (
                        <li key={member.name}>
                            <Reveal delay={i * 0.06} className="h-full">
                                <article
                                    className={`h-full rounded-2xl border border-line bg-ink-2 p-4 ${single ? "grid gap-6 sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-center sm:p-5" : "flex flex-col"}`}
                                >
                                    <Avatar member={member} sizes={single ? "(min-width: 640px) 272px, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"} />
                                    <div className={`flex flex-col px-2 pb-2 ${single ? "sm:py-2 sm:pr-4" : "flex-1 pt-5"}`}>
                                        <h3 className="font-serif text-2xl text-paper sm:text-3xl">{member.name}</h3>
                                        <p className="mt-1 text-sm font-medium uppercase tracking-[0.16em] text-saffron">{member.role}</p>
                                        <p className="mt-4 text-base text-muted-ink">{member.bio}</p>
                                        <SocialLinks member={member} />
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
