import type { Metadata } from "next";
import Link from "next/link";
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
                <div className="mx-auto max-w-[84rem] px-6 py-24 sm:px-10 sm:py-36">
                    <h1 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-[650] leading-[1] tracking-[-0.02em] text-ink [font-stretch:125%]">
                        Page not found.
                    </h1>
                    <p className="mt-8 max-w-xl text-lg text-muted-ink">
                        The page you were looking for doesn&rsquo;t exist or has moved. Check the address, or continue
                        from one of these:
                    </p>
                    <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-4 font-display text-lg font-semibold text-ink [font-stretch:112%]">
                        <li>
                            <Link href="/" className="link-draw">
                                Go to the homepage
                            </Link>
                        </li>
                        <li>
                            <Link href="/insights" className="link-draw">Read Insights</Link>
                        </li>
                        <li>
                            <Link href="/#contact" className="link-draw">Contact us</Link>
                        </li>
                    </ul>
                </div>
            </main>
            <SiteFooter />
        </>
    );
}
