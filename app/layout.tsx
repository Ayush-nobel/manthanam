import type { Metadata } from "next";
import { Archivo, Noto_Serif_Devanagari, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

// Font system — swap any of these in one place; globals.css maps them to
// --font-heading / --font-body / --font-deva.
// Display: Archivo, set wide (its width axis runs to 125%) the way chart titles are lettered.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

// Body: Source Serif 4, a sturdy reading serif with optical sizes.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
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
      className={`${archivo.variable} ${sourceSerif.variable} ${notoDeva.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
