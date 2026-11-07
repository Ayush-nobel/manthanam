"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import wordmark from "@/public/logo-wordmark-ink.png";

/** A rule that draws in under a nav link on hover; stays drawn for the current page. */
const navLink =
    "relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal motion-reduce:after:transition-none";

/** Masthead for every page: wordmark, a line of text links, and the one call to action. */
export default function SiteHeader() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    // The most specific matching nav item is current (Discussions beats Insights on its category page).
    const current = [...site.nav]
        .filter((l) => !l.href.includes("#") && (pathname === l.href || pathname.startsWith(`${l.href}/`)))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    return (
        <header className="relative z-10 border-b border-line">
            <div className="px-4 sm:px-7 lg:pl-[4.5rem] lg:pr-6">
                <div className="flex items-center justify-between gap-6 py-5">
                    <Link href="/" className="inline-flex focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
                        <Image src={wordmark} alt={site.name} loading="eager" sizes="160px" className="h-6 w-auto sm:h-7" />
                    </Link>

                    <nav aria-label="Primary" className="hidden lg:block">
                        <ul className="flex items-center gap-5 whitespace-nowrap xl:gap-7 font-display text-sm font-medium text-ink [font-stretch:110%]">
                            {site.nav.map((l) => (
                                <li key={l.label}>
                                    <Link href={l.href} aria-current={l.href === current ? "page" : undefined} className={navLink}>
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                            <li className="border-l border-line pl-5 xl:pl-8">
                                <Link href="/#join" className={`${navLink} font-semibold text-signal`}>
                                    Join the mission
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-controls="site-mobile-menu"
                        className="lg:hidden inline-flex min-h-11 items-center px-1 font-display text-sm font-semibold text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-signal"
                    >
                        {open ? "Close" : "Menu"}
                    </button>
                </div>

                {open && (
                    <nav id="site-mobile-menu" aria-label="Primary" className="lg:hidden pb-6">
                        <ul className="border-t border-line">
                            {site.nav.map((l) => (
                                <li key={l.label} className="border-b border-line">
                                    <Link
                                        href={l.href}
                                        onClick={() => setOpen(false)}
                                        aria-current={l.href === current ? "page" : undefined}
                                        className="block py-3.5 font-display text-2xl font-[620] text-ink [font-stretch:115%] aria-[current=page]:text-signal"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/#join" onClick={() => setOpen(false)} className="block py-3.5 font-display text-2xl font-[620] text-signal [font-stretch:115%]">
                                    Join the mission
                                </Link>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </header>
    );
}
