import SiteHeaderBar from "@/components/site-header-bar";
import { getConference } from "@/lib/site-content";

/**
 * Masthead for every page: wordmark, a line of text links, and the one call to action. The
 * "Registration is open" strip follows the switch in /admin/content/conference (cached, so it
 * changes within about a minute of saving).
 */
export default async function SiteHeader() {
    const { registrationOpen } = await getConference();
    return <SiteHeaderBar registrationOpen={registrationOpen} />;
}
