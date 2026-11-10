import type { Metadata } from "next";
import { changeOwnPassword } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Field } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/format";
import { requireAdmin } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
    const admin = await requireAdmin();
    return (
        <>
            <PageTitle>Account</PageTitle>
            <dl className="max-w-xl border-t border-ink">
                {[
                    ["Name", admin.name || "—"],
                    ["Email", admin.email],
                    ["Role", `${ROLE_LABELS[admin.role].name}: ${ROLE_LABELS[admin.role].description}`],
                ].map(([k, v]) => (
                    <div key={k} className="grid gap-x-6 border-b border-line py-2.5 sm:grid-cols-[8rem_1fr]">
                        <dt className="text-sm text-muted-ink">{k}</dt>
                        <dd>{v}</dd>
                    </div>
                ))}
            </dl>

            <section aria-labelledby="pw" className="mt-12 max-w-md">
                <h2 id="pw" className="font-display text-lg font-[650]">Change password</h2>
                <p className="mt-1 text-sm text-faint">At least 12 characters. A few unrelated words works well.</p>
                <ActionForm action={changeOwnPassword} className="mt-4 grid gap-5">
                    <input type="text" name="username" autoComplete="username" defaultValue={admin.email} hidden readOnly />
                    <Field label="Current password" name="current" type="password" autoComplete="current-password" required />
                    <Field label="New password" name="next" type="password" autoComplete="new-password" minLength={12} required />
                    <Field label="New password again" name="confirm" type="password" autoComplete="new-password" minLength={12} required />
                    <div>
                        <Submit>Change password</Submit>
                    </div>
                </ActionForm>
            </section>
        </>
    );
}
