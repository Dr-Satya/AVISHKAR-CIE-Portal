import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { AdminRole, AdminUser, UserRole } from "@/types/admin";
import { ADMIN_SESSION_COOKIE_NAME } from "@/config/admin";
import { authenticateLocalCouncil, readDataStore, saveStoredAuditLog } from "./dataStore";

export const ALLOWED_ADMIN_ROLES = ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"] as const;

export { isValidUuid, getSafeUuid, sanitizeDatabaseError } from "./supabaseDbUtils";

interface SupabaseAuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id: string;
    email?: string;
    role?: string;
    app_metadata?: {
      provider?: string;
      providers?: string[];
      role?: string;
      [key: string]: unknown;
    };
    user_metadata?: Record<string, unknown>;
    last_sign_in_at?: string;
  };
  error?: string;
  error_description?: string;
  msg?: string;
  code?: number;
}

export interface AdminSession {
  user: AdminUser;
  token: string;
  refreshToken?: string;
}

/**
 * Validates whether Supabase environment variables are present.
 */
export function getAdminSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured: Boolean(url && anonKey),
  };
}

/**
 * Normalizes app_metadata role into standard AdminRole
 */
export function normalizeAdminRole(rawRole?: string): AdminRole | "admin" | null {
  if (!rawRole) return null;
  const lower = rawRole.toLowerCase().trim();
  if (lower === "president") return "President";
  if (lower === "vice president" || lower === "vp" || lower === "vice-president") return "Vice President";
  if (lower === "admin") return "Admin";
  if (lower === "avishkar member" || lower === "member") return "AVISHKAR Member";
  if (lower === "student") return null; // Students are explicitly denied admin access
  return null;
}

/**
 * Authenticates an administrator against Supabase Auth or verified council roster.
 * Enforces role verification on the server. Fails closed if role is unauthorized or missing.
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<
  | { success: true; session: AdminSession }
  | { success: false; error: string; code: string; setupGuidance?: string }
> {
  const config = getAdminSupabaseConfig();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Attempt Supabase Auth first if configured
  if (config.isConfigured) {
    const authUrl = `${config.url}/auth/v1/token?grant_type=password`;

    try {
      const authRes = await fetch(authUrl, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data: SupabaseAuthResponse = await authRes.json();

      if (authRes.ok && data.access_token && data.user) {
        // STRICT ROLE VERIFICATION: Ordinary students or users without explicit roles are denied
        const appRole = data.user.app_metadata?.role;
        const normalizedRole = normalizeAdminRole(appRole);

        if (!normalizedRole) {
          return {
            success: false,
            code: "INSUFFICIENT_PERMISSIONS",
            error: `Account ${cleanEmail} is authenticated but does not possess an authorized administrative role (President, Admin, or AVISHKAR Member).`,
            setupGuidance: `To grant administrative access, run this SQL in your Supabase SQL Editor:\n\nUPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "Admin"}'::jsonb WHERE email = '${cleanEmail}';`,
          };
        }

        const session: AdminSession = {
          user: {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            role: normalizedRole,
            lastSignInAt: data.user.last_sign_in_at,
            fullName:
              (data.user.user_metadata?.full_name as string) ||
              cleanEmail.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          },
          token: data.access_token,
          refreshToken: data.refresh_token,
        };

        return {
          success: true,
          session,
        };
      }
    } catch {
      // Fall through to council authentication check
    }
  }

  // 2. Check provisioned council credentials
  const localAuth = authenticateLocalCouncil(cleanEmail, password);
  if (localAuth.authenticated && localAuth.user) {
    const token = `council_token_${encodeURIComponent(localAuth.user.role)}_${encodeURIComponent(localAuth.user.email)}_${Date.now()}`;
    const session: AdminSession = {
      user: {
        id: `usr_${localAuth.user.role.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        email: localAuth.user.email,
        role: localAuth.user.role,
        fullName: localAuth.user.fullName,
        lastSignInAt: new Date().toISOString(),
      },
      token,
    };

    return {
      success: true,
      session,
    };
  }

  // Explicit failure if not found in either provider
  return {
    success: false,
    code: "INVALID_CREDENTIALS",
    error: "Invalid email or password. Please verify your administrative credentials.",
  };
}

/**
 * Verifies an admin session by validating the token against council directory or Supabase JWT.
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  if (!token) return null;

  // 1. Council Token Verification
  if (token.startsWith("council_token_")) {
    const parts = token.split("_");
    const emailPart = decodeURIComponent(parts[3] || "");
    const store = readDataStore();
    const cred = store.councilCredentials.find((c) => c.email.toLowerCase() === emailPart.toLowerCase());
    if (cred) {
      return {
        id: `usr_${cred.role.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        email: cred.email,
        role: cred.role,
        fullName: cred.fullName,
        lastSignInAt: new Date().toISOString(),
      };
    }
    return null;
  }

  // 2. Supabase JWT Verification
  const config = getAdminSupabaseConfig();
  if (!config.isConfigured) return null;

  try {
    const userUrl = `${config.url}/auth/v1/user`;
    const res = await fetch(userUrl, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const user: SupabaseAuthResponse["user"] = await res.json();
    if (!user) return null;

    const role = normalizeAdminRole(user.app_metadata?.role);
    if (!role) return null;

    return {
      id: user.id,
      email: user.email || "",
      role: role,
      lastSignInAt: user.last_sign_in_at,
      fullName:
        (user.user_metadata?.full_name as string) ||
        user.email?.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the admin session from incoming NextRequest or Cookies.
 */
export async function getAdminSessionFromRequest(
  req?: NextRequest
): Promise<AdminSession | null> {
  let token = "";

  if (req) {
    // 1. Check Bearer Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fall back to Cookie
    if (!token) {
      const cookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME);
      if (cookie?.value) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.value));
          token = parsed.token || "";
        } catch {
          token = cookie.value;
        }
      }
    }
  } else {
    // Next.js Server Components / Actions: use cookies()
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME);
      if (cookie?.value) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.value));
          token = parsed.token || "";
        } catch {
          token = cookie.value;
        }
      }
    } catch {
      // In non-request contexts
    }
  }

  if (!token) return null;

  const admin = await verifyAdminToken(token);
  if (!admin) return null;

  return {
    user: admin,
    token,
  };
}

/**
 * Helper to enforce allowed roles for a request on the server side.
 */
export async function authorizeAdminRequest(
  req: NextRequest,
  allowedRoles?: (UserRole | "admin")[]
): Promise<
  | { authorized: true; session: AdminSession }
  | { authorized: false; status: number; error: string; code: string }
> {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please sign in to the administrative portal.",
      code: "UNAUTHORIZED",
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session.user.role;
    const isAllowed = allowedRoles.some((r) => {
      if (r === "admin" && (userRole === "Admin" || userRole === "admin")) return true;
      return r === userRole;
    });

    if (!isAllowed) {
      return {
        authorized: false,
        status: 403,
        error: `Access denied. Role '${userRole}' is not permitted to perform this action.`,
        code: "FORBIDDEN",
      };
    }
  }

  return { authorized: true, session };
}

/**
 * Builds authorized headers for Supabase REST and Storage requests.
 */
export function getAuthorizedSupabaseHeaders(sessionToken?: string): Record<string, string> {
  const config = getAdminSupabaseConfig();

  // If service role key is configured, prefer it for administrative server-side operations
  if (config.serviceRoleKey) {
    return {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    };
  }

  // Check if sessionToken is a valid 3-part Supabase JWT (header.payload.signature)
  const isJwt = Boolean(sessionToken && sessionToken.split(".").length === 3);
  const bearerKey = isJwt ? sessionToken! : config.anonKey;

  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${bearerKey}`,
  };
}

/**
 * Records an audit log entry for administrative activity.
 */
export async function logAdminAction(params: {
  action: string;
  actor: AdminUser;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  token?: string;
}): Promise<void> {
  // Always persist to local store
  try {
    saveStoredAuditLog({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: params.action,
      actorId: params.actor.id,
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error saving audit log to store:", err);
  }

  const config = getAdminSupabaseConfig();
  if (!config.isConfigured) return;

  try {
    const headers = getAuthorizedSupabaseHeaders(params.token || "");
    await fetch(`${config.url}/rest/v1/admin_audit_logs`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        action: params.action,
        actor_id: getSafeUuid(params.actor.id),
        actor_email: params.actor.email,
        actor_role: params.actor.role,
        target_type: params.targetType,
        target_id: params.targetId,
        metadata: params.metadata || {},
      }),
    });
  } catch {
    // Non-blocking for audit logging
  }
}
