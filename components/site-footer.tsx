import { site } from "@/lib/site";

export default function SiteFooter() {
    return (
        <footer className="border-t border-line">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="flex items-center gap-2 font-serif text-xl text-paper">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-saffron" />
                        {site.name}
                    </p>
                    <p className="mt-1 text-sm text-faint">
                        {site.tagline} · {site.location} · Est. {site.founded}
                    </p>
                </div>
                <nav aria-label="Footer">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-ink">
                        {site.nav.filter((l) => l.href !== "#").map((l) => (
                            <li key={l.label}>
                                <a href={l.href} className="transition-colors hover:text-saffron">{l.label}</a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
