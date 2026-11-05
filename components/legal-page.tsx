import Link from "next/link";
import Markdown from "@/components/markdown";
import { formatDate } from "@/lib/insights";
import { getLegalDoc, type LegalSlug } from "@/lib/legal";
import { site } from "@/lib/site";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
    const doc = await getLegalDoc(slug);
    return (
        <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
            <header>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-faint">{site.legal.name}</p>
                <h1 className="mt-5 font-serif text-[clamp(2rem,8vw,3.75rem)] leading-[1.1] text-paper">{doc.title}</h1>
                <p className="mt-5 text-lg text-muted-ink">{doc.summary}</p>
                <p className="mt-6 text-sm text-faint">
                    Last updated <time dateTime={doc.updated}>{formatDate(doc.updated)}</time>
                </p>
            </header>
            <div className="mt-10 border-t border-line pt-4 text-base">
                <Markdown>{doc.body}</Markdown>
            </div>
            <nav aria-label="Policies" className="mt-16 border-t border-line pt-8">
                <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                    {site.policies.map((p) => (
                        <li key={p.href}>
                            <Link
                                href={p.href}
                                aria-current={p.href === `/${slug}` ? "page" : undefined}
                                className="text-muted-ink underline-offset-4 transition-colors hover:text-saffron aria-[current=page]:text-paper aria-[current=page]:underline"
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
