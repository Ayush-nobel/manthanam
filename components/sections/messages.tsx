import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import MessagesCarousel, { type MessageCard } from "@/components/messages-carousel";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { messages, type Message } from "@/lib/messages";

/**
 * Only verified messages are published. In `next dev` (NODE_ENV "development") unverified
 * ones are shown too, clearly labelled, so they can be previewed on localhost; production
 * builds never include them.
 */
const DEV_PREVIEW_UNVERIFIED = process.env.NODE_ENV === "development";

export const visibleMessages: Message[] = messages.filter((m) => m.verified || DEV_PREVIEW_UNVERIFIED);

const PHOTO_DIR = path.join(process.cwd(), "public", "messages");
const PHOTO_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** public/messages/<slug>.<any image extension>, matched case-insensitively. */
function photoFor(slug: string): string | undefined {
    if (!existsSync(PHOTO_DIR)) return undefined;
    const file = readdirSync(PHOTO_DIR).find((f) => {
        const ext = path.extname(f).toLowerCase();
        return PHOTO_EXTS.has(ext) && path.basename(f, path.extname(f)).toLowerCase() === slug.toLowerCase();
    });
    return file ? `/messages/${file}` : undefined;
}

const HONORIFICS = /^(ambassador|shri|smt\.?|dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|hon'?ble|sri)$/i;

/** "Ambassador Amarendra Khatua, IFS (Retd.)" → "AK" */
function initials(name: string): string {
    const words = name.split(",")[0].trim().split(/\s+/).filter((w) => !HONORIFICS.test(w));
    if (words.length === 0) return "?";
    return ((words[0][0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

export default function Messages({ index }: { index: string }) {
    if (visibleMessages.length === 0) return null;

    const cards: MessageCard[] = visibleMessages.map((m) => ({
        slug: m.slug,
        quote: m.quote,
        name: m.name,
        title: m.title || undefined,
        lang: m.lang ?? "en",
        photo: photoFor(m.slug),
        initials: initials(m.name),
        unverified: !m.verified,
    }));

    return (
        <section id="messages" aria-labelledby="messages-title" className="border-t border-line">
            <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
                <Reveal>
                    <SectionHeading index={index} eyebrow="Messages" id="messages-title" title="Messages of support." />
                </Reveal>
                <MessagesCarousel cards={cards} />
            </div>
        </section>
    );
}
