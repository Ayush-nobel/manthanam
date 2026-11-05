import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import About from "@/components/sections/about";
import Contact from "@/components/sections/contact";
import FocusAreas from "@/components/sections/focus-areas";
import Hero from "@/components/sections/hero";
import Join from "@/components/sections/join";
import Messages, { visibleMessages } from "@/components/sections/messages";
import Research from "@/components/sections/research";
import Team from "@/components/sections/team";
import { site } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  // Messages only renders when it has entries; keep the section numbers continuous.
  const hasMessages = visibleMessages.length > 0;

  return (
    <>
      <main className="flex-1">
        <Hero />
        <About />
        <FocusAreas />
        <Research />
        <Team />
        <Join />
        {hasMessages && <Messages index="06" />}
        <Contact index={hasMessages ? "07" : "06"} />
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
