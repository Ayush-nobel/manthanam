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
    date: "2026-12-19",
    previousDate: "2026-11-03",
    place: "New Delhi",
    /** Venue name and address — not yet announced. */
    venue: null as string | null,
    registrationOpen: true,
    /** ISO date of the last day to register — not yet announced. */
    deadline: null as string | null,
    /** ISO date by which payment details are emailed to everyone registered. */
    paymentDetailsBy: "2026-11-25" as string | null,
    /** How to pay (UPI ID, bank account…), shown in the payment email and on the payment page. Empty: payment emails can't be sent. */
    paymentInstructions: [
        "Bank transfer (NEFT, IMPS or RTGS)",
        "Bank: State Bank of India",
        "Branch: P.B. No. 1, Chowrasia Complex, Simaria Chowk, Satna",
        "Account number: 00000042960170002",
        "IFSC: SBIN0000474",
    ].join("\n") as string,
    /** ISO date payment is due by, or null for no stated date. */
    paymentDueBy: null as string | null,
    /** ISO date after which cancellations are not refunded — not yet announced. */
    cancellationDeadline: null as string | null,
    /** Fees by category; empty shows "to be announced". */
    fees: [{ category: "Delegate", amount: 2000, note: "One fee for every delegate" }] as FeeRow[],
    theme: "From Strength to Strength: Youth Shaping the Future of BRICS",
    /** Public expectation agreed with Manthanam (the sponsorship brochure's 5,000+ is not used publicly). */
    expected: "3,000+ delegates expected",
    /** What the delegate fee covers, as confirmed by Manthanam. */
    included: [
        "Full-day access to all five panels and the Youth Roundtable",
        "A place in a working group, and credit in the BIYC 2026 Youth Declaration",
        "Lunch, high tea and a delegate kit",
        "A certificate of participation",
        "The BRICS cultural evening",
    ],
    independence:
        "BRICS India Youth Conference 2026 is an independent, youth-led conference organised by Manthanam Research Foundation. It is not part of the official BRICS 2026 calendar of the Government of India.",
} as const;

/** Thematic pillars (sponsorship brochure, November 2026). */
export const PILLARS = [
    { name: "Geopolitics", body: "International cooperation, strategic autonomy, BRICS expansion and India’s role in a multipolar world." },
    { name: "Technology and AI", body: "AI for the Global South, AI governance, digital public infrastructure and cybersecurity." },
    { name: "Entrepreneurship", body: "From young minds to global enterprises: startups, youth employment and cross-BRICS economic cooperation." },
    { name: "Education", body: "Future skills, academic mobility, research collaboration and student exchange." },
    { name: "Energy and sustainability", body: "Climate action, the clean energy transition and resilient societies." },
    { name: "Youth diplomacy", body: "The next generation of BRICS diplomats, cultural diplomacy and people-to-people ties." },
] as const;

/** Indicative timings for Saturday 19 December (brochure). The final run-of-show may change. */
export const AGENDA: { time: string; title: string; detail?: string }[] = [
    { time: "8:30 am", title: "Registration and welcome networking" },
    { time: "9:30 am", title: "Inaugural ceremony" },
    { time: "10:30 am", title: "Panel I: BRICS and the new world order", detail: "The Future of BRICS in a Multipolar World" },
    { time: "11:45 am", title: "Panel II: AI, technology and innovation", detail: "AI for the Global South" },
    { time: "12:45 pm", title: "Panel III: Youth, entrepreneurship and economic growth", detail: "From Young Minds to Global Enterprises" },
    { time: "1:30 pm", title: "Diplomatic networking lunch" },
    { time: "2:30 pm", title: "Panel IV: Youth diplomacy", detail: "The Next Generation of BRICS Diplomacy" },
    { time: "3:15 pm", title: "BRICS high tea and networking" },
    { time: "3:45 pm", title: "Panel V: Sustainability and human development", detail: "Building Resilient Societies for the Next Generation" },
    { time: "4:45 pm", title: "Youth Roundtable", detail: "Youth 2040: What Should BRICS Look Like? Five working groups draft recommendations." },
    { time: "5:30 pm", title: "BIYC 2026 Youth Declaration", detail: "Youth representatives present the consolidated recommendations." },
    { time: "6:00 pm", title: "Valedictory ceremony and group photograph" },
    { time: "7:00 pm", title: "BRICS cultural evening" },
];

/** Announced speakers (confirmed by Manthanam for promotion, November 2026). */
export const SPEAKERS = [
    { name: "Shri Shivraj Singh Chouhan", role: "Minister of Agriculture and Farmers Welfare, Government of India" },
    { name: "Shri Chirag Paswan", role: "Minister of Food Processing Industries, Government of India" },
    { name: "Shri Amitabh Kant", role: "Former G20 Sherpa (India); former CEO, NITI Aayog" },
    { name: "Shri Sanjeev Sanyal", role: "Member, Economic Advisory Council to the Prime Minister" },
    { name: "Ambassador Sujan R. Chinoy", role: "Director General, Manohar Parrikar Institute for Defence Studies and Analyses" },
    { name: "Shri Satish Chandra Dubey", role: "Member of Parliament, Rajya Sabha" },
    { name: "Ambassador T. P. Seetharam", role: "Former Ambassador of India to the United Arab Emirates" },
    { name: "Ambassador Amarendra Khatua", role: "Former Secretary (Special Assignment), Ministry of External Affairs" },
    { name: "Shri Arun Goyal", role: "Former Secretary to the Government of India, Cabinet Secretariat" },
    { name: "Lt. Gen. Devendra Pratap Pandey (Retd.)", role: "Former General Officer, Indian Army" },
    { name: "Lt. Gen. Ashok Bhimse Shivane (Retd.)", role: "Former General Officer, Indian Army" },
    { name: "Shri Sameep Shastri", role: "Chairman, BRICS Chamber of Commerce and Industry" },
    { name: "Major Rishabh Singh Sambyal (Retd.)", role: "Former Aide-de-Camp to the President of India" },
    { name: "Shri Parsh Kothari", role: "Co-Founder and CEO, Think School" },
    { name: "Shri Revant Himatsingka", role: "Food Pharmer; public health communicator" },
] as const;

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
        q: "How much does it cost, and what does that include?",
        a: "₹2,000 for every delegate. It covers the full day (all five panels and the Youth Roundtable), a place in a working group with credit in the BIYC 2026 Youth Declaration, lunch, high tea, a delegate kit, a certificate of participation, and the BRICS cultural evening.",
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
        a: "On 19 December 2026 in New Delhi. It was first planned for 3 November. We will announce the venue on this page and email everyone who has registered.",
    },
    {
        q: "I made a mistake in my form.",
        a: "Email us with your registration number and the correction. Please don't register a second time with the same email address.",
    },
];
