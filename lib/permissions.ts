/**
 * Admin roles and what each may do. One table, used by every admin page, form action and export,
 * on the server, so a hidden button is never the only thing standing in the way.
 */

export const ROLES = ["owner", "editor", "content", "registrations", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, { name: string; description: string }> = {
    owner: { name: "Owner", description: "Everything, including adding and removing admins." },
    registrations: { name: "Registrations", description: "Sees and updates registrations, internship applications and contact messages." },
    editor: { name: "Editor", description: "Reviews and publishes Insights, and edits the conference details." },
    content: { name: "Writer", description: "Writes Insights drafts and submits them for review." },
    viewer: { name: "Viewer", description: "Can look at registrations, applications and messages, but not change them." },
};

export type Permission =
    | "registrations.view"
    | "registrations.edit"
    | "registrations.export"
    | "applications.view"
    | "applications.edit"
    | "applications.export"
    | "messages.view"
    | "messages.edit"
    | "content.edit"
    | "content.publish"
    | "team.manage";

const GRANTS: Record<Role, readonly Permission[]> = {
    owner: ["registrations.view", "registrations.edit", "registrations.export", "applications.view", "applications.edit", "applications.export", "messages.view", "messages.edit", "content.edit", "content.publish", "team.manage"],
    editor: ["content.edit", "content.publish"],
    registrations: ["registrations.view", "registrations.edit", "registrations.export", "applications.view", "applications.edit", "applications.export", "messages.view", "messages.edit"],
    content: ["content.edit"],
    viewer: ["registrations.view", "applications.view", "messages.view"],
};

export const can = (role: Role | undefined | null, p: Permission) => !!role && GRANTS[role].includes(p);
export const isRole = (r: unknown): r is Role => typeof r === "string" && (ROLES as readonly string[]).includes(r);

export const REGISTRATION_STATUSES = ["new", "payment_pending", "paid", "confirmed", "cancelled", "refunded"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
    new: "New",
    payment_pending: "Payment pending",
    paid: "Paid",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    refunded: "Refunded",
};

export const MESSAGE_STATUSES = ["new", "replied", "archived", "spam"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = { new: "New", replied: "Replied", archived: "Archived", spam: "Spam" };

export const APPLICATION_STATUSES = ["new", "shortlisted", "interview", "selected", "not_selected", "withdrawn"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    new: "New",
    shortlisted: "Shortlisted",
    interview: "Interview",
    selected: "Selected",
    not_selected: "Not selected",
    withdrawn: "Withdrawn",
};

export const INSIGHT_STATUSES = ["draft", "in_review", "published", "archived"] as const;
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];
export const INSIGHT_STATUS_LABELS: Record<InsightStatus, string> = {
    draft: "Draft",
    in_review: "In review",
    published: "Published",
    archived: "Unpublished",
};
