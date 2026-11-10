import { site } from "@/lib/site";

/**
 * The contact form, defined once for the browser (instant feedback) and the server route
 * (app/api/contact/route.ts, the check that counts).
 */

// Consent wording, stored with every message as the consent record (DPDP Act s.6; Rules r.3).
// If you change these texts, also bump PRIVACY_POLICY_VERSION to the Privacy Policy's "updated" date.
export const PRIVACY_POLICY_VERSION = "2026-11-10";
export const CONSENT_TEXT = `I agree that ${site.legal.name} may use my name, email address and message to reply to this enquiry, as described in the Privacy Policy. I can withdraw my consent at any time.`;
export const GUARDIAN_CONSENT_TEXT =
    "I am the parent or legal guardian of the person under 18 I am writing about. I consent to Manthanam using any details about them that I include in this message to reply to me, and I understand Manthanam will verify my identity before acting on them.";

export const TOPICS = ["General enquiry", "Joining Manthanam", "Research collaboration", "Media & speaking"] as const;

export type ContactField = "name" | "email" | "message" | "sender" | "consent" | "guardianConsent";
export type ContactErrors = Partial<Record<ContactField, string>>;
export interface ContactValues {
    name: string;
    email: string;
    topic: string;
    message: string;
    sender: string;
    consent: string;
    guardianConsent: string;
}

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
export function cleanContact(raw: Record<string, unknown>): ContactValues {
    return {
        name: s(raw.name),
        email: s(raw.email).toLowerCase(),
        topic: (TOPICS as readonly string[]).includes(s(raw.topic)) ? s(raw.topic) : TOPICS[0],
        message: s(raw.message),
        sender: s(raw.sender),
        consent: s(raw.consent),
        guardianConsent: s(raw.guardianConsent),
    };
}

export function validateContact(v: ContactValues): ContactErrors {
    const errors: ContactErrors = {};
    if (!v.name) errors.name = "Please enter your name.";
    else if (v.name.length > 100) errors.name = "Please keep your name under 100 characters.";
    if (!v.email) errors.email = "Please enter your email address.";
    else if (v.email.length > 254) errors.email = "That email address is too long.";
    else if (!/^[^\s@"\\]+@[^\s@"\\]+\.[^\s@"\\]+$/.test(v.email)) errors.email = "Enter an email address like name@example.com.";
    if (v.message.length < 10) errors.message = "Please write a short message (at least 10 characters).";
    else if (v.message.length > 5000) errors.message = "Please keep your message under 5,000 characters.";
    if (v.sender !== "adult" && v.sender !== "guardian") errors.sender = "Please tell us who is writing.";
    if (v.consent !== "yes") errors.consent = "Please tick this box so we can use your details to reply.";
    if (v.sender === "guardian" && v.guardianConsent !== "yes") errors.guardianConsent = "Please confirm you are the parent or legal guardian and give consent.";
    return errors;
}
