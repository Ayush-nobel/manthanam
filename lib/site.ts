export const site = {
  name: "Manthanam",
  tagline: "India's youth-driven strategic think tank",
  location: "New Delhi",
  founded: 2024,
  // The contact form opens a mail draft to this address.
  email: "contact@manthanam.in",
  nav: [
    { label: "About", href: "#about" },
    { label: "Research", href: "#research" },
    // No sections exist yet for these three — point them at real pages/sections once built.
    { label: "Insights", href: "#" },
    { label: "Discussions", href: "#" },
    { label: "Team", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
} as const;
