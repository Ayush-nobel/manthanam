import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess, PageTitle, when } from "@/components/admin/format";
import { requireAdmin } from "@/lib/auth";
import { formatDate, KIND_LABELS, LETTER_STATUS_LABELS } from "@/lib/letters/model";
import { listLetters } from "@/lib/letters/store";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Offer letters" };

const TONE: Record<string, string> = {
    not_sent: "border-signal text-signal",
    sent: "border-ink text-ink",
    accepted: "border-ink bg-ink text-paper",
    declined: "border-line-strong text-muted-ink",
    withdrawn: "border-line-strong text-muted-ink line-through",
};

export default async function LettersPage() {
    const admin = await requireAdmin();
    if (!can(admin.role, "letters.manage")) return <NoAccess />;
    let letters: Awaited<ReturnType<typeof listLetters>> = [];
    let missing = false;
    try {
        letters = await listLetters();
    } catch (err) {
        console.error("Offer letters unavailable:", (err as Error).message);
        missing = true;
    }

    return (
        <>
            <PageTitle
                aside={
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/admin/letters/settings" className="text-sm underline underline-offset-4">
                            Letter settings
                        </Link>
                        <Link href="/admin/letters/new" className="inline-flex min-h-10 items-center bg-ink px-4 text-sm font-semibold text-paper hover:bg-signal-deep">
                            New offer letter
                        </Link>
                    </div>
                }
            >
                Offer letters
            </PageTitle>
            {missing ? (
                <p className="text-base text-signal">The offer letters table isn’t in the database yet. Run supabase/migrations/0007_offer_letters.sql in Supabase.</p>
            ) : letters.length === 0 ? (
                <p className="max-w-[60ch] text-base text-muted-ink">No letters yet. Choose New offer letter, or open an internship application and choose Send offer letter to start from their details.</p>
            ) : (
                <div className="overflow-x-auto border-t border-ink">
                    <table className="w-full min-w-[48rem] text-left text-sm">
                        <thead className="text-muted-ink">
                            <tr className="border-b border-line">
                                <th scope="col" className="py-2.5 pr-4 font-semibold">Letter no.</th>
                                <th scope="col" className="py-2.5 pr-4 font-semibold">Name</th>
                                <th scope="col" className="py-2.5 pr-4 font-semibold">Offer</th>
                                <th scope="col" className="py-2.5 pr-4 font-semibold">Starts</th>
                                <th scope="col" className="py-2.5 pr-4 font-semibold">Reply by</th>
                                <th scope="col" className="py-2.5 pr-4 font-semibold">Status</th>
                                <th scope="col" className="py-2.5 font-semibold">Issued</th>
                            </tr>
                        </thead>
                        <tbody>
                            {letters.map((l) => (
                                <tr key={l.id} className="border-b border-line align-top">
                                    <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">{l.reference}</td>
                                    <td className="py-3 pr-4">
                                        <Link href={`/admin/letters/${l.id}`} className="font-semibold text-ink underline underline-offset-4">
                                            {l.full_name}
                                        </Link>
                                    </td>
                                    <td className="py-3 pr-4">
                                        {l.position}
                                        <span className="block text-faint">
                                            {KIND_LABELS[l.kind]}, {l.department}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(l.start_date)}</td>
                                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(l.respond_by)}</td>
                                    <td className="py-3 pr-4">
                                        <span className={`inline-block border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${TONE[l.status] ?? ""}`}>{LETTER_STATUS_LABELS[l.status]}</span>
                                    </td>
                                    <td className="py-3 whitespace-nowrap text-muted-ink">{when(l.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
