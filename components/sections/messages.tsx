import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import MessagesCarousel, { type MessageCard } from "@/components/messages-carousel";
import SectionHeading from "@/components/section-heading";
import { messages, type Message } from "@/lib/messages";

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const word = (n: number) => WORDS[n] ?? String(n);

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

export default function Messages() {
    if (visibleMessages.length === 0) return null;

    // Counted from the published messages, so the sentence stays true as entries change.
    const published = messages.filter((m) => m.verified);
    const ministers = published.filter((m) => /\bminister\b/i.test(m.title ?? "")).length;
    const ambassadors = published.filter((m) => /^ambassador\b/i.test(m.name)).length;
    const parts = [
        ministers > 0 && `${word(ministers)} minister${ministers === 1 ? "" : "s"} of the Government of India`,
        ambassadors > 0 && `${word(ambassadors)} former ambassador${ambassadors === 1 ? "" : "s"}`,
    ].filter(Boolean);
    const intro =
        published.length > 1 && parts.length
            ? `${word(published.length).replace(/^./, (c) => c.toUpperCase())} messages so far, including ${parts.join(" and ")}.`
            : "";

    const cards: MessageCard[] = visibleMessages.map((m) => ({
        slug: m.slug,
        quote: m.quote,
        name: m.name,
        title: m.title || undefined,
        lang: m.lang ?? "en",
        photo: photoFor(m.slug),
        photoFocus: m.photoFocus,
        photoZoom: m.photoZoom,
        initials: initials(m.name),
        unverified: !m.verified,
    }));

    return (
        <section id="messages" aria-labelledby="messages-title" className="overflow-x-clip bg-paper-2">
            <div className="mx-auto max-w-[84rem] px-6 py-24 sm:px-10 sm:py-32">
                <div className="grid gap-8 lg:grid-cols-12">
                    <SectionHeading id="messages-title" title="Messages of support." className="lg:col-span-5" />
                    {intro && <p className="max-w-[34rem] text-lg text-muted-ink lg:col-span-6 lg:col-start-7">{intro}</p>}
                </div>
                <MessagesCarousel cards={cards} />
            </div>
        </section>
    );
}
