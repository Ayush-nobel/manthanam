import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import Breadcrumbs from "@/components/breadcrumbs";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { formatDate, KIND_LABELS } from "@/lib/letters/model";
import { findByVerifyCode, normaliseCode } from "@/lib/letters/store";
import { clientIpFrom, rateLimiter } from "@/lib/request-guard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
    title: "Check a Manthanam letter",
    description: "Check that an offer letter from Manthanam Research Foundation is genuine, using the code printed on it.",
    alternates: { canonical: "/verify" },
    // Results are about individual people: keep them out of search engines.
    robots: { index: false, follow: false },
};

// 20 lookups per 10 minutes per connection: plenty for a person, too slow to guess codes.
const lookups = rateLimiter(20, 10 * 60_000);

export default function VerifyPage({ searchParams }: PageProps<"/verify">) {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="mx-auto max-w-[84rem] px-6 pt-12 pb-24 sm:px-10 sm:pt-16 sm:pb-32">
                    <Breadcrumbs items={[{ name: "Check a letter" }]} />
                    <h1 className="mt-10 max-w-[18ch] font-display text-[clamp(2.25rem,6vw,4rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">
                        Check a Manthanam letter.
                    </h1>
                    <p className="mt-6 max-w-[40rem] text-lg text-muted-ink">
                        Every offer letter from {site.legal.name} carries a code at the bottom, like K7PQM-3XWZA. Enter it to see the letter as we issued it.
                    </p>
                    <Suspense fallback={<CodeForm code="" />}>
                        <Result searchParams={searchParams} />
                    </Suspense>
                </div>
            </main>
            <SiteFooter />
        </>
    );
}

function CodeForm({ code }: { code: string }) {
    return (
        <form method="get" action="/verify" className="mt-10 flex max-w-xl flex-wrap items-end gap-3" role="search">
            <label className="block min-w-[14rem] flex-1">
                <span className="text-sm font-semibold text-ink">Code on the letter</span>
                <input
                    name="code"
                    defaultValue={code}
                    required
                    maxLength={20}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="K7PQM-3XWZA"
                    className="mt-1.5 block min-h-12 w-full border border-line-strong bg-white px-3 font-mono text-lg tracking-[0.08em] text-ink uppercase focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal"
                />
            </label>
            <button type="submit" className="min-h-12 bg-ink px-6 text-base font-semibold text-paper hover:bg-signal-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal">
                Check
            </button>
        </form>
    );
}

async function Result({ searchParams }: { searchParams: PageProps<"/verify">["searchParams"] }) {
    const sp = await searchParams;
    const typed = typeof sp.code === "string" ? sp.code.slice(0, 40) : "";
    if (!typed) return <CodeForm code="" />;

    const code = normaliseCode(typed);
    let outcome: "invalid" | "busy" | "missing" | "error" | Awaited<ReturnType<typeof findByVerifyCode>> = "invalid";
    if (code) {
        // The rate limit reads the clock, so this part only ever runs at request time.
        await connection();
        if (lookups(clientIpFrom(await headers()))) outcome = "busy";
        else {
            try {
                outcome = (await findByVerifyCode(code)) ?? "missing";
            } catch (err) {
                console.error("Letter check failed:", (err as Error).message);
                outcome = "error";
            }
        }
    }

    const notice = (tone: "bad" | "plain", children: React.ReactNode) => (
        <div role="status" className={`mt-8 max-w-[44rem] border-l-4 bg-white px-5 py-4 text-base ${tone === "bad" ? "border-signal" : "border-ink"}`}>
            {children}
        </div>
    );

    return (
        <>
            <CodeForm code={code ?? typed} />
            {outcome === "invalid" && notice("bad", <p>That isn’t a code we use. Codes have ten letters and numbers, like K7PQM-3XWZA.</p>)}
            {outcome === "busy" && notice("plain", <p>Too many checks from your connection. Wait a few minutes and try again.</p>)}
            {outcome === "error" && notice("plain", <p>We couldn’t check right now. Try again in a minute.</p>)}
            {outcome === "missing" &&
                notice(
                    "bad",
                    <>
                        <p className="font-semibold text-ink">No letter has this code.</p>
                        <p className="mt-2 text-muted-ink">
                            Check it was typed exactly as printed. If it was, the letter wasn’t issued by {site.legal.name}. Please tell us at{" "}
                            <a href={`mailto:${site.email}`} className="underline underline-offset-4">
                                {site.email}
                            </a>
                            .
                        </p>
                    </>,
                )}
            {typeof outcome === "object" && outcome && (
                <section aria-labelledby="genuine" className="mt-10 max-w-[44rem] border-[5px] border-double border-ink bg-white px-6 py-7 sm:px-8">
                    <p className="text-base italic text-signal">{outcome.status === "withdrawn" ? "Issued, then withdrawn" : "Genuine letter"}</p>
                    <h2 id="genuine" className="mt-2 font-display text-2xl font-[650] leading-tight text-ink [font-stretch:115%]">
                        {site.legal.name} issued this letter to {outcome.full_name}.
                    </h2>
                    {outcome.status === "withdrawn" && <p className="mt-3 text-base text-muted-ink">Manthanam has since withdrawn this offer. It is no longer valid.</p>}
                    <dl className="mt-6 border-t border-ink">
                        {(
                            [
                                ["Letter no.", outcome.reference],
                                ["Issued", formatDate(outcome.issue_date)],
                                ["Offer", `${KIND_LABELS[outcome.kind]}: ${outcome.position}`],
                                ["Department", outcome.department],
                                ["Dates", outcome.end_date ? `${formatDate(outcome.start_date)} to ${formatDate(outcome.end_date)}` : `From ${formatDate(outcome.start_date)}`],
                            ] as const
                        ).map(([k, v]) => (
                            <div key={k} className="grid gap-x-6 border-b border-line py-2.5 sm:grid-cols-[10rem_1fr]">
                                <dt className="text-sm text-muted-ink">{k}</dt>
                                <dd className="text-base font-semibold text-ink">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-5 text-sm text-faint">If anything on your copy differs from this, the copy has been altered. Please tell us at {site.email}.</p>
                </section>
            )}
        </>
    );
}
