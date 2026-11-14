import { site } from "@/lib/site";

/**
 * The internship application form (manthanam.in/join), defined once for the browser and the
 * server route (app/api/apply/route.ts). Edit roles and wording here.
 */

export const APPLICATION_ROLES = [
    { id: "social", name: "Social media and content", summary: "Plan and write our Instagram and LinkedIn. Turn our research and events into posts people save and share." },
    { id: "outreach", name: "Outreach and partnerships", summary: "Bring colleges, student societies and partner organisations to the conference. Write to them, follow up, keep track." },
    { id: "pr", name: "PR and media", summary: "Pitch our work to journalists. Draft press notes and look after media coverage of the conference." },
] as const;
export type ApplicationRole = (typeof APPLICATION_ROLES)[number]["id"];
export const roleName = (id: string) => APPLICATION_ROLES.find((r) => r.id === id)?.name ?? id;

export const PERKS = ["A certificate of internship", "A letter of recommendation", "A place at the BRICS India Youth Conference 2026"] as const;

// Consent wording, stored with every application (DPDP Act s.6). If you change it, bump the version
// to the Privacy Policy's "updated" date.
export const APPLICATION_PRIVACY_VERSION = "2026-11-14";
export const APPLICATION_CONSENT_TEXT = `I agree that ${site.legal.name} may use the details in this form to consider my application and to contact me about it, as described in the Privacy Policy. I can withdraw my consent at any time.`;
export const ADULT_TEXT = "I am 18 or older.";

export const APPLICATION_FIELDS = ["role", "fullName", "email", "phone", "organisation", "city", "motivation", "portfolio", "adult", "consent"] as const;
export type ApplicationField = (typeof APPLICATION_FIELDS)[number];
export type ApplicationValues = Record<ApplicationField, string>;
export type ApplicationErrors = Partial<Record<ApplicationField, string>>;

export const APPLICATION_LIMITS: Partial<Record<ApplicationField, number>> = {
    fullName: 100,
    email: 254,
    phone: 20,
    city: 80,
    organisation: 150,
    motivation: 1500,
    portfolio: 300,
};

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
export function cleanApplication(raw: Record<string, unknown>): ApplicationValues {
    const out = Object.fromEntries(APPLICATION_FIELDS.map((f) => [f, s(raw[f])])) as ApplicationValues;
    out.email = out.email.toLowerCase();
    return out;
}

export function validateApplication(v: ApplicationValues): ApplicationErrors {
    const e: ApplicationErrors = {};
    if (!v.fullName) e.fullName = "Enter your full name.";
    if (!v.email) e.email = "Enter your email address.";
    else if (!/^[^\s@"\\]+@[^\s@"\\]+\.[^\s@"\\]+$/.test(v.email)) e.email = "Enter an email address like name@example.com.";
    const digits = v.phone.replace(/\D/g, "").length;
    if (!v.phone) e.phone = "Enter your phone number.";
    else if (!/^\+?[\d\s()-]+$/.test(v.phone) || digits < 7 || digits > 15) e.phone = "Enter a phone number like +91 98765 43210.";
    if (!v.city) e.city = "Enter your city or town.";
    if (!v.organisation) e.organisation = "Enter your college, university or workplace.";
    if (!APPLICATION_ROLES.some((r) => r.id === v.role)) e.role = "Choose the role you’re applying for.";
    if (v.motivation.length < 50) e.motivation = "Tell us a little more (at least 50 characters).";
    if (v.portfolio && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(v.portfolio)) e.portfolio = "Enter a full link starting with https://, or leave it empty.";
    for (const [f, max] of Object.entries(APPLICATION_LIMITS) as [ApplicationField, number][])
        if (v[f].length > max) e[f] = `Please keep this under ${max.toLocaleString("en-IN")} characters.`;
    if (v.adult !== "yes") e.adult = "These internships are for people aged 18 or over.";
    if (v.consent !== "yes") e.consent = "Please tick this box so we can consider your application.";
    return e;
}
