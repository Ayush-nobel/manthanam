import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keeps admin sign-in sessions fresh. Supabase access tokens last an hour; this swaps an expiring one
 * for a new one and writes the new cookies before the admin page renders (Server Components can't set
 * cookies). It is only an early redirect for signed-out visitors: every admin page and action checks
 * the session and role again on the server (lib/auth.ts).
 */
export async function adminProxy(request: NextRequest) {
    let url: string | undefined;
    try {
        url = process.env.SUPABASE_URL?.trim() ? new URL(process.env.SUPABASE_URL.trim()).origin : undefined;
    } catch {}
    const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
    const isLogin = request.nextUrl.pathname === "/admin/login";
    if (!url || !key) return NextResponse.next();

    let response = NextResponse.next({ request });
    const supabase = createServerClient(url, key, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (list) => {
                for (const { name, value } of list) request.cookies.set(name, value);
                response = NextResponse.next({ request });
                for (const { name, value, options } of list) response.cookies.set(name, value, options);
            },
        },
    });
    const { data } = await supabase.auth.getUser();

    if (!data.user && !isLogin) {
        const to = request.nextUrl.clone();
        to.pathname = "/admin/login";
        to.search = "";
        const redirect = NextResponse.redirect(to);
        for (const c of response.cookies.getAll()) redirect.cookies.set(c);
        return redirect;
    }
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
}
