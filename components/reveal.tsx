"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
    children: ReactNode;
    className?: string;
    /** Stagger offset in seconds. */
    delay?: number;
}

/** Fades content up once as it scrolls into view; static for reduced-motion users. */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
    // null during SSR, so the server markup always starts hidden; once hydrated,
    // reduced-motion users get everything shown instantly instead of on scroll.
    const reduce = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 18 }}
            {...(reduce
                ? { animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
                : {
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, margin: "0px 0px -10% 0px" },
                      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
                  })}
        >
            {children}
        </motion.div>
    );
}
