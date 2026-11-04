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
        <div className={className}>
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-faint">
                <span className="text-saffron">{index}</span>
                <span aria-hidden="true" className="h-px w-8 bg-line" />
                {eyebrow}
            </p>
            <h2 id={id} className="mt-5 font-serif text-4xl leading-[1.1] tracking-tight text-paper text-balance sm:text-5xl">
                {title}
            </h2>
        </div>
    );
}
