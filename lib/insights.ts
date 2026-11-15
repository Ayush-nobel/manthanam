import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cacheLife, cacheTag } from "next/cache";
import { db, dbConfigured } from "@/lib/db";

/**
 * Insights are Markdown files in content/insights/<slug>.md with frontmatter:
 *   title, author, date (YYYY-MM-DD), category (one of CATEGORIES), summary
 *   authorBio      — optional; one or two sentences shown under "About the author"
 *   sample: true   — optional; shows a "Sample" badge (use for placeholder pieces only)
 * The file name (without .md) is the URL slug: /insights/<slug>.
 *
 * Most pieces are now written in the admin dashboard (/admin/content) and stored in the database;
 * published ones appear here alongside any files. If both have the same slug, the database wins.
 */

import { CATEGORIES, type CategoryName } from "@/lib/insight-categories";

export { CATEGORIES, type CategoryName };

export interface InsightMeta {
  slug: string;
  title: string;
  author: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  category: CategoryName;
  categorySlug: string;
  summary: string;
  sample: boolean;
}

export interface Insight extends InsightMeta {
  /** Optional short bio shown under "About the author". */
  authorBio?: string;
  body: string;
}

const DIR = path.join(process.cwd(), "content", "insights");

function fail(file: string, msg: string): never {
  throw new Error(`content/insights/${file}: ${msg}`);
}

function parse(file: string, raw: string): Insight {
  const { data, content } = matter(raw);
  for (const key of ["title", "author", "date", "category", "summary"] as const) {
    if (data[key] === undefined || data[key] === "") fail(file, `missing frontmatter field "${key}"`);
  }
  // YAML turns bare dates into Date objects; quoted dates stay strings.
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(file, `"date" must be YYYY-MM-DD, got "${date}"`);
  const category = CATEGORIES.find((c) => c.name === data.category);
  if (!category) fail(file, `unknown category "${data.category}" — use one of: ${CATEGORIES.map((c) => c.name).join(", ")}`);
  return {
    slug: file.replace(/\.md$/, ""),
    title: String(data.title),
    author: String(data.author),
    date,
    category: category.name,
    categorySlug: category.slug,
    summary: String(data.summary),
    sample: data.sample === true,
    ...(data.authorBio ? { authorBio: String(data.authorBio) } : {}),
    body: content.trim(),
  };
}

function toMeta(i: Insight): InsightMeta {
  const { slug, title, author, date, category, categorySlug, summary, sample } = i;
  return { slug, title, author, date, category, categorySlug, summary, sample };
}

/**
 * Pieces marked `sample: true` are placeholders: shown under `next dev` as a template, but never
 * published in production builds.
 */
const SHOW_SAMPLES = process.env.NODE_ENV === "development";

/** Published pieces from the database, or none if it can't be reached (the files still show). */
async function fromDatabase(slug?: string): Promise<Insight[]> {
  if (!dbConfigured()) return [];
  try {
    let q = db()
      .from("insights")
      .select("slug, title, summary, body, category, author_name, author_bio, display_date, published_at")
      .eq("status", "published");
    if (slug) q = q.eq("slug", slug);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((r) => {
      const category = CATEGORIES.find((c) => c.name === r.category);
      if (!category) return [];
      const date = (r.display_date as string | null) ?? String(r.published_at ?? "").slice(0, 10);
      return [
        {
          slug: r.slug as string,
          title: r.title as string,
          author: (r.author_name as string) || "Manthanam",
          date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
          category: category.name,
          categorySlug: category.slug,
          summary: r.summary as string,
          sample: false,
          ...(r.author_bio ? { authorBio: r.author_bio as string } : {}),
          body: r.body as string,
        },
      ];
    });
  } catch (err) {
    console.error("Insights from the database unavailable:", err);
    return [];
  }
}

async function fromFiles(): Promise<Insight[]> {
  let files: string[] = [];
  try {
    files = (await readdir(DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  } catch {
    return [];
  }
  const items = await Promise.all(files.map(async (f) => parse(f, await readFile(path.join(DIR, f), "utf8"))));
  return items.filter((i) => SHOW_SAMPLES || !i.sample);
}

/** All insights, newest first (body omitted). */
export async function getInsights(): Promise<InsightMeta[]> {
  "use cache";
  cacheTag("insights");
  cacheLife("minutes");
  const [stored, files] = await Promise.all([fromDatabase(), fromFiles()]);
  const bySlug = new Map<string, Insight>();
  for (const i of [...files, ...stored]) bySlug.set(i.slug, i);
  return [...bySlug.values()]
    .sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : b.date.localeCompare(a.date)))
    .map(toMeta);
}

export async function getInsight(slug: string): Promise<Insight | null> {
  "use cache";
  cacheTag("insights");
  cacheLife("minutes");
  if (!/^[a-z0-9-]+$/.test(slug)) return null; // also blocks path traversal
  const [stored] = await fromDatabase(slug);
  if (stored) return stored;
  try {
    const insight = parse(`${slug}.md`, await readFile(path.join(DIR, `${slug}.md`), "utf8"));
    return insight.sample && !SHOW_SAMPLES ? null : insight;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}
