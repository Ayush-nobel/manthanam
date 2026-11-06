export interface TeamMember {
  /** Full name as it should appear on the site. */
  name: string;
  role: string;
  /** In the member's own words. Separate paragraphs with a blank line ("\n\n"). */
  bio: string;
  /** Path under /public, e.g. "/team/CEO.png". Shown as a square; falls back to initials. */
  photo?: string;
  /**
   * Where the face sits in the photo, as a CSS object-position (default "50% 50%").
   * The square crop centres on this point, so every portrait frames head and shoulders.
   */
  photoFocus?: string;
  /** Zoom into the focal point for full-length shots (1 = no zoom). */
  photoZoom?: number;
  linkedin?: string;
  instagram?: string;
  /** Never rendered as plain text: encoded on the server, turned into a mailto: link in the browser. */
  email?: string;
}

export const team: TeamMember[] = [
  {
    name: "Harsh Dev Garg",
    role: "Founder and Chief Executive Officer",
    bio: "An emerging young leader with a keen interest in International Relations, Political Science, Geopolitics and Strategic Affairs. Passionate about diplomacy, global governance, policy discourse and India's role in an evolving multipolar world.",
    photo: "/team/CEO.png",
    // The supplied photo is cropped to a circle on black: zoom until the black corners leave the 4:5 frame.
    // Replace with an uncropped photo and remove these two lines.
    photoFocus: "50% 45%",
    photoZoom: 1.55,
    linkedin: "https://www.linkedin.com/in/harsh-dev-garg-0a07632b9/",
    instagram: "https://www.instagram.com/ha4shh.pvt",
    email: "ceo@manthanam.in",
  },
  {
    name: "Ayush Shukla",
    role: "Secretary General",
    // Typo fixes: removed the space before the first full stop; "Alongside my," was missing a
    // word — "work" inserted, please confirm; "Bachelors" → "a Bachelor's".
    bio: "A tech professional and entrepreneur. I serve as the Founder and CEO of the peer-to-peer rental marketplace RentiGoo, while also working as a Senior Process Associate at HCLTech. Alongside my work, I am pursuing a Bachelor's in Aeronautics and Space Technology at IIT Madras.",
    photo: "/team/Ayush.png",
    photoFocus: "50% 22%",
    linkedin: "https://www.linkedin.com/in/ayushshukla0204",
    instagram: "https://www.instagram.com/ash_wont_talk?mdxt=MXY3eGNrZ3VmMnY5",
    email: "ayush.shukla@manthanam.in",
  },
  {
    name: "Kishnav Kandhari",
    role: "Secretary General",
    bio: "I thrive on bold ideas, unconventional thinking, and the thrill of turning possibilities into reality. Passionate about business, finance, technology and ideas that challenge the ordinary, I enjoy building things from scratch, connecting dots across disciplines and turning ambitious thoughts into action.",
    photo: "/team/Kishnav.png",
    photoFocus: "50% 32%",
    photoZoom: 1.3,
    // Share-tracking parameters (utm_*) removed; same profile.
    linkedin: "https://www.linkedin.com/in/kishnavkandhari",
    // Given as the handle "@kishnav_".
    instagram: "https://www.instagram.com/kishnav_/",
    email: "kishnav.kandhari@manthanam.in",
  },
];
