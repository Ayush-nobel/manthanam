---
name: Manthanam
description: India's youth-driven strategic think tank — a composed night-ink editorial world with a single saffron signal.
colors:
  kesari-saffron: "#ff9933"
  kesari-saffron-deep: "#e8821c"
  midnight-ink: "#0b0c10"
  ink-raised: "#14161c"
  ink-lifted: "#1c1f27"
  logo-white: "#fdfcfc"
  muted-ink: "#a8a196"
  faint-ink: "#8a847a"
  hairline: "rgb(253 252 252 / 0.1)"
  field-edge: "rgb(253 252 252 / 0.16)"
  ember-error: "#f26d5b"
typography:
  display:
    fontFamily: "Bodoni Moda, Noto Serif Devanagari, Didot, serif"
    fontSize: "clamp(1.625rem, 6.9vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0em"
  headline:
    fontFamily: "Bodoni Moda, Noto Serif Devanagari, Didot, serif"
    fontSize: "min(clamp(1.6rem, 6.2vw, 2.75rem), 12cqi)"
    fontWeight: 400
    lineHeight: 1.15
  headline-page:
    fontFamily: "Bodoni Moda, Noto Serif Devanagari, Didot, serif"
    fontSize: "clamp(2rem, 8vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Bodoni Moda, Noto Serif Devanagari, Didot, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.33
  lead:
    fontFamily: "Bodoni Moda, Noto Serif Devanagari, Didot, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "EB Garamond, Noto Serif Devanagari, Garamond, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body-large:
    fontFamily: "EB Garamond, Noto Serif Devanagari, Garamond, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.625
  ui:
    fontFamily: "EB Garamond, Garamond, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.55
  label:
    fontFamily: "EB Garamond, Garamond, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.2em"
  devanagari:
    fontFamily: "Noto Serif Devanagari, serif"
rounded:
  pill: "9999px"
  field: "14px"
  card: "18px"
  panel: "22px"
spacing:
  hairline-gap: "1px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  card: "28px"
  xl: "48px"
  section-mobile: "96px"
  section: "128px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.kesari-saffron}"
    textColor: "{colors.midnight-ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.kesari-saffron-deep}"
    textColor: "{colors.midnight-ink}"
  button-secondary:
    backgroundColor: "rgb(253 252 252 / 0.05)"
    textColor: "{colors.logo-white}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "rgb(253 252 252 / 0.1)"
  chip:
    backgroundColor: "rgb(253 252 252 / 0.05)"
    textColor: "{colors.logo-white}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-active:
    backgroundColor: "{colors.kesari-saffron}"
    textColor: "{colors.midnight-ink}"
  icon-button:
    backgroundColor: "rgb(253 252 252 / 0.05)"
    textColor: "{colors.logo-white}"
    rounded: "{rounded.pill}"
    size: "44px"
  icon-button-hover:
    backgroundColor: "{colors.kesari-saffron}"
    textColor: "{colors.midnight-ink}"
  card:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.logo-white}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  panel:
    backgroundColor: "{colors.ink-raised}"
    rounded: "{rounded.panel}"
    padding: "80px 48px"
  input:
    backgroundColor: "{colors.midnight-ink}"
    textColor: "{colors.logo-white}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
  nav-link:
    textColor: "{colors.logo-white}"
    typography: "{typography.ui}"
    padding: "8px 12px"
  badge:
    backgroundColor: "rgb(253 252 252 / 0.1)"
    textColor: "{colors.logo-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 10px"
---

# Design System: Manthanam

## Overview

**Creative North Star: "The Night Assembly"**

A late-evening chamber of debate: formal, composed, and lit by a single warm signal. Every surface is a shade of Midnight Ink; type is set in Logo White, the exact white of Manthanam's own wordmark; and Kesari Saffron appears only where the room needs to look — the one primary action, the one word that matters in a headline, the small marker that says "here". The effect should read as an institution that takes its subject seriously, not as a student project dressed up.

The system is **authoritative, warm, austere, and composed**. Authority comes from high-contrast Didone headlines (Bodoni Moda) and generous, unhurried spacing. Warmth comes from the saffron and from a humanist old-style text face (EB Garamond) set large enough to read comfortably at 18px. Austerity means no decoration that isn't doing work: no shadows, no photographic or noise textures, no gradients on type. Composure means motion is slow and ambient — fades that settle, and a churning background of rings and spirals that turns over minutes and never crosses the words.

The world is dark by design and has no light mode. Density is low on marketing sections (128px between sections on desktop) and rises only inside forms and lists.

**Key Characteristics:**
- Midnight Ink ground with three tonal steps instead of shadows.
- One chromatic colour, Kesari Saffron, used sparingly.
- Bodoni Moda speaks; EB Garamond explains. No sans-serif anywhere.
- Hairline (10% white) borders and dividers carry all structure.
- Pill-shaped controls; softly rounded cards and fields.
- Slow, purposeful motion that respects reduced-motion settings.

## Colors

A night palette: three inks, one white, two warm greys, and a single saffron.

### Primary
- **Kesari Saffron** (#ff9933): The only chromatic colour. Primary buttons, the nav's "Join the Mission" CTA, the active filter chip, the one highlighted headline word ("Thinkers"), section index numbers, roles, small dots and icon tints, focus rings, and text selection. Text on saffron is always Midnight Ink (9.2:1).
- **Kesari Saffron Deep** (#e8821c): Hover and pressed state of saffron fills. Never used at rest.

### Neutral
- **Midnight Ink** (#0b0c10): The page ground and the fill of form fields. Text colour on saffron.
- **Raised Ink** (#14161c): Cards, the contact form panel, the Join panel, inner-page header (80% with blur). One step up from the ground.
- **Lifted Ink** (#1c1f27): The highest tonal step — initials avatars, photo frames, inline code. Use sparingly; it is the "spotlit" surface.
- **Logo White** (#fdfcfc): All primary text and headings (19.1:1 on ink). Measured from the logo; its translucent forms (90%, 80%, 75%) carry secondary nav links and descriptions.
- **Muted Ink** (#a8a196): Body copy that supports a heading — descriptions, summaries, bios (7.6:1).
- **Faint Ink** (#8a847a): The quietest readable text — eyebrow labels, metadata, hints, footer tagline (5.3:1). Never go lighter-on-dark than this for text.
- **Hairline** (rgb(253 252 252 / 0.1)): Every border and divider. **Field Edge** (rgb(253 252 252 / 0.16)) is its slightly stronger sibling for input outlines.
- **Ember Error** (#f26d5b): Validation errors and failure alerts only.

### Named Rules
**The Single Lamp Rule.** Kesari Saffron is the only colour that isn't ink or white, and it covers well under 10% of any screen. If two saffron elements compete in one view, one of them is wrong.

**The Logo White Rule.** Light text is Logo White (#fdfcfc) or a translucent form of it — never pure #ffffff, never a cream or cool grey. Type and logo must match.

## Typography

**Display Font:** Bodoni Moda (with Noto Serif Devanagari, Didot, serif)
**Body Font:** EB Garamond (with Noto Serif Devanagari, Garamond, Georgia, serif)
**Devanagari:** Noto Serif Devanagari — every heading and body stack falls through to it, and `lang="hi"`, `"sa"`, `"mr"` text uses it first.

**Character:** A Didone and an old-style face: Bodoni's razor-thin hairlines and vertical stress give headlines the gravity of a printed proclamation, while Garamond's open, humanist rhythm keeps long reading warm and unhurried. The three families are CSS variables (`--font-heading`, `--font-body`, `--font-deva`) so any one can be swapped in a single place.

### Hierarchy
- **Display** (400, clamp(1.625rem, 6.9vw, 4rem) — 26px on phones, 64px on desktop, 1.05): The hero headline only. Normal case, upright, Logo White, with at most one saffron word.
- **Headline** (400, min(clamp(1.6rem, 6.2vw, 2.75rem), 12cqi) — 25.6px to 44px, 1.15): Section headings. Also shrinks to its own column width so the longest word always fits.
- **Headline-page** (400, clamp(2rem, 8vw, 3.75rem), 1.1): Index-page titles (e.g. Insights).
- **Lead** (400, 1.75rem, 1.375): A single Bodoni sentence that opens a section's argument (About).
- **Title** (400, 1.5rem, 1.33): Card titles, team names, focus-area names (1.875rem at ≥640px). Normal case.
- **Body** (400, 1.125rem / 18px, 1.6): All running text; 1.25rem on lead paragraphs from 640px. Keep measure to ~42rem (672px).
- **UI** (500, 1rem, 1.55): Buttons, nav links, chips, form labels.
- **Label** (500, 0.875rem, letter-spacing 0.2em, UPPERCASE): Section eyebrows and the hero badge. Card metadata uses the same style at 0.16em.

### Named Rules
**The Two Voices Rule.** Bodoni Moda speaks (headlines, titles, names); EB Garamond explains (everything else). No sans-serif and no third Latin family.

**The Small Caps Only Rule.** Uppercase with wide tracking is reserved for small labels (14–16px: eyebrows, badge, card metadata, roles). Headlines and titles are always normal case.

**The 18px Floor Rule.** Running text is never smaller than 18px; Garamond's small x-height makes anything below read as fine print.

## Layout

A centred 1280px container (`max-w-7xl`) with 24px side gutters. Sections are full-bleed bands separated by a single hairline top border, with 128px vertical padding on desktop and 96px on phones. Alternate sections sit on a faint Raised Ink wash (40%) to separate rhythm without borders.

Desktop compositions use a 12-column grid: a 5- or 7-column heading block against the remainder (About, Focus Areas, Team intro, Contact). Lists of equals use a 3-column grid (Insights cards) or a 4-column grid (team); focus areas are full-width ruled rows. Everything collapses to a single column below 640px (sm); the full nav appears at 1024px (lg), with a pill menu button below that.

Spacing steps observed: 8, 12, 16, 24 (default gap), 28 (card padding), 48, and the 96/128 section rhythm.

## Elevation & Depth

The system is **flat**. There are no drop shadows anywhere (recorded from the implementation). Depth is conveyed by tonal layering — Midnight Ink → Raised Ink → Lifted Ink — and by 1px Hairline borders or inset rings. The only translucency is an 8px backdrop blur on the floating nav pill, the hero badge, and the inner-page header.

### Named Rules
**The No-Shadow Rule.** Surfaces separate by tone and hairline, never by shadow. If something needs to feel "above", give it the next ink step, not a `box-shadow`.

**The Clear Copy Rule.** Decorative layers (the churning rings and spirals, glows) are masked away from the text block with clear space around it. No line or texture ever passes behind words.

## Shapes

Two shape families. **Controls are pills** (9999px): buttons, chips, the nav bar, the hero badge, icon buttons. **Containers are softly rounded**: cards and the contact form at 18px, inputs and photo frames at 14px, the Join panel at 22px. Grids of equal items (About principles) are joined with 1px hairline gaps inside one rounded container rather than separate floating cards. Portraits are square.

The churning background is the one circular motif: concentric dashed rings and Archimedean spiral arms, centred low on the right.

## Components

### Buttons
Quiet until they matter; one saffron action per view.
- **Shape:** Pill (9999px), at least 44px tall.
- **Primary:** Kesari Saffron fill, Midnight Ink text, UI type (16px / 500), 12px × 20px padding, trailing arrow icon.
- **Hover / Focus:** Fill deepens to Kesari Saffron Deep over 150ms; focus shows a 2px saffron outline offset by 2px.
- **Secondary:** 5% Logo White fill with a 15% inset ring and 90% white text; hover lifts the fill to 10%.

### Chips
- **Style:** Pill, 44px tall, 16px side padding, 5% white fill with a 10% ring, 80% white text.
- **State:** The active filter becomes a solid Kesari Saffron pill with Midnight Ink text and carries `aria-current="page"`.

### Cards / Containers
- **Corner Style:** 18px (Join panel 22px).
- **Background:** Raised Ink on the Midnight Ink ground; nested items step down to 60% Midnight Ink.
- **Shadow Strategy:** None — see Elevation & Depth.
- **Border:** 1px Hairline; on hover or keyboard focus, linked cards shift the border to 50% saffron over 200ms and the "Read" arrow nudges up and right.
- **Internal Padding:** 28px (insight cards), 24px (principles, join paths), 32px (form panel).

### Inputs / Fields
- **Style:** Midnight Ink fill (one step below its panel), 1px Hairline border, 14px radius, 12px × 16px padding, 18px body text. Labels sit visibly above the field.
- **Focus:** Border warms to 60% saffron and a 2px saffron ring appears.
- **Error / Disabled:** Ember Error border with the message directly beneath the field; disabled fields drop to 60% opacity while sending.

### Navigation
- **Style:** A floating pill bar (5% white fill, 10% ring, 8px blur) holding UI-type links at 75% white; the current page is full Logo White and carries `aria-current`. The "Join the Mission" CTA is the saffron pill at the end.
- **Mobile:** Below 1024px a 44px round menu button opens a stacked panel of full-width links and the CTA.
- **Inner pages:** The same links in a Raised Ink (80%, blurred) header with a hairline bottom border.

### Labels and Eyebrows
Section headings are introduced by an eyebrow: a saffron index number ("01"), a 32px hairline rule, and the section name in Label style in Faint Ink. The hero badge uses the same Label type in a blurred pill with a saffron dot.

### Churning Background (signature)
The hero's Samudra Manthan motif: dashed concentric rings in Logo White and saffron (2.5–11% opacity) turning clockwise once every 220s, and six saffron spiral arms fading toward the rim, turning anticlockwise every 160s, with a soft saffron glow rising from the centre on an 11s loop. Centred at (80%, 86%) on desktop and (90%, 97%) on phones; masked away from the hero copy; half the elements on phones; paused off-screen; static under reduced motion. Only `transform` and `opacity` animate.

## Do's and Don'ts

### Do:
- **Do** keep Kesari Saffron to one primary action, one headline word, and small markers per view (The Single Lamp Rule).
- **Do** set all light text in Logo White (#fdfcfc) or its 90/80/75% forms.
- **Do** separate surfaces with the next ink step and a 1px Hairline (rgb(253 252 252 / 0.1)).
- **Do** keep running text at 18px / 1.6 or larger.
- **Do** introduce sections with the eyebrow pattern: saffron index, hairline rule, uppercase label.
- **Do** render Devanagari with Noto Serif Devanagari and tag it with `lang`.
- **Do** honour `prefers-reduced-motion`: show final states with no animation.

### Don't:
- **Don't** use drop shadows (The No-Shadow Rule).
- **Don't** set headlines or titles in uppercase or with wide tracking (The Small Caps Only Rule).
- **Don't** italicise or colour whole headline lines; the hero highlights only the word "Thinkers".
- **Don't** add glows, gradients, or strokes to text.
- **Don't** put photographic, speckle, grain, or noise textures behind the hero.
- **Don't** let any decorative line or motif cross a text block (The Clear Copy Rule).
- **Don't** introduce a sans-serif or a second accent colour.
