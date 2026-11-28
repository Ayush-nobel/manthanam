import { EMAIL_ADDRESS } from "@/lib/email-address";
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
/** Campus ambassadors apply through the same form and admin list, from manthanam.in/register/ambassador. */
export const AMBASSADOR_ROLE = { id: "ambassador", name: "Campus ambassador", summary: "Bring delegates from your college to the conference with your own referral code." } as const;
export const ALL_APPLICATION_ROLES = [...APPLICATION_ROLES, AMBASSADOR_ROLE] as const;
export type ApplicationRole = (typeof ALL_APPLICATION_ROLES)[number]["id"];
export const roleName = (id: string) => ALL_APPLICATION_ROLES.find((r) => r.id === id)?.name ?? id;
export const isAmbassador = (id: string) => id === AMBASSADOR_ROLE.id;
/** How a role reads in a sentence: "Social media and content internship", or "Campus ambassador". */
export const roleTitle = (id: string) => (isAmbassador(id) ? AMBASSADOR_ROLE.name : `${roleName(id)} internship`);

/** Campus ambassador rewards, as announced. Shown on the ambassador page and in the confirmation email. */
export const AMBASSADOR_REWARDS = [
    "Anyone who registers with your referral code gets 10% off their delegate fee",
    "10 delegates with your code: 20% off your own fee",
    "40 or more delegates: 50% off your own fee",
    "80 delegates: your seat is free",
] as const;
export const AMBASSADOR_CONDITION = "Only delegates who have completed payment count towards your total.";
/** The reward an ambassador has reached with this many paid delegates (thresholds as announced). */
export function ambassadorReward(paid: number): string {
    if (paid >= 80) return "Free seat";
    if (paid >= 40) return "50% off their fee";
    if (paid >= 10) return "20% off their fee";
    return `No reward yet (${10 - paid} more paid delegate${10 - paid === 1 ? "" : "s"} for 20% off)`;
}

export const PERKS = ["A certificate of internship", "A letter of recommendation", "A place at the International Youth Summit 2026"] as const;

// Consent wording, stored with every application (DPDP Act s.6). If you change it, bump the version
// to the Privacy Policy's "updated" date.
export const APPLICATION_PRIVACY_VERSION = "2026-11-28";
export const APPLICATION_CONSENT_TEXT = `I agree that ${site.legal.name} may use the details in this form to consider my application and to contact me about it, as described in the Privacy Policy. I can withdraw my consent at any time.`;
export const ADULT_TEXT = "I am 18 or older.";
export const AMBASSADOR_GUARDIAN_CONSENT_TEXT =
    "I am the parent or legal guardian of the applicant, who is under 18. I consent to Manthanam using their details to consider this application and to run the campus ambassador programme with them, and to contacting me about it.";

export const APPLICATION_FIELDS = ["role", "fullName", "email", "phone", "organisation", "city", "motivation", "portfolio", "adult", "guardianName", "guardianEmail", "guardianConsent", "consent"] as const;
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
    guardianName: 100,
    guardianEmail: 254,
};

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
export function cleanApplication(raw: Record<string, unknown>): ApplicationValues {
    const out = Object.fromEntries(APPLICATION_FIELDS.map((f) => [f, s(raw[f])])) as ApplicationValues;
    out.email = out.email.toLowerCase();
    out.guardianEmail = out.guardianEmail.toLowerCase();
    return out;
}

export function validateApplication(v: ApplicationValues): ApplicationErrors {
    const e: ApplicationErrors = {};
    if (!v.fullName) e.fullName = "Enter your full name.";
    if (!v.email) e.email = "Enter your email address.";
    else if (!EMAIL_ADDRESS.test(v.email)) e.email = "Enter an email address like name@example.com.";
    const digits = v.phone.replace(/\D/g, "").length;
    if (!v.phone) e.phone = "Enter your phone number.";
    else if (!/^\+?[\d\s()-]+$/.test(v.phone) || digits < 7 || digits > 15) e.phone = "Enter a phone number like +91 98765 43210.";
    if (!v.city) e.city = "Enter your city or town.";
    if (!v.organisation) e.organisation = "Enter your college, university or workplace.";
    if (!ALL_APPLICATION_ROLES.some((r) => r.id === v.role)) e.role = "Choose the role you’re applying for.";
    if (v.motivation.length < 50) e.motivation = "Tell us a little more (at least 50 characters).";
    if (v.portfolio && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(v.portfolio)) e.portfolio = "Enter a full link starting with https://, or leave it empty.";
    for (const [f, max] of Object.entries(APPLICATION_LIMITS) as [ApplicationField, number][])
        if (v[f].length > max) e[f] = `Please keep this under ${max.toLocaleString("en-IN")} characters.`;
    if (isAmbassador(v.role)) {
        // Under-18 ambassadors are welcome with a parent or guardian's consent (DPDP Act s.9).
        if (v.adult !== "yes") {
            if (!v.guardianName) e.guardianName = "Enter your parent or guardian’s full name.";
            if (!v.guardianEmail) e.guardianEmail = "Enter your parent or guardian’s email address.";
            else if (!EMAIL_ADDRESS.test(v.guardianEmail)) e.guardianEmail = "Enter an email address like name@example.com.";
            else if (v.guardianEmail.toLowerCase() === v.email.toLowerCase()) e.guardianEmail = "Use your parent or guardian’s own email address, not yours.";
            if (v.guardianConsent !== "yes") e.guardianConsent = "Your parent or guardian must tick this box to give consent.";
        }
    } else if (v.adult !== "yes") e.adult = "These internships are for people aged 18 or over.";
    if (v.consent !== "yes") e.consent = "Please tick this box so we can consider your application.";
    return e;
}
