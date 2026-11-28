import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmSeatAction, resendRegistrationEmail, sendPaymentRequest, updateRegistration } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Select, TextArea } from "@/components/admin/fields";
import { day, describe, NoAccess, StatusBadge, when } from "@/components/admin/format";
import { getRegistration } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { ageOnConferenceDay } from "@/lib/registration";
import { can, REGISTRATION_STATUSES, REGISTRATION_STATUS_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Registration" };

export default async function RegistrationPage({ params }: PageProps<"/admin/registrations/[id]">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "registrations.view")) return <NoAccess />;
    const found = await getRegistration((await params).id);
    if (!found) notFound();
    const { registration: r, history, verifiedBy } = found;
    const edit = can(admin.role, "registrations.edit");
    // Data minimisation for children's data (DPDP Act s.9): view-only admins don't need an under-18's exact
    // date of birth or their parent's phone number to do their job, so those never leave the server for them.
    const restricted = r.minor && admin.role === "viewer";
    const hidden = <span className="text-faint">Hidden for your role (under 18)</span>;

    const sections: [string, [string, React.ReactNode][]][] = [
        [
            "Person",
            [
                ["Email", <a key="e" href={`mailto:${r.email}?subject=${encodeURIComponent(`Your registration ${r.reference}`)}`} className="underline underline-offset-4">{r.email}</a>],
                ["Phone", <a key="p" href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{r.phone}</a>],
                ["Date of birth", restricted ? hidden : `${day(r.date_of_birth)} (${ageOnConferenceDay(r.date_of_birth)} on the conference day)`],
                ["Participant", r.participant_type],
                ["Institution", r.institution || "—"],
                ["Lives in", [r.city, r.state, r.country].filter(Boolean).join(", ")],
            ],
        ],
        [
            "About the conference",
            [
                ["Why they want to attend", r.motivation || "—"],
                ["Heard about it from", r.heard_from || "—"],
                ["Access needs", r.access_needs || "None given"],
            ],
        ],
        ...(r.minor
            ? ([
                  [
                      "Parent or guardian",
                      [
                          ["Name", `${r.guardian_name} (${r.guardian_relation})`],
                          ["Email", <a key="ge" href={`mailto:${r.guardian_email}`} className="underline underline-offset-4">{r.guardian_email}</a>],
                          ["Phone", restricted ? hidden : <a key="gp" href={`tel:${r.guardian_phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{r.guardian_phone}</a>],
                          ["Verified", r.guardian_verified_at ? `Yes, ${when(r.guardian_verified_at)}${verifiedBy ? ` by ${verifiedBy.name || verifiedBy.email}` : ""}` : "Not yet"],
                      ],
                  ],
              ] as [string, [string, React.ReactNode][]][])
            : []),
        [
            "Payment",
            [
                ["Payment email", r.payment_email_sent_at ? `Sent ${when(r.payment_email_sent_at)}` : "Not sent"],
                ...(r.payment_submitted_at
                    ? ([
                          ["Proof received", when(r.payment_submitted_at)],
                          ["Transaction ID", <span key="t" className="font-mono select-all">{r.payment_reference}</span>],
                          ["Campus ambassador code", r.referral_code ? <span key="rc" className="font-mono">{r.referral_code} (pays 10% less)</span> : "None"],
                          ["Amount", r.payment_amount !== null ? `₹${r.payment_amount.toLocaleString("en-IN")}` : "—"],
                          ["Paid on", r.payment_paid_on ? day(r.payment_paid_on) : "—"],
                          ...(r.payment_payer_name ? [["Paid by", r.payment_payer_name] as [string, React.ReactNode]] : []),
                          [
                              "Screenshot",
                              r.payment_proof_type === "application/pdf" ? (
                                  <a key="s" href={`/admin/payment-proof/${r.id}`} className="underline underline-offset-4">
                                      Download the PDF receipt
                                  </a>
                              ) : (
                                  <a key="s" href={`/admin/payment-proof/${r.id}`} target="_blank" rel="noopener" className="block w-fit">
                                      {/* eslint-disable-next-line @next/next/no-img-element -- private file served by an admin-only route */}
                                      <img src={`/admin/payment-proof/${r.id}`} alt={`Payment screenshot from ${r.full_name}`} className="max-h-[28rem] w-auto border border-line" />
                                      <span className="mt-1 block text-sm underline underline-offset-4">Open full size</span>
                                  </a>
                              ),
                          ],
                      ] as [string, React.ReactNode][])
                    : [["Proof received", "Not yet"] as [string, React.ReactNode]]),
            ],
        ],
        [
            "Record",
            [
                ["Registered", when(r.created_at)],
                ["Confirmation email", r.email_sent_at ? `Sent ${when(r.email_sent_at)}` : "Not sent"],
                ["Copied to Zoho Sheet", r.sheet_synced_at ? when(r.sheet_synced_at) : "No"],
                ["Consent", <span key="c" className="text-muted-ink">“{r.consent_text}” (Privacy Policy version {r.privacy_policy_version})</span>],
                ...(r.minor ? [["Guardian consent", <span key="gc" className="text-muted-ink">“{r.guardian_consent_text}”</span>] as [string, React.ReactNode]] : []),
            ],
        ],
    ];

    return (
        <>
            <p className="text-sm">
                <Link href="/admin/registrations" className="underline underline-offset-4">
                    Registrations
                </Link>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <h1 className="font-display text-[1.875rem] font-[650] leading-tight [font-stretch:115%]">{r.full_name}</h1>
                <StatusBadge status={r.status} />
                {r.minor && <span className="text-sm font-semibold text-signal">Under 18</span>}
            </div>
            <p className="mt-1 font-mono text-base text-muted-ink">{r.reference}</p>

            <div className="mt-10 grid gap-12 lg:grid-cols-12">
                <div className="grid gap-10 lg:col-span-7">
                    {sections.map(([title, rows]) => (
                        <section key={title} aria-labelledby={`s-${title}`}>
                            <h2 id={`s-${title}`} className="font-display text-lg font-[650]">{title}</h2>
                            <dl className="mt-2 border-t border-ink">
                                {rows.map(([k, v]) => (
                                    <div key={k} className="grid gap-x-6 border-b border-line py-2.5 sm:grid-cols-[12rem_1fr]">
                                        <dt className="text-sm text-muted-ink">{k}</dt>
                                        <dd className="text-base break-words whitespace-pre-line">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ))}
                </div>

                <div className="lg:col-span-5">
                    {edit ? (
                        <section aria-labelledby="update" className="border-[5px] border-double border-ink bg-white px-6 py-6">
                            <h2 id="update" className="font-display text-lg font-[650]">Update</h2>
                            <ActionForm action={updateRegistration} className="mt-4 grid gap-5">
                                <input type="hidden" name="id" value={r.id} />
                                <Select label="Status" name="status" defaultValue={r.status}>
                                    {REGISTRATION_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {REGISTRATION_STATUS_LABELS[s]}
                                        </option>
                                    ))}
                                </Select>
                                {r.minor && (
                                    <label className="flex items-start gap-3">
                                        <input type="checkbox" name="guardianVerified" defaultChecked={!!r.guardian_verified_at} className="mt-1 size-5 accent-ink" />
                                        <span className="text-base">
                                            Parent or guardian verified
                                            <span className="block text-sm text-faint">Tick once you’ve spoken to them and confirmed they are the parent or guardian.</span>
                                        </span>
                                    </label>
                                )}
                                <TextArea label="Notes (only admins see these)" name="notes" defaultValue={r.notes} rows={5} maxLength={5000} />
                                <div>
                                    <Submit>Save</Submit>
                                </div>
                            </ActionForm>
                            {(r.payment_submitted_at || r.status === "paid" || r.status === "confirmed") && r.status !== "cancelled" && r.status !== "refunded" && (
                                <ActionForm
                                    action={confirmSeatAction}
                                    className="mt-6 border-t border-line pt-5"
                                    confirm={
                                        r.status === "confirmed"
                                            ? `Send the “Your place is confirmed” email to ${r.email} again?`
                                            : `Confirm ${r.full_name}’s seat and email them “Your place is confirmed”? Only do this once the payment is in the bank statement.`
                                    }
                                >
                                    <input type="hidden" name="id" value={r.id} />
                                    {r.status !== "confirmed" && (
                                        <p className="mb-3 border-l-[3px] border-signal bg-paper px-4 py-3 text-sm">
                                            Check the screenshot and transaction ID against the bank statement, then confirm the seat. This sets the status to Confirmed and emails them.
                                        </p>
                                    )}
                                    <Submit tone={r.status === "confirmed" ? "quiet" : "primary"}>{r.status === "confirmed" ? "Resend seat confirmation email" : "Confirm seat and send email"}</Submit>
                                    {r.minor && !r.guardian_verified_at && <p className="mt-2 text-sm text-faint">Verify the parent or guardian first.</p>}
                                </ActionForm>
                            )}
                            {r.status !== "cancelled" && r.status !== "refunded" && (
                                <ActionForm
                                    action={sendPaymentRequest}
                                    className="mt-6 border-t border-line pt-5"
                                    confirm={`${r.payment_email_sent_at ? "Send the payment email again" : "Send the payment email"} to ${r.email}${r.minor && r.guardian_email ? ` (copy to ${r.guardian_email})` : ""}?`}
                                >
                                    <input type="hidden" name="id" value={r.id} />
                                    <Submit tone={r.payment_email_sent_at ? "quiet" : "primary"}>{r.payment_email_sent_at ? "Resend payment email" : "Send payment email"}</Submit>
                                    {r.minor && !r.guardian_verified_at && <p className="mt-2 text-sm text-faint">Verify the parent or guardian first.</p>}
                                </ActionForm>
                            )}
                            <ActionForm action={resendRegistrationEmail} className="mt-6 border-t border-line pt-5" confirm={`Send the confirmation email to ${r.email} again?`}>
                                <input type="hidden" name="id" value={r.id} />
                                <Submit tone="quiet">Resend confirmation email</Submit>
                            </ActionForm>
                        </section>
                    ) : (
                        <p className="text-base text-muted-ink">Your role can view this registration but not change it.</p>
                    )}

                    <section aria-labelledby="history" className="mt-10">
                        <h2 id="history" className="font-display text-lg font-[650]">History</h2>
                        <ol className="mt-2 border-t border-ink text-sm">
                            {history.map((h) => (
                                <li key={h.id} className="border-b border-line py-2.5">
                                    <span className="block text-ink">{describe(h.action, h.detail)}</span>
                                    <span className="text-faint">
                                        {when(h.at)}, {h.actor_email === "website" ? "on the website" : h.actor_email}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>
            </div>
        </>
    );
}
