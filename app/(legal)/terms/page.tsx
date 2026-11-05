import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";
import { getLegalDoc } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
    const doc = await getLegalDoc("terms");
    return { title: "Terms of Use — Manthanam", description: doc.summary };
}

export default function Page() {
    return <LegalPage slug="terms" />;
}
