import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The website's database (Supabase Postgres), server only. Setup: docs/backend.md.
 *
 * SUPABASE_SECRET_KEY bypasses Row Level Security, so it must never reach a browser: it is only
 * referenced here and in lib/auth.ts, both "server-only". Every table has RLS on with no policies,
 * so the publishable key on its own can't read or write anything.
 */

// Literal process.env.NAME references, so next.config.ts can bake them in at build time (AWS Amplify).
const v = (s: string | undefined) => s?.trim() || undefined;
/** "https://ref.supabase.co", also when pasted with a path such as /rest/v1/ (as Supabase's Data API page shows it). */
export const supabaseOrigin = (raw: string | undefined) => {
    try {
        return raw?.trim() ? new URL(raw.trim()).origin : undefined;
    } catch {
        return undefined;
    }
};
export const SUPABASE_URL = supabaseOrigin(process.env.SUPABASE_URL);
export const SUPABASE_PUBLISHABLE_KEY = v(process.env.SUPABASE_PUBLISHABLE_KEY);
const SUPABASE_SECRET_KEY = v(process.env.SUPABASE_SECRET_KEY);

/** Names (never values) of the database settings that are missing. */
export function dbMissing(): string[] {
    const missing: string[] = [];
    if (!SUPABASE_URL || !/^https:\/\/[^/]+$/.test(SUPABASE_URL)) missing.push("SUPABASE_URL");
    if (!SUPABASE_PUBLISHABLE_KEY) missing.push("SUPABASE_PUBLISHABLE_KEY");
    if (!SUPABASE_SECRET_KEY) missing.push("SUPABASE_SECRET_KEY");
    return missing;
}
export const dbConfigured = () => dbMissing().length === 0;

let client: SupabaseClient | null = null;
/** Full-access client. Callers must check the admin's permission first (lib/auth.ts). */
export function db(): SupabaseClient {
    if (!dbConfigured()) throw new Error(`Database not configured: missing ${dbMissing().join(", ")}`);
    client ??= createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
    return client;
}

export interface RegistrationRow {
    id: string;
    reference: string;
    created_at: string;
    updated_at: string;
    event: string;
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    minor: boolean;
    participant_type: string;
    institution: string;
    city: string;
    state: string;
    country: string;
    motivation: string;
    heard_from: string;
    access_needs: string;
    guardian_name: string;
    guardian_relation: string;
    guardian_email: string;
    guardian_phone: string;
    guardian_verified_at: string | null;
    guardian_verified_by: string | null;
    consent_text: string;
    guardian_consent_text: string;
    place_terms_text: string;
    privacy_policy_version: string;
    status: string;
    notes: string;
    email_sent_at: string | null;
    sheet_synced_at: string | null;
    // Payment (supabase/migrations/0008_payments.sql)
    payment_token: string | null;
    payment_email_sent_at: string | null;
    payment_submitted_at: string | null;
    payment_reference: string;
    payment_amount: number | null;
    payment_paid_on: string | null;
    payment_payer_name: string;
    payment_proof_path: string | null;
    payment_proof_type: string | null;
}

export interface ContactMessageRow {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    email: string;
    organisation: string;
    topic: string;
    message: string;
    sender: string;
    consent_text: string;
    guardian_consent_text: string;
    privacy_policy_version: string;
    status: string;
    notes: string;
}

/** One reply emailed from the dashboard (message_replies and application_replies). */
export interface ReplyRow {
    id: string;
    created_at: string;
    body: string;
    sent_to: string;
    sent_from: string;
    sent_by_name: string;
    sent_by_email: string;
}
export interface MessageReplyRow extends ReplyRow {
    message_id: string;
}

export interface ApplicationRow {
    id: string;
    created_at: string;
    updated_at: string;
    full_name: string;
    email: string;
    phone: string;
    city: string;
    organisation: string;
    role: string;
    motivation: string;
    portfolio: string;
    adult_confirmed: boolean;
    consent_text: string;
    privacy_policy_version: string;
    status: string;
    notes: string;
    email_sent_at: string | null;
}

export interface AdminRow {
    user_id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
}

export interface AuditRow {
    id: number;
    at: string;
    actor_email: string;
    action: string;
    entity: string;
    entity_id: string;
    detail: Record<string, unknown>;
}

/** Record who did what. Never throws: a failed log line mustn't undo the change it describes. */
export async function audit(actor: { id: string; email: string } | null, action: string, entity: string, entityId: string, detail: Record<string, unknown> = {}) {
    try {
        const { error } = await db().from("audit_log").insert({ actor_id: actor?.id ?? null, actor_email: actor?.email ?? "website", action, entity, entity_id: entityId, detail });
        if (error) console.error("Audit log write failed:", error.message);
    } catch (err) {
        console.error("Audit log write failed:", err);
    }
}
