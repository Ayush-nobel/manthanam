import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import ObfuscatedEmailLink from "@/components/obfuscated-email-link";
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

/** Square portrait, same crop for every member; initials when there's no photo. */
function Portrait({ member, sizes }: { member: TeamMember; sizes: string }) {
    const frame = "relative aspect-square w-full overflow-hidden bg-paper-3";
    if (photoExists(member.photo)) {
        return (
            <div className={frame}>
                <Image
                    src={member.photo}
                    alt={`Portrait of ${member.name}`}
                    fill
                    sizes={sizes}
                    className="object-cover"
                    // object-position aligns the focal point of the image with the same point in the
                    // frame, so scaling from that origin zooms straight into the face.
                    style={{
                        objectPosition: member.photoFocus ?? "50% 50%",
                        ...(member.photoZoom && member.photoZoom !== 1
                            ? { transform: `scale(${member.photoZoom})`, transformOrigin: member.photoFocus ?? "50% 50%" }
                            : {}),
                    }}
                />
            </div>
        );
    }
    return (
        <div role="img" aria-label={`${member.name} (photo to be added)`} className={`${frame} flex items-center justify-center`}>
            <span aria-hidden="true" className="font-display text-7xl font-[300] text-ink/70 [font-stretch:125%]">{initials(member.name)}</span>
        </div>
    );
}

const textLink = "link-draw inline-flex min-h-11 items-center font-display text-base font-semibold text-ink [font-stretch:112%]";

function MemberLinks({ member }: { member: TeamMember }) {
    if (!member.linkedin && !member.instagram && !member.email) return null;
    return (
        <ul className="mt-6 flex flex-wrap gap-x-8" aria-label={`${member.name} — links`}>
            {member.linkedin && (
                <li>
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className={textLink}>
                        LinkedIn<span className="sr-only"> profile of {member.name} (opens in a new tab)</span>
                    </a>
                </li>
            )}
            {member.instagram && (
                <li>
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer" className={textLink}>
                        Instagram<span className="sr-only"> profile of {member.name} (opens in a new tab)</span>
                    </a>
                </li>
            )}
            {member.email && (
                <li>
                    <ObfuscatedEmailLink encoded={encodeEmail(member.email)} label={`Email ${member.name}`} className={textLink}>
                        Email
                    </ObfuscatedEmailLink>
                </li>
            )}
        </ul>
    );
}

function Member({ member }: { member: TeamMember }) {
    return (
        <article className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-start sm:gap-10 lg:grid-cols-[minmax(0,17rem)_1fr]">
            {/* Mounted like the hero's title cartouche: a double rule with a margin of paper. */}
            <div className="border-[5px] border-double border-ink bg-paper p-1.5">
                <Portrait member={member} sizes="(min-width: 1024px) 260px, (min-width: 640px) 228px, 100vw" />
            </div>
            <div className="flex flex-col">
                <h3 className="font-display text-[clamp(1.75rem,2.6vw,2.25rem)] font-[620] leading-[1.05] tracking-[-0.01em] text-ink [font-stretch:115%]">
                    {member.name}
                </h3>
                <p className="mt-2 text-base italic text-signal">{member.role}</p>
                <div className="mt-5 max-w-[40rem] space-y-4 text-base text-muted-ink">
                    {member.bio.split(/\n\s*\n/).map((para, j) => (
                        <p key={j}>{para}</p>
                    ))}
                </div>
                <MemberLinks member={member} />
            </div>
        </article>
    );
}

export default function Team() {
    return (
        <section id="team" aria-labelledby="team-title">
            <div className="mx-auto max-w-[84rem] px-6 py-24 sm:px-10 sm:py-32">
                <div className="grid gap-8 lg:grid-cols-12">
                    <SectionHeading id="team-title" title="The people doing the churning." className="lg:col-span-5" />
                    <p className="max-w-[34rem] text-lg text-muted-ink lg:col-span-6 lg:col-start-7">
                        Students and young professionals building an institution for India&rsquo;s strategic conversation.
                    </p>
                </div>

                <ul className="mt-16 grid max-w-5xl gap-14 lg:mt-20">
                    {team.map((member) => (
                        <li key={member.name}>
                            <Member member={member} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
