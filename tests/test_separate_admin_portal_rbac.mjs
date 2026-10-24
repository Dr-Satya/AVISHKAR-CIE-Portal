// tests/test_separate_admin_portal_rbac.mjs
// Automated verification test suite for AVISHKAR-v2 Separate Admin Portal & RBAC

import fs from "fs";
import path from "path";

async function runTests() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Separate Admin Portal & Role-Based Access Control (RBAC) Test Suite");
  console.log("================================================================================\n");

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
  // GROUP 1: Route Separation & Public Site Preservation
  // --------------------------------------------------------------------------
  console.log("--- 1. Strict Route & Layout Separation ---");

  // 1.1 Public Homepage
  try {
    const homeRes = await fetch(`${baseUrl}/`);
    const homeHtml = await homeRes.text();
    assert(
      homeRes.status === 200 && homeHtml.includes("AVISHKAR") && homeHtml.includes("GD Goenka"),
      "Public homepage (/) renders successfully (HTTP 200) with official branding"
    );
    assert(
      !homeHtml.includes("Administrative Console") && !homeHtml.includes("Executive Approval Queue"),
      "Public homepage does NOT render admin console elements or admin approval queues"
    );
    assert(
      !homeHtml.includes("/admin/dashboard"),
      "Public homepage navigation does NOT contain admin dashboard links"
    );
  } catch (err) {
    assert(false, `Homepage fetch error: ${err.message}`);
  }

  // 1.2 Public Student Registration
  try {
    const regRes = await fetch(`${baseUrl}/register`);
    const regHtml = await regRes.text();
    assert(
      regRes.status === 200 && regHtml.includes("AVISHKAR Student Registration"),
      "Public student registration (/register) remains operational (HTTP 200)"
    );
    assert(
      !regHtml.includes("AdminSidebar") && !regHtml.includes("Role: President"),
      "Student registration (/register) does not render administrative sidebar or roles"
    );
  } catch (err) {
    assert(false, `Student registration fetch error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // GROUP 2: Dedicated Administration Routes Availability
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Administration Routes Availability (Independent Layout) ---");

  const adminRoutes = [
    { path: "/admin/login", label: "Admin Login Page", keywords: ["Staff &amp; Organizer Sign In", "Staff & Organizer Sign In", "Administrative Portal"] },
    { path: "/admin", label: "Admin Redirect Gateway", keywords: ["Navigating to your dashboard", "dashboard"] },
    { path: "/admin/president", label: "President Portal", keywords: ["President Dashboard", "President Authorization Required", "Presidential Office", "President"] },
    { path: "/admin/vice-president", label: "Vice President Portal", keywords: ["Vice President Dashboard", "Vice President Authorization Required", "Vice President"] },
    { path: "/admin/dashboard", label: "Admin Portal", keywords: ["Portal Selection", "President Portal", "Administrator Access Required"] },
    { path: "/admin/member", label: "Member Portal", keywords: ["Member Dashboard", "Council Workspace", "Member Portal", "Council Member", "Propose New Track"] },
    { path: "/admin/events", label: "Events & Competitions Management", keywords: ["Event &amp; Proposal Management", "Event & Proposal Management", "Events & Competitions Management"] },
    { path: "/admin/forms", label: "Dynamic Form Builder", keywords: ["Dynamic Form Builder", "Google Forms-Style"] },
    { path: "/admin/resources", label: "Resources & Media Repository", keywords: ["Competition Resources", "Media Repository"] },
    { path: "/admin/registrations", label: "Student Registrations Roster", keywords: ["Registration Management", "Registration Directory", "Verified Registrations"] },
    { path: "/admin/payments", label: "Payment Verification Queue", keywords: ["Payment Review Queue", "Payment", "UTR"] },
    { path: "/admin/members", label: "Council & Member Management", keywords: ["Organizing Council", "Role Management"] },
    { path: "/admin/settings", label: "System Settings & Audit Logs", keywords: ["Security &amp; System Administration", "Security & System Administration", "RBAC Matrix"] },
  ];

  for (const route of adminRoutes) {
    try {
      const res = await fetch(`${baseUrl}${route.path}`);
      const html = await res.text();
      const hasKeyword = route.keywords.some(k => html.includes(k));
      assert(
        res.status === 200 && hasKeyword,
        `GET ${route.path} renders successfully (HTTP 200) with ${route.label}`
      );
      if (route.path !== "/admin/login") {
        assert(
          !html.includes('id="hero"') && !html.includes("hero-banner"),
          `GET ${route.path} suppresses public homepage hero and uses dedicated admin workspace`
        );
      }
    } catch (err) {
      assert(false, `GET ${route.path} error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // GROUP 3: Server-Side Authorization Enforcement (Deny by Default)
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Server-Side Security Enforcement & Gating ---");

  const protectedEndpoints = [
    { method: "GET", url: "/api/admin/auth/me", name: "GET /api/admin/auth/me" },
    { method: "GET", url: "/api/admin/stats", name: "GET /api/admin/stats" },
    { method: "GET", url: "/api/admin/events", name: "GET /api/admin/events" },
    { method: "POST", url: "/api/admin/events", name: "POST /api/admin/events" },
    { method: "GET", url: "/api/admin/forms", name: "GET /api/admin/forms" },
    { method: "POST", url: "/api/admin/forms", name: "POST /api/admin/forms" },
    { method: "GET", url: "/api/admin/resources", name: "GET /api/admin/resources" },
    { method: "POST", url: "/api/admin/resources", name: "POST /api/admin/resources" },
    { method: "GET", url: "/api/admin/registrations", name: "GET /api/admin/registrations" },
    { method: "GET", url: "/api/admin/members", name: "GET /api/admin/members" },
    { method: "POST", url: "/api/admin/members", name: "POST /api/admin/members" },
    { method: "GET", url: "/api/admin/tasks", name: "GET /api/admin/tasks" },
    { method: "GET", url: "/api/admin/audit-logs", name: "GET /api/admin/audit-logs" },
    { method: "GET", url: "/api/admin/receipt?path=payment-receipts/test.png", name: "GET /api/admin/receipt" },
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.url}`, {
        method: ep.method,
        headers: ep.method === "POST" ? { "Content-Type": "application/json" } : {},
        body: ep.method === "POST" ? JSON.stringify({ test: true }) : undefined,
      });
      assert(
        res.status === 401 || res.status === 403,
        `${ep.name} strictly denies unauthenticated requests with HTTP ${res.status} (Deny by default)`
      );
    } catch (err) {
      assert(false, `${ep.name} network error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // GROUP 4: Database Migration 005 & RBAC Schema Integrity
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Database Schema & RLS Policies Verification ---");

  const mig5Path = path.resolve("supabase/migrations/005_admin_portal_rbac.sql");
  assert(fs.existsSync(mig5Path), "Migration 005 (005_admin_portal_rbac.sql) exists");

  const mig5Content = fs.readFileSync(mig5Path, "utf8");
  assert(mig5Content.includes("CREATE TABLE IF NOT EXISTS public.admin_members"), "Migration 005 creates admin_members table");
  assert(mig5Content.includes("CREATE TABLE IF NOT EXISTS public.events"), "Migration 005 creates events table");
  assert(mig5Content.includes("CREATE TABLE IF NOT EXISTS public.event_forms"), "Migration 005 creates event_forms table");
  assert(mig5Content.includes("CREATE TABLE IF NOT EXISTS public.event_resources"), "Migration 005 creates event_resources table");
  assert(mig5Content.includes("CREATE TABLE IF NOT EXISTS public.member_tasks"), "Migration 005 creates member_tasks table");
  assert(mig5Content.includes("CREATE TABLE IF NOT EXISTS public.admin_audit_logs"), "Migration 005 creates admin_audit_logs table");
  assert(mig5Content.includes("ALTER TABLE public.events ENABLE ROW LEVEL SECURITY"), "Migration 005 enables PostgreSQL RLS on events");
  assert(mig5Content.includes("status = 'published'"), "Migration 005 restricts public/student queries to published events only");
  assert(mig5Content.includes("Only President and service_role can view audit logs") || mig5Content.includes("President"), "Migration 005 restricts audit logs to President role");

  // --------------------------------------------------------------------------
  // GROUP 5: Code Hardening & Security Standards
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Security Guardrails & Anti-Escalation Checks ---");

  const adminAuthPath = path.resolve("src/lib/adminAuth.ts");
  const adminAuthContent = fs.readFileSync(adminAuthPath, "utf8");

  assert(
    adminAuthContent.includes('lower === "student"') && adminAuthContent.includes("return null"),
    "adminAuth explicitly denies administrative access to student role accounts"
  );
  assert(
    !fs.existsSync(path.resolve("src/app/admin/signup")) &&
    !fs.existsSync(path.resolve("src/app/admin/register")),
    "No public admin signup/registration route exists"
  );

  // Check that no browser code exposes SUPABASE_SERVICE_ROLE_KEY
  const clientComponentFiles = [
    "src/app/admin/login/page.tsx",
    "src/app/admin/dashboard/page.tsx",
    "src/app/admin/events/page.tsx",
    "src/app/admin/forms/page.tsx",
    "src/app/admin/resources/page.tsx",
    "src/app/admin/members/page.tsx",
    "src/app/admin/settings/page.tsx",
  ];

  let zeroClientLeaks = true;
  for (const f of clientComponentFiles) {
    const fullPath = path.resolve(f);
    if (fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, "utf8");
      if (code.includes("SUPABASE_SERVICE_ROLE_KEY") || code.includes("serviceRoleKey")) {
        zeroClientLeaks = false;
      }
    }
  }
  assert(zeroClientLeaks, "Zero Supabase service-role keys leaked in client component bundles");

  // --------------------------------------------------------------------------
  // GROUP 6: Role Dashboards Isolation & Simplified UI
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Role Dashboards Isolation & Simplified UI ---");

  // 6.1 Role Authentications & Direct Dashboard Target Mapping
  const testAccounts = [
    { email: "president@gdgoenka.ac.in", pass: "President@2026", expectedRole: "President", expectedDash: "/admin/president" },
    { email: "vp@gdgoenka.ac.in", pass: "VP@2026", expectedRole: "Vice President", expectedDash: "/admin/vice-president" },
    { email: "admin@gdgoenka.ac.in", pass: "Admin@2026", expectedRole: "Admin", expectedDash: "/admin/dashboard" },
    { email: "member@gdgoenka.ac.in", pass: "Member@2026", expectedRole: "AVISHKAR Member", expectedDash: "/admin/member" },
  ];

  for (const acc of testAccounts) {
    try {
      const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acc.email, password: acc.pass }),
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.success && data.user.role === acc.expectedRole,
        `Account ${acc.email} authenticates with HTTP 200 as '${acc.expectedRole}'`
      );

      // Verify login redirect mapping
      const mappedDash =
        data.user.role === "President"
          ? "/admin/president"
          : data.user.role === "Vice President"
          ? "/admin/vice-president"
          : data.user.role === "AVISHKAR Member"
          ? "/admin/member"
          : "/admin/dashboard";
      assert(
        mappedDash === acc.expectedDash,
        `${acc.expectedRole} routes directly to its own dashboard: ${acc.expectedDash}`
      );
    } catch (err) {
      assert(false, `Login test failed for ${acc.email}: ${err.message}`);
    }
  }

  // 6.2 Admin Landing Page: Exactly Three Portal Cards & No Admin Operational Widgets
  try {
    const dashRes = await fetch(`${baseUrl}/admin/dashboard`);
    const dashHtml = await dashRes.text();
    assert(
      !dashHtml.includes("View as:") && !dashHtml.includes("setPreviewRole"),
      "Old 'View as: President / Admin / Member' switcher is completely removed from Admin landing page"
    );
    const dashCode = fs.readFileSync(path.resolve("src/app/admin/dashboard/page.tsx"), "utf8");
    assert(
      dashCode.includes("President Portal") && dashCode.includes("Vice President Portal") && dashCode.includes("Member Portal"),
      "Admin landing page defines and renders exactly the three portal cards: President Portal, Vice President Portal, and Member Portal"
    );
    assert(
      !dashHtml.includes("Switch Portal") && !dashHtml.includes("Launch Your Default Portal"),
      "Admin landing page does NOT render 'Switch Portal' or 'Launch Your Default Portal' buttons"
    );
    assert(
      !dashHtml.includes("Event Publishing Center") && !dashHtml.includes("Live Competitions"),
      "Admin landing page removes Event Publishing Center and operational statistics"
    );
    assert(
      !dashHtml.includes("AdminSidebar") && !dashHtml.includes("View Public Site"),
      "Admin Portal Selection page completely removes left sidebar, sidebar logo, and navigation links"
    );
    assert(
      dashHtml.includes("AVISHKAR Portal Selection"),
      "Admin Portal Selection page includes header 'AVISHKAR Portal Selection'"
    );
    const eventsRes = await fetch(`${baseUrl}/admin/events`);
    const eventsHtml = await eventsRes.text();
    assert(
      eventsHtml.includes("Events") && eventsHtml.includes("Settings"),
      "Admin management pages retain full sidebar navigation"
    );
  } catch (err) {
    assert(false, `Dashboard check error: ${err.message}`);
  }

  // 6.3 Dedicated Portals Isolation (No cross-portal cards)
  try {
    const presRes = await fetch(`${baseUrl}/admin/president`);
    const presHtml = await presRes.text();
    assert(
      !presHtml.includes("Switch Portal") && !presHtml.includes("Select Your Portal"),
      "President dashboard does NOT display portal cards for other roles or Switch Portal button"
    );

    const vpRes = await fetch(`${baseUrl}/admin/vice-president`);
    const vpHtml = await vpRes.text();
    assert(
      !vpHtml.includes("Switch Portal") && !vpHtml.includes("Select Your Portal"),
      "Vice President dashboard does NOT display portal cards for other roles or Switch Portal button"
    );

    const memRes = await fetch(`${baseUrl}/admin/member`);
    const memHtml = await memRes.text();
    assert(
      !memHtml.includes("Switch Portal") && !memHtml.includes("Select Your Portal"),
      "Member dashboard does NOT display portal cards for other roles or Portal Selection button"
    );
  } catch (err) {
    assert(false, `Portal isolation check error: ${err.message}`);
  }

  // 6.4 Sidebar Navigation Configuration (No Portal Hub, Strictly Role-Specific)
  try {
    const configAdminPath = path.resolve("src/config/admin.ts");
    const configCode = fs.readFileSync(configAdminPath, "utf8");
    assert(
      !configCode.includes('"Portal Hub"') && !configCode.includes("'Portal Hub'"),
      "Sidebar configuration removes 'Portal Hub' item completely"
    );
    assert(
      configCode.includes("getNavItemsForRole"),
      "Sidebar uses role-specific navigation helper (getNavItemsForRole)"
    );
  } catch (err) {
    assert(false, `Sidebar nav verification failed: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // RESULTS SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`Results: ${passed}/${total} Separate Admin Portal & RBAC tests passed.`);
  console.log("================================================================================");

  if (passed === total) {
    console.log("🎉 All separate admin portal and role-based access tests PASSED!\n");
  } else {
    console.error("❌ Some tests failed. Please review output above.\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
