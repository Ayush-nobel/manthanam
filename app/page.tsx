import SiteFooter from "@/components/site-footer";
import About from "@/components/sections/about";
import Contact from "@/components/sections/contact";
import FocusAreas from "@/components/sections/focus-areas";
import Hero from "@/components/sections/hero";
import Join from "@/components/sections/join";
import Research from "@/components/sections/research";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <About />
        <FocusAreas />
        <Research />
        <Join />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
