import ContactForm from "@/components/contact-form";
import SectionHeading from "@/components/section-heading";
import { site } from "@/lib/site";

export default function Contact() {
    return (
        <section id="contact" aria-labelledby="contact-title">
            <div className="mx-auto grid max-w-[84rem] gap-16 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-4">
                    <SectionHeading id="contact-title" title="Begin a conversation." />
                    <p className="mt-8 max-w-[26rem] text-lg text-muted-ink">
                        For collaborations, membership, media, or simply an argument worth having &mdash; write to us.
                    </p>
                    <dl className="mt-12 grid gap-6 border-t border-line pt-6 text-base">
                        <div>
                            <dt className="text-sm text-faint">Email</dt>
                            <dd className="mt-1">
                                <a href={`mailto:${site.email}`} className="link-draw text-ink">
                                    {site.email}
                                </a>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-faint">Based in</dt>
                            <dd className="mt-1 text-ink">{site.location}, India</dd>
                        </div>
                    </dl>
                </div>

                <div className="lg:col-span-7 lg:col-start-6">
                    <ContactForm />
                </div>
            </div>
        </section>
    );
}
