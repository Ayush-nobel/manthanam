import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs";
import Markdown from "@/components/markdown";
import { formatDate } from "@/lib/insights";
import { getLegalDoc, type LegalSlug } from "@/lib/legal";
import { site } from "@/lib/site";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
    const doc = await getLegalDoc(slug);
    return (
        <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
            <Breadcrumbs items={[{ name: doc.title }]} />
            <header className="mt-8">
                <h1 className="font-display text-[clamp(2.25rem,6vw,3.75rem)] font-[650] leading-[1.02] tracking-[-0.015em] text-ink [font-stretch:120%]">{doc.title}</h1>
                <p className="mt-5 text-lg text-muted-ink">{doc.summary}</p>
                <p className="mt-6 text-sm text-faint">
                    {site.legal.name}. Last updated <time dateTime={doc.updated}>{formatDate(doc.updated)}</time>
                </p>
            </header>
            <div className="mt-10 border-t border-ink pt-4 text-base">
                <Markdown>{doc.body}</Markdown>
            </div>
            <nav aria-label="Policies" className="mt-16 border-t border-line pt-8">
                <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                    {site.policies.map((p) => (
                        <li key={p.href}>
                            <Link
                                href={p.href}
                                aria-current={p.href === `/${slug}` ? "page" : undefined}
                                className="text-muted-ink transition-colors hover:text-signal aria-[current=page]:font-medium aria-[current=page]:text-ink"
                            >
                                {p.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </article>
    );
}
