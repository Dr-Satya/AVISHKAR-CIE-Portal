// @ts-check
/**
 * AVISHKAR-v2 Mentor Demo End-to-End Verification Suite
 * Tests all 16 steps of the event lifecycle, role-based access control,
 * dynamic forms, resources, student registration, and payment verification.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let memberCookie = "";
let presidentCookie = "";
let adminCookie = "";

let testEventId = "";
let testRegistrationNumber = "";
let testRegistrationId = "";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    return setCookie.split(";")[0];
  }
  return "";
}

async function runTest() {
  console.log("\n=================================================================");
  console.log("AVISHKAR-v2: MENTOR DEMO 16-STEP END-TO-END VERIFICATION SUITE");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("=================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Log in as an AVISHKAR Member
  // ---------------------------------------------------------------------------
  console.log("[Step 1/16] Logging in as AVISHKAR Member...");
  const memberLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "member@gdgoenka.ac.in",
      password: "Member@2026",
    }),
  });
  assert(memberLoginRes.ok, "Member login endpoint returns 200 OK");
  const memberData = await memberLoginRes.json();
  assert(memberData.success === true, "Member login reports success");
  assert(memberData.user.role === "AVISHKAR Member", "Authenticated role is 'AVISHKAR Member'");
  memberCookie = await extractCookie(memberLoginRes);
  assert(memberCookie.length > 0, "Member session cookie received");

  // ---------------------------------------------------------------------------
  // STEP 2: Propose an event as Member
  // ---------------------------------------------------------------------------
  console.log("\n[Step 2/16] Proposing a new event track as Member...");
  const proposeRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: memberCookie,
    },
    body: JSON.stringify({
      title: "Autonomous Drone Racing Challenge 2026",
      slug: `drone-race-${Date.now()}`,
      description: "High-speed FPV drone obstacle navigation using onboard vision models.",
      category: "Robotics",
      teamSizeMin: 2,
      teamSizeMax: 4,
      datePlaceholder: "13 October 2026",
      venuePlaceholder: "Outdoor Sports Complex, GD Goenka University",
      status: "proposed",
    }),
  });
  assert(proposeRes.ok, "Propose event returns 200/201");
  const proposeData = await proposeRes.json();
  assert(proposeData.success === true, "Event proposal created successfully");
  testEventId = proposeData.event.id;
  assert(proposeData.event.status === "proposed", "Event status is initialized to 'proposed'");

  // ---------------------------------------------------------------------------
  // STEP 3: Log in as President
  // ---------------------------------------------------------------------------
  console.log("\n[Step 3/16] Logging in as President...");
  const presLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "president@gdgoenka.ac.in",
      password: "President@2026",
    }),
  });
  assert(presLoginRes.ok, "President login returns 200 OK");
  const presData = await presLoginRes.json();
  assert(presData.user.role === "President", "Authenticated role is 'President'");
  presidentCookie = await extractCookie(presLoginRes);
  assert(presidentCookie.length > 0, "President session cookie received");

  // ---------------------------------------------------------------------------
  // STEP 4: President approves the proposed event
  // ---------------------------------------------------------------------------
  console.log("\n[Step 4/16] President reviews and approves proposed event...");
  const approveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: presidentCookie,
    },
    body: JSON.stringify({
      eventId: testEventId,
      action: "approve",
    }),
  });
  assert(approveRes.ok, "President event approval returns 200 OK");
  const approveData = await approveRes.json();
  assert(approveData.event.status === "approved", "Event status transitioned to 'approved'");

  // ---------------------------------------------------------------------------
  // STEP 5: Log in as Admin
  // ---------------------------------------------------------------------------
  console.log("\n[Step 5/16] Logging in as Admin...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@gdgoenka.ac.in",
      password: "Admin@2026",
    }),
  });
  assert(adminLoginRes.ok, "Admin login returns 200 OK");
  const adminData = await adminLoginRes.json();
  assert(adminData.user.role === "Admin", "Authenticated role is 'Admin'");
  adminCookie = await extractCookie(adminLoginRes);
  assert(adminCookie.length > 0, "Admin session cookie received");

  // ---------------------------------------------------------------------------
  // STEP 6: Admin publishes the approved event
  // ---------------------------------------------------------------------------
  console.log("\n[Step 6/16] Admin publishes the approved event track...");
  const publishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      eventId: testEventId,
      action: "publish",
    }),
  });
  assert(publishRes.ok, "Publish event returns 200 OK");
  const publishData = await publishRes.json();
  assert(publishData.event.status === "published", "Event status transitioned to 'published'");

  // ---------------------------------------------------------------------------
  // STEP 7: Create and publish event-specific registration form
  // ---------------------------------------------------------------------------
  console.log("\n[Step 7/16] Admin creates and publishes dynamic registration form...");
  const formRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      eventId: testEventId,
      eventTitle: "Autonomous Drone Racing Challenge 2026",
      formTitle: "Drone Racing 2026 Team Registration Questionnaire",
      formDescription: "Specify your drone frame type, telemetry frequencies, and pilot callsign.",
      isActive: true,
      isPublished: true,
      fields: [
        {
          id: "f-callsign",
          label: "Team Pilot Callsign",
          type: "text",
          required: true,
          placeholder: "e.g., SkyStriker",
        },
        {
          id: "f-dronetype",
          label: "Drone Frame Class",
          type: "select",
          required: true,
          options: ["5-inch Freestyle", "3-inch Cinewhoop", "Custom Micro 2-inch"],
        },
        {
          id: "f-inspectiondate",
          label: "Technical Inspection Slot",
          type: "date",
          required: true,
        },
      ],
    }),
  });
  assert(formRes.ok, "Create form returns 200 OK");
  const formData = await formRes.json();
  assert(formData.success === true, "Dynamic form saved successfully");

  // ---------------------------------------------------------------------------
  // STEP 8: Upload a test event document resource
  // ---------------------------------------------------------------------------
  console.log("\n[Step 8/16] Admin uploads official event rulebook resource...");
  const resourceRes = await fetch(`${BASE_URL}/api/admin/resources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      eventId: testEventId,
      eventTitle: "Autonomous Drone Racing Challenge 2026",
      title: "Official Drone Racing Flight Safety Handbook",
      category: "rulebook",
      fileName: "drone_racing_safety_2026.pdf",
      fileSize: "1.8 MB",
      fileUrl: "/docs/drone_safety.pdf",
    }),
  });
  assert(resourceRes.ok, "Create resource returns 200 OK");
  const resourceData = await resourceRes.json();
  assert(resourceData.success === true, "Event resource recorded successfully");

  // ---------------------------------------------------------------------------
  // STEP 9: Open public website as an unauthenticated visitor
  // ---------------------------------------------------------------------------
  console.log("\n[Step 9/16] Unauthenticated public visitor fetches published events...");
  const publicEventsRes = await fetch(`${BASE_URL}/api/events`);
  assert(publicEventsRes.ok, "Public /api/events returns 200 OK without authentication");
  const publicEventsData = await publicEventsRes.json();
  assert(Array.isArray(publicEventsData.events), "Public events list returned");

  // ---------------------------------------------------------------------------
  // STEP 10: Verify the published event and form are visible to the public
  // ---------------------------------------------------------------------------
  console.log("\n[Step 10/16] Verifying published event and its questionnaire are publicly visible...");
  const matchedEvent = publicEventsData.events.find((e) => e.id === testEventId);
  assert(Boolean(matchedEvent), "Newly published drone racing event appears in public events list");
  assert(matchedEvent.status === "published", "Public event has published status");

  const publicFormRes = await fetch(`${BASE_URL}/api/events/${testEventId}/form`);
  assert(publicFormRes.ok, "Public form questionnaire endpoint returns 200 OK");
  const publicFormData = await publicFormRes.json();
  assert(publicFormData.form.formTitle.includes("Drone Racing"), "Published form title matches configuration");
  assert(publicFormData.form.fields.length === 3, "Form includes all 3 configured fields");

  // Submit response to event questionnaire
  const testSubRes = await fetch(`${BASE_URL}/api/events/${testEventId}/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Aarav Pilot",
      studentId: "22001015099",
      studentEmail: "aarav.pilot@gdgoenka.ac.in",
      responses: {
        "f-callsign": "ThunderHawk",
        "f-dronetype": "5-inch Freestyle",
        "f-inspectiondate": "2026-10-13",
      },
    }),
  });
  assert(testSubRes.ok, "Public submission of questionnaire returns 200 OK");
  const testSubData = await testSubRes.json();
  assert(testSubData.success === true, "Event questionnaire submission confirmed");

  // ---------------------------------------------------------------------------
  // STEP 11: Submit a dummy student registration on /api/register
  // ---------------------------------------------------------------------------
  console.log("\n[Step 11/16] Submitting dummy student registration with payment info...");
  const dummyStudentId = `TEST_${Date.now()}`;
  const dummyTxId = `UTR${Date.now()}`;

  const regFormData = new FormData();
  regFormData.append("studentName", "Rohit Kumar");
  regFormData.append("email", `rohit.${Date.now()}@gdgoenka.ac.in`);
  regFormData.append("contactNumber", "9876543210");
  regFormData.append("gender", "Male");
  regFormData.append("dob", "2003-05-15");
  regFormData.append("studentId", dummyStudentId);
  regFormData.append("school", "SOES");
  regFormData.append("program", "Computer science and engineering CORE");
  regFormData.append("yearOfJoining", "2022");
  regFormData.append("reasonForJoining", "Passionate about robotics, competitive hacking, and AI tracks.");
  regFormData.append("leadershipInterest", "Yes");
  regFormData.append("transactionId", dummyTxId);
  regFormData.append("paymentDate", "2026-10-12");
  regFormData.append("remarks", "Mentor Demo Isolated Dummy Test");

  // Attach a valid minimal test receipt PDF
  const dummyReceiptContent = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n178\n%%EOF\n"
  );
  const receiptBlob = new Blob([dummyReceiptContent], { type: "application/pdf" });
  regFormData.append("receiptFile", receiptBlob, "test_receipt.pdf");

  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    body: regFormData,
  });

  if (!regRes.ok) {
    const errorBody = await regRes.text();
    console.error(`Registration failed with status ${regRes.status}:`, errorBody);
  }
  assert(regRes.ok, "Student registration endpoint returns 200 OK");
  const regData = await regRes.json();
  assert(regData.success === true, "Student registration succeeded");
  testRegistrationNumber = regData.registrationNumber;
  assert(Boolean(testRegistrationNumber), `Registration number issued: ${testRegistrationNumber}`);

  // ---------------------------------------------------------------------------
  // STEP 12: Verify saved registration appears in authorized admin roster
  // ---------------------------------------------------------------------------
  console.log("\n[Step 12/16] Verifying registration appears in authorized admin roster...");
  const rosterRes = await fetch(`${BASE_URL}/api/admin/registrations?search=${encodeURIComponent(dummyStudentId)}`, {
    headers: { Cookie: adminCookie },
  });
  assert(rosterRes.ok, "Admin registrations API returns 200 OK");
  const rosterData = await rosterRes.json();
  assert(rosterData.registrations.length > 0, "Registration found in admin roster");
  const foundReg = rosterData.registrations.find((r) => r.student_id === dummyStudentId);
  assert(Boolean(foundReg), "Found exact student registration by Student ID");
  testRegistrationId = foundReg.id || foundReg.registration_number;
  assert(foundReg.payment_status === "pending_verification", "Initial payment status is 'pending_verification'");

  // ---------------------------------------------------------------------------
  // STEP 13: Student checks their own status on /api/register/status
  // ---------------------------------------------------------------------------
  console.log("\n[Step 13/16] Student queries their real-time verification status...");
  const statusRes = await fetch(`${BASE_URL}/api/register/status?query=${encodeURIComponent(dummyStudentId)}`);
  assert(statusRes.ok, "Public status tracker API returns 200 OK");
  const statusData = await statusRes.json();
  assert(statusData.found === true, "Student registration found on tracker");
  assert(statusData.registration.registrationNumber === testRegistrationNumber, "Returned matching registration number");
  assert(statusData.registration.paymentStatus === "pending_verification", "Status shows pending review");

  // ---------------------------------------------------------------------------
  // STEP 14: Authorized admin verifies payment
  // ---------------------------------------------------------------------------
  console.log("\n[Step 14/16] Admin reviews and approves the student payment...");
  const verifyPayRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      registrationId: testRegistrationId,
      action: "approve",
      notes: "Verified against receiving bank account during mentor demo test run.",
    }),
  });
  assert(verifyPayRes.ok, "Payment verification API returns 200 OK");
  const verifyPayData = await verifyPayRes.json();
  assert(verifyPayData.success === true, "Payment successfully approved");

  // Re-check student status on tracker to confirm real-time reflection
  const postVerifyStatusRes = await fetch(`${BASE_URL}/api/register/status?query=${encodeURIComponent(dummyStudentId)}`);
  const postVerifyData = await postVerifyStatusRes.json();
  assert(postVerifyData.registration.paymentStatus === "verified", "Public tracker reflects 'verified' payment");

  // ---------------------------------------------------------------------------
  // STEP 15: Confirm role-based authorization blocks unauthorized actions
  // ---------------------------------------------------------------------------
  console.log("\n[Step 15/16] Verifying role-based access control blocks unauthorized actions...");
  // 15a. Member attempting to approve an event -> BLOCKED (403)
  const memberApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: memberCookie,
    },
    body: JSON.stringify({
      eventId: testEventId,
      action: "approve",
    }),
  });
  assert(memberApproveRes.status === 403, "AVISHKAR Member blocked (403 Forbidden) from approving events");

  // 15b. Member attempting to assign roles -> BLOCKED (403)
  const memberRoleRes = await fetch(`${BASE_URL}/api/admin/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: memberCookie,
    },
    body: JSON.stringify({
      fullName: "Malicious Member",
      email: "hacker@test.com",
      role: "President",
      department: "SOES",
    }),
  });
  assert(memberRoleRes.status === 403, "AVISHKAR Member blocked (403 Forbidden) from assigning council roles");

  // 15c. Unauthenticated request to admin registrations -> BLOCKED (401)
  const unauthRes = await fetch(`${BASE_URL}/api/admin/registrations`);
  assert(unauthRes.status === 401, "Unauthenticated user blocked (401 Unauthorized) from admin roster");

  // 15d. Unauthenticated request to audit logs -> BLOCKED (401)
  const unauthAuditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`);
  assert(unauthAuditRes.status === 401, "Unauthenticated user blocked (401 Unauthorized) from audit logs");

  // ---------------------------------------------------------------------------
  // STEP 16: Verify data persistence across server queries (Simulated Refresh)
  // ---------------------------------------------------------------------------
  console.log("\n[Step 16/16] Verifying data persistence after simulated refresh...");
  const persistEventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: presidentCookie },
  });
  const persistEventsData = await persistEventsRes.json();
  const persistedEvent = persistEventsData.events.find((e) => e.id === testEventId);
  assert(Boolean(persistedEvent), "Test event persists in backend store");
  assert(persistedEvent.status === "published", "Persisted event remains in published state");

  const persistRegRes = await fetch(`${BASE_URL}/api/admin/registrations?search=${encodeURIComponent(dummyStudentId)}`, {
    headers: { Cookie: adminCookie },
  });
  const persistRegData = await persistRegRes.json();
  const persistedReg = persistRegData.registrations.find((r) => r.student_id === dummyStudentId);
  assert(Boolean(persistedReg), "Student registration persists in backend store");
  assert(persistedReg.payment_status === "verified", "Student verified payment persists");

  console.log("\n=================================================================");
  console.log("🎉 ALL 16 STEPS OF THE END-TO-END VERIFICATION PASSED SUCCESSFULLY!");
  console.log("=================================================================\n");
}

runTest().catch((err) => {
  console.error("\n❌ End-to-End Test Suite Error:", err);
  process.exit(1);
});
