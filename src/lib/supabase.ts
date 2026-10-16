/**
 * Supabase Configuration & Status Utility
 *
 * Security Rules:
 * 1. NEVER expose SUPABASE_SERVICE_ROLE_KEY in NEXT_PUBLIC_* variables.
 * 2. Do not assume credentials exist without verification.
 * 3. Gracefully handle unconfigured environments without crashing or fabricating DB persistence.
 */

function isPlaceholderOrEmpty(val: string | undefined): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  return (
    trimmed === "" ||
    trimmed.startsWith("your-") ||
    trimmed.includes("placeholder") ||
    trimmed === "undefined" ||
    trimmed === "null"
  );
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasUrl = Boolean(url && !isPlaceholderOrEmpty(url));
  const hasAnonKey = Boolean(anonKey && !isPlaceholderOrEmpty(anonKey));
  const hasServiceRoleKey = Boolean(serviceRoleKey && !isPlaceholderOrEmpty(serviceRoleKey));

  return {
    isConfigured: hasUrl && (hasAnonKey || hasServiceRoleKey),
    hasUrl,
    hasAnonKey,
    hasServiceRoleKey,
  };
}

export const supabaseConfig = {
  get isConfigured() {
    return getSupabaseConfigStatus().isConfigured;
  },
};

/**
 * Safe public configuration for client-side usage.
 * NEVER returns or references secret keys.
 */
export function getSupabasePublicConfig() {
  const status = getSupabaseConfigStatus();
  return {
    url: status.hasUrl ? (process.env.NEXT_PUBLIC_SUPABASE_URL || "") : "",
    anonKey: status.hasAnonKey
      ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
         process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
         "")
      : "",
    isConfigured: status.hasUrl && status.hasAnonKey,
  };
}
