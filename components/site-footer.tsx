import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import wordmark from "@/public/logo-wordmark.png";

export default function SiteFooter() {
    return (
        <footer className="border-t border-line">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
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
                                <Link href={l.href} className="transition-colors hover:text-saffron">{l.label}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
