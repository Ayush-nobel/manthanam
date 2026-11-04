import ResponsiveHeroBanner from "@/components/ui/responsive-hero-banner";
import { site } from "@/lib/site";

export default function Hero() {
    return (
        <ResponsiveHeroBanner
            brandName={site.name}
            // Unsplash: dark textured surface — reads as ink, keeps focus on the type
            backgroundImageUrl="https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=2400&q=80"
            navLinks={[...site.nav]}
            ctaButtonText="Join the Mission"
            ctaButtonHref="#join"
            badgeText={`${site.location} · Est. ${site.founded}`}
            title="India Needs"
            titleLine2="Thinkers, Not Followers."
            description="Manthanam is India's youth-driven strategic think tank — forging policy, shaping discourse, and reviving civilisational wisdom at the intersection of geopolitics, security, and statecraft."
            primaryButtonText="Explore Research"
            primaryButtonHref="#research"
            secondaryButtonText="Our Philosophy"
            secondaryButtonHref="#about"
        />
    );
}
