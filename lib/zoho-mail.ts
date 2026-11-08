import "server-only";
import { conference } from "@/lib/conference";
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
const FROM = v(process.env.ZOHO_MAIL_FROM) ?? "contact@manthanam.in";
const ACCOUNT_ID = v(process.env.ZOHO_MAIL_ACCOUNT_ID);
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
        data?: { accountId: string; primaryEmailAddress?: string; sendMailDetails?: { fromAddress?: string }[] }[];
    } | null;
    if (!res.ok || !body?.data) throw new Error(`Zoho Mail accounts lookup failed: ${res.status} ${body?.status?.description ?? ""}`);
    const want = FROM.toLowerCase();
    const match = body.data.find(
        (a) => a.primaryEmailAddress?.toLowerCase() === want || a.sendMailDetails?.some((d) => d.fromAddress?.toLowerCase() === want),
    );
    if (!match) throw new Error(`No Zoho Mail account for this token can send as ${FROM}`);
    accountId = String(match.accountId);
    return accountId;
}

async function send(to: string, cc: string | undefined, subject: string, content: string) {
    const id = await account();
    const token = await accessToken(creds());
    const res = await fetch(`${base()}/accounts/${encodeURIComponent(id)}/messages`, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ fromAddress: FROM, toAddress: to, ...(cc ? { ccAddress: cc } : {}), subject, content, mailFormat: "plaintext", encoding: "UTF-8" }),
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
    });
    if (res.status === 401) forgetToken(creds());
    if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { status?: { description?: string }; data?: { moreInfo?: string } } | null;
        throw new Error(`Zoho Mail send failed: ${res.status} ${body?.status?.description ?? ""} ${body?.data?.moreInfo ?? ""}`.trim());
    }
}

const longDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Thank-you email with the registration number. A parent or guardian, if given, is copied in. */
export async function sendRegistrationEmail(r: { name: string; email: string; reference: string; guardianEmail?: string }) {
    const subject = `Thank you for registering: ${conference.title} (${r.reference})`;
    const lines = [
        `Dear ${r.name},`,
        "",
        `Thank you for registering for the ${conference.title}, on ${longDate(conference.date)} in ${conference.place}.`,
        "",
        `Your registration number is ${r.reference}. Please quote it whenever you write to us.`,
        "",
        conference.paymentDetailsBy
            ? `Payment details will be shared by ${longDate(conference.paymentDetailsBy)}. Your place is confirmed once payment is received.`
            : "We will email you payment details. Your place is confirmed once payment is received.",
        "",
        ...(r.guardianEmail
            ? [
                  "As the registrant is under 18, we have copied their parent or guardian, whom we will contact to verify their consent before confirming the place.",
                  "",
              ]
            : []),
        "Manthanam will never ask for card details, UPI PINs or passwords by email or phone.",
        "",
        "If you have any questions, just reply to this email.",
        "",
        "Warm regards,",
        "Manthanam Research Foundation",
        "New Delhi",
        "https://www.manthanam.in",
    ];
    await send(r.email, r.guardianEmail, subject, lines.join("\n"));
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
