"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { authorise } from "@/lib/auth";
import { audit, db } from "@/lib/db";
import { offerEmailHtml, offerEmailSubject } from "@/lib/letters/email";
import { LETTER_STATUSES, LETTER_STATUS_LABELS, readLetterForm, todayInIndia, type LetterErrors, type LetterStatus } from "@/lib/letters/model";
import { letterFileName, renderLetterPdf } from "@/lib/letters/pdf";
import { getLetterRow, getLetterSettings, newVerifyCode, toIssued, type OfferLetterRow } from "@/lib/letters/store";
import { rateLimiter } from "@/lib/request-guard";
import { mailConfigured, sendOfferLetterEmail } from "@/lib/zoho-mail";

/**
 * Offer letters (owners only, letters.manage): issue and email one, send it again, record the answer,
 * and set who signs them. Each action checks the role itself: a server action is a public endpoint.
 */

export interface LetterFormState extends FormState {
    errors?: LetterErrors;
}

function failed(what: string, err: { message?: string } | null | undefined): FormState {
    console.error(`${what} failed:`, err?.message);
    return { error: `${what} didn’t work. Try again in a minute; if it keeps failing, tell the website’s maintainer.` };
}

// 30 letters an hour per admin (per server instance), on top of the mail limits in lib/zoho-mail.ts.
const lettersPerAdmin = rateLimiter(30, 60 * 60_000);

/** Builds the PDF and emails it. Throws if the email couldn't go. */
async function emailLetter(row: OfferLetterRow) {
    const settings = await getLetterSettings();
    const letter = toIssued(row);
    const pdf = await renderLetterPdf(letter, settings.signature);
    await sendOfferLetterEmail({ to: row.email, subject: offerEmailSubject(letter), html: offerEmailHtml(letter), fileName: letterFileName(letter), pdf });
}

function mailProblem(err: unknown) {
    const message = (err as Error).message ?? "";
    console.error("Offer letter email failed:", message);
    return /limit/i.test(message) ? "the email limit for this address or this hour was reached" : "the email service didn’t accept it";
}

/** Issues a new letter: saves it, numbers it, builds the PDF and emails it. Then opens the letter's page. */
export async function sendOfferLetter(_: LetterFormState, form: FormData): Promise<LetterFormState> {
    const auth = await authorise("letters.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const read = readLetterForm(form);
    if (read.errors) return { errors: read.errors, error: "Check the highlighted fields." };
    const l = read.letter;
    if (!mailConfigured()) return { error: "Email isn’t set up on this server, so letters can’t be sent from here." };
    if (l.respondBy < todayInIndia()) return { errors: { respondBy: "This date has passed." }, error: "Check the highlighted fields." };
    if (lettersPerAdmin(admin.id)) return { error: "You’ve issued a lot of letters in the last hour. Try again later." };

    const settings = await getLetterSettings();
    const applicationId = String(form.get("applicationId") ?? "");
    const { data: row, error } = await db()
        .from("offer_letters")
        .insert({
            verify_code: newVerifyCode(),
            kind: l.kind,
            full_name: l.fullName,
            email: l.email,
            position: l.position,
            department: l.department,
            start_date: l.startDate,
            end_date: l.endDate,
            commitment: l.commitment,
            work_mode: l.workMode,
            location: l.location,
            compensation: l.compensation,
            reporting_to: l.reportingTo,
            benefits: l.benefits,
            additional_terms: l.additionalTerms,
            respond_by: l.respondBy,
            signatory_name: settings.signatoryName || admin.name || admin.email,
            signatory_title: settings.signatoryName ? settings.signatoryTitle : "",
            application_id: /^[0-9a-f-]{36}$/i.test(applicationId) ? applicationId : null,
            created_by: admin.id,
            created_by_email: admin.email,
        })
        .select("*")
        .single<OfferLetterRow>();
    if (error || !row) return failed("Saving the letter", error);

    let sent = false;
    try {
        await emailLetter(row);
        sent = true;
    } catch (err) {
        await audit(admin, "letter.unsent", "offer_letter", row.id, { reference: row.reference, to: row.email, why: mailProblem(err) });
    }
    if (sent) {
        await db().from("offer_letters").update({ status: "sent", email_sent_at: new Date().toISOString() }).eq("id", row.id);
        await audit(admin, "letter.send", "offer_letter", row.id, { reference: row.reference, to: row.email });
    }
    redirect(`/admin/letters/${row.id}${sent ? "?sent=1" : "?unsent=1"}`);
}

/** Emails an existing letter again (the same letter number and code). */
export async function resendOfferLetter(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("letters.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const row = await getLetterRow(String(form.get("id") ?? ""));
    if (!row) return { error: "That letter no longer exists." };
    if (row.status === "withdrawn") return { error: "This offer was withdrawn. Change its status first if you really want to send it." };
    if (!mailConfigured()) return { error: "Email isn’t set up on this server." };
    if (lettersPerAdmin(admin.id)) return { error: "You’ve sent a lot of letters in the last hour. Try again later." };
    try {
        await emailLetter(row);
    } catch (err) {
        return { error: `Not sent: ${mailProblem(err)}. Try again later.` };
    }
    await db()
        .from("offer_letters")
        .update({ status: row.status === "not_sent" ? "sent" : row.status, email_sent_at: new Date().toISOString() })
        .eq("id", row.id);
    await audit(admin, "letter.resend", "offer_letter", row.id, { reference: row.reference, to: row.email });
    refresh();
    return { ok: `Sent to ${row.email}.` };
}

/** Records their answer (accepted, declined) or withdraws the offer, and keeps notes. */
export async function updateLetter(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("letters.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const row = await getLetterRow(String(form.get("id") ?? ""));
    if (!row) return { error: "That letter no longer exists." };
    const status = String(form.get("status") ?? "") as LetterStatus;
    const notes = String(form.get("notes") ?? "").trim().slice(0, 5000);
    if (!(LETTER_STATUSES as readonly string[]).includes(status)) return { error: "Choose a status." };
    if (status === "not_sent" && row.status !== "not_sent") return { error: "A letter that has been emailed can’t go back to Not sent." };
    const { error } = await db().from("offer_letters").update({ status, notes }).eq("id", row.id);
    if (error) return failed("Saving", error);
    if (status !== row.status) await audit(admin, "letter.status", "offer_letter", row.id, { reference: row.reference, status: [LETTER_STATUS_LABELS[row.status], LETTER_STATUS_LABELS[status]] });
    refresh();
    return { ok: "Saved." };
}

const MAX_SIGNATURE_BYTES = 300 * 1024;

/** Who signs the letters, and an optional image of their signature (PNG or JPEG, up to 300 KB). */
export async function saveLetterSettings(_: FormState, form: FormData): Promise<FormState> {
    const auth = await authorise("letters.manage");
    if (auth.error !== undefined) return { error: auth.error };
    const admin = auth.admin;
    const current = await getLetterSettings();
    const signatoryName = String(form.get("signatoryName") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
    const signatoryTitle = String(form.get("signatoryTitle") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
    if (!signatoryName) return { error: "Enter the name of the person who signs the letters." };

    let signature = form.get("removeSignature") === "on" ? null : current.signature;
    const file = form.get("signature");
    if (file instanceof File && file.size > 0) {
        if (file.size > MAX_SIGNATURE_BYTES) return { error: "The signature image is too large. Use a PNG or JPEG under 300 KB." };
        const bytes = new Uint8Array(await file.arrayBuffer());
        // Trust the file's first bytes, not its name or the type the browser claims.
        const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
        const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
        if (!png && !jpeg) return { error: "The signature must be a PNG or JPEG image." };
        signature = `data:image/${png ? "png" : "jpeg"};base64,${Buffer.from(bytes).toString("base64")}`;
    }

    const { error } = await db()
        .from("site_content")
        .upsert({ key: "letters", value: { signatoryName, signatoryTitle, signature }, updated_by: admin.id });
    if (error) return failed("Saving", error);
    await audit(admin, "letters.settings", "site_content", "letters");
    refresh();
    return { ok: "Saved. New letters will be signed this way." };
}
