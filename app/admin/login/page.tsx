import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdmin } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
    return (
        <main className="flex flex-1 items-center justify-center px-6 py-16">
            <div className="w-full max-w-sm border-[5px] border-double border-ink bg-white px-7 py-8">
                <p className="font-display text-base font-[650] tracking-[0.12em] text-ink [font-stretch:120%]">MANTHANAM</p>
                <h1 className="mt-4 font-display text-2xl font-[650] text-ink [font-stretch:112%]">Sign in to the admin dashboard</h1>
                <div className="mt-6">
                    <Suspense fallback={null}>
                        <Gate />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}

async function Gate() {
    if (!dbConfigured()) return <p className="text-base text-muted-ink">The dashboard isn’t connected to its database yet. See docs/backend.md.</p>;
    if (await getAdmin()) redirect("/admin");
    return (
        <>
            <LoginForm />
            <p className="mt-6 text-sm text-faint">Forgotten your password? Ask an owner to reset it.</p>
        </>
    );
}
