"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { sendOfferLetter, type LetterFormState } from "@/app/admin/letters-actions";
import { Submit } from "@/components/admin/action-form";
import { DEFAULT_INTERNSHIP_BENEFITS, DEPARTMENTS, KIND_LABELS, LETTER_KINDS, WORK_MODES, WORK_MODE_LABELS, type LetterErrors, type LetterKind, type OfferLetter } from "@/lib/letters/model";

const control =
    "mt-1.5 block w-full border border-line-strong bg-white px-3 py-2 text-base text-ink focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal aria-[invalid=true]:border-signal";

/** One labelled input with its hint and its error. */
function Field({ name, label, hint, error, children }: { name: keyof OfferLetter; label: string; hint?: string; error?: string; children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string }) => ReactNode }) {
    const id = `letter-${name}`;
    const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    return (
        <div>
            <label htmlFor={id} className="text-sm font-semibold text-ink">
                {label}
            </label>
            {hint && (
                <span id={`${id}-hint`} className="block text-sm text-faint">
                    {hint}
                </span>
            )}
            {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy, className: control })}
            {error && (
                <span id={`${id}-error`} className="mt-1 block text-sm text-signal">
                    {error}
                </span>
            )}
        </div>
    );
}

export type LetterDefaults = Partial<OfferLetter> & { applicationId?: string };

export function LetterForm({ defaults, signedBy }: { defaults: LetterDefaults; signedBy: string }) {
    const [state, action] = useActionState<LetterFormState, FormData>(sendOfferLetter, {});
    const [kind, setKind] = useState<LetterKind>(defaults.kind ?? "internship");
    const [mode, setMode] = useState(defaults.workMode ?? "remote");
    const [benefits, setBenefits] = useState(defaults.benefits ?? (kind === "internship" ? DEFAULT_INTERNSHIP_BENEFITS : ""));
    const [previewError, setPreviewError] = useState("");
    const form = useRef<HTMLFormElement>(null);
    const e: LetterErrors = state.errors ?? {};

    function chooseKind(k: LetterKind) {
        setKind(k);
        // Swap the default list, but never throw away something the admin typed.
        if (k === "internship" && !benefits.trim()) setBenefits(DEFAULT_INTERNSHIP_BENEFITS);
        if (k === "job" && benefits === DEFAULT_INTERNSHIP_BENEFITS) setBenefits("");
    }

    async function preview() {
        if (!form.current) return;
        setPreviewError("");
        // Open the tab now, while the click still counts as the user's, then point it at the PDF.
        const tab = window.open("", "_blank");
        const res = await fetch("/admin/letters/preview", { method: "POST", body: new FormData(form.current) });
        if (!res.ok) {
            tab?.close();
            setPreviewError(res.status === 400 ? ((await res.text()).split("\n\n")[1] ?? "Fill in the required fields first.") : "The preview couldn’t be made. Try again.");
            return;
        }
        const url = URL.createObjectURL(await res.blob());
        if (tab) tab.location.href = url;
        else window.location.href = url;
    }

    return (
        <form
            ref={form}
            action={action}
            noValidate
            className="grid max-w-3xl gap-8"
            onSubmit={(ev) => {
                const f = new FormData(ev.currentTarget);
                if (!window.confirm(`Issue this letter and email it to ${String(f.get("email") ?? "")}? The letter number is used up once it’s issued.`)) ev.preventDefault();
            }}
        >
            {defaults.applicationId && <input type="hidden" name="applicationId" value={defaults.applicationId} />}

            <fieldset className="grid gap-5 border-t border-ink pt-5">
                <legend className="float-left mb-1 font-display text-lg font-[650]">The offer</legend>
                <div className="clear-both flex flex-wrap gap-3" role="radiogroup" aria-label="Kind of offer">
                    {LETTER_KINDS.map((k) => (
                        <label key={k} className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-line-strong bg-white px-4 has-[:checked]:border-ink has-[:checked]:bg-paper-2">
                            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => chooseKind(k)} className="size-4 accent-ink" />
                            <span className="text-base font-semibold">{KIND_LABELS[k]}</span>
                        </label>
                    ))}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field name="position" label="Position" hint={kind === "internship" ? "e.g. Social media intern" : "e.g. Research Associate"} error={e.position}>
                        {(p) => <input {...p} name="position" defaultValue={defaults.position} maxLength={120} required className={`${p.className} min-h-11`} />}
                    </Field>
                    <Field name="department" label="Department" hint="Choose one or type another" error={e.department}>
                        {(p) => (
                            <>
                                <input {...p} name="department" list="letter-departments" defaultValue={defaults.department} maxLength={120} required className={`${p.className} min-h-11`} />
                                <datalist id="letter-departments">
                                    {DEPARTMENTS.map((d) => (
                                        <option key={d} value={d} />
                                    ))}
                                </datalist>
                            </>
                        )}
                    </Field>
                </div>
            </fieldset>

            <fieldset className="grid gap-5 border-t border-ink pt-5 sm:grid-cols-2">
                <legend className="float-left mb-1 font-display text-lg font-[650] sm:col-span-2">The person</legend>
                <Field name="fullName" label="Full name" hint="As it should appear on the letter" error={e.fullName}>
                    {(p) => <input {...p} name="fullName" defaultValue={defaults.fullName} maxLength={120} required autoComplete="off" className={`${p.className} min-h-11`} />}
                </Field>
                <Field name="email" label="Email address" hint="The letter is sent here" error={e.email}>
                    {(p) => <input {...p} type="email" name="email" defaultValue={defaults.email} maxLength={254} required autoComplete="off" className={`${p.className} min-h-11`} />}
                </Field>
            </fieldset>

            <fieldset className="grid gap-5 border-t border-ink pt-5 sm:grid-cols-2">
                <legend className="float-left mb-1 font-display text-lg font-[650] sm:col-span-2">Dates and terms</legend>
                <Field name="startDate" label="Start date" error={e.startDate}>
                    {(p) => <input {...p} type="date" name="startDate" defaultValue={defaults.startDate} required className={`${p.className} min-h-11`} />}
                </Field>
                <Field name="endDate" label={kind === "internship" ? "End date" : "End date (optional)"} hint={kind === "job" ? "Leave empty for an ongoing role" : undefined} error={e.endDate}>
                    {(p) => <input {...p} type="date" name="endDate" defaultValue={defaults.endDate ?? ""} className={`${p.className} min-h-11`} />}
                </Field>
                <Field name="commitment" label="Commitment (optional)" hint="e.g. Part-time, about 10 hours a week" error={e.commitment}>
                    {(p) => <input {...p} name="commitment" defaultValue={defaults.commitment} maxLength={120} className={`${p.className} min-h-11`} />}
                </Field>
                <Field name="compensation" label={kind === "internship" ? "Stipend (optional)" : "Pay (optional)"} hint={kind === "internship" ? "Leave empty for an unpaid internship" : "e.g. ₹35,000 a month"} error={e.compensation}>
                    {(p) => <input {...p} name="compensation" defaultValue={defaults.compensation} maxLength={120} className={`${p.className} min-h-11`} />}
                </Field>
                <Field name="workMode" label="Mode of work" error={e.workMode}>
                    {(p) => (
                        <select {...p} name="workMode" value={mode} onChange={(ev) => setMode(ev.target.value as typeof mode)} className={`${p.className} min-h-11`}>
                            {WORK_MODES.map((m) => (
                                <option key={m} value={m}>
                                    {WORK_MODE_LABELS[m]}
                                </option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field name="location" label={mode === "remote" ? "Location (optional)" : "Location"} hint="e.g. New Delhi" error={e.location}>
                    {(p) => <input {...p} name="location" defaultValue={defaults.location} maxLength={120} className={`${p.className} min-h-11`} />}
                </Field>
                <Field name="reportingTo" label="Reports to (optional)" hint="A name or a role" error={e.reportingTo}>
                    {(p) => <input {...p} name="reportingTo" defaultValue={defaults.reportingTo} maxLength={120} className={`${p.className} min-h-11`} />}
                </Field>
                <Field name="respondBy" label="Reply by" hint="The offer lapses after this date" error={e.respondBy}>
                    {(p) => <input {...p} type="date" name="respondBy" defaultValue={defaults.respondBy} required className={`${p.className} min-h-11`} />}
                </Field>
                <div className="sm:col-span-2">
                    <Field name="benefits" label={kind === "internship" ? "What they’ll receive (optional)" : "Benefits (optional)"} hint="One per line" error={e.benefits}>
                        {(p) => <textarea {...p} name="benefits" value={benefits} onChange={(ev) => setBenefits(ev.target.value)} rows={3} maxLength={1000} />}
                    </Field>
                </div>
                <div className="sm:col-span-2">
                    <Field name="additionalTerms" label="Extra terms (optional)" hint="One per line. Added after the standard terms, e.g. “A probation period of three months applies.”" error={e.additionalTerms}>
                        {(p) => <textarea {...p} name="additionalTerms" defaultValue={defaults.additionalTerms} rows={3} maxLength={2000} />}
                    </Field>
                </div>
            </fieldset>

            <div className="grid gap-4 border-t border-ink pt-5">
                <p className="max-w-[65ch] text-sm text-muted-ink">
                    Signed by <strong className="text-ink">{signedBy}</strong>. The letter gets the next number and a verification code, and goes out as a PDF with an email in the registration email’s design.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={preview} className="inline-flex min-h-10 items-center border border-ink px-4 text-sm font-semibold text-ink hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal">
                        Preview PDF
                    </button>
                    <Submit>Send offer letter</Submit>
                </div>
                {(state.error || previewError) && (
                    <p role="alert" className="text-sm text-signal">
                        {previewError || state.error}
                    </p>
                )}
            </div>
        </form>
    );
}
