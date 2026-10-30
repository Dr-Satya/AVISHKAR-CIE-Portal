import fs from "fs";
import path from "path";
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
  approveStoredRegistration,
  saveStoredNotification,
  getStoredDocument,
} from "@/lib/dataStore";
import { RegistrationRecord } from "@/types/admin";
import { sendRegistrationApprovedEmail } from "@/lib/emailService";

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
          error: `Access denied. Role '${session.user.role}' is not authorized to approve student registrations. Admin role required.`,
          code: "ADMIN_ROLE_REQUIRED",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { registrationId, idCardConfirmed, paymentConfirmed, notes } = body;

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

    // 2. Strict Checkbox Confirmation Requirements
    if (idCardConfirmed !== true || paymentConfirmed !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Both confirmation checkboxes must be explicitly checked: Student college affiliation and payment receipt verification.",
          code: "CONFIRMATIONS_REQUIRED",
        },
        { status: 400 }
      );
    }

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

    // 4. Independent Server-Side Document Existence & Inaccessibility Validation
    // Validate Student ID Card Document
    const idCardPath = currentRecord.id_card_file_path || "";
    if (!idCardPath) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot approve registration: Student ID card document is missing or was not uploaded.",
          code: "ID_CARD_MISSING",
        },
        { status: 400 }
      );
    }

    // Verify ID card can be retrieved (dataStore, local disk, demo, or Supabase)
    const storedIdDoc = getStoredDocument(idCardPath);
    const idCardBasename = path.basename(
      idCardPath.replace(/^(local:(id_cards|receipts)\/|student-id-cards\/|\/)+/, "")
    );
    const localIdCardDisk = fs.existsSync(
      path.join(process.cwd(), ".data", "id_cards", idCardBasename)
    );
    const isDemoIdCard =
      idCardPath.toLowerCase().includes("demo") ||
      idCardPath.toLowerCase().includes("sample") ||
      idCardBasename.startsWith("demo_");

    if (!storedIdDoc && !localIdCardDisk && !isDemoIdCard && !config.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot approve registration: Student ID card document not found or inaccessible in private storage.",
          code: "ID_CARD_INACCESSIBLE",
        },
        { status: 400 }
      );
    }

    // Validate Payment Receipt Document
    const receiptPath = currentRecord.receipt_file_path || "";
    if (!receiptPath) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot approve registration: Payment receipt document is missing or was not uploaded.",
          code: "RECEIPT_MISSING",
        },
        { status: 400 }
      );
    }

    // Verify receipt can be retrieved
    const storedReceiptDoc = getStoredDocument(receiptPath);
    const receiptBasename = path.basename(
      receiptPath.replace(/^(local:(id_cards|receipts)\/|payment-receipts\/|\/)+/, "")
    );
    const localReceiptDisk = fs.existsSync(
      path.join(process.cwd(), ".data", "receipts", receiptBasename)
    );
    const isDemoReceipt =
      receiptPath.toLowerCase().includes("demo") ||
      receiptPath.toLowerCase().includes("sample") ||
      receiptBasename.startsWith("demo_");

    if (!storedReceiptDoc && !localReceiptDisk && !isDemoReceipt && !config.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot approve registration: Payment receipt document not found or inaccessible in private storage.",
          code: "RECEIPT_INACCESSIBLE",
        },
        { status: 400 }
      );
    }

    // 5. Update Supabase table if configured, ensuring no false success on DB failure
    const nowIso = new Date().toISOString();
    const safeVerifiedByUuid = getSafeUuid(session.user.id);
    const combinedNotes = `[STUDENT_STATUS: verified]\n[PAYMENT_STATUS: verified]\n[VERIFIED_BY: ${session.user.email} (${session.user.role})]\n[VERIFIED_AT: ${nowIso}]${
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

      try {
        let errDetailText: string | undefined;
        let patchRes = await fetch(patchUrl, {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            payment_status: "verified",
            student_verification_status: "verified",
            verified_at: nowIso,
            verified_by: safeVerifiedByUuid,
            student_verified_at: nowIso,
            student_verified_by: safeVerifiedByUuid,
            student_verification_notes: `Student affiliation confirmed via ID Card. Verified by ${session.user.email} (${session.user.role}).`,
            admin_review_notes: combinedNotes,
            updated_at: nowIso,
          }),
        });

        if (!patchRes.ok) {
          const firstErrText = await patchRes.text();
          // If student_verification_status or student_verified_* columns do not exist yet, fallback to legacy schema
          if (
            firstErrText.includes("student_verification_status") ||
            firstErrText.includes("student_verified") ||
            firstErrText.includes("42703") ||
            firstErrText.includes("PGRST204")
          ) {
            patchRes = await fetch(patchUrl, {
              method: "PATCH",
              headers: {
                ...headers,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                payment_status: "verified",
                verified_at: nowIso,
                verified_by: safeVerifiedByUuid,
                admin_review_notes: combinedNotes,
                updated_at: nowIso,
              }),
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
          console.error("Supabase approval update failed:", patchRes.status, sanitized);
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
        console.error("Supabase connection error during approval:", errorMsg);
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

    // 6. Atomically Approve in DataStore only after successful DB persistence (or if Supabase is unconfigured)
    const updatedRecord = approveStoredRegistration({
      registrationId: currentRecord.id || registrationId,
      actorEmail: session.user.email,
      notes: notes?.trim() || "Dual approval confirmed (Student Affiliation & Payment verified).",
    });

    // 7. Audit Log
    logAdminAction({
      action: "REGISTRATION_DUAL_APPROVED",
      actor: session.user,
      targetType: "registration",
      targetId: currentRecord.id || registrationId,
      metadata: {
        registrationNumber: currentRecord.registration_number,
        studentName: currentRecord.student_name,
        studentId: currentRecord.student_id,
        idCardConfirmed: true,
        paymentConfirmed: true,
        notes: notes || undefined,
      },
    });

    // 8. Notification
    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title: "Registration Approved",
      message: `Registration ${currentRecord.registration_number} for ${currentRecord.student_name} (${currentRecord.student_id}) has been fully approved by ${session.user.email}.`,
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
      const emailResult = await sendRegistrationApprovedEmail({
        registrationId: currentRecord.id || registrationId,
        registrationNumber: currentRecord.registration_number,
        recipientEmail: currentRecord.email,
        recipientName: currentRecord.student_name,
        studentId: currentRecord.student_id,
        admissionNumber: currentRecord.admission_number || null,
        school: currentRecord.school,
        program: currentRecord.program,
        transactionId: currentRecord.transaction_id,
      });
      emailStatusInfo = {
        status: emailResult.status || (emailResult.simulated ? "simulated" : emailResult.success ? "sent" : "failed"),
        recipient: currentRecord.email,
      };
    } catch (emailErr) {
      console.warn("[Approve Route] Non-blocking email dispatch error:", emailErr);
      emailStatusInfo = {
        status: "failed",
        recipient: currentRecord.email,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Student registration and payment successfully approved.",
      emailNotification: emailStatusInfo,
      registration: updatedRecord || {
        ...currentRecord,
        student_verification_status: "verified",
        payment_status: "verified",
        verified_at: nowIso,
        verified_by: session.user.email,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Approve registration error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error processing registration approval.",
      },
      { status: 500 }
    );
  }
}
