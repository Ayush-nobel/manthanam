import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InsightsIndex from "@/components/insights-index";
import { CATEGORIES, getInsights } from "@/lib/insights";

// Every category gets a static page, even before it has any pieces.
export function generateStaticParams() {
    return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/insights/category/[category]">): Promise<Metadata> {
    const { category } = await params;
    const c = CATEGORIES.find((x) => x.slug === category);
    return c ? { title: `${c.name} — Insights — Manthanam` } : {};
}

export default async function CategoryPage({ params }: PageProps<"/insights/category/[category]">) {
    const { category } = await params;
    if (!CATEGORIES.some((c) => c.slug === category)) notFound();
    return <InsightsIndex insights={await getInsights()} active={category} />;
}
