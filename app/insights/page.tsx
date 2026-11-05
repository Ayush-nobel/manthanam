import type { Metadata } from "next";
import InsightsIndex from "@/components/insights-index";
import { getInsights } from "@/lib/insights";

export async function generateMetadata(): Promise<Metadata> {
    const empty = (await getInsights()).length === 0;
    return {
        title: "Insights — Manthanam",
        description: "Commentary, analysis, and policy writing from Manthanam on geopolitics, security, and statecraft.",
        alternates: { canonical: "/insights" },
        // An empty listing is thin content: keep it out of search until something is published.
        ...(empty ? { robots: { index: false, follow: true } } : {}),
    };
}

export default async function InsightsPage() {
    return <InsightsIndex insights={await getInsights()} />;
}
