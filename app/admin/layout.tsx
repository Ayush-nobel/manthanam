import type { Metadata } from "next";

// Admin pages read the sign-in session on every request, so they render on demand.
export const instant = false;

export const metadata: Metadata = {
    title: { default: "Admin", template: "%s — Manthanam admin" },
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
    return <div className="flex min-h-full flex-1 flex-col bg-paper text-ink">{children}</div>;
}
