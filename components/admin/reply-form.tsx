"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { Submit } from "@/components/admin/action-form";

/**
 * Reply to a contact message by email. The text is kept if sending fails, and cleared once the email
 * has gone (React would otherwise reset the form after every submit, losing a long reply on an error).
 */
export function ReplyForm({
    action: send,
    id,
    to,
    from,
    open,
    quoted,
}: {
    /** replyToMessage or replyToApplication. */
    action: (state: FormState, form: FormData) => Promise<FormState>;
    id: string;
    to: string;
    from: string;
    open: boolean;
    /** What the email shows under the reply, e.g. "Their message is quoted". */
    quoted: string;
}) {
    const [body, setBody] = useState("");
    const [state, action] = useActionState<FormState, FormData>(async (prev, form) => {
        const result = await send(prev, form);
        if (result.ok) setBody("");
        return result;
    }, {});

    return (
        <details open={open} className="mt-4 max-w-[65ch] border border-line bg-white open:border-ink">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">Reply by email</summary>
            <form
                action={action}
                className="grid gap-3 border-t border-line px-4 py-4"
                onSubmit={(e) => {
                    if (!window.confirm(`Send this reply to ${to}? It can’t be taken back once sent.`)) e.preventDefault();
                }}
            >
                <input type="hidden" name="id" value={id} />
                <p className="text-sm text-muted-ink">
                    To <strong className="text-ink">{to}</strong>, from {from}. {quoted} Their answer will arrive in that mailbox.
                </p>
                <label className="text-sm font-semibold">
                    Your reply
                    <textarea
                        name="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                        rows={6}
                        maxLength={10000}
                        className="mt-1 block w-full border border-line-strong bg-white px-3 py-2 text-base font-normal"
                    />
                </label>
                <p className="text-xs text-faint">Sent in the same design as the registration email. Leave a blank line between paragraphs; your name and “Manthanam Research Foundation” are added as the signature.</p>
                <div>
                    <Submit>Send reply</Submit>
                </div>
                {(state.error || state.ok) && (
                    <p role={state.error ? "alert" : "status"} className={`text-sm ${state.error ? "text-signal" : "text-ink"}`}>
                        {state.error ?? state.ok}
                    </p>
                )}
            </form>
        </details>
    );
}
