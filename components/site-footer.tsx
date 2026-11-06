import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import wordmark from "@/public/logo-wordmark-ink.png";

const linkClass = "transition-colors hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export default function SiteFooter() {
    return (
        <footer className="bg-paper-2">
            <div className="mx-auto max-w-[84rem] px-6 py-14 sm:px-10">
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <Link href="/" className="inline-flex focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
                            <Image src={wordmark} alt={site.name} sizes="140px" className="h-7 w-auto" />
                        </Link>
                        <p className="mt-4 max-w-[24rem] text-base text-muted-ink">{site.tagline}.</p>
                        {/* Position of the office, as a chart would give it. */}
                        <p className="mt-2 text-sm italic text-faint">
                            {site.location}, 28°36′N 77°12′E. Established {site.founded}.
                        </p>
                    </div>
                    <nav aria-label="Footer" className="md:col-span-3 md:col-start-7">
                        <ul className="grid gap-2 font-display text-sm font-medium text-ink [font-stretch:110%]">
                            {site.nav.map((l) => (
                                <li key={l.label}>
                                    <Link href={l.href} className={linkClass}>{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <nav aria-label="Legal" className="md:col-span-3">
                        <ul className="grid gap-2 text-sm text-muted-ink">
                            {site.policies.map((p) => (
                                <li key={p.href}>
                                    <Link href={p.href} className={linkClass}>{p.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Business details: only confirmed facts (see lib/site.ts) */}
                <address className="mt-12 text-sm not-italic text-muted-ink">
                    {site.legal.name}, {site.legal.status}, {site.legal.address}.{" "}
                    <a href={`mailto:${site.email}`} className={`${linkClass} text-ink underline underline-offset-4`}>
                        {site.email}
                    </a>
                </address>
            </div>
        </footer>
    );
}
