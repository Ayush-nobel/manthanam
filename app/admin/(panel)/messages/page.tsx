import type { Metadata } from "next";
import Link from "next/link";
import { updateMessage } from "@/app/admin/actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { NoAccess, PageTitle, StatusBadge, when } from "@/components/admin/format";
import { listMessages, PAGE_SIZE } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { can, MESSAGE_STATUSES, MESSAGE_STATUS_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Messages" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "messages.view")) return <NoAccess />;
    const sp = await searchParams;
    const f = { q: one(sp.q), status: one(sp.status), page: Math.max(1, Number(one(sp.page)) || 1) };
    const { rows, total } = await listMessages(f);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const edit = can(admin.role, "messages.edit");
    const qs = (page: number) => "?" + new URLSearchParams({ ...(f.q && { q: f.q }), ...(f.status && { status: f.status }), page: String(page) });

    return (
        <>
            <PageTitle>Contact messages</PageTitle>
            <form className="flex flex-wrap items-end gap-3 border-y border-line py-4" role="search">
                <label className="block min-w-[16rem] flex-1">
                    <span className="text-sm font-semibold">Search</span>
                    <input name="q" defaultValue={f.q} placeholder="Name, email, organisation or words in the message" className="mt-1 block min-h-11 w-full border border-line-strong bg-white px-3 text-base" />
                </label>
                <label className="block">
                    <span className="text-sm font-semibold">Status</span>
                    <select name="status" defaultValue={f.status} className="mt-1 block min-h-11 border border-line-strong bg-white px-3 text-base">
                        <option value="">Any</option>
                        {MESSAGE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {MESSAGE_STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit" className="min-h-11 bg-ink px-5 text-sm font-semibold text-paper hover:bg-signal-deep">
                    Show
                </button>
            </form>
            <p className="mt-4 text-sm text-muted-ink">{total === 0 ? "No messages." : `${total} message${total === 1 ? "" : "s"}`}</p>

            <ul className="mt-3 border-t border-ink">
                {rows.map((m) => (
                    <li key={m.id} className="grid gap-6 border-b border-line py-6 lg:grid-cols-[1fr_20rem]">
                        <article>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <h2 className="font-semibold text-ink">{m.name}</h2>
                                <StatusBadge status={m.status} kind="message" />
                                <span className="text-sm text-faint">{when(m.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-ink">
                                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic || "your message to Manthanam"}`)}`} className="underline underline-offset-4">
                                    {m.email}
                                </a>
                                {m.organisation && `, ${m.organisation}`}
                                {m.topic && `. About: ${m.topic}`}
                            </p>
                            <p className="mt-3 max-w-[65ch] text-base whitespace-pre-line break-words">{m.message}</p>
                        </article>
                        {edit && (
                            <ActionForm action={updateMessage} className="grid content-start gap-3">
                                <input type="hidden" name="id" value={m.id} />
                                <label className="text-sm font-semibold">
                                    Status
                                    <select name="status" defaultValue={m.status} className="mt-1 block min-h-10 w-full border border-line-strong bg-white px-2 text-sm font-normal">
                                        {MESSAGE_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {MESSAGE_STATUS_LABELS[s]}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm font-semibold">
                                    Notes
                                    <textarea name="notes" defaultValue={m.notes} rows={2} maxLength={5000} className="mt-1 block w-full border border-line-strong bg-white px-2 py-1 text-sm font-normal" />
                                </label>
                                <div>
                                    <Submit tone="quiet">Save</Submit>
                                </div>
                            </ActionForm>
                        )}
                    </li>
                ))}
            </ul>
            {pages > 1 && (
                <nav aria-label="Pages" className="mt-6 flex gap-4 text-sm">
                    {f.page > 1 && <Link href={`/admin/messages${qs(f.page - 1)}`} className="underline underline-offset-4">Previous</Link>}
                    <span className="text-muted-ink">Page {f.page} of {pages}</span>
                    {f.page < pages && <Link href={`/admin/messages${qs(f.page + 1)}`} className="underline underline-offset-4">Next</Link>}
                </nav>
            )}
        </>
    );
}
