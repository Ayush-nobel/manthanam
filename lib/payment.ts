/**
 * The proof-of-payment form at /pay/<token>: one definition shared by the browser (instant feedback)
 * and app/api/payment/route.ts (the check that counts).
 */

/** The private Supabase Storage bucket the screenshots go in (supabase/migrations/0008_payments.sql). */
export const PROOF_BUCKET = "payment-proofs";

/** Largest file the server accepts. Bigger photos are shrunk in the browser before upload. */
export const MAX_PROOF_BYTES = 4 * 1024 * 1024;
export const PROOF_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" } as const;
export type ProofType = keyof typeof PROOF_TYPES;
export const isProofType = (t: string): t is ProofType => t in PROOF_TYPES;

/** The token in the personal link (app/admin/actions.ts makes it; the database checks the same shape). */
export const PAYMENT_TOKEN = /^[A-Za-z0-9_-]{32}$/;

export interface PaymentValues {
    reference: string;
    amount: string;
    paidOn: string;
    payerName: string;
}
export type PaymentErrors = Partial<Record<keyof PaymentValues | "proof", string>>;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Today in India, as YYYY-MM-DD (payments are dated by the payer's bank in IST). */
export const todayIST = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

/** The transaction ID without spaces, as stored. */
export const cleanReference = (s: string) => s.replace(/\s+/g, "");
/** "₹2,000" or "2000" → 2000. */
export const parseAmount = (s: string) => Number(s.replace(/[₹,\s]/g, ""));

export function validatePayment(v: PaymentValues): PaymentErrors {
    const e: PaymentErrors = {};
    const ref = cleanReference(v.reference);
    if (!ref) e.reference = "Enter the transaction ID, UTR or UPI reference number from your payment.";
    else if (!/^[A-Za-z0-9/-]{6,40}$/.test(ref)) e.reference = "Enter the ID exactly as your payment app or bank shows it: 6 to 40 letters and numbers.";

    const amount = parseAmount(v.amount);
    if (!v.amount.trim()) e.amount = "Enter the amount you paid, in rupees.";
    else if (!Number.isInteger(amount) || amount < 1 || amount > 1_000_000) e.amount = "Enter the amount in whole rupees, for example 2000.";

    if (!v.paidOn) e.paidOn = "Enter the date you paid.";
    else if (!ISO.test(v.paidOn) || Number.isNaN(Date.parse(`${v.paidOn}T00:00:00Z`))) e.paidOn = "Enter a real date.";
    else if (v.paidOn > todayIST()) e.paidOn = "The payment date can’t be in the future.";
    else if (v.paidOn < "2026-10-01") e.paidOn = "Check the date: it’s before registration opened.";

    if (v.payerName.length > 100) e.payerName = "Keep this under 100 characters.";
    return e;
}

/** What the file really is, from its first bytes (the name and the browser's label can't be trusted). */
export function sniffProof(head: Uint8Array): ProofType | null {
    const b = (i: number) => head[i];
    if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
    if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
    if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return "image/webp";
    if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return "application/pdf";
    return null;
}
