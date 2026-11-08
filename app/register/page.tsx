import type { ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs";
import JsonLd from "@/components/json-ld";
import RegistrationForm from "@/components/registration-form";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { conference, FAQS } from "@/lib/conference";
import { site } from "@/lib/site";
import conferenceLogo from "@/public/events/biyc-2026-logo.png";

export const metadata: Metadata = {
    title: `Register — ${conference.title}`,
    description: `Register for the ${conference.title}, organised by Manthanam in New Delhi on 20 December 2026.`,
    alternates: { canonical: "/register" },
};

const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const TBA = "To be announced";

// The real order of events for a registrant: a sequence, so it is numbered.
const STEPS = [
    { title: "Register here", body: "Fill in the form. You get a registration number straight away, on screen and by email." },
    { title: "Payment details by email", body: "We email payment details to everyone registered by 25 November 2026. For anyone under 18, we also check with their parent or guardian." },
    { title: "Pay and you’re in", body: "Your place is confirmed once payment is received." },
];

export default function RegisterPage() {
    const facts: [string, ReactNode][] = [
        ["Date", <><time dateTime={conference.date}>{formatDate(conference.date)}</time><span className="block text-base text-muted-ink">First planned for {formatDate(conference.previousDate)}</span></>],
        ["Place", <>{conference.place}<span className="block text-base text-muted-ink">{conference.venue ?? "Venue to be announced"}</span></>],
        ["Register by", conference.deadline ? <time dateTime={conference.deadline}>{formatDate(conference.deadline)}</time> : TBA],
        ["Organised by", site.legal.name],
    ];

    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-[84rem] px-6 pt-12 sm:px-10 sm:pt-16">
                    <Breadcrumbs items={[{ name: "Events", href: "/events" }, { name: "Register" }]} />
                    <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                        <div className="order-2 lg:order-1">
                            <p className="text-base italic text-signal">{conference.registrationOpen ? "Registration is open" : "Registration is closed"}</p>
                            <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(2.25rem,6vw,4.5rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">
                                Register for the {conference.title}.
                            </h1>
                        </div>
                        <Image
                            src={conferenceLogo}
                            alt={`${conference.title} logo`}
                            priority
                            sizes="(min-width: 1024px) 15rem, 8rem"
                            className="order-1 h-auto w-32 shrink-0 sm:w-40 lg:order-2 lg:w-60"
                        />
                    </div>
                </div>

                <section aria-labelledby="register-title" className="mx-auto grid max-w-[84rem] gap-16 px-6 pb-24 pt-14 sm:px-10 sm:pb-32 lg:grid-cols-12 lg:gap-10">
                    <aside className="lg:col-span-4" aria-label="Conference details">
                        <div className="lg:sticky lg:top-8">
                            {/* Chart cartouche: the same double rule as the homepage title box. */}
                            <dl className="grid gap-5 border-[5px] border-double border-ink bg-paper px-6 py-7">
                                {facts.map(([k, v]) => (
                                    <div key={k}>
                                        <dt className="text-sm text-faint">{k}</dt>
                                        <dd className="mt-0.5 font-display text-lg font-semibold text-ink [font-stretch:112%]">{v}</dd>
                                    </div>
                                ))}
                            </dl>

                            <h2 className="mt-12 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">Fees</h2>
                            {conference.fees.length ? (
                                <table className="mt-4 w-full border-t border-ink text-left text-base">
                                    <caption className="sr-only">Registration fees</caption>
                                    <tbody>
                                        {conference.fees.map((f) => (
                                            <tr key={f.category + (f.note ?? "")} className="border-b border-line">
                                                <th scope="row" className="py-3 pr-4 font-normal text-ink">
                                                    {f.category}
                                                    {f.note && <span className="block text-sm text-faint">{f.note}</span>}
                                                </th>
                                                <td className="py-3 text-right font-display font-semibold tabular-nums text-ink [font-stretch:112%]">{rupees(f.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="mt-3 text-base text-muted-ink">
                                    To be announced. You can register now; payment details will be emailed to you by 25 November 2026.
                                </p>
                            )}
                            <p className="mt-3 text-sm text-faint">
                                Nothing is paid on this website. Refunds follow our{" "}
                                <Link href="/refunds" className="underline underline-offset-4 hover:text-signal">
                                    Refund Policy
                                </Link>
                                {conference.cancellationDeadline ? `; cancel by ${formatDate(conference.cancellationDeadline)} for a full refund.` : "."}
                            </p>

                            <h2 className="mt-12 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">How it works</h2>
                            <ol className="mt-4 grid border-t border-ink">
                                {STEPS.map((s, i) => (
                                    <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-x-3 border-b border-line py-4">
                                        <span aria-hidden="true" className="font-display text-lg font-[650] text-signal [font-stretch:120%]">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="font-display text-base font-semibold text-ink [font-stretch:112%]">{s.title}</p>
                                            <p className="mt-1 text-base text-muted-ink">{s.body}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </aside>

                    <div className="lg:col-span-7 lg:col-start-6">
                        <h2 id="register-title" className="sr-only">
                            Registration form
                        </h2>
                        {conference.registrationOpen ? (
                            <>
                                <p className="mb-12 max-w-[36rem] text-lg text-muted-ink">
                                    It takes about five minutes. Everything is required unless it says optional.
                                </p>
                                <RegistrationForm />
                            </>
                        ) : (
                            <p className="text-lg text-muted-ink">
                                Registration is closed. For questions, email{" "}
                                <a href={`mailto:${site.email}`} className="link-draw text-ink">
                                    {site.email}
                                </a>
                                .
                            </p>
                        )}
                    </div>
                </section>

                <section aria-labelledby="faq-title" className="bg-paper-2">
                    <div className="mx-auto grid max-w-[84rem] gap-10 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                            <h2 id="faq-title" className="font-display text-[clamp(1.875rem,3.6vw,3.125rem)] font-[620] leading-[1.06] tracking-[-0.015em] text-ink [font-stretch:118%]">
                                Questions.
                            </h2>
                            <p className="mt-6 max-w-[24rem] text-lg text-muted-ink">
                                Anything else: write to{" "}
                                <a href={`mailto:${site.email}?subject=${encodeURIComponent(conference.title)}`} className="link-draw text-ink">
                                    {site.email}
                                </a>
                                .
                            </p>
                        </div>
                        <div className="border-t border-ink lg:col-span-7 lg:col-start-6">
                            {FAQS.map((f) => (
                                <details key={f.q} className="group border-b border-line-strong">
                                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 font-display text-lg font-semibold text-ink [font-stretch:112%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal [&::-webkit-details-marker]:hidden">
                                        {f.q}
                                        <span aria-hidden="true" className="text-2xl font-normal leading-none text-signal transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">
                                            +
                                        </span>
                                    </summary>
                                    <p className="max-w-[38rem] pb-6 text-lg text-muted-ink">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <SiteFooter />
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
                }}
            />
        </>
    );
}
