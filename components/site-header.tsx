"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { site } from "@/lib/site";
import wordmark from "@/public/logo-wordmark.png";

/** Header for inner pages (the homepage hero has its own). */
export default function SiteHeader() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    // The most specific matching nav item is current (Discussions beats Insights on its category page).
    const current = [...site.nav]
        .filter((l) => !l.href.includes("#") && (pathname === l.href || pathname.startsWith(`${l.href}/`)))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    const linkClass = (href: string) =>
        `${href === current ? "text-paper" : "text-paper/75"} hover:text-paper transition-colors`;

    return (
        <header className="relative z-10 border-b border-line bg-ink/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex items-center justify-between py-4">
                    <Link href="/" className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-saffron">
                        <Image src={wordmark} alt={site.name} loading="eager" sizes="160px" className="h-7 w-auto sm:h-8" />
                    </Link>

                    <nav aria-label="Primary" className="hidden lg:flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10">
                        {site.nav.map((l) => (
                            <Link key={l.label} href={l.href} aria-current={l.href === current ? "page" : undefined} className={`px-3 py-2 text-sm font-medium ${linkClass(l.href)}`}>
                                {l.label}
                            </Link>
                        ))}
                        <Link href="/#join" className="ml-1 inline-flex items-center gap-2 rounded-full bg-saffron px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-saffron-deep">
                            Join the Mission
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </nav>

                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-controls="site-mobile-menu"
                        aria-label="Toggle menu"
                        className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15"
                    >
                        {open ? <X className="h-5 w-5 text-paper" aria-hidden="true" /> : <Menu className="h-5 w-5 text-paper" aria-hidden="true" />}
                    </button>
                </div>

                {open && (
                    <nav id="site-mobile-menu" aria-label="Primary" className="lg:hidden mb-4 flex flex-col gap-1 rounded-2xl bg-ink-2 p-2 ring-1 ring-white/10">
                        {site.nav.map((l) => (
                            <Link key={l.label} href={l.href} onClick={() => setOpen(false)} aria-current={l.href === current ? "page" : undefined} className={`rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/10 ${linkClass(l.href)}`}>
                                {l.label}
                            </Link>
                        ))}
                        <Link href="/#join" onClick={() => setOpen(false)} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-saffron px-4 py-3 text-sm font-medium text-ink hover:bg-saffron-deep">
                            Join the Mission
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </nav>
                )}
            </div>
        </header>
    );
}
