export const site = {
  name: "Manthanam",
  /** Canonical origin: every canonical tag, the sitemap and structured data use this host. */
  url: "https://www.manthanam.in",
  tagline: "India's youth-driven strategic think tank",
  location: "New Delhi",
  founded: 2024,
  // Shown as a fallback if the contact form can't be submitted.
  // (The form's endpoint comes from NEXT_PUBLIC_FORMSPREE_URL — see .env.example.)
  email: "contact@manthanam.in",
  // Business details shown in the footer and the legal pages. Only confirmed facts:
  // the legal form and registration number have not been provided, so they are not stated.
  legal: {
    name: "Manthanam Research Foundation",
    status: "a registered non-governmental organisation",
    address: "New Delhi, India",
    country: "India",
  },
  policies: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Refund Policy", href: "/refunds" },
  ],
  nav: [
    { label: "About", href: "/#about" },
    { label: "Research", href: "/#research" },
    { label: "Messages", href: "/#messages" },
    // Discussions = the "Discussion" category of Insights (roundtable notes, debates).
    { label: "Discussions", href: "/insights/category/discussion" },
    { label: "Events", href: "/events" },
    { label: "Team", href: "/#team" },
    { label: "Contact", href: "/#contact" },
  ],
} as const;
