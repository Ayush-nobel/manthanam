---
# SAMPLE FILE — replace or delete before launch. Remove "sample: true" from real pieces.
title: "Sample insight: how to publish a piece on this site"
author: "TODO: Author name"
date: 2026-11-04
category: Commentary
summary: "Placeholder showing the format for Insights. Replace this file with a real piece before the site goes live."
sample: true
---

> **This is a sample.** It shows how an Insight is written. Nothing here is real Manthanam research.

## Adding a new piece

1. Create a file in `content/insights/` — its name becomes the URL. For example, `indo-pacific-balancing.md` is published at `/insights/indo-pacific-balancing`. Use lowercase letters, numbers and hyphens only.
2. Start it with the frontmatter block (between the `---` lines): `title`, `author`, `date` (YYYY-MM-DD), `category` and `summary`.
3. `category` must be one of: **Commentary**, **Analysis**, **Policy Brief**, **Discussion**.
4. Write the piece below the frontmatter in Markdown, then rebuild the site.

## What Markdown supports

Paragraphs, **bold**, *italic*, [links](https://example.org), lists, quotations and tables:

| Element  | Markdown          |
| -------- | ----------------- |
| Heading  | `## Heading`      |
| Emphasis | `*italic*`        |
| Link     | `[text](url)`     |

Files whose names start with `_` are ignored, which is handy for drafts.
