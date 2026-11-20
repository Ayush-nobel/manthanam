import { formatDate, letterRows, offerTitle, verifyUrl, type IssuedLetter } from "@/lib/letters/model";
import { site } from "@/lib/site";

/**
 * The email an offer letter goes out with (the PDF is attached), in the registration email's design:
 * navy band, white card, wordmark, double-rule frame, footer. Email-safe: tables and inline styles.
 */

const C = { paper: "#f5f7f6", shoal: "#d9e8ec", ink: "#10264a", muted: "#46566c", faint: "#53627a", signal: "#a0145c", white: "#ffffff" };
const SANS = "Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const offerEmailSubject = (l: IssuedLetter) => `${offerTitle(l)}, Manthanam Research Foundation`;

export function offerEmailHtml(l: IssuedLetter): string {
    const first = esc(l.fullName.split(" ")[0]);
    const what = l.kind === "internship" ? "an internship" : "a position";
    const verify = verifyUrl(site.url, l.verifyCode);
    const row = (label: string, value: string) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid ${C.shoal};font-family:${SERIF};font-size:15px;color:${C.faint};width:38%;vertical-align:top;">${esc(label)}</td>
                <td style="padding:10px 0;border-bottom:1px solid ${C.shoal};font-family:${SANS};font-size:15px;font-weight:bold;color:${C.ink};vertical-align:top;">${esc(value)}</td>
              </tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(offerEmailSubject(l))}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper};">We&rsquo;re pleased to offer you ${what} as ${esc(l.position)}. Your offer letter is attached.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.paper};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

          <!-- Navy band -->
          <tr>
            <td style="background-color:${C.ink};padding:14px 32px;font-family:${SANS};font-size:13px;letter-spacing:0.04em;color:#a9b8cc;">
              ${esc(site.legal.name)}, New Delhi
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${C.white};border:1px solid ${C.shoal};border-top:0;padding:36px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:28px;">
                    <img src="${site.url}/email/manthanam-wordmark.png" width="140" height="35" alt="Manthanam" style="display:block;width:140px;height:auto;border:0;outline:none;text-decoration:none;font-family:${SANS};font-size:16px;font-weight:bold;letter-spacing:0.2em;color:${C.ink};">
                  </td>
                </tr>
                <tr>
                  <td style="font-family:${SANS};font-size:28px;line-height:1.2;font-weight:bold;color:${C.ink};">
                    Congratulations, ${first}.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;font-family:${SERIF};font-size:17px;line-height:1.65;color:${C.muted};">
                    We&rsquo;re pleased to offer you ${what} as <strong style="color:${C.ink};">${esc(l.position)}</strong> in our ${esc(l.department)} department. Your offer letter is attached as a PDF.
                  </td>
                </tr>

                <!-- Details -->
                <tr>
                  <td style="padding-top:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${C.ink};">
                      ${letterRows(l).map(([k, v]) => row(k, v)).join("")}
                    </table>
                  </td>
                </tr>

                <!-- How to accept, in the site's double-rule frame -->
                <tr>
                  <td style="padding-top:28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:4px double ${C.ink};">
                      <tr>
                        <td style="padding:18px 20px;font-family:${SERIF};font-size:16px;line-height:1.65;color:${C.ink};">
                          <strong style="font-family:${SANS};">To accept</strong><br>
                          Reply to this email by <strong>${esc(formatDate(l.respondBy))}</strong>. If we haven&rsquo;t heard from you by then, the offer will lapse.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-top:20px;font-family:${SERIF};font-size:14px;line-height:1.6;color:${C.faint};">
                    Letter no. ${esc(l.reference)}. Anyone can check it&rsquo;s genuine at
                    <a href="${esc(verify)}" style="color:${C.ink};text-decoration:underline;">manthanam.in/verify</a> with the code
                    <strong style="font-family:${SANS};color:${C.ink};letter-spacing:0.06em;white-space:nowrap;">${esc(l.verifyCode)}</strong>.
                  </td>
                </tr>

                <!-- Safety note -->
                <tr>
                  <td style="padding-top:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-left:3px solid ${C.signal};background-color:${C.paper};padding:12px 16px;font-family:${SERIF};font-size:14px;line-height:1.6;color:${C.muted};">
                          Manthanam never asks for any payment in connection with an offer. If anyone does, please tell us.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-top:24px;font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.ink};">
                    We look forward to working with you.<br><br>
                    Warm regards,<br>
                    <strong style="font-family:${SANS};">${esc(l.signatoryName)}</strong><br>
                    <span style="color:${C.muted};">${l.signatoryTitle ? `${esc(l.signatoryTitle)}, ` : ""}${esc(site.legal.name)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;text-align:center;">
              <a href="${site.url}" style="text-decoration:none;"><img src="${site.url}/email/manthanam-wordmark.png" width="112" height="28" alt="Manthanam" style="display:inline-block;width:112px;height:auto;border:0;font-family:${SANS};font-size:14px;font-weight:bold;letter-spacing:0.2em;color:${C.ink};"></a>
              <div style="padding-top:10px;font-family:${SERIF};font-size:13px;line-height:1.6;color:${C.faint};">
                ${esc(site.legal.name)}, New Delhi, India<br>
                <a href="${site.url}" style="color:${C.ink};text-decoration:underline;">www.manthanam.in</a>
              </div>
              <div style="padding-top:12px;font-family:${SERIF};font-size:12px;line-height:1.6;color:${C.faint};">
                You received this email because Manthanam is offering you a place.
                See our <a href="${site.url}/privacy" style="color:${C.faint};text-decoration:underline;">Privacy Policy</a>.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
