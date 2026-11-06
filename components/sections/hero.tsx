import ChartContours from "@/components/chart-contours";
import { site } from "@/lib/site";

// Graduations along the chart's neatline: India's own longitudes and latitudes.
const LONGITUDES = ["68°E", "72°E", "76°E", "80°E", "84°E", "88°E", "92°E"];
const LATITUDES = ["32°N", "28°N", "24°N", "20°N", "16°N", "12°N"];

/** Alternating ink/paper divisions, the way a chart border marks minutes of arc. */
const scaleBar = (dir: "90deg" | "180deg") =>
    `repeating-linear-gradient(${dir}, var(--ink) 0 48px, transparent 48px 96px)`;

/**
 * The hero is a chart: a depth-contour sheet of the churning ocean inside a graduated
 * neatline, with the headline set in the chart's title cartouche.
 */
export default function Hero() {
    return (
        <section aria-labelledby="hero-title" className="px-3 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-5">
            <figure className="relative">
                {/* Graduation labels outside the neatline (desktop only) */}
                <div aria-hidden="true" className="hidden justify-around pb-1 text-xs italic text-faint lg:flex">
                    {LONGITUDES.map((l) => (
                        <span key={l}>{l}</span>
                    ))}
                </div>
                <div className="relative flex">
                    <div aria-hidden="true" className="hidden w-12 flex-col justify-around pr-2 text-right text-xs italic text-faint lg:flex">
                        {LATITUDES.map((l) => (
                            <span key={l}>{l}</span>
                        ))}
                    </div>

                    {/* Neatline: a 1px frame with a divided scale bar along two edges */}
                    <div className="relative isolate flex-1 overflow-hidden border border-ink lg:min-h-[calc(100svh-9rem)]">
                        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 border-b border-ink" style={{ backgroundImage: scaleBar("90deg") }} />
                        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 border-r border-ink" style={{ backgroundImage: scaleBar("180deg") }} />

                        <ChartContours className="absolute inset-0 -z-10" />

                        <div className="px-5 pb-[58svh] pt-8 sm:px-10 sm:pt-12 md:pb-[46svh] lg:px-14 lg:pb-14 lg:pt-16">
                            {/* Title cartouche */}
                            <div className="max-w-[40rem] border-[5px] border-double border-ink bg-paper px-6 py-8 animate-fade-slide-in-1 sm:px-10 sm:py-11">
                                <h1
                                    id="hero-title"
                                    className="font-display text-[clamp(2.125rem,5.6vw,4.5rem)] font-[650] leading-[0.98] tracking-[-0.02em] text-ink [font-stretch:108%] sm:[font-stretch:125%]"
                                >
                                    India needs thinkers, not followers.
                                </h1>
                                <p className="mt-7 max-w-[32rem] text-lg leading-[1.6] text-muted-ink">
                                    Manthanam is India&rsquo;s youth-driven strategic think tank: forging policy, shaping
                                    discourse, and reviving civilisational wisdom at the intersection of geopolitics,
                                    security, and statecraft.
                                </p>
                                <p className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-display text-base font-semibold text-ink [font-stretch:112%]">
                                    <a href="#research" className="link-draw">
                                        Read the research
                                    </a>
                                    <a href="#about" className="link-draw">
                                        Our philosophy
                                    </a>
                                </p>
                                <p className="mt-9 border-t border-ink pt-3 text-sm text-faint">
                                    Published by {site.legal.name}, {site.location}. Established {site.founded}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <figcaption className="mt-2 max-w-[56rem] text-sm italic text-faint lg:ml-12">
                    Samudra Manthan, the churning of the ocean, drawn as a depth chart. Soundings in metres; the
                    magenta line is the first danger, the poison that rose before the nectar.
                </figcaption>
            </figure>
        </section>
    );
}
