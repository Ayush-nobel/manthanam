export const site = {
  name: "Manthanam",
  tagline: "India's youth-driven strategic think tank",
  location: "New Delhi",
  founded: 2024,
  // Shown as a fallback if the contact form can't be submitted.
  // (The form's endpoint comes from NEXT_PUBLIC_FORMSPREE_URL — see .env.example.)
  email: "contact@manthanam.in",
  nav: [
    { label: "About", href: "/#about" },
    { label: "Research", href: "/#research" },
    { label: "Insights", href: "/insights" },
    // Discussions = the "Discussion" category of Insights (roundtable notes, debates).
    { label: "Discussions", href: "/insights/category/discussion" },
    { label: "Team", href: "/#team" },
    { label: "Contact", href: "/#contact" },
  ],
} as const;
