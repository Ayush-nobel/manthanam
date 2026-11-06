"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";

/**
 * A pinned, scroll-driven globe (in the spirit of a product "viewer"): the section sticks to
 * the screen while the reader scrolls, and the globe turns and zooms through one chapter per
 * area of work. The text is ordinary DOM, so it reads in order without the animation.
 *
 * The map is coastlines only (Natural Earth 1:110m land, public domain): no political
 * boundaries are drawn anywhere.
 */

export interface GlobeChapter {
    title: string;
    body: string;
}

type LonLat = [number, number];

interface View {
    centre: LonLat; // [lon, lat] facing the reader
    zoom: number; // 1 = the whole globe fits
}

const DELHI: LonLat = [77.21, 28.61];
const PATALIPUTRA: LonLat = [85.14, 25.61];
const INDIA_CENTRE: LonLat = [79, 22];

// One view per chapter, in order; the opening view is where the globe starts.
const OPENING: View = { centre: [30, 18], zoom: 0.95 };
const VIEWS: View[] = [
    { centre: [78, 8], zoom: 1.05 }, // Geopolitics: the Indian Ocean and the Indo-Pacific
    { centre: [80, 22], zoom: 2.1 }, // Security: the neighbourhood
    { centre: [78, 26], zoom: 3.3 }, // Statecraft: New Delhi
    { centre: [83, 24], zoom: 3.3 }, // Civilisational thought: Pataliputra
    { centre: [70, 15], zoom: 1 }, // Discourse: back out to the world
];

// Sea lanes for the Indo-Pacific chapter: Hormuz, past Sri Lanka, Malacca, South China Sea.
const SEA_LANE: LonLat[] = [
    [56.4, 26.4],
    [60, 23],
    [66, 19],
    [73, 12],
    [80.5, 5.2],
    [88, 5.8],
    [95.5, 6.2],
    [97.5, 5.3],
    [100, 3.2],
    [102.5, 1.9],
    [104.3, 1.25],
    [106, 3],
    [109, 7],
    [114, 13],
];
const SEA_LABELS: { at: LonLat; text: string }[] = [
    { at: [56.4, 26.4], text: "Strait of Hormuz" },
    { at: [100, 3.2], text: "Strait of Malacca" },
    { at: [114, 13], text: "South China Sea" },
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** View at progress p (0..1): keyframes at the opening and at each chapter's midpoint. */
function viewAt(p: number, snap: boolean): { view: View; chapter: number; weight: number[] } {
    const n = VIEWS.length;
    const chapter = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    // Overlay weights: full in the middle of a chapter, fading near its edges.
    const weight = VIEWS.map((_, i) => {
        const local = p * n - i; // 0..1 inside chapter i
        if (local < 0 || local > 1) return 0;
        return Math.min(1, Math.min(local, 1 - local) * 5);
    });
    if (snap) return { view: VIEWS[chapter], chapter, weight: VIEWS.map((_, i) => (i === chapter ? 1 : 0)) };

    const times = [0, ...VIEWS.map((_, i) => (i + 0.5) / n), 1];
    const keys = [OPENING, ...VIEWS, VIEWS[n - 1]];
    let k = 0;
    while (k < times.length - 2 && p > times[k + 1]) k++;
    const t = ease(Math.min(1, Math.max(0, (p - times[k]) / (times[k + 1] - times[k] || 1))));
    const a = keys[k];
    const b = keys[k + 1];
    return {
        view: {
            centre: [lerp(a.centre[0], b.centre[0], t), lerp(a.centre[1], b.centre[1], t)],
            zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)), // even-feeling zoom
        },
        chapter,
        weight,
    };
}

function cssVar(name: string, fallback: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export default function GlobeStory({ chapters, titleId, title }: { chapters: GlobeChapter[]; titleId: string; title: string }) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const landRef = useRef<GeoPermissibleObjects | null>(null);
    const progressRef = useRef(0);
    const drawRef = useRef<() => void>(() => {});
    const [chapter, setChapter] = useState(0);
    const reduce = useReducedMotion() ?? false;

    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

    useMotionValueEvent(scrollYProgress, "change", (p) => {
        progressRef.current = p;
        const c = Math.min(chapters.length - 1, Math.max(0, Math.floor(p * chapters.length)));
        setChapter((prev) => (prev === c ? prev : c));
        drawRef.current();
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ink = cssVar("--ink", "#10264a");
        const signal = cssVar("--signal", "#a0145c");
        const paper = cssVar("--paper", "#f5f7f6");
        const labelFont = getComputedStyle(document.body).fontFamily;
        const headFont = cssVar("--font-archivo", "sans-serif");

        let w = 0;
        let h = 0;
        let raf = 0;

        const projection = geoOrthographic().clipAngle(90).precision(0.4);
        const path = geoPath(projection, ctx);
        const graticule = geoGraticule10();

        const resize = () => {
            const r = canvas.getBoundingClientRect();
            w = Math.max(1, r.width);
            h = Math.max(1, r.height);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const render = () => {
            raf = 0;
            const { view, weight } = viewAt(progressRef.current, reduce);
            const radius = Math.min(w, h) * 0.44 * view.zoom;
            projection.scale(radius).translate([w / 2, h / 2]).rotate([-view.centre[0], -view.centre[1]]);
            const facing = (p: LonLat) => geoDistance(p, view.centre) < Math.PI / 2 - 0.05;

            ctx.clearRect(0, 0, w, h);

            // Sea, graticule, land, rim.
            ctx.beginPath();
            path({ type: "Sphere" });
            ctx.fillStyle = paper;
            ctx.fill();

            ctx.beginPath();
            path(graticule);
            ctx.strokeStyle = ink;
            ctx.globalAlpha = 0.1;
            ctx.lineWidth = 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1;

            if (landRef.current) {
                ctx.beginPath();
                path(landRef.current);
                ctx.fillStyle = ink;
                ctx.globalAlpha = 0.09;
                ctx.fill();
                ctx.globalAlpha = 0.75;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            ctx.beginPath();
            path({ type: "Sphere" });
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Overlays, in chart magenta.
            ctx.strokeStyle = signal;
            ctx.fillStyle = signal;
            const label = (at: LonLat, text: string, alpha: number, dx = 8, dy = -8, size = 13) => {
                if (!facing(at)) return;
                const xy = projection(at);
                if (!xy) return;
                ctx.globalAlpha = alpha;
                ctx.font = `600 ${size}px ${headFont}, ${labelFont}`;
                ctx.lineWidth = 4;
                ctx.strokeStyle = paper; // knock the label out of the linework
                ctx.strokeText(text, xy[0] + dx, xy[1] + dy);
                ctx.fillStyle = ink;
                ctx.fillText(text, xy[0] + dx, xy[1] + dy);
                ctx.strokeStyle = signal;
                ctx.fillStyle = signal;
            };
            const dot = (at: LonLat, alpha: number, r = 4) => {
                if (!facing(at)) return;
                const xy = projection(at);
                if (!xy) return;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(xy[0], xy[1], r, 0, Math.PI * 2);
                ctx.fill();
            };

            // 1 Geopolitics: the sea lane.
            if (weight[0] > 0) {
                ctx.globalAlpha = weight[0];
                ctx.setLineDash([7, 5]);
                ctx.lineWidth = 2;
                ctx.beginPath();
                path({ type: "LineString", coordinates: SEA_LANE });
                ctx.stroke();
                ctx.setLineDash([]);
                for (const s of SEA_LABELS) {
                    dot(s.at, weight[0], 3.5);
                    label(s.at, s.text, weight[0]);
                }
            }
            // 2 Security: a 2,000 km ring around India's neighbourhood.
            if (weight[1] > 0) {
                ctx.globalAlpha = weight[1];
                ctx.setLineDash([7, 5]);
                ctx.lineWidth = 2;
                ctx.beginPath();
                path(geoCircle().center(INDIA_CENTRE).radius(18)());
                ctx.stroke();
                ctx.setLineDash([]);
                dot(DELHI, weight[1]);
            }
            // 3 Statecraft: New Delhi.
            if (weight[2] > 0) {
                ctx.globalAlpha = weight[2];
                ctx.lineWidth = 1.5;
                for (const r of [0.6, 1.2]) {
                    ctx.beginPath();
                    path(geoCircle().center(DELHI).radius(r)());
                    ctx.stroke();
                }
                dot(DELHI, weight[2], 5);
                label(DELHI, "New Delhi", weight[2], 12, -12, 15);
            }
            // 4 Civilisational thought: Pataliputra, Kautilya's capital.
            if (weight[3] > 0) {
                dot(PATALIPUTRA, weight[3], 5);
                label(PATALIPUTRA, "Pataliputra (Patna)", weight[3], 12, -12, 15);
            }
            // 5 Discourse: rings travelling outward from New Delhi.
            if (weight[4] > 0) {
                const local = progressRef.current * VIEWS.length - 4;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 4; i++) {
                    const r = 6 + ((local * 60 + i * 18) % 72);
                    ctx.globalAlpha = weight[4] * (1 - r / 80);
                    ctx.beginPath();
                    path(geoCircle().center(DELHI).radius(r)());
                    ctx.stroke();
                }
                dot(DELHI, weight[4], 4.5);
            }
            ctx.globalAlpha = 1;
        };

        drawRef.current = () => {
            if (!raf) raf = requestAnimationFrame(render);
        };

        resize();
        render();
        const ro = new ResizeObserver(() => {
            resize();
            render();
        });
        ro.observe(canvas);

        // Fetch the coastlines when the section is about to come into view.
        let cancelled = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (!e.isIntersecting || landRef.current) return;
                io.disconnect();
                fetch("/geo/land-110m.json")
                    .then((r) => (r.ok ? r.json() : null))
                    .then((geo) => {
                        if (cancelled || !geo) return;
                        landRef.current = geo;
                        render();
                    })
                    .catch(() => {});
            },
            { rootMargin: "800px 0px" },
        );
        io.observe(canvas);

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
        };
    }, [reduce]);

    return (
        // Tall track: one screen per chapter plus the pinned screen itself.
        <div ref={sectionRef} className="relative" style={{ height: `${(chapters.length + 1) * 85}svh` }}>
            <div className="sticky top-0 grid h-svh grid-rows-[minmax(0,1fr)_auto] overflow-hidden lg:grid-cols-12 lg:grid-rows-1">
                <div className="relative order-1 min-h-0 lg:order-2 lg:col-span-7">
                    <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
                </div>

                <div className="order-2 flex flex-col justify-center px-6 pb-8 sm:px-10 lg:order-1 lg:col-span-5 lg:pb-0 lg:pl-[max(2.5rem,calc((100vw-84rem)/2+2.5rem))]">
                    <h2
                        id={titleId}
                        className="font-display text-[clamp(1.75rem,3.6vw,3.125rem)] font-[620] leading-[1.06] tracking-[-0.015em] text-ink [font-stretch:118%]"
                    >
                        {title}
                    </h2>

                    {/* Chapter marks: the content is a sequence, so its position is shown. */}
                    <ol aria-hidden="true" className="mt-6 flex gap-2 lg:mt-10">
                        {chapters.map((c, i) => (
                            <li
                                key={c.title}
                                className={`h-[3px] w-8 transition-colors duration-300 ${i === chapter ? "bg-signal" : i < chapter ? "bg-ink/60" : "bg-ink/20"}`}
                            />
                        ))}
                    </ol>

                    {/* All chapters stay in the DOM (and in reading order); only the current one is shown. */}
                    <dl className="mt-6 grid lg:mt-8">
                        {chapters.map((c, i) => (
                            <div
                                key={c.title}
                                className={`[grid-area:1/1] max-w-[30rem] ${reduce ? "" : "transition-[opacity,transform] duration-500 ease-out"} ${
                                    i === chapter ? "opacity-100" : `pointer-events-none opacity-0 ${reduce ? "" : i < chapter ? "-translate-y-3" : "translate-y-3"}`
                                }`}
                            >
                                <dt className="font-display text-[1.375rem] font-[620] leading-snug text-ink [font-stretch:112%] lg:text-2xl">{c.title}</dt>
                                <dd className="mt-3 text-base text-muted-ink lg:text-lg">{c.body}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
