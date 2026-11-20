import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { replyToApplication, updateApplication } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Select, TextArea } from "@/components/admin/fields";
import { ReplyForm } from "@/components/admin/reply-form";
import { describe, NoAccess, StatusBadge, when } from "@/components/admin/format";
import { getApplication } from "@/lib/admin-data";
import { roleName } from "@/lib/application";
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

    const rows: [string, React.ReactNode][] = [
        ["Role", roleName(a.role)],
        ["Email", <a key="e" href={`mailto:${a.email}?subject=${encodeURIComponent(`Your application: ${roleName(a.role)} internship`)}`} className="underline underline-offset-4">{a.email}</a>],
        ["Phone", <a key="p" href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{a.phone}</a>],
        ["College or work", a.organisation],
        ["City", a.city],
        ["Their work", safeLink ? <a key="w" href={safeLink} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-4">{safeLink}</a> : "Not given"],
        ["Applied", when(a.created_at)],
        ["Confirmation email", a.email_sent_at ? `Sent ${when(a.email_sent_at)}` : "Not sent"],
        ["Consent", <span key="c" className="text-muted-ink">“{a.consent_text}” Confirmed 18 or older. (Privacy Policy version {a.privacy_policy_version})</span>],
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
            <p className="mt-1 text-base text-muted-ink">{roleName(a.role)} internship</p>
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
