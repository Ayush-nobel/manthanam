import { APPLICATION_CONSENT_TEXT, APPLICATION_PRIVACY_VERSION, cleanApplication, validateApplication } from "@/lib/application";
import { audit, db, dbConfigured } from "@/lib/db";
import { clientIp, fromThisSite, rateLimiter, readJson } from "@/lib/request-guard";
import { mailConfigured, sendApplicationEmail } from "@/lib/zoho-mail";

/** Internship applications from manthanam.in/join: saved in the database (admin → Applications), then a confirmation email. */

const limited = rateLimiter(5, 10 * 60 * 1000);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
    if (!fromThisSite(request)) return json({ error: "This form can only be sent from manthanam.in." }, 403);
    if (limited(clientIp(request))) return json({ error: "Too many applications from this connection. Please wait ten minutes and try again." }, 429);

    const raw = await readJson(request, 12_000);
    if (raw === "too long") return json({ error: "The application is too long." }, 413);
    if (!raw) return json({ error: "The form could not be read. Please try again." }, 400);

    if (typeof raw.x_hp_5 === "string" && raw.x_hp_5 !== "") {
        console.warn("Application honeypot triggered; nothing saved.");
        return json({ ok: true });
    }

    const v = cleanApplication(raw);
    const errors = validateApplication(v);
    if (Object.keys(errors).length) return json({ errors }, 422);
    if (!dbConfigured()) return json({ error: "Applications aren’t open on the website yet." }, 503);

    const { data, error } = await db()
        .from("applications")
        .insert({
            full_name: v.fullName,
            email: v.email,
            phone: v.phone,
            city: v.city,
            organisation: v.organisation,
            role: v.role,
            motivation: v.motivation,
            portfolio: v.portfolio,
            adult_confirmed: true,
            consent_text: APPLICATION_CONSENT_TEXT,
            privacy_policy_version: APPLICATION_PRIVACY_VERSION,
        })
        .select("id")
        .single();
    if (error?.code === "23505") return json({ errors: { role: "You’ve already applied for this role with this email address. To update your application, email us." } }, 409);
    if (error) {
        console.error("Application not saved:", error.message);
        return json({ error: "We couldn’t save your application right now." }, 502);
    }
    const id = data.id as string;
    await audit(null, "application.create", "application", id, { role: v.role });

    let emailed = false;
    if (mailConfigured()) {
        try {
            await sendApplicationEmail({ name: v.fullName, email: v.email, role: v.role });
            emailed = true;
            await db().from("applications").update({ email_sent_at: new Date().toISOString() }).eq("id", id);
        } catch (err) {
            console.error("Application email not sent:", err);
        }
    }
    return json({ ok: true, emailed });
}
