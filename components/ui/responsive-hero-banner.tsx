"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";

interface NavLink {
    label: string;
    href: string;
    isActive?: boolean;
}

interface Partner {
    logoUrl: string;
    href: string;
}

interface ResponsiveHeroBannerProps {
    /** Text wordmark shown when no logoUrl is given. */
    brandName?: string;
    logoUrl?: string;
    backgroundImageUrl?: string;
    navLinks?: NavLink[];
    ctaButtonText?: string;
    ctaButtonHref?: string;
    badgeText?: string;
    /** Optional pill before the badge text; a saffron dot is shown when omitted. */
    badgeLabel?: string;
    title?: string;
    titleLine2?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonHref?: string;
    secondaryButtonText?: string;
    secondaryButtonHref?: string;
    partnersTitle?: string;
    /** Partner logo strip — omitted entirely when empty. */
    partners?: Partner[];
}

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
    brandName = "Manthanam",
    logoUrl,
    backgroundImageUrl = "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=2400&q=80",
    navLinks = [],
    ctaButtonText = "Join the Mission",
    ctaButtonHref = "#join",
    badgeLabel,
    badgeText,
    title = "",
    titleLine2,
    description,
    primaryButtonText,
    primaryButtonHref = "#",
    secondaryButtonText,
    secondaryButtonHref = "#",
    partnersTitle,
    partners = [],
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <section className="w-full isolate min-h-svh overflow-hidden relative flex flex-col bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote, consumer-supplied URL */}
            <img
                src={backgroundImageUrl}
                alt=""
                className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0 opacity-70"
            />
            {/* Ink wash + a faint saffron glow so text stays legible on any image */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_38%,rgb(255_153_51/0.10),transparent_70%),linear-gradient(to_bottom,rgb(11_12_16/0.55),rgb(11_12_16/0.75)_60%,var(--ink))]"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30" />

            <header className="z-10 xl:top-4 relative">
                <div className="mx-6">
                    <div className="flex items-center justify-between pt-4">
                        {logoUrl ? (
                            <a
                                href="#"
                                aria-label={brandName}
                                className="inline-flex items-center justify-center bg-center w-[100px] h-[40px] bg-cover rounded"
                                style={{ backgroundImage: `url(${logoUrl})` }}
                            />
                        ) : (
                            <a
                                href="#"
                                className="inline-flex items-center gap-2 font-serif text-2xl tracking-tight text-paper"
                            >
                                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-saffron" />
                                {brandName}
                            </a>
                        )}

                        <nav aria-label="Primary" className="hidden lg:flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                                {navLinks.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.href}
                                        aria-current={link.isActive ? "page" : undefined}
                                        className={`px-3 py-2 text-sm font-medium hover:text-paper font-sans transition-colors ${link.isActive ? "text-paper" : "text-paper/75"
                                            }`}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                                <a
                                    href={ctaButtonHref}
                                    className="ml-1 inline-flex items-center gap-2 rounded-full bg-saffron px-3.5 py-2 text-sm font-medium text-ink hover:bg-saffron-deep font-sans transition-colors"
                                >
                                    {ctaButtonText}
                                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                                </a>
                            </div>
                        </nav>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
                            aria-expanded={mobileMenuOpen}
                            aria-controls="hero-mobile-menu"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5 text-paper" aria-hidden="true" />
                            ) : (
                                <Menu className="h-5 w-5 text-paper" aria-hidden="true" />
                            )}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <nav
                            id="hero-mobile-menu"
                            aria-label="Primary"
                            className="lg:hidden mt-3 flex flex-col gap-1 rounded-2xl bg-ink/80 p-2 ring-1 ring-white/10 backdrop-blur"
                        >
                            {navLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.href}
                                    aria-current={link.isActive ? "page" : undefined}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`rounded-xl px-4 py-3 text-sm font-medium font-sans transition-colors hover:bg-white/10 hover:text-paper ${link.isActive ? "text-paper" : "text-paper/80"
                                        }`}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <a
                                href={ctaButtonHref}
                                onClick={() => setMobileMenuOpen(false)}
                                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-saffron px-4 py-3 text-sm font-medium text-ink hover:bg-saffron-deep font-sans transition-colors"
                            >
                                {ctaButtonText}
                                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </nav>
                    )}
                </div>
            </header>

            <div className="z-10 relative flex flex-1 items-center">
                <div className="w-full sm:pt-24 md:pt-28 max-w-7xl mx-auto pt-20 px-6 pb-24">
                    <div className="mx-auto max-w-3xl text-center">
                        {badgeText && (
                            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
                                {badgeLabel ? (
                                    <span className="inline-flex items-center text-xs font-medium text-ink bg-saffron rounded-full py-0.5 px-2 font-sans">
                                        {badgeLabel}
                                    </span>
                                ) : (
                                    <span aria-hidden="true" className="ml-1 h-1.5 w-1.5 rounded-full bg-saffron" />
                                )}
                                <span className="pr-1 text-sm font-medium tracking-wide text-paper/90 font-sans">
                                    {badgeText}
                                </span>
                            </div>
                        )}

                        <h1 className="sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-[2.6rem] text-paper tracking-tight font-serif font-normal text-balance animate-fade-slide-in-2">
                            {title}
                            {titleLine2 && (
                                <>
                                    <br className="hidden sm:block" />{" "}
                                    <em className="italic text-saffron">{titleLine2}</em>
                                </>
                            )}
                        </h1>

                        {description && (
                            <p className="sm:text-lg animate-fade-slide-in-3 text-base leading-relaxed text-paper/80 max-w-2xl mt-6 mx-auto text-pretty">
                                {description}
                            </p>
                        )}

                        {(primaryButtonText || secondaryButtonText) && (
                            <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center animate-fade-slide-in-4">
                                {primaryButtonText && (
                                    <a
                                        href={primaryButtonHref}
                                        className="inline-flex min-h-11 items-center gap-2 bg-saffron hover:bg-saffron-deep text-sm font-medium text-ink rounded-full py-3 px-5 font-sans transition-colors"
                                    >
                                        {primaryButtonText}
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </a>
                                )}
                                {secondaryButtonText && (
                                    <a
                                        href={secondaryButtonHref}
                                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/15 hover:bg-white/10 px-5 py-3 text-sm font-medium text-paper/90 hover:text-paper font-sans transition-colors"
                                    >
                                        {secondaryButtonText}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {partners.length > 0 && (
                        <div className="mx-auto mt-20 max-w-5xl">
                            {partnersTitle && (
                                <p className="animate-fade-slide-in-1 text-sm text-paper/70 text-center">
                                    {partnersTitle}
                                </p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 animate-fade-slide-in-2 mt-6 items-center justify-items-center gap-4">
                                {partners.map((partner, index) => (
                                    <a
                                        key={index}
                                        href={partner.href}
                                        aria-label={`Partner ${index + 1}`}
                                        className="inline-flex items-center justify-center bg-center w-[120px] h-[36px] bg-cover rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                        style={{ backgroundImage: `url(${partner.logoUrl})` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ResponsiveHeroBanner;
