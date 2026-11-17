import { site } from "@/lib/site";

/**
 * A reply written by a team member in the admin dashboard (to a contact message or an internship
 * application), in the same design as the registration email: navy band, white card, wordmark,
 * serif text, double-rule frame, footer. Same email-safe rules too: tables, inline styles, web-safe fonts.
 */

const C = {
    paper: "#f5f7f6",
    shoal: "#d9e8ec",
    ink: "#10264a",
    muted: "#46566c",
    faint: "#53627a",
    signal: "#a0145c",
    white: "#ffffff",
};
const SANS = "Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Escaped text with web addresses made into links (after escaping, so nothing typed can become HTML). */
const linkify = (escaped: string) =>
    escaped.replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)'"]/gi, (url) => `<a href="${url}" style="color:${C.ink};text-decoration:underline;">${url}</a>`);

/** Paragraphs from blank lines, line breaks kept inside them. */
const paragraphs = (text: string, style: string) =>
    text
        .replace(/\r\n?/g, "\n")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i, all) => `<p style="margin:0 0 ${i === all.length - 1 ? 0 : 16}px 0;${style}">${linkify(esc(p)).replace(/\n/g, "<br>")}</p>`)
        .join("\n");

/** "15 November 2026", in Indian time. */
export const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export interface ReplyEmail {
    /** Email subject, also the document title. */
    subject: string;
    /** The navy band across the top, e.g. "Manthanam internships, remote". */
    band: string;
    /** What the reply is about, shown in the frame under the reply, e.g. "Your message of 15 November 2026". */
    context: string;
    /** Their original words, quoted inside the frame. Optional. */
    quote?: string;
    /** The reply itself, as typed in the dashboard. */
    body: string;
    /** The team member's name, signed under the reply. */
    signedBy: string;
    /** Why they got this email, for the footer. */
    reason: string;
}

export function replyEmailHtml(r: ReplyEmail): string {
    const firstLine = r.body.trim().split("\n")[0].slice(0, 140);
    const bodyStyle = `font-family:${SERIF};font-size:17px;line-height:1.65;color:${C.ink};`;
    const quoteStyle = `font-family:${SERIF};font-size:15px;line-height:1.6;color:${C.muted};`;
    const quote = r.quote?.trim() ? (r.quote.length > 3000 ? `${r.quote.slice(0, 3000).trim()}…` : r.quote) : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(r.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper};">${esc(firstLine)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.paper};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

          <!-- Navy band -->
          <tr>
            <td style="background-color:${C.ink};padding:14px 32px;font-family:${SANS};font-size:13px;letter-spacing:0.04em;color:#a9b8cc;">
              ${esc(r.band)}
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${C.white};border:1px solid ${C.shoal};border-top:0;padding:36px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:28px;border-bottom:2px solid ${C.ink};">
                    <img src="${site.url}/email/manthanam-wordmark.png" width="140" height="35" alt="Manthanam" style="display:block;width:140px;height:auto;border:0;outline:none;text-decoration:none;font-family:${SANS};font-size:16px;font-weight:bold;letter-spacing:0.2em;color:${C.ink};">
                  </td>
                </tr>

                <!-- The reply -->
                <tr>
                  <td style="padding-top:28px;">
${paragraphs(r.body, bodyStyle)}
                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td style="padding-top:24px;font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.ink};">
                    Warm regards,<br>
                    <strong style="font-family:${SANS};">${esc(r.signedBy)}</strong><br>
                    <span style="color:${C.muted};">Manthanam Research Foundation</span>
                  </td>
                </tr>

                <!-- What this is a reply to, in the site's double-rule frame -->
                <tr>
                  <td style="padding-top:32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:4px double ${C.ink};">
                      <tr>
                        <td style="padding:16px 20px;">
                          <div style="font-family:${SERIF};font-size:14px;font-style:italic;color:${C.faint};">${esc(r.context)}</div>
                          ${quote ? `<div style="padding-top:10px;">\n${paragraphs(quote, quoteStyle)}\n                          </div>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Safety note -->
                <tr>
                  <td style="padding-top:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-left:3px solid ${C.signal};background-color:${C.paper};padding:12px 16px;font-family:${SERIF};font-size:14px;line-height:1.6;color:${C.muted};">
                          To answer, just reply to this email. Manthanam will never ask for card details, UPI PINs or passwords by email or phone.
                        </td>
                      </tr>
                    </table>
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
                ${esc(r.reason)}
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
