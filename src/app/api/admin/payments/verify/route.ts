import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, getAdminSupabaseConfig, getAuthorizedSupabaseHeaders, logAdminAction } from "@/lib/adminAuth";
import { PaymentVerificationPayload } from "@/types/admin";
import { updateStoredRegistrationPayment, saveStoredNotification } from "@/lib/dataStore";


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

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification action. Must be 'approve' or 'reject'.",
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

    const nowIso = new Date().toISOString();
    const newPaymentStatus = action === "approve" ? "verified" : "rejected";

    const reviewNotes =
      action === "reject"
        ? `[Payment Rejected]: ${rejectionReason?.trim()}${notes ? ` | Notes: ${notes.trim()}` : ""}`
        : `[Payment Approved by ${session.user.email}]${notes ? ` | Notes: ${notes.trim()}` : ""}`;

    const updatePayload: Record<string, unknown> = {
      payment_status: newPaymentStatus,
      verified_at: nowIso,
      verified_by: session.user.id,
      admin_review_notes: reviewNotes,
      updated_at: nowIso,
    };

    const patchUrl = `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}`;

    // 1. Update local persistent store
    const localUpdated = updateStoredRegistrationPayment(
      registrationId,
      action,
      rejectionReason,
      notes,
      session.user.email
    );

    // 2. Update Supabase registrations table if possible
    let updatedRecord = localUpdated;
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

      if (patchRes.ok) {
        const updatedRows = await patchRes.json();
        if (Array.isArray(updatedRows) && updatedRows.length > 0) {
          updatedRecord = updatedRows[0];
        }
      }
    } catch {
      // Supabase table update fallback
    }

    // Record administrative audit trail
    await logAdminAction({
      action: action === "approve" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
      actor: session.user,
      targetType: "registration",
      targetId: registrationId,
      metadata: { action, rejectionReason, notes },
      token: session.token,
    });

    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title: action === "approve" ? "Payment Receipt Verified" : "Payment Receipt Rejected",
      message: `Payment for registration ${registrationId} was ${action === "approve" ? "verified & approved" : "rejected"}${rejectionReason ? `: ${rejectionReason}` : ""}.`,
      type: "payment",
      targetRole: "Admin",
      link: "/admin/payments",
      read: false,
      createdAt: nowIso,
      actorName: session.user.fullName || session.user.email,
    });

    return NextResponse.json({
      success: true,
      message: `Payment successfully ${action === "approve" ? "approved" : "rejected"}.`,
      registration: updatedRecord,
      action,
      payment_status: newPaymentStatus,
      verifiedAt: nowIso,
      verifiedBy: session.user.email,
    });
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
