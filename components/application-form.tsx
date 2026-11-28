"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import {
    ADULT_TEXT,
    APPLICATION_FIELDS,
    APPLICATION_LIMITS,
    APPLICATION_ROLES,
    cleanApplication,
    isAmbassador,
    roleName,
    validateApplication,
    type ApplicationErrors as Errors,
    type ApplicationField as Field,
} from "@/lib/application";
import { site } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

const NAMES: Record<Field, string> = {
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    city: "City or town",
    organisation: "College, university or workplace",
    role: "Role",
    motivation: "Why you",
    portfolio: "Link to your work",
    adult: "Age",
    consent: "Consent",
};

const inputBase =
    "mt-1 block w-full border-0 border-b bg-transparent px-0 py-2.5 text-lg text-ink placeholder:text-faint transition-colors focus:outline-none focus-visible:border-b-2 disabled:opacity-60";

/** `fixedRole` skips the role choice (the campus ambassador page uses it). */
export default function ApplicationForm({ initialRole, fixedRole }: { initialRole?: string; fixedRole?: string }) {
    const amb = fixedRole ? isAmbassador(fixedRole) : false;
    const uid = useId();
    const id = (f: string) => `${uid}-${f}`;
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<Status>("idle");
    const [failure, setFailure] = useState("");
    const [done, setDone] = useState<{ role: string; email: string; emailed: boolean } | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const summaryRef = useRef<HTMLDivElement>(null);
    const successRef = useRef<HTMLDivElement>(null);
    const submitting = status === "submitting";

    useEffect(() => {
        if (status === "success") successRef.current?.focus();
    }, [status]);
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
        const values = cleanApplication(data);
        const found = validateApplication(values);
        setFailure("");
        if (Object.keys(found).length) return show(found);
        setErrors({});
        setStatus("submitting");
        try {
            const res = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, x_hp_5: data.x_hp_5 ?? "" }),
            });
            const body = (await res.json().catch(() => null)) as { ok?: boolean; emailed?: boolean; errors?: Errors; error?: string } | null;
            if (res.ok && body?.ok) {
                setDone({ role: values.role, email: values.email, emailed: !!body.emailed });
                setStatus("success");
                window.scrollTo({ top: (formRef.current?.closest("section")?.offsetTop ?? 0) - 16 });
                return;
            }
            if (body?.errors && Object.keys(body.errors).length) return show(body.errors);
            setFailure(body?.error ?? "We couldn’t save your application right now.");
            setStatus("error");
        } catch {
            setFailure("We couldn’t send your application. Check your connection and try again; nothing you typed has been lost.");
            setStatus("error");
        }
    }

    const clearError = (f: Field) => errors[f] && setErrors((prev) => ({ ...prev, [f]: undefined }));

    if (status === "success" && done) {
        return (
            <div ref={successRef} tabIndex={-1} role="status" className="border-[5px] border-double border-ink bg-paper px-6 py-8 outline-none sm:px-10 sm:py-10">
                <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-[650] leading-[1.05] text-ink [font-stretch:118%]">Application received.</h2>
                <p className="mt-5 max-w-[34rem] text-lg text-ink">
                    {isAmbassador(done.role) ? (
                        <>
                            Thank you for applying to be a <strong>campus ambassador</strong>. We read every application, and if you’re selected we’ll email you your
                            referral code.
                        </>
                    ) : (
                        <>
                            Thank you for applying for the <strong>{roleName(done.role)}</strong> internship. We read every application, and if yours is shortlisted
                            we’ll email you to arrange a short conversation.
                        </>
                    )}
                </p>
                <p className="mt-4 max-w-[34rem] text-base text-muted-ink">
                    {done.emailed ? (
                        <>
                            We’ve sent a confirmation to <span className="text-ink">{done.email}</span>. If it isn’t in your inbox in a few minutes, check spam.
                        </>
                    ) : (
                        <>We’ll reply to {done.email}.</>
                    )}
                </p>
            </div>
        );
    }

    const errorList = APPLICATION_FIELDS.filter((f) => errors[f]);
    const border = (f: Field) => (errors[f] ? "border-destructive" : "border-ink/40 focus:border-signal");
    const describe = (f: Field, hint?: boolean) => [hint ? id(`${f}-hint`) : null, errors[f] ? id(`${f}-err`) : null].filter(Boolean).join(" ") || undefined;
    const errText = (f: Field) =>
        errors[f] ? (
            <p id={id(`${f}-err`)} className="mt-2 text-sm text-destructive">
                {errors[f]}
            </p>
        ) : null;
    const text = (f: Field, label: string, o: { type?: string; autoComplete?: string; inputMode?: "email" | "tel" | "url"; hint?: string; optional?: boolean; wide?: boolean; placeholder?: string } = {}) => (
        <div className={o.wide ? "sm:col-span-2" : undefined}>
            <label htmlFor={id(f)} className="text-sm font-medium text-ink">
                {label}
                {o.optional && <span className="font-normal text-faint"> (optional)</span>}
            </label>
            <input
                id={id(f)}
                name={f}
                type={o.type ?? "text"}
                autoComplete={o.autoComplete}
                inputMode={o.inputMode}
                placeholder={o.placeholder}
                maxLength={APPLICATION_LIMITS[f]}
                disabled={submitting}
                aria-invalid={!!errors[f]}
                aria-describedby={describe(f, !!o.hint)}
                onChange={() => clearError(f)}
                className={`${inputBase} ${border(f)}`}
            />
            {o.hint && (
                <p id={id(`${f}-hint`)} className="mt-2 text-sm text-faint">
                    {o.hint}
                </p>
            )}
            {errText(f)}
        </div>
    );

    return (
        <form ref={formRef} noValidate onSubmit={onSubmit} aria-busy={submitting} className="grid gap-16">
            <div hidden>
                <label htmlFor={id("hp")}>Leave this empty</label>
                <input id={id("hp")} type="text" name="x_hp_5" tabIndex={-1} autoComplete="off" />
            </div>

            {errorList.length > 0 && (
                <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby={id("summary")} className="border-l-4 border-destructive bg-paper px-5 py-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive">
                    <h2 id={id("summary")} className="font-display text-lg font-semibold text-ink [font-stretch:112%]">
                        {errorList.length === 1 ? "One thing to fix before you apply" : `${errorList.length} things to fix before you apply`}
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

            {fixedRole ? (
                <input type="hidden" name="role" value={fixedRole} />
            ) : (
            <fieldset className="min-w-0" aria-describedby={errors.role ? id("role-err") : undefined}>
                <legend className="w-full border-b border-ink pb-3 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">The role</legend>
                <div className="mt-6 grid gap-3" id={id("role")} tabIndex={-1}>
                    {APPLICATION_ROLES.map((r) => (
                        <label key={r.id} className="flex cursor-pointer items-start gap-4 border border-line-strong bg-white px-5 py-4 has-[:checked]:border-ink has-[:checked]:shadow-[inset_4px_0_0_var(--signal)]">
                            <input type="radio" name="role" value={r.id} defaultChecked={r.id === initialRole} disabled={submitting} onChange={() => clearError("role")} className="mt-1.5 size-5 shrink-0 accent-signal" />
                            <span>
                                <span className="block font-display text-lg font-semibold text-ink [font-stretch:112%]">{r.name}</span>
                                <span className="mt-1 block text-base text-muted-ink">{r.summary}</span>
                            </span>
                        </label>
                    ))}
                </div>
                {errText("role")}
            </fieldset>
            )}

            <Group title="About you">
                {text("fullName", "Full name", { autoComplete: "name", wide: true })}
                {text("email", "Email", { type: "email", autoComplete: "email", inputMode: "email" })}
                {text("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
                {text("organisation", "College, university or workplace", { autoComplete: "organization" })}
                {text("city", "City or town", { autoComplete: "address-level2" })}
            </Group>

            <Group title="Why you">
                <div className="sm:col-span-2">
                    <label htmlFor={id("motivation")} className="text-sm font-medium text-ink">
                        {amb ? "Why would you make a good campus ambassador? Tell us about your college and the groups you’re part of." : "Why do you want this role, and what would you bring to it?"}
                    </label>
                    <textarea
                        id={id("motivation")}
                        name="motivation"
                        rows={6}
                        maxLength={APPLICATION_LIMITS.motivation}
                        disabled={submitting}
                        aria-invalid={!!errors.motivation}
                        aria-describedby={describe("motivation", true)}
                        onChange={() => clearError("motivation")}
                        className={`${inputBase} ${border("motivation")} resize-y`}
                    />
                    <p id={id("motivation-hint")} className="mt-2 text-sm text-faint">
                        {amb
                            ? "A short paragraph is plenty: societies, clubs or class groups you can reach, and anything you’ve organised before."
                            : "A short paragraph is plenty. Mention anything you’ve written, organised or run before."}
                    </p>
                    {errText("motivation")}
                </div>
                {text("portfolio", amb ? "Instagram or LinkedIn profile" : "Link to your work", {
                    type: "url",
                    inputMode: "url",
                    optional: true,
                    wide: true,
                    placeholder: "https://",
                    hint: amb
                        ? "Optional. Helps us see how you reach people on your campus."
                        : "A portfolio, LinkedIn, a social account you ran, or a Google Drive folder that anyone with the link can open.",
                })}
            </Group>

            <Group title="Confirm">
                <div className="grid gap-5 sm:col-span-2">
                    <Check id={id("adult")} name="adult" error={errors.adult} disabled={submitting} onChange={() => clearError("adult")}>
                        {ADULT_TEXT}
                    </Check>
                    <Check id={id("consent")} name="consent" error={errors.consent} disabled={submitting} onChange={() => clearError("consent")}>
                        I agree that {site.legal.name} may use the details in this form to consider my application and to contact me about it, as described in the{" "}
                        <Link href="/privacy" className="text-ink underline underline-offset-4 hover:text-signal">
                            Privacy Policy
                        </Link>
                        . I can withdraw my consent at any time.
                    </Check>
                </div>
            </Group>

            {status === "error" && (
                <div role="alert" className="border-t-2 border-destructive pt-3 text-base text-ink">
                    {failure} You can also email your application to{" "}
                    <a href={`mailto:${site.email}?subject=${encodeURIComponent("Internship application")}`} className="font-medium text-signal underline underline-offset-2">
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
                            Sending…
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        </>
                    ) : (
                        "Send application"
                    )}
                </button>
            </div>
        </form>
    );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset className="min-w-0">
            <legend className="w-full border-b border-ink pb-3 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">{title}</legend>
            <div className="mt-8 grid gap-x-10 gap-y-9 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

function Check({ id, name, error, disabled, onChange, children }: { id: string; name: string; error?: string; disabled?: boolean; onChange?: () => void; children: ReactNode }) {
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
