import type { ReactNode } from "react";

interface SectionHeadingProps {
    title: ReactNode;
    id?: string;
    className?: string;
}

/** Section headline: Archivo set wide, like the lettering of a chart's sea names. No kicker. */
export default function SectionHeading({ title, id, className = "" }: SectionHeadingProps) {
    return (
        <h2
            id={id}
            className={`font-display text-[clamp(1.875rem,3.6vw,3.125rem)] font-[620] leading-[1.06] tracking-[-0.015em] text-ink [font-stretch:118%] text-balance ${className}`}
        >
            {title}
        </h2>
    );
}
