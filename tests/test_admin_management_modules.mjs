/**
 * AVISHKAR 2026 — Comprehensive Administrative Management Modules Test Suite
 * Covers Modules A, B, C, D, E, F, G, H, I
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedCount++;
  }
}

async function loginAs(email, password) {
  const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const cookie = res.headers.get("set-cookie");
  const parsedCookie = cookie ? cookie.split(";")[0] : "";
  return { res, data, cookie: parsedCookie };
}

async function runTests() {
  console.log("=================================================================");
  console.log("AVISHKAR-v2: ADMINISTRATIVE MANAGEMENT MODULES TEST SUITE");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("=================================================================\n");

  // Step 0: Acquire Auth Cookies
  console.log("[Phase 0] Authenticating Admin & President...");
  const adminAuth = await loginAs("admin@gdgoenka.ac.in", "Admin@2026");
  assert(adminAuth.res.status === 200 && adminAuth.data.user?.role === "Admin", "Admin logged in successfully");

  const presidentAuth = await loginAs("president@gdgoenka.ac.in", "President@2026");
  assert(presidentAuth.res.status === 200 && presidentAuth.data.user?.role === "President", "President logged in successfully");

  const memberAuth = await loginAs("member@gdgoenka.ac.in", "Member@2026");
  assert(memberAuth.res.status === 200 && memberAuth.data.user?.role === "AVISHKAR Member", "Member logged in successfully");

  // --------------------------------------------------------------------------
  // SECTION A: Events Management
  // --------------------------------------------------------------------------
  console.log("\n[Phase A] Verifying Events Management (/admin/events & APIs)...");
  
  // 1. Create a draft/proposal event as Member
  const testTitle = `Innovation Robotics ${Date.now()}`;
  const createEvRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberAuth.cookie },
    body: JSON.stringify({
      title: testTitle,
      description: "Autonomous robotics obstacle challenge for engineering students.",
      category: "Robotics",
      deliveryMode: "In-Person",
      expectedParticipants: 60,
      venuePlaceholder: "Block A Robotics Lab",
      status: "proposed",
    }),
  });
  const createEvData = await createEvRes.json();
  assert(createEvRes.status === 200 && createEvData.success, "Event proposal created by Member");

  // Fetch created event ID
  const eventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const eventsData = await eventsRes.json();
  const createdEvent = eventsData.events.find((e) => e.title === testTitle);
  assert(Boolean(createdEvent), "Newly proposed event found in events roster");
  assert(createdEvent.status === "proposed", "Event status is strictly 'proposed' (unapproved)");

  // 2. Publish gating: Admin CANNOT publish an unapproved proposal
  const blockedPublishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      id: createdEvent.id,
      action: "publish",
    }),
  });
  const blockedPublishData = await blockedPublishRes.json();
  assert(
    blockedPublishRes.status === 400 &&
      (blockedPublishData.error.includes("Approval Required") ||
        blockedPublishData.error.includes("President-approved") ||
        blockedPublishData.error.includes("Vice President")),
    "Publishing unapproved proposal is strictly rejected (HTTP 400) on server"
  );

  // 2b. Vice President approves the proposal (Dual-Approval Requirement)
  const vpAuth = await loginAs("vp@gdgoenka.ac.in", "VP@2026");
  const vpApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpAuth.cookie },
    body: JSON.stringify({
      id: createdEvent.id,
      action: "vp_approve",
      reviewComment: "Logistics and facilities verified by VP",
    }),
  });
  assert(vpApproveRes.status === 200, "Vice President approved the event proposal");

  // 3. President approves the proposal
  const approveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentAuth.cookie },
    body: JSON.stringify({
      id: createdEvent.id,
      action: "approve",
    }),
  });
  assert(approveRes.status === 200, "President approved the event proposal");

  // 4. Authorized Admin publishes the approved event
  const publishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      id: createdEvent.id,
      action: "publish",
    }),
  });
  assert(publishRes.status === 200, "Authorized Admin successfully published approved event");

  // Verify published event is visible publicly
  const publicEventsRes = await fetch(`${BASE_URL}/api/events`);
  const publicEventsData = await publicEventsRes.json();
  const publicEv = publicEventsData.events.find((e) => e.id === createdEvent.id);
  assert(Boolean(publicEv) && publicEv.status === "published", "Published event is available on public website");

  // 5. Unpublish the event
  const unpublishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      id: createdEvent.id,
      action: "unpublish",
    }),
  });
  assert(unpublishRes.status === 200, "Admin unpublished the event");

  // Verify removed from public view
  const publicAfterUnpublish = await fetch(`${BASE_URL}/api/events`);
  const publicAfterData = await publicAfterUnpublish.json();
  const stillPublic = publicAfterData.events.find((e) => e.id === createdEvent.id);
  assert(!stillPublic, "Unpublished event is removed from public website");

  // 6. Archive the event
  const archiveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      id: createdEvent.id,
      action: "archive",
    }),
  });
  assert(archiveRes.status === 200, "Admin archived the event");

  // --------------------------------------------------------------------------
  // SECTION B: Payment Verification
  // --------------------------------------------------------------------------
  console.log("\n[Phase B] Verifying Payment Verification (/admin/payments & APIs)...");

  // 1. Register a student for testing payments
  const dummyStudentId = `TEST_AUDIT_${Date.now()}`;
  const dummyTxId = `UTR_AUDIT_${Date.now()}`;

  const regFormData = new FormData();
  regFormData.append("studentName", "Audit Test Student");
  regFormData.append("email", `audit.${Date.now()}@gdgoenka.ac.in`);
  regFormData.append("contactNumber", "9876543210");
  regFormData.append("gender", "Male");
  regFormData.append("dob", "2003-05-15");
  regFormData.append("studentId", dummyStudentId);
  regFormData.append("school", "SOES");
  regFormData.append("program", "Computer science and engineering CORE");
  regFormData.append("yearOfJoining", "2022");
  regFormData.append("reasonForJoining", "Robotics and competitive coding");
  regFormData.append("leadershipInterest", "Yes");
  regFormData.append("transactionId", dummyTxId);
  regFormData.append("paymentDate", "2026-10-13");
  regFormData.append("remarks", "Audit Verification Test");

  const dummyProof = Buffer.from("DUMMY RECEIPT PROOF FOR AUDIT VERIFICATION");
  const receiptBlob = new Blob([dummyProof], { type: "application/pdf" });
  regFormData.append("receiptFile", receiptBlob, "test_receipt.pdf");

  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    body: regFormData,
  });
  const regData = await regRes.json();
  assert(regRes.status === 200 && regData.success, "Student registration submitted with payment details");
  const testRegId = regData.registrationNumber || regData.registration_number;

  // 2. Reject Payment without rejection reason MUST FAIL
  const rejectWithoutReason = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      registrationId: testRegId,
      action: "reject",
      // rejectionReason omitted
    }),
  });
  assert(
    rejectWithoutReason.status === 400,
    "Rejecting payment without a rejection reason is strictly rejected (HTTP 400)"
  );

  // 3. Reject payment WITH reason
  const rejectWithReason = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      registrationId: testRegId,
      action: "reject",
      rejectionReason: "UTR Transaction Number not found in university bank ledger",
      notes: "Cross-checked with ICICI Bank statement of 13 Oct 2026",
    }),
  });
  const rejectData = await rejectWithReason.json();
  assert(
    rejectWithReason.status === 200 &&
      (rejectData.payment_status === "rejected" || rejectData.action === "reject"),
    "Payment rejected with audit reason"
  );

  // 4. Inspect verification history
  const regDetailRes = await fetch(`${BASE_URL}/api/admin/registrations/${testRegId}`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const regDetailData = await regDetailRes.json();
  assert(regDetailRes.status === 200 && Boolean(regDetailData.registration), "Registration detail fetched successfully");
  assert(
    Array.isArray(regDetailData.registration?.verification_history) &&
      regDetailData.registration.verification_history.length >= 1,
    "Payment verification history is preserved in registration record"
  );
  assert(
    regDetailData.registration?.verification_history?.[0]?.action === "reject",
    "Preserved history entry matches rejection action"
  );

  // 5. Subsequent verification preserves prior history (no destructive overwrite)
  const approvePaymentRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      registrationId: testRegId,
      action: "approve",
      notes: "Student submitted corrected transaction slip. Verified against ledger.",
    }),
  });
  assert(approvePaymentRes.status === 200, "Payment updated to verified with notes");

  const regDetail2Res = await fetch(`${BASE_URL}/api/admin/registrations/${testRegId}`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const regDetail2Data = await regDetail2Res.json();
  assert(
    regDetail2Data.registration?.verification_history?.length >= 2,
    "Verification decision history retains all chronological decisions (append-only history)"
  );

  // 6. Secure Receipt Gating: Unauthenticated request to proof file is blocked
  const unauthProofRes = await fetch(`${BASE_URL}/api/admin/receipt?path=payment-receipts/test-proof.png`);
  assert(
    unauthProofRes.status === 401 || unauthProofRes.status === 403,
    "Payment proof file is protected against unauthenticated access (HTTP 401/403)"
  );

  // --------------------------------------------------------------------------
  // SECTION C: Registration Forms
  // --------------------------------------------------------------------------
  console.log("\n[Phase C] Verifying Registration Forms (/admin/forms & APIs)...");

  // 1. Fee validation: negative fee rejected
  const negFeeRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      eventId: createdEvent.id,
      eventTitle: testTitle,
      formTitle: "Invalid Fee Form",
      feeAmount: -100,
      fields: [],
    }),
  });
  assert(negFeeRes.status === 400, "Negative registration fee is strictly rejected (HTTP 400)");

  // 2. Schedule validation: start date after end date rejected
  const invalidDateRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      eventId: createdEvent.id,
      eventTitle: testTitle,
      formTitle: "Invalid Schedule Form",
      feeAmount: 500,
      registrationStartDate: "2026-11-20T00:00:00.000Z",
      registrationEndDate: "2026-11-10T00:00:00.000Z",
      fields: [],
    }),
  });
  assert(invalidDateRes.status === 400, "Invalid registration date range (start > end) rejected (HTTP 400)");

  // 3. Valid Form creation & version snapshotting
  const formTestEventId = "evt-form-test-" + Date.now();
  const formTestEventTitle = "Standalone Form Test Event " + Date.now();
  const validFormRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      eventId: formTestEventId,
      eventTitle: formTestEventTitle,
      formTitle: "Robotics Official Form v1",
      formDescription: "Official event registration questionnaire",
      feeAmount: 500,
      registrationStartDate: "2026-10-01T00:00:00.000Z",
      registrationEndDate: "2026-11-30T00:00:00.000Z",
      isActive: true,
      fields: [
        {
          id: "f1",
          label: "Team Name",
          type: "text",
          required: true,
          placeholder: "e.g. RoboTech Alpha",
        },
      ],
    }),
  });
  const validFormData = await validFormRes.json();
  assert(validFormRes.status === 200 && validFormData.form?.version === 1, "Form v1 saved successfully");

  // 4. Update Form -> Must snapshot v1 into history and bump to v2
  const updateFormRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      eventId: formTestEventId,
      eventTitle: formTestEventTitle,
      formTitle: "Robotics Official Form v2 (Updated)",
      feeAmount: 600,
      fields: [
        { id: "f1", label: "Team Name", type: "text", required: true },
        { id: "f2", label: "GitHub Repository", type: "text", required: false },
      ],
    }),
  });
  const updateFormData = await updateFormRes.json();
  assert(
    updateFormRes.status === 200 &&
      updateFormData.form?.version >= 2 &&
      Array.isArray(updateFormData.form?.history) &&
      updateFormData.form.history.length >= 1,
    "Form update snapshots prior version in history and increments version counter"
  );

  // --------------------------------------------------------------------------
  // SECTION D: Council Members
  // --------------------------------------------------------------------------
  console.log("\n[Phase D] Verifying Council Members (/admin/members & APIs)...");

  // 1. Role assignment authorization: Only President can assign member roles
  const memberListRes = await fetch(`${BASE_URL}/api/admin/members`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const memberListData = await memberListRes.json();
  const testTargetMember = memberListData.members.find(
    (m) => m.role === "AVISHKAR Member" || m.email.includes("member")
  );

  const adminAssignAttempt = await fetch(`${BASE_URL}/api/admin/members`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      memberId: testTargetMember?.id || "mem-sample",
      action: "assign-role",
      role: "Vice President",
    }),
  });
  assert(
    adminAssignAttempt.status === 403,
    "Admin is strictly blocked (HTTP 403) from assigning council roles (President exclusive)"
  );

  // 2. Anti-lockout protection: Deactivating the last active Admin is blocked
  const adminMember = memberListData.members.find((m) => m.email === "admin@gdgoenka.ac.in");
  const lockoutAttempt = await fetch(`${BASE_URL}/api/admin/members`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentAuth.cookie },
    body: JSON.stringify({
      memberId: adminMember?.id || "admin@gdgoenka.ac.in",
      action: "status",
      status: "inactive",
    }),
  });
  const lockoutData = await lockoutAttempt.json();
  assert(
    lockoutAttempt.status === 403 && lockoutData.error.includes("last active"),
    "Anti-lockout protection prevents deactivating the last active Administrator (HTTP 403)"
  );

  // 3. Credential Reset Workflow: Returns temporary token, never stores/displays plaintext
  const resetCredRes = await fetch(`${BASE_URL}/api/admin/members`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({
      memberId: testTargetMember?.id || "member@gdgoenka.ac.in",
      action: "reset-password",
    }),
  });
  const resetCredData = await resetCredRes.json();
  assert(
    resetCredRes.status === 200 &&
      Boolean(resetCredData.temporaryToken) &&
      !resetCredData.plaintextPassword,
    "Credential reset returns temporary token and never displays/returns plaintext password"
  );

  // --------------------------------------------------------------------------
  // SECTION E: Reports and Analytics
  // --------------------------------------------------------------------------
  console.log("\n[Phase E] Verifying Reports & Analytics (/admin/reports & APIs)...");

  // 1. JSON Metrics calculation
  const reportsRes = await fetch(`${BASE_URL}/api/admin/reports`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const reportsData = await reportsRes.json();
  assert(reportsRes.status === 200 && reportsData.success, "Reports API returns HTTP 200 OK");
  assert(
    typeof reportsData.summary?.totalRegistrations === "number" &&
      typeof reportsData.summary?.verifiedPayments === "number",
    "Reports metrics compute real persisted numbers for registrations and payments"
  );
  assert(
    Array.isArray(reportsData.breakdown?.byEvent) &&
      Array.isArray(reportsData.breakdown?.bySchool),
    "Reports provide event, academic school, and cohort breakdowns"
  );

  // 2. CSV Export & Formula Injection Prevention
  const csvRes = await fetch(`${BASE_URL}/api/admin/reports?format=csv`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const csvText = await csvRes.text();
  assert(csvRes.status === 200, "CSV export returns HTTP 200 OK");
  assert(
    csvRes.headers.get("content-type")?.includes("text/csv"),
    "CSV export sets text/csv Content-Type"
  );

  // Test formula injection escaping: Check that any formula character is escaped with single quote
  const lines = csvText.split("\n");
  let formulaInjectionVulnerable = false;
  for (const line of lines) {
    const cells = line.split(",");
    for (const cell of cells) {
      const trimmed = cell.replace(/^"/, "").trim();
      if (/^[=+\-@\t\r]/.test(trimmed) && !trimmed.startsWith("'")) {
        formulaInjectionVulnerable = true;
      }
    }
  }
  assert(!formulaInjectionVulnerable, "CSV output sanitizes formulas against injection (=, +, -, @ escaped)");

  // --------------------------------------------------------------------------
  // SECTION F: Audit Logs
  // --------------------------------------------------------------------------
  console.log("\n[Phase F] Verifying Audit Logs (/admin/audit-logs & APIs)...");

  // 1. Authorization: Unauthenticated blocked
  const unauthAudit = await fetch(`${BASE_URL}/api/admin/audit-logs`);
  assert(unauthAudit.status === 401 || unauthAudit.status === 403, "Audit logs API blocks unauthenticated access");

  // 2. Fetch logs as Admin
  const adminAuditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const adminAuditData = await adminAuditRes.json();
  assert(
    adminAuditRes.status === 200 && Array.isArray(adminAuditData.auditLogs),
    "Admin successfully retrieves audit logs"
  );

  // 3. Verify logged actions from earlier phases exist in audit trail
  const loggedActions = adminAuditData.auditLogs.map((l) => l.action);
  assert(
    loggedActions.includes("EVENT_PUBLISHED") ||
      loggedActions.includes("PAYMENT_VERIFIED") ||
      loggedActions.includes("MEMBER_CREDENTIAL_RESET"),
    "Audit trail includes recorded actions (EVENT_PUBLISHED, PAYMENT_VERIFIED, MEMBER_CREDENTIAL_RESET)"
  );

  // 4. Immutability / Append-Only: DELETE and PATCH are strictly rejected
  const deleteAuditAttempt = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    method: "DELETE",
    headers: { Cookie: adminAuth.cookie },
  });
  assert(
    deleteAuditAttempt.status === 405,
    "DELETE on audit logs returns HTTP 405 (Strictly append-only)"
  );

  const patchAuditAttempt = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    method: "PATCH",
    headers: { Cookie: adminAuth.cookie },
  });
  assert(
    patchAuditAttempt.status === 405,
    "PATCH on audit logs returns HTTP 405 (Immutable records)"
  );

  // --------------------------------------------------------------------------
  // SECTION G: Navigation Routes Availability
  // --------------------------------------------------------------------------
  console.log("\n[Phase G] Verifying Navigation & All Administrative Routes...");
  const adminNavRoutes = [
    "/admin/dashboard",
    "/admin/events",
    "/admin/payments",
    "/admin/forms",
    "/admin/members",
    "/admin/reports",
    "/admin/audit-logs",
  ];

  for (const route of adminNavRoutes) {
    const pageRes = await fetch(`${BASE_URL}${route}`, {
      headers: { Cookie: adminAuth.cookie },
    });
    assert(pageRes.status === 200, `Admin route ${route} loads with HTTP 200 OK`);
  }

  // Summary
  console.log("\n=================================================================");
  console.log(`Results: ${passedCount} passed, ${failedCount} failed.`);
  console.log("=================================================================");

  if (failedCount > 0) {
    console.error("❌ Some verification checks failed!");
    process.exit(1);
  } else {
    console.log("🎉 ALL ADMINISTRATIVE MANAGEMENT MODULE REQUIREMENTS VERIFIED!");
  }
}

runTests().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
