import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import About from "@/components/sections/about";
import Contact from "@/components/sections/contact";
import FocusAreas from "@/components/sections/focus-areas";
import Hero from "@/components/sections/hero";
import Join from "@/components/sections/join";
import Messages from "@/components/sections/messages";
import Research from "@/components/sections/research";
import Team from "@/components/sections/team";
import { site } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <About />
        <FocusAreas />
        <Research />
        <Messages />
        <Team />
        <Join />
        <Contact />
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "NGO",
              "@id": `${site.url}/#organization`,
              name: site.legal.name,
              alternateName: site.name,
              description: site.tagline,
              url: site.url,
              logo: `${site.url}/icon.png`,
              email: site.email,
              foundingDate: String(site.founded),
              address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressCountry: "IN" },
            },
            {
              "@type": "WebSite",
              "@id": `${site.url}/#website`,
              name: site.name,
              url: site.url,
              inLanguage: "en-IN",
              publisher: { "@id": `${site.url}/#organization` },
            },
          ],
        }}
      />
    </>
  );
}
