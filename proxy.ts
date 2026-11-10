import type { NextRequest } from "next/server";
import { adminProxy } from "@/lib/proxy-admin";
import { insightsProxy } from "@/lib/proxy-insights";

/** One proxy for the site (Next.js allows only one): admin sessions, and real 404s for unknown Insights URLs. */
export function proxy(request: NextRequest) {
    return request.nextUrl.pathname.startsWith("/admin") ? adminProxy(request) : insightsProxy(request);
}

export const config = {
    matcher: ["/insights/:path+", "/admin", "/admin/:path*"],
};
