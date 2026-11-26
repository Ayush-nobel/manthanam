import { audit, db, dbConfigured } from "@/lib/db";
import { cleanReference, MAX_PROOF_BYTES, parseAmount, PAYMENT_TOKEN, PROOF_BUCKET, PROOF_TYPES, sniffProof, validatePayment, type PaymentErrors, type PaymentValues } from "@/lib/payment";
import { clientIp, fromThisSite, rateLimiter } from "@/lib/request-guard";
import { site } from "@/lib/site";
import { mailConfigured, sendPaymentReceivedEmail } from "@/lib/zoho-mail";

/**
 * Proof of payment from the personal form at /pay/<token> (the link in the payment email).
 *
 * The token is the only thing that identifies the registrant, so it's checked first. The screenshot goes
 * into the private "payment-proofs" bucket (supabase/migrations/0008_payments.sql), which only this
 * server can read; admins see it through /admin/payment-proof/<id>. Its type is checked from its first
 * bytes, never from the name or the browser's label.
 */

// Per server instance: 10 uploads per 10 minutes per connection, and 6 an hour per registration.
const perIp = rateLimiter(10, 10 * 60_000);
const perToken = rateLimiter(6, 60 * 60_000);

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
    if (!fromThisSite(request)) return json({ error: "This form can only be sent from manthanam.in." }, 403);
    if (perIp(clientIp(request))) return json({ error: "Too many uploads from this connection. Please wait ten minutes and try again." }, 429);
    if (!dbConfigured()) return json({ error: "Payment uploads aren’t connected yet." }, 503);

    // The file plus a few short fields; anything much bigger isn't from our form.
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_PROOF_BYTES + 64 * 1024) return json({ errors: { proof: "This file is too large; the limit is 4 MB." } }, 413);

    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return json({ error: "The form could not be read. Please try again." }, 400);
    }
    const field = (k: string, max: number) => {
        const v = form.get(k);
        return typeof v === "string" ? v.trim().slice(0, max) : "";
    };

    const token = field("token", 64);
    if (!PAYMENT_TOKEN.test(token)) return json({ error: "This payment link isn’t valid. Open the link in your payment email again." }, 404);
    if (perToken(token)) return json({ error: "Too many uploads for this registration. Please wait an hour, or reply to the payment email." }, 429);

    const { data: r, error: findError } = await db()
        .from("registrations")
        .select("id, reference, status, payment_proof_path, full_name, email, minor, guardian_email")
        .eq("payment_token", token)
        .maybeSingle<{ id: string; reference: string; status: string; payment_proof_path: string | null; full_name: string; email: string; minor: boolean; guardian_email: string }>();
    if (findError) {
        console.error("Payment lookup failed:", findError.message);
        return json({ error: "We couldn’t save your payment details right now." }, 502);
    }
    if (!r) return json({ error: "This payment link isn’t valid. Open the link in your payment email again." }, 404);
    if (r.status === "cancelled" || r.status === "refunded") return json({ error: "This registration has been cancelled, so no payment is needed. Reply to the payment email if that’s a mistake." }, 409);
    if (r.status === "paid" || r.status === "confirmed") return json({ error: "We’ve already received and checked your payment. Nothing more is needed." }, 409);

    const values: PaymentValues = { reference: field("reference", 60), amount: field("amount", 20), paidOn: field("paidOn", 10), payerName: field("payerName", 120) };
    const errors: PaymentErrors = validatePayment(values);

    const file = form.get("proof");
    let bytes: Uint8Array | null = null;
    let type: keyof typeof PROOF_TYPES | null = null;
    if (!(file instanceof File) || file.size === 0) errors.proof = "Choose the screenshot of your payment.";
    else if (file.size > MAX_PROOF_BYTES) errors.proof = "This file is too large; the limit is 4 MB.";
    else {
        bytes = new Uint8Array(await file.arrayBuffer());
        type = sniffProof(bytes.subarray(0, 16));
        if (!type) errors.proof = "Choose a screenshot or photo (JPG, PNG or WebP) or a PDF receipt.";
    }
    if (Object.keys(errors).length) return json({ errors }, 422);

    const path = `${r.id}/${Date.now()}.${PROOF_TYPES[type!]}`;
    const storage = db().storage.from(PROOF_BUCKET);
    const { error: uploadError } = await storage.upload(path, bytes!, { contentType: type!, upsert: false, cacheControl: "0" });
    if (uploadError) {
        console.error("Payment proof upload failed for", r.reference, uploadError.message);
        return json({ error: "We couldn’t save your screenshot right now." }, 502);
    }

    const { error: saveError } = await db()
        .from("registrations")
        .update({
            payment_submitted_at: new Date().toISOString(),
            payment_reference: cleanReference(values.reference),
            payment_amount: parseAmount(values.amount),
            payment_paid_on: values.paidOn,
            payment_payer_name: values.payerName,
            payment_proof_path: path,
            payment_proof_type: type,
            ...(r.status === "new" ? { status: "payment_pending" } : {}),
        })
        .eq("id", r.id);
    if (saveError) {
        console.error("Payment details not saved for", r.reference, saveError.message);
        await storage.remove([path]);
        return json({ error: "We couldn’t save your payment details right now." }, 502);
    }
    // A new upload replaces the old one: keep only what's needed (Privacy Policy, data minimisation).
    if (r.payment_proof_path && r.payment_proof_path !== path) {
        const { error } = await storage.remove([r.payment_proof_path]);
        if (error) console.error("Old payment proof not removed for", r.reference, error.message);
    }
    await audit(null, "registration.payment_proof", "registration", r.id, { reference: r.reference, replaced: !!r.payment_proof_path });
    console.info("Payment proof received:", r.reference);

    // Receipt to the registrant (and a parent or guardian, if under 18). The details are saved either way,
    // so a failed email is logged, not shown as an error.
    let emailed = false;
    if (mailConfigured()) {
        try {
            await sendPaymentReceivedEmail({
                name: r.full_name,
                email: r.email,
                guardianEmail: r.minor ? r.guardian_email || undefined : undefined,
                reference: r.reference,
                minor: r.minor,
                transactionId: cleanReference(values.reference),
                amount: parseAmount(values.amount),
                paidOn: values.paidOn,
                replaced: !!r.payment_proof_path,
                link: `${site.url}/pay/${token}`,
            });
            emailed = true;
        } catch (err) {
            console.error("Payment receipt email not sent for", r.reference, err);
        }
    }
    return json({ ok: true, emailed, email: emailed ? r.email : undefined });
}
