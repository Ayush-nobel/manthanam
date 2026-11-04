// Kept separate from lib/insights.ts so proxy.ts can import it without pulling in the Markdown loader.
export const CATEGORIES = [
  { name: "Commentary", slug: "commentary" },
  { name: "Analysis", slug: "analysis" },
  { name: "Policy Brief", slug: "policy-brief" },
  { name: "Discussion", slug: "discussion" },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]["name"];
