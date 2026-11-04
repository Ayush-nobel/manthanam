import { MapPin } from "lucide-react";
import ContactForm from "@/components/contact-form";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { site } from "@/lib/site";

export default function Contact() {
    return (
        <section id="contact" aria-labelledby="contact-title" className="border-t border-line bg-ink-2/40">
            <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 sm:py-32 lg:grid-cols-12 lg:gap-16">
                <Reveal className="lg:col-span-5">
                    <SectionHeading
                        index="05"
                        eyebrow="Contact"
                        id="contact-title"
                        title={
                            <>
                                Begin a <em className="italic text-saffron">conversation.</em>
                            </>
                        }
                    />
                    <p className="mt-6 max-w-md text-base leading-relaxed text-muted-ink sm:text-lg">
                        For collaborations, membership, media, or simply an argument worth having — write to us.
                    </p>
                    <p className="mt-10 flex items-center gap-3 text-sm text-paper/90">
                        <MapPin className="h-4 w-4 text-saffron" aria-hidden="true" />
                        {site.location}, India
                    </p>
                </Reveal>

                <Reveal delay={0.1} className="lg:col-span-7">
                    <ContactForm />
                </Reveal>
            </div>
        </section>
    );
}
