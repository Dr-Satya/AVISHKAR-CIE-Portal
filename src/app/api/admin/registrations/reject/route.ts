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
import {
  getStoredRegistrationById,
  rejectStoredRegistration,
  saveStoredNotification,
} from "@/lib/dataStore";
import { RegistrationRecord } from "@/types/admin";
import { sendRegistrationRejectedEmail } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Server-Side Admin Authentication Check
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

    if (session.user.role !== "Admin" && session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: `Access denied. Role '${session.user.role}' is not authorized to reject student registrations. Admin role required.`,
          code: "ADMIN_ROLE_REQUIRED",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { registrationId, rejectionReason, notes } = body;

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

    // 2. Mandatory Rejection Reason Requirement
    if (!rejectionReason || typeof rejectionReason !== "string" || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A rejection reason is strictly required when rejecting a student registration.",
          code: "REJECTION_REASON_REQUIRED",
        },
        { status: 400 }
      );
    }

    const trimmedReason = rejectionReason.trim();

    // 3. Locate registration record
    let currentRecord: RegistrationRecord | null = getStoredRegistrationById(registrationId);
    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    if (config.isConfigured) {
      try {
        let queryUrl = "";
        if (isValidUuid(registrationId)) {
          queryUrl = `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}&select=*`;
        } else if (currentRecord?.registration_number) {
          queryUrl = `${config.url}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(currentRecord.registration_number)}&select=*`;
        } else {
          queryUrl = `${config.url}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(registrationId)}&select=*`;
        }

        const fetchRes = await fetch(queryUrl, { headers });
        if (fetchRes.ok) {
          const rows = await fetchRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            currentRecord = { ...currentRecord, ...rows[0] } as RegistrationRecord;
          }
        }
      } catch (err) {
        console.warn("Could not look up registration in Supabase:", err);
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

    // 4. Determine if rejection is strictly about payment vs student identity
    // Rejecting student identity does NOT automatically reject payment.
    const isPaymentReason =
      trimmedReason.toLowerCase().includes("payment") ||
      trimmedReason.toLowerCase().includes("receipt") ||
      trimmedReason.toLowerCase().includes("utr") ||
      trimmedReason.toLowerCase().includes("fee") ||
      body.rejectPaymentToo === true;

    const newPaymentStatus = isPaymentReason
      ? "rejected"
      : currentRecord.payment_status || "pending_verification";

    // 5. Update Supabase table if configured, ensuring no false success on DB failure
    const nowIso = new Date().toISOString();
    const safeVerifiedByUuid = getSafeUuid(session.user.id);
    const combinedNotes = `[STUDENT_STATUS: rejected]\n[PAYMENT_STATUS: ${newPaymentStatus}]\n[REJECTION_REASON: ${trimmedReason}]\n[REJECTED_BY: ${session.user.email} (${session.user.role})]\n[REJECTED_AT: ${nowIso}]${
      notes ? `\n[NOTES: ${notes.trim()}]` : ""
    }`;

    if (config.isConfigured) {
      // Determine safe target identifier: prefer UUID id if valid, else unique registration_number
      const targetByUuid = isValidUuid(currentRecord?.id)
        ? currentRecord.id
        : isValidUuid(registrationId)
        ? registrationId
        : null;

      const regNumber = currentRecord?.registration_number || registrationId;
      const patchUrl = targetByUuid
        ? `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(targetByUuid)}`
        : `${config.url}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(regNumber)}`;

      const patchPayload: Record<string, unknown> = {
        student_verification_status: "rejected",
        student_verified_at: nowIso,
        student_verified_by: safeVerifiedByUuid,
        student_verification_notes: `[Student Rejected]: ${trimmedReason}`,
        admin_review_notes: combinedNotes,
        updated_at: nowIso,
      };

      if (isPaymentReason) {
        patchPayload.payment_status = "rejected";
        patchPayload.verified_at = nowIso;
        patchPayload.verified_by = safeVerifiedByUuid;
      }

      try {
        let errDetailText: string | undefined;
        let patchRes = await fetch(patchUrl, {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(patchPayload),
        });

        if (!patchRes.ok) {
          const firstErrText = await patchRes.text();
          // If student_verification_status column does not exist yet, fallback to legacy schema
          if (
            firstErrText.includes("student_verification_status") ||
            firstErrText.includes("student_verified") ||
            firstErrText.includes("42703") ||
            firstErrText.includes("PGRST204")
          ) {
            const legacyPayload: Record<string, unknown> = {
              admin_review_notes: combinedNotes,
              updated_at: nowIso,
            };
            if (isPaymentReason) {
              legacyPayload.payment_status = "rejected";
              legacyPayload.verified_at = nowIso;
              legacyPayload.verified_by = safeVerifiedByUuid;
            }

            patchRes = await fetch(patchUrl, {
              method: "PATCH",
              headers: {
                ...headers,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify(legacyPayload),
            });
            if (!patchRes.ok) {
              errDetailText = await patchRes.text();
            }
          } else {
            errDetailText = firstErrText;
          }
        }

        if (!patchRes.ok) {
          const rawErr = errDetailText || (await patchRes.text());
          const sanitized = sanitizeDatabaseError(rawErr, patchRes.status);
          console.error("Supabase rejection update failed:", patchRes.status, sanitized);
          return NextResponse.json(
            {
              success: false,
              error: `Database update failed (${patchRes.status}): ${sanitized}`,
              code: "DATABASE_UPDATE_FAILED",
              detail: sanitized,
            },
            { status: 502 }
          );
        }
      } catch (patchErr: any) {
        const errorMsg = patchErr instanceof Error ? patchErr.message : "Failed to reach Supabase database.";
        console.error("Supabase connection error during rejection:", errorMsg);
        return NextResponse.json(
          {
            success: false,
            error: `Database connection error: ${errorMsg}`,
            code: "DATABASE_CONNECTION_ERROR",
          },
          { status: 502 }
        );
      }
    }

    // 6. Atomically Reject in DataStore only after successful DB persistence (or if Supabase is unconfigured)
    const updatedRecord = rejectStoredRegistration({
      registrationId: currentRecord.id || registrationId,
      rejectionReason: trimmedReason,
      actorEmail: session.user.email,
      notes: notes?.trim() || undefined,
      rejectPaymentToo: isPaymentReason,
    });

    // 7. Audit Log
    logAdminAction({
      action: "REGISTRATION_DUAL_REJECTED",
      actor: session.user,
      targetType: "registration",
      targetId: registrationId,
      metadata: {
        registrationNumber: currentRecord.registration_number,
        studentName: currentRecord.student_name,
        studentId: currentRecord.student_id,
        rejectionReason: trimmedReason,
        paymentRejected: isPaymentReason,
        notes: notes || undefined,
      },
    });

    // 8. Notification
    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title: "Registration Rejected",
      message: `Registration ${currentRecord.registration_number} for ${currentRecord.student_name} (${currentRecord.student_id}) was rejected by ${session.user.email}. Reason: ${trimmedReason}`,
      type: "payment",
      targetRole: "Admin",
      link: "/admin/registrations",
      read: false,
      createdAt: nowIso,
      actorName: session.user.fullName || session.user.email,
    });

    // 9. Automated Student Email Notification (Decoupled & Non-blocking)
    let emailStatusInfo: { status: "sent" | "simulated" | "failed" | "skipped"; recipient?: string } | undefined;
    try {
      const emailResult = await sendRegistrationRejectedEmail(
        {
          registrationId: currentRecord.id || registrationId,
          registrationNumber: currentRecord.registration_number,
          recipientEmail: currentRecord.email,
          recipientName: currentRecord.student_name,
          studentId: currentRecord.student_id,
          admissionNumber: currentRecord.admission_number || null,
          school: currentRecord.school,
          program: currentRecord.program,
          transactionId: currentRecord.transaction_id,
        },
        trimmedReason
      );
      emailStatusInfo = {
        status: emailResult.status || (emailResult.simulated ? "simulated" : emailResult.success ? "sent" : "failed"),
        recipient: currentRecord.email,
      };
    } catch (emailErr) {
      console.warn("[Reject Route] Non-blocking email dispatch error:", emailErr);
      emailStatusInfo = {
        status: "failed",
        recipient: currentRecord.email,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Student registration marked as rejected.",
      emailNotification: emailStatusInfo,
      registration: updatedRecord || {
        ...currentRecord,
        student_verification_status: "rejected",
        payment_status: newPaymentStatus,
        student_verification_notes: `[Student Rejected]: ${trimmedReason}`,
        admin_review_notes: combinedNotes,
        verified_at: nowIso,
        verified_by: safeVerifiedByUuid,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Reject registration error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error processing registration rejection.",
      },
      { status: 500 }
    );
  }
}
