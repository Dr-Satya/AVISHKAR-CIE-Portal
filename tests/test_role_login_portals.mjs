// tests/test_role_login_portals.mjs
// Automated verification suite for AVISHKAR-v2 Separate Role Login Portals & Role Verification

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function run() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Separate Role Login Portals Verification Suite");
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

  // --------------------------------------------------------------------------
  // SECTION 1: Portal Selection Page Navigation Links
  // --------------------------------------------------------------------------
  console.log("[1/6] Verifying Portal Selection (/admin/dashboard) links to dedicated login routes...");
  try {
    const dashCode = fs.readFileSync(path.resolve("src/app/admin/dashboard/page.tsx"), "utf8");
    assert(dashCode.includes("/admin/president/login"), "President card points to /admin/president/login in source");
    assert(dashCode.includes("/admin/vice-president/login"), "Vice President card points to /admin/vice-president/login in source");
    assert(dashCode.includes("/admin/member/login"), "Member card points to /admin/member/login in source");

    // Authenticate as Admin first to access /admin/dashboard
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
    assert(dashHtml.includes("/admin/president/login"), "Portal Selection page renders /admin/president/login");
    assert(dashHtml.includes("/admin/vice-president/login"), "Portal Selection page renders /admin/vice-president/login");
    assert(dashHtml.includes("/admin/member/login"), "Portal Selection page renders /admin/member/login");
  } catch (err) {
    assert(false, `Portal selection check error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 2: Dedicated Role Login Screens Content & Branding
  // --------------------------------------------------------------------------
  console.log("\n[2/6] Verifying dedicated role login screens render official branding and inputs...");
  const roleScreens = [
    {
      path: "/admin/president/login",
      roleHeading: "President Login",
      expectedRole: "President",
    },
    {
      path: "/admin/vice-president/login",
      roleHeading: "Vice President Login",
      expectedRole: "Vice President",
    },
    {
      path: "/admin/member/login",
      roleHeading: "Member Login",
      expectedRole: "AVISHKAR Member",
    },
  ];

  for (const screen of roleScreens) {
    try {
      const res = await fetch(`${BASE_URL}${screen.path}`);
      const html = await res.text();
      assert(res.status === 200, `${screen.path} returns HTTP 200`);
      assert(html.includes("AVISHKAR 2026"), `${screen.path} contains AVISHKAR 2026 branding`);
      assert(html.includes(screen.roleHeading), `${screen.path} renders heading '${screen.roleHeading}'`);
      assert(html.includes("Official Email"), `${screen.path} contains official email input label`);
      assert(html.includes("Password"), `${screen.path} contains password input label`);
      assert(html.includes("Back to Portal Selection"), `${screen.path} has Back to Portal Selection link`);
    } catch (err) {
      assert(false, `${screen.path} page render error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 3: Valid Credentials Role Authentication & Redirect Targets
  // --------------------------------------------------------------------------
  console.log("\n[3/6] Verifying valid credentials authenticate successfully for their designated roles...");
  let presidentCookie = "";
  let vpCookie = "";
  let memberCookie = "";

  try {
    // 3.1 President Login
    const presRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "president@gdgoenka.ac.in",
        password: "President@2026",
        expectedRole: "President",
      }),
    });
    const presData = await presRes.json();
    presidentCookie = presRes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(presRes.status === 200 && presData.success, "President authentication succeeds with HTTP 200");
    assert(presData.user?.role === "President", "Authenticated user role is 'President'");
    assert(Boolean(presidentCookie), "President session cookie received");

    // 3.2 Vice President Login
    const vpRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "vp@gdgoenka.ac.in",
        password: "VP@2026",
        expectedRole: "Vice President",
      }),
    });
    const vpData = await vpRes.json();
    vpCookie = vpRes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(vpRes.status === 200 && vpData.success, "Vice President authentication succeeds with HTTP 200");
    assert(vpData.user?.role === "Vice President", "Authenticated user role is 'Vice President'");
    assert(Boolean(vpCookie), "Vice President session cookie received");

    // 3.3 Member Login
    const memRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "member@gdgoenka.ac.in",
        password: "Member@2026",
        expectedRole: "AVISHKAR Member",
      }),
    });
    const memData = await memRes.json();
    memberCookie = memRes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(memRes.status === 200 && memData.success, "Member authentication succeeds with HTTP 200");
    assert(memData.user?.role === "AVISHKAR Member", "Authenticated user role is 'AVISHKAR Member'");
    assert(Boolean(memberCookie), "Member session cookie received");
  } catch (err) {
    assert(false, `Valid auth error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 4: Server-Side Strict Role Enforcement (Wrong Role Denied)
  // --------------------------------------------------------------------------
  console.log("\n[4/6] Verifying server denies wrong-role credentials and does not issue elevated sessions...");
  try {
    // 4.1 Member credentials at President Portal
    const wrongPresRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "member@gdgoenka.ac.in",
        password: "Member@2026",
        expectedRole: "President",
      }),
    });
    const wrongPresData = await wrongPresRes.json();
    const wrongPresCookie = wrongPresRes.headers.get("set-cookie");
    assert(wrongPresRes.status === 403, "Member logging into President Portal is denied with HTTP 403");
    assert(wrongPresData.code === "ROLE_MISMATCH", "Error code is ROLE_MISMATCH");
    assert(!wrongPresCookie, "No elevated session cookie is issued for role mismatch");

    // 4.2 Admin credentials at President Portal
    const adminPresRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gdgoenka.ac.in",
        password: "Admin@2026",
        expectedRole: "President",
      }),
    });
    assert(adminPresRes.status === 403, "Admin credentials denied at President Portal (HTTP 403)");

    // 4.3 President credentials at Vice President Portal
    const presVpRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "president@gdgoenka.ac.in",
        password: "President@2026",
        expectedRole: "Vice President",
      }),
    });
    assert(presVpRes.status === 403, "President credentials denied at Vice President Portal (HTTP 403)");

    // 4.4 VP credentials at Member Portal
    const vpMemRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "vp@gdgoenka.ac.in",
        password: "VP@2026",
        expectedRole: "AVISHKAR Member",
      }),
    });
    assert(vpMemRes.status === 403, "Vice President credentials denied at Member Portal (HTTP 403)");

    // 4.5 Invalid password on role portal
    const badPassRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "president@gdgoenka.ac.in",
        password: "WrongPassword999!",
        expectedRole: "President",
      }),
    });
    assert(badPassRes.status === 401, "Invalid password returns HTTP 401");
  } catch (err) {
    assert(false, `Security role mismatch test error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 5: Authorized Dashboards Render & Session APIs Provide Full Features
  // --------------------------------------------------------------------------
  console.log("\n[5/6] Verifying authenticated role sessions receive full dashboard authorization...");
  try {
    // 5.1 President Dashboard & APIs
    const presMeRes = await fetch(`${BASE_URL}/api/admin/auth/me`, {
      headers: { Cookie: presidentCookie },
    });
    const presMeData = await presMeRes.json();
    assert(presMeRes.status === 200 && presMeData.user?.role === "President", "President session verified via /api/admin/auth/me");

    const presEventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
      headers: { Cookie: presidentCookie },
    });
    const presEventsData = await presEventsRes.json();
    assert(presEventsRes.status === 200 && Array.isArray(presEventsData.events), "President can query full proposal queue");

    const presAuditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Cookie: presidentCookie },
    });
    const presAuditData = await presAuditRes.json();
    assert(presAuditRes.status === 200 && Array.isArray(presAuditData.auditLogs), "President can access audit logs for governance oversight");

    const presPageRes = await fetch(`${BASE_URL}/admin/president`, {
      headers: { Cookie: presidentCookie },
    });
    assert(presPageRes.status === 200, "/admin/president loads successfully (HTTP 200) for President");

    // 5.2 VP Dashboard & APIs
    const vpMeRes = await fetch(`${BASE_URL}/api/admin/auth/me`, {
      headers: { Cookie: vpCookie },
    });
    const vpMeData = await vpMeRes.json();
    assert(vpMeRes.status === 200 && vpMeData.user?.role === "Vice President", "VP session verified via /api/admin/auth/me");

    const vpTasksRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
      headers: { Cookie: vpCookie },
    });
    const vpTasksData = await vpTasksRes.json();
    assert(vpTasksRes.status === 200 && Array.isArray(vpTasksData.tasks), "VP can query committee task assignments");

    const vpPageRes = await fetch(`${BASE_URL}/admin/vice-president`, {
      headers: { Cookie: vpCookie },
    });
    assert(vpPageRes.status === 200, "/admin/vice-president loads successfully (HTTP 200) for VP");

    // 5.3 Member Workspace & APIs
    const memMeRes = await fetch(`${BASE_URL}/api/admin/auth/me`, {
      headers: { Cookie: memberCookie },
    });
    const memMeData = await memMeRes.json();
    assert(memMeRes.status === 200 && memMeData.user?.role === "AVISHKAR Member", "Member session verified via /api/admin/auth/me");

    const memEventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
      headers: { Cookie: memberCookie },
    });
    const memEventsData = await memEventsRes.json();
    assert(memEventsRes.status === 200 && Array.isArray(memEventsData.events), "Member can access own proposal stream");

    const memPageRes = await fetch(`${BASE_URL}/admin/member`, {
      headers: { Cookie: memberCookie },
    });
    assert(memPageRes.status === 200, "/admin/member loads successfully (HTTP 200) for Member");
  } catch (err) {
    assert(false, `Authorized dashboard verification error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 6: Cross-Portal Role Authorization Boundaries
  // --------------------------------------------------------------------------
  console.log("\n[6/6] Verifying server enforces role boundaries across portals...");
  try {
    // 6.1 Member forbidden from approving events
    const memberApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: memberCookie },
      body: JSON.stringify({ eventId: "evt-test", action: "approve" }),
    });
    assert(memberApproveRes.status === 403, "Member is forbidden from approving proposals (HTTP 403)");

    // 6.2 Member forbidden from assigning tasks to others
    const memberTaskRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: memberCookie },
      body: JSON.stringify({
        title: "Unauthorized task",
        eventId: "evt-test",
        memberId: "usr_other",
      }),
    });
    assert(memberTaskRes.status === 403, "Member is forbidden from assigning tasks (HTTP 403)");

    // 6.3 VP forbidden from verifying payments
    const vpPayRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: vpCookie },
      body: JSON.stringify({ registrationId: "reg-test", action: "approve" }),
    });
    assert(vpPayRes.status === 403, "VP is forbidden from payment verification (HTTP 403 ADMIN_REQUIRED_FOR_PAYMENTS)");

    // 6.4 President forbidden from verifying payments
    const presPayRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: presidentCookie },
      body: JSON.stringify({ registrationId: "reg-test", action: "approve" }),
    });
    assert(presPayRes.status === 403, "President is forbidden from payment verification (HTTP 403 ADMIN_REQUIRED_FOR_PAYMENTS)");
  } catch (err) {
    assert(false, `Cross-portal authorization boundary test error: ${err.message}`);
  }

  console.log("\n================================================================================");
  console.log(`Results: ${passed} passed, ${total - passed} failed, ${total} total assertions`);
  if (passed === total) {
    console.log("🎉 ALL SEPARATE ROLE LOGIN PORTALS TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exitCode = 1;
  }
  console.log("================================================================================\n");
}

run().catch((err) => {
  console.error("Unexpected test suite execution failure:", err);
  process.exit(1);
});
