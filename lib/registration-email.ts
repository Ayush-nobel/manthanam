import { conference } from "@/lib/conference";
import { site } from "@/lib/site";

/**
 * The registration confirmation email. Email clients ignore most modern CSS, so this is the
 * long-established safe pattern: nested tables, inline styles, web-safe fonts, images hosted on
 * the site with width/height and alt text, and nothing that relies on the images loading.
 * Colours follow the site (DESIGN.md): chart white, sounding navy, chart magenta.
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
const longDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export interface RegistrationEmail {
    name: string;
    reference: string;
    minor: boolean;
}

export function registrationEmailSubject(r: { reference: string }) {
    return `Thank you for registering: ${conference.title} (${r.reference})`;
}

export function registrationEmailHtml(r: RegistrationEmail): string {
    const name = esc(r.name);
    const ref = esc(r.reference);
    const date = longDate(conference.date);
    const payment = conference.paymentDetailsBy ? longDate(conference.paymentDetailsBy) : null;
    const preheader = `Your registration number is ${ref}.${payment ? ` Payment details will be shared by ${payment}.` : ""}`;

    const row = (label: string, value: string) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SERIF};font-size:15px;color:${C.faint};width:42%;vertical-align:top;">${label}</td>
                <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SANS};font-size:16px;font-weight:bold;color:${C.ink};vertical-align:top;">${value}</td>
              </tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(registrationEmailSubject(r))}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper};">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.paper};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

          <!-- Navy band -->
          <tr>
            <td style="background-color:${C.ink};padding:14px 32px;font-family:${SANS};font-size:13px;letter-spacing:0.04em;color:#a9b8cc;">
              ${esc(conference.title)}, ${date}, ${esc(conference.place)}
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${C.white};border:1px solid ${C.shoal};border-top:0;padding:40px 32px 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <img src="${site.url}/email/biyc-2026-logo.png" width="150" height="175" alt="${esc(conference.title)}" style="display:block;width:150px;height:auto;border:0;outline:none;text-decoration:none;font-family:${SANS};font-size:16px;font-weight:bold;color:${C.ink};">
                  </td>
                </tr>
                <tr>
                  <td style="font-family:${SANS};font-size:28px;line-height:1.2;font-weight:bold;color:${C.ink};text-align:center;">
                    Thank you for registering.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-family:${SERIF};font-size:17px;line-height:1.65;color:${C.muted};text-align:center;">
                    Dear ${name}, we&rsquo;re glad you&rsquo;ll be joining us at the ${esc(conference.title)}.
                  </td>
                </tr>

                <!-- Registration number, in the site's double-rule frame -->
                <tr>
                  <td align="center" style="padding:32px 0 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:4px double ${C.ink};">
                      <tr>
                        <td align="center" style="padding:18px 20px;">
                          <div style="font-family:${SERIF};font-size:14px;font-style:italic;color:${C.faint};">Your registration number</div>
                          <div style="padding-top:6px;font-family:${SANS};font-size:26px;font-weight:bold;letter-spacing:0.06em;white-space:nowrap;color:${C.signal};">${ref}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;font-family:${SERIF};font-size:14px;color:${C.faint};text-align:center;">
                    Please quote it whenever you write to us.
                  </td>
                </tr>

                <!-- Details -->
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${C.ink};">
                      ${row("Date", date)}
                      ${row("Place", `${esc(conference.place)}${conference.venue ? `<br><span style="font-weight:normal;color:${C.muted};">${esc(conference.venue)}</span>` : `<br><span style="font-weight:normal;font-size:14px;color:${C.muted};">Venue to be announced</span>`}`)}
                      ${row("Payment details", payment ? `Shared by email by ${payment}` : "Shared by email")}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;font-family:${SERIF};font-size:16px;line-height:1.65;color:${C.ink};">
                    Your place is confirmed once payment is received.${
                        r.minor
                            ? ` As you are under 18, we have copied your parent or guardian, and we will contact them to verify their consent before confirming your place.`
                            : ""
                    }
                  </td>
                </tr>

                <!-- Safety note -->
                <tr>
                  <td style="padding-top:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-left:3px solid ${C.signal};background-color:${C.paper};padding:12px 16px;font-family:${SERIF};font-size:14px;line-height:1.6;color:${C.muted};">
                          Manthanam will never ask for card details, UPI PINs or passwords by email or phone.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding-top:28px;font-family:${SERIF};font-size:16px;line-height:1.65;color:${C.ink};">
                    Any questions? Just reply to this email.<br><br>
                    Warm regards,<br>
                    <strong style="font-family:${SANS};">Manthanam Research Foundation</strong>
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
                You received this email because you registered for the ${esc(conference.title)} on manthanam.in.
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
