import type { Metadata } from "next";
import Link from "next/link";
import { confirmSeats, sendPaymentRequests, verifyGuardians } from "@/app/admin/actions";
import { ActionForm, SelectAll, Submit } from "@/components/admin/action-form";
import { NoAccess, PageTitle, StatusBadge, when } from "@/components/admin/format";
import { listRegistrations, PAGE_SIZE, paymentEmailCounts } from "@/lib/admin-data";
import { getConference } from "@/lib/site-content";
import { zeptoConfigured } from "@/lib/zoho-mail";
import { requireAdmin } from "@/lib/auth";
import { can, REGISTRATION_STATUSES, REGISTRATION_STATUS_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Registrations" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function RegistrationsPage({ searchParams }: PageProps<"/admin/registrations">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "registrations.view")) return <NoAccess />;
    const sp = await searchParams;
    const f = { q: one(sp.q), status: one(sp.status), minor: one(sp.minor), payment: one(sp.payment), page: Math.max(1, Number(one(sp.page)) || 1) };
    const edit = can(admin.role, "registrations.edit");
    const [{ rows, total }, counts, conference] = await Promise.all([listRegistrations(f), paymentEmailCounts(), edit ? getConference() : null]);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const qs = (over: Record<string, string | number>) => {
        const p = new URLSearchParams(Object.entries({ ...f, ...over }).filter(([, v]) => v !== "" && v !== 1 && v !== "1").map(([k, v]) => [k, String(v)]));
        const s = p.toString();
        return s ? `?${s}` : "";
    };
    const filtered = !!(f.q || f.status || f.minor || f.payment);
    const ready = !!conference?.paymentInstructions.trim() && !!conference.fees.length;
    const batch = zeptoConfigured() ? 40 : 20;
    // Tick-and-act lists: guardians to verify, and payments to check before confirming seats.
    const bulk = !edit
        ? null
        : f.minor === "pending"
          ? {
                action: verifyGuardians,
                button: "Mark ticked as guardian verified",
                confirm: "Mark the ticked parents or guardians as verified? Only do this once you have checked each one: verified consent is a legal requirement for under-18s.",
            }
          : f.payment === "proof"
            ? {
                  action: confirmSeats,
                  button: "Confirm ticked seats and email them",
                  confirm: "Confirm the ticked seats and email each person “Your place is confirmed”? Only tick payments you have checked against the bank statement.",
              }
            : null;
    const bulkVerify = !!bulk;

    return (
        <>
            <PageTitle
                aside={
                    can(admin.role, "registrations.export") && (
                        <a href={`/admin/export/registrations${qs({ page: 1 })}`} className="inline-flex min-h-10 items-center border border-ink px-4 text-sm font-semibold text-ink hover:bg-white">
                            Download for Excel{filtered ? " (these results)" : ""}
                        </a>
                    )
                }
            >
                Registrations
            </PageTitle>

            <section aria-labelledby="payments" className="mb-8 border-[5px] border-double border-ink bg-white px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
                    <div className="max-w-[40rem]">
                        <h2 id="payments" className="font-display text-lg font-[650]">
                            Payment emails
                        </h2>
                        <p className="mt-1 text-base text-muted-ink">
                            Each email has the fee, how to pay, and a personal link to a form where the registrant uploads a screenshot of their payment.
                        </p>
                        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-base">
                            <li>
                                <Link href="/admin/registrations?payment=unsent" className="underline underline-offset-4">
                                    {counts.waiting} waiting for a payment email
                                </Link>
                            </li>
                            {counts.unverifiedMinors > 0 && (
                                <li>
                                    <Link href="/admin/registrations?minor=pending" className="underline underline-offset-4">
                                        {counts.unverifiedMinors} under 18, guardian to verify first
                                    </Link>
                                </li>
                            )}
                            <li>
                                <Link href="/admin/registrations?payment=proof" className={`underline underline-offset-4 ${counts.proofsToCheck ? "font-semibold text-signal" : ""}`}>
                                    {counts.proofsToCheck} payment{counts.proofsToCheck === 1 ? "" : "s"} to check
                                </Link>
                            </li>
                        </ul>
                    </div>
                    {edit &&
                        (ready ? (
                            counts.waiting > 0 && (
                                <ActionForm action={sendPaymentRequests} className="max-w-[22rem]" confirm={`Email payment details to the next ${Math.min(counts.waiting, batch)} registrant${counts.waiting === 1 ? "" : "s"} who haven’t had them?`}>
                                    <Submit>Send payment emails ({Math.min(counts.waiting, batch)} at a time)</Submit>
                                </ActionForm>
                            )
                        ) : (
                            <p className="max-w-[22rem] text-sm text-signal">
                                Before sending, add the payment instructions and fee in{" "}
                                <Link href="/admin/content/conference" className="underline underline-offset-4">
                                    Content → Conference
                                </Link>
                                .
                            </p>
                        ))}
                </div>
            </section>

            <form className="flex flex-wrap items-end gap-3 border-y border-line py-4" role="search">
                <label className="block min-w-[16rem] flex-1">
                    <span className="text-sm font-semibold">Search</span>
                    <input name="q" defaultValue={f.q} placeholder="Name, email, phone, number, institution, city" className="mt-1 block min-h-11 w-full border border-line-strong bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-signal" />
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Status</span>
                    <select name="status" defaultValue={f.status} className="mt-1 block min-h-11 border border-line-strong bg-white px-3 text-base">
                        <option value="">Any</option>
                        {REGISTRATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {REGISTRATION_STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Age</span>
                    <select name="minor" defaultValue={f.minor} className="mt-1 block min-h-11 border border-line-strong bg-white px-3 text-base">
                        <option value="">Anyone</option>
                        <option value="yes">Under 18</option>
                        <option value="pending">Under 18, guardian not verified</option>
                    </select>
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Payment</span>
                    <select name="payment" defaultValue={f.payment} className="mt-1 block min-h-11 border border-line-strong bg-white px-3 text-base">
                        <option value="">Any</option>
                        <option value="unsent">Payment email not sent</option>
                        <option value="proof">Proof received, to check</option>
                    </select>
                </label>
                <button type="submit" className="min-h-11 bg-ink px-5 text-sm font-semibold text-paper hover:bg-signal-deep">
                    Show
                </button>
                {filtered && (
                    <Link href="/admin/registrations" className="min-h-11 content-center px-2 text-sm underline underline-offset-4">
                        Clear
                    </Link>
                )}
            </form>

            <p className="mt-4 text-sm text-muted-ink" aria-live="polite">
                {total === 0 ? (filtered ? "No registrations match." : "No registrations yet.") : `${total} registration${total === 1 ? "" : "s"}${filtered ? " match" : ""}`}
            </p>

            {rows.length > 0 &&
                (bulkVerify ? (
                    <ActionForm action={bulk!.action} confirm={bulk!.confirm}>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border border-line bg-white px-4 py-3">
                            <SelectAll name="ids" label="Select all on this page" />
                            <Submit>{bulk!.button}</Submit>
                        </div>
                <div className="mt-3 overflow-x-auto border-t border-ink">
                    <table className="w-full min-w-[56rem] text-left text-sm">
                        <thead>
                            <tr className="border-b border-ink text-muted-ink">
                                {bulkVerify && (
                                    <th scope="col" className="w-10 py-2 pr-2">
                                        <span className="sr-only">Select</span>
                                    </th>
                                )}
                                <th scope="col" className="py-2 pr-4 font-semibold">Number</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Contact</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">From</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Registered</th>
                                <th scope="col" className="py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-line align-top hover:bg-white">
                                    {bulkVerify && (
                                        <td className="py-3 pr-2">
                                            <input type="checkbox" name="ids" value={r.id} aria-label={`Select ${r.full_name}`} className="size-5 accent-ink" />
                                        </td>
                                    )}
                                    <td className="py-3 pr-4 font-mono text-faint">{r.reference}</td>
                                    <td className="py-3 pr-4">
                                        <Link href={`/admin/registrations/${r.id}`} className="font-semibold text-ink underline-offset-4 hover:text-signal hover:underline">
                                            {r.full_name}
                                        </Link>
                                        <span className="block text-muted-ink">
                                            {r.participant_type}
                                            {r.institution && `, ${r.institution}`}
                                        </span>
                                        {r.minor && <span className="block text-xs text-signal">Under 18{r.guardian_verified_at ? ", guardian verified" : ", verify guardian"}</span>}
                                    </td>
                                    <td className="py-3 pr-4 break-all">
                                        {r.email}
                                        <span className="block text-muted-ink">{r.phone}</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {r.city}
                                        <span className="block text-muted-ink">{[r.state, r.country].filter(Boolean).join(", ")}</span>
                                    </td>
                                    <td className="py-3 pr-4 whitespace-nowrap text-muted-ink">{when(r.created_at)}</td>
                                    <td className="py-3">
                                        <StatusBadge status={r.status} />
                                        {r.payment_submitted_at ? (
                                            <span className="mt-1 block text-xs text-signal">
                                                Proof received{r.payment_amount !== null && `: ₹${r.payment_amount.toLocaleString("en-IN")}`}
                                                {r.payment_reference && <span className="block font-mono text-muted-ink">{r.payment_reference}</span>}
                                                {r.payment_proof_path && (
                                                    <a href={`/admin/payment-proof/${r.id}`} target="_blank" rel="noopener" className="text-ink underline underline-offset-2">
                                                        {r.payment_proof_type === "application/pdf" ? "Download receipt" : "View screenshot"}
                                                    </a>
                                                )}
                                            </span>
                                        ) : (
                                            r.payment_email_sent_at && <span className="mt-1 block text-xs text-muted-ink">Payment email sent</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                    </ActionForm>
                ) : (
                <div className="mt-3 overflow-x-auto border-t border-ink">
                    <table className="w-full min-w-[56rem] text-left text-sm">
                        <thead>
                            <tr className="border-b border-ink text-muted-ink">
                                {bulkVerify && (
                                    <th scope="col" className="w-10 py-2 pr-2">
                                        <span className="sr-only">Select</span>
                                    </th>
                                )}
                                <th scope="col" className="py-2 pr-4 font-semibold">Number</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Contact</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">From</th>
                                <th scope="col" className="py-2 pr-4 font-semibold">Registered</th>
                                <th scope="col" className="py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-line align-top hover:bg-white">
                                    {bulkVerify && (
                                        <td className="py-3 pr-2">
                                            <input type="checkbox" name="ids" value={r.id} aria-label={`Select ${r.full_name}`} className="size-5 accent-ink" />
                                        </td>
                                    )}
                                    <td className="py-3 pr-4 font-mono text-faint">{r.reference}</td>
                                    <td className="py-3 pr-4">
                                        <Link href={`/admin/registrations/${r.id}`} className="font-semibold text-ink underline-offset-4 hover:text-signal hover:underline">
                                            {r.full_name}
                                        </Link>
                                        <span className="block text-muted-ink">
                                            {r.participant_type}
                                            {r.institution && `, ${r.institution}`}
                                        </span>
                                        {r.minor && <span className="block text-xs text-signal">Under 18{r.guardian_verified_at ? ", guardian verified" : ", verify guardian"}</span>}
                                    </td>
                                    <td className="py-3 pr-4 break-all">
                                        {r.email}
                                        <span className="block text-muted-ink">{r.phone}</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {r.city}
                                        <span className="block text-muted-ink">{[r.state, r.country].filter(Boolean).join(", ")}</span>
                                    </td>
                                    <td className="py-3 pr-4 whitespace-nowrap text-muted-ink">{when(r.created_at)}</td>
                                    <td className="py-3">
                                        <StatusBadge status={r.status} />
                                        {r.payment_submitted_at ? (
                                            <span className="mt-1 block text-xs text-signal">
                                                Proof received{r.payment_amount !== null && `: ₹${r.payment_amount.toLocaleString("en-IN")}`}
                                                {r.payment_reference && <span className="block font-mono text-muted-ink">{r.payment_reference}</span>}
                                                {r.payment_proof_path && (
                                                    <a href={`/admin/payment-proof/${r.id}`} target="_blank" rel="noopener" className="text-ink underline underline-offset-2">
                                                        {r.payment_proof_type === "application/pdf" ? "Download receipt" : "View screenshot"}
                                                    </a>
                                                )}
                                            </span>
                                        ) : (
                                            r.payment_email_sent_at && <span className="mt-1 block text-xs text-muted-ink">Payment email sent</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                ))}

            {pages > 1 && (
                <nav aria-label="Pages" className="mt-6 flex items-center gap-4 text-sm">
                    {f.page > 1 && (
                        <Link href={`/admin/registrations${qs({ page: f.page - 1 })}`} className="underline underline-offset-4">
                            Previous
                        </Link>
                    )}
                    <span className="text-muted-ink">
                        Page {f.page} of {pages}
                    </span>
                    {f.page < pages && (
                        <Link href={`/admin/registrations${qs({ page: f.page + 1 })}`} className="underline underline-offset-4">
                            Next
                        </Link>
                    )}
                </nav>
            )}
        </>
    );
}
