import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequest,
  getAdminSupabaseConfig,
  getAuthorizedSupabaseHeaders,
  logAdminAction,
  isValidUuid,
  getSafeUuid,
  sanitizeDatabaseError,
} from "@/lib/adminAuth";
import { PaymentVerificationPayload } from "@/types/admin";
import { updateStoredRegistrationPayment, saveStoredNotification, getStoredRegistrationById } from "@/lib/dataStore";


export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Admin session required.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // Role check: Only Admin can verify payments (President, VP, Member are forbidden)
    if (session.user.role !== "Admin" && session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: `Access denied. Role '${session.user.role}' is not authorized to perform payment verification. Admin role required.`,
          code: "ADMIN_REQUIRED_FOR_PAYMENTS",
        },
        { status: 403 }
      );
    }

    const body: PaymentVerificationPayload = await req.json();
    const { registrationId, action, rejectionReason, notes } = body;

    if (!registrationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration ID is required.",
        },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "verify" && action !== "reject" && action !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification action. Must be 'approve', 'verify', 'reject', or 'pending'.",
        },
        { status: 400 }
      );
    }

    // MANDATORY REQUIREMENT: Rejection reason is strictly required when rejecting payment
    if (action === "reject" && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "A rejection reason is strictly required when rejecting a payment.",
          code: "REJECTION_REASON_REQUIRED",
        },
        { status: 400 }
      );
    }

    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    // Look up existing registration to verify existence
    let currentRecord: any = null;
    if (config.isConfigured) {
      try {
        const queryUrl = isValidUuid(registrationId)
          ? `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}&select=*`
          : `${config.url}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(registrationId)}&select=*`;

        const fetchRes = await fetch(queryUrl, { headers });
        if (fetchRes.ok) {
          const rows = await fetchRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            currentRecord = rows[0];
          }
        }
      } catch (err) {
        console.error("Error looking up registration in Supabase for payment verification:", err);
      }
    }

    if (!currentRecord) {
      currentRecord = getStoredRegistrationById(registrationId);
    }

    if (!currentRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration record not found.",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const normalizedAction: "approve" | "verify" | "reject" | "pending" = action;
    const newPaymentStatus =
      action === "approve" || action === "verify"
        ? "verified"
        : action === "pending"
        ? "pending_verification"
        : "rejected";

    const reviewNotes =
      action === "reject"
        ? `[Payment Rejected]: ${rejectionReason?.trim()}${notes ? ` | Notes: ${notes.trim()}` : ""}`
        : action === "approve" || action === "verify"
        ? `[Payment Approved by ${session.user.email}]${notes ? ` | Notes: ${notes.trim()}` : ""}`
        : `[Payment Status Reset to Pending by ${session.user.email}]${notes ? ` | Notes: ${notes.trim()}` : ""}`;

    const safeVerifiedByUuid = action === "pending" ? null : getSafeUuid(session.user.id);
    const updatePayload: Record<string, unknown> = {
      payment_status: newPaymentStatus,
      verified_at: action === "pending" ? null : nowIso,
      verified_by: safeVerifiedByUuid,
      admin_review_notes: reviewNotes,
      updated_at: nowIso,
    };

    const targetByUuid = isValidUuid(currentRecord?.id)
      ? currentRecord.id
      : isValidUuid(registrationId)
      ? registrationId
      : null;
    const targetRegNum = currentRecord?.registration_number || registrationId;
    const patchUrl = targetByUuid
      ? `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(targetByUuid)}`
      : `${config.url}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(targetRegNum)}`;

    let supabasePersisted = false;
    let updatedRecord = currentRecord;

    // 1. Update Supabase registrations table if configured
    if (config.isConfigured) {
      try {
        const patchRes = await fetch(patchUrl, {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(updatePayload),
        });

        let patchErrText: string | undefined;
        if (patchRes.ok) {
          const updatedRows = await patchRes.json();
          if (Array.isArray(updatedRows) && updatedRows.length > 0) {
            updatedRecord = updatedRows[0];
            supabasePersisted = true;
          }
        } else {
          patchErrText = await patchRes.text();
        }
      } catch (patchErr) {
        console.error("Supabase payment update error:", patchErr);
      }

      if (!supabasePersisted) {
        const sanitized = sanitizeDatabaseError(patchErrText, 502);
        console.error("Failed to persist payment verification in Supabase:", sanitized);
        return NextResponse.json(
          {
            success: false,
            error: `Database update failed: ${sanitized}`,
            code: "DATABASE_UPDATE_FAILED",
            detail: sanitized,
          },
          { status: 502 }
        );
      }
    }

    // 2. Update local persistent store
    const localUpdated = updateStoredRegistrationPayment(
      targetDbId,
      normalizedAction,
      rejectionReason,
      notes,
      session.user.email
    );

    if (localUpdated && !supabasePersisted) {
      updatedRecord = localUpdated;
    }

    // Record administrative audit trail
    await logAdminAction({
      action:
        action === "approve" || action === "verify"
          ? "PAYMENT_VERIFIED"
          : action === "pending"
          ? "PAYMENT_RESET_PENDING"
          : "PAYMENT_REJECTED",
      actor: session.user,
      targetType: "registration",
      targetId: targetDbId,
      metadata: { action, rejectionReason, notes },
      token: session.token,
    });

    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title:
        action === "approve" || action === "verify"
          ? "Payment Receipt Verified"
          : action === "pending"
          ? "Payment Status Reset"
          : "Payment Receipt Rejected",
      message: `Payment for registration ${currentRecord.student_name || targetDbId} was ${
        action === "approve" || action === "verify"
          ? "verified & approved"
          : action === "pending"
          ? "reset to pending verification"
          : "rejected"
      }${rejectionReason ? `: ${rejectionReason}` : ""}.`,
      type: "payment",
      targetRole: "Admin",
      link: "/admin/payments",
      read: false,
      createdAt: nowIso,
      actorName: session.user.fullName || session.user.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Payment successfully ${
          action === "approve" || action === "verify"
            ? "approved"
            : action === "pending"
            ? "reset to pending verification"
            : "rejected"
        }.`,
        registration: updatedRecord,
        action,
        payment_status: newPaymentStatus,
        verifiedAt: action === "pending" ? null : nowIso,
        verifiedBy: action === "pending" ? null : session.user.email,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Payment verification API error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error updating payment verification.",
      },
      { status: 500 }
    );
  }
}
