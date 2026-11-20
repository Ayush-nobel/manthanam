import { adminWith } from "@/lib/auth";
import { readLetterForm, todayInIndia } from "@/lib/letters/model";
import { renderLetterPdf } from "@/lib/letters/pdf";
import { getLetterSettings } from "@/lib/letters/store";
import { fromThisSite } from "@/lib/request-guard";

/**
 * "Preview PDF" on the new-letter form: the letter exactly as it would be sent, opened in a new tab.
 * Nothing is saved or emailed, so it carries a placeholder number and code instead of real ones.
 */
export async function POST(request: Request) {
    if (!fromThisSite(request)) return new Response("Refused.", { status: 403 });
    const admin = await adminWith("letters.manage");
    if (!admin) return new Response("Sign in as an owner to preview offer letters.", { status: 403 });

    const read = readLetterForm(await request.formData());
    if (read.errors)
        return new Response(`Some details are missing or wrong, so there is nothing to preview yet:\n\n${Object.values(read.errors).join("\n")}\n\nClose this tab and fix them on the form.`, {
            status: 400,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    const settings = await getLetterSettings();
    const pdf = await renderLetterPdf(
        {
            ...read.letter,
            reference: "MRF/OL/PREVIEW",
            verifyCode: "XXXXX-XXXXX",
            issueDate: todayInIndia(),
            signatoryName: settings.signatoryName || admin.name || admin.email,
            signatoryTitle: settings.signatoryName ? settings.signatoryTitle : "",
        },
        settings.signature,
    );
    return new Response(new Uint8Array(pdf), {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="Offer-letter-preview.pdf"', "Cache-Control": "no-store" },
    });
}
