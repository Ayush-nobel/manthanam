/**
 * Admin roles and what each may do. One table, used by every admin page, form action and export,
 * on the server, so a hidden button is never the only thing standing in the way.
 */

export const ROLES = ["owner", "registrations", "content", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, { name: string; description: string }> = {
    owner: { name: "Owner", description: "Everything, including adding and removing admins." },
    registrations: { name: "Registrations", description: "Sees and updates registrations and contact messages." },
    content: { name: "Content", description: "Edits the website’s content." },
    viewer: { name: "Viewer", description: "Can look at registrations and messages, but not change them." },
};

export type Permission =
    | "registrations.view"
    | "registrations.edit"
    | "registrations.export"
    | "messages.view"
    | "messages.edit"
    | "content.edit"
    | "team.manage";

const GRANTS: Record<Role, readonly Permission[]> = {
    owner: ["registrations.view", "registrations.edit", "registrations.export", "messages.view", "messages.edit", "content.edit", "team.manage"],
    registrations: ["registrations.view", "registrations.edit", "registrations.export", "messages.view", "messages.edit"],
    content: ["content.edit"],
    viewer: ["registrations.view", "messages.view"],
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
