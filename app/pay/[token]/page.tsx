import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import PaymentForm from "@/components/payment-form";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { conference } from "@/lib/conference";
import { db, dbConfigured } from "@/lib/db";
import { discountedFee, PAYMENT_TOKEN, todayIST } from "@/lib/payment";
import { getConference } from "@/lib/site-content";
import { site } from "@/lib/site";

// One page per registrant, read from the database on every request (like the admin pages).
export const instant = false;

export const metadata: Metadata = {
    title: `Payment — ${conference.title}`,
    // Personal pages, reached only through the link in a payment email.
    robots: { index: false, follow: false },
};

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function PayPage({ params }: PageProps<"/pay/[token]">) {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-[56rem] px-6 pt-12 pb-24 sm:px-10 sm:pt-16 sm:pb-32">
                    <p className="text-sm text-muted-ink">{conference.title}</p>
                    <Suspense fallback={<p className="mt-10 text-lg text-muted-ink">Loading your payment details…</p>}>
                        <Payment params={params} />
                    </Suspense>
                </div>
            </main>
            <SiteFooter />
        </>
    );
}

interface Registrant {
    full_name: string;
    reference: string;
    status: string;
    payment_submitted_at: string | null;
    referral_code: string | null;
}

async function Payment({ params }: { params: PageProps<"/pay/[token]">["params"] }) {
    await connection();
    const { token } = await params;
    let r: Registrant | null = null;
    let broken = false;
    if (PAYMENT_TOKEN.test(token) && dbConfigured()) {
        const { data, error } = await db().from("registrations").select("full_name, reference, status, payment_submitted_at, referral_code").eq("payment_token", token).maybeSingle<Registrant>();
        if (error) {
            console.error("Payment page lookup failed:", error.message);
            broken = true;
        }
        r = data;
    }

    if (broken) return <Notice title="This page isn’t working right now.">Please try again in a few minutes, or reply to your payment email with your screenshot attached.</Notice>;
    if (!r)
        return (
            <Notice title="This payment link isn’t valid.">
                Open the link in your payment email again, making sure you copy all of it. If it still doesn’t work, reply to that email or write to{" "}
                <a href={`mailto:${site.email}`} className="link-draw text-ink">
                    {site.email}
                </a>
                .
            </Notice>
        );
    if (r.status === "paid" || r.status === "confirmed")
        return (
            <Notice title="Your payment has been received.">
                We&rsquo;ve checked it{r.status === "confirmed" ? " and your place is confirmed" : ""}. Nothing more is needed. Your registration number is{" "}
                <span className="font-semibold text-signal">{r.reference}</span>.
            </Notice>
        );
    if (r.status === "cancelled" || r.status === "refunded")
        return (
            <Notice title="This registration has been cancelled.">
                No payment is needed. If you think this is a mistake, write to{" "}
                <a href={`mailto:${site.email}?subject=${encodeURIComponent(`Registration ${r.reference}`)}`} className="link-draw text-ink">
                    {site.email}
                </a>{" "}
                quoting {r.reference}.
            </Notice>
        );

    const c = await getConference();
    const first = r.full_name.split(/\s+/)[0];
    const single = c.fees.length === 1 ? c.fees[0] : null;

    return (
        <>
            <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.25rem,6vw,3.75rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">
                {r.payment_submitted_at ? "We have your payment details." : `Pay for your place, ${first}.`}
            </h1>
            {r.payment_submitted_at ? (
                <p className="mt-6 max-w-[40rem] text-lg text-muted-ink">
                    You sent them on {new Date(r.payment_submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}. We check every
                    payment by hand and will confirm your place by email. If you sent the wrong screenshot, upload the right one below; it replaces the first.
                </p>
            ) : (
                <p className="mt-6 max-w-[40rem] text-lg text-muted-ink">Pay using the details below, then send us the transaction ID and a screenshot of the payment with this form.</p>
            )}

            <dl className="mt-10 border-t-2 border-ink">
                <Row label="Registration number">
                    <span className="font-display font-semibold tracking-[0.04em] text-signal [font-stretch:112%]">{r.reference}</span>
                </Row>
                <Row label="Name">{r.full_name}</Row>
                {c.fees.map((f) => (
                    <Row key={f.category} label={c.fees.length === 1 ? "Fee" : f.category}>
                        <span className="font-display font-semibold tabular-nums [font-stretch:112%]">{rupees(r.referral_code && c.fees.length === 1 ? discountedFee(f.amount) : f.amount)}</span>
                        {r.referral_code && c.fees.length === 1 && <span className="block text-base text-muted-ink">10% campus ambassador discount applied</span>}
                        {f.note && <span className="block text-base text-muted-ink">{f.note}</span>}
                    </Row>
                ))}
                {c.paymentDueBy && <Row label="Pay by">{longDate(c.paymentDueBy)}</Row>}
            </dl>

            {c.paymentInstructions && (
                <section aria-labelledby="how" className="mt-10">
                    <h2 id="how" className="font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">
                        How to pay
                    </h2>
                    <div className="mt-4 border-[5px] border-double border-ink bg-white px-6 py-5 text-lg whitespace-pre-line text-ink">{c.paymentInstructions}</div>
                    <p className="mt-3 text-base text-muted-ink">
                        Add {r.reference} in the payment note if your app allows it. Manthanam will never ask for your UPI PIN, OTP or card details.
                    </p>
                    {single && r.referral_code && (
                        <p className="mt-4 border-l-[3px] border-signal bg-white px-4 py-3 text-base text-ink">
                            You registered with campus ambassador code <strong className="font-mono">{r.referral_code}</strong>, so your fee is{" "}
                            <strong>₹{discountedFee(single.amount).toLocaleString("en-IN")}</strong> (10% off ₹{single.amount.toLocaleString("en-IN")}).
                        </p>
                    )}
                    {single && !r.referral_code && (
                        <p className="mt-4 border-l-[3px] border-signal bg-white px-4 py-3 text-base text-ink">
                            Referred by a campus ambassador? Pay <strong>₹{discountedFee(single.amount).toLocaleString("en-IN")}</strong> instead of ₹
                            {single.amount.toLocaleString("en-IN")}, and enter their code in the form below.
                        </p>
                    )}
                </section>
            )}

            <div className="mt-16">
                <PaymentForm token={token} suggestedAmount={single ? (r.referral_code ? discountedFee(single.amount) : single.amount) : null}
                    discountedAmount={single ? discountedFee(single.amount) : null}
                    usualAmount={single?.amount ?? null}
                    initialReferral={r.referral_code ?? ""} resubmit={!!r.payment_submitted_at} today={todayIST()} />
            </div>
        </>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-x-6 border-b border-line py-3 sm:grid-cols-[14rem_1fr]">
            <dt className="text-base text-muted-ink">{label}</dt>
            <dd className="text-lg text-ink">{children}</dd>
        </div>
    );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <>
            <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.25rem,6vw,3.75rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">{title}</h1>
            <p className="mt-6 max-w-[40rem] text-lg text-muted-ink">{children}</p>
        </>
    );
}
