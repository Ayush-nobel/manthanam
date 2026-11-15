import { changeOwnPassword } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Field } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/format";

/** Shown in place of every admin page until someone who signed in with a one-time password sets their own. */
export function FirstPassword() {
    return (
        <section className="max-w-md">
            <PageTitle>Set your own password</PageTitle>
            <p className="text-base text-muted-ink">
                You signed in with a one-time password. Choose your own before using the dashboard. Use at least 12 characters; a few unrelated words works well.
            </p>
            <ActionForm action={changeOwnPassword} className="mt-6 grid gap-5">
                <Field label="One-time password" name="current" type="password" autoComplete="current-password" required />
                <Field label="New password" name="next" type="password" autoComplete="new-password" minLength={12} required />
                <Field label="New password again" name="confirm" type="password" autoComplete="new-password" minLength={12} required />
                <div>
                    <Submit>Set password</Submit>
                </div>
            </ActionForm>
        </section>
    );
}
