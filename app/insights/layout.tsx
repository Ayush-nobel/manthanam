import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export default function InsightsLayout({ children }: LayoutProps<"/insights">) {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
        </>
    );
}
