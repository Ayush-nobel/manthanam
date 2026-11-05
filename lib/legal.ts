import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export const LEGAL_SLUGS = ["privacy", "terms", "cookies", "refunds"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalDoc {
  slug: LegalSlug;
  title: string;
  /** ISO date, YYYY-MM-DD */
  updated: string;
  summary: string;
  body: string;
}

/** Policies live in content/legal/<slug>.md with frontmatter: title, updated (YYYY-MM-DD), summary. */
export async function getLegalDoc(slug: LegalSlug): Promise<LegalDoc> {
  "use cache";
  const file = path.join(process.cwd(), "content", "legal", `${slug}.md`);
  const { data, content } = matter(await readFile(file, "utf8"));
  for (const key of ["title", "updated", "summary"] as const) {
    if (!data[key]) throw new Error(`content/legal/${slug}.md: missing frontmatter field "${key}"`);
  }
  const updated = data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : String(data.updated);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) throw new Error(`content/legal/${slug}.md: "updated" must be YYYY-MM-DD`);
  return { slug, title: String(data.title), updated, summary: String(data.summary), body: content.trim() };
}
