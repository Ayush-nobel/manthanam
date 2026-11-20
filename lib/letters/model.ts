import { EMAIL_ADDRESS } from "@/lib/email-address";
import { PERKS } from "@/lib/application";

/**
 * An offer letter's details: what the admin types in /admin/letters/new, what's stored in
 * offer_letters, and what the PDF and the email are built from. Shared by the form (browser) and the
 * server, so the same rules apply in both.
 */

export const LETTER_KINDS = ["internship", "job"] as const;
export type LetterKind = (typeof LETTER_KINDS)[number];
export const KIND_LABELS: Record<LetterKind, string> = { internship: "Internship", job: "Job" };

export const WORK_MODES = ["remote", "in_person", "hybrid"] as const;
export type WorkMode = (typeof WORK_MODES)[number];
export const WORK_MODE_LABELS: Record<WorkMode, string> = { remote: "Remote", in_person: "In person", hybrid: "Hybrid" };

export const LETTER_STATUSES = ["not_sent", "sent", "accepted", "declined", "withdrawn"] as const;
export type LetterStatus = (typeof LETTER_STATUSES)[number];
export const LETTER_STATUS_LABELS: Record<LetterStatus, string> = {
    not_sent: "Not sent",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    withdrawn: "Withdrawn",
};

/** Departments offered in the form (it accepts any other name too). */
export const DEPARTMENTS = ["Research", "Marketing", "Outreach", "Public Relations", "Events", "Design", "Technology", "Operations"];

/** What a new internship letter lists under "What you'll receive", one per line; editable per letter. */
export const DEFAULT_INTERNSHIP_BENEFITS = PERKS.join("\n");

export interface OfferLetter {
    kind: LetterKind;
    fullName: string;
    email: string;
    position: string;
    department: string;
    /** ISO dates, YYYY-MM-DD. */
    startDate: string;
    endDate: string | null;
    commitment: string;
    workMode: WorkMode;
    location: string;
    compensation: string;
    reportingTo: string;
    benefits: string;
    additionalTerms: string;
    respondBy: string;
}

/** As stored and printed: the letter plus what the server adds when it's issued. */
export interface IssuedLetter extends OfferLetter {
    reference: string;
    verifyCode: string;
    issueDate: string;
    signatoryName: string;
    signatoryTitle: string;
}

export type LetterErrors = Partial<Record<keyof OfferLetter, string>>;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const LIMITS = { fullName: 120, email: 254, position: 120, department: 120, commitment: 120, location: 120, compensation: 120, reportingTo: 120, benefits: 1000, additionalTerms: 2000 } as const;

const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const oneLine = (v: FormDataEntryValue | null, max: number) => text(v, max).replace(/\s+/g, " ");
const date = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return ISO.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) ? s : "";
};

/** Reads and checks the form. Returns the letter, or the problems to show next to each field. */
export function readLetterForm(form: FormData): { letter: OfferLetter; errors?: undefined } | { letter?: undefined; errors: LetterErrors } {
    const kind = String(form.get("kind")) as LetterKind;
    const workMode = String(form.get("workMode")) as WorkMode;
    const letter: OfferLetter = {
        kind,
        fullName: oneLine(form.get("fullName"), LIMITS.fullName),
        email: oneLine(form.get("email"), LIMITS.email).toLowerCase(),
        position: oneLine(form.get("position"), LIMITS.position),
        department: oneLine(form.get("department"), LIMITS.department),
        startDate: date(form.get("startDate")),
        endDate: date(form.get("endDate")) || null,
        commitment: oneLine(form.get("commitment"), LIMITS.commitment),
        workMode,
        location: oneLine(form.get("location"), LIMITS.location),
        compensation: oneLine(form.get("compensation"), LIMITS.compensation),
        reportingTo: oneLine(form.get("reportingTo"), LIMITS.reportingTo),
        benefits: text(form.get("benefits"), LIMITS.benefits),
        additionalTerms: text(form.get("additionalTerms"), LIMITS.additionalTerms),
        respondBy: date(form.get("respondBy")),
    };
    const e: LetterErrors = {};
    if (!(LETTER_KINDS as readonly string[]).includes(kind)) e.kind = "Choose internship or job.";
    if (!letter.fullName) e.fullName = "Enter their full name.";
    if (!EMAIL_ADDRESS.test(letter.email)) e.email = "Enter a valid email address.";
    if (!letter.position) e.position = "Enter the position, e.g. Social media intern.";
    if (!letter.department) e.department = "Choose or type a department.";
    if (!letter.startDate) e.startDate = "Choose a start date.";
    if (letter.endDate && letter.startDate && letter.endDate < letter.startDate) e.endDate = "The end date is before the start date.";
    if (kind === "internship" && !letter.endDate) e.endDate = "Internships need an end date.";
    if (!(WORK_MODES as readonly string[]).includes(workMode)) e.workMode = "Choose how they'll work.";
    if (workMode !== "remote" && !letter.location) e.location = "Enter where they'll work.";
    if (!letter.respondBy) e.respondBy = "Choose the date they must reply by.";
    return Object.keys(e).length ? { errors: e } : { letter };
}

/** "1 December 2026". */
export const formatDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Today's date in India, YYYY-MM-DD. */
export const todayInIndia = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** "Offer of internship: …" or "Offer of employment: …". */
export const offerTitle = (l: Pick<OfferLetter, "kind" | "position">) => (l.kind === "internship" ? `Offer of internship: ${l.position}` : `Offer of employment: ${l.position}`);

/** The rows the letter and the email both show, in order. Empty ones are left out. */
export function letterRows(l: OfferLetter): [string, string][] {
    const rows: [string, string][] = [
        ["Position", l.position],
        ["Department", l.department],
        ["Start date", formatDate(l.startDate)],
        [l.kind === "internship" ? "End date" : "Until", l.endDate ? formatDate(l.endDate) : l.kind === "job" ? "Ongoing" : ""],
        ["Commitment", l.commitment],
        ["Mode of work", `${WORK_MODE_LABELS[l.workMode]}${l.location ? `, ${l.location}` : ""}`],
        [l.kind === "internship" ? "Stipend" : "Pay", l.compensation || (l.kind === "internship" ? "Unpaid" : "")],
        ["Reports to", l.reportingTo],
    ];
    return rows.filter(([, v]) => v);
}

export const verifyUrl = (siteUrl: string, code: string) => `${siteUrl}/verify?code=${encodeURIComponent(code)}`;
