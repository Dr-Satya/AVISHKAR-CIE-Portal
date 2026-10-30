// src/lib/supabaseDbUtils.ts
// Database validation and error sanitization utilities for PostgreSQL / Supabase PostgREST

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given value is a valid PostgreSQL / RFC-4122 UUID.
 */
export function isValidUuid(val: unknown): val is string {
  if (typeof val !== "string") return false;
  return UUID_REGEX.test(val.trim());
}

/**
 * Returns a trimmed UUID if valid, or null if the value is not a valid UUID (e.g. 'usr_admin', email, reg-*, etc.).
 * Prevents PostgreSQL error 22P02: invalid input syntax for type uuid.
 */
export function getSafeUuid(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

/**
 * Extracts and sanitizes database error diagnostics from PostgREST / Supabase.
 * Strips secrets, access tokens, and sensitive student personal information.
 */
export function sanitizeDatabaseError(rawDetail: unknown, status: number): string {
  if (!rawDetail) return `Database error (HTTP ${status}).`;
  let parsed: any = null;
  if (typeof rawDetail === "string") {
    try {
      parsed = JSON.parse(rawDetail);
    } catch {
      // not JSON
    }
  } else if (typeof rawDetail === "object" && rawDetail !== null) {
    parsed = rawDetail;
  }

  const code = (parsed?.code || "").toString();
  let message = (parsed?.message || (typeof rawDetail === "string" ? rawDetail : "")).toString();

  // Strip potential PII, tokens, and keys
  message = message.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[REDACTED_EMAIL]");
  message = message.replace(/bearer\s+[a-zA-Z0-9_.-]+/gi, "Bearer [REDACTED_TOKEN]");
  message = message.replace(/key\s*=\s*[a-zA-Z0-9_.-]+/gi, "key=[REDACTED]");
  message = message.replace(/(password|secret|apikey)\s*[:=]\s*[^\s,]+/gi, "$1=[REDACTED]");

  if (code === "22P02" || message.includes("invalid input syntax for type uuid")) {
    return `Invalid UUID format (22P02): Ensure identifier meets database UUID requirements.`;
  }
  if (code === "42703" || message.includes("does not exist")) {
    const colMatch = message.match(/column\s+"?([a-zA-Z0-9_]+)"?/i);
    const colName = colMatch ? colMatch[1] : "unknown";
    return `Schema mismatch (42703): Column '${colName}' does not exist on table.`;
  }
  if (code === "23505" || message.includes("duplicate key") || message.includes("unique")) {
    return `Unique constraint violation (23505): Duplicate record detected.`;
  }
  if (code === "23503" || message.includes("foreign key")) {
    return `Foreign key violation (23503): Referenced record does not exist.`;
  }
  if (code === "42501" || status === 403) {
    return `Permission denied (42501): RLS or role permission check failed.`;
  }

  const cleanSnippet = message.slice(0, 150).trim();
  return cleanSnippet ? `Database error (${status}${code ? ` - ${code}` : ""}): ${cleanSnippet}` : `Database error (${status}).`;
}
