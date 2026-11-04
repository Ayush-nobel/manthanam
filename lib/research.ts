export interface ResearchItem {
  type: "Policy Brief" | "Issue Paper" | "Commentary";
  area: string;
  title: string;
  summary: string;
  href: string;
}

// SAMPLE ENTRIES — placeholders to show the layout. Replace with Manthanam's real
// publications (title, summary, link) before the site goes live.
export const latestResearch: ResearchItem[] = [
  {
    type: "Policy Brief",
    area: "Geopolitics",
    title: "Navigating a Multipolar Indo-Pacific: Options for Indian Strategy",
    summary:
      "How India can balance partnerships, protect strategic autonomy, and shape the regional order rather than react to it.",
    href: "#",
  },
  {
    type: "Issue Paper",
    area: "National Security",
    title: "The Space Below War: Responding to Grey-Zone Pressure",
    summary:
      "A framework for deterring coercion that stays beneath the threshold of open conflict — on land, at sea, and online.",
    href: "#",
  },
  {
    type: "Commentary",
    area: "Civilisational Thought",
    title: "What the Arthashastra Still Teaches About Statecraft",
    summary:
      "Reading Kautilya not as antiquity but as a living toolkit for intelligence, alliances, and the economics of power.",
    href: "#",
  },
];
