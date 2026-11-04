"use client";

import { useEffect, useState, type ReactNode } from "react";

interface Props {
    /** Output of encodeEmail() from lib/obfuscate.ts. */
    encoded: string;
    label: string;
    className?: string;
    children: ReactNode;
}

/**
 * Renders a mailto: link whose address is only assembled in the browser, after hydration.
 * Before that (and without JavaScript) it renders the same-sized placeholder, not a link.
 */
export default function ObfuscatedEmailLink({ encoded, label, className, children }: Props) {
    const [href, setHref] = useState<string | null>(null);

    useEffect(() => {
        const address = [...atob(encoded)].reverse().join("");
        // Set once on mount from props; the address must never be in the server HTML.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHref(`mailto:${address}`);
    }, [encoded]);

    if (!href) {
        return (
            <span aria-hidden="true" className={`${className ?? ""} opacity-50`}>
                {children}
            </span>
        );
    }
    return (
        <a href={href} aria-label={label} title={label} className={className}>
            {children}
        </a>
    );
}
