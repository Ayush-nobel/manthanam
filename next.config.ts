import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy — the "without nonces" variant from the Next.js CSP guide.
 * A nonce-based policy would force every page to render per request (no CDN caching, slower
 * first paint). This site shows no user-generated content, so this policy plus React's output
 * escaping is the right trade-off: scripts, styles, fonts and connections may only come from
 * this site (plus Formspree for the contact form), and the site cannot be framed.
 */
const csp = [
  "default-src 'self'",
  // Next.js inlines its page data as scripts; 'unsafe-eval' only for local development.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' http://localhost:8400" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // The contact form posts to Formspree; dev adds the Impeccable live-mode helper.
  `connect-src 'self' https://formspree.io${isDev ? " http://localhost:8400 ws://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS only, for two years, including any subdomains of www.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy equivalent of frame-ancestors 'none' (clickjacking protection).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site needs none of these browser features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/**
 * Zoho Sheet settings for the registration gateway, baked in at build time. AWS Amplify only
 * exposes environment variables to the build, not to the running server, so without this the
 * live site can't see them. They are only referenced from lib/zoho-sheet.ts (server-only), so
 * they end up in the server bundle, never in the browser's JavaScript.
 */
const ZOHO_KEYS = ["ZOHO_DC", "ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN", "ZOHO_SHEET_RESOURCE_ID", "ZOHO_SHEET_WORKSHEET"];
const buildEnv = Object.fromEntries(ZOHO_KEYS.flatMap((k) => (process.env[k] ? [[k, process.env[k]!]] : [])));

const nextConfig: NextConfig = {
  env: buildEnv,
  cacheComponents: true,
  partialPrefetching: true,
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
