"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

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

const INTERVAL_MS = 8000;
const SWIPE_PX = 40;

const control =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-paper/80 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron";

/**
 * One message at a time. Slides are stacked in a single grid cell, so the panel is always
 * as tall as the longest message and never jumps; only transform and opacity animate.
 *
 * Auto-advances every 8s. Pauses on hover, keyboard focus, touch, when scrolled off-screen
 * or the tab is hidden, and via the visible pause button. Never autoplays (and never
 * animates) for prefers-reduced-motion. Arrows, dots, swipe and ←/→ keys move manually.
 */
export default function MessagesCarousel({ cards }: { cards: MessageCard[] }) {
    const count = cards.length;
    const [index, setIndex] = useState(0);
    const [dir, setDir] = useState<1 | -1>(1);
    const [userPaused, setUserPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const pointerStart = useRef<number | null>(null);

    const go = useCallback(
        (next: number, direction: 1 | -1) => {
            setDir(direction);
            setIndex(((next % count) + count) % count);
        },
        [count],
    );
    const next = useCallback(() => go(index + 1, 1), [go, index]);
    const prev = useCallback(() => go(index - 1, -1), [go, index]);

    // prefers-reduced-motion (live)
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sync = () => setReduceMotion(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    // on-screen and tab visibility
    useEffect(() => {
        const el = root.current;
        if (!el) return;
        let onScreen = false;
        const sync = () => setVisible(onScreen && document.visibilityState === "visible");
        const io = new IntersectionObserver(([e]) => {
            onScreen = e.isIntersecting;
            sync();
        }, { threshold: 0.35 });
        io.observe(el);
        document.addEventListener("visibilitychange", sync);
        return () => {
            io.disconnect();
            document.removeEventListener("visibilitychange", sync);
        };
    }, []);

    const playing = count > 1 && !reduceMotion && !userPaused && !hovered && !focused && visible;

    useEffect(() => {
        if (!playing) return;
        const t = window.setTimeout(next, INTERVAL_MS);
        return () => window.clearTimeout(t);
    }, [playing, index, next]);

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowRight") {
            e.preventDefault();
            next();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            prev();
        }
    };
    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        pointerStart.current = e.clientX;
    };
    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (pointerStart.current === null) return;
        const dx = e.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(dx) >= SWIPE_PX) (dx < 0 ? next : prev)();
    };

    const motionClass = reduceMotion ? "" : "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

    return (
        <div
            ref={root}
            role="region"
            aria-roledescription="carousel"
            aria-label="Messages of support"
            onKeyDown={onKeyDown}
            // Hover (mouse) or a finger on the panel holds the current message.
            onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onPointerDownCapture={(e) => e.pointerType !== "mouse" && setHovered(true)}
            onPointerUpCapture={(e) => e.pointerType !== "mouse" && setHovered(false)}
            onPointerCancelCapture={() => setHovered(false)}
            // Keyboard focus pauses; a mouse click on a control does not.
            onFocus={(e) => setFocused((e.target as HTMLElement).matches(":focus-visible"))}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
            className="mt-12 max-w-5xl md:mt-16"
        >
            {/* Slides: polite announcements only when the user is driving it */}
            <div
                aria-live={playing ? "off" : "polite"}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => (pointerStart.current = null)}
                className="grid touch-pan-y select-none"
            >
                {cards.map((c, i) => {
                    const active = i === index;
                    const offset = active ? "translate-x-0" : dir === 1 ? (i < index ? "-translate-x-8" : "translate-x-8") : i > index ? "translate-x-8" : "-translate-x-8";
                    return (
                        <figure
                            key={c.slug}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} of ${count}: ${c.name}`}
                            aria-hidden={!active}
                            inert={!active}
                            className={`[grid-area:1/1] grid gap-6 rounded-2xl border bg-ink-2 p-6 sm:p-8 md:grid-cols-[10rem_1fr] md:gap-10 md:p-10 ${
                                c.unverified ? "border-dashed border-saffron/50" : "border-line"
                            } ${motionClass} ${active ? "opacity-100" : `pointer-events-none opacity-0 ${reduceMotion ? "" : offset}`}`}
                        >
                            {/* Portrait: 88px beside the name on phones, 160px column on desktop */}
                            <div className="hidden md:block">
                                <Portrait c={c} size={160} />
                            </div>

                            <div className="flex min-w-0 flex-col">
                                {c.unverified && (
                                    <p className="mb-4 w-fit rounded-full bg-saffron/10 px-2.5 py-1 text-xs font-medium text-saffron">
                                        Unverified · local preview only
                                    </p>
                                )}
                                <blockquote
                                    lang={c.lang}
                                    className={`text-paper/90 ${c.lang === "hi" ? "font-devanagari text-lg leading-[1.85] sm:text-xl" : "text-lg sm:text-xl md:leading-[1.65]"}`}
                                >
                                    <p>{c.quote}</p>
                                </blockquote>
                                <figcaption className="mt-6 flex items-center gap-4 border-t border-line pt-5 md:mt-8">
                                    <span className="md:hidden">
                                        <Portrait c={c} size={88} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block font-serif text-xl leading-snug text-paper sm:text-2xl">{c.name}</span>
                                        {c.title && <span className="mt-1 block text-sm text-muted-ink sm:text-base">{c.title}</span>}
                                    </span>
                                </figcaption>
                            </div>
                        </figure>
                    );
                })}
            </div>

            {count > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-1" role="group" aria-label="Choose a message">
                        {cards.map((c, i) => (
                            <button
                                key={c.slug}
                                type="button"
                                onClick={() => go(i, i >= index ? 1 : -1)}
                                aria-label={`Show message ${i + 1}: ${c.name}`}
                                aria-current={i === index ? "true" : undefined}
                                className="group inline-flex h-11 w-7 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron rounded-full"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`block h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-saffron" : "w-1.5 bg-paper/30 group-hover:bg-paper/60"}`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {!reduceMotion && (
                            <button
                                type="button"
                                onClick={() => setUserPaused((p) => !p)}
                                aria-label={userPaused ? "Resume automatic rotation" : "Pause automatic rotation"}
                                aria-pressed={userPaused}
                                className={control}
                            >
                                {userPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                            </button>
                        )}
                        <button type="button" onClick={prev} aria-label="Previous message" className={control}>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={next} aria-label="Next message" className={control}>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Portrait({ c, size }: { c: MessageCard; size: number }) {
    const box = { width: size, height: size };
    if (!c.photo) {
        return (
            <span
                role="img"
                aria-label={`Portrait of ${c.name}`}
                style={box}
                className="flex shrink-0 items-center justify-center rounded-[18px] bg-ink-3 font-serif text-3xl text-paper/80 ring-1 ring-line"
            >
                <span aria-hidden="true">{c.initials}</span>
            </span>
        );
    }
    return (
        <span style={box} className="relative block shrink-0 overflow-hidden rounded-[18px] bg-ink-3 ring-1 ring-line">
            <Image
                src={c.photo}
                alt={`Portrait of ${c.name}`}
                fill
                sizes={`${Math.ceil(size * (c.photoZoom ?? 1))}px`}
                className="object-cover"
                // object-position aligns the face with the same point in the frame; scaling from
                // that origin zooms straight into it.
                style={{
                    objectPosition: c.photoFocus ?? "50% 50%",
                    ...(c.photoZoom && c.photoZoom !== 1
                        ? { transform: `scale(${c.photoZoom})`, transformOrigin: c.photoFocus ?? "50% 50%" }
                        : {}),
                }}
            />
        </span>
    );
}
