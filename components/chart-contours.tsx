"use client";

import { useEffect, useRef } from "react";

/**
 * Samudra Manthan drawn as a nautical chart: depth contours around a submerged peak
 * (Mount Mandara, the churning rod), slowly twisting as if the ocean were being churned.
 *
 * - A scalar "depth" field is contoured with marching squares on a coarse grid, on a canvas.
 * - Chart conventions: every fifth contour is an index contour (heavier); one contour is the
 *   magenta danger line; shallow water near the peak gets the shoal tint; soundings (depths in
 *   metres) are printed in small italics and are read from the same field.
 * - Runs at ~24 fps, only while on screen and while the tab is visible.
 * - prefers-reduced-motion: one still frame, redrawn only on resize.
 */

const STEP_DESKTOP = 9; // grid cell, CSS px
const STEP_MOBILE = 12;
const FPS = 24;
const DANGER_LEVEL = 3;

function readVar(name: string, fallback: string) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
}

export default function ChartContours({ className = "" }: { className?: string }) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ink = readVar("--ink", "#10264a");
        const signal = readVar("--signal", "#a0145c");
        const shoal = readVar("--paper-3", "#c2dae2");
        const bodyFont = getComputedStyle(document.body).fontFamily;
        // Same colour at zero alpha: hex → rgba(r, g, b, 0).
        const hex = shoal.replace("#", "");
        const shoalClear = /^[0-9a-f]{6}$/i.test(hex)
            ? `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}, 0)`
            : "rgba(194, 218, 226, 0)";
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let w = 0;
        let h = 0;
        let step = STEP_DESKTOP;
        let cols = 0;
        let rows = 0;
        let field = new Float32Array(0);
        let soundings: { x: number; y: number }[] = [];

        // Peak position and scale, in CSS px (set on resize).
        let cx = 0;
        let cy = 0;
        let scale = 1;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            w = Math.max(1, rect.width);
            h = Math.max(1, rect.height);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const narrow = w < 768;
            step = narrow ? STEP_MOBILE : STEP_DESKTOP;
            cols = Math.ceil(w / step) + 1;
            rows = Math.ceil(h / step) + 1;
            field = new Float32Array(cols * rows);
            // Peak sits right of the title on desktop, low and right on phones.
            cx = narrow ? w * 0.72 : w * 0.7;
            cy = narrow ? h * 0.8 : h * 0.5;
            scale = Math.max(w, h) / 50; // px per contour interval near the peak
            // Soundings: a loose, fixed scatter (seeded, so it never jumps between renders).
            soundings = [];
            let seed = 7;
            const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
            const n = narrow ? 14 : 34;
            for (let i = 0; i < n; i++) soundings.push({ x: rand() * w, y: rand() * h });
        };

        // Depth at (x, y) in contour units: rises with distance from the peak, twisted into
        // spiral arms that rotate with t, plus a slow swell across the whole sheet.
        const depth = (x: number, y: number, t: number) => {
            const dx = x - cx;
            const dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy) / scale;
            const a = Math.atan2(dy, dx);
            const twist = 0.9 * Math.sin(3 * a - t * 0.5 + r * 0.42) * Math.min(1, r / 3);
            const swirl = 0.45 * Math.sin(5 * a + t * 0.32 - r * 0.25) * Math.min(1, r / 6);
            const swell = 0.6 * Math.sin(x / (w * 0.18) + t * 0.15) * Math.cos(y / (h * 0.3) - t * 0.11);
            return r * 0.9 + twist + swirl + swell;
        };

        const draw = (t: number) => {
            ctx.clearRect(0, 0, w, h);

            // Shoal tint around the peak (shallow water is tinted on charts; deep water is left white).
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 4.6);
            g.addColorStop(0, shoal);
            g.addColorStop(0.6, shoal);
            g.addColorStop(1, shoalClear); // fade to the same hue, never through grey
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, scale * 4.6, 0, Math.PI * 2);
            ctx.fill();

            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) field[j * cols + i] = depth(i * step, j * step, t);
            }

            const normal = new Path2D();
            const index = new Path2D();
            const danger = new Path2D();

            for (let j = 0; j < rows - 1; j++) {
                for (let i = 0; i < cols - 1; i++) {
                    const a = field[j * cols + i];
                    const b = field[j * cols + i + 1];
                    const c = field[(j + 1) * cols + i + 1];
                    const d = field[(j + 1) * cols + i];
                    const lo = Math.min(a, b, c, d);
                    const hi = Math.max(a, b, c, d);
                    for (let level = Math.ceil(lo); level <= hi; level++) {
                        if (level < 1) continue;
                        const x0 = i * step;
                        const y0 = j * step;
                        // Edge crossings (top, right, bottom, left).
                        const pts: number[] = [];
                        const cross = (v1: number, v2: number, x1: number, y1: number, x2: number, y2: number) => {
                            if ((v1 < level) !== (v2 < level)) {
                                const k = (level - v1) / (v2 - v1);
                                pts.push(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k);
                            }
                        };
                        cross(a, b, x0, y0, x0 + step, y0);
                        cross(b, c, x0 + step, y0, x0 + step, y0 + step);
                        cross(d, c, x0, y0 + step, x0 + step, y0 + step);
                        cross(a, d, x0, y0, x0, y0 + step);
                        const path = level === DANGER_LEVEL ? danger : level % 5 === 0 ? index : normal;
                        for (let p = 0; p + 3 < pts.length; p += 4) {
                            path.moveTo(pts[p], pts[p + 1]);
                            path.lineTo(pts[p + 2], pts[p + 3]);
                        }
                    }
                }
            }

            ctx.lineCap = "round";
            ctx.strokeStyle = ink;
            ctx.globalAlpha = 0.28;
            ctx.lineWidth = 0.8;
            ctx.stroke(normal);
            ctx.globalAlpha = 0.55;
            ctx.lineWidth = 1.3;
            ctx.stroke(index);
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = signal;
            ctx.lineWidth = 1.4;
            ctx.setLineDash([7, 4]);
            ctx.stroke(danger);
            ctx.setLineDash([]);

            // Soundings, in metres, read from the field (10 m per contour interval).
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = ink;
            ctx.font = `italic 11px ${bodyFont}`;
            ctx.textAlign = "center";
            for (const s of soundings) {
                const m = Math.round(depth(s.x, s.y, t) * 10);
                if (m > 8) ctx.fillText(String(m), s.x, s.y);
            }
            ctx.globalAlpha = 1;
        };

        resize();
        let t = 0;
        draw(t);

        let raf = 0;
        let last = 0;
        let visible = true;
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            if (now - last < 1000 / FPS) return;
            const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
            last = now;
            t += dt * 0.35;
            draw(t);
        };
        const start = () => {
            if (reduce || raf || !visible || document.visibilityState !== "visible") return;
            last = 0;
            raf = requestAnimationFrame(loop);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };

        const ro = new ResizeObserver(() => {
            resize();
            draw(t);
        });
        ro.observe(canvas);
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible) start();
            else stop();
        });
        io.observe(canvas);
        const onVis = () => (document.visibilityState === "visible" ? start() : stop());
        document.addEventListener("visibilitychange", onVis);
        start();

        return () => {
            stop();
            ro.disconnect();
            io.disconnect();
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    return <canvas ref={ref} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
