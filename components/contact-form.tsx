"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { site } from "@/lib/site";

// Must be referenced literally so Next.js inlines it into the browser bundle at build time.
const RAW_FORMSPREE_URL = process.env.NEXT_PUBLIC_FORMSPREE_URL?.trim();
// Submissions contain names, emails and messages: only ever send them over HTTPS.
const FORMSPREE_URL = RAW_FORMSPREE_URL?.startsWith("https://") ? RAW_FORMSPREE_URL : undefined;

const topics = ["General enquiry", "Joining Manthanam", "Research collaboration", "Media & speaking"] as const;

type Field = "name" | "email" | "message" | "sender" | "consent" | "guardianConsent";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "submitting" | "success" | "error";
type Sender = "adult" | "guardian";
/** Order used to move focus to the first problem. */
const FIELDS: Field[] = ["name", "email", "message", "sender", "consent", "guardianConsent"];

// Consent wording — sent with every submission as the consent record (DPDP Act s.6; Rules r.3).
// If you change these texts, also bump PRIVACY_POLICY_VERSION to the Privacy Policy's "updated" date.
const PRIVACY_POLICY_VERSION = "2026-11-05";
const CONSENT_TEXT = `I agree that ${site.legal.name} may use my name, email address and message to reply to this enquiry, as described in the Privacy Policy. I can withdraw my consent at any time.`;
const GUARDIAN_CONSENT_TEXT =
    "I am the parent or legal guardian of the person under 18 I am writing about. I consent to Manthanam using any details about them that I include in this message to reply to me, and I understand Manthanam will verify my identity before acting on them.";

/** Formspree's JSON error shape: { errors: [{ field?, code?, message }] } */
interface FormspreeError {
    field?: string;
    code?: string;
    message: string;
}

function validate(data: FormData): Errors {
    const errors: Errors = {};
    const sender = data.get("sender");
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name) errors.name = "Please enter your name.";
    if (!email) errors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter an email address like name@example.com.";
    if (name.length > 100) errors.name = "Please keep your name under 100 characters.";
    if (email.length > 254) errors.email = "That email address is too long.";
    if (message.length < 10) errors.message = "Please write a short message (at least 10 characters).";
    else if (message.length > 5000) errors.message = "Please keep your message under 5,000 characters.";
    if (sender !== "adult" && sender !== "guardian") errors.sender = "Please tell us who is writing.";
    if (data.get("consent") !== "yes") errors.consent = "Please tick this box so we can use your details to reply.";
    if (sender === "guardian" && data.get("guardianConsent") !== "yes")
        errors.guardianConsent = "Please confirm you are the parent or legal guardian and give consent.";
    return errors;
}

const inputBase =
    "mt-2 block w-full rounded-xl border bg-ink px-4 py-3 text-base text-paper placeholder:text-faint transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60 disabled:opacity-60";

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
    const border = (f: Field) => (errors[f] ? "border-destructive" : "border-line focus:border-saffron/60");

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
        if (String(data.get("company_website") ?? "") !== "") {
            setStatus("success");
            return;
        }

        if (!FORMSPREE_URL) {
            console.error(
                RAW_FORMSPREE_URL
                    ? "NEXT_PUBLIC_FORMSPREE_URL must start with https:// — refusing to send the form over an insecure connection."
                    : "NEXT_PUBLIC_FORMSPREE_URL is not set — add it to .env.local (see .env.example).",
            );
            setFailure("The contact form isn’t connected yet.");
            setStatus("error");
            return;
        }

        const topic = String(data.get("topic"));
        const who = data.get("sender") === "guardian" ? "guardian" : "adult";
        const payload = {
            name: String(data.get("name")).trim(),
            email: String(data.get("email")).trim(), // Formspree uses this as the reply-to address
            topic,
            message: String(data.get("message")).trim(),
            sender: who === "guardian" ? "Parent or legal guardian writing for someone under 18" : "Adult (18 or older)",
            // Consent record: exactly what was agreed, to which policy version, and when.
            consent: CONSENT_TEXT,
            ...(who === "guardian" ? { guardianConsent: GUARDIAN_CONSENT_TEXT } : {}),
            privacyPolicyVersion: PRIVACY_POLICY_VERSION,
            consentedAt: new Date().toISOString(),
            _subject: `[${topic}]${who === "guardian" ? " [Guardian — verify identity]" : ""} New message via manthanam.in`,
        };

        setStatus("submitting");
        try {
            const res = await fetch(FORMSPREE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                formRef.current?.reset();
                setSender(null);
                setStatus("success");
                return;
            }

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
            const formLevel = list.filter((err) => !err.field).map((err) => err.message).join(" ");
            setFailure(formLevel || "We couldn’t send your message right now.");
            setStatus("error");
        } catch {
            setFailure("We couldn’t send your message — please check your connection and try again.");
            setStatus("error");
        }
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
                className="rounded-2xl border border-line bg-ink-2 p-8 outline-none sm:p-10"
            >
                <CircleCheck className="h-8 w-8 text-saffron" aria-hidden="true" strokeWidth={1.5} />
                <h3 className="mt-5 font-serif text-3xl text-paper">Thank you — message received.</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-muted-ink">
                    We read every message and will reply to the email address you gave us.
                </p>
                <p className="mt-3 max-w-md text-sm text-faint">
                    Want your message deleted later? Email{" "}
                    <a href={`mailto:${site.email}?subject=Privacy%20request`} className="text-muted-ink underline underline-offset-4 hover:text-saffron">
                        {site.email}
                    </a>{" "}
                    — see our{" "}
                    <Link href="/privacy" className="text-muted-ink underline underline-offset-4 hover:text-saffron">Privacy Policy</Link>.
                </p>
                <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-8 inline-flex min-h-11 cursor-pointer items-center rounded-full bg-white/5 px-5 py-3 text-sm font-medium text-paper ring-1 ring-white/15 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
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
            className="relative grid gap-6 rounded-2xl border border-line bg-ink-2 p-6 sm:grid-cols-2 sm:p-8"
        >
            {/* Honeypot: hidden from people and assistive tech; bots that fill every field reveal themselves. */}
            <div aria-hidden="true" className="absolute left-0 top-0 h-px w-px overflow-hidden opacity-0 pointer-events-none">
                <label htmlFor={id("hp")}>Company website (leave blank)</label>
                <input id={id("hp")} type="text" name="company_website" tabIndex={-1} autoComplete="off" />
            </div>

            <div>
                <label htmlFor={id("name")} className="text-sm font-medium text-paper">Name</label>
                <input
                    id={id("name")} name="name" type="text" autoComplete="name" maxLength={100} disabled={submitting}
                    aria-invalid={!!errors.name} aria-describedby={errors.name ? id("name-err") : undefined}
                    onChange={() => clearError("name")}
                    className={`${inputBase} ${border("name")}`}
                />
                {errors.name && <p id={id("name-err")} className="mt-2 text-sm text-destructive">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor={id("email")} className="text-sm font-medium text-paper">Email</label>
                <input
                    id={id("email")} name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} disabled={submitting}
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? id("email-err") : undefined}
                    onChange={() => clearError("email")}
                    className={`${inputBase} ${border("email")}`}
                />
                {errors.email && <p id={id("email-err")} className="mt-2 text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="sm:col-span-2">
                <label htmlFor={id("topic")} className="text-sm font-medium text-paper">Topic</label>
                <select
                    id={id("topic")} name="topic" defaultValue={topics[0]} disabled={submitting}
                    className={`${inputBase} border-line focus:border-saffron/60 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23a8a196' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[position:right_1rem_center] bg-no-repeat pr-10`}
                >
                    {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="sm:col-span-2">
                <label htmlFor={id("message")} className="text-sm font-medium text-paper">Message</label>
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
                <legend className="text-sm font-medium text-paper">Who is writing?</legend>
                <div className="mt-3 grid gap-3">
                    {(
                        [
                            ["adult", "I am 18 or older"],
                            ["guardian", "I am a parent or legal guardian writing on behalf of someone under 18"],
                        ] as const
                    ).map(([value, label], i) => (
                        <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-saffron/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-saffron/60">
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
                                className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-saffron focus:outline-none"
                            />
                            <span className="text-base text-paper/90">{label}</span>
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
                    <Link href="/privacy" className="text-paper underline underline-offset-4 hover:text-saffron">
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
                <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-paper sm:col-span-2">
                    {failure}{" "}
                    You can also email us directly at{" "}
                    <a href={`mailto:${site.email}`} className="font-medium text-saffron underline underline-offset-2">{site.email}</a>.
                </div>
            )}

            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-saffron px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-saffron-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron disabled:cursor-wait disabled:opacity-70"
                >
                    {submitting ? (
                        <>
                            Sending…
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        </>
                    ) : (
                        <>
                            Send message
                            <Send className="h-4 w-4" aria-hidden="true" />
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
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-saffron focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
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
