import type { StaticImageData } from "next/image";
import iysLogo from "@/public/events/iys-2026-logo.png";
import p01 from "@/public/events/impact-stir-26/01.jpg";
import p02 from "@/public/events/impact-stir-26/02.jpg";
import p03 from "@/public/events/impact-stir-26/03.jpg";
import p04 from "@/public/events/impact-stir-26/04.jpg";
import p05 from "@/public/events/impact-stir-26/05.jpg";
import p06 from "@/public/events/impact-stir-26/06.jpg";
import p07 from "@/public/events/impact-stir-26/07.jpg";
import p08 from "@/public/events/impact-stir-26/08.jpg";
import p09 from "@/public/events/impact-stir-26/09.jpg";
import p10 from "@/public/events/impact-stir-26/10.jpg";
import p11 from "@/public/events/impact-stir-26/11.jpg";
import p12 from "@/public/events/impact-stir-26/12.jpg";
import p13 from "@/public/events/impact-stir-26/13.jpg";
import p14 from "@/public/events/impact-stir-26/14.jpg";
import p15 from "@/public/events/impact-stir-26/15.jpg";

export interface EventPhoto {
    src: StaticImageData;
    /** Describes what is in the photo; also shown as the caption when enlarged. */
    alt: string;
    /** Size in the gallery grid: "lead" (2×2), "wide" (2×1), "tall" (1×2) or a single cell. */
    span?: "lead" | "wide" | "tall";
}

export interface UpcomingEvent {
    title: string;
    date: string; // ISO date
    previousDate?: string; // ISO date, if rescheduled
    place: string;
    /** Event logo with a transparent background; only for light backgrounds. */
    logo?: StaticImageData;
    /** Alt text for the logo, when it isn't simply the event's title. */
    logoAlt?: string;
    body: string;
}

export interface PastEvent {
    slug: string;
    title: string;
    date: string; // ISO date
    place: string;
    theme?: string;
    body: string;
    credit: string;
    photos: EventPhoto[];
}

// Only facts confirmed by Manthanam. Photos: HELPSTiR, used with permission; all metadata
// (including phone GPS locations) was stripped when they were exported for the web.
export const upcoming: UpcomingEvent[] = [
    {
        title: "BRICS India Youth Conference 2026",
        date: "2026-12-19",
        previousDate: "2026-11-03",
        place: "New Delhi",
        logo: iysLogo,
        logoAlt: "International Youth Summit 2026 logo",
        body: "Organised by Manthanam. The conference was first planned for 3 November and now takes place on 19 December 2026.",
    },
];

export const past: PastEvent[] = [
    {
        slug: "impact-stir-26",
        title: "Impact Stir 26",
        date: "2026-10-23",
        place: "New Delhi",
        theme: "Youth-led Impact and Innovation, powered by AI",
        body: "Hosted by HELPSTiR as the official pre-event of the BRICS India Youth Conference 2026, which Manthanam is organising. The day opened with the lighting of the lamp and ran through a panel discussion, a publication release, and a courtyard of stalls, crafts and conversation.",
        credit: "Photographs: HELPSTiR",
        photos: [
            { src: p01, alt: "Panellists in conversation on stage", span: "lead" },
            { src: p02, alt: "Volunteers arrange marigold petals around the lamp before the opening", span: "tall" },
            { src: p03, alt: "Two guests talk in the auditorium after a session" },
            { src: p04, alt: "Two guests in the audience follow the discussion" },
            { src: p05, alt: "Students paint small crafts at a stall", span: "wide" },
            { src: p06, alt: "Students talk across a stall table in the courtyard", span: "wide" },
            { src: p07, alt: "A game of chess at a table in the courtyard", span: "wide" },
            { src: p08, alt: "Guests in conversation beside a screen of market data", span: "wide" },
            { src: p09, alt: "Hand-printed postcards laid out with a handwritten sign: postcards for sale" },
            { src: p10, alt: "Two students paint on a mat in the courtyard" },
            { src: p11, alt: "Visitors browse a stall in the courtyard" },
            { src: p12, alt: "Guests watch from the side of the auditorium" },
            { src: p13, alt: "Students talk in the courtyard between the stalls", span: "wide" },
            { src: p14, alt: "Members of the Manthanam team talk at the backdrop between sessions" },
            { src: p15, alt: "Registration at the start of the day" },
        ],
    },
];
