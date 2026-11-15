import { existsSync, readFileSync } from "node:fs";
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
// Mirrors lib/insights.ts: `sample: true` pieces only exist under `next dev`.
const SHOW_SAMPLES = process.env.NODE_ENV === "development";

function isSample(file: string): boolean {
    const frontmatter = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
    return !!frontmatter && /^sample:\s*true\s*$/m.test(frontmatter[1]);
}

// Pieces written in the admin dashboard live in the database. Look a slug up there (the secret key never
// leaves the server), remembering answers for a minute so most requests don't wait on it.
const known = new Map<string, { ok: boolean; at: number }>();
async function publishedInDatabase(slug: string): Promise<boolean | null> {
    const hit = known.get(slug);
    if (hit && Date.now() - hit.at < 60_000) return hit.ok;
    let base: string | undefined;
    try {
        base = process.env.SUPABASE_URL?.trim() ? new URL(process.env.SUPABASE_URL.trim()).origin : undefined;
    } catch {}
    const key = process.env.SUPABASE_SECRET_KEY?.trim();
    if (!base || !key) return null;
    try {
        const res = await fetch(`${base}/rest/v1/insights?select=slug&status=eq.published&slug=eq.${encodeURIComponent(slug)}`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return null;
        const ok = ((await res.json()) as unknown[]).length > 0;
        if (known.size > 2000) known.clear();
        known.set(slug, { ok, at: Date.now() });
        return ok;
    } catch {
        return null; // unknown: let the page decide
    }
}

export async function insightsProxy(request: NextRequest) {
    const parts = request.nextUrl.pathname.split("/").filter(Boolean); // ["insights", ...]

    if (parts[1] === "category") {
        const isKnown = parts.length === 3 && CATEGORIES.some((c) => c.slug === parts[2]);
        return isKnown ? NextResponse.next() : NextResponse.rewrite(new URL(NOT_FOUND, request.url));
    }

    if (parts.length === 2) {
        // Fail open if the content folder isn't readable from here (e.g. on some hosts);
        // the page itself still renders the not-found UI for unknown slugs.
        if (!existsSync(CONTENT_DIR)) return NextResponse.next();
        const slug = parts[1];
        const file = path.join(CONTENT_DIR, `${slug}.md`);
        if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.rewrite(new URL(NOT_FOUND, request.url));
        if (existsSync(file) && (SHOW_SAMPLES || !isSample(file))) return NextResponse.next();
        const stored = await publishedInDatabase(slug);
        return stored === false ? NextResponse.rewrite(new URL(NOT_FOUND, request.url)) : NextResponse.next();
    }

    if (parts.length > 2) return NextResponse.rewrite(new URL(NOT_FOUND, request.url));
    return NextResponse.next();
}
