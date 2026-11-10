import type { Metadata } from "next";
import { addAdmin, changeAdminRole, removeAdmin, resetAdminPassword } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Field, Select } from "@/components/admin/fields";
import { NoAccess, PageTitle, when } from "@/components/admin/format";
import { listAdmins } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { can, isRole, ROLE_LABELS, ROLES } from "@/lib/permissions";

export const metadata: Metadata = { title: "Team" };

function RoleOptions() {
    return ROLES.map((r) => (
        <option key={r} value={r}>
            {ROLE_LABELS[r].name}: {ROLE_LABELS[r].description}
        </option>
    ));
}

export default async function TeamPage() {
    const admin = await requireAdmin();
    if (!can(admin.role, "team.manage")) return <NoAccess />;
    const admins = await listAdmins();

    return (
        <>
            <PageTitle>Team</PageTitle>
            <div className="grid gap-12 lg:grid-cols-12">
                <section className="lg:col-span-8" aria-labelledby="admins">
                    <h2 id="admins" className="sr-only">Admins</h2>
                    <ul className="border-t border-ink">
                        {admins.map((a) => {
                            const self = a.user_id === admin.id;
                            return (
                                <li key={a.user_id} className="grid gap-4 border-b border-line py-5 md:grid-cols-[1fr_auto]">
                                    <div>
                                        <p className="font-semibold text-ink">
                                            {a.name || a.email}
                                            {self && <span className="ml-2 text-sm font-normal text-faint">(you)</span>}
                                        </p>
                                        <p className="text-sm text-muted-ink">{a.email}</p>
                                        <p className="mt-1 text-sm text-faint">
                                            {isRole(a.role) ? ROLE_LABELS[a.role].name : a.role}, since {when(a.created_at)}
                                        </p>
                                    </div>
                                    {!self && (
                                        <div className="flex flex-wrap items-start gap-3">
                                            <ActionForm action={changeAdminRole} className="flex items-end gap-2">
                                                <input type="hidden" name="id" value={a.user_id} />
                                                <label>
                                                    <span className="sr-only">Role for {a.email}</span>
                                                    <select name="role" defaultValue={a.role} className="min-h-10 max-w-[11rem] border border-line-strong bg-white px-2 text-sm">
                                                        {ROLES.map((r) => (
                                                            <option key={r} value={r}>
                                                                {ROLE_LABELS[r].name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <Submit tone="quiet">Change role</Submit>
                                            </ActionForm>
                                            <ActionForm action={resetAdminPassword} confirm={`Give ${a.email} a new one-time password? Their current password stops working.`}>
                                                <input type="hidden" name="id" value={a.user_id} />
                                                <Submit tone="quiet">Reset password</Submit>
                                            </ActionForm>
                                            <ActionForm action={removeAdmin} confirm={`Remove ${a.email}? They will no longer be able to sign in.`}>
                                                <input type="hidden" name="id" value={a.user_id} />
                                                <Submit tone="danger">Remove</Submit>
                                            </ActionForm>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <dl className="mt-8 grid gap-3 text-sm">
                        {ROLES.map((r) => (
                            <div key={r} className="grid grid-cols-[8rem_1fr] gap-4">
                                <dt className="font-semibold">{ROLE_LABELS[r].name}</dt>
                                <dd className="text-muted-ink">{ROLE_LABELS[r].description}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="lg:col-span-4" aria-labelledby="add">
                    <div className="border-[5px] border-double border-ink bg-white px-6 py-6">
                        <h2 id="add" className="font-display text-lg font-[650]">Add an admin</h2>
                        <ActionForm action={addAdmin} className="mt-4 grid gap-5">
                            <Field label="Name" name="name" autoComplete="off" maxLength={100} />
                            <Field label="Email address" name="email" type="email" autoComplete="off" required />
                            <Select label="Role" name="role" defaultValue="viewer">
                                <RoleOptions />
                            </Select>
                            <p className="text-sm text-faint">They get a one-time password to sign in with, shown here once. Pass it on privately.</p>
                            <div>
                                <Submit>Add admin</Submit>
                            </div>
                        </ActionForm>
                    </div>
                </section>
            </div>
        </>
    );
}
