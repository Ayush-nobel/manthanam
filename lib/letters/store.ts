import "server-only";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import type { IssuedLetter, LetterKind, LetterStatus, WorkMode } from "@/lib/letters/model";

/** Offer letters in the database (migration 0007), and the signatory settings in site_content. */

export interface OfferLetterRow {
    id: string;
    number: number;
    reference: string;
    verify_code: string;
    issue_date: string;
    created_at: string;
    updated_at: string;
    kind: LetterKind;
    full_name: string;
    email: string;
    position: string;
    department: string;
    start_date: string;
    end_date: string | null;
    commitment: string;
    work_mode: WorkMode;
    location: string;
    compensation: string;
    reporting_to: string;
    benefits: string;
    additional_terms: string;
    respond_by: string;
    signatory_name: string;
    signatory_title: string;
    status: LetterStatus;
    email_sent_at: string | null;
    notes: string;
    application_id: string | null;
    created_by_email: string;
}

export const toIssued = (r: OfferLetterRow): IssuedLetter => ({
    kind: r.kind,
    fullName: r.full_name,
    email: r.email,
    position: r.position,
    department: r.department,
    startDate: r.start_date,
    endDate: r.end_date,
    commitment: r.commitment,
    workMode: r.work_mode,
    location: r.location,
    compensation: r.compensation,
    reportingTo: r.reporting_to,
    benefits: r.benefits,
    additionalTerms: r.additional_terms,
    respondBy: r.respond_by,
    reference: r.reference,
    verifyCode: r.verify_code,
    issueDate: r.issue_date,
    signatoryName: r.signatory_name,
    signatoryTitle: r.signatory_title,
});

/** A code like "K7PQM-3XWZA": 50 bits from letters and digits that can't be mistaken for each other. */
export function newVerifyCode() {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    const part = () => Array.from({ length: 5 }, () => chars[randomInt(chars.length)]).join("");
    return `${part()}-${part()}`;
}

/** What someone types at /verify, tidied: "k7pqm 3xwza" → "K7PQM-3XWZA". Null if it can't be a code. */
export function normaliseCode(input: string): string | null {
    const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return raw.length === 10 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : null;
}

export async function listLetters(): Promise<OfferLetterRow[]> {
    const { data, error } = await db().from("offer_letters").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as OfferLetterRow[];
}

export async function getLetterRow(id: string): Promise<OfferLetterRow | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data } = await db().from("offer_letters").select("*").eq("id", id).maybeSingle<OfferLetterRow>();
    return data ?? null;
}

/** For the public /verify page: only what a letter shows anyway, never the email address or notes. */
export async function findByVerifyCode(code: string) {
    const { data, error } = await db()
        .from("offer_letters")
        .select("reference, issue_date, kind, full_name, position, department, start_date, end_date, status")
        .eq("verify_code", code)
        .neq("status", "not_sent")
        .maybeSingle<Pick<OfferLetterRow, "reference" | "issue_date" | "kind" | "full_name" | "position" | "department" | "start_date" | "end_date" | "status">>();
    if (error) throw new Error(error.message);
    return data ?? null;
}

// Signatory -------------------------------------------------------------------------------------

export interface LetterSettings {
    signatoryName: string;
    signatoryTitle: string;
    /** A PNG or JPEG as a data: URL, or null to leave space for a handwritten signature. */
    signature: string | null;
}

const SIGNATURE = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/;

export async function getLetterSettings(): Promise<LetterSettings> {
    const { data } = await db().from("site_content").select("value").eq("key", "letters").maybeSingle();
    const v = (data?.value ?? {}) as Record<string, unknown>;
    const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");
    const signature = typeof v.signature === "string" && SIGNATURE.test(v.signature) ? v.signature : null;
    return { signatoryName: str(v.signatoryName, 120), signatoryTitle: str(v.signatoryTitle, 120), signature };
}
