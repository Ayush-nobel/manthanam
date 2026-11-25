import type { Metadata } from "next";
import Link from "next/link";
import { saveConference } from "@/app/admin/content-actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { NoAccess, PageTitle, when } from "@/components/admin/format";
import { requireAdmin } from "@/lib/auth";
import { conference } from "@/lib/conference";
import { can } from "@/lib/permissions";
import { readConferenceRow } from "@/lib/site-content";

export const metadata: Metadata = { title: "Conference details" };

const control = "block w-full border border-line-strong bg-white px-3 py-2 text-base text-ink focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal";
const small = "text-sm font-semibold text-ink";

/** A repeated list: the saved rows plus a few empty ones to add more. Order numbers decide the order. */
function Rows<T>({
    title,
    hint,
    prefix,
    items,
    blank,
    fields,
}: {
    title: string;
    hint: string;
    prefix: string;
    items: T[];
    blank: number;
    fields: { key: string; label: string; get: (t: T) => string; wide?: boolean; area?: boolean; width?: string }[];
}) {
    const rows = [...items.map((t) => ({ t })), ...Array.from({ length: blank }, () => ({ t: null as T | null }))];
    return (
        <fieldset className="border-t border-ink pt-5">
            <legend className="sr-only">{title}</legend>
            <h2 className="font-display text-lg font-[650]">{title}</h2>
            <p className="mt-1 text-sm text-faint">{hint}</p>
            <div className="mt-4 grid gap-3">
                {rows.map(({ t }, i) => (
                    <div
                        key={i}
                        style={{ "--cols": `4.5rem ${fields.filter((f) => !f.wide).map((f) => f.width ?? "1fr").join(" ")}` } as React.CSSProperties}
                        className={`grid items-start gap-2 sm:grid-cols-[var(--cols)] ${t ? "" : "opacity-80"}`}
                    >
                        <label>
                            <span className="sr-only">Order of row {i + 1}</span>
                            <input name={`${prefix}_order_${i}`} type="number" defaultValue={(i + 1) * 10} className={`${control} min-h-11 text-sm tabular-nums`} />
                        </label>
                        {fields.map((f) => (
                            <label key={f.key} className={f.wide ? "sm:col-span-full" : undefined}>
                                <span className="sr-only">
                                    {f.label} {i + 1}
                                </span>
                                {f.area ? (
                                    <textarea name={`${prefix}_${f.key}_${i}`} defaultValue={t ? f.get(t) : ""} placeholder={f.label} rows={3} className={control} />
                                ) : (
                                    <input name={`${prefix}_${f.key}_${i}`} defaultValue={t ? f.get(t) : ""} placeholder={f.label} className={`${control} min-h-11`} />
                                )}
                            </label>
                        ))}
                    </div>
                ))}
            </div>
        </fieldset>
    );
}

export default async function ConferenceContentPage() {
    const admin = await requireAdmin();
    if (!can(admin.role, "content.publish")) return <NoAccess />;
    const { value: c, updatedAt } = await readConferenceRow();

    return (
        <>
            <p className="text-sm">
                <Link href="/admin/content" className="underline underline-offset-4">Content</Link>
            </p>
            <div className="mt-3">
                <PageTitle aside={<a href="/register" target="_blank" rel="noopener" className="text-sm underline underline-offset-4">View manthanam.in/register</a>}>
                    Conference details
                </PageTitle>
            </div>
            <p className="-mt-4 mb-8 max-w-2xl text-base text-muted-ink">
                Everything here appears on the registration page; the venue and payment date also go into confirmation emails. The title ({conference.title}), date and city are
                fixed. {updatedAt ? `Last saved ${when(updatedAt)}.` : "Nothing saved yet: these are the built-in details."} Leave a row empty to remove it.
            </p>

            <ActionForm action={saveConference} className="grid max-w-4xl gap-10">
                <fieldset className="grid gap-5 border-t border-ink pt-5 sm:grid-cols-2">
                    <legend className="sr-only">Basics</legend>
                    <label className="flex items-start gap-3 sm:col-span-2">
                        <input type="checkbox" name="registrationOpen" defaultChecked={c.registrationOpen} className="mt-1 size-5 accent-ink" />
                        <span>
                            <span className={small}>Registration is open</span>
                            <span className="block text-sm text-faint">Untick to close the form; the page then says registration is closed.</span>
                        </span>
                    </label>
                    <label className="block sm:col-span-2">
                        <span className={small}>Theme</span>
                        <input name="theme" defaultValue={c.theme} maxLength={200} className={`${control} mt-1 min-h-11`} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className={small}>Venue</span>
                        <input name="venue" defaultValue={c.venue ?? ""} maxLength={200} placeholder="Empty shows “Venue to be announced”" className={`${control} mt-1 min-h-11`} />
                    </label>
                    <label className="block">
                        <span className={small}>Delegates line</span>
                        <input name="expected" defaultValue={c.expected} maxLength={80} placeholder="e.g. 3,000+ delegates expected" className={`${control} mt-1 min-h-11`} />
                    </label>
                    <label className="block">
                        <span className={small}>Payment details sent by</span>
                        <input type="date" name="paymentDetailsBy" defaultValue={c.paymentDetailsBy ?? ""} className={`${control} mt-1 min-h-11 [color-scheme:light]`} />
                    </label>
                    <label className="block">
                        <span className={small}>Register by</span>
                        <input type="date" name="deadline" defaultValue={c.deadline ?? ""} className={`${control} mt-1 min-h-11 [color-scheme:light]`} />
                    </label>
                    <label className="block">
                        <span className={small}>Full refund if cancelled by</span>
                        <input type="date" name="cancellationDeadline" defaultValue={c.cancellationDeadline ?? ""} className={`${control} mt-1 min-h-11 [color-scheme:light]`} />
                    </label>
                </fieldset>

                <Rows
                    title="Fees"
                    hint="Category, amount in rupees, optional note."
                    prefix="fee"
                    items={c.fees}
                    blank={2}
                    fields={[
                        { key: "category", label: "Category", get: (f) => f.category },
                        { key: "amount", label: "Amount (₹)", get: (f) => String(f.amount), width: "8rem" },
                        { key: "note", label: "Note", get: (f) => f.note ?? "" },
                    ]}
                />
                <Rows title="What the fee includes" hint="One item per row." prefix="inc" items={c.included} blank={3} fields={[{ key: "text", label: "Included", get: (t) => t }]} />
                <Rows
                    title="Speakers"
                    hint="Only add someone once they have agreed in writing to be named."
                    prefix="spk"
                    items={c.speakers}
                    blank={5}
                    fields={[
                        { key: "name", label: "Name", get: (s) => s.name },
                        { key: "role", label: "Role", get: (s) => s.role, width: "1.4fr" },
                    ]}
                />
                <Rows
                    title="Agenda"
                    hint="Time, session, and an optional line under it."
                    prefix="agd"
                    items={c.agenda}
                    blank={3}
                    fields={[
                        { key: "time", label: "Time", get: (a) => a.time, width: "7rem" },
                        { key: "title", label: "Session", get: (a) => a.title },
                        { key: "detail", label: "Detail", get: (a) => a.detail ?? "" },
                    ]}
                />
                <Rows
                    title="Questions"
                    hint="Shown on the page and to search engines."
                    prefix="faq"
                    items={c.faqs}
                    blank={2}
                    fields={[
                        { key: "q", label: "Question", get: (f) => f.q },
                        { key: "a", label: "Answer", get: (f) => f.a, area: true, wide: true },
                    ]}
                />
                <div className="sticky bottom-0 -mx-2 border-t border-ink bg-paper px-2 py-4">
                    <Submit>Save conference details</Submit>
                </div>
            </ActionForm>
        </>
    );
}
