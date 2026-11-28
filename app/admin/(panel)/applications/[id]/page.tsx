import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { issueReferralCode, replyToApplication, updateApplication } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Select, TextArea } from "@/components/admin/fields";
import { ReplyForm } from "@/components/admin/reply-form";
import { describe, NoAccess, StatusBadge, when } from "@/components/admin/format";
import { getApplication, referralStats } from "@/lib/admin-data";
import { ambassadorReward, isAmbassador, roleName, roleTitle } from "@/lib/application";
import { requireAdmin } from "@/lib/auth";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, can } from "@/lib/permissions";
import { mailConfigured, mailFrom } from "@/lib/zoho-mail";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "applications.view")) return <NoAccess />;
    const found = await getApplication((await params).id);
    if (!found) notFound();
    const { application: a, history, replies } = found;
    const canReply = can(admin.role, "applications.edit") && mailConfigured();
    const safeLink = /^https?:\/\//i.test(a.portfolio) ? a.portfolio : "";
    const amb = isAmbassador(a.role);
    const stats = amb && a.referral_code ? await referralStats(a.referral_code) : null;

    const rows: [string, React.ReactNode][] = [
        ["Role", roleName(a.role)],
        ["Email", <a key="e" href={`mailto:${a.email}?subject=${encodeURIComponent(`Your application: ${roleTitle(a.role)}`)}`} className="underline underline-offset-4">{a.email}</a>],
        ["Phone", <a key="p" href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{a.phone}</a>],
        ["College or work", a.organisation],
        ["City", a.city],
        ["Their work", safeLink ? <a key="w" href={safeLink} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-4">{safeLink}</a> : "Not given"],
        ["Applied", when(a.created_at)],
        ["Confirmation email", a.email_sent_at ? `Sent ${when(a.email_sent_at)}` : "Not sent"],
        ...(a.adult_confirmed
            ? []
            : ([
                  ["Under 18", <span key="u" className="font-semibold text-signal">Yes: parent or guardian involved</span>],
                  ["Parent or guardian", <span key="g">{a.guardian_name} (<a href={`mailto:${a.guardian_email}`} className="underline underline-offset-4">{a.guardian_email}</a>)</span>],
                  ["Guardian consent", <span key="gc" className="text-muted-ink">“{a.guardian_consent_text}”</span>],
              ] as [string, React.ReactNode][])),
        ["Consent", <span key="c" className="text-muted-ink">“{a.consent_text}”{a.adult_confirmed ? " Confirmed 18 or older." : ""} (Privacy Policy version {a.privacy_policy_version})</span>],
    ];

    return (
        <>
            <p className="text-sm">
                <Link href="/admin/applications" className="underline underline-offset-4">Applications</Link>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <h1 className="font-display text-[1.875rem] font-[650] leading-tight [font-stretch:115%]">{a.full_name}</h1>
                <StatusBadge status={a.status} kind="application" />
            </div>
            <p className="mt-1 text-base text-muted-ink">{roleTitle(a.role)}</p>
            {can(admin.role, "letters.manage") && (
                <p className="mt-4">
                    <Link href={`/admin/letters/new?application=${a.id}`} className="inline-flex min-h-10 items-center border border-ink px-4 text-sm font-semibold text-ink hover:bg-white">
                        Send offer letter
                    </Link>
                </p>
            )}

            <div className="mt-10 grid gap-12 lg:grid-cols-12">
                <div className="grid content-start gap-10 lg:col-span-7">
                    <section aria-labelledby="why">
                        <h2 id="why" className="font-display text-lg font-[650]">Why them, in their words</h2>
                        <p className="mt-2 max-w-[65ch] border-t border-ink pt-3 text-base whitespace-pre-line break-words">{a.motivation}</p>
                    </section>
                    {(replies.length > 0 || canReply) && (
                        <section aria-labelledby="replies">
                            <h2 id="replies" className="font-display text-lg font-[650]">Emails to {a.full_name}</h2>
                            <div className="mt-2 border-t border-ink pt-1">
                                {replies.map((r) => (
                                    <div key={r.id} className="mt-4 max-w-[65ch] border-l-2 border-ink pl-4">
                                        <p className="text-sm text-muted-ink">
                                            From {r.sent_by_name || r.sent_by_email} to {r.sent_to}, {when(r.created_at)}
                                        </p>
                                        <p className="mt-1 text-base whitespace-pre-line break-words">{r.body}</p>
                                    </div>
                                ))}
                                {replies.length === 0 && <p className="mt-3 text-sm text-muted-ink">None sent from here yet.</p>}
                                {canReply && <ReplyForm action={replyToApplication} id={a.id} to={a.email} from={mailFrom()} open={false} quoted="The email says which internship it’s about." />}
                            </div>
                        </section>
                    )}
                    <section aria-labelledby="details">
                        <h2 id="details" className="font-display text-lg font-[650]">Details</h2>
                        <dl className="mt-2 border-t border-ink">
                            {rows.map(([k, v]) => (
                                <div key={k} className="grid gap-x-6 border-b border-line py-2.5 sm:grid-cols-[12rem_1fr]">
                                    <dt className="text-sm text-muted-ink">{k}</dt>
                                    <dd className="text-base break-words">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>
                <div className="lg:col-span-5">
                    {amb && (
                        <section aria-labelledby="referral" className="mb-8 border border-ink bg-white px-6 py-6">
                            <h2 id="referral" className="font-display text-lg font-[650]">Referral code</h2>
                            {a.referral_code ? (
                                <>
                                    <p className="mt-2 font-mono text-2xl tracking-[0.08em] text-signal select-all">{a.referral_code}</p>
                                    <dl className="mt-4 grid gap-1 text-base">
                                        <div className="flex justify-between border-b border-line py-1.5"><dt className="text-muted-ink">Delegates who used it</dt><dd>{stats?.used ?? 0}</dd></div>
                                        <div className="flex justify-between border-b border-line py-1.5"><dt className="text-muted-ink">Of those, paid or confirmed</dt><dd className="font-semibold">{stats?.paid ?? 0}</dd></div>
                                        <div className="flex justify-between py-1.5"><dt className="text-muted-ink">Reward reached</dt><dd className="text-right">{ambassadorReward(stats?.paid ?? 0)}</dd></div>
                                    </dl>
                                    {a.referral_code_issued_at && <p className="mt-3 text-sm text-faint">Issued {when(a.referral_code_issued_at)}</p>}
                                </>
                            ) : (
                                <p className="mt-2 text-base text-muted-ink">No code yet. Issue one when you select this ambassador; it’s emailed to them straight away.</p>
                            )}
                            {can(admin.role, "applications.edit") && (
                                <ActionForm
                                    action={issueReferralCode}
                                    className="mt-4"
                                    confirm={a.referral_code ? `Email the code ${a.referral_code} to ${a.email} again?` : `Make a referral code for ${a.full_name} and email it to ${a.email}?`}
                                >
                                    <input type="hidden" name="id" value={a.id} />
                                    <Submit tone={a.referral_code ? "quiet" : "primary"}>{a.referral_code ? "Email the code again" : "Issue referral code"}</Submit>
                                </ActionForm>
                            )}
                        </section>
                    )}
                    {can(admin.role, "applications.edit") ? (
                        <section aria-labelledby="update" className="border-[5px] border-double border-ink bg-white px-6 py-6">
                            <h2 id="update" className="font-display text-lg font-[650]">Update</h2>
                            <ActionForm action={updateApplication} className="mt-4 grid gap-5">
                                <input type="hidden" name="id" value={a.id} />
                                <Select label="Status" name="status" defaultValue={a.status}>
                                    {APPLICATION_STATUSES.map((s) => (
                                        <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                                    ))}
                                </Select>
                                <TextArea label="Notes (only admins see these)" name="notes" defaultValue={a.notes} rows={5} maxLength={5000} />
                                <div>
                                    <Submit>Save</Submit>
                                </div>
                            </ActionForm>
                            <p className="mt-5 border-t border-line pt-4 text-sm text-faint">Changing the status doesn’t email the applicant. To write to them, use Reply by email under “Emails to” on this page.</p>
                        </section>
                    ) : (
                        <p className="text-base text-muted-ink">Your role can view this application but not change it.</p>
                    )}
                    <section aria-labelledby="history" className="mt-10">
                        <h2 id="history" className="font-display text-lg font-[650]">History</h2>
                        <ol className="mt-2 border-t border-ink text-sm">
                            {history.map((h) => (
                                <li key={h.id} className="border-b border-line py-2.5">
                                    <span className="block text-ink">{describe(h.action, h.detail)}</span>
                                    <span className="text-faint">{when(h.at)}, {h.actor_email === "website" ? "on the website" : h.actor_email}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>
            </div>
        </>
    );
}
