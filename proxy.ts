import { existsSync } from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { CATEGORIES } from "@/lib/insight-categories";

/**
 * Real 404 status for unknown Insights URLs.
 *
 * With Cache Components these pages stream, so a notFound() inside them can only
 * render the not-found UI under a 200 status ("soft 404"). Checking here, before
 * rendering, lets the server answer 404. Unknown URLs are rewritten to a path that
 * matches no route, which serves the app's not-found page with a 404 status.
 */
const CONTENT_DIR = path.join(process.cwd(), "content", "insights");
const NOT_FOUND = "/__not-found__";

export function proxy(request: NextRequest) {
    const parts = request.nextUrl.pathname.split("/").filter(Boolean); // ["insights", ...]

    if (parts[1] === "category") {
        const known = parts.length === 3 && CATEGORIES.some((c) => c.slug === parts[2]);
        return known ? NextResponse.next() : NextResponse.rewrite(new URL(NOT_FOUND, request.url));
    }

    if (parts.length === 2) {
        // Fail open if the content folder isn't readable from here (e.g. on some hosts);
        // the page itself still renders the not-found UI for unknown slugs.
        if (!existsSync(CONTENT_DIR)) return NextResponse.next();
        const slug = parts[1];
        const known = /^[a-z0-9-]+$/.test(slug) && existsSync(path.join(CONTENT_DIR, `${slug}.md`));
        return known ? NextResponse.next() : NextResponse.rewrite(new URL(NOT_FOUND, request.url));
    }

    if (parts.length > 2) return NextResponse.rewrite(new URL(NOT_FOUND, request.url));
    return NextResponse.next();
}

export const config = {
    matcher: ["/insights/:path+"],
};
