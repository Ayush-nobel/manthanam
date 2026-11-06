import GlobeStory from "@/components/globe-story";
import { focusAreas } from "@/lib/focus-areas";

export default function FocusAreas() {
    return (
        <section id="focus" aria-labelledby="focus-title" className="bg-paper-2">
            <GlobeStory chapters={focusAreas} titleId="focus-title" title="Five areas of work." />
        </section>
    );
}
