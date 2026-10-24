// tests/verify_prod_live_portal_icons.mjs
// Verification of upgraded portal visual identity on live Cloudflare Worker

const PROD_URL = "https://avishkar-v2.g-murari2006.workers.dev";

async function verifyLivePortalIcons() {
  console.log("================================================================================");
  console.log("AVISHKAR — LIVE PRODUCTION VERIFICATION (PORTAL SELECTION ICONS)");
  console.log(`URL: ${PROD_URL}`);
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Probe Portal Selection (/admin/dashboard)
  console.log("[1/3] Inspecting Live Portal Selection Page (/admin/dashboard)...");
  try {
    const res = await fetch(`${PROD_URL}/admin/dashboard`, {
      headers: { "Cache-Control": "no-cache", "User-Agent": "AVISHKAR-Verifier/1.0" },
    });
    assert(res.status === 200, `Portal Selection returned HTTP 200 (Status: ${res.status})`);

    const html = await res.text();

    // Check titles
    assert(html.includes("AVISHKAR Portal Selection"), "Header 'AVISHKAR Portal Selection' rendered");
    assert(html.includes("Administrative Management Portal"), "Title 'Administrative Management Portal' rendered");
    assert(html.includes("President Portal"), "Title 'President Portal' rendered");
    assert(html.includes("Vice President Portal"), "Title 'Vice President Portal' rendered");
    assert(html.includes("Member Portal"), "Title 'Member Portal' rendered");

    // Check destinations
    assert(html.includes("/admin/management/login"), "Link to '/admin/management/login' present");
    assert(html.includes("/admin/president/login"), "Link to '/admin/president/login' present");
    assert(html.includes("/admin/vice-president/login"), "Link to '/admin/vice-president/login' present");
    assert(html.includes("/admin/member/login"), "Link to '/admin/member/login' present");

    // Check elimination of raster PNGs
    assert(!html.includes("admin-management-portal.png"), "Deprecated raster 'admin-management-portal.png' is NOT present");
    assert(!html.includes("president-portal.png"), "Deprecated raster 'president-portal.png' is NOT present");

    // Check branding color tokens
    assert(html.includes("0A2047") || html.includes("#0A2047"), "Deep Navy Blue (#0A2047) present in emblem styling");
    assert(html.includes("D4AF37") || html.includes("#D4AF37"), "Gold (#D4AF37) present in emblem styling");
  } catch (err) {
    console.error("  ✗ Error probing /admin/dashboard:", err.message);
    failed++;
  }

  // 2. Probe Dedicated Login Portals
  console.log("\n[2/3] Probing All 4 Dedicated Login Routes...");
  const loginPortals = [
    { path: "/admin/management/login", name: "Administrative Management Login" },
    { path: "/admin/president/login", name: "President Council Login" },
    { path: "/admin/vice-president/login", name: "Vice President Council Login" },
    { path: "/admin/member/login", name: "Technical Member Council Login" },
  ];

  for (const portal of loginPortals) {
    try {
      const res = await fetch(`${PROD_URL}${portal.path}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      assert(res.status === 200, `${portal.name} (${portal.path}) returned HTTP 200`);
    } catch (err) {
      console.error(`  ✗ Error probing ${portal.path}:`, err.message);
      failed++;
    }
  }

  // 3. Probe Public Routes
  console.log("\n[3/3] Probing Core Public Routes...");
  const publicRoutes = ["/", "/events", "/gallery", "/status", "/register"];
  for (const p of publicRoutes) {
    try {
      const res = await fetch(`${PROD_URL}${p}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      assert(res.status === 200, `Public route ${p} returned HTTP 200`);
    } catch (err) {
      console.error(`  ✗ Error probing ${p}:`, err.message);
      failed++;
    }
  }

  console.log("\n================================================================================");
  console.log(`LIVE VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyLivePortalIcons();
