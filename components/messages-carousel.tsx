"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface MessageCard {
    slug: string;
    quote: string;
    name: string;
    title?: string;
    lang: "en" | "hi";
    photo?: string;
    photoFocus?: string;
    photoZoom?: number;
    initials: string;
    /** Only ever true in development previews. */
    unverified: boolean;
}

const navButton =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-paper/80 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron disabled:pointer-events-none disabled:opacity-35";

/**
 * Mobile (< md): a horizontal scroll-snap row with the next card peeking in, plus
 * previous/next buttons. md and up: a plain grid. No autoplay.
 */
export default function MessagesCarousel({ cards }: { cards: MessageCard[] }) {
    const track = useRef<HTMLUListElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(cards.length <= 1);

    const update = useCallback(() => {
        const el = track.current;
        if (!el) return;
        setAtStart(el.scrollLeft <= 4);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const el = track.current;
        if (!el) return;
        update();
        el.addEventListener("scroll", update, { passive: true });
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", update);
            ro.disconnect();
        };
    }, [update]);

    const step = (dir: 1 | -1) => {
        const el = track.current;
        const card = el?.querySelector("li");
        if (!el || !card) return;
        const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: reduce ? "auto" : "smooth" });
    };

    return (
        <div className="mt-12 md:mt-16" role="region" aria-roledescription="carousel" aria-label="Messages of support">
            <ul
                ref={track}
                id="messages-track"
                tabIndex={0}
                aria-label="Messages — scroll sideways or use the previous and next buttons"
                className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 pb-4 [scrollbar-color:var(--line)_transparent] [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-saffron md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3"
            >
                {cards.map((c, i) => (
                    <li
                        key={c.slug}
                        aria-roledescription="slide"
                        aria-label={`${i + 1} of ${cards.length}`}
                        className="w-[85%] shrink-0 snap-start md:w-auto"
                    >
                        <figure
                            className={`flex h-full flex-col rounded-2xl border bg-ink-2 p-6 sm:p-7 ${c.unverified ? "border-dashed border-saffron/50" : "border-line"}`}
                        >
                            {c.unverified && (
                                <p className="mb-4 w-fit rounded-full bg-saffron/10 px-2.5 py-1 text-xs font-medium text-saffron">
                                    Unverified · local preview only
                                </p>
                            )}
                            <blockquote
                                lang={c.lang}
                                className={`flex-1 text-paper/90 ${c.lang === "hi" ? "font-devanagari text-base leading-[1.8]" : "text-base"}`}
                            >
                                <p>{c.quote}</p>
                            </blockquote>
                            <figcaption className="mt-6 flex items-center gap-4 border-t border-line pt-5">
                                {c.photo ? (
                                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-ink-3 ring-1 ring-line">
                                        <Image
                                            src={c.photo}
                                            alt={`Portrait of ${c.name}`}
                                            fill
                                            sizes={`${Math.ceil(56 * (c.photoZoom ?? 1))}px`} // zoomed crops need proportionally more pixels
                                            className="object-cover"
                                            // object-position aligns the face with the same point in the frame;
                                            // scaling from that origin zooms straight into it.
                                            style={{
                                                objectPosition: c.photoFocus ?? "50% 50%",
                                                ...(c.photoZoom && c.photoZoom !== 1
                                                    ? { transform: `scale(${c.photoZoom})`, transformOrigin: c.photoFocus ?? "50% 50%" }
                                                    : {}),
                                            }}
                                        />
                                    </span>
                                ) : (
                                    <span
                                        role="img"
                                        aria-label={`Portrait of ${c.name}`}
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-ink-3 font-serif text-xl text-paper/80 ring-1 ring-line"
                                    >
                                        <span aria-hidden="true">{c.initials}</span>
                                    </span>
                                )}
                                <span className="min-w-0">
                                    <span className="block font-serif text-lg leading-snug text-paper">{c.name}</span>
                                    {c.title && <span className="mt-0.5 block text-sm text-muted-ink">{c.title}</span>}
                                </span>
                            </figcaption>
                        </figure>
                    </li>
                ))}
            </ul>

            {cards.length > 1 && (
                <div className="mt-4 flex justify-end gap-2 md:hidden">
                    <button type="button" onClick={() => step(-1)} disabled={atStart} aria-controls="messages-track" aria-label="Previous message" className={navButton}>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => step(1)} disabled={atEnd} aria-controls="messages-track" aria-label="Next message" className={navButton}>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
}
