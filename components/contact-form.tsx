"use client";

import { useId, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { site } from "@/lib/site";

const topics = ["General enquiry", "Joining Manthanam", "Research collaboration", "Media & speaking"] as const;

type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

function validate(data: FormData): Errors {
    const errors: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name) errors.name = "Please enter your name.";
    if (!email) errors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter an email address like name@example.com.";
    if (message.length < 10) errors.message = "Please write a short message (at least 10 characters).";
    return errors;
}

const inputBase =
    "mt-2 block w-full rounded-xl border bg-ink px-4 py-3 text-base text-paper placeholder:text-faint transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60";

export default function ContactForm() {
    const uid = useId();
    const [errors, setErrors] = useState<Errors>({});
    const [sent, setSent] = useState(false);

    const id = (f: string) => `${uid}-${f}`;
    const border = (f: Field) => (errors[f] ? "border-destructive" : "border-line focus:border-saffron/60");

    function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const found = validate(data);
        setErrors(found);
        if (Object.keys(found).length) {
            const first = (["name", "email", "message"] as Field[]).find((f) => found[f]);
            if (first) document.getElementById(id(first))?.focus();
            return;
        }
        const topic = String(data.get("topic"));
        const body = `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`;
        window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(`[${topic}] Message via manthanam website`)}&body=${encodeURIComponent(body)}`;
        setSent(true);
    }

    function clearError(f: Field) {
        if (errors[f]) setErrors((prev) => ({ ...prev, [f]: undefined }));
    }

    return (
        <form noValidate onSubmit={onSubmit} className="grid gap-6 rounded-2xl border border-line bg-ink-2 p-6 sm:grid-cols-2 sm:p-8">
            <div>
                <label htmlFor={id("name")} className="text-sm font-medium text-paper">Name</label>
                <input
                    id={id("name")} name="name" type="text" autoComplete="name"
                    aria-invalid={!!errors.name} aria-describedby={errors.name ? id("name-err") : undefined}
                    onChange={() => clearError("name")}
                    className={`${inputBase} ${border("name")}`}
                />
                {errors.name && <p id={id("name-err")} className="mt-2 text-sm text-destructive">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor={id("email")} className="text-sm font-medium text-paper">Email</label>
                <input
                    id={id("email")} name="email" type="email" autoComplete="email" inputMode="email"
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? id("email-err") : undefined}
                    onChange={() => clearError("email")}
                    className={`${inputBase} ${border("email")}`}
                />
                {errors.email && <p id={id("email-err")} className="mt-2 text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="sm:col-span-2">
                <label htmlFor={id("topic")} className="text-sm font-medium text-paper">Topic</label>
                <select
                    id={id("topic")} name="topic" defaultValue={topics[0]}
                    className={`${inputBase} border-line focus:border-saffron/60 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23a8a196' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[position:right_1rem_center] bg-no-repeat pr-10`}
                >
                    {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="sm:col-span-2">
                <label htmlFor={id("message")} className="text-sm font-medium text-paper">Message</label>
                <textarea
                    id={id("message")} name="message" rows={5}
                    aria-invalid={!!errors.message}
                    aria-describedby={`${id("message-hint")}${errors.message ? ` ${id("message-err")}` : ""}`}
                    onChange={() => clearError("message")}
                    className={`${inputBase} ${border("message")} resize-y`}
                />
                <p id={id("message-hint")} className="mt-2 text-sm text-faint">Tell us who you are and what you&rsquo;d like to discuss.</p>
                {errors.message && <p id={id("message-err")} className="mt-1 text-sm text-destructive">{errors.message}</p>}
            </div>

            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p aria-live="polite" className="text-sm text-muted-ink">
                    {sent ? "Your email app should now open with this message ready to send." : "Submitting opens your email app with the message filled in."}
                </p>
                <button
                    type="submit"
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-saffron px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-saffron-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
                >
                    Send message
                    <Send className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </form>
    );
}
