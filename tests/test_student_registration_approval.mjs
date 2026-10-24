import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function run() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Student Registration Approval & Verification Test Suite");
  console.log(`Target: ${BASE_URL}`);
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // Helper to authenticate
  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
    const data = await res.json();
    return { ok: res.ok, status: res.status, cookie, data };
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Table & UI Elements in /admin/registrations
  // ---------------------------------------------------------------------------
  console.log("[Test 1/8] Verifying /admin/registrations page structure & available actions...");
  try {
    const adminAuth = await login("admin@gdgoenka.ac.in", "Admin@2026");
    assert(adminAuth.ok, "Admin user authenticates successfully");

    const regPageRes = await fetch(`${BASE_URL}/admin/registrations`, {
      headers: { Cookie: adminAuth.cookie },
    });
    const regHtml = await regPageRes.text();

    assert(regPageRes.status === 200, "GET /admin/registrations returns HTTP 200");
    assert(
      regHtml.includes("Registration Directory") || regHtml.includes("Registration"),
      "Renders 'Registration' workspace"
    );

    // Verify component definitions in RegistrationTable, RegistrationDecisionModal, and RegistrationsPage
    const tableSource = fs.readFileSync(path.resolve("src/components/admin/RegistrationTable.tsx"), "utf-8");
    const modalSource = fs.readFileSync(path.resolve("src/components/admin/RegistrationDecisionModal.tsx"), "utf-8");
    const pageSource = fs.readFileSync(path.resolve("src/app/admin/registrations/page.tsx"), "utf-8");

    assert(tableSource.includes("Registration Status"), "Renders 'Registration Status' column header in table");
    assert(tableSource.includes("Payment Status"), "Renders 'Payment Status' column header in table");
    assert(tableSource.includes("Actions"), "Renders 'Actions' column header in table");
    assert(tableSource.includes("onApproveRegistration"), "Table supports 'onApproveRegistration' action");
    assert(tableSource.includes("onRejectRegistration"), "Table supports 'onRejectRegistration' action");
    assert(tableSource.includes("Payment Verification Pending"), "Table indicates 'Payment Verification Pending' when payment unverified");
    assert(modalSource.includes("Payment Verification Pending"), "Modal displays 'Payment Verification Pending' warning card");
    assert(modalSource.includes("Rejection Reason"), "Modal requires 'Rejection Reason' for rejection");
    assert(pageSource.includes("RegistrationDecisionModal"), "Page connects RegistrationDecisionModal for confirmation");
  } catch (err) {
    assert(false, `Test 1 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: RBAC Enforcement on /api/admin/students/verify
  // ---------------------------------------------------------------------------
  console.log("\n[Test 2/8] Verifying unauthorized users cannot approve or reject registrations...");
  try {
    // 2.1 Unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: "reg-001", action: "approve" }),
    });
    await unauthRes.text();
    assert(unauthRes.status === 401, "Unauthenticated request returns HTTP 401 Unauthorized");

    // 2.2 President role
    await new Promise((r) => setTimeout(r, 100));
    const presAuth = await login("president@gdgoenka.ac.in", "President@2026");
    const presRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: presAuth.cookie },
      body: JSON.stringify({ registrationId: "reg-001", action: "approve" }),
    });
    const presData = await presRes.json();
    assert(presRes.status === 403, "President role is forbidden from student verification (HTTP 403)");
    assert(presData.code === "ADMIN_REQUIRED_FOR_REGISTRATIONS", "President receives ADMIN_REQUIRED_FOR_REGISTRATIONS error code");

    // 2.3 Vice President role
    await new Promise((r) => setTimeout(r, 100));
    const vpAuth = await login("vp@gdgoenka.ac.in", "VP@2026");
    const vpRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: vpAuth.cookie },
      body: JSON.stringify({ registrationId: "reg-001", action: "approve" }),
    });
    const vpData = await vpRes.json();
    assert(vpRes.status === 403, "Vice President role is forbidden from student verification (HTTP 403)");
    assert(vpData.code === "ADMIN_REQUIRED_FOR_REGISTRATIONS", "VP receives ADMIN_REQUIRED_FOR_REGISTRATIONS error code");

    // 2.4 AVISHKAR Member role
    await new Promise((r) => setTimeout(r, 100));
    const memAuth = await login("member@gdgoenka.ac.in", "Member@2026");
    const memRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: memAuth.cookie },
      body: JSON.stringify({ registrationId: "reg-001", action: "approve" }),
    });
    const memData = await memRes.json();
    assert(memRes.status === 403, "Member role is forbidden from student verification (HTTP 403)");
    assert(memData.code === "ADMIN_REQUIRED_FOR_REGISTRATIONS", "Member receives ADMIN_REQUIRED_FOR_REGISTRATIONS error code");
  } catch (err) {
    assert(false, `Test 2 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Approval Blocked When Payment Verification Is Incomplete
  // ---------------------------------------------------------------------------
  console.log("\n[Test 3/8] Verifying approval is blocked when payment verification is pending...");
  try {
    await new Promise((r) => setTimeout(r, 100));
    const adminAuth = await login("admin@gdgoenka.ac.in", "Admin@2026");

    // Fetch existing registrations to find or reset one to pending payment
    const listRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
      headers: { Cookie: adminAuth.cookie },
    });
    const listData = await listRes.json();
    let registrations = listData.registrations || [];

    // If fewer than 2 registrations exist yet in this isolate, seed via public registration API
    if (registrations.length === 0) {
      const regForm = new FormData();
      regForm.append("studentName", "Rohit Kumar");
      regForm.append("email", "rohit.kumar@gdgoenka.ac.in");
      regForm.append("contactNumber", "9812345678");
      regForm.append("gender", "Male");
      regForm.append("studentId", "240160998877");
      regForm.append("school", "SOES");
      regForm.append("program", "Computer science and engineering AI&ML");
      regForm.append("yearOfJoining", "2024");
      regForm.append("reasonForJoining", "Passionate about autonomous systems and participating in the technical fest.");
      regForm.append("leadershipInterest", "Yes");
      regForm.append("transactionId", "TXN981234567800");
      regForm.append("paymentDate", "2026-10-12");
      const mockBlob = new Blob(["mock receipt content image data"], { type: "image/png" });
      regForm.append("receiptFile", mockBlob, "receipt.png");
      const submitRes = await fetch(`${BASE_URL}/api/register`, { method: "POST", body: regForm });
      await submitRes.json();
    }

    if (registrations.length < 2) {
      const regForm2 = new FormData();
      regForm2.append("studentName", "Ananya Sharma");
      regForm2.append("email", "ananya.sharma@gdgoenka.ac.in");
      regForm2.append("contactNumber", "9812345679");
      regForm2.append("gender", "Female");
      regForm2.append("studentId", "240160998878");
      regForm2.append("school", "SOES");
      regForm2.append("program", "Computer science and engineering AI&ML");
      regForm2.append("yearOfJoining", "2024");
      regForm2.append("reasonForJoining", "Robotics and innovation.");
      regForm2.append("leadershipInterest", "No");
      regForm2.append("transactionId", "TXN981234567801");
      regForm2.append("paymentDate", "2026-10-12");
      const mockBlob2 = new Blob(["mock receipt content image data 2"], { type: "image/png" });
      regForm2.append("receiptFile", mockBlob2, "receipt2.png");
      const submitRes2 = await fetch(`${BASE_URL}/api/register`, { method: "POST", body: regForm2 });
      await submitRes2.json();

      const retryRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
        headers: { Cookie: adminAuth.cookie },
      });
      const retryData = await retryRes.json();
      registrations = retryData.registrations || [];
    }

    assert(registrations.length > 0, "Registration records exist in database");

    const targetReg = registrations[0];

    // Ensure payment is marked pending for this test
    // Let's create or use a test registration with pending payment
    // We can directly submit an approval on targetReg when its payment is pending
    // Let's first test what happens if payment is unverified:
    // If targetReg.payment_status is verified, let's reject it or find one with pending
    let pendingPaymentReg = registrations.find((r) => r.payment_status !== "verified");
    if (!pendingPaymentReg) {
      // Temporarily reject payment to make it unverified
      await fetch(`${BASE_URL}/api/admin/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
        body: JSON.stringify({
          registrationId: targetReg.id,
          action: "reject",
          rejectionReason: "Test payment pending check",
        }),
      });
      pendingPaymentReg = targetReg;
    }

    const blockedApproveRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
      body: JSON.stringify({
        registrationId: pendingPaymentReg.id,
        action: "approve",
        notes: "Trying to approve unverified payment",
      }),
    });
    const blockedData = await blockedApproveRes.json();

    assert(blockedApproveRes.status === 400, "Approval attempt with unverified payment returns HTTP 400 Bad Request");
    assert(blockedData.code === "PAYMENT_NOT_VERIFIED", "Error code is PAYMENT_NOT_VERIFIED");
    assert(
      blockedData.error.toLowerCase().includes("payment verification pending") ||
        blockedData.error.toLowerCase().includes("verified payment"),
      "Error explanation states that payment verification is pending"
    );
  } catch (err) {
    assert(false, `Test 3 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Verified Payment Allows Eligible Registration to be Approved
  // ---------------------------------------------------------------------------
  console.log("\n[Test 4/8] Verifying verified payment allows eligible registration approval...");
  try {
    const adminAuth = await login("admin@gdgoenka.ac.in", "Admin@2026");

    const listRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
      headers: { Cookie: adminAuth.cookie },
    });
    const listData = await listRes.json();
    const targetReg = listData.registrations[0];

    // Step 1: Verify payment in payments module first
    const payRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
      body: JSON.stringify({
        registrationId: targetReg.id,
        action: "approve",
        notes: "Bank statement UTR verified by administrator",
      }),
    });
    assert(payRes.ok, "Step 1: Payment verified successfully in Payments module");

    // Step 2: Now approve student registration
    const approveRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
      body: JSON.stringify({
        registrationId: targetReg.id,
        action: "approve",
        notes: "Student ID roster cross-referenced and confirmed",
      }),
    });
    const approveData = await approveRes.json();

    assert(approveRes.status === 200, "Step 2: Student registration approved successfully (HTTP 200)");
    assert(approveData.success === true, "Response payload indicates success = true");
    assert(approveData.registration.student_verification_status === "verified", "student_verification_status updated to 'verified'");
    assert(Boolean(approveData.verifiedAt), "verifiedAt timestamp is recorded");
    assert(approveData.verifiedBy === "admin@gdgoenka.ac.in", "verifiedBy records administrator identity");
  } catch (err) {
    assert(false, `Test 4 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Rejection Requires a Mandatory Reason
  // ---------------------------------------------------------------------------
  console.log("\n[Test 5/8] Verifying rejection requires a mandatory reason...");
  try {
    const adminAuth = await login("admin@gdgoenka.ac.in", "Admin@2026");
    const listRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
      headers: { Cookie: adminAuth.cookie },
    });
    const listData = await listRes.json();
    const targetReg = listData.registrations[1] || listData.registrations[0];

    // 5.1 Reject without reason
    const noReasonRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
      body: JSON.stringify({
        registrationId: targetReg.id,
        action: "reject",
        rejectionReason: "",
      }),
    });
    const noReasonData = await noReasonRes.json();

    assert(noReasonRes.status === 400, "Rejection without reason returns HTTP 400 Bad Request");
    assert(noReasonData.code === "REJECTION_REASON_REQUIRED", "Error code is REJECTION_REASON_REQUIRED");

    // 5.2 Reject with valid reason
    const reasonText = "Student ID not found in university ERP database";
    const rejectRes = await fetch(`${BASE_URL}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
      body: JSON.stringify({
        registrationId: targetReg.id,
        action: "reject",
        rejectionReason: reasonText,
        notes: "Queried Registrar ERP records with 0 matches",
      }),
    });
    const rejectData = await rejectRes.json();

    assert(rejectRes.status === 200, "Rejection with reason succeeds with HTTP 200 OK");
    assert(rejectData.registration.student_verification_status === "rejected", "student_verification_status updated to 'rejected'");
    assert(
      rejectData.registration.student_verification_notes?.includes(reasonText),
      "Rejection reason is recorded in student_verification_notes"
    );
  } catch (err) {
    assert(false, `Test 5 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Registration Status Persists Across Refreshes
  // ---------------------------------------------------------------------------
  console.log("\n[Test 6/8] Verifying registration decision persists in store...");
  try {
    const adminAuth = await login("admin@gdgoenka.ac.in", "Admin@2026");

    const refreshListRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
      headers: { Cookie: adminAuth.cookie },
    });
    const freshList = await refreshListRes.json();

    const verifiedReg = freshList.registrations.find((r) => r.student_verification_status === "verified");
    const rejectedReg = freshList.registrations.find((r) => r.student_verification_status === "rejected");

    assert(Boolean(verifiedReg), "Verified registration record persists on subsequent fetch");
    assert(Boolean(rejectedReg), "Rejected registration record persists on subsequent fetch");
    assert(
      verifiedReg.student_verified_by === "admin@gdgoenka.ac.in",
      "Persisted record retains administrator identity"
    );
  } catch (err) {
    assert(false, `Test 6 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Student Status Page Reflects the Decision
  // ---------------------------------------------------------------------------
  console.log("\n[Test 7/8] Verifying student status tracking reflects updated decisions...");
  try {
    const adminAuth = await login("admin@gdgoenka.ac.in", "Admin@2026");
    const listRes = await fetch(`${BASE_URL}/api/admin/registrations`, {
      headers: { Cookie: adminAuth.cookie },
    });
    const { registrations } = await listRes.json();

    const verifiedReg = registrations.find((r) => r.student_verification_status === "verified");
    const rejectedReg = registrations.find((r) => r.student_verification_status === "rejected");

    // 7.1 Verified student query
    if (verifiedReg) {
      const q = verifiedReg.student_id || verifiedReg.registration_number;
      const statusRes = await fetch(`${BASE_URL}/api/register/status?query=${encodeURIComponent(q)}`);
      const statusData = await statusRes.json();

      assert(statusRes.status === 200, "Student status endpoint returns HTTP 200 for verified student");
      assert(statusData.registration.studentVerificationStatus === "verified", "Public status API returns studentVerificationStatus = 'verified'");
      assert(statusData.registration.studentName === verifiedReg.student_name, "Public status matches student name");
    }

    // 7.2 Rejected student query
    if (rejectedReg) {
      const q = rejectedReg.student_id || rejectedReg.registration_number;
      const statusRes = await fetch(`${BASE_URL}/api/register/status?query=${encodeURIComponent(q)}`);
      const statusData = await statusRes.json();

      assert(statusRes.status === 200, "Student status endpoint returns HTTP 200 for rejected student");
      assert(statusData.registration.studentVerificationStatus === "rejected", "Public status API returns studentVerificationStatus = 'rejected'");
      assert(
        Boolean(statusData.registration.studentVerificationNotes),
        "Public status API returns studentVerificationNotes explaining rejection"
      );
    }

    // 7.3 Render /status page
    const statusPageRes = await fetch(`${BASE_URL}/status`);
    const statusHtml = await statusPageRes.text();
    assert(statusPageRes.status === 200, "Public /status page renders HTTP 200 OK");
    assert(statusHtml.includes("Registration"), "Status page renders Registration status tracker");
  } catch (err) {
    assert(false, `Test 7 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Existing Payment Verification & All 4 Portal Logins Preserved
  // ---------------------------------------------------------------------------
  console.log("\n[Test 8/8] Verifying existing payment verification and all 4 portal logins continue working...");
  try {
    // 8.1 President Portal
    const presAuth = await login("president@gdgoenka.ac.in", "President@2026");
    assert(presAuth.ok && presAuth.data.user.role === "President", "President portal login preserved");

    // 8.2 Vice President Portal
    const vpAuth = await login("vp@gdgoenka.ac.in", "VP@2026");
    assert(vpAuth.ok && vpAuth.data.user.role === "Vice President", "Vice President portal login preserved");

    // 8.3 Member Portal
    const memAuth = await login("member@gdgoenka.ac.in", "Member@2026");
    assert(memAuth.ok && memAuth.data.user.role === "AVISHKAR Member", "Member portal login preserved");

    // 8.4 Administrative Management Portal
    const adminAuth = await login("admin@gdgoenka.ac.in", "Admin@2026");
    assert(adminAuth.ok && adminAuth.data.user.role === "Admin", "Administrative Management portal login preserved");

    // 8.5 Payment verification queue remains operational
    const paymentsRes = await fetch(`${BASE_URL}/admin/payments`, {
      headers: { Cookie: adminAuth.cookie },
    });
    assert(paymentsRes.status === 200, "/admin/payments route renders successfully");
  } catch (err) {
    assert(false, `Test 8 error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`Results: ${passed}/${total} assertions passed.`);
  console.log("================================================================================");

  if (passed === total) {
    console.log("🎉 ALL STUDENT REGISTRATION APPROVAL & VERIFICATION TESTS PASSED!");
  } else {
    console.error("❌ Some tests failed. Please review the output above.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
