import type { Metadata } from "next";
import Link from "next/link";
import ApplicationForm from "@/components/application-form";
import Breadcrumbs from "@/components/breadcrumbs";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AMBASSADOR_CONDITION, AMBASSADOR_REWARDS, AMBASSADOR_ROLE } from "@/lib/application";
import { conference } from "@/lib/conference";

export const metadata: Metadata = {
    title: `Campus ambassadors — ${conference.title}`,
    description: `Apply to be a campus ambassador for the ${conference.title}: bring delegates from your college with your own referral code and earn up to a free seat.`,
    alternates: { canonical: "/register/ambassador" },
};

// What happens after applying: a real sequence, so it is numbered.
const STEPS = [
    { title: "Apply", body: "Fill in the form below. It takes about three minutes." },
    { title: "Get your code", body: "Your personal referral code appears as soon as you apply, and we email it to you too." },
    { title: "Share it", body: "Anyone who registers with your code gets 10% off their delegate fee." },
    { title: "Earn your reward", body: "Your reward grows with the delegates who register with your code and complete payment." },
];

export default function AmbassadorPage() {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-[84rem] px-6 pt-12 sm:px-10 sm:pt-16">
                    <Breadcrumbs items={[{ name: "Events", href: "/events" }, { name: "Register", href: "/register" }, { name: "Campus ambassadors" }]} />
                    <p className="mt-10 text-base italic text-signal">{conference.title}</p>
                    <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(2.25rem,6vw,4.5rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">
                        Bring your campus. Earn your seat.
                    </h1>
                    <p className="mt-6 max-w-[40rem] text-lg text-muted-ink">
                        Campus ambassadors bring delegates from their college to the conference. Coming as a delegate yourself?{" "}
                        <Link href="/register#registration-form" className="text-ink underline underline-offset-4 hover:text-signal">
                            Register here instead
                        </Link>
                        .
                    </p>
                </div>

                <section aria-labelledby="apply-title" className="mx-auto grid max-w-[84rem] gap-16 px-6 pb-24 pt-14 sm:px-10 sm:pb-32 lg:grid-cols-12 lg:gap-10">
                    <aside className="lg:col-span-4" aria-label="Campus ambassador rewards">
                        <div className="lg:sticky lg:top-8">
                            <div className="border-[5px] border-double border-ink bg-white px-6 py-6">
                                <h2 className="font-display text-lg font-[650] text-ink">Rewards</h2>
                                <ul className="mt-4 grid gap-3 text-base text-ink">
                                    {AMBASSADOR_REWARDS.map((r) => (
                                        <li key={r} className="border-t border-line pt-3">
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-sm text-faint">{AMBASSADOR_CONDITION}</p>
                            </div>
                            <ol className="mt-10 grid gap-6">
                                {STEPS.map((s, i) => (
                                    <li key={s.title} className="grid grid-cols-[2.25rem_1fr] gap-3">
                                        <span className="font-display text-xl font-[650] text-signal">{i + 1}</span>
                                        <span>
                                            <span className="block font-semibold text-ink">{s.title}</span>
                                            <span className="mt-1 block text-base text-muted-ink">{s.body}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </aside>

                    <div className="lg:col-span-7 lg:col-start-6">
                        <h2 id="apply-title" className="sr-only">
                            Campus ambassador application
                        </h2>
                        <p className="mb-12 max-w-[36rem] text-lg text-muted-ink">Everything is required unless it says optional. Under 18? You can apply with a parent or guardian’s consent.</p>
                        <ApplicationForm fixedRole={AMBASSADOR_ROLE.id} />
                    </div>
                </section>
            </main>
            <SiteFooter />
        </>
    );
}
