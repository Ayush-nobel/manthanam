"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
    const path = usePathname();
    return (
        <ul className="flex flex-wrap gap-x-1">
            {links.map((l) => {
                const current = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
                return (
                    <li key={l.href}>
                        <Link
                            href={l.href}
                            aria-current={current ? "page" : undefined}
                            className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                                current ? "border-signal text-ink" : "border-transparent text-muted-ink hover:text-ink"
                            }`}
                        >
                            {l.label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
