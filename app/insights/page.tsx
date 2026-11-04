import type { Metadata } from "next";
import InsightsIndex from "@/components/insights-index";
import { getInsights } from "@/lib/insights";

export const metadata: Metadata = {
    title: "Insights — Manthanam",
    description: "Commentary, analysis, and policy writing from Manthanam on geopolitics, security, and statecraft.",
};

export default async function InsightsPage() {
    return <InsightsIndex insights={await getInsights()} />;
}
