// tests/verify_prod_live_website_changes.mjs
// Verification of the live deployment on Cloudflare Workers

const PROD_URL = "https://avishkar-v2.g-murari2006.workers.dev";

async function verifyLiveWebsite() {
  console.log("================================================================================");
  console.log("AVISHKAR — LIVE PRODUCTION VERIFICATION (CLOUDFLARE WORKERS)");
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

  // 1. Probe Homepage
  console.log("[1/3] Fetching Homepage (GET /)...");
  try {
    const res = await fetch(`${PROD_URL}/`, {
      headers: { "Cache-Control": "no-cache", "User-Agent": "AVISHKAR-Verifier/1.0" },
    });
    assert(res.status === 200, `Homepage returned HTTP 200 (Status: ${res.status})`);

    const html = await res.text();

    // Check 1: Header logo
    assert(html.includes("home-logo.svg"), "Header renders official GD Goenka University + NAAC A+ logo (home-logo.svg)");
    assert(!html.includes("src=\"/images/avishkar-logo.png\"") && !html.includes("src='/images/avishkar-logo.png'"), "Header does NOT render avishkar-logo.png");

    // Check 2: OFFICIAL EVENTS & COMPETITIONS label
    assert(html.includes("OFFICIAL EVENTS &amp; COMPETITIONS") || html.includes("OFFICIAL EVENTS & COMPETITIONS"), "Homepage includes 'OFFICIAL EVENTS & COMPETITIONS'");
    assert(html.includes("bg-[#D4AF37]"), "Gold dot (#D4AF37) is present");
    assert(html.includes("text-[#0A2047]"), "Navy text color (#0A2047) is present");

    // Check 3: OFFICIAL EVENT POLICY & VENUE & INQUIRIES labels
    assert(html.includes("OFFICIAL EVENT POLICY"), "Homepage includes 'OFFICIAL EVENT POLICY'");
    assert(html.includes("VENUE &amp; INQUIRIES") || html.includes("VENUE & INQUIRIES"), "Homepage includes 'VENUE & INQUIRIES'");

    // Check 4: Hero Heading
    assert(html.includes("Prepare for AVISHKAR"), "Hero heading includes 'Prepare for AVISHKAR'");
    assert(!html.includes("Prepare for AVISHKAR 2026"), "Hero heading does NOT contain '2026'");

    // Check 5: Hero EVENT PREPARATION label
    assert(html.includes("EVENT PREPARATION"), "Hero includes clean label 'EVENT PREPARATION'");
    assert(html.includes("text-[#D4AF37]"), "Hero label styled in gold (#D4AF37)");

    // Check 6: Footer Logo
    assert(html.includes("gd-goenka-logo.png"), "Footer contains official GD Goenka University logo");
  } catch (err) {
    console.error("  ✗ Error probing homepage:", err.message);
    failed++;
  }

  // 2. Probe Core Public Routes
  console.log("\n[2/3] Probing Key Public Routes...");
  const publicRoutes = [
    { path: "/events", name: "Events Page" },
    { path: "/gallery", name: "Gallery Page" },
    { path: "/status", name: "Track Status Page" },
    { path: "/register", name: "Student Registration Page" },
  ];

  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${PROD_URL}${route.path}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      assert(res.status === 200, `${route.name} (${route.path}) returned HTTP 200`);
    } catch (err) {
      console.error(`  ✗ Error probing ${route.path}:`, err.message);
      failed++;
    }
  }

  // 3. Probe Header Navigation Links & Actions
  console.log("\n[3/3] Checking Header CTA Actions...");
  try {
    const res = await fetch(`${PROD_URL}/`);
    const html = await res.text();
    assert(html.includes("Track Status"), "Header 'Track Status' button link is live");
    assert(html.includes("Student Registration"), "Header 'Student Registration' CTA button is live");
  } catch (err) {
    console.error("  ✗ Error probing header CTAs:", err.message);
    failed++;
  }

  console.log("\n================================================================================");
  console.log(`LIVE VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyLiveWebsite();
