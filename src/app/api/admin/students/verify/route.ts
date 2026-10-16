import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, getAdminSupabaseConfig, getAuthorizedSupabaseHeaders, logAdminAction } from "@/lib/adminAuth";
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
    const { registrationId, action, rejectionReason, notes } = body;

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

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification action. Must be 'approve' or 'reject'.",
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
    let currentRecord = getStoredRegistrationById(registrationId);
    if (!currentRecord && config.isConfigured) {
      try {
        const fetchRes = await fetch(
          `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}&select=*`,
          { headers }
        );
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
      return NextResponse.json(
        {
          success: false,
          error: "Registration record not found.",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // MANDATORY PREREQUISITE: If approving, payment MUST already be verified
    if (action === "approve") {
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
    const newStudentStatus = action === "approve" ? "verified" : "rejected";

    const studentNote =
      action === "reject"
        ? `[Student Rejected]: ${rejectionReason?.trim()}${notes ? ` | Notes: ${notes.trim()}` : ""}`
        : `[Student Verified by ${session.user.email}]${notes ? ` | Notes: ${notes.trim()}` : ""}`;

    const patchUrl = `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}`;

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
        student_verified_at: nowIso,
        student_verified_by: session.user.id,
        student_verification_notes: studentNote,
        updated_at: nowIso,
      }),
    });

    // If column student_verification_status does not exist yet, fallback to storing in admin_review_notes
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      if (errText.includes("student_verification_status") || errText.includes("42703")) {
        const fetchCurrent = await fetch(
          `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}&select=admin_review_notes`,
          { headers }
        );
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
      }
    }

    const localUpdated = updateStoredRegistrationStudent(
      registrationId,
      action,
      rejectionReason,
      notes,
      session.user.email
    );

    let updatedRecord = localUpdated;
    if (patchRes.ok) {
      const updatedRows = await patchRes.json();
      if (Array.isArray(updatedRows) && updatedRows.length > 0) {
        updatedRecord = updatedRows[0];
      }
    }

    // Record audit trail
    await logAdminAction({
      action: action === "approve" ? "STUDENT_VERIFIED" : "STUDENT_REJECTED",
      actor: session.user,
      targetType: "registration",
      targetId: registrationId,
      metadata: { action, rejectionReason, notes, studentName: currentRecord.student_name, studentId: currentRecord.student_id },
      token: session.token,
    });

    // Save notification
    try {
      saveStoredNotification({
        id: `notif-reg-${Date.now()}`,
        targetRole: "Admin",
        targetEmail: session.user.email,
        title: action === "approve" ? "Student Registration Approved" : "Student Registration Rejected",
        message:
          action === "approve"
            ? `Registration for ${currentRecord.student_name} (${currentRecord.student_id}) has been approved.`
            : `Registration for ${currentRecord.student_name} (${currentRecord.student_id}) was rejected: ${rejectionReason}`,
        type: action === "approve" ? "approval" : "rejection",
        read: false,
        createdAt: nowIso,
        actorName: session.user.fullName || session.user.email,
      });
    } catch {
      // Non-blocking notification
    }

    return NextResponse.json({
      success: true,
      message: `Student verification successfully ${action === "approve" ? "approved" : "rejected"}.`,
      registration: updatedRecord,
      action,
      verifiedAt: nowIso,
      verifiedBy: session.user.email,
    });
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
