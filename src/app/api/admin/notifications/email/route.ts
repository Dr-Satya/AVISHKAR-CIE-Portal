import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
  getStoredEmailNotifications,
  getStoredEmailNotificationById,
} from "@/lib/dataStore";
import {
  retryEmailNotification,
  sendTestEmailNotification,
  isResendTestingMode,
  getEmailSenderAddress,
  getResendAccountTestEmail,
} from "@/lib/emailService";

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [user, domain] = parts;
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    if (searchParams.get("diagnostic") === "true") {
      const testEmail = getResendAccountTestEmail();
      return NextResponse.json({
        success: true,
        testingMode: isResendTestingMode(),
        provider: (process.env.EMAIL_PROVIDER || "resend").toLowerCase(),
        sender: getEmailSenderAddress(),
        hasApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
        configuredTestRecipient: testEmail ? maskEmail(testEmail) : null,
      });
    }

    const registrationId = searchParams.get("registrationId") || searchParams.get("registrationNumber");

    const notifications = getStoredEmailNotifications(registrationId || undefined);

    return NextResponse.json({
      success: true,
      testingMode: isResendTestingMode(),
      notifications,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required." },
        { status: 401 }
      );
    }

    if (session.user.role !== "Admin" && session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin role required to dispatch or retry email notifications." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Action A: Safe Test-Only Template Trigger
    if (body.action === "test_template" || body.action === "test") {
      const targetTemplate = body.template || body.eventType;
      if (
        !targetTemplate ||
        !["registration_submitted", "registration_approved", "registration_rejected"].includes(targetTemplate)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid template. Must be one of: 'registration_submitted', 'registration_approved', or 'registration_rejected'.",
          },
          { status: 400 }
        );
      }

      const testResult = await sendTestEmailNotification({
        eventType: targetTemplate,
        recipientEmail: body.recipientEmail,
        customReason: body.customReason,
        sampleStudentName: body.sampleStudentName,
      });

      return NextResponse.json({
        success: testResult.success,
        status: testResult.status,
        providerMessageId: testResult.providerMessageId,
        template: targetTemplate,
        message: testResult.success
          ? testResult.simulated
            ? "Test notification dispatched in simulated mode."
            : "Test email successfully accepted by Resend API."
          : `Test email delivery failed: ${testResult.errorMessage || "Unknown error"}`,
        result: testResult,
      });
    }

    // Action B: Retry Existing Stored Notification
    const { notificationId } = body;

    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid notificationId is required to retry delivery." },
        { status: 400 }
      );
    }

    const targetRecord = getStoredEmailNotificationById(notificationId);
    if (!targetRecord) {
      return NextResponse.json(
        { success: false, error: `Notification with ID '${notificationId}' not found.` },
        { status: 404 }
      );
    }

    const result = await retryEmailNotification(notificationId);

    return NextResponse.json({
      success: result.success,
      status: result.status,
      message: result.success
        ? result.simulated
          ? "Notification re-dispatched in simulated mode."
          : "Notification re-dispatched successfully."
        : `Notification retry failed: ${result.errorMessage || "Unknown error"}`,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

