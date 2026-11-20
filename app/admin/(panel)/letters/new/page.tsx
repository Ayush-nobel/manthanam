import type { Metadata } from "next";
import Link from "next/link";
import { LetterForm, type LetterDefaults } from "@/components/admin/letter-form";
import { NoAccess, PageTitle } from "@/components/admin/format";
import { getApplication } from "@/lib/admin-data";
import { roleName } from "@/lib/application";
import { requireAdmin } from "@/lib/auth";
import { todayInIndia } from "@/lib/letters/model";
import { getLetterSettings } from "@/lib/letters/store";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "New offer letter" };

/** Where each internship role from /join sits. */
const ROLE_DEPARTMENT: Record<string, string> = { social: "Marketing", outreach: "Outreach", pr: "Public Relations" };

const inDays = (iso: string, days: number) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

export default async function NewLetterPage({ searchParams }: PageProps<"/admin/letters/new">) {
    const admin = await requireAdmin();
    if (!can(admin.role, "letters.manage")) return <NoAccess />;
    const sp = await searchParams;
    const fromApplication = typeof sp.application === "string" ? await getApplication(sp.application) : null;
    const settings = await getLetterSettings();

    const defaults: LetterDefaults = { kind: "internship", workMode: "remote", respondBy: inDays(todayInIndia(), 7) };
    if (fromApplication) {
        const a = fromApplication.application;
        Object.assign(defaults, {
            applicationId: a.id,
            fullName: a.full_name,
            email: a.email,
            position: `${roleName(a.role)} intern`,
            department: ROLE_DEPARTMENT[a.role] ?? "",
        });
    }
    const signedBy = settings.signatoryName ? `${settings.signatoryName}${settings.signatoryTitle ? `, ${settings.signatoryTitle}` : ""}` : `${admin.name || admin.email} (set a signatory under Letter settings)`;

    return (
        <>
            <p className="text-sm">
                <Link href="/admin/letters" className="underline underline-offset-4">
                    Offer letters
                </Link>
            </p>
            <div className="mt-3">
                <PageTitle>New offer letter</PageTitle>
            </div>
            <p className="-mt-4 mb-8 max-w-2xl text-base text-muted-ink">
                {fromApplication ? `Filled in from ${fromApplication.application.full_name}’s application. Check every detail. ` : ""}
                Fill in the offer, preview the PDF if you like, then send it. The person gets an email with the letter attached, and you can track their answer here.
            </p>
            <LetterForm defaults={defaults} signedBy={signedBy} />
        </>
    );
}
