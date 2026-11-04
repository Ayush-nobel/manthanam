import type { Metadata } from "next";
import { Geist_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Editorial serif for headings (UI/UX Pro Max "News Editorial" pairing).
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${inter.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
