"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { conference, HEARD_FROM, STATUSES } from "@/lib/conference";
import {
    clean,
    FIELDS,
    GUARDIAN_CONSENT_TEXT,
    isMinor,
    limit,
    PLACE_TEXT,
    RELATIONS,
    validate,
    type Errors,
    type Field,
} from "@/lib/registration";
import { site } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

/** Error-summary labels: what each field is called, so the list reads as "Phone: …". */
const NAMES: Record<Field, string> = {
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    dateOfBirth: "Date of birth",
    city: "City or town",
    state: "State or region",
    country: "Country",
    institution: "School, college or organisation",
    status: "What describes you",
    motivation: "Why you want to attend",
    heardFrom: "How you heard about it",
    accessNeeds: "Access needs",
    guardianName: "Parent or guardian’s name",
    guardianRelation: "Relation",
    guardianEmail: "Parent or guardian’s email",
    guardianPhone: "Parent or guardian’s phone",
    consent: "Consent",
    guardianConsent: "Parent or guardian’s consent",
    placeTerms: "How places are confirmed",
};

const inputBase =
    // Ruled fields, as on the contact form: one underline that darkens on focus.
    "mt-1 block w-full border-0 border-b bg-transparent px-0 py-2.5 text-lg text-ink placeholder:text-faint transition-colors focus:outline-none focus-visible:border-b-2 disabled:opacity-60";
const chevron = `appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2346566c' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[position:right_0.25rem_center] bg-no-repeat pr-10`;
const today = () => new Date().toISOString().slice(0, 10);

export default function RegistrationForm() {
    const uid = useId();
    const id = (f: string) => `${uid}-${f}`;
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<Status>("idle");
    const [failure, setFailure] = useState("");
    const [reference, setReference] = useState("");
    const [dob, setDob] = useState("");
    const [maxDob, setMaxDob] = useState<string>();
    const formRef = useRef<HTMLFormElement>(null);
    const summaryRef = useRef<HTMLDivElement>(null);
    const successRef = useRef<HTMLDivElement>(null);
    const submitting = status === "submitting";
    const minor = isMinor(dob);

    useEffect(() => setMaxDob(today()), []);
    useEffect(() => {
        if (status === "success") successRef.current?.focus();
    }, [status]);

    // Fields are disabled while sending, so focus can only move once the form has re-rendered.
    const focusSummary = useRef(false);
    useEffect(() => {
        if (focusSummary.current && status === "idle") {
            summaryRef.current?.focus();
            focusSummary.current = false;
        }
    }, [status, errors]);

    function show(found: Errors) {
        setErrors(found);
        focusSummary.current = true;
        setStatus("idle");
    }

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const values = clean(data);
        const found = validate(values);
        setFailure("");
        if (Object.keys(found).length) return show(found);

        setErrors({});
        setStatus("submitting");
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, company_website: data.company_website ?? "" }),
            });
            const body = (await res.json().catch(() => null)) as { ok?: boolean; reference?: string; errors?: Errors; error?: string } | null;
            if (res.ok && body?.ok && body.reference) {
                setReference(body.reference);
                setStatus("success");
                window.scrollTo({ top: (formRef.current?.closest("section")?.offsetTop ?? 0) - 16 });
                return;
            }
            if (body?.errors && Object.keys(body.errors).length) return show(body.errors);
            setFailure(body?.error ?? "We couldn’t save your registration right now.");
            setStatus("error");
        } catch {
            setFailure("We couldn’t send your registration. Check your connection and try again; nothing you typed has been lost.");
            setStatus("error");
        }
    }

    function clearError(f: Field) {
        if (errors[f]) setErrors((prev) => ({ ...prev, [f]: undefined }));
    }

    if (status === "success") {
        return (
            <div ref={successRef} tabIndex={-1} role="status" className="outline-none">
                <div className="border-[5px] border-double border-ink bg-paper px-6 py-8 sm:px-10 sm:py-10">
                    <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-[650] leading-[1.05] text-ink [font-stretch:118%]">
                        Registration received.
                    </h2>
                    <p className="mt-6 text-base text-muted-ink">Your reference number</p>
                    <p className="mt-1 select-all whitespace-nowrap font-display text-[clamp(1.375rem,6.5vw,3.25rem)] font-[650] tracking-[0.04em] text-signal [font-stretch:125%]">
                        {reference}
                    </p>
                    <p className="mt-6 max-w-[34rem] text-lg text-ink">
                        Your place is not confirmed yet. We will review your registration and email you to confirm it, with
                        payment details where a fee applies.
                    </p>
                    {minor && (
                        <p className="mt-4 max-w-[34rem] text-base text-muted-ink">
                            Because you are under 18, we will contact your parent or guardian to verify their identity first.
                        </p>
                    )}
                    <p className="mt-4 max-w-[34rem] text-base text-muted-ink">
                        Keep the reference number for any message to us at{" "}
                        <a href={`mailto:${site.email}?subject=${encodeURIComponent(`Registration ${reference}`)}`} className="link-draw text-ink">
                            {site.email}
                        </a>
                        .
                    </p>
                </div>
            </div>
        );
    }

    const errorList = FIELDS.filter((f) => errors[f]);
    const border = (f: Field) => (errors[f] ? "border-destructive" : "border-ink/40 focus:border-signal");
    const describe = (f: Field, hint?: boolean) =>
        [hint ? id(`${f}-hint`) : null, errors[f] ? id(`${f}-err`) : null].filter(Boolean).join(" ") || undefined;
    const errText = (f: Field) =>
        errors[f] ? (
            <p id={id(`${f}-err`)} className="mt-2 text-sm text-destructive">
                {errors[f]}
            </p>
        ) : null;

    const text = (
        f: Field,
        label: string,
        opts: { type?: string; autoComplete?: string; inputMode?: "email" | "tel" | "text"; hint?: string; optional?: boolean; defaultValue?: string; wide?: boolean } = {},
    ) => (
        <div className={opts.wide ? "sm:col-span-2" : undefined}>
            <label htmlFor={id(f)} className="text-sm font-medium text-ink">
                {label}
                {opts.optional && <span className="font-normal text-faint"> (optional)</span>}
            </label>
            <input
                id={id(f)}
                name={f}
                type={opts.type ?? "text"}
                autoComplete={opts.autoComplete}
                inputMode={opts.inputMode}
                maxLength={limit(f)}
                defaultValue={opts.defaultValue}
                disabled={submitting}
                aria-invalid={!!errors[f]}
                aria-describedby={describe(f, !!opts.hint)}
                onChange={() => clearError(f)}
                className={`${inputBase} ${border(f)}`}
            />
            {opts.hint && (
                <p id={id(`${f}-hint`)} className="mt-2 text-sm text-faint">
                    {opts.hint}
                </p>
            )}
            {errText(f)}
        </div>
    );

    const select = (f: Field, label: string, options: readonly string[], optional = false) => (
        <div>
            <label htmlFor={id(f)} className="text-sm font-medium text-ink">
                {label}
                {optional && <span className="font-normal text-faint"> (optional)</span>}
            </label>
            <select
                id={id(f)}
                name={f}
                defaultValue=""
                disabled={submitting}
                aria-invalid={!!errors[f]}
                aria-describedby={describe(f)}
                onChange={() => clearError(f)}
                className={`${inputBase} ${border(f)} ${chevron}`}
            >
                <option value="">{optional ? "Choose (optional)" : "Choose one"}</option>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
            {errText(f)}
        </div>
    );

    const area = (f: Field, label: string, hint: string) => (
        <div className="sm:col-span-2">
            <label htmlFor={id(f)} className="text-sm font-medium text-ink">
                {label} <span className="font-normal text-faint">(optional)</span>
            </label>
            <textarea
                id={id(f)}
                name={f}
                rows={4}
                maxLength={limit(f)}
                disabled={submitting}
                aria-invalid={!!errors[f]}
                aria-describedby={describe(f, true)}
                onChange={() => clearError(f)}
                className={`${inputBase} ${border(f)} resize-y`}
            />
            <p id={id(`${f}-hint`)} className="mt-2 text-sm text-faint">
                {hint}
            </p>
            {errText(f)}
        </div>
    );

    return (
        <form ref={formRef} noValidate onSubmit={onSubmit} aria-busy={submitting} className="relative grid gap-16">
            {/* Honeypot: hidden from people and assistive tech; bots that fill every field reveal themselves. */}
            <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0">
                <label htmlFor={id("hp")}>Company website (leave blank)</label>
                <input id={id("hp")} type="text" name="company_website" tabIndex={-1} autoComplete="off" />
            </div>

            {errorList.length > 0 && (
                <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby={id("summary")} className="border-l-4 border-destructive bg-paper px-5 py-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive">
                    <h2 id={id("summary")} className="font-display text-lg font-semibold text-ink [font-stretch:112%]">
                        {errorList.length === 1 ? "One thing to fix before you register" : `${errorList.length} things to fix before you register`}
                    </h2>
                    <ul className="mt-2 grid gap-1 text-base">
                        {errorList.map((f) => (
                            <li key={f}>
                                <a href={`#${id(f)}`} className="text-destructive underline underline-offset-4">
                                    {NAMES[f]}: {errors[f]}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Group title="About you">
                {text("fullName", "Full name", { autoComplete: "name", hint: "As it should appear on your conference badge and certificate.", wide: true })}
                {text("email", "Email", { type: "email", autoComplete: "email", inputMode: "email" })}
                {text("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", hint: "With country code if outside India." })}
                <div>
                    <label htmlFor={id("dateOfBirth")} className="text-sm font-medium text-ink">
                        Date of birth
                    </label>
                    <input
                        id={id("dateOfBirth")}
                        name="dateOfBirth"
                        type="date"
                        autoComplete="bday"
                        max={maxDob}
                        value={dob}
                        disabled={submitting}
                        aria-invalid={!!errors.dateOfBirth}
                        aria-describedby={describe("dateOfBirth", true)}
                        onChange={(e) => {
                            setDob(e.target.value);
                            clearError("dateOfBirth");
                        }}
                        className={`${inputBase} ${border("dateOfBirth")} [color-scheme:light]`}
                    />
                    <p id={id("dateOfBirth-hint")} className="mt-2 text-sm text-faint">
                        If you will be under 18 on 20 December, we will also ask for a parent or guardian.
                    </p>
                    {errText("dateOfBirth")}
                </div>
                {select("status", "What best describes you", STATUSES)}
            </Group>

            <Group title="Where you are">
                {text("institution", "School, college, university or organisation", { autoComplete: "organization", wide: true })}
                {text("city", "City or town", { autoComplete: "address-level2" })}
                {text("state", "State or region", { autoComplete: "address-level1" })}
                {text("country", "Country", { autoComplete: "country-name", defaultValue: "India" })}
            </Group>

            {minor && (
                <Group
                    title="Your parent or guardian"
                    intro="You will be under 18 on the day of the conference, so a parent or legal guardian must give consent. We will contact them to confirm before your place is confirmed."
                >
                    {text("guardianName", "Their full name", { wide: true })}
                    {select("guardianRelation", "How they are related to you", RELATIONS)}
                    <div className="hidden sm:block" aria-hidden="true" />
                    {text("guardianEmail", "Their email", { type: "email", inputMode: "email" })}
                    {text("guardianPhone", "Their phone", { type: "tel", inputMode: "tel" })}
                    <div className="sm:col-span-2">
                        <Check id={id("guardianConsent")} name="guardianConsent" error={errors.guardianConsent} disabled={submitting} onChange={() => clearError("guardianConsent")}>
                            {GUARDIAN_CONSENT_TEXT}
                        </Check>
                        <p className="mt-2 pl-8 text-sm text-faint">Please ask your parent or guardian to read this and tick it themselves.</p>
                    </div>
                </Group>
            )}

            <Group title="About the conference">
                {area("motivation", "Why do you want to attend?", "A few lines are plenty. Up to 1,000 characters.")}
                {select("heardFrom", "How did you hear about it?", HEARD_FROM, true)}
                <div className="hidden sm:block" aria-hidden="true" />
                {area(
                    "accessNeeds",
                    "Anything we should arrange so you can take part fully?",
                    "For example step-free access or a sign-language interpreter. Tell us only what you’re comfortable sharing.",
                )}
            </Group>

            <Group title="Confirm">
                <div className="grid gap-5 sm:col-span-2">
                    <Check id={id("placeTerms")} name="placeTerms" error={errors.placeTerms} disabled={submitting} onChange={() => clearError("placeTerms")}>
                        {PLACE_TEXT}
                    </Check>
                    <Check id={id("consent")} name="consent" error={errors.consent} disabled={submitting} onChange={() => clearError("consent")}>
                        I agree that {site.legal.name} may use the details in this form to process my registration for the {conference.title} and to
                        contact me about it, as described in the{" "}
                        <Link href="/privacy" className="text-ink underline underline-offset-4 hover:text-signal">
                            Privacy Policy
                        </Link>
                        . I can withdraw my consent at any time.
                    </Check>
                </div>
            </Group>

            {status === "error" && (
                <div role="alert" className="border-t-2 border-destructive pt-3 text-base text-ink">
                    {failure} You can also email your details to{" "}
                    <a href={`mailto:${site.email}?subject=${encodeURIComponent(`Registration: ${conference.title}`)}`} className="font-medium text-signal underline underline-offset-2">
                        {site.email}
                    </a>
                    .
                </div>
            )}

            <div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 bg-ink px-8 py-3.5 font-display text-base font-semibold text-paper [font-stretch:112%] transition-colors hover:bg-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-70"
                >
                    {submitting ? (
                        <>
                            Registering…
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        </>
                    ) : (
                        "Register"
                    )}
                </button>
                <p className="mt-3 text-sm text-faint">You will get a reference number straight away.</p>
            </div>
        </form>
    );
}

/** A titled group of fields: a ruled legend, then a two-column grid on wider screens. */
function Group({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
    return (
        <fieldset className="min-w-0">
            <legend className="w-full border-b border-ink pb-3 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">{title}</legend>
            {intro && <p className="mt-4 max-w-[36rem] text-base text-muted-ink">{intro}</p>}
            <div className="mt-8 grid gap-x-10 gap-y-9 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

/** Native checkbox, never pre-ticked, same style as the contact form's consent boxes. */
function Check({
    id,
    name,
    error,
    disabled,
    onChange,
    children,
}: {
    id: string;
    name: string;
    error?: string;
    disabled?: boolean;
    onChange?: () => void;
    children: ReactNode;
}) {
    return (
        <div>
            <div className="flex items-start gap-3">
                <input
                    id={id}
                    name={name}
                    type="checkbox"
                    value="yes"
                    disabled={disabled}
                    onChange={onChange}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-err` : undefined}
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                />
                <label htmlFor={id} className="cursor-pointer text-base leading-relaxed text-muted-ink">
                    {children}
                </label>
            </div>
            {error && (
                <p id={`${id}-err`} className="mt-1 pl-8 text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
