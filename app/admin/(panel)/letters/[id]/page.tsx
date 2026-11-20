import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resendOfferLetter, updateLetter } from "@/app/admin/letters-actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Select, TextArea } from "@/components/admin/fields";
import { describe, NoAccess, when } from "@/components/admin/format";
import { requireAdmin } from "@/lib/auth";
import { db, type AuditRow } from "@/lib/db";
import { formatDate, KIND_LABELS, LETTER_STATUSES, LETTER_STATUS_LABELS, letterRows, verifyUrl } from "@/lib/letters/model";
import { getLetterRow, toIssued } from "@/lib/letters/store";
import { can } from "@/lib/permissions";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Offer letter" };

export default async function LetterPage({ params, searchParams }: PageProps<"/admin/letters/[id]">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "letters.manage")) return <NoAccess />;
    const row = await getLetterRow((await params).id);
    if (!row) notFound();
    const sp = await searchParams;
    const l = toIssued(row);
    const { data: history } = await db().from("audit_log").select("id, at, actor_email, action, entity, entity_id, detail").eq("entity", "offer_letter").eq("entity_id", row.id).order("at", { ascending: false }).limit(50);
    const verify = verifyUrl(site.url, row.verify_code);

    const details: [string, React.ReactNode][] = [
        ["Letter no.", <span key="r" className="font-mono text-sm">{row.reference}</span>],
        ["Kind", KIND_LABELS[row.kind]],
        ["Email", row.email],
        ...letterRows(l),
        ...(row.benefits ? [["What they’ll receive", <span key="b" className="whitespace-pre-line">{row.benefits}</span>] as [string, React.ReactNode]] : []),
        ...(row.additional_terms ? [["Extra terms", <span key="t" className="whitespace-pre-line">{row.additional_terms}</span>] as [string, React.ReactNode]] : []),
        ["Reply by", formatDate(l.respondBy)],
        ["Signed by", `${row.signatory_name}${row.signatory_title ? `, ${row.signatory_title}` : ""}`],
        ["Verification", <span key="v">Code <strong className="font-mono">{row.verify_code}</strong>. <a href={verify} target="_blank" rel="noopener" className="underline underline-offset-4">See the public check</a></span>],
        ["Emailed", row.email_sent_at ? when(row.email_sent_at) : "Not yet"],
        ...(row.application_id ? [["From application", <Link key="a" href={`/admin/applications/${row.application_id}`} className="underline underline-offset-4">Open the application</Link>] as [string, React.ReactNode]] : []),
    ];

    return (
        <>
            <p className="text-sm">
                <Link href="/admin/letters" className="underline underline-offset-4">Offer letters</Link>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <h1 className="font-display text-[1.875rem] font-[650] leading-tight [font-stretch:115%]">{row.full_name}</h1>
                <span className="border border-ink px-2 py-0.5 text-sm font-semibold">{LETTER_STATUS_LABELS[row.status]}</span>
            </div>
            <p className="mt-1 text-base text-muted-ink">{row.position}, {row.department}</p>

            {sp.sent === "1" && row.status !== "not_sent" && (
                <p role="status" className="mt-6 max-w-[65ch] border-l-4 border-ink bg-white px-4 py-3 text-base">Sent. {row.full_name} has the letter at {row.email}. When they reply, record their answer here.</p>
            )}
            {row.status === "not_sent" && (
                <p role="alert" className="mt-6 max-w-[65ch] border-l-4 border-signal bg-white px-4 py-3 text-base">
                    The letter was issued ({row.reference}) but the email didn’t go out. Use <strong>Send again</strong>, or download the PDF and send it from your mailbox.
                </p>
            )}

            <div className="mt-10 grid gap-12 lg:grid-cols-12">
                <section aria-labelledby="details" className="lg:col-span-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 id="details" className="font-display text-lg font-[650]">The letter</h2>
                        <a href={`/admin/letters/${row.id}/pdf`} className="inline-flex min-h-10 items-center border border-ink px-4 text-sm font-semibold text-ink hover:bg-paper-2">
                            Download PDF
                        </a>
                    </div>
                    <dl className="mt-3 border-t border-ink">
                        {details.map(([k, v]) => (
                            <div key={k} className="grid gap-x-6 border-b border-line py-2.5 sm:grid-cols-[11rem_1fr]">
                                <dt className="text-sm text-muted-ink">{k}</dt>
                                <dd className="text-base break-words">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <div className="grid content-start gap-10 lg:col-span-5">
                    <section aria-labelledby="answer" className="border-[5px] border-double border-ink bg-white px-6 py-6">
                        <h2 id="answer" className="font-display text-lg font-[650]">Their answer</h2>
                        <ActionForm action={updateLetter} className="mt-4 grid gap-5">
                            <input type="hidden" name="id" value={row.id} />
                            <Select label="Status" name="status" defaultValue={row.status}>
                                {LETTER_STATUSES.filter((s) => s !== "not_sent" || row.status === "not_sent").map((s) => (
                                    <option key={s} value={s}>{LETTER_STATUS_LABELS[s]}</option>
                                ))}
                            </Select>
                            <TextArea label="Notes (only admins see these)" name="notes" defaultValue={row.notes} rows={4} maxLength={5000} />
                            <div>
                                <Submit>Save</Submit>
                            </div>
                        </ActionForm>
                        <p className="mt-5 border-t border-line pt-4 text-sm text-faint">
                            They accept by replying to the email. Mark it here when they do. Withdrawn letters show as withdrawn on the public check.
                        </p>
                    </section>

                    <section aria-labelledby="resend">
                        <h2 id="resend" className="font-display text-lg font-[650]">Send again</h2>
                        <p className="mt-1 text-sm text-muted-ink">Emails the same letter (same number and code) to {row.email}.</p>
                        <ActionForm action={resendOfferLetter} className="mt-3" confirm={`Email this letter again to ${row.email}?`}>
                            <input type="hidden" name="id" value={row.id} />
                            <Submit tone="quiet">Send again</Submit>
                        </ActionForm>
                    </section>

                    <section aria-labelledby="history">
                        <h2 id="history" className="font-display text-lg font-[650]">History</h2>
                        <ol className="mt-2 border-t border-ink text-sm">
                            {((history ?? []) as AuditRow[]).map((h) => (
                                <li key={h.id} className="border-b border-line py-2.5">
                                    <span className="block text-ink">{describe(h.action, h.detail)}</span>
                                    <span className="text-faint">{when(h.at)}, {h.actor_email}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>
            </div>
        </>
    );
}
