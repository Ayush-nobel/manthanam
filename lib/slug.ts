/** "India's BRICS Year, in 10 Decisions" → "indias-brics-year-in-10-decisions" (used for article web addresses). */
export function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/, "");
}
