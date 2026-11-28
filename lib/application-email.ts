import { AMBASSADOR_CONDITION, AMBASSADOR_REWARDS, isAmbassador, PERKS, roleTitle } from "@/lib/application";
import { site } from "@/lib/site";

/** Confirmation email for internship applications: same look as the registration email, simpler content. */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const SANS = "Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export const applicationEmailSubject = (role: string) => `We’ve received your application: ${roleTitle(role)} at Manthanam`;

export function applicationEmailHtml(a: { name: string; role: string; code?: string | null }): string {
    const role = esc(roleTitle(a.role));
    const amb = isAmbassador(a.role);
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(applicationEmailSubject(a.role))}</title></head>
<body style="margin:0;padding:0;background-color:#f5f7f6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Thanks for applying for the ${role} role. Here is what happens next.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f7f6;"><tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
      <tr><td style="background-color:#10264a;padding:14px 32px;font-family:${SANS};font-size:13px;letter-spacing:0.04em;color:#a9b8cc;">${amb ? "Manthanam campus ambassadors" : "Manthanam internships, remote"}</td></tr>
      <tr><td style="background-color:#ffffff;border:1px solid #d9e8ec;border-top:0;padding:40px 32px 36px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding-bottom:24px;"><img src="${site.url}/email/manthanam-wordmark.png" width="140" height="35" alt="Manthanam" style="display:block;width:140px;height:auto;border:0;font-family:${SANS};font-weight:bold;letter-spacing:0.2em;color:#10264a;"></td></tr>
          <tr><td style="font-family:${SANS};font-size:26px;line-height:1.25;font-weight:bold;color:#10264a;">Thank you for applying.</td></tr>
          <tr><td style="padding-top:14px;font-family:${SERIF};font-size:17px;line-height:1.65;color:#46566c;">Dear ${esc(a.name)}, we’ve received your application for the <strong style="color:#10264a;">${role}</strong> role.</td></tr>
          ${amb && a.code ? `<tr><td align="center" style="padding-top:24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:4px double #10264a;"><tr><td align="center" style="padding:16px 22px;"><div style="font-family:${SERIF};font-size:14px;font-style:italic;color:#53627a;">Your referral code</div><div style="padding-top:6px;font-family:${SANS};font-size:26px;font-weight:bold;letter-spacing:0.08em;white-space:nowrap;color:#a0145c;">${esc(a.code)}</div></td></tr></table></td></tr>
          <tr><td style="padding-top:12px;font-family:${SERIF};font-size:15px;line-height:1.6;color:#46566c;text-align:center;">Share it with students at your college: anyone who enters it in their payment form gets 10% off.</td></tr>` : ""}
          <tr><td style="padding-top:24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:4px double #10264a;"><tr><td style="padding:18px 20px;font-family:${SERIF};font-size:16px;line-height:1.65;color:#10264a;">
              <strong style="font-family:${SANS};">What happens next</strong><br>
              We read every application. If yours is shortlisted, we’ll email you to arrange a short conversation. Applications are open on a rolling basis.
            </td></tr></table>
          </td></tr>
          <tr><td style="padding-top:24px;font-family:${SERIF};font-size:16px;line-height:1.65;color:#10264a;">
            ${amb ? `Campus ambassador rewards:<br>${AMBASSADOR_REWARDS.map((p) => `&bull; ${esc(p)}`).join("<br>")}<br><em>${esc(AMBASSADOR_CONDITION)}</em>` : `Interns receive:<br>${PERKS.map((p) => `&bull; ${esc(p)}`).join("<br>")}`}
          </td></tr>
          <tr><td style="padding-top:24px;font-family:${SERIF};font-size:16px;line-height:1.65;color:#10264a;">Any questions? Just reply to this email.<br><br>Warm regards,<br><strong style="font-family:${SANS};">Manthanam Research Foundation</strong></td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 32px;text-align:center;font-family:${SERIF};font-size:12px;line-height:1.6;color:#53627a;">
        ${esc(site.legal.name)}, New Delhi, India · <a href="${site.url}" style="color:#10264a;">www.manthanam.in</a><br>
        You received this because you applied ${amb ? "to be a campus ambassador" : "for an internship"} on manthanam.in. See our <a href="${site.url}/privacy" style="color:#53627a;">Privacy Policy</a>.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
