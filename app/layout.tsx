import type { Metadata } from "next";
import { Bodoni_Moda, EB_Garamond, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";

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
});

export const metadata: Metadata = {
  title: "Manthanam — India's youth-driven strategic think tank",
  description:
    "Manthanam is India's youth-driven strategic think tank — forging policy, shaping discourse, and reviving civilisational wisdom at the intersection of geopolitics, security, and statecraft.",
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
