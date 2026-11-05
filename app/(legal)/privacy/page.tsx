import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";
import { getLegalDoc } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
    const doc = await getLegalDoc("privacy");
    return { title: "Privacy Policy — Manthanam", description: doc.summary, alternates: { canonical: "/privacy" } };
}

export default function Page() {
    return <LegalPage slug="privacy" />;
}
