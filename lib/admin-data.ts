import "server-only";
import { db, type AdminRow, type ApplicationRow, type AuditRow, type ContactMessageRow, type MessageReplyRow, type RegistrationRow } from "@/lib/db";
import { APPLICATION_STATUSES, MESSAGE_STATUSES, REGISTRATION_STATUSES } from "@/lib/permissions";

/**
 * Reads for the admin dashboard. Pages call requireAdmin() and check can(...) before calling these;
 * these never run on behalf of a visitor.
 */

export const PAGE_SIZE = 50;

/** Text safe to put inside a PostgREST or=(...) filter: drops the characters that would change its meaning. */
const searchable = (q: string) => q.replace(/[,()*%\\:"']/g, " ").trim().slice(0, 100);

// The query builder's generic type is unwieldy without generated database types; filters only chain .eq/.is/… on it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;
async function count(table: string, filter?: (q: Query) => Query) {
    let q = db().from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: n, error } = await q;
    if (error) throw new Error(error.message);
    return n ?? 0;
}

export async function overview() {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const [total, today, guardianPending, newMessages, byStatus, recent, newApplications] = await Promise.all([
        count("registrations"),
        count("registrations", (q) => q.gte("created_at", since)),
        count("registrations", (q) => q.eq("minor", true).is("guardian_verified_at", null).not("status", "in", "(cancelled,refunded)")),
        count("contact_messages", (q) => q.eq("status", "new")),
        Promise.all(REGISTRATION_STATUSES.map(async (s) => [s, await count("registrations", (q) => q.eq("status", s))] as const)),
        db().from("registrations").select("id, reference, full_name, city, created_at, status, minor").order("created_at", { ascending: false }).limit(8),
        count("applications", (q) => q.eq("status", "new")).catch(() => 0),
    ]);
    return { total, today, guardianPending, newMessages, newApplications, byStatus, recent: (recent.data ?? []) as Pick<RegistrationRow, "id" | "reference" | "full_name" | "city" | "created_at" | "status" | "minor">[] };
}

export interface RegistrationFilters {
    q?: string;
    status?: string;
    minor?: string; // "yes" | "pending"
    page?: number;
}

export async function listRegistrations(f: RegistrationFilters, opts: { all?: boolean } = {}) {
    let q = db().from("registrations").select("*", { count: "exact" }).order("created_at", { ascending: false });
    const text = searchable(f.q ?? "");
    if (text) q = q.or(["full_name", "email", "reference", "phone", "institution", "city"].map((c) => `${c}.ilike.*${text}*`).join(","));
    if (f.status && (REGISTRATION_STATUSES as readonly string[]).includes(f.status)) q = q.eq("status", f.status);
    if (f.minor === "yes") q = q.eq("minor", true);
    if (f.minor === "pending") q = q.eq("minor", true).is("guardian_verified_at", null);
    if (opts.all) {
        // Exports: every matching row, fetched in pages of 1000 (the API's maximum per request).
        const rows: RegistrationRow[] = [];
        for (let from = 0; ; from += 1000) {
            const { data, error } = await q.range(from, from + 999);
            if (error) throw new Error(error.message);
            rows.push(...((data ?? []) as RegistrationRow[]));
            if (!data || data.length < 1000) break;
        }
        return { rows, total: rows.length };
    }
    const page = Math.max(1, f.page ?? 1);
    const { data, count: total, error } = await q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as RegistrationRow[], total: total ?? 0 };
}

export async function getRegistration(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data } = await db().from("registrations").select("*").eq("id", id).maybeSingle<RegistrationRow>();
    if (!data) return null;
    const [{ data: history }, verifier] = await Promise.all([
        db().from("audit_log").select("id, at, actor_email, action, entity, entity_id, detail").eq("entity", "registration").eq("entity_id", id).order("at", { ascending: false }).limit(50),
        data.guardian_verified_by ? db().from("admin_users").select("email, name").eq("user_id", data.guardian_verified_by).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return { registration: data, history: (history ?? []) as AuditRow[], verifiedBy: (verifier.data as { email: string; name: string } | null) ?? null };
}

export interface ApplicationFilters {
    q?: string;
    status?: string;
    role?: string;
    page?: number;
}

export async function listApplications(f: ApplicationFilters, opts: { all?: boolean } = {}) {
    let q = db().from("applications").select("*", { count: "exact" }).order("created_at", { ascending: false });
    const text = searchable(f.q ?? "");
    if (text) q = q.or(["full_name", "email", "phone", "organisation", "city", "motivation"].map((c) => `${c}.ilike.*${text}*`).join(","));
    if (f.status && (APPLICATION_STATUSES as readonly string[]).includes(f.status)) q = q.eq("status", f.status);
    if (f.role && /^[a-z]+$/.test(f.role)) q = q.eq("role", f.role);
    if (opts.all) {
        const rows: ApplicationRow[] = [];
        for (let from = 0; ; from += 1000) {
            const { data, error } = await q.range(from, from + 999);
            if (error) throw new Error(error.message);
            rows.push(...((data ?? []) as ApplicationRow[]));
            if (!data || data.length < 1000) break;
        }
        return { rows, total: rows.length };
    }
    const page = Math.max(1, f.page ?? 1);
    const { data, count: total, error } = await q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as ApplicationRow[], total: total ?? 0 };
}

export async function getApplication(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data } = await db().from("applications").select("*").eq("id", id).maybeSingle<ApplicationRow>();
    if (!data) return null;
    const { data: history } = await db().from("audit_log").select("id, at, actor_email, action, entity, entity_id, detail").eq("entity", "application").eq("entity_id", id).order("at", { ascending: false }).limit(50);
    return { application: data, history: (history ?? []) as AuditRow[] };
}

export async function listMessages(f: { q?: string; status?: string; page?: number }) {
    let q = db().from("contact_messages").select("*", { count: "exact" }).order("created_at", { ascending: false });
    const text = searchable(f.q ?? "");
    if (text) q = q.or(["name", "email", "organisation", "message"].map((c) => `${c}.ilike.*${text}*`).join(","));
    if (f.status && (MESSAGE_STATUSES as readonly string[]).includes(f.status)) q = q.eq("status", f.status);
    const page = Math.max(1, f.page ?? 1);
    const { data, count: total, error } = await q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as ContactMessageRow[];
    return { rows, total: total ?? 0, replies: await repliesFor(rows.map((r) => r.id)) };
}

/** Replies sent from the dashboard, oldest first, by message. Empty if the table isn't there yet (migration 0005). */
async function repliesFor(ids: string[]): Promise<Record<string, MessageReplyRow[]>> {
    if (!ids.length) return {};
    const { data, error } = await db().from("message_replies").select("id, message_id, created_at, body, sent_to, sent_from, sent_by_name, sent_by_email").in("message_id", ids).order("created_at");
    if (error) {
        console.error("Message replies unavailable:", error.message);
        return {};
    }
    const out: Record<string, MessageReplyRow[]> = {};
    for (const r of (data ?? []) as MessageReplyRow[]) (out[r.message_id] ??= []).push(r);
    return out;
}

export async function listAdmins() {
    const { data, error } = await db().from("admin_users").select("user_id, email, name, role, created_at").order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminRow[];
}

export async function recentActivity(limit = 30) {
    const { data } = await db().from("audit_log").select("id, at, actor_email, action, entity, entity_id, detail").order("at", { ascending: false }).limit(limit);
    return (data ?? []) as AuditRow[];
}

export interface InsightRow {
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    category: string;
    author_name: string;
    author_bio: string;
    display_date: string | null;
    status: string;
    review_note: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
}

export async function listInsightRows(status?: string) {
    let q = db().from("insights").select("id, slug, title, category, author_name, status, updated_at, published_at, display_date").order("updated_at", { ascending: false }).limit(200);
    if (status) q = q.eq("status", status);
    const [{ data, error }, counts] = await Promise.all([q, db().from("insights").select("status")]);
    if (error) throw new Error(error.message);
    const byStatus: Record<string, number> = {};
    for (const r of counts.data ?? []) byStatus[r.status as string] = (byStatus[r.status as string] ?? 0) + 1;
    return { rows: (data ?? []) as Omit<InsightRow, "summary" | "body" | "author_bio" | "review_note" | "created_at">[], byStatus };
}

export async function getInsightRow(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data } = await db().from("insights").select("*").eq("id", id).maybeSingle<InsightRow>();
    if (!data) return null;
    const { data: history } = await db().from("audit_log").select("id, at, actor_email, action, entity, entity_id, detail").eq("entity", "insight").eq("entity_id", id).order("at", { ascending: false }).limit(30);
    return { insight: data, history: (history ?? []) as AuditRow[] };
}
