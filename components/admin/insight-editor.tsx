"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveInsight } from "@/app/admin/content-actions";
import Markdown from "@/components/markdown";
import { CATEGORIES } from "@/lib/insight-categories";
import { slugify } from "@/lib/slug";

export interface EditorValues {
    id?: string;
    title: string;
    slug: string;
    category: string;
    summary: string;
    body: string;
    authorName: string;
    authorBio: string;
    displayDate: string;
    status: string;
    reviewNote: string;
}

const control = "mt-1.5 block w-full border border-line-strong bg-white px-3 py-2 text-base text-ink focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal";
const label = "text-sm font-semibold text-ink";

/** Write or edit an article. Which buttons appear depends on the article's status and the person's role. */
export function InsightEditor({ initial, canPublish }: { initial: EditorValues; canPublish: boolean }) {
    const [state, action] = useActionState(saveInsight, {});
    const [title, setTitle] = useState(initial.title);
    const [slug, setSlug] = useState(initial.slug);
    const [slugTouched, setSlugTouched] = useState(!!initial.slug);
    const [body, setBody] = useState(initial.body);
    const [tab, setTab] = useState<"write" | "preview">("write");
    const [note, setNote] = useState("");
    const s = initial.status;
    const locked = !canPublish && (s === "published" || s === "archived");
    const shownSlug = slugTouched ? slug : slugify(title);

    return (
        <form action={action} className="grid gap-8 lg:grid-cols-12">
            {initial.id && <input type="hidden" name="id" value={initial.id} />}
            <div className="grid content-start gap-6 lg:col-span-8">
                <label className="block">
                    <span className={label}>Title</span>
                    <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required disabled={locked} className={`${control} min-h-12 font-display text-xl font-semibold [font-stretch:112%]`} />
                </label>
                <label className="block">
                    <span className={label}>Summary</span>
                    <span className="block text-sm text-faint">One or two sentences, shown on the Insights list and in search results.</span>
                    <textarea name="summary" defaultValue={initial.summary} maxLength={400} rows={2} disabled={locked} className={control} />
                </label>

                <div>
                    <div className="flex items-end justify-between gap-4">
                        <span className={label}>Article</span>
                        <div role="tablist" aria-label="Editor view" className="flex text-sm">
                            {(["write", "preview"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === t}
                                    onClick={() => setTab(t)}
                                    className={`min-h-9 border-b-2 px-3 font-semibold ${tab === t ? "border-signal text-ink" : "border-transparent text-muted-ink hover:text-ink"}`}
                                >
                                    {t === "write" ? "Write" : "Preview"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea
                        name="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={26}
                        maxLength={100_000}
                        disabled={locked}
                        hidden={tab !== "write"}
                        className={`${control} font-mono text-[0.95rem] leading-relaxed`}
                    />
                    {tab === "preview" && (
                        <div className="mt-1.5 min-h-[30rem] border border-line-strong bg-white px-6 py-4 text-lg">
                            {body.trim() ? <Markdown>{body}</Markdown> : <p className="text-faint">Nothing written yet.</p>}
                        </div>
                    )}
                    <details className="mt-2 text-sm text-muted-ink">
                        <summary className="cursor-pointer">Formatting help</summary>
                        <p className="mt-2">
                            Leave a blank line between paragraphs. <code>## Heading</code> for a section heading, <code>**bold**</code>, <code>*italic*</code>,{" "}
                            <code>[link text](https://…)</code>, <code>- item</code> for a list, <code>&gt; quote</code> for a quotation. Pasting from Word or Google Docs
                            keeps the text; redo headings and links with the marks above.
                        </p>
                    </details>
                </div>
            </div>

            <aside className="grid content-start gap-6 lg:col-span-4">
                <div className="grid gap-5 border-[5px] border-double border-ink bg-white px-5 py-5">
                    {initial.reviewNote && s === "draft" && (
                        <div className="border-l-4 border-signal bg-paper px-3 py-2 text-sm">
                            <p className="font-semibold text-ink">Editor’s note</p>
                            <p className="mt-1 whitespace-pre-line text-muted-ink">{initial.reviewNote}</p>
                        </div>
                    )}
                    <label className="block">
                        <span className={label}>Category</span>
                        <select name="category" defaultValue={initial.category || "Commentary"} disabled={locked} className={`${control} min-h-11`}>
                            {CATEGORIES.map((c) => (
                                <option key={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className={label}>Author</span>
                        <input name="authorName" defaultValue={initial.authorName} maxLength={120} disabled={locked} className={`${control} min-h-11`} />
                    </label>
                    <label className="block">
                        <span className={label}>About the author</span>
                        <span className="block text-sm text-faint">Optional. One or two sentences.</span>
                        <textarea name="authorBio" defaultValue={initial.authorBio} maxLength={600} rows={3} disabled={locked} className={control} />
                    </label>
                    <label className="block">
                        <span className={label}>Date shown on the article</span>
                        <span className="block text-sm text-faint">Leave empty to use the day it’s published.</span>
                        <input type="date" name="displayDate" defaultValue={initial.displayDate} disabled={locked} className={`${control} min-h-11 [color-scheme:light]`} />
                    </label>
                    <label className="block">
                        <span className={label}>Web address</span>
                        <span className="mt-1 flex items-center text-sm text-faint">
                            manthanam.in/insights/
                            <input
                                name="slug"
                                value={shownSlug}
                                onChange={(e) => {
                                    setSlugTouched(true);
                                    setSlug(e.target.value);
                                }}
                                onBlur={() => setSlug(slugify(shownSlug))}
                                maxLength={80}
                                disabled={locked}
                                className="ml-1 min-h-9 flex-1 border border-line-strong bg-white px-2 text-sm text-ink"
                            />
                        </span>
                    </label>
                    {locked && <input type="hidden" name="slug" value={initial.slug} />}
                </div>

                <div className="grid gap-3">
                    {locked ? (
                        <p className="text-sm text-muted-ink">This article is published. Ask an editor to make changes.</p>
                    ) : (
                        <>
                            {(s === "draft" || s === "in_review" || canPublish) && <Btn intent="save">{s === "published" ? "Save changes to the live article" : "Save draft"}</Btn>}
                            {!canPublish && s === "draft" && <Btn intent="submit" tone="primary">Submit for review</Btn>}
                            {canPublish && s !== "published" && <Btn intent="publish" tone="primary">Publish</Btn>}
                            {canPublish && s === "in_review" && (
                                <div className="grid gap-2 border-t border-line pt-3">
                                    <label className="block">
                                        <span className={label}>Note to the writer</span>
                                        <textarea name="reviewNote" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className={control} />
                                    </label>
                                    <Btn intent="send_back">Send back with note</Btn>
                                </div>
                            )}
                            {canPublish && s === "published" && <Btn intent="unpublish" confirm="Take this article off the website? It goes back to the list as Unpublished.">Unpublish</Btn>}
                            {initial.id && s !== "published" && <Btn intent="delete" tone="danger" confirm="Delete this article for good?">Delete</Btn>}
                        </>
                    )}
                    {(state.error || state.ok) && (
                        <p role={state.error ? "alert" : "status"} className={`text-sm ${state.error ? "text-signal" : "text-ink"}`}>
                            {state.error ?? state.ok}
                        </p>
                    )}
                </div>
            </aside>
        </form>
    );
}

function Btn({ intent, children, tone = "quiet", confirm }: { intent: string; children: React.ReactNode; tone?: "primary" | "quiet" | "danger"; confirm?: string }) {
    const { pending } = useFormStatus();
    const look = {
        primary: "bg-ink text-paper hover:bg-signal-deep",
        quiet: "border border-ink text-ink hover:bg-paper-2",
        danger: "text-signal underline underline-offset-4 justify-start px-0",
    }[tone];
    return (
        <button
            type="submit"
            name="intent"
            value={intent}
            disabled={pending}
            onClick={(e) => {
                if (confirm && !window.confirm(confirm)) e.preventDefault();
            }}
            className={`inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60 ${look}`}
        >
            {pending ? "Working…" : children}
        </button>
    );
}
