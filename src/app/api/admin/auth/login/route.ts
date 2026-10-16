import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, normalizeAdminRole } from "@/lib/adminAuth";
import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/config/admin";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, expectedRole, portalRole, requiredRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required.",
          code: "MISSING_CREDENTIALS",
        },
        { status: 400 }
      );
    }

    const authResult = await authenticateAdmin(email, password);

    if (!authResult.success) {
      const statusCode =
        authResult.code === "INSUFFICIENT_PERMISSIONS"
          ? 403
          : authResult.code === "SUPABASE_NOT_CONFIGURED"
          ? 503
          : 401;

      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          code: authResult.code,
          setupGuidance: authResult.setupGuidance,
        },
        { status: statusCode }
      );
    }

    // Server-side strict role verification if a specific role portal login was requested
    const targetRole = expectedRole || portalRole || requiredRole;
    if (targetRole) {
      const normalizedTarget = normalizeAdminRole(targetRole);
      const userRole = authResult.session.user.role;

      const isMatch =
        normalizedTarget === userRole ||
        (normalizedTarget === "Admin" && (userRole === "Admin" || userRole === "admin"));

      if (!isMatch) {
        return NextResponse.json(
          {
            success: false,
            error: `Access denied. This login portal is restricted to ${targetRole} accounts only. Your account is registered as '${userRole}'.`,
            code: "ROLE_MISMATCH",
          },
          { status: 403 }
        );
      }
    }

    // Set secure, httpOnly session cookie
    const response = NextResponse.json({
      success: true,
      user: authResult.session.user,
      message: "Admin authentication successful.",
    });

    const cookiePayload = JSON.stringify({
      token: authResult.session.token,
      email: authResult.session.user.email,
      id: authResult.session.user.id,
      role: authResult.session.user.role,
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE_NAME,
      value: encodeURIComponent(cookiePayload),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Admin login API error:", errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during authentication.",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
