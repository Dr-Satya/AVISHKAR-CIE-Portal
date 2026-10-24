// Live production verification test suite for Cloudflare Worker deployment
const PROD_URL = "https://avishkar-v2.g-murari2006.workers.dev";

async function verifyLive() {
  console.log("=================================================================");
  console.log("AVISHKAR: LIVE PRODUCTION VERIFICATION (Cloudflare Workers)");
  console.log(`Target: ${PROD_URL}`);
  console.log("=================================================================\n");

  const endpoints = [
    { path: "/", label: "Homepage (Hero, Navy Header, Sections, Footer)" },
    { path: "/events", label: "Public Events & Competitions" },
    { path: "/gallery", label: "Festival Photo Gallery" },
    { path: "/status", label: "Student Registration Tracking" },
    { path: "/register", label: "Student Registration Portal" },
    { path: "/admin/dashboard", label: "4-Portal Selector" },
    { path: "/admin/management/login", label: "Administrative Management Login" },
    { path: "/admin/president/login", label: "President Council Login" },
    { path: "/admin/vice-president/login", label: "Vice President Council Login" },
    { path: "/admin/member/login", label: "Technical Member Council Login" },
    { path: "/admin/overview", label: "Admin Overview Dashboard" },
    { path: "/admin/events", label: "Events Management Portal" },
    { path: "/admin/registrations", label: "Student Registrations Management" },
    { path: "/admin/payments", label: "Payments Audit Portal" },
    { path: "/admin/forms", label: "AI Forms Management" },
    { path: "/admin/members", label: "Members Management" },
    { path: "/admin/reports", label: "Reports & Analytics" },
    { path: "/admin/audit-logs", label: "Governance Audit Logs" },
    { path: "/admin/resources", label: "Campus Resources Allocation" },
    { path: "/admin/photos", label: "Event Photos Management" },
    { path: "/admin/settings", label: "Administrative Settings" }
  ];

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      failed++;
    }
  }

  for (const item of endpoints) {
    try {
      const res = await fetch(PROD_URL + item.path, { redirect: "manual" });
      assert(res.status === 200 || res.status === 307 || res.status === 302, `[HTTP ${res.status}] ${item.label} (${item.path})`);

      if (item.path === "/") {
        const text = await res.text();
        assert(text.includes("home-logo.svg"), "Official GD Goenka University logo present in public header");
        assert(text.includes("0A2047") || text.includes("#0A2047"), "Navy blue background (#0A2047) active in public header");
        assert(text.includes("Student Registration"), "Student Registration CTA present");
        assert(text.includes("Track Status"), "Track Status CTA present");
        assert(!text.includes("Admin Portal"), "Admin Portal button correctly removed from public header");
      }

      if (item.path === "/admin/dashboard") {
        const text = await res.text();
        assert(text.includes("/admin/management/login"), "4-Portal Selector links to Administrative Management Login");
        assert(text.includes("/admin/president/login"), "4-Portal Selector links to President Login");
        assert(text.includes("/admin/vice-president/login"), "4-Portal Selector links to Vice President Login");
        assert(text.includes("/admin/member/login"), "4-Portal Selector links to Member Login");
      }
    } catch (err) {
      console.error(`  ✗ Error testing ${item.path}:`, err.message);
      failed++;
    }
  }

  console.log("\n=================================================================");
  console.log(`LIVE PRODUCTION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyLive();
