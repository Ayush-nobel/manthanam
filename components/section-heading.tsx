import type { ReactNode } from "react";

interface SectionHeadingProps {
    index: string;
    eyebrow: string;
    title: ReactNode;
    id?: string;
    className?: string;
}

export default function SectionHeading({ index, eyebrow, title, id, className = "" }: SectionHeadingProps) {
    return (
        // @container: the heading also scales with its own column (cqi), so the longest
        // uppercase word fits even in narrow side-by-side layouts.
        <div className={`@container ${className}`}>
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-faint">
                <span className="text-saffron">{index}</span>
                <span aria-hidden="true" className="h-px w-8 bg-line" />
                {eyebrow}
            </p>
            <h2 id={id} className="mt-5 font-serif text-[min(clamp(1.6rem,6.2vw,2.75rem),12cqi)] leading-[1.15] text-paper text-balance">
                {title}
            </h2>
        </div>
    );
}
