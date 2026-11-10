"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { site } from "@/lib/site";
import {
    cleanContact,
    CONSENT_TEXT,
    GUARDIAN_CONSENT_TEXT,
    PRIVACY_POLICY_VERSION,
    TOPICS,
    validateContact,
    type ContactErrors,
    type ContactField,
} from "@/lib/contact";

// Messages go to our own server (/api/contact). Formspree is only a fallback for while that isn't set up.
// Must be referenced literally so Next.js inlines it into the browser bundle at build time.
const RAW_FORMSPREE_URL = process.env.NEXT_PUBLIC_FORMSPREE_URL?.trim();
// Submissions contain names, emails and messages: only ever send them over HTTPS.
const FORMSPREE_URL = RAW_FORMSPREE_URL?.startsWith("https://") ? RAW_FORMSPREE_URL : undefined;

const topics = TOPICS;

type Field = ContactField;
type Errors = ContactErrors;
type Status = "idle" | "submitting" | "success" | "error";
type Sender = "adult" | "guardian";
/** Order used to move focus to the first problem. */
const FIELDS: Field[] = ["name", "email", "message", "sender", "consent", "guardianConsent"];

/** Formspree's JSON error shape: { errors: [{ field?, code?, message }] } */
interface FormspreeError {
    field?: string;
    code?: string;
    message: string;
}

const validate = (data: FormData): Errors => validateContact(cleanContact(Object.fromEntries(data)));

const inputBase =
    // Ruled fields: a single underline that darkens on focus, like writing on a printed form.
    "mt-1 block w-full border-0 border-b bg-transparent px-0 py-2.5 text-lg text-ink placeholder:text-faint transition-colors focus:outline-none focus-visible:border-b-2 disabled:opacity-60";

export default function ContactForm() {
    const uid = useId();
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<Status>("idle");
    const [failure, setFailure] = useState("");
    const [sender, setSender] = useState<Sender | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const successRef = useRef<HTMLDivElement>(null);

    const id = (f: string) => `${uid}-${f}`;
    const submitting = status === "submitting";
    const border = (f: Field) => (errors[f] ? "border-destructive" : "border-ink/40 focus:border-signal");

    // Fields are disabled while sending, so focus can only move once the form has re-rendered.
    const pendingFocus = useRef<Field | null>(null);
    useEffect(() => {
        if (status === "success") successRef.current?.focus();
        if (status === "idle" && pendingFocus.current) {
            document.getElementById(`${uid}-${pendingFocus.current}`)?.focus();
            pendingFocus.current = null;
        }
    }, [status, errors, uid]);

    function focusFirst(found: Errors) {
        pendingFocus.current = FIELDS.find((f) => found[f]) ?? null;
    }

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const found = validate(data);
        setErrors(found);
        setFailure("");
        if (Object.keys(found).length) {
            focusFirst(found);
            return;
        }

        // Honeypot: real people never see or fill this field, so a value means a bot.
        // Pretend it worked and send nothing.
        if (String(data.get("x_hp_7") ?? "") !== "") {
            setStatus("success");
            return;
        }

        const who = data.get("sender") === "guardian" ? "guardian" : "adult";
        const values = cleanContact(Object.fromEntries(data));

        setStatus("submitting");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(values),
            });
            const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; errors?: Errors; fallback?: boolean } | null;
            if (res.ok && body?.ok) return sent();
            if (body?.errors && Object.keys(body.errors).length) {
                setErrors(body.errors);
                setStatus("idle");
                focusFirst(body.errors);
                return;
            }
            if (!body?.fallback) {
                setFailure(body?.error ?? "We couldn’t send your message right now.");
                setStatus("error");
                return;
            }
        } catch {
            setFailure("We couldn’t send your message. Please check your connection and try again.");
            setStatus("error");
            return;
        }

        // Our server isn't set up to receive messages yet: send through Formspree instead.
        if (!FORMSPREE_URL) {
            setFailure("The contact form isn’t connected yet.");
            setStatus("error");
            return;
        }
        const payload = {
            name: values.name,
            email: values.email, // Formspree uses this as the reply-to address
            topic: values.topic,
            message: values.message,
            sender: who === "guardian" ? "Parent or legal guardian writing for someone under 18" : "Adult (18 or older)",
            // Consent record: exactly what was agreed, to which policy version, and when.
            consent: CONSENT_TEXT,
            ...(who === "guardian" ? { guardianConsent: GUARDIAN_CONSENT_TEXT } : {}),
            privacyPolicyVersion: PRIVACY_POLICY_VERSION,
            consentedAt: new Date().toISOString(),
            _subject: `[${values.topic}]${who === "guardian" ? " [Guardian — verify identity]" : ""} New message via manthanam.in`,
        };
        try {
            const res = await fetch(FORMSPREE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) return sent();
            const body = (await res.json().catch(() => null)) as { errors?: FormspreeError[] } | null;
            const list = body?.errors ?? [];
            const fieldErrors: Errors = {};
            for (const err of list) {
                if (err.field && (FIELDS as string[]).includes(err.field)) fieldErrors[err.field as Field] = err.message;
            }
            if (Object.keys(fieldErrors).length) {
                setErrors(fieldErrors);
                setStatus("idle");
                focusFirst(fieldErrors);
                return;
            }
            setFailure(list.filter((err) => !err.field).map((err) => err.message).join(" ") || "We couldn’t send your message right now.");
            setStatus("error");
        } catch {
            setFailure("We couldn’t send your message. Please check your connection and try again.");
            setStatus("error");
        }
    }

    function sent() {
        formRef.current?.reset();
        setSender(null);
        setStatus("success");
    }

    function clearError(f: Field) {
        if (errors[f]) setErrors((prev) => ({ ...prev, [f]: undefined }));
    }

    if (status === "success") {
        return (
            <div
                ref={successRef}
                tabIndex={-1}
                role="status"
                className="border-t border-ink pt-8 outline-none"
            >
                <h3 className="font-display text-3xl font-[620] text-ink [font-stretch:115%]">Thank you — message received.</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-muted-ink">
                    We read every message and will reply to the email address you gave us.
                </p>
                <p className="mt-3 max-w-md text-sm text-faint">
                    Want your message deleted later? Email{" "}
                    <a href={`mailto:${site.email}?subject=Privacy%20request`} className="text-muted-ink underline underline-offset-4 hover:text-signal">
                        {site.email}
                    </a>{" "}
                    — see our{" "}
                    <Link href="/privacy" className="text-muted-ink underline underline-offset-4 hover:text-signal">Privacy Policy</Link>.
                </p>
                <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="link-draw mt-8 min-h-11 cursor-pointer text-base font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form
            ref={formRef}
            noValidate
            onSubmit={onSubmit}
            aria-busy={submitting}
            className="relative grid gap-x-10 gap-y-9 sm:grid-cols-2"
        >
            {/* Honeypot: hidden from people and assistive tech; bots that fill every field reveal themselves. */}
            <div hidden>
                <label htmlFor={id("hp")}>Company website (leave blank)</label>
                <input id={id("hp")} type="text" name="x_hp_7" tabIndex={-1} autoComplete="off" />
            </div>

            <div>
                <label htmlFor={id("name")} className="text-sm font-medium text-ink">Name</label>
                <input
                    id={id("name")} name="name" type="text" autoComplete="name" maxLength={100} disabled={submitting}
                    aria-invalid={!!errors.name} aria-describedby={errors.name ? id("name-err") : undefined}
                    onChange={() => clearError("name")}
                    className={`${inputBase} ${border("name")}`}
                />
                {errors.name && <p id={id("name-err")} className="mt-2 text-sm text-destructive">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor={id("email")} className="text-sm font-medium text-ink">Email</label>
                <input
                    id={id("email")} name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} disabled={submitting}
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? id("email-err") : undefined}
                    onChange={() => clearError("email")}
                    className={`${inputBase} ${border("email")}`}
                />
                {errors.email && <p id={id("email-err")} className="mt-2 text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="sm:col-span-2">
                <label htmlFor={id("topic")} className="text-sm font-medium text-ink">Topic</label>
                <select
                    id={id("topic")} name="topic" defaultValue={topics[0]} disabled={submitting}
                    className={`${inputBase} border-ink/40 focus:border-signal appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2346566c' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[position:right_0.25rem_center] bg-no-repeat pr-10`}
                >
                    {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="sm:col-span-2">
                <label htmlFor={id("message")} className="text-sm font-medium text-ink">Message</label>
                <textarea
                    id={id("message")} name="message" rows={5} maxLength={5000} disabled={submitting}
                    aria-invalid={!!errors.message}
                    aria-describedby={`${id("message-hint")}${errors.message ? ` ${id("message-err")}` : ""}`}
                    onChange={() => clearError("message")}
                    className={`${inputBase} ${border("message")} resize-y`}
                />
                <p id={id("message-hint")} className="mt-2 text-sm text-faint">
                    Tell us who you are and what you&rsquo;d like to discuss. Please don&rsquo;t include sensitive personal
                    information.
                </p>
                {errors.message && <p id={id("message-err")} className="mt-1 text-sm text-destructive">{errors.message}</p>}
            </div>

            <fieldset
                className="sm:col-span-2"
                aria-invalid={!!errors.sender}
                aria-describedby={`${id("sender-hint")}${errors.sender ? ` ${id("sender-err")}` : ""}`}
            >
                <legend className="text-sm font-medium text-ink">Who is writing?</legend>
                <div className="mt-2 grid border-t border-line">
                    {(
                        [
                            ["adult", "I am 18 or older"],
                            ["guardian", "I am a parent or legal guardian writing on behalf of someone under 18"],
                        ] as const
                    ).map(([value, label], i) => (
                        <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 border-b border-line py-3 has-[:checked]:border-signal has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal">
                            <input
                                id={i === 0 ? id("sender") : undefined}
                                type="radio"
                                name="sender"
                                value={value}
                                disabled={submitting}
                                checked={sender === value}
                                onChange={() => {
                                    setSender(value);
                                    clearError("sender");
                                    if (value === "adult") clearError("guardianConsent");
                                }}
                                className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-signal focus:outline-none"
                            />
                            <span className="text-base text-ink/90">{label}</span>
                        </label>
                    ))}
                </div>
                <p id={id("sender-hint")} className="mt-2 text-sm text-faint">
                    If you are under 18, please ask a parent or legal guardian to write to us for you.
                </p>
                {errors.sender && <p id={id("sender-err")} className="mt-1 text-sm text-destructive">{errors.sender}</p>}
            </fieldset>

            <div className="grid gap-4 sm:col-span-2">
                <ConsentCheckbox id={id("consent")} name="consent" error={errors.consent} disabled={submitting} onChange={() => clearError("consent")}>
                    I agree that {site.legal.name} may use my name, email address and message to reply to this enquiry, as
                    described in the{" "}
                    <Link href="/privacy" className="text-ink underline underline-offset-4 hover:text-signal">
                        Privacy Policy
                    </Link>
                    . I can withdraw my consent at any time.
                </ConsentCheckbox>
                {sender === "guardian" && (
                    <ConsentCheckbox
                        id={id("guardianConsent")}
                        name="guardianConsent"
                        error={errors.guardianConsent}
                        disabled={submitting}
                        onChange={() => clearError("guardianConsent")}
                    >
                        {GUARDIAN_CONSENT_TEXT}
                    </ConsentCheckbox>
                )}
            </div>

            {status === "error" && (
                <div role="alert" className="border-t-2 border-destructive pt-3 text-sm text-ink sm:col-span-2">
                    {failure}{" "}
                    You can also email us directly at{" "}
                    <a href={`mailto:${site.email}`} className="font-medium text-signal underline underline-offset-2">{site.email}</a>.
                </div>
            )}

            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-start">
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
                        <>
                            Send message
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

/** One checkbox style for every consent/confirmation on the site's forms: native, keyboard-accessible, required, never pre-ticked. */
function ConsentCheckbox({
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
                    required
                    disabled={disabled}
                    onChange={onChange}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-err` : undefined}
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                />
                <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-muted-ink">
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
