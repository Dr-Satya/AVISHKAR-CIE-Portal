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
import { StudentVerificationPayload } from "@/types/admin";
import { getStoredRegistrationById, updateStoredRegistrationStudent, saveStoredNotification } from "@/lib/dataStore";


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

    // Role check: Only Admin can verify/approve student registrations (President, VP, Member, student are forbidden)
    if (session.user.role !== "Admin" && session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: `Access denied. Role '${session.user.role}' is not authorized to approve or reject student registrations. Admin role required.`,
          code: "ADMIN_REQUIRED_FOR_REGISTRATIONS",
        },
        { status: 403 }
      );
    }

    const body: StudentVerificationPayload = await req.json();
    const { registrationId, action, rejectionReason, notes, requirePaymentVerified } = body;

    if (!registrationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration ID is required.",
          code: "REGISTRATION_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "verify" && action !== "reject" && action !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification action. Must be 'approve', 'verify', 'reject', or 'pending'.",
          code: "INVALID_ACTION",
        },
        { status: 400 }
      );
    }

    if (action === "reject" && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "A rejection reason is strictly required when rejecting student registration.",
          code: "REJECTION_REASON_REQUIRED",
        },
        { status: 400 }
      );
    }

    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    // Look up existing registration to verify existence and payment status
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
        console.error("Error looking up registration in Supabase:", err);
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

    // MANDATORY PREREQUISITE: If action is "approve" (final registration approval), payment MUST already be verified
    if (action === "approve" || (requirePaymentVerified && action === "verify")) {
      if (currentRecord.payment_status !== "verified") {
        return NextResponse.json(
          {
            success: false,
            error: "Payment Verification Pending. Final registration approval requires a verified payment. Please verify the payment in the Payments module first.",
            code: "PAYMENT_NOT_VERIFIED",
            paymentStatus: currentRecord.payment_status || "pending_verification",
          },
          { status: 400 }
        );
      }
    }

    const nowIso = new Date().toISOString();
    const newStudentStatus = action === "approve" || action === "verify" ? "verified" : action === "pending" ? "pending" : "rejected";

    const studentNote =
      action === "reject"
        ? `[Student Rejected]: ${rejectionReason?.trim()}${notes ? ` | Notes: ${notes.trim()}` : ""}`
        : action === "approve" || action === "verify"
        ? `[Student Verified by ${session.user.email}]${notes ? ` | Notes: ${notes.trim()}` : ""}`
        : `[Student Verification Reset to Pending by ${session.user.email}]${notes ? ` | Notes: ${notes.trim()}` : ""}`;

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
    let patchErrText: string | undefined;

    if (config.isConfigured) {
      const safeStudentVerifiedBy = action === "pending" ? null : getSafeUuid(session.user.id);
      // Try updating student_verification_status column (from Migration 004)
      let patchRes = await fetch(patchUrl, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          student_verification_status: newStudentStatus,
          student_verified_at: action === "pending" ? null : nowIso,
          student_verified_by: safeStudentVerifiedBy,
          student_verification_notes: studentNote,
          updated_at: nowIso,
        }),
      });

      // If column student_verification_status does not exist yet, fallback to storing in admin_review_notes
      if (!patchRes.ok) {
        const errText = await patchRes.text();
        if (
          errText.includes("student_verification_status") ||
          errText.includes("student_verified") ||
          errText.includes("42703") ||
          errText.includes("PGRST204")
        ) {
          const fetchCurrentUrl = targetByUuid
            ? `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(targetByUuid)}&select=admin_review_notes`
            : `${config.url}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(targetRegNum)}&select=admin_review_notes`;

          const fetchCurrent = await fetch(fetchCurrentUrl, { headers });
          let existingNotes = "";
          if (fetchCurrent.ok) {
            const rows = await fetchCurrent.json();
            existingNotes = rows[0]?.admin_review_notes || "";
          }

          const cleanedNotes = existingNotes
            .replace(/\[STUDENT_STATUS:\s*(verified|rejected|pending)\]/g, "")
            .trim();

          const combinedNotes = `${cleanedNotes ? cleanedNotes + " | " : ""}[STUDENT_STATUS: ${newStudentStatus}] ${studentNote}`.trim();

          patchRes = await fetch(patchUrl, {
            method: "PATCH",
            headers: {
              ...headers,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              admin_review_notes: combinedNotes,
              updated_at: nowIso,
            }),
          });
          if (!patchRes.ok) {
            patchErrText = await patchRes.text();
          }
        } else {
          patchErrText = errText;
        }
      }

      if (patchRes.ok) {
        const updatedRows = await patchRes.json();
        if (Array.isArray(updatedRows) && updatedRows.length > 0) {
          updatedRecord = updatedRows[0];
          supabasePersisted = true;
        }
      }

      if (!supabasePersisted) {
        const rawErr = patchErrText || "Database update failed";
        const sanitized = sanitizeDatabaseError(rawErr, 502);
        console.error("Failed to persist student verification in Supabase:", sanitized);
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

    const normalizedAction: "approve" | "reject" | "pending" =
      action === "verify" ? "approve" : action;

    const localUpdated = updateStoredRegistrationStudent(
      targetDbId,
      normalizedAction,
      rejectionReason,
      notes,
      session.user.email
    );

    if (localUpdated && !supabasePersisted) {
      updatedRecord = localUpdated;
    }

    // Determine whether final registration is now approved (requires BOTH verified)
    const isBothVerified =
      (updatedRecord.payment_status === "verified") &&
      (newStudentStatus === "verified");

    // Record audit trail
    await logAdminAction({
      action: action === "approve" ? "STUDENT_VERIFIED" : action === "pending" ? "STUDENT_RESET_PENDING" : "STUDENT_REJECTED",
      actor: session.user,
      targetType: "registration",
      targetId: registrationId,
      metadata: { action, rejectionReason, notes, studentName: currentRecord.student_name, studentId: currentRecord.student_id, isBothVerified },
      token: session.token,
    });

    // Save notification
    try {
      saveStoredNotification({
        id: `notif-reg-${Date.now()}`,
        targetRole: "Admin",
        targetEmail: session.user.email,
        title:
          action === "approve"
            ? isBothVerified
              ? "Registration Fully Approved"
              : "Student Identity Verified (Payment Pending)"
            : action === "pending"
            ? "Student Verification Reset"
            : "Student Registration Rejected",
        message:
          action === "approve"
            ? isBothVerified
              ? `Registration for ${currentRecord.student_name} (${currentRecord.student_id}) is now fully approved (payment & identity verified).`
              : `Student identity for ${currentRecord.student_name} was verified. Final registration approval requires payment verification.`
            : action === "pending"
            ? `Student verification for ${currentRecord.student_name} was reset to pending.`
            : `Registration for ${currentRecord.student_name} (${currentRecord.student_id}) was rejected: ${rejectionReason}`,
        type: action === "approve" ? "approval" : "rejection",
        read: false,
        createdAt: nowIso,
        actorName: session.user.fullName || session.user.email,
      });
    } catch {
      // Non-blocking notification
    }

    return NextResponse.json(
      {
        success: true,
        message:
          action === "approve"
            ? isBothVerified
              ? "Student identity verified and registration fully approved!"
              : "Student identity verified. Final registration approval requires payment verification."
            : action === "pending"
            ? "Student verification reset to pending."
            : "Student registration rejected.",
        registration: updatedRecord,
        action,
        student_verification_status: newStudentStatus,
        isRegistrationApproved: isBothVerified,
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
    console.error("Student verification API error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error updating student verification.",
      },
      { status: 500 }
    );
  }
}
