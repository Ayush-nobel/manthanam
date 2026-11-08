import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs";
import EventGallery from "@/components/event-gallery";
import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { past, upcoming } from "@/lib/events";
import { site } from "@/lib/site";

export const metadata: Metadata = {
    title: "Events — Manthanam",
    description:
        "Manthanam's events: the BRICS India Youth Conference 2026 in New Delhi on 20 December, and photographs from Impact Stir 26, its official pre-event.",
    alternates: { canonical: "/events" },
};

const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function EventsPage() {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-[84rem] px-6 pt-12 sm:px-10 sm:pt-16">
                    <Breadcrumbs items={[{ name: "Events" }]} />
                    <h1 className="mt-10 font-display text-[clamp(2.25rem,6vw,4.5rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">
                        Events.
                    </h1>
                </div>

                {upcoming.length > 0 && (
                    <section aria-labelledby="upcoming-title" className="mx-auto max-w-[84rem] px-6 pb-20 pt-12 sm:px-10 sm:pb-24">
                        <h2 id="upcoming-title" className="sr-only">
                            Coming up
                        </h2>
                        <ul className="grid gap-6">
                            {upcoming.map((e) => (
                                <li key={e.title}>
                                    {/* Chart cartouche: the same double rule as the homepage title box. */}
                                    <article className="grid gap-6 border-[5px] border-double border-ink bg-paper px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-12 md:gap-10">
                                        <div className="md:col-span-4">
                                            <p className="text-base italic text-signal">Coming up</p>
                                            <p className="mt-2 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-[650] leading-[1.05] text-ink [font-stretch:118%]">
                                                <time dateTime={e.date}>{formatDate(e.date)}</time>
                                            </p>
                                            <p className="mt-1 text-base text-muted-ink">{e.place}</p>
                                        </div>
                                        <div className="md:col-span-7 md:col-start-6">
                                            <h3 className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-[620] leading-[1.1] text-ink [font-stretch:115%]">
                                                {e.title}
                                            </h3>
                                            <p className="mt-4 max-w-[36rem] text-lg text-muted-ink">{e.body}</p>
                                            <Link
                                                href="/register"
                                                className="mt-7 inline-flex min-h-12 items-center bg-ink px-7 py-3 font-display text-base font-semibold text-paper [font-stretch:112%] transition-colors hover:bg-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                                            >
                                                Register for the conference
                                            </Link>
                                        </div>
                                    </article>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {past.map((e) => (
                    <section key={e.slug} id={e.slug} aria-labelledby={`${e.slug}-title`} className="bg-paper-2">
                        <div className="mx-auto max-w-[84rem] px-6 py-20 sm:px-10 sm:py-28">
                            <div className="grid gap-8 lg:grid-cols-12">
                                <div className="lg:col-span-5">
                                    <p className="text-base italic text-faint">
                                        <time dateTime={e.date}>{formatDate(e.date)}</time>, {e.place}
                                    </p>
                                    <h2
                                        id={`${e.slug}-title`}
                                        className="mt-3 font-display text-[clamp(1.875rem,3.6vw,3.125rem)] font-[620] leading-[1.06] tracking-[-0.015em] text-ink [font-stretch:118%]"
                                    >
                                        {e.title}
                                    </h2>
                                    {e.theme && <p className="mt-3 text-lg italic text-ink">{e.theme}</p>}
                                </div>
                                <div className="lg:col-span-6 lg:col-start-7">
                                    <p className="max-w-[36rem] text-lg text-muted-ink">{e.body}</p>
                                    <p className="mt-4 text-sm text-faint">{e.credit}. Select a photo to enlarge it.</p>
                                </div>
                            </div>
                            <div className="mt-12 sm:mt-16">
                                <EventGallery photos={e.photos} title={e.title} />
                            </div>
                        </div>
                    </section>
                ))}
            </main>
            <SiteFooter />
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@graph": upcoming.map((e) => ({
                        "@type": "Event",
                        name: e.title,
                        startDate: e.date,
                        ...(e.previousDate ? { previousStartDate: e.previousDate, eventStatus: "https://schema.org/EventRescheduled" } : {}),
                        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
                        location: { "@type": "Place", name: e.place, address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressCountry: "IN" } },
                        organizer: { "@type": "NGO", name: site.legal.name, url: site.url },
                        description: e.body,
                    })),
                }}
            />
        </>
    );
}
