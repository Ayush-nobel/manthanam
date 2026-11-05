import SiteFooter from "@/components/site-footer";
import About from "@/components/sections/about";
import Contact from "@/components/sections/contact";
import FocusAreas from "@/components/sections/focus-areas";
import Hero from "@/components/sections/hero";
import Join from "@/components/sections/join";
import Messages, { visibleMessages } from "@/components/sections/messages";
import Research from "@/components/sections/research";
import Team from "@/components/sections/team";

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
    </>
  );
}
