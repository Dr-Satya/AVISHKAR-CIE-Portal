/**
 * AVISHKAR 2026 — Automated Student Registration Email Notification Service
 * Edge/Cloudflare Worker compatible with Resend REST API & Sandbox Mode.
 */

import type {
  StudentEmailNotificationRecord,
  EmailNotificationEventType,
  EmailNotificationStatus,
} from "../types/admin.ts";
import {
  saveStoredEmailNotification,
  getStoredEmailNotificationByIdempotencyKey,
  getStoredEmailNotificationById,
  updateStoredEmailNotification,
} from "./dataStore.ts";

export interface StudentEmailPayload {
  registrationId: string;
  registrationNumber: string;
  recipientEmail: string;
  recipientName: string;
  studentId?: string | null;
  admissionNumber?: string | null;
  school?: string | null;
  program?: string | null;
  transactionId?: string | null;
}

export interface SendEmailResult {
  success: boolean;
  status: EmailNotificationStatus;
  notificationId?: string;
  idempotencyKey?: string;
  simulated?: boolean;
  skipped?: boolean;
  providerMessageId?: string | null;
  errorMessage?: string | null;
}

/**
 * Escapes HTML entities to prevent injection in generated email templates.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Neutral fallback reason for registration rejection.
 * Ensures the student never sees empty, null, or undefined rejection text.
 */
export const DEFAULT_REJECTION_REASON =
  "Registration criteria not met or documents could not be verified.";

/**
 * Resend Testing Mode Constants & Helper Resolvers
 */
export const RESEND_TESTING_SENDER = "onboarding@resend.dev";

export function getEmailSenderAddress(): string {
  const from = (process.env.EMAIL_FROM || process.env.RESEND_FROM || "").trim();
  if (from) return from;
  return RESEND_TESTING_SENDER;
}

export function isResendTestingMode(): boolean {
  const from = getEmailSenderAddress().toLowerCase();
  return (
    from.includes("onboarding@resend.dev") ||
    process.env.RESEND_TESTING_MODE === "true" ||
    process.env.EMAIL_TEST_MODE === "true" ||
    !process.env.EMAIL_FROM
  );
}

export function getResendAccountTestEmail(): string | null {
  const accountEmail = (
    process.env.RESEND_TEST_RECIPIENT_EMAIL ||
    process.env.RESEND_ACCOUNT_EMAIL ||
    ""
  ).trim().toLowerCase();
  return accountEmail.length > 0 ? accountEmail : null;
}

/**
 * Email template generators for each lifecycle stage.
 */
export function getEmailContent(
  eventType: EmailNotificationEventType,
  data: StudentEmailPayload & { rejectionReason?: string | null }
): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(data.recipientName.trim());
  const safeRegNumber = escapeHtml(data.registrationNumber.trim());
  const safeStudentId = escapeHtml(data.studentId || "—");
  const safeAdmissionNo = escapeHtml(data.admissionNumber || "—");
  const safeSchool = escapeHtml(data.school || "GD Goenka University");
  const safeProgram = escapeHtml(data.program || "Standard Track");
  const safeTransactionId = escapeHtml(data.transactionId || "—");

  if (eventType === "registration_submitted") {
    const subject = "AVISHKAR Registration Received — Awaiting Approval";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .header { background-color: #0A2047; padding: 28px 24px; text-align: center; }
    .header-logo { color: #FFFFFF; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; }
    .gold-accent { height: 4px; background: linear-gradient(90deg, #D4AF37 0%, #F59E0B 100%); width: 100%; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
    .summary-card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .summary-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .summary-table td { padding: 8px 4px; vertical-align: top; }
    .summary-label { color: #64748B; font-weight: 500; width: 40%; }
    .summary-val { color: #0A2047; font-weight: 600; text-align: right; }
    .timeline-notice { background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 24px; font-size: 13px; color: #1E3A8A; }
    .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-logo">AVISHKAR 2026</h1>
      <p style="color: #94A3B8; margin: 6px 0 0; font-size: 13px;">GD Goenka University &bull; Annual Innovation Festival</p>
    </div>
    <div class="gold-accent"></div>
    <div class="content">
      <div style="text-align: right; margin-bottom: 12px;">
        <span class="badge">Pending Approval</span>
      </div>
      <h2 style="font-size: 20px; color: #0A2047; margin-top: 0;">Registration Received</h2>
      <p>Dear <strong>${safeName}</strong>,</p>
      <p>Thank you for submitting your student registration for <strong>AVISHKAR 2026</strong>. We have successfully recorded your application and transaction reference in our festival ledger.</p>
      <p>Your registration is currently under review by the university accounts and verification committee.</p>

      <div class="summary-card">
        <h3 style="margin-top: 0; font-size: 14px; color: #0A2047; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Registration Summary</h3>
        <table class="summary-table">
          <tr>
            <td class="summary-label">Registration ID</td>
            <td class="summary-val" style="font-family: monospace; font-size: 15px;">${safeRegNumber}</td>
          </tr>
          <tr>
            <td class="summary-label">Student ID / Roll No</td>
            <td class="summary-val" style="font-family: monospace;">${safeStudentId}</td>
          </tr>
          <tr>
            <td class="summary-label">Admission Number</td>
            <td class="summary-val" style="font-family: monospace;">${safeAdmissionNo}</td>
          </tr>
          <tr>
            <td class="summary-label">School & Program</td>
            <td class="summary-val">${safeProgram} &bull; ${safeSchool}</td>
          </tr>
          <tr>
            <td class="summary-label">Transaction Reference (UTR)</td>
            <td class="summary-val" style="font-family: monospace;">${safeTransactionId}</td>
          </tr>
          <tr>
            <td class="summary-label">Current Status</td>
            <td class="summary-val" style="color: #B45309;">Pending Approval</td>
          </tr>
        </table>
      </div>

      <div class="timeline-notice">
        <strong>What happens next?</strong><br>
        Administrative verification of student identity and payment proof typically takes <strong>24 to 48 hours</strong>. Once verified, you will receive an official approval confirmation email containing your event badge information.
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">GD Goenka University &bull; Sohna Road, Gurugram, Haryana</p>
      <p style="margin: 0;">For inquiries or assistance, email us at <a href="mailto:avishkar@gdgoenka.ac.in" style="color: #0A2047;">avishkar@gdgoenka.ac.in</a></p>
    </div>
  </div>
</body>
</html>`;

    const text = `AVISHKAR 2026 — GD Goenka University
Annual Innovation & Technical Festival

Subject: AVISHKAR Registration Received — Awaiting Approval

Dear ${data.recipientName},

Thank you for registering for AVISHKAR 2026. Your registration details and payment transaction reference have been successfully received and are awaiting administrative verification.

Registration Summary:
- Registration ID: ${data.registrationNumber}
- Student Name: ${data.recipientName}
- Student ID / Roll No: ${data.studentId || "—"}
- Admission Number: ${data.admissionNumber || "—"}
- School & Program: ${data.program || "—"} • ${data.school || "GD Goenka University"}
- Transaction Reference (UTR): ${data.transactionId || "—"}
- Current Status: Pending Approval

Next Steps:
Verification typically takes between 24 to 48 hours. Once verified by the administration, you will receive an official approval email.

GD Goenka University, Sohna Road, Gurugram, Haryana
Contact: avishkar@gdgoenka.ac.in`;

    return { subject, html, text };
  }

  if (eventType === "registration_approved") {
    const subject = "AVISHKAR Registration Approved — GD Goenka University";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .header { background-color: #0A2047; padding: 28px 24px; text-align: center; }
    .header-logo { color: #FFFFFF; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; }
    .gold-accent { height: 4px; background: linear-gradient(90deg, #10B981 0%, #059669 100%); width: 100%; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
    .summary-card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .summary-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .summary-table td { padding: 8px 4px; vertical-align: top; }
    .summary-label { color: #64748B; font-weight: 500; width: 40%; }
    .summary-val { color: #0A2047; font-weight: 600; text-align: right; }
    .next-steps-card { background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin-top: 24px; }
    .next-steps-title { color: #166534; font-weight: bold; font-size: 14px; margin-top: 0; margin-bottom: 8px; }
    .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-logo">AVISHKAR 2026</h1>
      <p style="color: #94A3B8; margin: 6px 0 0; font-size: 13px;">GD Goenka University &bull; Annual Innovation Festival</p>
    </div>
    <div class="gold-accent"></div>
    <div class="content">
      <div style="text-align: right; margin-bottom: 12px;">
        <span class="badge">Approved</span>
      </div>
      <h2 style="font-size: 20px; color: #0A2047; margin-top: 0;">Congratulations! Registration Approved</h2>
      <p>Dear <strong>${safeName}</strong>,</p>
      <p>We are thrilled to inform you that your registration and payment verification for <strong>AVISHKAR 2026</strong> have been <strong>officially approved</strong> by the GD Goenka University festival committee.</p>
      <p>You are now confirmed as an official student delegate for AVISHKAR 2026.</p>

      <div class="summary-card">
        <h3 style="margin-top: 0; font-size: 14px; color: #0A2047; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Official Delegate Details</h3>
        <table class="summary-table">
          <tr>
            <td class="summary-label">Registration ID</td>
            <td class="summary-val" style="font-family: monospace; font-size: 15px; color: #059669;">${safeRegNumber}</td>
          </tr>
          <tr>
            <td class="summary-label">Student Name</td>
            <td class="summary-val">${safeName}</td>
          </tr>
          <tr>
            <td class="summary-label">Student ID / Roll No</td>
            <td class="summary-val" style="font-family: monospace;">${safeStudentId}</td>
          </tr>
          <tr>
            <td class="summary-label">Program</td>
            <td class="summary-val">${safeProgram}</td>
          </tr>
          <tr>
            <td class="summary-label">Verification Status</td>
            <td class="summary-val" style="color: #059669;">Approved</td>
          </tr>
        </table>
      </div>

      <div class="next-steps-card">
        <h4 class="next-steps-title">Event Day Instructions & Next Steps:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #166534; line-height: 1.6;">
          <li>Keep your <strong>Registration ID (${safeRegNumber})</strong> handy on your mobile device.</li>
          <li>Bring your physical <strong>GD Goenka University Student ID card</strong> for identity verification at the welcome desk.</li>
          <li>Collect your delegate badge, event schedule, and welcome kit at the AVISHKAR reception desk.</li>
          <li>Venue: GD Goenka University Campus, Sohna Road, Gurugram.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">GD Goenka University &bull; Sohna Road, Gurugram, Haryana</p>
      <p style="margin: 0;">For inquiries or assistance, email us at <a href="mailto:avishkar@gdgoenka.ac.in" style="color: #0A2047;">avishkar@gdgoenka.ac.in</a></p>
    </div>
  </div>
</body>
</html>`;

    const text = `AVISHKAR 2026 — GD Goenka University
Annual Innovation & Technical Festival

Subject: AVISHKAR Registration Approved — GD Goenka University

Dear ${data.recipientName},

We are pleased to inform you that your registration and payment for AVISHKAR 2026 have been officially approved by the GD Goenka University administration.

Delegate Details:
- Registration ID: ${data.registrationNumber}
- Student Name: ${data.recipientName}
- Roll Number: ${data.studentId || "—"}
- Program: ${data.program || "—"}
- Status: Approved

Next Steps & Event Instructions:
1. Retain your Registration ID (${data.registrationNumber}) for entry on event day.
2. Present your university student ID card along with your Registration ID at the AVISHKAR registration desk to receive your official delegate badge and festival kit.
3. Venue: GD Goenka University Campus, Sohna Road, Gurugram.

Congratulations and welcome to AVISHKAR 2026!

GD Goenka University, Sohna Road, Gurugram, Haryana
Contact: avishkar@gdgoenka.ac.in`;

    return { subject, html, text };
  }

  // registration_rejected
  const subject = "AVISHKAR Registration Update — GD Goenka University";
  const rawReason = (data.rejectionReason && data.rejectionReason.trim()) || DEFAULT_REJECTION_REASON;
  const safeReason = escapeHtml(rawReason);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .header { background-color: #0A2047; padding: 28px 24px; text-align: center; }
    .header-logo { color: #FFFFFF; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; }
    .gold-accent { height: 4px; background: linear-gradient(90deg, #EF4444 0%, #DC2626 100%); width: 100%; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
    .summary-card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px; margin: 24px 0; }
    .summary-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .summary-table td { padding: 8px 4px; vertical-align: top; }
    .summary-label { color: #64748B; font-weight: 500; width: 40%; }
    .summary-val { color: #0A2047; font-weight: 600; text-align: right; }
    .reason-box { background-color: #FFF1F2; border-left: 4px solid #E11D48; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 20px; font-size: 13px; color: #881337; }
    .footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-logo">AVISHKAR 2026</h1>
      <p style="color: #94A3B8; margin: 6px 0 0; font-size: 13px;">GD Goenka University &bull; Annual Innovation Festival</p>
    </div>
    <div class="gold-accent"></div>
    <div class="content">
      <div style="text-align: right; margin-bottom: 12px;">
        <span class="badge">Rejected</span>
      </div>
      <h2 style="font-size: 20px; color: #0A2047; margin-top: 0;">Registration Status Update</h2>
      <p>Dear <strong>${safeName}</strong>,</p>
      <p>Thank you for your interest in <strong>AVISHKAR 2026</strong>. We are writing to update you on the review of your festival registration application.</p>
      <p>Following administrative review by the verification committee, your registration could not be approved at this time.</p>

      <div class="summary-card">
        <h3 style="margin-top: 0; font-size: 14px; color: #0A2047; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Registration Details</h3>
        <table class="summary-table">
          <tr>
            <td class="summary-label">Registration ID</td>
            <td class="summary-val" style="font-family: monospace; font-size: 15px;">${safeRegNumber}</td>
          </tr>
          <tr>
            <td class="summary-label">Student Name</td>
            <td class="summary-val">${safeName}</td>
          </tr>
          <tr>
            <td class="summary-label">Status</td>
            <td class="summary-val" style="color: #DC2626;">Rejected</td>
          </tr>
        </table>
      </div>

      <div class="reason-box">
        <strong style="display: block; margin-bottom: 4px;">Reason for Decision:</strong>
        ${safeReason}
      </div>

      <div style="margin-top: 24px; font-size: 13px; color: #475569; line-height: 1.6;">
        <p><strong>Next Steps:</strong></p>
        <p>If you believe this decision was made in error or if you wish to provide updated payment proof or ID documentation, please contact the AVISHKAR Registration Helpdesk at <a href="mailto:avishkar@gdgoenka.ac.in" style="color: #0A2047; font-weight: 600;">avishkar@gdgoenka.ac.in</a> quoting your <strong>Registration ID (${safeRegNumber})</strong>.</p>
        <p>You may also submit a fresh registration with valid credentials before the registration closing deadline.</p>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">GD Goenka University &bull; Sohna Road, Gurugram, Haryana</p>
      <p style="margin: 0;">For inquiries or assistance, email us at <a href="mailto:avishkar@gdgoenka.ac.in" style="color: #0A2047;">avishkar@gdgoenka.ac.in</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = `AVISHKAR 2026 — GD Goenka University
Annual Innovation & Technical Festival

Subject: AVISHKAR Registration Update — GD Goenka University

Dear ${data.recipientName},

Thank you for your interest in AVISHKAR 2026. Following administrative review by the verification committee, your registration could not be approved at this time.

Registration Details:
- Registration ID: ${data.registrationNumber}
- Student Name: ${data.recipientName}
- Status: Rejected

Reason for Decision:
${rawReason}

Next Steps:
If you believe this decision was made in error or wish to submit updated documentation, please contact the AVISHKAR Registration Helpdesk at avishkar@gdgoenka.ac.in quoting your Registration ID (${data.registrationNumber}).

GD Goenka University, Sohna Road, Gurugram, Haryana
Contact: avishkar@gdgoenka.ac.in`;

  return { subject, html, text };
}

/**
 * Asynchronously attempts to sync the notification record to Supabase
 * if configured and the table exists. Non-blocking with fallback.
 */
async function syncEmailNotificationToSupabase(
  record: StudentEmailNotificationRecord
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) return;

  try {
    const endpoint = `${supabaseUrl}/rest/v1/email_notifications`;
    const payload = {
      id: record.id,
      registration_id: record.registrationId,
      registration_number: record.registrationNumber,
      recipient_email: record.recipientEmail,
      recipient_name: record.recipientName,
      event_type: record.eventType,
      subject: record.subject,
      status: record.status,
      provider: record.provider,
      provider_message_id: record.providerMessageId,
      error_message: record.errorMessage,
      attempts: record.attempts,
      idempotency_key: record.idempotencyKey,
      last_attempt_at: record.lastAttemptAt,
      created_at: record.createdAt,
    };

    await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Non-blocking fallback: local store holds full state
    console.debug?.("[EmailService] Supabase email sync skipped:", err);
  }
}

/**
 * Dispatches an automated student email notification.
 * Decoupled from core registration persistence: will never throw to caller.
 */
export async function sendStudentNotification(params: {
  eventType: EmailNotificationEventType;
  student: StudentEmailPayload;
  rejectionReason?: string | null;
  forceRetry?: boolean;
  isTestDispatch?: boolean;
}): Promise<SendEmailResult> {
  const { eventType, student, rejectionReason, forceRetry, isTestDispatch } = params;

  if (!student.recipientEmail || typeof student.recipientEmail !== "string") {
    return {
      success: false,
      status: "failed",
      errorMessage: "Invalid or missing recipient email address.",
    };
  }

  const normalizedEmail = student.recipientEmail.trim().toLowerCase();
  const idempotencyKey = `${eventType}-${student.registrationNumber.trim()}`;

  // 1. Idempotency Check: Prevent duplicate email sending unless forced retry
  if (!forceRetry) {
    const existing = getStoredEmailNotificationByIdempotencyKey(idempotencyKey);
    if (existing && (existing.status === "sent" || existing.status === "simulated")) {
      return {
        success: true,
        status: existing.status,
        notificationId: existing.id,
        idempotencyKey,
        skipped: true,
        simulated: existing.status === "simulated",
        providerMessageId: existing.providerMessageId,
      };
    }
  }

  const { subject, html, text } = getEmailContent(eventType, {
    ...student,
    rejectionReason,
  });

  const nowIso = new Date().toISOString();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const emailProvider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  const isSandbox = !resendApiKey || emailProvider === "sandbox";

  const notificationId = `notif-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Find existing record if retry
  const existingRecord = getStoredEmailNotificationByIdempotencyKey(idempotencyKey);
  const attempts = (existingRecord?.attempts || 0) + 1;

  // 2. Sandbox / Simulated Mode Execution
  if (isSandbox) {
    console.info(
      `[EmailService] [SIMULATED] Mode: Sandbox | Event: ${eventType} | To: ${normalizedEmail} | Reg: ${student.registrationNumber} | Subject: "${subject}"`
    );

    const record: StudentEmailNotificationRecord = {
      id: existingRecord?.id || notificationId,
      registrationId: student.registrationId,
      registrationNumber: student.registrationNumber,
      recipientEmail: normalizedEmail,
      recipientName: student.recipientName.trim(),
      eventType,
      subject,
      status: "simulated",
      provider: "sandbox",
      providerMessageId: `sim-${Date.now()}`,
      errorMessage: null,
      attempts,
      idempotencyKey,
      createdAt: existingRecord?.createdAt || nowIso,
      lastAttemptAt: nowIso,
    };

    saveStoredEmailNotification(record);
    syncEmailNotificationToSupabase(record).catch(() => {});

    return {
      success: true,
      status: "simulated",
      simulated: true,
      notificationId: record.id,
      idempotencyKey,
      providerMessageId: record.providerMessageId,
    };
  }

  // 3. Testing Mode Recipient Filtering
  // Resend testing sender (onboarding@resend.dev) strictly permits delivery ONLY
  // to the email address associated with the user's Resend account.
  // Requirement: "For testing, send messages only to the email address associated with my Resend account. Do not send to arbitrary student addresses in testing mode."
  const testingMode = isResendTestingMode();
  const resendAccountEmail = getResendAccountTestEmail();

  if (testingMode && !isTestDispatch) {
    const isTargetingResendAccount = Boolean(
      resendAccountEmail && normalizedEmail === resendAccountEmail
    );

    if (!isTargetingResendAccount) {
      console.info(
        `[EmailService] [RESEND TESTING RESTRICTION] Recipient '${normalizedEmail}' is an arbitrary student address. Live Resend sending is restricted to Resend account owner (${resendAccountEmail || "RESEND_TEST_RECIPIENT_EMAIL not configured"}). Simulating delivery to preserve student registration flow.`
      );

      const record: StudentEmailNotificationRecord = {
        id: existingRecord?.id || notificationId,
        registrationId: student.registrationId,
        registrationNumber: student.registrationNumber,
        recipientEmail: normalizedEmail,
        recipientName: student.recipientName.trim(),
        eventType,
        subject,
        status: "simulated",
        provider: "sandbox",
        providerMessageId: `test-sim-${Date.now()}`,
        errorMessage:
          "Resend testing mode active (onboarding@resend.dev): Delivery simulated. Live emails are restricted to the verified Resend account owner until a custom sending domain is verified.",
        attempts,
        idempotencyKey,
        createdAt: existingRecord?.createdAt || nowIso,
        lastAttemptAt: nowIso,
      };

      saveStoredEmailNotification(record);
      syncEmailNotificationToSupabase(record).catch(() => {});

      return {
        success: true,
        status: "simulated",
        simulated: true,
        notificationId: record.id,
        idempotencyKey,
        providerMessageId: record.providerMessageId,
        errorMessage: record.errorMessage,
      };
    }
  }

  // 4. Live Provider Execution via Resend HTTP REST API
  const fromAddress = getEmailSenderAddress();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [normalizedEmail],
        subject,
        html,
        text,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      if (!data || !data.id) {
        throw new Error("Resend API responded OK but returned no message ID.");
      }

      const record: StudentEmailNotificationRecord = {
        id: existingRecord?.id || notificationId,
        registrationId: student.registrationId,
        registrationNumber: student.registrationNumber,
        recipientEmail: normalizedEmail,
        recipientName: student.recipientName.trim(),
        eventType,
        subject,
        status: "sent",
        provider: "resend",
        providerMessageId: data.id,
        errorMessage: null,
        attempts,
        idempotencyKey,
        createdAt: existingRecord?.createdAt || nowIso,
        lastAttemptAt: nowIso,
      };

      saveStoredEmailNotification(record);
      syncEmailNotificationToSupabase(record).catch(() => {});

      return {
        success: true,
        status: "sent",
        notificationId: record.id,
        idempotencyKey,
        providerMessageId: data.id,
      };
    } else {
      const errorText = await res.text();
      // Sanitize error text to avoid logging any secrets
      const sanitizedError = errorText.replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, "Bearer [REDACTED]");

      console.warn(
        `[EmailService] Resend API error (${res.status}): ${sanitizedError.slice(0, 200)}`
      );

      const record: StudentEmailNotificationRecord = {
        id: existingRecord?.id || notificationId,
        registrationId: student.registrationId,
        registrationNumber: student.registrationNumber,
        recipientEmail: normalizedEmail,
        recipientName: student.recipientName.trim(),
        eventType,
        subject,
        status: "failed",
        provider: "resend",
        providerMessageId: null,
        errorMessage: `Resend HTTP ${res.status}: ${sanitizedError.slice(0, 150)}`,
        attempts,
        idempotencyKey,
        createdAt: existingRecord?.createdAt || nowIso,
        lastAttemptAt: nowIso,
      };

      saveStoredEmailNotification(record);
      syncEmailNotificationToSupabase(record).catch(() => {});

      return {
        success: false,
        status: "failed",
        notificationId: record.id,
        idempotencyKey,
        errorMessage: record.errorMessage,
      };
    }
  } catch (netErr: any) {
    const errorMsg = netErr instanceof Error ? netErr.message : "Network error";
    console.warn(`[EmailService] Network exception while dispatching email: ${errorMsg}`);

    const record: StudentEmailNotificationRecord = {
      id: existingRecord?.id || notificationId,
      registrationId: student.registrationId,
      registrationNumber: student.registrationNumber,
      recipientEmail: normalizedEmail,
      recipientName: student.recipientName.trim(),
      eventType,
      subject,
      status: "failed",
      provider: "resend",
      providerMessageId: null,
      errorMessage: `Network error: ${errorMsg.slice(0, 150)}`,
      attempts,
      idempotencyKey,
      createdAt: existingRecord?.createdAt || nowIso,
      lastAttemptAt: nowIso,
    };

    saveStoredEmailNotification(record);
    syncEmailNotificationToSupabase(record).catch(() => {});

    return {
      success: false,
      status: "failed",
      notificationId: record.id,
      idempotencyKey,
      errorMessage: record.errorMessage,
    };
  }
}

/**
 * Conveniences for the 3 distinct event hooks.
 */
export async function sendRegistrationSubmittedEmail(
  student: StudentEmailPayload
): Promise<SendEmailResult> {
  return sendStudentNotification({
    eventType: "registration_submitted",
    student,
  });
}

export async function sendRegistrationApprovedEmail(
  student: StudentEmailPayload
): Promise<SendEmailResult> {
  return sendStudentNotification({
    eventType: "registration_approved",
    student,
  });
}

export async function sendRegistrationRejectedEmail(
  student: StudentEmailPayload,
  rejectionReason?: string | null
): Promise<SendEmailResult> {
  return sendStudentNotification({
    eventType: "registration_rejected",
    student,
    rejectionReason,
  });
}

/**
 * Admin retry utility to re-dispatch a failed notification.
 */
export async function retryEmailNotification(
  notificationId: string
): Promise<SendEmailResult> {
  const existing = getStoredEmailNotificationById(notificationId);
  if (!existing) {
    return {
      success: false,
      status: "failed",
      errorMessage: "Notification record not found.",
    };
  }

  return sendStudentNotification({
    eventType: existing.eventType,
    student: {
      registrationId: existing.registrationId,
      registrationNumber: existing.registrationNumber,
      recipientEmail: existing.recipientEmail,
      recipientName: existing.recipientName,
    },
    forceRetry: true,
  });
}

export interface TestEmailNotificationParams {
  eventType: EmailNotificationEventType;
  recipientEmail?: string;
  customReason?: string;
  sampleStudentName?: string;
  sampleProgram?: string;
}

/**
 * Safe test-only mechanism to trigger any of the 3 email templates.
 * Dispatches authentic templates using sample data WITHOUT modifying or creating
 * real student registration rows, payments, or Supabase records.
 */
export async function sendTestEmailNotification(
  params: TestEmailNotificationParams
): Promise<SendEmailResult> {
  const configuredTestEmail = getResendAccountTestEmail();
  const targetEmail = (params.recipientEmail || configuredTestEmail || "").trim().toLowerCase();

  if (!targetEmail) {
    return {
      success: false,
      status: "failed",
      errorMessage:
        "No test recipient provided. In Resend testing mode, you must provide your verified Resend account email address or set RESEND_TEST_RECIPIENT_EMAIL.",
    };
  }

  const testTimestamp = Date.now();
  const sampleStudent: StudentEmailPayload = {
    registrationId: `test-preview-${testTimestamp}`,
    registrationNumber: `AVISHKAR-TEST-SAMPLE-${testTimestamp.toString().slice(-4)}`,
    recipientEmail: targetEmail,
    recipientName: params.sampleStudentName || "Test Student (Resend Preview)",
    studentId: "2026TEST01",
    admissionNumber: "ADM-2026-TEST",
    school: "School of Engineering and Sciences",
    program: params.sampleProgram || "B.Tech Computer Science and Engineering",
    transactionId: "UPI-SAMPLE-UTR-123456",
  };

  return sendStudentNotification({
    eventType: params.eventType,
    student: sampleStudent,
    rejectionReason:
      params.customReason ||
      "Sample document verification test (ID card or payment receipt not legible).",
    forceRetry: true,
    isTestDispatch: true,
  });
}

