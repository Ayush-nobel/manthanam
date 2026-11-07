---
name: Manthanam
description: India's youth-driven strategic think tank — the Indian Ocean drawn as an Admiralty chart, in sounding navy with one magenta caution.
colors:
  chart-white: "#f5f7f6"
  shoal: "#d9e8ec"
  deep-shoal: "#c2dae2"
  sounding-navy: "#10264a"
  slate: "#46566c"
  faint-slate: "#53627a"
  chart-magenta: "#a0145c"
  chart-magenta-deep: "#7e0f48"
  chart-magenta-light: "#f39ac6"
  navy-muted: "#a9b8cc"
  hairline: "rgb(16 38 74 / 0.16)"
  rule: "rgb(16 38 74 / 0.8)"
  hairline-on-navy: "rgb(245 247 246 / 0.18)"
  field-edge: "rgb(16 38 74 / 0.4)"
  error-red: "#b3261e"
typography:
  display:
    fontFamily: "Archivo, Noto Serif Devanagari, sans-serif"
    fontSize: "clamp(2.125rem, 5.6vw, 4.5rem)"
    fontWeight: 650
    fontStretch: "125%"
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, Noto Serif Devanagari, sans-serif"
    fontSize: "clamp(1.875rem, 3.6vw, 3.125rem)"
    fontWeight: 620
    fontStretch: "118%"
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  headline-page:
    fontFamily: "Archivo, Noto Serif Devanagari, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 650
    fontStretch: "120%"
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo, Noto Serif Devanagari, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 620
    fontStretch: "112%"
    lineHeight: 1.375
  ui:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    fontStretch: "112%"
    lineHeight: 1.5
  body:
    fontFamily: "Source Serif 4, Noto Serif Devanagari, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.7
  body-large:
    fontFamily: "Source Serif 4, Noto Serif Devanagari, Georgia, serif"
    fontSize: "1.3125rem"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "0.84375rem"
    fontWeight: 400
    fontStyle: italic
    lineHeight: 1.55
  devanagari:
    fontFamily: "Noto Serif Devanagari, serif"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  gutter: "40px"
  section-mobile: "96px"
  section: "128px"
  container: "1344px"
components:
  text-link:
    textColor: "{colors.sounding-navy}"
    typography: "{typography.ui}"
    underline: "1px {colors.rule}, offset 0.3em"
  text-link-hover:
    textColor: "{colors.chart-magenta}"
    underline: "2px {colors.chart-magenta}"
  button-primary:
    backgroundColor: "{colors.sounding-navy}"
    textColor: "{colors.chart-white}"
    typography: "{typography.ui}"
    rounded: "{rounded.none}"
    padding: "14px 32px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.chart-magenta}"
    textColor: "{colors.chart-white}"
  title-cartouche:
    backgroundColor: "{colors.chart-white}"
    border: "5px double {colors.sounding-navy}"
    rounded: "{rounded.none}"
    padding: "44px 40px"
  photo-mount:
    backgroundColor: "{colors.chart-white}"
    border: "5px double {colors.sounding-navy}"
    rounded: "{rounded.none}"
    padding: "6px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.sounding-navy}"
    typography: "{typography.body-large}"
    border: "0 0 1px {colors.field-edge}"
    rounded: "{rounded.none}"
    padding: "10px 0"
  input-focus:
    border: "0 0 2px {colors.chart-magenta}"
  nav-link:
    textColor: "{colors.sounding-navy}"
    typography: "{typography.ui}"
    padding: "4px 0"
  region-shoal:
    backgroundColor: "{colors.shoal}"
  band-deep-water:
    backgroundColor: "{colors.sounding-navy}"
    textColor: "{colors.chart-white}"
---

# Design System: Manthanam

## Overview

**North star: "The Admiralty Chart."** *Samudra Manthan* is the churning of the ocean, and Manthanam's subject is strategy, so the site speaks the visual language of a nautical chart of the Indian Ocean. Charts are instruments of statecraft: exact, calm, legible at a glance, and printed for people who have to make decisions. That is the tone. The site should feel like a well-made survey sheet, not a startup landing page and not a newspaper.

The system is **exact, calm, sovereign, and Indian**. Exactness comes from the chart vocabulary: depth contours, a graduated neatline with India's real coordinates (68°E–92°E, 8°N–32°N), soundings in metres, and the office's position given as 28°36′N 77°12′E. Calm comes from cool chart white, shallow-water tints and generous space. Sovereignty comes from wide, confident Archivo headings. Indian-ness comes from content, not ornament: the Samudra Manthan, Mount Mandara, Pataliputra, the Indian Ocean sea lanes.

The site is light by design, as a printed chart is. Boldness is spent in two places only, the animated chart hero and the scroll-driven globe; everything else is quiet and disciplined.

**Key characteristics**

- Chart white for deep water, shallow-water blue for grouped regions, sounding navy for all type.
- One accent, Chart Magenta, used the way charts use it: for cautions, the active state, and the one thing to look at.
- Archivo set wide speaks; Source Serif 4 explains.
- Square corners everywhere. Structure comes from tinted regions, double rules and spacing, not from cards or shadows.
- Motion is rare, slow and meaningful, and always respects reduced-motion settings.

## Colors

### Primary

- **Sounding Navy `#10264a`**: all text, rules, the neatline, the deep-water band (Join), the primary button. 14.0:1 on Chart White.
- **Chart Magenta `#a0145c`**: links on hover, the active chapter mark, the danger contour, step 2 ("Confront") of the method, team roles. 7.1:1 on Chart White, 6.1:1 on Shoal. Deep `#7e0f48` for pressed states; Light `#f39ac6` only on the navy band (7.3:1).

### Neutral

- **Chart White `#f5f7f6`**: the page. Cool, faintly green-grey, like chart paper. Never pure white, never cream.
- **Shoal `#d9e8ec`**: shallow-water tint for grouped regions (Focus areas, Messages, footer).
- **Deep Shoal `#c2dae2`**: photo placeholders and the hero's shallow-water tint.
- **Slate `#46566c`**: secondary text (7.0:1 on Chart White, 6.0:1 on Shoal).
- **Faint Slate `#53627a`**: captions, chart labels, metadata (5.5:1 on Chart White, 4.7:1 on Shoal). Never on Deep Shoal.
- **Navy Muted `#a9b8cc`**: secondary text on the navy band (7.5:1).
- **Hairline** navy at 16% for quiet dividers; **Rule** navy at 80% for underlines and structural rules.

### Named Rules

**The Chart Magenta Rule.** Magenta means "caution" or "you are here", as it does on a real chart. It is never decoration, never a headline accent, and never more than a few percent of a screen.

**The No-Black Rule.** Text is Sounding Navy, never black or tinted near-black.

## Typography

- **Display and headings: Archivo** (variable, width axis 62–125). Set wide (112–125%) and heavy (600–650), in sentence case, like the lettering of sea names on a chart.
- **Body: Source Serif 4** (variable, optical sizes) at 18px / 1.7. A serif body gets slightly more leading than a sans would.
- **Devanagari: Noto Serif Devanagari**, the last fallback in every stack, so Hindi and Sanskrit always render properly.

### Hierarchy

| Role | Size | Weight / width | Use |
| --- | --- | --- | --- |
| Display | clamp(2.125rem, 5.6vw, 4.5rem) | 650 / 125% (108% on phones) | Hero headline only |
| Headline | clamp(1.875rem, 3.6vw, 3.125rem) | 620 / 118% | Section headings |
| Headline (page) | clamp(2.25rem, 6vw, 4.5rem) | 650 / 120% | Legal, insights and 404 page titles |
| Title | 1.375–1.75rem | 620 / 112–115% | Names, focus areas, method steps |
| UI | 1rem | 600 / 112% | Nav, text links, button |
| Body | 1.125rem / 1.7 | 400 | Running text |
| Body large | 1.3125rem / 1.6 | 400 | Section intros, quotes, form fields |
| Caption | 0.84rem italic | 400 | Chart captions, graduations, metadata |

The scale is a perfect fourth (1.333) from an 18px base. Body measure stays under about 75 characters.

### Named Rules

**The Two Voices Rule.** Archivo speaks (headlines, names, controls); Source Serif 4 explains (everything else). No third Latin family.

**The No-Kicker Rule.** No eyebrow labels above headings, no all-caps labels, no one-word colour accents in headlines. The heading carries its own weight.

## Layout

- Container 1344px (84rem), page padding 24px on phones and 40px from `sm`. Sections are 96px (phones) and 128px (desktop) top and bottom.
- A 12-column grid: headings take 5 columns on the left, intros start at column 7. Text is left-aligned throughout.
- Sections are separated by **region**, not by rules: Chart White, then Shoal, then Chart White, with the one navy band for Join. Hairline rules appear only inside content (legal page header, form groups).
- The hero runs edge to edge inside a neatline; the globe section pins to the full viewport.

## Elevation & Depth

None. There are no shadows. Depth is shown the way a chart shows it: by tint (Chart White = deep, Shoal = shallow) and by line weight (index contours are heavier).

## Shapes

Every corner is square (`--radius: 0`). A chart is printed on cut paper. The only circles are data: soundings dots, the Delhi marker, the globe itself.

## Components

### Text links (the default call to action)

Archivo 600 at 112% width with a real 1px underline in Rule navy, offset 0.3em. On hover or focus the underline thickens to 2px and text and underline turn Chart Magenta (250ms). No arrows appended to link text. A real `text-decoration` is used, not a background-image line, so every assistive technology and contrast checker recognises it as a link.

### Primary button

Used once: **Send message**. Solid Sounding Navy, Chart White text, square, 48px tall, 32px side padding; turns Chart Magenta on hover.

### Title cartouche (signature)

The double-ruled title box of a chart: `5px double` Sounding Navy on Chart White. Holds the hero headline, the description, two text links, and the publisher line ("Published by Manthanam Research Foundation, New Delhi. Established 2024.").

### Photo mounts

Team and message portraits sit in the same double rule with a 6px margin of Chart White (3px rule and 4px margin for the 88px mobile portraits). Team photos are square, about 17rem wide beside the text; message portraits are 160px square (88px on phones).

### Ruled fields

Form inputs are a single underline in navy at 40%, which turns into a 2px Chart Magenta line on focus. Labels are small Source Serif above the field. Errors are written in Error Red below the field and name the fix.

### Navigation

Archivo text links, no pill and no background. A navy rule draws in under a link on hover and stays under the current page. "Join the mission" is the only magenta item. On phones a "Menu" text button opens a full-width list.

### Chapter marks

Five 32×3px bars under the globe heading: past chapters in navy, the current one in Chart Magenta, the rest faint. The content is a sequence, so its position is shown.

## Signature moments

### The chart hero

A canvas draws depth contours of a submerged peak (Mount Mandara) that slowly twist, as if the ocean is being churned.

- **Chart conventions:**
  - **Contours:** every fifth contour is a heavier index contour.
  - **Danger line:** one dashed contour is Chart Magenta, "the first danger, the poison that rose before the nectar".
  - **Shallow water:** the area around the peak is tinted.
  - **Soundings:** small italic numbers give depths in metres, read from the same field.
- **Frame:** a graduated neatline with alternating navy divisions on two edges and India's real longitudes and latitudes.
- **Performance:** runs at about 24 fps, only while on screen and while the tab is visible; reduced motion draws a single still frame.

### The globe story (Five areas of work)

A pinned, scroll-driven orthographic globe (d3-geo, Natural Earth 1:110m land, 27 KB gzipped, fetched only as the section approaches). It turns and zooms through one chapter per focus area:

1. The Indian Ocean sea lane, Hormuz → Malacca → South China Sea.
2. India's neighbourhood, ringed.
3. New Delhi.
4. Pataliputra.
5. Rings spreading from Delhi across the world.

**Coastlines only: no political boundaries are ever drawn**, because open map data does not show India's official boundaries. Reduced motion snaps between chapter views instead of sweeping.

## Motion

| Name | Value | Purpose |
| --- | --- | --- |
| hero-entrance | translateY 12px → 0, 0.6s cubic-bezier(0.22, 1, 0.36, 1); transform only | Title cartouche on load (opacity is never animated, so LCP is not delayed) |
| chart-contours | canvas, ~24 fps, time step 0.35/s | The churning chart; pauses off-screen and in hidden tabs |
| globe-scroll | scroll-linked, cubic in-out between chapter keyframes, zoom interpolated logarithmically | The globe story |
| chapter-text | opacity + translateY 12px, 500ms ease-out | Globe chapter text changing |
| link | 250ms ease on colour and underline thickness | Text links |
| nav-rule | scale-x 0 → 1, 300ms cubic-bezier(0.22, 1, 0.36, 1) | Nav hover underline |
| carousel | 8s auto-advance; 500ms slide | Messages of support (pauses on hover, focus, touch, off-screen; pause button) |
| reduced-motion | prefers-reduced-motion: reduce | No autoplay, no entrance, still chart, snapped globe |

## Do's and Don'ts

### Do:

- Use real geography, real coordinates and real data; label what the chart shows.
- Keep magenta for cautions, the current state and hover.
- Let tinted regions and spacing group content.
- Write headings and links in plain sentence case; links say what they do.
- Count figures from the site's own data (for example "Seven messages so far…") so they stay true.

### Don't:

- Draw political boundaries or any map of India not from an official source.
- Add cards, shadows, rounded corners, gradients or glass.
- Add eyebrow labels, all-caps labels, section numbers (except real sequences), middle-dot meta strings or arrows on links.
- Use black text, pure white or cream backgrounds.
- Animate entrances on every section; the hero and the globe are the only moments.
