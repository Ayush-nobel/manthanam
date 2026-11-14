import { APPLICATION_STATUS_LABELS, MESSAGE_STATUS_LABELS, REGISTRATION_STATUS_LABELS, type ApplicationStatus, type MessageStatus, type RegistrationStatus } from "@/lib/permissions";

/** Times are shown in India time, which is what the team works in. */
export const when = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const day = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const TONE: Record<string, string> = {
    new: "border-ink text-ink",
    payment_pending: "border-signal text-signal",
    paid: "border-ink bg-paper-2 text-ink",
    confirmed: "border-ink bg-ink text-paper",
    cancelled: "border-line-strong text-faint line-through",
    refunded: "border-line-strong text-faint",
    replied: "border-ink bg-paper-2 text-ink",
    archived: "border-line-strong text-faint",
    spam: "border-line-strong text-faint line-through",
    shortlisted: "border-signal text-signal",
    interview: "border-ink bg-paper-2 text-ink",
    selected: "border-ink bg-ink text-paper",
    not_selected: "border-line-strong text-faint",
    withdrawn: "border-line-strong text-faint line-through",
};

export function StatusBadge({ status, kind = "registration" }: { status: string; kind?: "registration" | "message" | "application" }) {
    const label =
        kind === "registration"
            ? REGISTRATION_STATUS_LABELS[status as RegistrationStatus]
            : kind === "application"
              ? APPLICATION_STATUS_LABELS[status as ApplicationStatus]
              : MESSAGE_STATUS_LABELS[status as MessageStatus];
    return <span className={`inline-block whitespace-nowrap border px-2 py-0.5 text-xs font-semibold ${TONE[status] ?? "border-line-strong"}`}>{label ?? status}</span>;
}

export function PageTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-[1.875rem] font-[650] leading-tight text-ink [font-stretch:115%]">{children}</h1>
            {aside}
        </div>
    );
}

export function NoAccess() {
    return <p className="text-lg text-muted-ink">Your role doesn’t include this page. Ask an owner if you need it.</p>;
}

/** Human description of an audit log line. */
export function describe(action: string, detail: Record<string, unknown>) {
    const d = detail as {
        reference?: string;
        status?: [string, string];
        guardianVerified?: boolean;
        notes?: string;
        rows?: number;
        email?: string;
        role?: string | [string, string];
    };
    switch (action) {
        case "registration.create":
            return `Registered (${d.reference})`;
        case "registration.update": {
            const parts: string[] = [];
            if (d.status) parts.push(`status ${REGISTRATION_STATUS_LABELS[d.status[0] as RegistrationStatus] ?? d.status[0]} → ${REGISTRATION_STATUS_LABELS[d.status[1] as RegistrationStatus] ?? d.status[1]}`);
            if (d.guardianVerified !== undefined) parts.push(d.guardianVerified ? "guardian verified" : "guardian verification removed");
            if (d.notes) parts.push("notes edited");
            return `${d.reference ? `${d.reference}: ` : ""}${parts.join(", ")}`;
        }
        case "registration.email_resent":
            return `Confirmation email resent (${d.reference})`;
        case "registration.export":
            return `Downloaded ${d.rows} registration${d.rows === 1 ? "" : "s"}`;
        case "application.create":
            return "Applied on the website";
        case "application.update": {
            const parts: string[] = [];
            if (d.status) parts.push(`status ${APPLICATION_STATUS_LABELS[d.status[0] as ApplicationStatus] ?? d.status[0]} → ${APPLICATION_STATUS_LABELS[d.status[1] as ApplicationStatus] ?? d.status[1]}`);
            if (d.notes) parts.push("notes edited");
            return `Application: ${parts.join(", ")}`;
        }
        case "application.export":
            return `Downloaded ${d.rows} application${d.rows === 1 ? "" : "s"}`;
        case "message.create":
            return "Contact message received";
        case "message.update":
            return d.status ? `Message marked ${MESSAGE_STATUS_LABELS[d.status[1] as MessageStatus] ?? d.status[1]}` : "Message notes edited";
        case "admin.add":
            return `Added admin ${d.email} (${String(d.role)})`;
        case "admin.role":
            return `${d.email}: role ${d.role?.[0]} → ${d.role?.[1]}`;
        case "admin.remove":
            return `Removed admin ${d.email}`;
        case "admin.password_reset":
            return `Reset password for ${d.email}`;
        case "admin.password_change":
            return "Changed their password";
        case "admin.sign_in":
            return "Signed in";
        default:
            return action;
    }
}
