import ChurningBackground from "@/components/churning-background";
import ResponsiveHeroBanner from "@/components/ui/responsive-hero-banner";
import { site } from "@/lib/site";
import wordmark from "@/public/logo-wordmark.png";

export default function Hero() {
    return (
        <ResponsiveHeroBanner
            brandName={site.name}
            logo={wordmark}
            background={<ChurningBackground />}
            navLinks={[...site.nav]}
            ctaButtonText="Join the Mission"
            ctaButtonHref="#join"
            badgeText={`${site.location} · Est. ${site.founded}`}
            title="India Needs"
            titleLine2={
                <>
                    <span className="text-saffron">Thinkers</span>, Not Followers.
                </>
            }
            description="Manthanam is India's youth-driven strategic think tank — forging policy, shaping discourse, and reviving civilisational wisdom at the intersection of geopolitics, security, and statecraft."
            primaryButtonText="Explore Research"
            primaryButtonHref="#research"
            secondaryButtonText="Our Philosophy"
            secondaryButtonHref="#about"
        />
    );
}
