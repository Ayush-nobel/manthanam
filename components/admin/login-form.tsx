"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { Submit } from "@/components/admin/action-form";
import { Field } from "@/components/admin/fields";

export function LoginForm() {
    const [state, action] = useActionState(signIn, {});
    return (
        <form action={action} className="grid gap-5">
            <Field label="Email address" name="email" type="email" autoComplete="username" required />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
            {state.error && (
                <p role="alert" className="text-sm text-signal">
                    {state.error}
                </p>
            )}
            <div>
                <Submit>Sign in</Submit>
            </div>
        </form>
    );
}
