import "server-only";

/**
 * Minimal Zoho Sheet client for the conference registration gateway (server only).
 *
 * Auth: a Zoho "Self Client" refresh token (scopes ZohoSheet.dataAPI.UPDATE,ZohoSheet.dataAPI.READ)
 * is exchanged for an access token, which lasts an hour and is reused until shortly before it
 * expires — Zoho allows only ten new access tokens per ten minutes.
 * Data: the Tabular Data API treats the worksheet as a table whose first row holds the column
 * names; each record is an object keyed by those names. Setup: docs/registration-sheet.md.
 */

const env = (k: string) => process.env[k]?.trim() || undefined;
const DC = env("ZOHO_DC") ?? "in"; // data centre: in, com, eu, com.au, jp, ca, sa …
const CLIENT_ID = env("ZOHO_CLIENT_ID");
const CLIENT_SECRET = env("ZOHO_CLIENT_SECRET");
const REFRESH_TOKEN = env("ZOHO_REFRESH_TOKEN");
const RESOURCE_ID = env("ZOHO_SHEET_RESOURCE_ID");
const WORKSHEET = env("ZOHO_SHEET_WORKSHEET") ?? "Registrations";

export const zohoConfigured = () => !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && RESOURCE_ID && /^[a-z.]+$/.test(DC));

let cached: { token: string; until: number } | null = null;

async function accessToken(): Promise<string> {
    if (cached && Date.now() < cached.until) return cached.token;
    const res = await fetch(`https://accounts.zoho.${DC}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            refresh_token: REFRESH_TOKEN!,
            client_id: CLIENT_ID!,
            client_secret: CLIENT_SECRET!,
            grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
    if (!res.ok || !body?.access_token) throw new Error(`Zoho token refresh failed: ${res.status} ${body?.error ?? ""}`);
    // Renew five minutes early.
    cached = { token: body.access_token, until: Date.now() + ((body.expires_in ?? 3600) - 300) * 1000 };
    return cached.token;
}

interface SheetResponse {
    status?: "success" | "failure";
    error_code?: number;
    error_message?: string;
    records?: Record<string, unknown>[];
}

async function call(params: Record<string, string>): Promise<SheetResponse> {
    const token = await accessToken();
    const res = await fetch(`https://sheet.zoho.${DC}/api/v2/${encodeURIComponent(RESOURCE_ID!)}`, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ worksheet_name: WORKSHEET, header_row: "1", ...params }),
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
    });
    if (res.status === 401) cached = null; // token revoked or expired early: refresh next time
    const body = (await res.json().catch(() => null)) as SheetResponse | null;
    if (!body) throw new Error(`Zoho Sheet returned ${res.status} with no JSON`);
    return body;
}

/** True if a row already has this exact value in the given column. Errors count as "not found" (the add will surface them). */
export async function hasValue(column: string, value: string): Promise<boolean> {
    if (/["\\]/.test(column + value)) return false;
    try {
        const out = await call({ method: "worksheet.records.fetch", criteria: `"${column}"="${value}"` });
        return out.status === "success" && (out.records?.length ?? 0) > 0;
    } catch {
        return false;
    }
}

/** Appends one row. Keys must match the worksheet's header row exactly. */
export async function addRow(record: Record<string, string>): Promise<void> {
    const out = await call({ method: "worksheet.records.add", json_data: JSON.stringify([record]) });
    if (out.status !== "success") throw new Error(`Zoho Sheet add failed: ${out.error_code ?? ""} ${out.error_message ?? ""}`);
}
