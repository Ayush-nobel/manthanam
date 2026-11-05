import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";
import { getLegalDoc } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
    const doc = await getLegalDoc("refunds");
    return { title: "Refund Policy — Manthanam", description: doc.summary };
}

export default function Page() {
    return <LegalPage slug="refunds" />;
}
