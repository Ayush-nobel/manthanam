"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { EventPhoto } from "@/lib/events";

const SPAN: Record<NonNullable<EventPhoto["span"]> | "none", string> = {
    lead: "col-span-2 row-span-2",
    wide: "col-span-2",
    tall: "row-span-2",
    none: "",
};

const control =
    "inline-flex h-11 w-11 items-center justify-center text-paper transition-colors hover:text-signal-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-light";

/**
 * Photo grid (in reading order: the spans in lib/events.ts are arranged so rows fill without
 * reordering, so the grid order matches the "n of 16" order in the enlarged view); each photo opens an enlarged view in a native <dialog> (focus is trapped and
 * restored by the browser, Esc closes). ←/→ move between photos; swipe works on touch.
 */
export default function EventGallery({ photos, title }: { photos: EventPhoto[]; title: string }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [index, setIndex] = useState<number | null>(null);
    const touchX = useRef<number | null>(null);
    const count = photos.length;

    const open = (i: number) => {
        setIndex(i);
        dialogRef.current?.showModal();
    };
    const close = () => dialogRef.current?.close();
    const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + count) % count)), [count]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
        };
        const onClose = () => setIndex(null);
        dialog.addEventListener("keydown", onKey);
        dialog.addEventListener("close", onClose);
        return () => {
            dialog.removeEventListener("keydown", onKey);
            dialog.removeEventListener("close", onClose);
        };
    }, [step]);

    const current = index === null ? null : photos[index];

    return (
        <>
            <ul className="grid auto-rows-[9.5rem] grid-cols-2 gap-2 sm:auto-rows-[12rem] md:grid-cols-4 lg:auto-rows-[14rem] lg:gap-3">
                {photos.map((p, i) => (
                    <li key={i} className={SPAN[p.span ?? "none"]}>
                        <button
                            type="button"
                            onClick={() => open(i)}
                            className="group relative block h-full w-full overflow-hidden bg-paper-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                        >
                            <Image
                                src={p.src}
                                alt={p.alt}
                                fill
                                placeholder="blur"
                                sizes={p.span === "lead" || p.span === "wide" ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            />
                            <span className="sr-only">, enlarge photo {i + 1} of {count}</span>
                        </button>
                    </li>
                ))}
            </ul>

            <dialog
                ref={dialogRef}
                aria-label={`${title}: photo ${index === null ? "" : index + 1} of ${count}`}
                className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/97 p-0 text-paper backdrop:bg-ink/60"
                onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                    if (touchX.current === null) return;
                    const dx = e.changedTouches[0].clientX - touchX.current;
                    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
                    touchX.current = null;
                }}
            >
                {current && (
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between px-3 py-2 sm:px-6">
                            <p className="font-display text-sm font-semibold [font-stretch:112%]" aria-live="polite">
                                {index! + 1} of {count}
                            </p>
                            <button type="button" onClick={close} aria-label="Close" className={control} autoFocus>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <figure className="relative flex min-h-0 flex-1 flex-col px-3 sm:px-16">
                            <div className="relative min-h-0 flex-1">
                                <Image key={index} src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
                            </div>
                            <figcaption className="mx-auto max-w-[44rem] py-4 text-center text-base text-on-ink-muted">{current.alt}</figcaption>
                        </figure>
                        <div className="flex justify-center gap-4 pb-4">
                            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={control}>
                                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => step(1)} aria-label="Next photo" className={control}>
                                <ChevronRight className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}
            </dialog>
        </>
    );
}
