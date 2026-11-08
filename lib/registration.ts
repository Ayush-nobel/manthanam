import { conference, HEARD_FROM, STATUSES } from "@/lib/conference";
import { site } from "@/lib/site";

/**
 * One definition of the registration form, shared by the browser (instant feedback) and the
 * server route (the check that counts). Keep the two in step by only editing this file.
 */

// Consent wording is stored with every registration as the consent record (DPDP Act s.6, s.9).
// If you change these texts, also bump PRIVACY_POLICY_VERSION to the Privacy Policy's "updated" date.
export const PRIVACY_POLICY_VERSION = "2026-11-08";
export const CONSENT_TEXT = `I agree that ${site.legal.name} may use the details in this form to process my registration for the ${conference.title} and to contact me about it, as described in the Privacy Policy. I can withdraw my consent at any time.`;
export const GUARDIAN_CONSENT_TEXT =
    "I am the parent or legal guardian of the person registering, who is under 18. I consent to Manthanam using their details to process this registration, and I understand Manthanam will contact me to verify my identity before confirming their place.";
export const PLACE_TEXT =
    "I understand that my place is confirmed only when Manthanam confirms it by email, and that any fee is paid using the instructions in that email, not on this website.";

export const FIELDS = [
    "fullName",
    "email",
    "phone",
    "dateOfBirth",
    "city",
    "state",
    "country",
    "institution",
    "status",
    "motivation",
    "heardFrom",
    "accessNeeds",
    "guardianName",
    "guardianRelation",
    "guardianEmail",
    "guardianPhone",
    "consent",
    "guardianConsent",
    "placeTerms",
] as const;
export type Field = (typeof FIELDS)[number];
export type Values = Partial<Record<Field, string>>;
export type Errors = Partial<Record<Field, string>>;

export const RELATIONS = ["Parent", "Legal guardian"] as const;

const LIMITS: Partial<Record<Field, number>> = {
    fullName: 100,
    email: 254,
    phone: 20,
    city: 80,
    state: 80,
    country: 60,
    institution: 150,
    motivation: 1000,
    accessNeeds: 500,
    guardianName: 100,
    guardianEmail: 254,
    guardianPhone: 20,
};
export const limit = (f: Field) => LIMITS[f];

// No quotes or backslashes: real addresses don't need them, and the sheet lookup quotes the value.
const EMAIL = /^[^\s@"\\]+@[^\s@"\\]+\.[^\s@"\\]+$/;
/** Digits with an optional leading +, spaces, hyphens or brackets; 7–15 digits in all (ITU E.164). */
function validPhone(v: string) {
    if (!/^\+?[\d\s()-]+$/.test(v)) return false;
    const digits = v.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15;
}

/** Age in whole years on the day of the conference, or null if the date isn't a real date. */
export function ageOnConferenceDay(dob: string): number | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
    const [y, m, d] = dob.split("-").map(Number);
    const birth = new Date(Date.UTC(y, m - 1, d));
    if (birth.getUTCFullYear() !== y || birth.getUTCMonth() !== m - 1 || birth.getUTCDate() !== d) return null;
    const [cy, cm, cd] = conference.date.split("-").map(Number);
    let age = cy - y;
    if (cm < m || (cm === m && cd < d)) age -= 1;
    return age;
}

export const isMinor = (dob: string) => {
    const age = ageOnConferenceDay(dob);
    return age !== null && age < 18;
};

/** Trimmed string values only; anything not in FIELDS is dropped. */
export function clean(input: Record<string, unknown>): Values {
    const out: Values = {};
    for (const f of FIELDS) {
        const v = input[f];
        if (typeof v === "string") out[f] = v.trim();
    }
    return out;
}

export function validate(v: Values): Errors {
    const e: Errors = {};
    const required = (f: Field, message: string) => {
        if (!v[f]) e[f] = message;
    };

    required("fullName", "Enter your full name.");
    if (!v.email) e.email = "Enter your email address.";
    else if (!EMAIL.test(v.email)) e.email = "Enter an email address like name@example.com.";
    if (!v.phone) e.phone = "Enter a phone number we can reach you on.";
    else if (!validPhone(v.phone)) e.phone = "Enter a phone number with 7 to 15 digits, for example +91 98765 43210.";

    const age = v.dateOfBirth ? ageOnConferenceDay(v.dateOfBirth) : null;
    if (!v.dateOfBirth) e.dateOfBirth = "Enter your date of birth.";
    else if (age === null || age < 5 || age > 100) e.dateOfBirth = "Check your date of birth: it should be a real date in the past.";

    required("city", "Enter your city or town.");
    required("state", "Enter your state or region.");
    required("country", "Enter your country.");
    required("institution", "Enter your school, college, university or organisation.");
    if (!v.status) e.status = "Choose what best describes you.";
    else if (!(STATUSES as readonly string[]).includes(v.status)) e.status = "Choose one of the options.";
    if (v.heardFrom && !(HEARD_FROM as readonly string[]).includes(v.heardFrom)) e.heardFrom = "Choose one of the options.";

    if (age !== null && age < 18) {
        required("guardianName", "Enter your parent or guardian’s full name.");
        if (!v.guardianRelation) e.guardianRelation = "Choose how they are related to you.";
        else if (!(RELATIONS as readonly string[]).includes(v.guardianRelation)) e.guardianRelation = "Choose one of the options.";
        if (!v.guardianEmail) e.guardianEmail = "Enter your parent or guardian’s email address.";
        else if (!EMAIL.test(v.guardianEmail)) e.guardianEmail = "Enter an email address like name@example.com.";
        else if (v.email && v.guardianEmail.toLowerCase() === v.email.toLowerCase())
            e.guardianEmail = "Use your parent or guardian’s own email address, not yours.";
        if (!v.guardianPhone) e.guardianPhone = "Enter your parent or guardian’s phone number.";
        else if (!validPhone(v.guardianPhone)) e.guardianPhone = "Enter a phone number with 7 to 15 digits.";
        if (v.guardianConsent !== "yes") e.guardianConsent = "Your parent or guardian must tick this box to give consent.";
    }

    if (v.consent !== "yes") e.consent = "Tick this box so we can use your details for your registration.";
    if (v.placeTerms !== "yes") e.placeTerms = "Tick this box to confirm you understand how places are confirmed.";

    for (const f of FIELDS) {
        const max = LIMITS[f];
        if (max && (v[f]?.length ?? 0) > max && !e[f]) e[f] = `Keep this under ${max} characters.`;
    }
    return e;
}
