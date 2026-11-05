import type { MetadataRoute } from "next";
import { CATEGORIES, getInsights } from "@/lib/insights";
import { LEGAL_SLUGS, getLegalDoc } from "@/lib/legal";
import { site } from "@/lib/site";

/**
 * Only real, indexable pages. Insights pages appear once they have published pieces
 * (empty index/category pages are noindex), and sample pieces never appear in production.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const url = (path: string) => `${site.url}${path}`;
    const insights = await getInsights();
    const entries: MetadataRoute.Sitemap = [{ url: url("/"), changeFrequency: "weekly", priority: 1 }];

    if (insights.length > 0) {
        entries.push({ url: url("/insights"), lastModified: insights[0].date, changeFrequency: "weekly", priority: 0.8 });
        for (const c of CATEGORIES) {
            const inCat = insights.filter((i) => i.categorySlug === c.slug);
            if (inCat.length) entries.push({ url: url(`/insights/category/${c.slug}`), lastModified: inCat[0].date, changeFrequency: "weekly", priority: 0.5 });
        }
        for (const i of insights) entries.push({ url: url(`/insights/${i.slug}`), lastModified: i.date, changeFrequency: "monthly", priority: 0.7 });
    }

    for (const slug of LEGAL_SLUGS) {
        const doc = await getLegalDoc(slug);
        entries.push({ url: url(`/${slug}`), lastModified: doc.updated, changeFrequency: "yearly", priority: 0.2 });
    }
    return entries;
}
