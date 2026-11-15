import { Suspense } from "react";
import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { NavLinks } from "@/components/admin/nav-links";
import { FirstPassword } from "@/components/admin/first-password";
import { requireAdmin } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
    return (
        <Suspense fallback={<p className="p-10 text-muted-ink">Loading…</p>}>
            <Shell>{children}</Shell>
        </Suspense>
    );
}

async function Shell({ children }: { children: React.ReactNode }) {
    const admin = await requireAdmin();
    const links = admin.mustChangePassword ? [] : [
        { href: "/admin", label: "Overview" },
        ...(can(admin.role, "registrations.view") ? [{ href: "/admin/registrations", label: "Registrations" }] : []),
        ...(can(admin.role, "applications.view") ? [{ href: "/admin/applications", label: "Applications" }] : []),
        ...(can(admin.role, "messages.view") ? [{ href: "/admin/messages", label: "Messages" }] : []),
        ...(can(admin.role, "content.edit") ? [{ href: "/admin/content", label: "Content" }] : []),
        ...(can(admin.role, "team.manage") ? [{ href: "/admin/team", label: "Team" }] : []),
        { href: "/admin/account", label: "Account" },
    ];
    return (
        <>
            <header className="border-b border-ink bg-white">
                <div className="mx-auto flex max-w-[84rem] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 pt-3 sm:px-10">
                    <Link href="/admin" className="py-2 font-display text-base font-[650] tracking-[0.12em] text-ink [font-stretch:120%]">
                        MANTHANAM <span className="font-normal tracking-normal text-faint">admin</span>
                    </Link>
                    <div className="flex items-center gap-4 py-2 text-sm">
                        <span className="text-muted-ink">
                            {admin.name || admin.email} · {ROLE_LABELS[admin.role].name}
                        </span>
                        <form action={signOut}>
                            <button type="submit" className="text-ink underline underline-offset-4 hover:text-signal">
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
                <nav aria-label="Admin" className="mx-auto max-w-[84rem] px-3 sm:px-7">
                    <NavLinks links={links} />
                </nav>
            </header>
            <main className="mx-auto w-full max-w-[84rem] flex-1 px-6 py-10 sm:px-10">
                {admin.mustChangePassword ? <FirstPassword /> : children}
            </main>
        </>
    );
}
