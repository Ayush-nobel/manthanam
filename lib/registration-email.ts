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

/** The page around every conference email: navy band, the white card (passed in), and the footer. */
function frame(title: string, preheader: string, card: string): string {
    const date = longDate(conference.date);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(title)}</title>
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
${card}
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

export interface RegistrationEmail {
    name: string;
    reference: string;
    minor: boolean;
    /** From the editable conference details (lib/site-content.ts). */
    venue: string | null;
    paymentDetailsBy: string | null;
}

export function registrationEmailSubject(r: { reference: string }) {
    return `Thank you for registering: ${conference.title} (${r.reference})`;
}

export function registrationEmailHtml(r: RegistrationEmail): string {
    const name = esc(r.name);
    const ref = esc(r.reference);
    const date = longDate(conference.date);
    const payment = r.paymentDetailsBy ? longDate(r.paymentDetailsBy) : null;
    const preheader = `Your registration number is ${ref}.${payment ? ` Payment details will be shared by ${payment}.` : ""}`;

    const row = (label: string, value: string) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SERIF};font-size:15px;color:${C.faint};width:42%;vertical-align:top;">${label}</td>
                <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SANS};font-size:16px;font-weight:bold;color:${C.ink};vertical-align:top;">${value}</td>
              </tr>`;

    return frame(registrationEmailSubject(r), preheader, `
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
                      ${row("Place", `${esc(conference.place)}${r.venue ? `<br><span style="font-weight:normal;color:${C.muted};">${esc(r.venue)}</span>` : `<br><span style="font-weight:normal;font-size:14px;color:${C.muted};">Venue to be announced</span>`}`)}
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

`);
}

export interface PaymentEmail {
    name: string;
    reference: string;
    minor: boolean;
    /** Fees from the conference details; one row is the usual case. */
    fees: { category: string; amount: number; note?: string }[];
    /** How to pay, as an editor typed it (plain text, line breaks kept). */
    instructions: string;
    dueBy: string | null;
    /** The registrant's personal proof-of-payment form, manthanam.in/pay/<token>. */
    link: string;
}

export function paymentEmailSubject(r: { reference: string }) {
    return `Payment details: ${conference.title} (${r.reference})`;
}

const rupees = (n: number) => `&#8377;${n.toLocaleString("en-IN")}`;

/**
 * The payment request: how much, how to pay, and a button to the form where the registrant uploads a
 * screenshot of the payment. Email clients block forms and file uploads inside an email, so the form
 * lives on the website and the email carries a personal link to it.
 */
export function paymentEmailHtml(r: PaymentEmail): string {
    const name = esc(r.name);
    const ref = esc(r.reference);
    const due = r.dueBy ? longDate(r.dueBy) : null;
    const link = esc(r.link);
    const fee = r.fees.length === 1 ? rupees(r.fees[0].amount) : null;
    const preheader = `${fee ? `Your delegate fee is ${fee.replace("&#8377;", "Rs ")}. ` : ""}Pay${due ? ` by ${due}` : ""}, then upload your payment screenshot with the link inside.`;

    const row = (label: string, value: string) => `
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SERIF};font-size:15px;color:${C.faint};width:42%;vertical-align:top;">${label}</td>
                        <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SANS};font-size:16px;font-weight:bold;color:${C.ink};vertical-align:top;">${value}</td>
                      </tr>`;
    const step = (n: number, title: string, body: string) => `
                <tr>
                  <td style="padding-top:22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="width:40px;vertical-align:top;font-family:${SANS};font-size:22px;font-weight:bold;color:${C.signal};">${n}</td>
                        <td style="vertical-align:top;">
                          <div style="font-family:${SANS};font-size:17px;font-weight:bold;color:${C.ink};">${title}</div>
                          <div style="padding-top:6px;font-family:${SERIF};font-size:16px;line-height:1.65;color:${C.ink};">${body}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;

    const feeRows = r.fees.map((f) => row(esc(f.category), `${rupees(f.amount)}${f.note ? `<br><span style="font-weight:normal;font-size:14px;color:${C.muted};">${esc(f.note)}</span>` : ""}`)).join("");
    const instructions = esc(r.instructions).replace(/\n/g, "<br>");

    return frame(paymentEmailSubject(r), preheader, `
          <!-- Card -->
          <tr>
            <td style="background-color:${C.white};border:1px solid ${C.shoal};border-top:0;padding:40px 32px 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${SANS};font-size:28px;line-height:1.2;font-weight:bold;color:${C.ink};">
                    Your payment details.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-family:${SERIF};font-size:17px;line-height:1.65;color:${C.muted};">
                    Dear ${name}, here is how to pay for your place at the ${esc(conference.title)}, and how to send us proof of payment.
                  </td>
                </tr>

                <tr>
                  <td style="padding-top:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${C.ink};">
                      ${row("Registration number", `<span style="color:${C.signal};letter-spacing:0.04em;">${ref}</span>`)}
                      ${feeRows}
                      ${due ? row("Pay by", due) : ""}
                    </table>
                  </td>
                </tr>

                ${step(1, "Pay", "Use these details:")}
                <tr>
                  <td style="padding:12px 0 0 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:4px double ${C.ink};">
                      <tr>
                        <td style="padding:16px 18px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.ink};">${instructions}</td>
                      </tr>
                    </table>
                    <div style="padding-top:10px;font-family:${SERIF};font-size:14px;line-height:1.6;color:${C.faint};">
                      Add your registration number, ${ref}, in the payment note or remarks if your app allows it.
                    </div>
                  </td>
                </tr>

                ${step(2, "Take a screenshot", "Once the payment goes through, take a screenshot that shows the amount, the date and the transaction ID (UTR or UPI reference). You can hide your balance.")}
                ${step(3, "Upload it with this form", "Your personal form takes about a minute. It already knows who you are.")}
                <tr>
                  <td style="padding:18px 0 0 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:${C.ink};">
                          <a href="${link}" style="display:inline-block;padding:14px 24px;font-family:${SANS};font-size:16px;font-weight:bold;color:${C.white};text-decoration:none;">Upload your payment screenshot</a>
                        </td>
                      </tr>
                    </table>
                    <div style="padding-top:10px;font-family:${SERIF};font-size:13px;line-height:1.6;color:${C.faint};word-break:break-all;">
                      Or open this link: <a href="${link}" style="color:${C.ink};">${link}</a><br>
                      It is yours alone, so please don&rsquo;t share it.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding-top:28px;font-family:${SERIF};font-size:16px;line-height:1.65;color:${C.ink};">
                    We check every payment by hand and confirm your place by email.${
                        r.minor ? " As you are under 18, we have copied your parent or guardian." : ""
                    }
                  </td>
                </tr>

                <!-- Safety note -->
                <tr>
                  <td style="padding-top:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-left:3px solid ${C.signal};background-color:${C.paper};padding:12px 16px;font-family:${SERIF};font-size:14px;line-height:1.6;color:${C.muted};">
                          Only pay to the details in this email. Manthanam will never ask for card details, UPI PINs, OTPs or passwords, and you never need to enter a PIN to <em>receive</em> money.
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

`);
}

export interface PaymentReceivedEmail {
    name: string;
    reference: string;
    minor: boolean;
    transactionId: string;
    amount: number;
    paidOn: string;
    /** True when this upload replaces an earlier one. */
    replaced: boolean;
    /** The same personal link, to upload a different screenshot. */
    link: string;
}

export function paymentReceivedEmailSubject(r: { reference: string }) {
    return `We’ve received your payment details: ${conference.title} (${r.reference})`;
}

/** Sent automatically when a registrant submits the proof-of-payment form at /pay/<token>. */
export function paymentReceivedEmailHtml(r: PaymentReceivedEmail): string {
    const ref = esc(r.reference);
    const link = esc(r.link);
    const preheader = `We have your payment of Rs ${r.amount.toLocaleString("en-IN")} (transaction ${esc(r.transactionId)}). We’ll check it and confirm your place by email.`;
    const row = (label: string, value: string) => `
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SERIF};font-size:15px;color:${C.faint};width:42%;vertical-align:top;">${label}</td>
                        <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SANS};font-size:16px;font-weight:bold;color:${C.ink};vertical-align:top;">${value}</td>
                      </tr>`;
    return frame(paymentReceivedEmailSubject(r), preheader, `
          <!-- Card -->
          <tr>
            <td style="background-color:${C.white};border:1px solid ${C.shoal};border-top:0;padding:40px 32px 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${SANS};font-size:28px;line-height:1.2;font-weight:bold;color:${C.ink};">
                    Payment details received.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-family:${SERIF};font-size:17px;line-height:1.65;color:${C.muted};">
                    Dear ${esc(r.name)}, thank you. We have your ${r.replaced ? "new screenshot and " : ""}payment details for the ${esc(conference.title)}.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${C.ink};">
                      ${row("Registration number", `<span style="color:${C.signal};letter-spacing:0.04em;">${ref}</span>`)}
                      ${row("Transaction ID", esc(r.transactionId))}
                      ${row("Amount", `&#8377;${r.amount.toLocaleString("en-IN")}`)}
                      ${row("Paid on", longDate(r.paidOn))}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;font-family:${SERIF};font-size:16px;line-height:1.65;color:${C.ink};">
                    <strong style="font-family:${SANS};">What happens next:</strong> we check every payment by hand against our account, and email you once your place is confirmed. You don&rsquo;t need to do anything else.${
                        r.minor ? " As you are under 18, we have copied your parent or guardian." : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-family:${SERIF};font-size:14px;line-height:1.6;color:${C.faint};">
                    Uploaded the wrong screenshot? <a href="${link}" style="color:${C.ink};">Open your payment form</a> and upload the right one; it replaces this one.
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

`);
}

export interface SeatConfirmedEmail {
    name: string;
    reference: string;
    minor: boolean;
    venue: string | null;
    /** What they paid, from their proof of payment, if they sent one. */
    amount: number | null;
    transactionId: string;
}

export function seatConfirmedEmailSubject(r: { reference: string }) {
    return `Your place is confirmed: ${conference.title} (${r.reference})`;
}

/** Sent when an admin has checked the payment and confirms the seat. */
export function seatConfirmedEmailHtml(r: SeatConfirmedEmail): string {
    const ref = esc(r.reference);
    const date = longDate(conference.date);
    const preheader = `Your place at the ${esc(conference.title)} on ${date} is confirmed. Registration number ${ref}.`;
    const row = (label: string, value: string) => `
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SERIF};font-size:15px;color:${C.faint};width:42%;vertical-align:top;">${label}</td>
                        <td style="padding:12px 0;border-bottom:1px solid ${C.shoal};font-family:${SANS};font-size:16px;font-weight:bold;color:${C.ink};vertical-align:top;">${value}</td>
                      </tr>`;
    const paid = r.amount !== null ? `&#8377;${r.amount.toLocaleString("en-IN")}${r.transactionId ? `<br><span style="font-weight:normal;font-size:14px;color:${C.muted};">Transaction ${esc(r.transactionId)}</span>` : ""}` : "Received";
    return frame(seatConfirmedEmailSubject(r), preheader, `
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
                    Your place is confirmed.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;font-family:${SERIF};font-size:17px;line-height:1.65;color:${C.muted};text-align:center;">
                    Dear ${esc(r.name)}, we&rsquo;ve received your payment. You&rsquo;re a delegate at the ${esc(conference.title)}, and we look forward to seeing you there.
                  </td>
                </tr>

                <!-- Registration number, in the site's double-rule frame -->
                <tr>
                  <td align="center" style="padding:32px 0 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:4px double ${C.ink};">
                      <tr>
                        <td align="center" style="padding:18px 20px;">
                          <div style="font-family:${SERIF};font-size:14px;font-style:italic;color:${C.faint};">Confirmed delegate</div>
                          <div style="padding-top:6px;font-family:${SANS};font-size:26px;font-weight:bold;letter-spacing:0.06em;white-space:nowrap;color:${C.signal};">${ref}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;font-family:${SERIF};font-size:14px;color:${C.faint};text-align:center;">
                    Keep this email. Your registration number is your proof of registration.
                  </td>
                </tr>

                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${C.ink};">
                      ${row("Date", date)}
                      ${row("Place", `${esc(conference.place)}${r.venue ? `<br><span style="font-weight:normal;color:${C.muted};">${esc(r.venue)}</span>` : `<br><span style="font-weight:normal;font-size:14px;color:${C.muted};">Venue to be announced by email</span>`}`)}
                      ${row("Payment", paid)}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;font-family:${SERIF};font-size:16px;line-height:1.65;color:${C.ink};">
                    We&rsquo;ll email you the venue, timings and anything else you need before the day.${
                        r.minor ? " As you are under 18, we have copied your parent or guardian." : ""
                    }
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

`);
}
