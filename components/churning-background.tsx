"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useAnimate, useInView, useReducedMotion } from "motion/react";

/**
 * Abstract Samudra Manthan (churning of the ocean): concentric rings and spiral
 * strokes turning in opposite directions, with a saffron glow rising from the centre.
 * The centre sits in the lower right, away from the headline.
 *
 * - No line crosses the hero copy: the line layers are masked with a rectangular hole
 *   matching the [data-hero-copy] block (measured live with ResizeObserver, plus padding).
 * - Only `transform` and `opacity` animate, as full strings, so motion runs them on the
 *   compositor via WAAPI. Each rotating layer is one wrapper around a static SVG.
 * - Animations pause when the hero is off-screen or the tab is hidden.
 * - Mobile (< md) renders fewer rings/arms and one glow (CSS `max-md:hidden`).
 * - prefers-reduced-motion: nothing is started; the same artwork is shown static.
 */

const VIEW = 500; // SVG user units from centre to edge

// Concentric rings: radius, dash pattern, opacity (half of the first version).
const RINGS = [
    { r: 70, dash: "2 10", o: 0.11, saffron: true, mobile: true },
    { r: 108, dash: "60 18 4 18", o: 0.05, mobile: false },
    { r: 146, dash: "1 7", o: 0.08, mobile: true },
    { r: 186, dash: "120 30", o: 0.04, mobile: false },
    { r: 226, dash: "3 14", o: 0.07, saffron: true, mobile: true },
    { r: 268, dash: "220 40 10 40", o: 0.035, mobile: false },
    { r: 312, dash: "1 9", o: 0.06, mobile: true },
    { r: 358, dash: "300 60", o: 0.03, mobile: false },
    { r: 406, dash: "2 16", o: 0.05, saffron: true, mobile: true },
    { r: 456, dash: "400 80 20 80", o: 0.025, mobile: false },
] as const;

/** Archimedean spiral arm from r0 to r1 over `turns`, starting at angle `phase` (deg). */
function spiralPath(phase: number, r0 = 46, r1 = 470, turns = 1.15, step = 5): string {
    const total = 360 * turns;
    const pts: string[] = [];
    for (let a = 0; a <= total; a += step) {
        const t = a / total;
        const r = r0 + (r1 - r0) * t;
        const rad = ((a + phase) * Math.PI) / 180;
        pts.push(`${(r * Math.cos(rad)).toFixed(1)} ${(r * Math.sin(rad)).toFixed(1)}`);
    }
    return `M${pts.join("L")}`;
}

const ARMS = 6;
const SPIRALS = Array.from({ length: ARMS }, (_, i) => ({ d: spiralPath((360 / ARMS) * i), mobile: i % 2 === 0 }));

// Visual centre: lower right (further into the corner on phones, where the copy is wider).
const CENTRE = "left-[90%] top-[97%] md:left-[80%] md:top-[86%]";
const layer = `absolute ${CENTRE} aspect-square w-[max(130vmax,900px)] -translate-x-1/2 -translate-y-1/2 will-change-transform`;

const PAD = 28; // clear space around the copy, px
const FEATHER = 36; // soft edge of the mask, px

// Union of "outside the copy's columns" and "outside the copy's rows" = everything except the
// copy rectangle. Before the first measurement a generous default hole keeps lines off the text.
const lineMask: CSSProperties = {
    ["--ex-l" as string]: "6%",
    ["--ex-r" as string]: "94%",
    ["--ex-t" as string]: "16%",
    ["--ex-b" as string]: "88%",
    ["--feather" as string]: `${FEATHER}px`,
    maskImage:
        "linear-gradient(to right, #000 calc(var(--ex-l) - var(--feather)), transparent var(--ex-l), transparent var(--ex-r), #000 calc(var(--ex-r) + var(--feather)))," +
        "linear-gradient(to bottom, #000 calc(var(--ex-t) - var(--feather)), transparent var(--ex-t), transparent var(--ex-b), #000 calc(var(--ex-b) + var(--feather)))",
    WebkitMaskImage:
        "linear-gradient(to right, #000 calc(var(--ex-l) - var(--feather)), transparent var(--ex-l), transparent var(--ex-r), #000 calc(var(--ex-r) + var(--feather)))," +
        "linear-gradient(to bottom, #000 calc(var(--ex-t) - var(--feather)), transparent var(--ex-t), transparent var(--ex-b), #000 calc(var(--ex-b) + var(--feather)))",
    maskComposite: "add",
    WebkitMaskComposite: "source-over",
};

export default function ChurningBackground() {
    const [scope, animate] = useAnimate<HTMLDivElement>();
    const inView = useInView(scope, { amount: 0 });
    const reduce = useReducedMotion();
    const controls = useRef<{ play: () => void; pause: () => void }[]>([]);
    const linesRef = useRef<HTMLDivElement>(null);

    // Keep the mask hole on top of the hero copy at every size.
    useEffect(() => {
        const lines = linesRef.current;
        const host = scope.current?.parentElement;
        const copy = host?.querySelector<HTMLElement>("[data-hero-copy]");
        if (!lines || !host || !copy) return;
        const update = () => {
            const h = host.getBoundingClientRect();
            const c = copy.getBoundingClientRect();
            lines.style.setProperty("--ex-l", `${Math.max(0, c.left - h.left - PAD)}px`);
            lines.style.setProperty("--ex-r", `${c.right - h.left + PAD}px`);
            lines.style.setProperty("--ex-t", `${Math.max(0, c.top - h.top - PAD)}px`);
            lines.style.setProperty("--ex-b", `${c.bottom - h.top + PAD}px`);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(host);
        ro.observe(copy);
        return () => ro.disconnect();
    }, [scope]);

    // Start the loops once (unless reduced motion), and tear them down on unmount.
    useEffect(() => {
        if (reduce || !scope.current) return;
        const linear = { ease: "linear" as const, repeat: Infinity };
        const anims = [
            animate(".churn-rings", { transform: ["rotate(0deg)", "rotate(360deg)"] }, { ...linear, duration: 220 }),
            animate(".churn-spirals", { transform: ["rotate(0deg)", "rotate(-360deg)"] }, { ...linear, duration: 160 }),
        ];
        scope.current.querySelectorAll<HTMLElement>(".churn-rise").forEach((el, i) => {
            if (getComputedStyle(el).display === "none") return; // hidden on mobile
            anims.push(
                animate(
                    el,
                    {
                        transform: ["translateY(8%) scale(0.7)", "translateY(-6%) scale(1)", "translateY(-22%) scale(1.25)"],
                        opacity: [0, 0.9, 0],
                    },
                    { duration: 11, repeat: Infinity, ease: "easeInOut", delay: i * 5.5, times: [0, 0.45, 1] },
                ),
            );
        });
        controls.current = anims;
        return () => {
            anims.forEach((a) => a.cancel());
            controls.current = [];
        };
    }, [animate, reduce, scope]);

    // Pause when off-screen or when the tab is hidden.
    useEffect(() => {
        const sync = () => {
            const run = inView && document.visibilityState === "visible";
            controls.current.forEach((a) => (run ? a.play() : a.pause()));
        };
        sync();
        document.addEventListener("visibilitychange", sync);
        return () => document.removeEventListener("visibilitychange", sync);
    }, [inView]);

    return (
        <div ref={scope} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Static base glow at the churning centre — kept in the reduced-motion version */}
            <div className={`absolute ${CENTRE} aspect-square w-[min(80vmin,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_153_51/0.14),rgb(255_153_51/0.04)_55%,transparent)]`} />

            {/* Rising glows (two on desktop, one on mobile); invisible until animated */}
            {[0, 1].map((i) => (
                <div
                    key={i}
                    className={`churn-rise absolute ${CENTRE} aspect-square w-[min(60vmin,480px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_153_51/0.18),rgb(255_153_51/0.05)_60%,transparent)] opacity-0 will-change-transform ${i === 1 ? "max-md:hidden" : ""}`}
                />
            ))}

            {/* Line layers, masked so nothing crosses the hero copy */}
            <div ref={linesRef} className="absolute inset-0" style={lineMask}>
                {/* Concentric rings — clockwise */}
                <div className={`churn-rings ${layer}`}>
                    <svg viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} className="size-full" fill="none">
                        {RINGS.map((ring) => (
                            <circle
                                key={ring.r}
                                r={ring.r}
                                stroke={"saffron" in ring ? "var(--saffron)" : "var(--paper)"}
                                strokeOpacity={ring.o}
                                strokeWidth={1}
                                strokeDasharray={ring.dash}
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                className={ring.mobile ? undefined : "max-md:hidden"}
                            />
                        ))}
                    </svg>
                </div>

                {/* Spiral strokes — counter-clockwise, fading towards the rim */}
                <div className={`churn-spirals ${layer}`}>
                    <svg viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} className="size-full" fill="none">
                        <defs>
                            <radialGradient id="churn-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r={VIEW}>
                                <stop offset="0" stopColor="var(--saffron)" stopOpacity="0.19" />
                                <stop offset="0.45" stopColor="var(--saffron)" stopOpacity="0.07" />
                                <stop offset="1" stopColor="var(--saffron)" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        {SPIRALS.map((s, i) => (
                            <path
                                key={i}
                                d={s.d}
                                stroke="url(#churn-fade)"
                                strokeWidth={1.25}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                className={s.mobile ? undefined : "max-md:hidden"}
                            />
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
}
