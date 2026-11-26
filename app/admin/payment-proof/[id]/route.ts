import { adminWith } from "@/lib/auth";
import { db } from "@/lib/db";
import { isProofType, PROOF_BUCKET } from "@/lib/payment";

/**
 * A registrant's payment screenshot, for signed-in admins who can see registrations. Served from this
 * site (the bucket is private, and the page's security policy only loads images from here), never cached,
 * and with a fixed content type so a file can only ever display as an image or a PDF.
 */
export async function GET(_: Request, { params }: RouteContext<"/admin/payment-proof/[id]">) {
    const admin = await adminWith("registrations.view");
    if (!admin) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
    const { data: r } = await db().from("registrations").select("reference, payment_proof_path, payment_proof_type").eq("id", id).maybeSingle<{ reference: string; payment_proof_path: string | null; payment_proof_type: string | null }>();
    if (!r?.payment_proof_path || !r.payment_proof_type || !isProofType(r.payment_proof_type)) return new Response("No payment screenshot for this registration.", { status: 404 });

    const { data: file, error } = await db().storage.from(PROOF_BUCKET).download(r.payment_proof_path);
    if (error || !file) {
        console.error("Payment proof download failed for", r.reference, error?.message);
        return new Response("The screenshot couldn’t be loaded. Try again in a minute.", { status: 502 });
    }
    const ext = r.payment_proof_path.split(".").pop();
    // Images open in the browser; a PDF downloads, so nothing a registrant uploaded ever runs inside this site.
    const pdf = r.payment_proof_type === "application/pdf";
    return new Response(file.stream(), {
        headers: {
            "Content-Type": r.payment_proof_type,
            "Content-Disposition": `${pdf ? "attachment" : "inline"}; filename="payment-${r.reference}.${ext}"`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
        },
    });
}
