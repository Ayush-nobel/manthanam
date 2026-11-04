export interface TeamMember {
  /** Full name as it should appear on the site. */
  name: string;
  role: string;
  /** One or two sentences, in the member's own words. */
  bio: string;
  /** Path under /public, e.g. "/team/CEO.png". Square crops work best; falls back to initials. */
  photo?: string;
  linkedin?: string;
  instagram?: string;
  /** Never rendered as plain text: encoded on the server, turned into a mailto: link in the browser. */
  email?: string;
}

export const team: TeamMember[] = [
  {
    name: "Harsh Dev Garg",
    role: "Chief Executive Officer",
    bio: "An emerging young leader with a keen interest in International Relations, Political Science, Geopolitics and Strategic Affairs. Passionate about diplomacy, global governance, policy discourse and India's role in an evolving multipolar world.",
    photo: "/team/CEO.png",
    linkedin: "https://www.linkedin.com/in/harsh-dev-garg-0a07632b9/",
    instagram: "https://www.instagram.com/ha4shh.pvt",
    email: "ceo@manthanam.in",
  },
];
