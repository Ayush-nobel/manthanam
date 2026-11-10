import { audit, db, dbConfigured } from "@/lib/db";
import { cleanContact, CONSENT_TEXT, GUARDIAN_CONSENT_TEXT, PRIVACY_POLICY_VERSION, validateContact } from "@/lib/contact";
import { clientIp, fromThisSite, rateLimiter, readJson } from "@/lib/request-guard";
import { site } from "@/lib/site";
import { mailConfigured, sendContactNotification } from "@/lib/zoho-mail";

/**
 * Contact form endpoint. Saves the message in the database (shown under Messages in the admin
 * dashboard) and emails it to the team from Manthanam's Zoho mailbox. It succeeds if either worked.
 * If neither is set up it answers 503, and the form falls back to Formspree if that is configured.
 */

// Best-effort limit per IP: 5 messages per 10 minutes on each server instance.
const limited = rateLimiter(5, 10 * 60 * 1000);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
    if (!fromThisSite(request)) return json({ error: "This form can only be sent from manthanam.in." }, 403);
    if (limited(clientIp(request))) return json({ error: "Too many messages from this connection. Please wait ten minutes and try again." }, 429);

    const raw = await readJson(request, 12_000);
    if (raw === "too long") return json({ error: "The message is too long." }, 413);
    if (!raw) return json({ error: "The form could not be read. Please try again." }, 400);

    // Honeypot: people never see this field. Answer as if it worked, store nothing, and log it.
    if (typeof raw.x_hp_7 === "string" && raw.x_hp_7 !== "") {
        console.warn("Contact honeypot triggered; nothing saved.");
        return json({ ok: true });
    }

    const v = cleanContact(raw);
    const errors = validateContact(v);
    if (Object.keys(errors).length) return json({ errors }, 422);

    const useDb = dbConfigured();
    const useMail = mailConfigured();
    if (!useDb && !useMail) return json({ error: "not connected", fallback: true }, 503);

    const guardian = v.sender === "guardian";
    let id: string | undefined;
    if (useDb) {
        const { data, error } = await db()
            .from("contact_messages")
            .insert({
                name: v.name,
                email: v.email,
                topic: v.topic,
                message: v.message,
                sender: guardian ? "guardian" : "adult",
                consent_text: CONSENT_TEXT,
                guardian_consent_text: guardian ? GUARDIAN_CONSENT_TEXT : "",
                privacy_policy_version: PRIVACY_POLICY_VERSION,
            })
            .select("id")
            .single();
        if (error) console.error("Contact message not saved:", error.message);
        else {
            id = data.id as string;
            await audit(null, "message.create", "contact_message", id);
        }
    }

    let emailed = false;
    if (useMail) {
        try {
            await sendContactNotification({ name: v.name, email: v.email, topic: v.topic, message: v.message, guardian, adminUrl: id ? `${site.url}/admin/messages` : undefined });
            emailed = true;
        } catch (err) {
            console.error("Contact notification not sent:", err);
        }
    }

    if (!id && !emailed) return json({ error: "We couldn’t send your message right now." }, 502);
    return json({ ok: true });
}
