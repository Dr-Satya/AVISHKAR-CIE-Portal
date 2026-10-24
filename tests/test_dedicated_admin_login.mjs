// tests/test_dedicated_admin_login.mjs
// Verification suite for dedicated Administrative Management Login Page

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function run() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Dedicated Administrative Management Login Page Test Suite");
  console.log(`Base URL: ${BASE_URL}`);
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

  // 1. Portal selection page displays all 4 portals
  console.log("[1/5] Verifying Portal Selection displays all 4 portals...");
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gdgoenka.ac.in", password: "Admin@2026" }),
    });
    const adminCookie = adminLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: adminCookie },
    });
    const dashHtml = await dashRes.text();

    assert(dashRes.status === 200, "Portal Selection page returns HTTP 200");
    assert(dashHtml.includes("President Portal"), "Card 1: President Portal renders");
    assert(dashHtml.includes("Vice President Portal"), "Card 2: Vice President Portal renders");
    assert(dashHtml.includes("Member Portal"), "Card 3: Member Portal renders");
    assert(dashHtml.includes("Administrative Management Portal"), "Card 4: Administrative Management Portal renders");
    assert(dashHtml.includes("/admin/president/login"), "President card links to /admin/president/login");
    assert(dashHtml.includes("/admin/vice-president/login"), "Vice President card links to /admin/vice-president/login");
    assert(dashHtml.includes("/admin/member/login"), "Member card links to /admin/member/login");
    assert(dashHtml.includes("/admin/management/login"), "Administrative Management card links to /admin/management/login");
  } catch (err) {
    assert(false, `Portal selection check error: ${err.message}`);
  }

  // 2. Dedicated login page renders required elements
  console.log("\n[2/5] Verifying dedicated administrator login page elements...");
  try {
    const loginRes = await fetch(`${BASE_URL}/admin/management/login`);
    const loginHtml = await loginRes.text();

    assert(loginRes.status === 200, "/admin/management/login returns HTTP 200");
    assert(loginHtml.includes("AVISHKAR 2026"), "Renders AVISHKAR 2026 branding");
    assert(loginHtml.includes("Administrative Management"), "Renders heading 'Administrative Management'");
    assert(!loginHtml.includes("Sign in to access the administration dashboard."), "Subtitle 'Sign in to access the administration dashboard.' is removed");
    assert(loginHtml.includes("/images/avishkar-logo.png"), "Renders official AVISHKAR logo (/images/avishkar-logo.png)");
    assert(!loginHtml.includes("/images/avishkar-lotus-logo.png"), "Does NOT use generic lotus logo");
    assert(loginHtml.includes("Official Email"), "Renders Official Email field label");
    assert(loginHtml.includes("Password"), "Renders Password field label");
    assert(loginHtml.includes("Back to Portal Selection"), "Renders Back to Portal Selection link");
    assert(loginHtml.includes("/admin/dashboard"), "Back to Portal Selection navigates to /admin/dashboard");
  } catch (err) {
    assert(false, `Login page render error: ${err.message}`);
  }

  // 3. Authentication & Security
  console.log("\n[3/5] Verifying authentication & security boundaries...");
  try {
    // Missing credentials
    const emptyRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "", password: "", expectedRole: "Admin" }),
    });
    assert(emptyRes.status === 400, "Missing credentials rejected with HTTP 400");

    // Invalid credentials
    const invalidRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gdgoenka.ac.in", password: "BadPassword@123", expectedRole: "Admin" }),
    });
    assert(invalidRes.status === 401, "Invalid password rejected with HTTP 401");

    // Role mismatch: Non-admin trying to authenticate at Admin login
    const mismatchRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "member@gdgoenka.ac.in", password: "Member@2026", expectedRole: "Admin" }),
    });
    const mismatchData = await mismatchRes.json();
    assert(mismatchRes.status === 403, "Non-admin account denied at Admin login (HTTP 403)");
    assert(mismatchData.code === "ROLE_MISMATCH", "Error code is ROLE_MISMATCH");

    // Valid admin credentials succeed
    const validRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gdgoenka.ac.in", password: "Admin@2026", expectedRole: "Admin" }),
    });
    const validData = await validRes.json();
    assert(validRes.status === 200, "Valid admin credentials succeed (HTTP 200)");
    assert(validData.user?.role === "Admin", "User role is Admin");
    assert(validRes.headers.get("set-cookie") !== null, "Session cookie issued");
  } catch (err) {
    assert(false, `Auth check error: ${err.message}`);
  }

  // 4. Role-based login preservation
  console.log("\n[4/5] Verifying existing President, VP, and Member login flows continue working...");
  const roleChecks = [
    { role: "President", email: "president@gdgoenka.ac.in", pass: "President@2026" },
    { role: "Vice President", email: "vp@gdgoenka.ac.in", pass: "VP@2026" },
    { role: "AVISHKAR Member", email: "member@gdgoenka.ac.in", pass: "Member@2026" },
  ];

  for (const { role, email, pass } of roleChecks) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, expectedRole: role }),
      });
      const data = await res.json();
      assert(res.status === 200 && data.user?.role === role, `${role} login succeeds and preserves role`);
    } catch (err) {
      assert(false, `${role} login error: ${err.message}`);
    }
  }

  // 5. Protected management routes access control
  console.log("\n[5/5] Verifying protected routes enforcement...");
  try {
    const unauthEventsRes = await fetch(`${BASE_URL}/api/admin/events`);
    assert(unauthEventsRes.status === 401, "/api/admin/events blocks unauthenticated access (HTTP 401)");

    const unauthPaymentsRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: "test", action: "approve" }),
    });
    assert(unauthPaymentsRes.status === 401, "/api/admin/payments/verify blocks unauthenticated access (HTTP 401)");
  } catch (err) {
    assert(false, `Protected route error: ${err.message}`);
  }

  console.log("\n================================================================================");
  console.log(`Results: ${passed}/${total} assertions passed.`);
  console.log("================================================================================");
}

run();
