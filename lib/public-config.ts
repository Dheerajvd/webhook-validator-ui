/**
 * Build-time public config (NEXT_PUBLIC_*).
 * This UI expects a separate Webhook Validator service implementing specs.md.
 * Set NEXT_PUBLIC_BACKEND_URL to that API origin (Netlify: Site → Environment variables).
 * Empty base = same-origin relative URLs (only if the app is served behind the same host as the API).
 */

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ?? "";
  return raw.replace(/\/+$/, "");
}

/** When false, do not open Socket.IO; use GET /webhook (Refresh) instead. */
export function isSocketsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IS_SOCKETS_ENABLED !== "false";
}

/** Absolute or same-origin path for fetch/socket base. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  if (!base) return p;
  return `${base}${p}`;
}
