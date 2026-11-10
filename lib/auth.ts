import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { db, dbConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/db";
import { can, isRole, type Permission, type Role } from "@/lib/permissions";

/**
 * Admin sign-in (Supabase Auth, email and password). The browser only ever talks to this site:
 * sign-in runs in a server action, and the session lives in httpOnly cookies that proxy.ts keeps fresh.
 * Being signed in isn't enough: the person must also be listed in admin_users with a role.
 */

export interface Admin {
    id: string;
    email: string;
    name: string;
    role: Role;
}

/** Supabase client bound to this request's cookies. Setting cookies only works in actions and route handlers. */
export async function authClient() {
    const store = await cookies();
    return createServerClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
        cookies: {
            getAll: () => store.getAll(),
            setAll: (list) => {
                try {
                    for (const { name, value, options } of list) store.set(name, value, options);
                } catch {
                    // Called from a Server Component: proxy.ts refreshes the session cookies instead.
                }
            },
        },
    });
}

/** The signed-in admin for this request, or null. Checked against Supabase Auth, not just the cookie. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
    if (!dbConfigured()) return null;
    const supabase = await authClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const { data: row } = await db().from("admin_users").select("email, name, role").eq("user_id", data.user.id).maybeSingle();
    if (!row || !isRole(row.role)) return null;
    return { id: data.user.id, email: row.email, name: row.name, role: row.role };
});

/** For admin pages and actions: the admin, or off to the sign-in page. */
export async function requireAdmin(): Promise<Admin> {
    const admin = await getAdmin();
    if (!admin) redirect("/admin/login");
    return admin;
}

/** For server actions: the admin if they hold this permission; otherwise an error to show. */
export async function authorise(p: Permission): Promise<{ admin: Admin; error?: undefined } | { admin?: undefined; error: string }> {
    const admin = await getAdmin();
    if (!admin) return { error: "Your session has ended. Sign in again." };
    if (!can(admin.role, p)) return { error: "Your role doesn’t allow this." };
    return { admin };
}
