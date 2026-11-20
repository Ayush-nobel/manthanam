import { adminWith } from "@/lib/auth";
import { letterFileName, renderLetterPdf } from "@/lib/letters/pdf";
import { getLetterRow, getLetterSettings, toIssued } from "@/lib/letters/store";

/** Downloads a letter's PDF, rebuilt from what was stored (same number, code and signatory). */
export async function GET(_: Request, { params }: RouteContext<"/admin/letters/[id]/pdf">) {
    const admin = await adminWith("letters.manage");
    if (!admin) return new Response("Sign in as an owner to download offer letters.", { status: 403 });
    const row = await getLetterRow((await params).id);
    if (!row) return new Response("No such letter.", { status: 404 });
    const letter = toIssued(row);
    const pdf = await renderLetterPdf(letter, (await getLetterSettings()).signature);
    return new Response(new Uint8Array(pdf), {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${letterFileName(letter)}"`, "Cache-Control": "no-store" },
    });
}
