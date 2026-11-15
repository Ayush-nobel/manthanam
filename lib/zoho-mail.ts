import "server-only";
import { applicationEmailHtml, applicationEmailSubject } from "@/lib/application-email";
import { registrationEmailHtml, registrationEmailSubject } from "@/lib/registration-email";
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
const base = () => `https://mail.zoho.${zohoDataCentre()}/api`;

export const mailConfigured = () => !!(CREDS.clientId && CREDS.clientSecret && CREDS.refreshToken);
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
// spam cannon: 150 an hour per server instance in all, and 3 a day to any one address. Over the limit the
// email is skipped (the form entry is still saved) and the reason logged.
const allMail = rateLimiter(150, 60 * 60_000);
const perRecipient = rateLimiter(3, 24 * 60 * 60_000);

async function send(to: string, cc: string | undefined, subject: string, content: string, mailFormat: "html" | "plaintext" = "html") {
    if (to !== CONTACT_TO) {
        if (allMail("all")) throw new Error("Hourly email limit reached; email skipped.");
        for (const addr of [to, cc].filter((x): x is string => !!x)) if (perRecipient(addr.toLowerCase())) throw new Error("Daily limit for this recipient reached; email skipped.");
    }
    const id = await account();
    const token = await accessToken(creds());
    const res = await fetch(`${base()}/accounts/${encodeURIComponent(id)}/messages`, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ fromAddress: FROM, toAddress: to, ...(cc ? { ccAddress: cc } : {}), subject, content, mailFormat, encoding: "UTF-8" }),
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

/** "We've received your application" email to an internship applicant. */
export async function sendApplicationEmail(a: { name: string; email: string; role: string }) {
    await send(a.email, undefined, applicationEmailSubject(a.role), applicationEmailHtml(a));
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

/**
 * A reply written in the admin dashboard to someone who used the contact form. Sent from FROM, so when they
 * answer, it lands in that mailbox. Their original message is quoted underneath, like an ordinary email reply.
 */
export async function sendMessageReply(r: { to: string; name: string; topic: string; body: string; signedBy: string; original: string; originalAt: string }) {
    const para = (t: string) => esc(t).replace(/\r?\n/g, "<br>");
    const date = new Date(r.originalAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" });
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#10264a;max-width:600px">
<div>${para(r.body)}</div>
<p style="margin:20px 0 0">${esc(r.signedBy)}<br>Manthanam Research Foundation<br><a href="https://www.manthanam.in" style="color:#10264a">manthanam.in</a></p>
<div style="margin:28px 0 0;padding:0 0 0 12px;border-left:3px solid #d9e8ec;color:#53627a;font-size:14px">
<p style="margin:0 0 6px">On ${esc(date)}, ${esc(r.name)} wrote via manthanam.in:</p>
<div>${para(r.original)}</div>
</div>
</div>`;
    const subject = `Re: ${r.topic || "your message to Manthanam"}`.replace(/[\r\n]+/g, " ").slice(0, 200);
    await send(r.to, undefined, subject, html);
}

/** Setup check: can these credentials find a mailbox that sends as FROM? (Sends nothing.) */
export async function diagnoseMail(): Promise<string> {
    if (!mailConfigured()) return "not configured";
    try {
        await account();
        return `ok (sends as ${FROM})`;
    } catch (err) {
        return `failed: ${(err as Error).message}`;
    }
}
