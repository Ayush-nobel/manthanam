# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

In priority order (all four are intended audiences):

1. **Prospective members** — students and young professionals deciding whether to join, write for, or volunteer with Manthanam. The site must show them what membership involves and give them a clear way to express interest.
2. **Readers of the work** — policy students, researchers, journalists, and the interested public reading Insights and research.
3. **Decision-makers** — officials, diplomats, senior academics, and other think tanks judging whether Manthanam is credible and worth engaging.
4. **Partners and funders** — institutions, universities, or sponsors considering collaboration, events, or support.

## Product Purpose

The website is Manthanam's public home: it introduces the organisation, publishes its writing (Insights), presents its team, recruits members, and gives every audience a way to get in touch. It launches the organisation publicly — there is no published body of work yet.

Success metrics are not yet defined (open decision).

## Positioning

Manthanam describes itself as **India's youth-driven strategic think tank**, New Delhi, est. 2024. The two differentiating claims the organisation stands behind publicly:

- **Run by young people** — led and staffed by students and young professionals, not senior experts with a youth wing.
- **Independent** — not affiliated with a political party, government body, or university.

Its themes are geopolitics, security, and statecraft. "Civilisational wisdom" and the "churning" (मन्थनम्, Samudra Manthan) idea are **tone and brand language, not differentiating claims**: keep using them in voice, but do not present an Indic strategic method or a debate-first methodology as what sets Manthanam apart.

## Operating Context

- Based in New Delhi; English-language site that also carries Devanagari (Hindi/Sanskrit) text.
- Writing is published as Markdown files in `content/insights/` (frontmatter: title, author, date, category, summary); categories are Commentary, Analysis, Policy Brief, Discussion (category list chosen during build — confirm or change).
- Team members are maintained in `lib/team.ts` (name, role, bio, photo, optional LinkedIn / Instagram / email); photos live in `public/team/`.
- Contact form submits to Formspree via the `NEXT_PUBLIC_FORMSPREE_URL` environment variable; `contact@manthanam.in` is the fallback address.
- Hosting/deployment target: not yet decided.

## Capabilities and Constraints

- Homepage sections: hero, About (philosophy), Focus Areas (5), Latest Research (from Insights), Team, Join, Contact.
- Insights index with category filter pages and individual article pages; unknown URLs return a real 404.
- Join is currently a call to action that leads to the contact form; there is no membership application system.
- Team member email addresses must not appear as plain text in the HTML (scraping protection).
- Nav items "Insights" and "Discussions" exist; "Discussions" currently maps to the Discussion category of Insights (assumption — confirm).
- Open decisions: success metrics, deployment target, whether membership needs its own application flow, final Insights category list.

## Brand Commitments

- **Name:** Manthanam (मन्थनम्). Tagline: "India's youth-driven strategic think tank." Location and founding: New Delhi · Est. 2024.
- **Logo:** monochrome white wordmark "MANTHAN▲M." with a twin-triangle mark (`public/logo.png`; trimmed `public/logo-wordmark.png`). The logo contains no colour.
- **Approved copy:** hero headline "India Needs / Thinkers, Not Followers."; hero description "Manthanam is India's youth-driven strategic think tank — forging policy, shaping discourse, and reviving civilisational wisdom at the intersection of geopolitics, security, and statecraft."; buttons "Explore Research", "Our Philosophy"; CTA "Join the Mission".
- **Visual constraints the user specified (binding):** restrained editorial look; dark ink background with a saffron accent; fonts Bodoni Moda (headings), EB Garamond (body, ≥18px), Noto Serif Devanagari (Devanagari). DESIGN.md, when written, owns the rest of the visual system.
- Copy drafted during the build (About principles, Focus Area descriptions, Join paths, section intros) has not been explicitly approved — treat it as draft.

## Evidence on Hand

- **Formal status:** registered as a non-governmental organisation (NGO). The legal form (society, trust, or Section 8 company) and registration number were not provided — do not state them.
- **Team:** four confirmed members, with their own bios, photos, and links in `lib/team.ts` — Harsh Dev Garg (Founder and Chief Executive Officer), Ayush Shukla, Mohammad Yusuf, and Kishnav Kandhari (all Secretary General). Photo caveats: `CEO.png` has a circular crop baked in; `YUSUF.png` is a small full-length shot (354×472); better originals are still wanted.
- **Published work:** none yet. `content/insights/sample-insight.md` is a clearly marked placeholder.
- **Absences future work must not fabricate:** research, publications, events, press coverage, partners, affiliations, testimonials, member counts, statistics, or funders. There are currently no partners.

## Product Principles

1. **Credibility is earned, never manufactured.** Show only real work, people, and status; leave space honestly empty rather than filling it with invented proof.
2. **Lead with what is true and distinctive:** youth-led and independent.
3. **Membership is the first conversion.** Every page should make it easy for a prospective member to understand the organisation and get in touch.
4. **Serious enough for decision-makers.** Restraint, precision, and well-sourced writing over hype.
5. **Content stays editable without code changes** — writing and team details live in plain files (Markdown, `lib/team.ts`).

## Accessibility & Inclusion

- Body text at least 18px; Devanagari must render correctly on every device (Noto Serif Devanagari).
- Motion must respect `prefers-reduced-motion`; animated backgrounds must never cross or obscure text.
- No formal compliance standard has been set.
