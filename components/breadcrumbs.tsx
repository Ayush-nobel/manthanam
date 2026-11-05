import Link from "next/link";
import { ChevronRight } from "lucide-react";
import JsonLd from "@/components/json-ld";
import { site } from "@/lib/site";

export interface Crumb {
    name: string;
    /** Path for every crumb except the current page (last). */
    href?: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. The last crumb is the current page. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
    const trail: Crumb[] = [{ name: "Home", href: "/" }, ...items];
    return (
        <>
            <nav aria-label="Breadcrumb" className="text-sm">
                <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-faint">
                    {trail.map((c, i) => {
                        const last = i === trail.length - 1;
                        return (
                            <li key={`${c.name}-${i}`} className="flex items-center gap-1.5">
                                {last || !c.href ? (
                                    <span aria-current={last ? "page" : undefined} className="text-muted-ink">
                                        {c.name}
                                    </span>
                                ) : (
                                    <Link href={c.href} className="rounded-sm underline-offset-4 transition-colors hover:text-saffron hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron">
                                        {c.name}
                                    </Link>
                                )}
                                {!last && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                            </li>
                        );
                    })}
                </ol>
            </nav>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: trail.map((c, i) => ({
                        "@type": "ListItem",
                        position: i + 1,
                        name: c.name,
                        ...(c.href ? { item: new URL(c.href, site.url).toString() } : {}),
                    })),
                }}
            />
        </>
    );
}
