export interface TeamMember {
  /** Full name as it should appear on the site. */
  name: string;
  role: string;
  /** One or two sentences. */
  bio: string;
  /** Path under /public, e.g. "/team/jane-doe.jpg". Falls back to initials until the file exists. */
  photo?: string;
  /** Optional profile link (LinkedIn, X, personal site…). */
  link?: { label: string; href: string };
  /** Marks a placeholder entry; rendered with a visible "To be added" badge. */
  todo?: boolean;
}

// TODO: replace these placeholders with real members (name, role, bio). Put photos in
// public/team/ (square, at least 400×400) and set `photo` to e.g. "/team/firstname-lastname.jpg".
// Remove `todo: true` from each entry once it's real.
export const team: TeamMember[] = [
  { name: "TODO Member One", role: "TODO: Role", bio: "TODO: Short bio — one or two sentences.", photo: "/team/member-1.jpg", todo: true },
  { name: "TODO Member Two", role: "TODO: Role", bio: "TODO: Short bio — one or two sentences.", photo: "/team/member-2.jpg", todo: true },
  { name: "TODO Member Three", role: "TODO: Role", bio: "TODO: Short bio — one or two sentences.", photo: "/team/member-3.jpg", todo: true },
  { name: "TODO Member Four", role: "TODO: Role", bio: "TODO: Short bio — one or two sentences.", photo: "/team/member-4.jpg", todo: true },
];
