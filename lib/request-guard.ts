import "server-only";
import { site } from "@/lib/site";

/** Shared protections for the public form endpoints (registrations, contact messages). */

/**
 * The visitor's IP for rate limiting. CloudFront-Viewer-Address is set by CloudFront itself and can't be
 * faked; the first X-Forwarded-For entry can (a client may send its own), so it is only the fallback,
 * and every limit that matters also has a key the visitor can't change (account, recipient address).
 */
export function clientIpFrom(headers: Headers): string {
    const viewer = headers.get("cloudfront-viewer-address");
    if (viewer) return viewer.replace(/:\d+$/, "");
    return (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}
export const clientIp = (request: Request) => clientIpFrom(request.headers);

/** Best-effort limit per key (IP), per server instance: at most `max` calls in each `windowMs`. */
export function rateLimiter(max: number, windowMs: number) {
    const hits = new Map<string, number[]>();
    return (key: string) => {
        const now = Date.now();
        const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
        recent.push(now);
        hits.set(key, recent);
        if (hits.size > 5000) hits.clear();
        return recent.length > max;
    };
}

/**
 * Only accept posts made by this site's own pages. Browsers mark every request with
 * Sec-Fetch-Site, which a web page cannot forge: "same-origin" means our own form sent it.
 * Older browsers that don't send it fall back to comparing the Origin header with our domains.
 */
export function fromThisSite(request: Request) {
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite) return fetchSite === "same-origin";
    const origin = request.headers.get("origin");
    if (!origin) return false;
    let host: string;
    try {
        host = new URL(origin).host.replace(/\.$/, "").replace(/\.:/, ":");
    } catch {
        return false;
    }
    const allowed = new Set([new URL(site.url).host, "manthanam.in"]);
    // "www.manthanam.in." (trailing dot) is the same host written as a fully qualified name.
    for (const h of [request.headers.get("host"), request.headers.get("x-forwarded-host")]) if (h) allowed.add(h.replace(/\.$/, "").replace(/\.:/, ":"));
    try {
        allowed.add(new URL(request.url).host);
    } catch {}
    if (!allowed.has(host)) console.warn("Form post refused: origin", origin, "host", request.headers.get("host"), "x-forwarded-host", request.headers.get("x-forwarded-host"));
    return allowed.has(host);
}

/** Reads a JSON body of at most `max` characters; null if it's too long or not JSON. */
export async function readJson(request: Request, max: number): Promise<Record<string, unknown> | "too long" | null> {
    try {
        const text = await request.text();
        if (text.length > max) return "too long";
        const v = JSON.parse(text);
        return v && typeof v === "object" && !Array.isArray(v) ? v : null;
    } catch {
        return null;
    }
}
