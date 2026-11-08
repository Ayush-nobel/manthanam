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

// Written as literal process.env.NAME so next.config.ts can bake build-time values into the server
// bundle (some hosts, such as AWS Amplify, only expose environment variables during the build).
const v = (s: string | undefined) => s?.trim() || undefined;
// Data centre: in, com, eu, com.au, jp, ca, sa … ("zoho.com", ".com" and "COM" are accepted too).
const DC = (v(process.env.ZOHO_DC) ?? "in").toLowerCase().replace(/^(https?:\/\/)?([a-z]+\.)?zoho\./, "").replace(/^\./, "");
const CLIENT_ID = v(process.env.ZOHO_CLIENT_ID);
const CLIENT_SECRET = v(process.env.ZOHO_CLIENT_SECRET);
const REFRESH_TOKEN = v(process.env.ZOHO_REFRESH_TOKEN);
const RESOURCE_ID = v(process.env.ZOHO_SHEET_RESOURCE_ID);
const WORKSHEET = v(process.env.ZOHO_SHEET_WORKSHEET) ?? "Registrations";

/** Names (never values) of the settings that are missing or malformed. */
export function zohoMissing(): string[] {
    const missing: string[] = [];
    if (!CLIENT_ID) missing.push("ZOHO_CLIENT_ID");
    if (!CLIENT_SECRET) missing.push("ZOHO_CLIENT_SECRET");
    if (!REFRESH_TOKEN) missing.push("ZOHO_REFRESH_TOKEN");
    if (!RESOURCE_ID) missing.push("ZOHO_SHEET_RESOURCE_ID");
    if (!/^[a-z]+(\.[a-z]+)?$/.test(DC)) missing.push("ZOHO_DC");
    return missing;
}
export const zohoConfigured = () => zohoMissing().length === 0;
export const zohoDataCentre = () => DC;

export interface ZohoCredentials {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
}
const SHEET_CREDS = (): ZohoCredentials => ({ clientId: CLIENT_ID!, clientSecret: CLIENT_SECRET!, refreshToken: REFRESH_TOKEN! });

// Access tokens by refresh token: Zoho allows only ten new access tokens per ten minutes, so reuse them.
const tokens = new Map<string, { token: string; until: number }>();
export const forgetToken = (c: ZohoCredentials) => tokens.delete(c.refreshToken);

/** An access token for these credentials (from cache while it's still valid for 5+ minutes). */
export async function accessToken(c: ZohoCredentials = SHEET_CREDS()): Promise<string> {
    const hit = tokens.get(c.refreshToken);
    if (hit && Date.now() < hit.until) return hit.token;
    const res = await fetch(`https://accounts.zoho.${DC}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            refresh_token: c.refreshToken,
            client_id: c.clientId,
            client_secret: c.clientSecret,
            grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
    if (!res.ok || !body?.access_token) throw new Error(`Zoho token refresh failed: ${res.status} ${body?.error ?? ""}`);
    const entry = { token: body.access_token, until: Date.now() + ((body.expires_in ?? 3600) - 300) * 1000 };
    tokens.set(c.refreshToken, entry);
    return entry.token;
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
    if (res.status === 401) forgetToken(SHEET_CREDS()); // token revoked or expired early: refresh next time
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

export interface ZohoDiagnosis {
    signIn: string;
    spreadsheet?: string;
    worksheets?: string[];
    worksheetFound?: boolean;
    headerRow?: string;
}

let lastDiagnosis: { at: number; result: ZohoDiagnosis } | null = null;

/**
 * Setup check, step by step: sign in to Zoho, open the spreadsheet, find the worksheet, read its
 * header row. Reports Zoho's own error messages, never any setting's value. Runs at most once
 * every 30 seconds (Zoho limits how often new access tokens can be created).
 */
export async function diagnose(): Promise<ZohoDiagnosis> {
    if (lastDiagnosis && Date.now() - lastDiagnosis.at < 30_000) return lastDiagnosis.result;
    const result: ZohoDiagnosis = { signIn: "not tried" };
    try {
        forgetToken(SHEET_CREDS());
        await accessToken();
        result.signIn = "ok";
    } catch (err) {
        result.signIn = `failed: ${(err as Error).message}`;
    }
    if (result.signIn === "ok") {
        try {
            const list = (await call({ method: "worksheet.list" })) as SheetResponse & { worksheet_names?: { worksheet_name: string }[] };
            if (list.status === "success") {
                result.spreadsheet = "ok";
                result.worksheets = (list.worksheet_names ?? []).map((w) => w.worksheet_name);
                result.worksheetFound = result.worksheets.includes(WORKSHEET);
            } else result.spreadsheet = `failed: ${list.error_code ?? ""} ${list.error_message ?? ""}`.trim();
        } catch (err) {
            result.spreadsheet = `failed: ${(err as Error).message}`;
        }
    }
    if (result.worksheetFound) {
        try {
            const out = await call({ method: "worksheet.records.fetch", criteria: `"Reference"="__setup_check__"` });
            result.headerRow =
                out.status === "success" ? "ok (a column called Reference exists)" : `failed: ${out.error_code ?? ""} ${out.error_message ?? ""}`.trim();
        } catch (err) {
            result.headerRow = `failed: ${(err as Error).message}`;
        }
    }
    lastDiagnosis = { at: Date.now(), result };
    return result;
}
