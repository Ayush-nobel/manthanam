import type { Metadata } from "next";
import { Bodoni_Moda, EB_Garamond, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

// Font system — swap any of these in one place; globals.css maps them to
// --font-heading / --font-body / --font-deva.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Devanagari subset only: Latin text keeps falling through to the heading/body fonts.
const notoDeva = Noto_Serif_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  // Only Hindi/Sanskrit text uses it, all below the fold: fetch on demand instead of
  // preloading 125 KB ahead of the hero (measured: it delayed first render on mobile).
  preload: false,
});

const DESCRIPTION =
  "Manthanam is India's youth-driven strategic think tank — forging policy, shaping discourse, and reviving civilisational wisdom at the intersection of geopolitics, security, and statecraft.";

// Canonical URLs are set per page (a canonical here would be inherited by every route).
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Manthanam — India's youth-driven strategic think tank",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    title: "Manthanam — India's youth-driven strategic think tank",
    description: DESCRIPTION,
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${bodoni.variable} ${garamond.variable} ${notoDeva.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
