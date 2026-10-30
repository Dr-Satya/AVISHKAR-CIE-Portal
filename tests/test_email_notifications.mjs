// tests/test_email_notifications.mjs
// Automated test suite for AVISHKAR-v2 Automated Student Registration Email Notifications

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Automated Student Registration Email Notifications Test Suite");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Template Structure & Exact Subject Verification
// -----------------------------------------------------------------------------
await runTest("Exact subject lines match specification across all 3 lifecycle stages", async () => {
  const { getEmailContent } = await import("../src/lib/emailService.ts");

  const mockStudent = {
    registrationId: "reg-test-001",
    registrationNumber: "AVISHKAR-2026-999001",
    recipientEmail: "student.test@gdgoenka.ac.in",
    recipientName: "Aarav Sharma",
    studentId: "2023001001",
    admissionNumber: "ADM-2023-01",
    school: "School of Engineering and Sciences",
    program: "B.Tech Computer Science and Engineering",
    transactionId: "UPI9876543210",
  };

  // Stage 1: Submitted / Pending
  const submitted = getEmailContent("registration_submitted", mockStudent);
  assert.strictEqual(
    submitted.subject,
    "AVISHKAR Registration Received — Awaiting Approval",
    "Subject for submitted registration must strictly match specification"
  );
  assert.ok(submitted.html.includes("Aarav Sharma"), "HTML must contain student name");
  assert.ok(submitted.html.includes("AVISHKAR-2026-999001"), "HTML must contain registration number");
  assert.ok(submitted.html.includes("Pending Approval"), "HTML must indicate Pending Approval");
  assert.ok(submitted.text.includes("AVISHKAR-2026-999001"), "Text alternative must contain reg number");

  // Stage 2: Approved
  const approved = getEmailContent("registration_approved", mockStudent);
  assert.strictEqual(
    approved.subject,
    "AVISHKAR Registration Approved — GD Goenka University",
    "Subject for approved registration must strictly match specification"
  );
  assert.ok(approved.html.includes("Aarav Sharma"), "Approved HTML must contain student name");
  assert.ok(approved.html.includes("AVISHKAR-2026-999001"), "Approved HTML must contain reg number");
  assert.ok(approved.html.includes("Approved"), "Approved HTML must indicate Approved");

  // Stage 3: Rejected
  const rejected = getEmailContent("registration_rejected", {
    ...mockStudent,
    rejectionReason: "Payment UTR does not match bank records.",
  });
  assert.strictEqual(
    rejected.subject,
    "AVISHKAR Registration Update — GD Goenka University",
    "Subject for rejected registration must strictly match specification"
  );
  assert.ok(rejected.html.includes("Payment UTR does not match bank records."), "HTML must contain admin reason");
  assert.ok(rejected.html.includes("Rejected"), "HTML must indicate Rejected status");
});

// -----------------------------------------------------------------------------
// Test 2: HTML Injection Prevention & XSS Escaping
// -----------------------------------------------------------------------------
await runTest("Dynamic inputs are HTML-escaped to prevent email client script injection", async () => {
  const { getEmailContent, escapeHtml } = await import("../src/lib/emailService.ts");

  assert.strictEqual(
    escapeHtml('<script>alert("xss")</script>'),
    "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    "escapeHtml must sanitize malicious tags"
  );

  const maliciousStudent = {
    registrationId: "reg-xss-001",
    registrationNumber: "AVISHKAR-<b>2026</b>",
    recipientEmail: "attacker@test.com",
    recipientName: "Bad <script>alert(1)</script> Actor",
    rejectionReason: "Fee mismatch <img src=x onerror=alert(1)>",
  };

  const content = getEmailContent("registration_rejected", maliciousStudent);
  assert.ok(!content.html.includes("<script>"), "HTML must NOT contain unescaped script tag");
  assert.ok(content.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "Script tag must be safely escaped");
  assert.ok(!content.html.includes("<img src=x"), "HTML must NOT contain unescaped img tag");
  assert.ok(content.html.includes("&lt;img src=x"), "Image tag must be safely escaped");
});

// -----------------------------------------------------------------------------
// Test 3: Rejection Reason Fallback Logic
// -----------------------------------------------------------------------------
await runTest("Rejection email replaces null, undefined, or empty reason with neutral fallback", async () => {
  const { getEmailContent, DEFAULT_REJECTION_REASON } = await import("../src/lib/emailService.ts");

  const baseStudent = {
    registrationId: "reg-fallback-001",
    registrationNumber: "AVISHKAR-2026-777",
    recipientEmail: "test@gdgu.org",
    recipientName: "Test Student",
  };

  // Case A: null reason
  const contentNull = getEmailContent("registration_rejected", { ...baseStudent, rejectionReason: null });
  assert.ok(contentNull.html.includes(DEFAULT_REJECTION_REASON), "Null reason must use fallback message");
  assert.ok(!contentNull.html.includes("null"), "HTML must not display literal 'null'");

  // Case B: empty string
  const contentEmpty = getEmailContent("registration_rejected", { ...baseStudent, rejectionReason: "" });
  assert.ok(contentEmpty.html.includes(DEFAULT_REJECTION_REASON), "Empty reason must use fallback message");

  // Case C: whitespace only
  const contentWhitespace = getEmailContent("registration_rejected", { ...baseStudent, rejectionReason: "   " });
  assert.ok(contentWhitespace.html.includes(DEFAULT_REJECTION_REASON), "Whitespace reason must use fallback message");

  // Case D: undefined reason
  const contentUndef = getEmailContent("registration_rejected", baseStudent);
  assert.ok(contentUndef.html.includes(DEFAULT_REJECTION_REASON), "Undefined reason must use fallback message");
  assert.ok(!contentUndef.html.includes("undefined"), "HTML must not display literal 'undefined'");
});

// -----------------------------------------------------------------------------
// Test 4: Sandbox / Simulated Mode Execution
// -----------------------------------------------------------------------------
await runTest("Sends in simulated mode when RESEND_API_KEY is not configured", async () => {
  const { sendStudentNotification } = await import("../src/lib/emailService.ts");

  // Temporarily ensure no live key
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const result = await sendStudentNotification({
      eventType: "registration_submitted",
      student: {
        registrationId: "reg-sim-001",
        registrationNumber: "AVISHKAR-2026-SIM001",
        recipientEmail: "simulated.student@gdgoenka.ac.in",
        recipientName: "Simulated Student",
      },
    });

    assert.strictEqual(result.success, true, "Simulated send must report success");
    assert.strictEqual(result.status, "simulated", "Status must be simulated");
    assert.strictEqual(result.simulated, true, "Simulated flag must be true");
    assert.ok(result.notificationId, "Notification ID must be generated");
  } finally {
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  }
});

// -----------------------------------------------------------------------------
// Test 5: Idempotency & Deduplication Guard
// -----------------------------------------------------------------------------
await runTest("Idempotency guard prevents duplicate email dispatches for the same event", async () => {
  const { sendStudentNotification } = await import("../src/lib/emailService.ts");

  const regNum = `AVISHKAR-2026-IDEM-${Date.now()}`;
  const testStudent = {
    registrationId: `reg-${Date.now()}`,
    registrationNumber: regNum,
    recipientEmail: "idempotent@gdgoenka.ac.in",
    recipientName: "Idempotent User",
  };

  // First call: should process
  const first = await sendStudentNotification({
    eventType: "registration_approved",
    student: testStudent,
  });
  assert.strictEqual(first.success, true);

  // Second call with same registration number and event: should be skipped
  const second = await sendStudentNotification({
    eventType: "registration_approved",
    student: testStudent,
  });

  assert.strictEqual(second.success, true, "Duplicate call must return success: true");
  assert.strictEqual(second.skipped, true, "Duplicate call must report skipped: true");
  assert.strictEqual(second.notificationId, first.notificationId, "Must return the same notification ID");
});

// -----------------------------------------------------------------------------
// Test 6: Retry Mechanism Updates Delivery State
// -----------------------------------------------------------------------------
await runTest("retryEmailNotification forces re-dispatch and increments attempts count", async () => {
  const { sendStudentNotification, retryEmailNotification } = await import("../src/lib/emailService.ts");
  const { getStoredEmailNotificationById } = await import("../src/lib/dataStore.ts");

  const uniqueReg = `AVISHKAR-2026-RETRY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const testStudent = {
    registrationId: `reg-${Date.now()}`,
    registrationNumber: uniqueReg,
    recipientEmail: "retry.test@gdgoenka.ac.in",
    recipientName: "Retry User",
  };

  const initial = await sendStudentNotification({
    eventType: "registration_rejected",
    student: testStudent,
    rejectionReason: "Initial test rejection",
  });

  const recordBefore = getStoredEmailNotificationById(initial.notificationId);
  assert.ok(recordBefore, "Initial record must exist in dataStore");
  assert.strictEqual(recordBefore.attempts, 1, "Initial attempts must be 1");

  // Force retry
  const retryResult = await retryEmailNotification(initial.notificationId);
  assert.strictEqual(retryResult.success, true, "Retry must succeed");

  const recordAfter = getStoredEmailNotificationById(initial.notificationId);
  assert.ok(recordAfter, "Record must exist after retry");
  assert.strictEqual(recordAfter.attempts, 2, "Attempts count must increment to 2");
});

// -----------------------------------------------------------------------------
// Test 7: Non-blocking Resilience / Decoupling Guarantee
// -----------------------------------------------------------------------------
await runTest("sendStudentNotification handles invalid email gracefully without throwing", async () => {
  const { sendStudentNotification } = await import("../src/lib/emailService.ts");

  // Pass invalid email
  const result = await sendStudentNotification({
    eventType: "registration_submitted",
    student: {
      registrationId: "reg-fail-001",
      registrationNumber: "AVISHKAR-2026-FAIL001",
      recipientEmail: "", // invalid
      recipientName: "No Email User",
    },
  });

  assert.strictEqual(result.success, false, "Must return success: false for invalid input");
  assert.strictEqual(result.status, "failed", "Status must be failed");
  assert.ok(result.errorMessage, "Error message must be set");
});

// -----------------------------------------------------------------------------
// Test 8: Admin Notification History Retrieval & Querying
// -----------------------------------------------------------------------------
await runTest("getStoredEmailNotifications filters correctly by registration number", async () => {
  const { getStoredEmailNotifications } = await import("../src/lib/dataStore.ts");

  const notifications = getStoredEmailNotifications("AVISHKAR-2026-SIM001");
  assert.ok(Array.isArray(notifications), "Must return an array of notifications");
  assert.ok(notifications.length > 0, "Must find notifications for AVISHKAR-2026-SIM001");
  assert.strictEqual(notifications[0].registrationNumber, "AVISHKAR-2026-SIM001");
});

// -----------------------------------------------------------------------------
// Test 9: Registration Route Hooks Email Without Blocking Core Flow
// -----------------------------------------------------------------------------
await runTest("Registration route dispatches pending email and handles failures gracefully", async () => {
  const routeContent = fs.readFileSync(path.join(rootDir, "src/app/api/register/route.ts"), "utf-8");
  assert.match(routeContent, /sendRegistrationSubmittedEmail/, "Route must import and call sendRegistrationSubmittedEmail");
  assert.match(routeContent, /emailNotification:/, "Route must include emailNotification in response");
  assert.match(routeContent, /catch\s*\(\s*emailErr\s*\)/, "Email dispatch must be wrapped in error catch block");
});

// -----------------------------------------------------------------------------
// Test 10: Approval Route Hooks Email Without Blocking Core Flow
// -----------------------------------------------------------------------------
await runTest("Approval route dispatches approval email upon successful decision", async () => {
  const routeContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/approve/route.ts"), "utf-8");
  assert.match(routeContent, /sendRegistrationApprovedEmail/, "Route must import and call sendRegistrationApprovedEmail");
  assert.match(routeContent, /emailNotification:/, "Route must include emailNotification in response");
  assert.match(routeContent, /catch\s*\(\s*emailErr\s*\)/, "Email dispatch must be wrapped in error catch block");
});

// -----------------------------------------------------------------------------
// Test 11: Rejection Route Hooks Email With Mandatory Reason Forwarding
// -----------------------------------------------------------------------------
await runTest("Rejection route dispatches rejection email with validated reason", async () => {
  const routeContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/reject/route.ts"), "utf-8");
  assert.match(routeContent, /sendRegistrationRejectedEmail/, "Route must import and call sendRegistrationRejectedEmail");
  assert.match(routeContent, /trimmedReason/, "Route must forward trimmed rejection reason");
  assert.match(routeContent, /catch\s*\(\s*emailErr\s*\)/, "Email dispatch must be wrapped in error catch block");
});

// -----------------------------------------------------------------------------
// Test 12: Admin Notification Management API Route
// -----------------------------------------------------------------------------
await runTest("Admin email notification route enforces authentication and provides retry handler", async () => {
  const routeContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/notifications/email/route.ts"), "utf-8");
  assert.match(routeContent, /getAdminSessionFromRequest/, "Must enforce admin authentication");
  assert.match(routeContent, /retryEmailNotification/, "Must support retrying email delivery via POST");
  assert.match(routeContent, /getStoredEmailNotifications/, "Must support querying notification records via GET");
});

// -----------------------------------------------------------------------------
// Test 13: UI Components Include Email Notification Feedback
// -----------------------------------------------------------------------------
await runTest("UI components provide student and admin email delivery visibility", async () => {
  const successContent = fs.readFileSync(path.join(rootDir, "src/components/registration/SubmissionSuccess.tsx"), "utf-8");
  assert.match(successContent, /emailNotification/, "SubmissionSuccess must check emailNotification state");
  assert.match(successContent, /Confirmation Email/, "SubmissionSuccess must display email confirmation status");

  const modalContent = fs.readFileSync(path.join(rootDir, "src/components/admin/RegistrationDetailModal.tsx"), "utf-8");
  assert.match(modalContent, /Automated Email Notifications/, "Modal must display email notification audit section");
  assert.match(modalContent, /Retry Dispatch/, "Modal must provide retry dispatch button");
});

// -----------------------------------------------------------------------------
// Test 14: Supabase Migration Script Exists and Is Syntactically Valid
// -----------------------------------------------------------------------------
await runTest("Supabase migration defines email_notifications table with RLS", async () => {
  const migrationPath = path.join(rootDir, "supabase/migrations/012_student_email_notifications.sql");
  assert.ok(fs.existsSync(migrationPath), "Migration 012 must exist");
  const sql = fs.readFileSync(migrationPath, "utf-8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.email_notifications/, "Must create email_notifications table");
  assert.match(sql, /idempotency_key/, "Must include idempotency_key column");
  assert.match(sql, /ROW LEVEL SECURITY/, "Must enable RLS");
});

// -----------------------------------------------------------------------------
// Test 15: Resend Testing Mode Sender & Configuration Detection
// -----------------------------------------------------------------------------
await runTest("Resolves onboarding@resend.dev sender and detects testing mode", async () => {
  const {
    RESEND_TESTING_SENDER,
    getEmailSenderAddress,
    isResendTestingMode,
  } = await import("../src/lib/emailService.ts");

  assert.strictEqual(RESEND_TESTING_SENDER, "onboarding@resend.dev", "Sender must be onboarding@resend.dev");

  // In default testing mode, sender resolves to onboarding@resend.dev
  const sender = getEmailSenderAddress();
  assert.ok(
    sender.includes("onboarding@resend.dev"),
    `Sender address must include onboarding@resend.dev in testing mode, got: ${sender}`
  );
  assert.strictEqual(isResendTestingMode(), true, "Must report testing mode active");
});

// -----------------------------------------------------------------------------
// Test 16: Testing Mode Recipient Restriction (Arbitrary Students Protected)
// -----------------------------------------------------------------------------
await runTest("Testing mode blocks live sends to arbitrary student addresses", async () => {
  const { sendStudentNotification } = await import("../src/lib/emailService.ts");

  const originalTestRecipient = process.env.RESEND_TEST_RECIPIENT_EMAIL;
  process.env.RESEND_TEST_RECIPIENT_EMAIL = "resend.owner@test.com";

  try {
    const arbitraryStudent = {
      registrationId: `reg-arb-${Date.now()}`,
      registrationNumber: `AVISHKAR-ARB-${Date.now()}`,
      recipientEmail: "arbitrary.student@gdgoenka.ac.in",
      recipientName: "Arbitrary Student",
    };

    const result = await sendStudentNotification({
      eventType: "registration_submitted",
      student: arbitraryStudent,
    });

    assert.strictEqual(result.success, true, "Must succeed gracefully without throwing");
    assert.strictEqual(result.status, "simulated", "Must be marked as simulated delivery");
    assert.strictEqual(result.simulated, true, "Simulated flag must be true");
  } finally {
    if (originalTestRecipient) {
      process.env.RESEND_TEST_RECIPIENT_EMAIL = originalTestRecipient;
    } else {
      delete process.env.RESEND_TEST_RECIPIENT_EMAIL;
    }
  }
});

// -----------------------------------------------------------------------------
// Test 17: Safe Test-Only Mechanism (Zero Fake DB Registrations)
// -----------------------------------------------------------------------------
await runTest("sendTestEmailNotification executes all 3 templates without altering registrations", async () => {
  const { sendTestEmailNotification } = await import("../src/lib/emailService.ts");
  const { getStoredRegistrations } = await import("../src/lib/dataStore.ts");

  const regCountBefore = getStoredRegistrations().length;

  const testEmail = "resend.account@domain.com";

  // Test Template 1: Submitted
  const res1 = await sendTestEmailNotification({
    eventType: "registration_submitted",
    recipientEmail: testEmail,
  });
  assert.strictEqual(res1.success, true, "Test submitted template must succeed");

  // Test Template 2: Approved
  const res2 = await sendTestEmailNotification({
    eventType: "registration_approved",
    recipientEmail: testEmail,
  });
  assert.strictEqual(res2.success, true, "Test approved template must succeed");

  // Test Template 3: Rejected
  const res3 = await sendTestEmailNotification({
    eventType: "registration_rejected",
    recipientEmail: testEmail,
    customReason: "UTR mismatch test",
  });
  assert.strictEqual(res3.success, true, "Test rejected template must succeed");

  const regCountAfter = getStoredRegistrations().length;
  assert.strictEqual(
    regCountAfter,
    regCountBefore,
    "Test email notifications must NOT create any records in the registrations store"
  );
});

// -----------------------------------------------------------------------------
// Test 18: Cloudflare Worker Configuration & Admin Test Route Inspection
// -----------------------------------------------------------------------------
await runTest("Worker config and admin routes expose testing controls without leaking secrets", async () => {
  const cfConfigContent = fs.readFileSync(path.join(rootDir, "cloudflare.config.ts"), "utf-8");
  assert.match(cfConfigContent, /EMAIL_PROVIDER/, "cloudflare.config.ts must bind EMAIL_PROVIDER");
  assert.match(cfConfigContent, /EMAIL_FROM/, "cloudflare.config.ts must bind EMAIL_FROM");
  assert.match(cfConfigContent, /onboarding@resend\.dev/, "cloudflare.config.ts must use onboarding@resend.dev");

  const testRouteContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/notifications/email/test/route.ts"), "utf-8");
  assert.match(testRouteContent, /getAdminSessionFromRequest/, "Test route must verify admin session");
  assert.match(testRouteContent, /sendTestEmailNotification/, "Test route must call sendTestEmailNotification");
  assert.ok(!testRouteContent.includes("apiKey: process.env.RESEND_API_KEY"), "Test route must never return API key value");
  assert.match(testRouteContent, /hasApiKey:\s*Boolean/, "Test route must only expose boolean presence of secret");

  const settingsContent = fs.readFileSync(path.join(rootDir, "src/app/admin/settings/page.tsx"), "utf-8");
  assert.match(settingsContent, /Resend Testing Mode/, "Settings UI must show Resend Testing Mode tab");
  assert.match(settingsContent, /onboarding@resend\.dev/, "Settings UI must indicate testing sender");
  assert.match(settingsContent, /Safe Isolation Guarantee/, "Settings UI must highlight safe isolation guarantee");
});



console.log(`\n================================================================================`);
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
console.log(`================================================================================`);
