/* eslint-disable jsx-a11y/alt-text -- react-pdf’s Image draws into a PDF and has no alt prop. */
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { formatDate, letterRows, offerTitle, verifyUrl, type IssuedLetter } from "@/lib/letters/model";
import { site } from "@/lib/site";

/**
 * The offer letter as an A4 PDF, in the site's design: Archivo for headings, Source Serif 4 for text,
 * navy ink, the double-rule frame. Built from the stored details every time, so a download always
 * matches what was sent.
 *
 * Fonts and the logo are read from disk: next.config.ts lists them in outputFileTracingIncludes so they
 * ship with the server code. (No page numbers: react-pdf drops a fixed footer that contains one.)
 */

const ROOT = process.cwd();
const font = (f: string) => path.join(ROOT, "assets/fonts", f);
let registered = false;
function registerFonts() {
    if (registered) return;
    Font.register({
        family: "Serif",
        fonts: [
            { src: font("SourceSerif4-Regular.ttf"), fontWeight: 400 },
            { src: font("SourceSerif4-It.ttf"), fontWeight: 400, fontStyle: "italic" },
            { src: font("SourceSerif4-Semibold.ttf"), fontWeight: 600 },
        ],
    });
    Font.register({
        family: "Archivo",
        fonts: [
            { src: font("ArchivoSemiExpanded-SemiBold.ttf"), fontWeight: 600 },
            { src: font("ArchivoSemiExpanded-Bold.ttf"), fontWeight: 700 },
        ],
    });
    // Words are never broken across lines.
    Font.registerHyphenationCallback((word) => [word]);
    registered = true;
}

const C = { ink: "#10264a", muted: "#46566c", faint: "#53627a", shoal: "#d9e8ec", paper: "#f5f7f6", signal: "#a0145c" };

const s = StyleSheet.create({
    page: { paddingTop: 34, paddingBottom: 76, paddingHorizontal: 56, fontFamily: "Serif", fontSize: 10, lineHeight: 1.45, color: C.ink },
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    logo: { width: 124, height: 31 },
    org: { fontSize: 8.5, lineHeight: 1.45, color: C.faint, textAlign: "right" },
    ruleThick: { marginTop: 12, borderBottomWidth: 1.5, borderBottomColor: C.ink },
    ruleThin: { marginTop: 2, borderBottomWidth: 0.5, borderBottomColor: C.ink },
    meta: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", fontSize: 9.5, color: C.faint },
    to: { marginTop: 10 },
    toName: { fontFamily: "Archivo", fontWeight: 600, fontSize: 11 },
    title: { marginTop: 13, fontFamily: "Archivo", fontWeight: 700, fontSize: 15, lineHeight: 1.25 },
    p: { marginTop: 8 },
    frameOuter: { marginTop: 12, borderWidth: 1.25, borderColor: C.ink, padding: 2 },
    frameInner: { borderWidth: 0.5, borderColor: C.ink, paddingHorizontal: 14, paddingVertical: 3 },
    row: { flexDirection: "row", paddingVertical: 1.75, borderBottomWidth: 0.5, borderBottomColor: C.shoal },
    rowLast: { flexDirection: "row", paddingVertical: 1.75 },
    rowLabel: { width: "34%", fontStyle: "italic", color: C.faint },
    rowValue: { width: "66%", fontFamily: "Archivo", fontWeight: 600, fontSize: 9.5 },
    h2: { marginTop: 12, fontFamily: "Archivo", fontWeight: 600, fontSize: 10.5 },
    li: { flexDirection: "row", marginTop: 2 },
    term: { flexDirection: "row", marginTop: 2, fontSize: 9, lineHeight: 1.4 },
    bullet: { width: 12, color: C.signal },
    num: { width: 12, color: C.faint },
    liText: { flex: 1 },
    close: { marginTop: 14, flexDirection: "row", alignItems: "flex-start" },
    accept: { flex: 1, borderLeftWidth: 2.5, borderLeftColor: C.signal, backgroundColor: C.paper, paddingVertical: 8, paddingHorizontal: 12 },
    sign: { width: "44%", paddingLeft: 18 },
    signature: { marginTop: 4, height: 36, width: 160, objectFit: "contain", objectPositionX: 0 },
    signGap: { height: 30 },
    signName: { fontFamily: "Archivo", fontWeight: 600, fontSize: 10.5 },
    footer: { position: "absolute", left: 56, right: 56, bottom: 24, flexDirection: "row", alignItems: "center", borderTopWidth: 0.5, borderTopColor: C.ink, paddingTop: 8 },
    qr: { width: 46, height: 46 },
    footText: { flex: 1, marginLeft: 12, fontSize: 8, lineHeight: 1.45, color: C.faint },
    footCode: { fontFamily: "Archivo", fontWeight: 600, color: C.ink, letterSpacing: 0.6 },
});

/** The standard terms printed on every letter of this kind. */
function standardTerms(l: IssuedLetter): string[] {
    const shared = [
        "You will keep confidential any information about Manthanam’s work that has not been made public, during your time with us and afterwards.",
        "Manthanam never asks for any payment in connection with an offer. If anyone asks you for money in Manthanam’s name, please tell us at once.",
    ];
    if (l.kind === "internship")
        return [
            "This is an internship. It does not create a relationship of employer and employee.",
            "Work you produce for Manthanam during the internship may be used by Manthanam, with credit to you where appropriate.",
            "Either you or Manthanam may end the internship by giving seven days’ notice by email.",
            "Certificates and letters of recommendation are issued on satisfactory completion of the internship.",
            ...shared,
        ];
    return [
        "Your detailed terms, including duties, working hours, leave and notice period, will be set out in an appointment letter when you join.",
        "This offer depends on the details you have given us being accurate.",
        ...shared,
    ];
}

const lines = (t: string) =>
    t
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

function Letter({ l, qr, logo, signature }: { l: IssuedLetter; qr: string; logo: Buffer; signature: string | null }) {
    const rows = letterRows(l);
    const firstName = l.fullName.split(" ")[0];
    const opening =
        l.kind === "internship"
            ? `Manthanam Research Foundation is pleased to offer you an internship as ${l.position} in our ${l.department} department, on the terms below.`
            : `Manthanam Research Foundation is pleased to offer you the position of ${l.position} in our ${l.department} department, on the terms below.`;
    const benefits = lines(l.benefits);
    const terms = [...standardTerms(l), ...lines(l.additionalTerms)];

    return (
        <Document title={`${offerTitle(l)} (${l.reference})`} author={site.legal.name} subject={`Offer letter for ${l.fullName}`} creator={site.legal.name} producer={site.legal.name} language="en-IN">
            <Page size="A4" style={s.page}>
                <View style={s.head}>
                    <Image src={{ data: logo, format: "png" }} style={s.logo} />
                    <Text style={s.org}>
                        {site.legal.name}
                        {"\n"}New Delhi, India{"\n"}www.manthanam.in · {site.email}
                    </Text>
                </View>
                <View style={s.ruleThick} />
                <View style={s.ruleThin} />

                <View style={s.meta}>
                    <Text>Letter no. {l.reference}</Text>
                    <Text>{formatDate(l.issueDate)}</Text>
                </View>

                <View style={s.to}>
                    <Text style={s.toName}>{l.fullName}</Text>
                    <Text style={{ color: C.muted }}>{l.email}</Text>
                </View>

                <Text style={s.title}>{offerTitle(l)}</Text>
                <Text style={s.p}>Dear {firstName},</Text>
                <Text style={s.p}>{opening}</Text>

                <View style={s.frameOuter} wrap={false}>
                    <View style={s.frameInner}>
                        {rows.map(([k, v], i) => (
                            <View key={k} style={i === rows.length - 1 ? s.rowLast : s.row}>
                                <Text style={s.rowLabel}>{k}</Text>
                                <Text style={s.rowValue}>{v}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {benefits.length > 0 && (
                    <View wrap={false}>
                        <Text style={s.h2}>{l.kind === "internship" ? "What you’ll receive" : "Benefits"}</Text>
                        {benefits.map((b) => (
                            <View key={b} style={s.li}>
                                <Text style={s.bullet}>•</Text>
                                <Text style={s.liText}>{b}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={s.h2}>Terms</Text>
                {terms.map((t, i) => (
                    <View key={i} style={s.term} wrap={false}>
                        <Text style={s.num}>{i + 1}.</Text>
                        <Text style={s.liText}>{t}</Text>
                    </View>
                ))}

                <View style={s.close} wrap={false}>
                    <View style={s.accept}>
                        <Text>
                            To accept this offer, please reply to the email this letter came with by <Text style={{ fontWeight: 600 }}>{formatDate(l.respondBy)}</Text>. If we haven’t heard from you
                            by then, the offer will lapse.
                        </Text>
                        <Text style={{ marginTop: 4 }}>We look forward to working with you.</Text>
                    </View>
                    <View style={s.sign}>
                        <Text>Yours sincerely,</Text>
                        {signature ? <Image src={signature} style={s.signature} /> : <View style={s.signGap} />}
                        <Text style={s.signName}>{l.signatoryName}</Text>
                        {l.signatoryTitle ? <Text style={{ color: C.muted }}>{l.signatoryTitle}</Text> : null}
                        <Text style={{ color: C.muted }}>For {site.legal.name}</Text>
                    </View>
                </View>

                <View style={s.footer} fixed>
                    <Image src={qr} style={s.qr} />
                    <Text style={s.footText}>
                        Check this letter is genuine: scan the code, or go to manthanam.in/verify and enter <Text style={s.footCode}>{l.verifyCode}</Text>.{"\n"}
                        {site.legal.name}, New Delhi, India. www.manthanam.in
                    </Text>
                </View>
            </Page>
        </Document>
    );
}

/** The letter as PDF bytes. `signature` is a data: URL (PNG or JPEG) from the letter settings, if any. */
export async function renderLetterPdf(l: IssuedLetter, signature: string | null): Promise<Buffer> {
    registerFonts();
    const qr = await QRCode.toDataURL(verifyUrl(site.url, l.verifyCode), { margin: 0, width: 300, errorCorrectionLevel: "M", color: { dark: C.ink, light: "#ffffff" } });
    const logo = readFileSync(path.join(ROOT, "public/logo-wordmark-ink.png"));
    return renderToBuffer(<Letter l={l} qr={qr} logo={logo} signature={signature} />);
}

/** "Offer-letter-MRF-OL-2026-0001-Asha-Rao.pdf". */
export const letterFileName = (l: Pick<IssuedLetter, "reference" | "fullName">) =>
    `Offer-letter-${l.reference.replace(/\//g, "-")}-${l.fullName.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
