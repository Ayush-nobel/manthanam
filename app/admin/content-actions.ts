"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { authorise } from "@/lib/auth";
import { audit, db } from "@/lib/db";
import { CATEGORIES } from "@/lib/insight-categories";
import { can } from "@/lib/permissions";
import { parseConference } from "@/lib/site-content";
import { slugify } from "@/lib/slug";

/**
 * Content editor actions. Writers (content.edit) write drafts and submit them; editors and owners
 * (content.publish) publish, send back with a note, unpublish, and edit the conference details.
 */

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function failed(what: string, err: { message?: string; code?: string } | null | undefined): FormState {
    console.error(`${what} failed:`, err?.code, err?.message);
    return { error: `${what} didn’t work. Try again in a minute; if it keeps failing, tell the website’s maintainer.` };
}

type Intent = "save" | "submit" | "publish" | "send_back" | "unpublish" | "delete";
const INTENTS: Intent[] = ["save", "submit", "publish", "send_back", "unpublish", "delete"];

export async function saveInsight(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("content.edit");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const editor = can(admin.role, "content.publish");
    const intent = String(form.get("intent") ?? "save") as Intent;
    if (!INTENTS.includes(intent)) return { error: "Unknown action." };
    if (["publish", "send_back", "unpublish"].includes(intent) && !editor) return { error: "Only an editor or owner can do that." };

    const id = str(form, "id", 64);
    let current: { status: string; slug: string; title: string } | null = null;
    if (id) {
        const { data } = await db().from("insights").select("status, slug, title").eq("id", id).maybeSingle();
        if (!data) return { error: "That article no longer exists." };
        current = data;
        // Writers can't change what's live; an editor has to.
        if (!editor && !["draft", "in_review"].includes(current.status)) return { error: "This article is published. Ask an editor to change it." };
    }

    if (intent === "delete") {
        if (!current) return { error: "Nothing to delete." };
        if (current.status === "published") return { error: "Unpublish it before deleting." };
        const { error } = await db().from("insights").delete().eq("id", id);
        if (error) return failed("Deleting", error);
        await audit(admin, "insight.delete", "insight", id, { title: current.title });
        redirect("/admin/content");
    }

    const title = str(form, "title", 200);
    const slug = slugify(str(form, "slug", 80) || title);
    const category = str(form, "category", 40);
    const summary = str(form, "summary", 400);
    const body = str(form, "body", 100_000);
    const authorName = str(form, "authorName", 120);
    const authorBio = str(form, "authorBio", 600);
    const displayDate = str(form, "displayDate", 10);
    const reviewNote = str(form, "reviewNote", 1000);

    if (!title) return { error: "Give the article a title." };
    if (!slug) return { error: "The web address needs some letters or numbers." };
    if (!CATEGORIES.some((c) => c.name === category)) return { error: "Choose a category." };
    if (displayDate && !ISO.test(displayDate)) return { error: "Enter the date as a date." };
    if (["submit", "publish"].includes(intent)) {
        const missing = [!authorName && "the author", !summary && "a summary", body.length < 200 && "the article itself (at least a few paragraphs)"].filter(Boolean);
        if (missing.length) return { error: `Before it can go ${intent === "publish" ? "live" : "for review"}, add ${missing.join(", ")}.` };
    }
    if (intent === "send_back" && !reviewNote) return { error: "Write a note telling the writer what to change." };

    const status =
        intent === "submit" ? "in_review" : intent === "publish" ? "published" : intent === "send_back" ? "draft" : intent === "unpublish" ? "archived" : (current?.status ?? "draft");
    const record: Record<string, unknown> = {
        title,
        slug,
        category,
        summary,
        body,
        author_name: authorName,
        author_bio: authorBio,
        display_date: displayDate || null,
        status,
        updated_by: admin.id,
    };
    if (intent === "send_back") record.review_note = reviewNote;
    if (intent === "submit" || intent === "publish") record.review_note = "";
    if (intent === "publish") {
        record.published_by = admin.id;
        record.published_at = new Date().toISOString();
        if (!displayDate) record.display_date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    }

    let savedId = id;
    if (current) {
        const { error } = await db().from("insights").update(record).eq("id", id);
        if (error?.code === "23505") return { error: `Another article already uses the address /insights/${slug}. Change the web address.` };
        if (error) return failed("Saving", error);
    } else {
        const { data, error } = await db().from("insights").insert({ ...record, created_by: admin.id }).select("id").single();
        if (error?.code === "23505") return { error: `Another article already uses the address /insights/${slug}. Change the web address.` };
        if (error) return failed("Saving", error);
        savedId = data.id as string;
    }

    const action = intent === "save" ? (current ? "insight.edit" : "insight.create") : `insight.${intent}`;
    await audit(admin, action, "insight", savedId, { title, ...(intent === "send_back" ? { note: reviewNote } : {}) });
    // Anything that changes what the public sees refreshes the Insights pages.
    if (intent === "publish" || intent === "unpublish" || current?.status === "published" || (current && current.slug !== slug)) updateTag("insights");

    if (!current) redirect(`/admin/content/insights/${savedId}`);
    refresh();
    const said: Record<Intent, string> = {
        save: status === "published" ? "Saved. The live article updates within about a minute." : "Draft saved.",
        submit: "Submitted for review. An editor will publish it or send it back with a note.",
        publish: `Published at /insights/${slug}. It appears on the site within about a minute.`,
        send_back: "Sent back to the writer with your note.",
        unpublish: "Unpublished. It disappears from the site within about a minute.",
        delete: "",
    };
    return { ok: said[intent] };
}

// Conference details ----------------------------------------------------------------------------------

/** Rows from the repeated inputs (speaker_name_0, speaker_role_0, …), in the order of their Order field. */
function rows(form: FormData, prefix: string, fields: string[]) {
    const out: { order: number; values: Record<string, string> }[] = [];
    for (let i = 0; i < 100; i++) {
        if (!form.has(`${prefix}_${fields[0]}_${i}`)) break;
        const values = Object.fromEntries(fields.map((f) => [f, String(form.get(`${prefix}_${f}_${i}`) ?? "").trim()]));
        if (Object.values(values).every((v) => !v)) continue;
        out.push({ order: Number(form.get(`${prefix}_order_${i}`)) || (i + 1) * 10, values });
    }
    return out.sort((a, b) => a.order - b.order).map((r) => r.values);
}

export async function saveConference(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("content.publish");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const date = (k: string) => {
        const v = String(form.get(k) ?? "").trim();
        return ISO.test(v) ? v : null;
    };
    const raw = {
        registrationOpen: form.get("registrationOpen") === "on",
        venue: String(form.get("venue") ?? ""),
        deadline: date("deadline"),
        cancellationDeadline: date("cancellationDeadline"),
        paymentDetailsBy: date("paymentDetailsBy"),
        theme: String(form.get("theme") ?? ""),
        expected: String(form.get("expected") ?? ""),
        fees: rows(form, "fee", ["category", "amount", "note"]).map((r) => ({ category: r.category, note: r.note, amount: Number(r.amount.replace(/[^\d.]/g, "")) })),
        included: rows(form, "inc", ["text"]).map((r) => r.text),
        speakers: rows(form, "spk", ["name", "role"]),
        agenda: rows(form, "agd", ["time", "title", "detail"]),
        faqs: rows(form, "faq", ["q", "a"]),
    };
    const badFee = raw.fees.find((f) => !f.category || !Number.isFinite(f.amount));
    if (badFee) return { error: "Each fee needs a category and an amount in rupees." };
    const value = parseConference(raw);
    const { error } = await db().from("site_content").upsert({ key: "conference", value, updated_by: admin.id });
    if (error) return failed("Saving", error);
    await audit(admin, "conference.update", "site_content", "conference");
    updateTag("conference");
    refresh();
    return { ok: "Saved. manthanam.in/register shows the changes within about a minute." };
}
