/** Human-readable message from spec envelope `data` or status. */
export function apiErrorMessage(
  status: number,
  data: unknown,
  fallback: string
): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return fallback || `Request failed (${status})`;
}
