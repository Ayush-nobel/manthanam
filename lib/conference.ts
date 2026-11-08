/**
 * BRICS India Youth Conference 2026: the facts the registration page shows.
 * Only facts confirmed by Manthanam. Anything still undecided is `null` and the page says
 * "to be announced" in its place — fill these in and the page updates itself.
 */

export interface FeeRow {
    /** Who the fee applies to, e.g. "Delegate". */
    category: string;
    /** Amount in rupees, e.g. 1500. */
    amount: number;
    /** Optional note, e.g. "Early bird, until 30 November". */
    note?: string;
}

export const conference = {
    title: "BRICS India Youth Conference 2026",
    shortTitle: "BRICS India Youth Conference",
    /** Registration reference prefix, e.g. BIYC26-7KQ3XM. */
    refPrefix: "BIYC26",
    date: "2026-12-20",
    previousDate: "2026-11-03",
    place: "New Delhi",
    /** Venue name and address — not yet announced. */
    venue: null as string | null,
    registrationOpen: true,
    /** ISO date of the last day to register — not yet announced. */
    deadline: null as string | null,
    /** ISO date by which payment details are emailed to everyone registered. */
    paymentDetailsBy: "2026-11-25" as string | null,
    /** ISO date after which cancellations are not refunded — not yet announced. */
    cancellationDeadline: null as string | null,
    /** Fees by category — not yet confirmed; empty shows "to be announced". */
    fees: [] as FeeRow[],
} as const;

/** Who is registering. Under-18 registrations also need a parent or guardian (DPDP Act s.9). */
export const STATUSES = [
    "School student",
    "Undergraduate student",
    "Postgraduate student",
    "Research scholar",
    "Working professional",
    "Other",
] as const;

export const HEARD_FROM = [
    "Manthanam website",
    "Instagram",
    "LinkedIn",
    "My school, college or university",
    "A friend",
    "Impact Stir 26",
    "Other",
] as const;

export const FAQS: { q: string; a: string }[] = [
    {
        q: "Who can register?",
        a: "Registration is open to young people, including school students. If you are under 18 on the day of the conference, a parent or legal guardian must give consent in the form, and we will contact them to confirm before your place is confirmed.",
    },
    {
        q: "Is my place confirmed when I submit the form?",
        a: "Not yet. Submitting the form records your registration, and you get a registration number on screen and by email. Your place is confirmed once payment is received; payment details follow by 25 November 2026.",
    },
    {
        q: "How do I pay?",
        a: "You don't pay on this website. We will email payment details to everyone registered by 25 November 2026. Manthanam will never ask you for card details, UPI PINs or passwords by email or phone.",
    },
    {
        q: "Can I cancel?",
        a: "Yes. Email us with your registration number. Refunds follow our Refund Policy; the cancellation deadline will be announced on this page.",
    },
    {
        q: "When and where is it?",
        a: "On 20 December 2026 in New Delhi. It was first planned for 3 November. We will announce the venue on this page and email everyone who has registered.",
    },
    {
        q: "I made a mistake in my form.",
        a: "Email us with your registration number and the correction. Please don't register a second time with the same email address.",
    },
];
