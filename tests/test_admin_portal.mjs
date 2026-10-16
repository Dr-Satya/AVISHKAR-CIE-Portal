// tests/test_admin_portal.mjs
// Automated verification test suite for AVISHKAR-v2 Admin Portal

import fs from "fs";
import path from "path";

async function runAdminPortalTests() {
  console.log("============================================================");
  console.log("AVISHKAR 2026 — Admin Portal Security & Functional Test Suite");
  console.log("============================================================\n");

  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Source Code & Architectural Hardening Checks
  // --------------------------------------------------------------------------
  console.log("--- 1. Security & Configuration Checks ---");

  // Check 1.1: Migration 004 exists and adds non-destructive student verification columns
  const mig4Path = path.resolve("supabase/migrations/004_student_verification.sql");
  assert(fs.existsSync(mig4Path), "Migration 004 file exists");
  const mig4Content = fs.readFileSync(mig4Path, "utf8");
  assert(
    mig4Content.includes("ADD COLUMN IF NOT EXISTS student_verification_status"),
    "Migration 004 defines student_verification_status with IF NOT EXISTS"
  );
  assert(
    mig4Content.includes("DEFAULT 'pending'"),
    "Migration 004 sets safe default 'pending' for backward compatibility"
  );

  // Check 1.2: No hardcoded secrets or service role keys exposed in client bundles
  const clientFiles = [
    "src/app/admin/login/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/registrations/page.tsx",
    "src/app/admin/payments/page.tsx",
    "src/components/admin/AdminSidebar.tsx",
  ];
  let noClientSecrets = true;
  for (const f of clientFiles) {
    const fullPath = path.resolve(f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("secret_") || content.includes("admin123")) {
        noClientSecrets = false;
      }
    }
  }
  assert(noClientSecrets, "No hardcoded passwords or server secrets in client components");

  // Check 1.3: Pre-launch registration gate intact (HTTP 423)
  const regRoutePath = path.resolve("src/app/api/register/route.ts");
  const regRouteContent = fs.readFileSync(regRoutePath, "utf8");
  assert(
    regRouteContent.includes("isOfficialPaymentConfigured()") && regRouteContent.includes("status: 423"),
    "Public registration endpoint remains strictly locked behind HTTP 423 pre-launch gate"
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Authentication Handshake & Server Authorization
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Server-Enforced Authentication & Protected Endpoints ---");

  // Check 2.1: Missing credentials on login endpoint
  try {
    const loginEmptyRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "", password: "" }),
    });
    const loginEmptyData = await loginEmptyRes.json();
    assert(
      loginEmptyRes.status === 400 && loginEmptyData.code === "MISSING_CREDENTIALS",
      "POST /api/admin/auth/login rejects empty credentials with HTTP 400 MISSING_CREDENTIALS"
    );
  } catch (err) {
    assert(false, `POST /api/admin/auth/login error: ${err.message}`);
  }

  // Check 2.2: Invalid credentials rejected
  try {
    const invalidAuthRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unauthorized_tester@gdgu.org", password: "wrong-password-999" }),
    });
    const invalidAuthData = await invalidAuthRes.json();
    assert(
      invalidAuthRes.status === 401 && invalidAuthData.success === false,
      "POST /api/admin/auth/login rejects invalid credentials with HTTP 401"
    );
  } catch (err) {
    assert(false, `POST /api/admin/auth/login network error: ${err.message}`);
  }

  // Check 2.3: Protected GET /api/admin/auth/me rejects unauthenticated callers
  try {
    const meRes = await fetch(`${baseUrl}/api/admin/auth/me`);
    assert(
      meRes.status === 401,
      "GET /api/admin/auth/me rejects unauthenticated access with HTTP 401 Unauthorized"
    );
  } catch (err) {
    assert(false, `GET /api/admin/auth/me error: ${err.message}`);
  }

  // Check 2.4: Protected GET /api/admin/stats rejects unauthenticated callers
  try {
    const statsRes = await fetch(`${baseUrl}/api/admin/stats`);
    assert(
      statsRes.status === 401,
      "GET /api/admin/stats protects database registration metrics with HTTP 401 Unauthorized"
    );
  } catch (err) {
    assert(false, `GET /api/admin/stats error: ${err.message}`);
  }

  // Check 2.5: Protected GET /api/admin/registrations rejects unauthenticated callers
  try {
    const regsRes = await fetch(`${baseUrl}/api/admin/registrations`);
    assert(
      regsRes.status === 401,
      "GET /api/admin/registrations protects student personal data with HTTP 401 Unauthorized"
    );
  } catch (err) {
    assert(false, `GET /api/admin/registrations error: ${err.message}`);
  }

  // Check 2.6: Protected GET /api/admin/receipt protects private storage receipts
  try {
    const receiptRes = await fetch(
      `${baseUrl}/api/admin/receipt?path=payment-receipts/AVISHKAR-2026-test.png`
    );
    assert(
      receiptRes.status === 401,
      "GET /api/admin/receipt protects private storage bucket receipts with HTTP 401 Unauthorized"
    );
  } catch (err) {
    assert(false, `GET /api/admin/receipt error: ${err.message}`);
  }

  // Check 2.7: Protected POST /api/admin/payments/verify rejects unauthenticated callers
  try {
    const payVerifyRes = await fetch(`${baseUrl}/api/admin/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: "test-id", action: "approve" }),
    });
    assert(
      payVerifyRes.status === 401,
      "POST /api/admin/payments/verify enforces server-side admin check with HTTP 401 Unauthorized"
    );
  } catch (err) {
    assert(false, `POST /api/admin/payments/verify error: ${err.message}`);
  }

  // Check 2.8: Protected POST /api/admin/students/verify rejects unauthenticated callers
  try {
    const stuVerifyRes = await fetch(`${baseUrl}/api/admin/students/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: "test-id", action: "approve" }),
    });
    assert(
      stuVerifyRes.status === 401,
      "POST /api/admin/students/verify enforces server-side admin check with HTTP 401 Unauthorized"
    );
  } catch (err) {
    assert(false, `POST /api/admin/students/verify error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Frontend Route Availability & Institutional Branding
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Page Routes Availability ---");

  // Check 3.1: Admin login page renders (HTTP 200) with transparent logo, clean placeholders, and no setup guide
  try {
    const loginPageRes = await fetch(`${baseUrl}/admin/login`);
    const loginPageHtml = await loginPageRes.text();
    const hasBranding =
      loginPageHtml.includes("AVISHKAR") && loginPageHtml.includes("GD Goenka");
    const noBlueTile = !loginPageHtml.includes("bg-[#193F88] border-2 border-[#2A5AB0]");
    const cleanEmailPlaceholder =
      loginPageHtml.includes("Enter your official email") &&
      !loginPageHtml.includes("placeholder=\"admin@gdgu.org\"");
    const cleanPasswordPlaceholder =
      loginPageHtml.includes("Enter your password") &&
      !loginPageHtml.includes("placeholder=\"••••••••••••\"");
    const noSetupGuide = !loginPageHtml.includes("First-time administrator setup guide");

    assert(
      loginPageRes.status === 200 && hasBranding,
      "GET /admin/login renders successfully with AVISHKAR & GD Goenka branding"
    );
    assert(
      noBlueTile,
      "Admin login logo renders on transparent background without blue container tile or box"
    );
    assert(
      cleanEmailPlaceholder && cleanPasswordPlaceholder,
      "Admin login inputs have clean placeholders ('Enter your official email' / 'Enter your password') with no prefilled values"
    );
    assert(
      noSetupGuide,
      "Admin login page has removed the expandable setup-guide section and unused UI elements"
    );
  } catch (err) {
    assert(false, `GET /admin/login error: ${err.message}`);
  }

  // Check 3.2: Admin dashboard renders (HTTP 200)
  try {
    const adminPageRes = await fetch(`${baseUrl}/admin`);
    assert(
      adminPageRes.status === 200,
      "GET /admin dashboard page renders successfully (HTTP 200)"
    );
  } catch (err) {
    assert(false, `GET /admin error: ${err.message}`);
  }

  // Check 3.3: Admin registrations directory renders (HTTP 200)
  try {
    const regsPageRes = await fetch(`${baseUrl}/admin/registrations`);
    assert(
      regsPageRes.status === 200,
      "GET /admin/registrations renders successfully (HTTP 200)"
    );
  } catch (err) {
    assert(false, `GET /admin/registrations error: ${err.message}`);
  }

  // Check 3.4: Admin payments queue renders (HTTP 200)
  try {
    const paymentsPageRes = await fetch(`${baseUrl}/admin/payments`);
    assert(
      paymentsPageRes.status === 200,
      "GET /admin/payments renders successfully (HTTP 200)"
    );
  } catch (err) {
    assert(false, `GET /admin/payments error: ${err.message}`);
  }

  // Check 3.5: Admin setup & security guide renders (HTTP 200)
  try {
    const setupPageRes = await fetch(`${baseUrl}/admin/setup`);
    assert(
      setupPageRes.status === 200,
      "GET /admin/setup renders successfully (HTTP 200)"
    );
  } catch (err) {
    assert(false, `GET /admin/setup error: ${err.message}`);
  }

  // Check 3.6: Strict separation - public navigation does not leak admin portal links, preserves Student Registration
  try {
    const homeRes = await fetch(`${baseUrl}/`);
    const homeHtml = await homeRes.text();
    const noAdminPortalInNav =
      !homeHtml.includes("href=\"/admin/login\"") && !homeHtml.includes("Admin Portal");
    const hasStudentRegLink =
      homeHtml.includes("/register") && homeHtml.includes("Student Registration");

    assert(
      homeRes.status === 200 && noAdminPortalInNav,
      "Homepage top navigation strictly keeps admin portal separate (no admin portal link in header)"
    );
    assert(
      homeRes.status === 200 && hasStudentRegLink,
      "Homepage top navigation preserves 'Student Registration' button pointing to /register"
    );
  } catch (err) {
    assert(false, `Homepage navigation check error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`Results: ${passed}/${total} Admin Portal tests passed.`);
  console.log("============================================================");

  if (passed === total) {
    console.log("🎉 All Admin Portal tests passed successfully!\n");
  } else {
    console.error("❌ Some tests failed. Please review errors above.\n");
    process.exit(1);
  }
}

runAdminPortalTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
