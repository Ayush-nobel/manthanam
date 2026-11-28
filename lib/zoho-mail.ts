import "server-only";
import { applicationEmailHtml, applicationEmailSubject } from "@/lib/application-email";
import { isAmbassador, roleTitle } from "@/lib/application";
import { paymentEmailHtml, paymentEmailSubject, paymentReceivedEmailHtml, paymentReceivedEmailSubject, registrationEmailHtml, registrationEmailSubject, seatConfirmedEmailHtml, seatConfirmedEmailSubject, type PaymentEmail, type PaymentReceivedEmail, type SeatConfirmedEmail } from "@/lib/registration-email";
import { longDate, replyEmailHtml } from "@/lib/reply-email";
import { rateLimiter } from "@/lib/request-guard";
import { getConference } from "@/lib/site-content";
import { accessToken, forgetToken, zohoDataCentre, type ZohoCredentials } from "@/lib/zoho-sheet";

/**
 * Registration confirmation emails, sent through the Zoho Mail API from Manthanam's own mailbox.
 *
 * Needs a refresh token with the scopes ZohoMail.messages.CREATE and ZohoMail.accounts.READ, for the
 * Zoho user who owns the From address. If that is the same user as the Zoho Sheet, one token with
 * all four scopes does both; otherwise set the ZOHO_MAIL_* credentials separately.
 * Setup: docs/registration-sheet.md.
 */

const v = (s: string | undefined) => s?.trim() || undefined;
// Literal process.env.NAME references, so next.config.ts can bake them in at build time.
const FROM = v(process.env.ZOHO_MAIL_FROM) ?? "ayush.shukla@manthanam.in";
const ACCOUNT_ID = v(process.env.ZOHO_MAIL_ACCOUNT_ID);
// Where contact-form messages are emailed (comma-separated for several). Defaults to the From mailbox.
const CONTACT_TO = v(process.env.CONTACT_NOTIFY_TO) ?? FROM;
const CREDS: Partial<ZohoCredentials> = {
    clientId: v(process.env.ZOHO_MAIL_CLIENT_ID) ?? v(process.env.ZOHO_CLIENT_ID),
    clientSecret: v(process.env.ZOHO_MAIL_CLIENT_SECRET) ?? v(process.env.ZOHO_CLIENT_SECRET),
    refreshToken: v(process.env.ZOHO_MAIL_REFRESH_TOKEN) ?? v(process.env.ZOHO_REFRESH_TOKEN),
};
const creds = () => CREDS as ZohoCredentials;

/**
 * ZeptoMail (Zoho CPaaS), Zoho's service for transactional and bulk email: no mailbox hourly cap, so payment and
 * confirmation emails to every registrant go out without stalling. Set ZEPTOMAIL_TOKEN (the Mail Agent's API key,
 * "Zoho-enczapikey …" or just the key) and every email is sent through it; FROM must be on a domain verified in that
 * Mail Agent. Replies still go to FROM, the Zoho Mail inbox. ZEPTOMAIL_URL overrides the API address shown on the
 * agent's "API Setup" page (default: the Zoho CPaaS address for ZOHO_DC).
 */
const ZEPTO_TOKEN = v(process.env.ZEPTOMAIL_TOKEN)?.replace(/^Zoho-enczapikey\s+/i, "");
const ZEPTO_NAME = v(process.env.ZEPTOMAIL_FROM_NAME) ?? "Manthanam";
const zeptoUrl = () => v(process.env.ZEPTOMAIL_URL) ?? `https://cpaas.zoho.${zohoDataCentre()}/v1.1/email`;
export const zeptoConfigured = () => !!ZEPTO_TOKEN;
const base = () => `https://mail.zoho.${zohoDataCentre()}/api`;

export const mailConfigured = () => zeptoConfigured() || !!(CREDS.clientId && CREDS.clientSecret && CREDS.refreshToken);
export const mailFrom = () => FROM;

let accountId: string | undefined = ACCOUNT_ID;

interface MailAccount {
    accountId: string;
    primaryEmailAddress?: string;
    mailboxAddress?: string;
    incomingUserName?: string;
    emailAddress?: { mailId?: string }[];
    sendMailDetails?: { fromAddress?: string }[];
}
/** Every address an account can send as: primary, mailbox, aliases and send-as addresses. */
const addresses = (a: MailAccount) =>
    [a.primaryEmailAddress, a.mailboxAddress, a.incomingUserName, ...(a.emailAddress ?? []).map((e) => e.mailId), ...(a.sendMailDetails ?? []).map((d) => d.fromAddress)]
        .filter((x): x is string => !!x && x.includes("@"))
        .map((x) => x.toLowerCase());
/** a***@manthanam.in: enough to recognise an address in a public setup check without publishing it. */
const mask = (addr: string) => addr.replace(/^(.)[^@]*@/, "$1***@");

/** The Zoho Mail account that can send as FROM (looked up once, then remembered). */
async function account(): Promise<string> {
    if (accountId) return accountId;
    const token = await accessToken(creds());
    const res = await fetch(`${base()}/accounts`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
    });
    if (res.status === 401) forgetToken(creds());
    const body = (await res.json().catch(() => null)) as {
        status?: { code?: number; description?: string };
        data?: MailAccount[];
    } | null;
    if (!res.ok || !body?.data) throw new Error(`Zoho Mail accounts lookup failed: ${res.status} ${body?.status?.description ?? ""}`);
    const want = FROM.toLowerCase();
    const match = body.data.find((a) => addresses(a).includes(want));
    if (!match) {
        const owned = [...new Set(body.data.flatMap(addresses))].map(mask);
        throw new Error(`No Zoho Mail account for this token can send as ${FROM}. This Zoho login's addresses: ${owned.join(", ") || "none"}`);
    }
    accountId = String(match.accountId);
    return accountId;
}

// Ceiling on emails this server sends, so a flood of fake form posts can't turn Manthanam's mailbox into a
// spam cannon: 150 an hour per server instance in all, and 5 a day to any one address (registration, payment
// email, receipt, and a resend or two). Over the limit the
// email is skipped (the form entry is still saved) and the reason logged.
const allMail = rateLimiter(ZEPTO_TOKEN ? 1500 : 150, 60 * 60_000);
const perRecipient = rateLimiter(5, 24 * 60 * 60_000);

interface Attachment {
    storeName: string;
    attachmentPath: string;
    attachmentName: string;
}
/** A file to attach: sent inline (base64) through ZeptoMail, or uploaded first through Zoho Mail. */
interface FileToAttach {
    name: string;
    mimeType: string;
    bytes: Uint8Array;
}

type ZeptoErrorBody = { error_code?: string; code?: string; message?: string; details?: { code?: string; message?: string; target?: string }[] };
interface ZeptoError {
    // The docs show errors under "data"; the live API answers with "error". Read both.
    data?: ZeptoErrorBody;
    error?: ZeptoErrorBody;
    message?: string;
}
/** ZeptoMail's own explanation of a refusal, as readable as possible, never longer than 300 characters. */
function zeptoReason(status: number, raw: string): string {
    let e: ZeptoError | null = null;
    try {
        e = JSON.parse(raw) as ZeptoError;
    } catch {}
    const b = e?.error ?? e?.data;
    const details = b?.details?.map((d) => [d.code, d.message, d.target && `(${d.target})`].filter(Boolean).join(" ")).join("; ");
    const text = [b?.error_code ?? b?.code, b?.message ?? e?.message, details].filter(Boolean).join(" ");
    return `${status} ${text || raw.replace(/\s+/g, " ").slice(0, 200) || "no details"}`.slice(0, 300);
}

async function sendViaZepto(to: string, cc: string | undefined, subject: string, content: string, mailFormat: "html" | "plaintext", files: FileToAttach[]) {
    const addr = (a: string) => ({ email_address: { address: a } });
    const body = {
        from: { address: FROM, name: ZEPTO_NAME },
        to: [addr(to)],
        ...(cc ? { cc: [addr(cc)] } : {}),
        reply_to: [{ address: FROM, name: ZEPTO_NAME }],
        subject,
        ...(mailFormat === "html" ? { htmlbody: content } : { textbody: content }),
        ...(files.length ? { attachments: files.map((f) => ({ name: f.name, mime_type: f.mimeType, content: Buffer.from(f.bytes).toString("base64") })) } : {}),
    };
    const res = await fetch(zeptoUrl(), {
        method: "POST",
        headers: { Authorization: `Zoho-enczapikey ${ZEPTO_TOKEN}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
    });
    if (!res.ok) {
        const reason = zeptoReason(res.status, await res.text().catch(() => ""));
        console.error("ZeptoMail refused an email:", reason);
        throw new Error(`ZeptoMail send failed: ${reason}`);
    }
}

/** Uploads a file to Zoho Mail so the next email can carry it (Upload Attachment API, raw body). */
async function uploadAttachment(fileName: string, bytes: Uint8Array): Promise<Attachment> {
    const id = await account();
    const token = await accessToken(creds());
    const res = await fetch(`${base()}/accounts/${encodeURIComponent(id)}/messages/attachments?fileName=${encodeURIComponent(fileName)}`, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json", "Content-Type": "application/octet-stream" },
        body: bytes as BodyInit,
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
    });
    if (res.status === 401) forgetToken(creds());
    const body = (await res.json().catch(() => null)) as { status?: { description?: string }; data?: Attachment | Attachment[] } | null;
    const data = Array.isArray(body?.data) ? body.data[0] : body?.data;
    if (!res.ok || !data?.storeName || !data.attachmentPath) throw new Error(`Zoho Mail attachment upload failed: ${res.status} ${body?.status?.description ?? ""}`.trim());
    return { storeName: data.storeName, attachmentPath: data.attachmentPath, attachmentName: data.attachmentName || fileName };
}

async function send(to: string, cc: string | undefined, subject: string, content: string, mailFormat: "html" | "plaintext" = "html", files: FileToAttach[] = []) {
    if (to !== CONTACT_TO) {
        if (allMail("all")) throw new Error("Hourly email limit reached; email skipped.");
        for (const addr of [to, cc].filter((x): x is string => !!x)) if (perRecipient(addr.toLowerCase())) throw new Error("Daily limit for this recipient reached; email skipped.");
    }
    if (ZEPTO_TOKEN) return sendViaZepto(to, cc, subject, content, mailFormat, files);
    const attachments: Attachment[] = [];
    for (const f of files) attachments.push(await uploadAttachment(f.name, f.bytes));
    const id = await account();
    const token = await accessToken(creds());
    const res = await fetch(`${base()}/accounts/${encodeURIComponent(id)}/messages`, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ fromAddress: FROM, toAddress: to, ...(cc ? { ccAddress: cc } : {}), subject, content, mailFormat, encoding: "UTF-8", ...(attachments.length ? { attachments } : {}) }),
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
    });
    if (res.status === 401) forgetToken(creds());
    if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { status?: { description?: string }; data?: { moreInfo?: string } } | null;
        throw new Error(`Zoho Mail send failed: ${res.status} ${body?.status?.description ?? ""} ${body?.data?.moreInfo ?? ""}`.trim());
    }
}

/** Thank-you email with the registration number (HTML, see lib/registration-email.ts). A parent or guardian, if given, is copied in. */
export async function sendRegistrationEmail(r: { name: string; email: string; reference: string; guardianEmail?: string }) {
    const c = await getConference();
    const html = registrationEmailHtml({ name: r.name, reference: r.reference, minor: !!r.guardianEmail, venue: c.venue, paymentDetailsBy: c.paymentDetailsBy });
    await send(r.email, r.guardianEmail, registrationEmailSubject(r), html);
}

/** The payment request with the personal proof-of-payment link (lib/registration-email.ts). A parent or guardian, if given, is copied in. */
export async function sendPaymentEmail(r: PaymentEmail & { email: string; guardianEmail?: string }) {
    await send(r.email, r.guardianEmail, paymentEmailSubject(r), paymentEmailHtml(r));
}

/** "We've received your payment details", sent automatically when the proof-of-payment form is submitted. */
export async function sendPaymentReceivedEmail(r: PaymentReceivedEmail & { email: string; guardianEmail?: string }) {
    await send(r.email, r.guardianEmail, paymentReceivedEmailSubject(r), paymentReceivedEmailHtml(r));
}

/** "Your place is confirmed", sent when an admin confirms the seat after checking the payment. */
export async function sendSeatConfirmedEmail(r: SeatConfirmedEmail & { email: string; guardianEmail?: string }) {
    await send(r.email, r.guardianEmail, seatConfirmedEmailSubject(r), seatConfirmedEmailHtml(r));
}

/** "We've received your application" email to an internship applicant. */
export async function sendApplicationEmail(a: { name: string; email: string; role: string; code?: string | null; guardianEmail?: string }) {
    await send(a.email, a.guardianEmail, applicationEmailSubject(a.role), applicationEmailHtml(a));
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Tells the team a contact message arrived. Reply with the button: replying to this email would go to ourselves. */
export async function sendContactNotification(m: { name: string; email: string; topic: string; message: string; guardian: boolean; adminUrl?: string }) {
    const reply = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`;
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#10264a;max-width:600px">
<p style="margin:0 0 4px;font-size:13px;color:#53627a">New message via manthanam.in · ${esc(m.topic)}</p>
${m.guardian ? `<p style="margin:0 0 12px;padding:8px 12px;border-left:3px solid #a0145c;background:#f5f7f6">A parent or guardian writing about someone under 18: verify who they are before acting on any details.</p>` : ""}
<p style="margin:12px 0 0"><strong>${esc(m.name)}</strong><br><a href="${esc(reply)}" style="color:#10264a">${esc(m.email)}</a></p>
<div style="margin:16px 0;padding:16px;border:1px solid #d9e8ec;white-space:pre-wrap">${esc(m.message)}</div>
<p style="margin:0"><a href="${esc(reply)}" style="display:inline-block;background:#10264a;color:#ffffff;text-decoration:none;padding:10px 18px;font-weight:bold">Reply to ${esc(m.name)}</a>${m.adminUrl ? ` &nbsp; <a href="${esc(m.adminUrl)}" style="color:#10264a">Open in the admin dashboard</a>` : ""}</p>
</div>`;
    const subject = `[${m.topic}]${m.guardian ? " [Guardian: verify identity]" : ""} ${m.name} via manthanam.in`;
    await send(CONTACT_TO, undefined, subject.replace(/[\r\n]+/g, " ").slice(0, 200), html);
}

const oneLine = (t: string) => t.replace(/[\r\n]+/g, " ").slice(0, 200);

/**
 * A reply written in the admin dashboard to someone who used the contact form, in the registration
 * email's design (lib/reply-email.ts). Sent from FROM, so their answer lands in that mailbox.
 */
export async function sendMessageReply(r: { to: string; topic: string; body: string; signedBy: string; original: string; originalAt: string }) {
    const subject = oneLine(`Re: ${r.topic || "your message to Manthanam"}`);
    const html = replyEmailHtml({
        subject,
        band: "Manthanam Research Foundation, New Delhi",
        context: `Your message to us on ${longDate(r.originalAt)}${r.topic ? `, about ${r.topic}` : ""}:`,
        quote: r.original,
        body: r.body,
        signedBy: r.signedBy,
        reason: "You received this email because you wrote to us through the contact form on manthanam.in.",
    });
    await send(r.to, undefined, subject, html);
}

/** A reply to an internship applicant, written in the admin dashboard. Same design; their application isn't quoted back. */
export async function sendApplicationReply(r: { to: string; role: string; body: string; signedBy: string; appliedAt: string }) {
    const subject = oneLine(`Re: Your application for the ${roleTitle(r.role)} role at Manthanam`);
    const html = replyEmailHtml({
        subject,
        band: isAmbassador(r.role) ? "Manthanam campus ambassadors" : "Manthanam internships, remote",
        context: `About your application for the ${roleTitle(r.role)} role, sent on ${longDate(r.appliedAt)}.`,
        body: r.body,
        signedBy: r.signedBy,
        reason: `You received this email because you applied ${isAmbassador(r.role) ? "to be a campus ambassador" : "for an internship"} on manthanam.in.`,
    });
    await send(r.to, undefined, subject, html);
}

/** An offer letter: the designed email (lib/letters/email.ts) with the PDF attached. */
export async function sendOfferLetterEmail(r: { to: string; subject: string; html: string; fileName: string; pdf: Uint8Array }) {
    await send(r.to, undefined, oneLine(r.subject), r.html, "html", [{ name: r.fileName, mimeType: "application/pdf", bytes: r.pdf }]);
}

/** Setup check: can these credentials find a mailbox that sends as FROM? (Sends nothing.) */
export async function diagnoseMail(): Promise<string> {
    if (ZEPTO_TOKEN) return `ZeptoMail (sends as ${FROM} via ${zeptoUrl()}; a test send is the only full check)`;
    if (!mailConfigured()) return "not configured";
    try {
        await account();
        return `ok (sends as ${FROM})`;
    } catch (err) {
        return `failed: ${(err as Error).message}`;
    }
}
