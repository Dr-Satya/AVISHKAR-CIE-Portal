import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import {
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

    const testEmail = getResendAccountTestEmail();

    return NextResponse.json({
      success: true,
      testingMode: isResendTestingMode(),
      provider: (process.env.EMAIL_PROVIDER || "resend").toLowerCase(),
      sender: getEmailSenderAddress(),
      hasApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
      configuredTestRecipient: testEmail ? maskEmail(testEmail) : null,
      availableTemplates: [
        {
          id: "registration_submitted",
          name: "Registration Received / Pending Approval",
          subject: "AVISHKAR Registration Received — Awaiting Approval",
        },
        {
          id: "registration_approved",
          name: "Registration Approved",
          subject: "AVISHKAR Registration Approved — GD Goenka University",
        },
        {
          id: "registration_rejected",
          name: "Registration Rejected",
          subject: "AVISHKAR Registration Update — GD Goenka University",
        },
      ],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
        { success: false, error: "Forbidden: Admin role required to test email templates." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const template = body.template || body.eventType;

    if (
      !template ||
      !["registration_submitted", "registration_approved", "registration_rejected"].includes(template)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid template. Expected one of: 'registration_submitted', 'registration_approved', or 'registration_rejected'.",
        },
        { status: 400 }
      );
    }

    const result = await sendTestEmailNotification({
      eventType: template,
      recipientEmail: body.recipientEmail,
      customReason: body.customReason,
      sampleStudentName: body.sampleStudentName,
      sampleProgram: body.sampleProgram,
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      providerMessageId: result.providerMessageId,
      template,
      message: result.success
        ? result.simulated
          ? "Test notification dispatched in simulated mode."
          : "Test email successfully accepted by Resend API."
        : `Test email delivery failed: ${result.errorMessage || "Unknown error"}`,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
