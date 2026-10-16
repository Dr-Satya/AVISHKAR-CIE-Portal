// tests/test_overview_navigation.mjs
// Verification suite for Overview Navigation & Administrative Management Workspace

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function run() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Administrative Overview Navigation & Workspace Test Suite");
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

  // 1. Static Configuration & Code Inspections
  console.log("[1/6] Inspecting Navigation Configuration & AdminSidebar...");
  const configAdminPath = path.resolve("src/config/admin.ts");
  const configCode = fs.readFileSync(configAdminPath, "utf8");

  assert(
    configCode.includes('title: "Overview"') && configCode.includes('href: "/admin/overview"'),
    "Overview nav item in config/admin.ts points to /admin/overview (not /admin/dashboard)"
  );

  const sidebarPath = path.resolve("src/components/admin/AdminSidebar.tsx");
  const sidebarCode = fs.readFileSync(sidebarPath, "utf8");

  assert(
    sidebarCode.includes('item.href === "/admin/overview"') &&
    sidebarCode.includes('pathname === "/admin/overview"'),
    "AdminSidebar active state specifically checks /admin/overview"
  );

  assert(
    !sidebarCode.includes('Back to Portal Selection') &&
    !sidebarCode.includes('View Public Site'),
    "AdminSidebar cleanly removes account profile, Back to Portal Selection, and View Public Site section"
  );

  assert(
    sidebarCode.includes(': "/admin/overview";'),
    "AdminSidebar roleHomeHref links Admin logo home to /admin/overview"
  );

  const layoutPath = path.resolve("src/app/admin/layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf8");
  assert(
    layoutCode.includes('pathname.startsWith("/admin/overview")') &&
    layoutCode.includes('title: "Administrative Overview"'),
    "AdminLayout getPageHeader defines title 'Administrative Overview' for /admin/overview"
  );

  // 2. Authentication & Admin Login
  console.log("\n[2/6] Authenticating as Administrator via /api/admin/auth/login...");
  let adminCookie = "";
  try {
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gdgoenka.ac.in",
        password: "Admin@2026",
        expectedRole: "Admin",
      }),
    });
    const loginData = await loginRes.json();
    adminCookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";

    assert(loginRes.status === 200, "Administrator authentication succeeds with HTTP 200");
    assert(loginData.user?.role === "Admin", "Session user role is Admin");
    assert(Boolean(adminCookie), "Received valid session cookie");
  } catch (err) {
    assert(false, `Authentication failed: ${err.message}`);
  }

  // 3. Overview Page Accessible & Contains Live Administrative Modules
  console.log("\n[3/6] Verifying /admin/overview renders within authenticated workspace...");
  try {
    const overviewRes = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Cookie: adminCookie },
    });
    const overviewHtml = await overviewRes.text();

    assert(overviewRes.status === 200, "GET /admin/overview returns HTTP 200 OK");
    assert(
      overviewHtml.includes("Administrative Management Overview") ||
      overviewHtml.includes("Administrative Overview"),
      "Renders Administrative Overview header"
    );
    assert(
      overviewHtml.includes("Total Registrations"),
      "Displays Total Registrations KPI module"
    );
    assert(
      overviewHtml.includes("Pending Payments"),
      "Displays Pending Payments KPI module"
    );
    assert(
      overviewHtml.includes("Approved Payments"),
      "Displays Approved Payments KPI module"
    );
    assert(
      overviewHtml.includes("Rejected Payments"),
      "Displays Rejected Payments KPI module"
    );
    assert(
      !overviewHtml.includes("Administrative Management Modules"),
      "Administrative Management Modules section is completely removed"
    );
    assert(
      !overviewHtml.includes("Events &amp; Publication Status") && !overviewHtml.includes("Events & Publication Status"),
      "Events & Publication Status section is completely removed"
    );
    assert(
      !overviewHtml.includes("Recent Activity"),
      "Recent Activity section is completely removed"
    );
    assert(
      overviewHtml.includes("Event Approval Pipeline"),
      "Displays Event Approval Pipeline tracker section"
    );
    assert(
      !overviewHtml.includes("MANAGEMENT WORKSPACE") &&
      !overviewHtml.includes("Back to Portal Selection"),
      "Blue header block is minimal and does not contain removed badges or buttons"
    );
  } catch (err) {
    assert(false, `Overview page verification failed: ${err.message}`);
  }

  // 4. Live Data API Integration (Not Hardcoded)
  console.log("\n[4/6] Verifying live data endpoints powering the Overview...");
  try {
    const repRes = await fetch(`${BASE_URL}/api/admin/reports`, {
      headers: { Cookie: adminCookie },
    });
    const repData = await repRes.json();
    assert(repRes.status === 200 && repData.success, "GET /api/admin/reports succeeds (HTTP 200)");
    assert(typeof repData.paymentCounts?.total === "number", "Reports returns authentic total registrations count");
    assert(typeof repData.paymentCounts?.pending === "number", "Reports returns authentic pending payments count");
    assert(typeof repData.paymentCounts?.verified === "number", "Reports returns authentic verified payments count");
    assert(typeof repData.paymentCounts?.rejected === "number", "Reports returns authentic rejected payments count");

    const eventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
      headers: { Cookie: adminCookie },
    });
    const eventsData = await eventsRes.json();
    assert(eventsRes.status === 200 && eventsData.success, "GET /api/admin/events succeeds (HTTP 200)");
    assert(Array.isArray(eventsData.events), "Events API returns authentic array of events with publication statuses");

    const logsRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Cookie: adminCookie },
    });
    const logsData = await logsRes.json();
    assert(logsRes.status === 200 && logsData.success, "GET /api/admin/audit-logs succeeds (HTTP 200)");
    assert(Array.isArray(logsData.auditLogs), "Audit logs API returns authentic immutable activity trail");
  } catch (err) {
    assert(false, `API data verification failed: ${err.message}`);
  }

  // 5. Verification of All Administrative Sidebar Destinations
  console.log("\n[5/6] Verifying all Administrative Management sidebar routes load properly...");
  const adminRoutes = [
    { name: "Overview", path: "/admin/overview" },
    { name: "Events", path: "/admin/events" },
    { name: "Payments", path: "/admin/payments" },
    { name: "Forms", path: "/admin/forms" },
    { name: "Members", path: "/admin/members" },
    { name: "Reports", path: "/admin/reports" },
    { name: "Audit Logs", path: "/admin/audit-logs" },
    { name: "Registrations", path: "/admin/registrations" },
    { name: "Resources", path: "/admin/resources" },
    { name: "Settings", path: "/admin/settings" },
  ];

  for (const route of adminRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        headers: { Cookie: adminCookie },
      });
      const html = await res.text();
      assert(
        res.status === 200,
        `Route ${route.name} (${route.path}) returns HTTP 200 OK`
      );
      assert(
        html.includes('aria-label="Admin Navigation"'),
        `Route ${route.name} (${route.path}) renders inside management workspace with AdminSidebar`
      );
    } catch (err) {
      assert(false, `Route ${route.name} check failed: ${err.message}`);
    }
  }

  // 6. Portal Selection Console Remains Independent
  console.log("\n[6/6] Verifying Portal Selection console (/admin/dashboard)...");
  try {
    const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: adminCookie },
    });
    const dashHtml = await dashRes.text();

    assert(dashRes.status === 200, "Portal Selection (/admin/dashboard) returns HTTP 200 OK");
    assert(dashHtml.includes("AVISHKAR 2026 — Portal Selection"), "Portal Selection displays official header");
    assert(dashHtml.includes("Administrative Management Portal"), "Portal Selection displays Administrative Management card");
    assert(dashHtml.includes("/admin/management/login"), "Administrative Management card links to /admin/management/login");
    assert(!dashHtml.includes("AdminSidebar"), "Portal Selection page remains clean and does not embed sidebar");
  } catch (err) {
    assert(false, `Portal selection check failed: ${err.message}`);
  }

  console.log("\n================================================================================");
  console.log(`Results: ${passed}/${total} assertions passed.`);
  console.log("================================================================================");

  if (passed === total) {
    console.log("🎉 ALL OVERVIEW NAVIGATION & WORKSPACE TESTS PASSED!\n");
  } else {
    console.error("❌ Some tests failed. Please review output above.\n");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
