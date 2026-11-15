import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { AGENDA, conference, FAQS, SPEAKERS, type FeeRow } from "@/lib/conference";
import { db, dbConfigured } from "@/lib/db";

/**
 * Conference details that editors change from /admin/content/conference. The values in
 * lib/conference.ts are the defaults: they are used until something is saved, and whenever the
 * database can't be reached, so the page never breaks.
 *
 * Cached for about a minute on each server, and refreshed straight away on the server that saves.
 */

export interface Speaker {
    name: string;
    role: string;
}
export interface AgendaItem {
    time: string;
    title: string;
    detail?: string;
}
export interface Faq {
    q: string;
    a: string;
}

export interface ConferenceContent {
    registrationOpen: boolean;
    venue: string | null;
    /** ISO dates (YYYY-MM-DD) or null for "to be announced". */
    deadline: string | null;
    cancellationDeadline: string | null;
    paymentDetailsBy: string | null;
    theme: string;
    expected: string;
    fees: FeeRow[];
    included: string[];
    speakers: Speaker[];
    agenda: AgendaItem[];
    faqs: Faq[];
}

export const CONFERENCE_DEFAULTS: ConferenceContent = {
    registrationOpen: conference.registrationOpen,
    venue: conference.venue,
    deadline: conference.deadline,
    cancellationDeadline: conference.cancellationDeadline,
    paymentDetailsBy: conference.paymentDetailsBy,
    theme: conference.theme,
    expected: conference.expected,
    fees: [...conference.fees],
    included: [...conference.included],
    speakers: SPEAKERS.map((s) => ({ ...s })),
    agenda: AGENDA.map((a) => ({ ...a })),
    faqs: FAQS.map((f) => ({ ...f })),
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const date = (v: unknown) => (typeof v === "string" && ISO.test(v) ? v : null);
function list<T>(v: unknown, map: (x: Record<string, unknown>) => T | null, max: number): T[] {
    if (!Array.isArray(v)) return [];
    const out: T[] = [];
    for (const x of v.slice(0, max)) {
        if (!x || typeof x !== "object") continue;
        const y = map(x as Record<string, unknown>);
        if (y !== null) out.push(y);
    }
    return out;
}

/** Turns whatever is stored into a valid ConferenceContent, falling back to the defaults field by field. */
export function parseConference(raw: unknown): ConferenceContent {
    if (!raw || typeof raw !== "object") return CONFERENCE_DEFAULTS;
    const r = raw as Record<string, unknown>;
    const d = CONFERENCE_DEFAULTS;
    return {
        registrationOpen: typeof r.registrationOpen === "boolean" ? r.registrationOpen : d.registrationOpen,
        venue: "venue" in r ? str(r.venue, 200) || null : d.venue,
        deadline: "deadline" in r ? date(r.deadline) : d.deadline,
        cancellationDeadline: "cancellationDeadline" in r ? date(r.cancellationDeadline) : d.cancellationDeadline,
        paymentDetailsBy: "paymentDetailsBy" in r ? date(r.paymentDetailsBy) : d.paymentDetailsBy,
        theme: "theme" in r ? str(r.theme, 200) : d.theme,
        expected: "expected" in r ? str(r.expected, 80) : d.expected,
        fees:
            "fees" in r
                ? list(
                      r.fees,
                      (f) => {
                          const amount = Number(f.amount);
                          const category = str(f.category, 80);
                          const note = str(f.note, 120);
                          return category && Number.isFinite(amount) && amount >= 0 ? { category, amount: Math.round(amount), ...(note ? { note } : {}) } : null;
                      },
                      10,
                  )
                : d.fees,
        included: "included" in r && Array.isArray(r.included) ? r.included.map((x) => str(x, 200)).filter(Boolean).slice(0, 20) : d.included,
        speakers: "speakers" in r ? list(r.speakers, (s) => (str(s.name, 120) ? { name: str(s.name, 120), role: str(s.role, 200) } : null), 80) : d.speakers,
        agenda:
            "agenda" in r
                ? list(r.agenda, (a) => (str(a.title, 160) ? { time: str(a.time, 20), title: str(a.title, 160), ...(str(a.detail, 300) ? { detail: str(a.detail, 300) } : {}) } : null), 40)
                : d.agenda,
        faqs: "faqs" in r ? list(r.faqs, (f) => (str(f.q, 200) && str(f.a, 1500) ? { q: str(f.q, 200), a: str(f.a, 1500) } : null), 30) : d.faqs,
    };
}

/** The saved row, uncached: for the editor, which must show exactly what is stored. */
export async function readConferenceRow(): Promise<{ value: ConferenceContent; updatedAt: string | null }> {
    const { data, error } = await db().from("site_content").select("value, updated_at").eq("key", "conference").maybeSingle();
    if (error) throw new Error(error.message);
    return { value: parseConference(data?.value), updatedAt: data?.updated_at ?? null };
}

/** The conference details for public pages, emails and the registration route. */
export async function getConference(): Promise<ConferenceContent> {
    "use cache";
    cacheTag("conference");
    cacheLife("minutes");
    if (!dbConfigured()) return CONFERENCE_DEFAULTS;
    try {
        const { data, error } = await db().from("site_content").select("value").eq("key", "conference").maybeSingle();
        if (error) throw new Error(error.message);
        return parseConference(data?.value);
    } catch (err) {
        console.error("Conference content unavailable, using defaults:", err);
        return CONFERENCE_DEFAULTS;
    }
}
