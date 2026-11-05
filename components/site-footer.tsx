import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import wordmark from "@/public/logo-wordmark.png";

const linkClass =
    "rounded-sm transition-colors hover:text-saffron focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron";

export default function SiteFooter() {
    return (
        <footer className="border-t border-line">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link href="/" className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-saffron">
                            <Image src={wordmark} alt={site.name} sizes="140px" className="h-7 w-auto" />
                        </Link>
                        <p className="mt-3 text-sm text-faint">
                            {site.tagline} · {site.location} · Est. {site.founded}
                        </p>
                    </div>
                    <nav aria-label="Footer">
                        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-ink">
                            {site.nav.map((l) => (
                                <li key={l.label}>
                                    <Link href={l.href} className={linkClass}>{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 text-sm text-faint md:flex-row md:items-start md:justify-between">
                    {/* Business details: only confirmed facts (see lib/site.ts) */}
                    <address className="not-italic">
                        <span className="text-muted-ink">{site.legal.name}</span>, {site.legal.status} · {site.legal.address} ·{" "}
                        <a href={`mailto:${site.email}`} className={`${linkClass} text-muted-ink underline underline-offset-4`}>
                            {site.email}
                        </a>
                    </address>
                    <nav aria-label="Legal">
                        <ul className="flex flex-wrap gap-x-5 gap-y-2">
                            {site.policies.map((p) => (
                                <li key={p.href}>
                                    <Link href={p.href} className={linkClass}>{p.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
