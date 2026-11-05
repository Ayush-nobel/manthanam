import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
    title: "Page not found — Manthanam",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-faint">Error 404</p>
                    <h1 className="mt-5 font-serif text-[clamp(2rem,8vw,3.75rem)] leading-[1.1] text-paper">Page not found.</h1>
                    <p className="mt-6 max-w-xl text-base text-muted-ink sm:text-lg">
                        The page you were looking for doesn&rsquo;t exist or has moved. Check the address, or continue
                        from one of these:
                    </p>
                    <ul className="mt-10 flex flex-wrap gap-3">
                        <li>
                            <Link
                                href="/"
                                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-saffron px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-saffron-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
                            >
                                Go to the homepage
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/insights"
                                className="inline-flex min-h-11 items-center rounded-full bg-white/5 px-5 py-3 text-sm font-medium text-paper/90 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
                            >
                                Read Insights
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/#contact"
                                className="inline-flex min-h-11 items-center rounded-full bg-white/5 px-5 py-3 text-sm font-medium text-paper/90 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
                            >
                                Contact us
                            </Link>
                        </li>
                    </ul>
                </div>
            </main>
            <SiteFooter />
        </>
    );
}
