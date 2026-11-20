import type { Metadata } from "next";
import Link from "next/link";
import { saveLetterSettings } from "@/app/admin/letters-actions";
import { ActionForm, Submit } from "@/components/admin/action-form";
import { Field } from "@/components/admin/fields";
import { NoAccess, PageTitle } from "@/components/admin/format";
import { requireAdmin } from "@/lib/auth";
import { getLetterSettings } from "@/lib/letters/store";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Letter settings" };

export default async function LetterSettingsPage() {
    const admin = await requireAdmin();
    if (!can(admin.role, "letters.manage")) return <NoAccess />;
    const s = await getLetterSettings();

    return (
        <>
            <p className="text-sm">
                <Link href="/admin/letters" className="underline underline-offset-4">Offer letters</Link>
            </p>
            <div className="mt-3">
                <PageTitle>Letter settings</PageTitle>
            </div>
            <p className="-mt-4 mb-8 max-w-2xl text-base text-muted-ink">
                Who signs Manthanam’s offer letters. Changes apply to letters issued from now on; letters already issued keep the name and title they were sent with.
            </p>
            <ActionForm action={saveLetterSettings} className="grid max-w-xl gap-5">
                <Field label="Name" name="signatoryName" defaultValue={s.signatoryName || admin.name} maxLength={120} required />
                <Field label="Title" hint="e.g. Founder and President" name="signatoryTitle" defaultValue={s.signatoryTitle} maxLength={120} />
                <div>
                    <span className="text-sm font-semibold text-ink">Signature image (optional)</span>
                    <span className="block text-sm text-faint">A PNG or JPEG under 300 KB, ideally a dark signature on a transparent or white background. Without one, the letter leaves space to sign by hand.</span>
                    {s.signature && (
                        // eslint-disable-next-line @next/next/no-img-element -- a stored data: URL, not a site image
                        <img src={s.signature} alt="The current signature" className="mt-3 h-14 w-auto border border-line bg-white p-2" />
                    )}
                    <input type="file" name="signature" accept="image/png,image/jpeg" className="mt-3 block text-sm" />
                    {s.signature && (
                        <label className="mt-3 flex items-center gap-2 text-sm">
                            <input type="checkbox" name="removeSignature" className="size-4 accent-ink" /> Remove the current signature
                        </label>
                    )}
                </div>
                <div>
                    <Submit>Save</Submit>
                </div>
            </ActionForm>
        </>
    );
}
