import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resendRegistrationEmail, updateRegistration } from "@/app/admin/actions";
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

    const sections: [string, [string, React.ReactNode][]][] = [
        [
            "Person",
            [
                ["Email", <a key="e" href={`mailto:${r.email}?subject=${encodeURIComponent(`Your registration ${r.reference}`)}`} className="underline underline-offset-4">{r.email}</a>],
                ["Phone", <a key="p" href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{r.phone}</a>],
                ["Date of birth", `${day(r.date_of_birth)} (${ageOnConferenceDay(r.date_of_birth)} on the conference day)`],
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
                          ["Phone", <a key="gp" href={`tel:${r.guardian_phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{r.guardian_phone}</a>],
                          ["Verified", r.guardian_verified_at ? `Yes, ${when(r.guardian_verified_at)}${verifiedBy ? ` by ${verifiedBy.name || verifiedBy.email}` : ""}` : "Not yet"],
                      ],
                  ],
              ] as [string, [string, React.ReactNode][]][])
            : []),
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
