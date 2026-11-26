"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/admin/actions";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

/** A form bound to a server action, with its result (saved, error, or a one-time password) shown under it. */
export function ActionForm({
    action,
    children,
    className,
    confirm,
}: {
    action: Action;
    children: ReactNode;
    className?: string;
    /** Ask before sending, for changes that are hard to undo. */
    confirm?: string;
}) {
    const [state, formAction] = useActionState(action, {});
    return (
        <form
            action={formAction}
            className={className}
            onSubmit={(e) => {
                if (confirm && !window.confirm(confirm)) e.preventDefault();
            }}
        >
            {children}
            <Result state={state} />
        </form>
    );
}

function Result({ state }: { state: FormState }) {
    if (!state.error && !state.ok) return null;
    return (
        <div role={state.error ? "alert" : "status"} className="mt-3 text-sm">
            {state.error ? <p className="text-signal">{state.error}</p> : <p className="text-ink">{state.ok}</p>}
            {state.secret && <Secret value={state.secret} />}
        </div>
    );
}

function Secret({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="border border-ink bg-white px-3 py-2 font-mono text-base text-ink select-all">{value}</code>
            <button
                type="button"
                className="text-sm text-ink underline underline-offset-4 hover:text-signal"
                onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))}
            >
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

/** Submit button that shows it's working and can't be pressed twice. */
export function Submit({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "quiet" | "danger" }) {
    const { pending } = useFormStatus();
    const look = {
        primary: "bg-ink text-paper hover:bg-signal-deep",
        quiet: "border border-ink text-ink hover:bg-paper-2",
        danger: "border border-signal text-signal hover:bg-signal hover:text-white",
    }[tone];
    return (
        <button
            type="submit"
            disabled={pending}
            aria-disabled={pending}
            className={`inline-flex min-h-10 items-center px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60 ${look}`}
        >
            {pending ? "Working…" : children}
        </button>
    );
}

/**
 * A "select all" box for a list of checkboxes named `name` in the same form. Unticking any row clears it;
 * ticking every row ticks it, so it always tells the truth about the rows.
 */
export function SelectAll({ name, label }: { name: string; label: string }) {
    const [checked, setChecked] = useState(false);
    const boxes = (el: HTMLElement) => Array.from(el.closest("form")?.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${name}"]`) ?? []);
    return (
        <label className="inline-flex items-center gap-2 font-semibold text-ink">
            <input
                type="checkbox"
                checked={checked}
                className="size-5 accent-ink"
                ref={(el) => {
                    if (!el) return;
                    const form = el.closest("form");
                    const sync = () => {
                        const all = boxes(el);
                        const on = all.filter((b) => b.checked).length;
                        el.indeterminate = on > 0 && on < all.length;
                        setChecked(all.length > 0 && on === all.length);
                    };
                    form?.addEventListener("change", sync);
                    return () => form?.removeEventListener("change", sync);
                }}
                onChange={(e) => {
                    const on = e.currentTarget.checked;
                    for (const b of boxes(e.currentTarget)) b.checked = on;
                    e.currentTarget.indeterminate = false;
                    setChecked(on);
                }}
            />
            {label}
        </label>
    );
}
