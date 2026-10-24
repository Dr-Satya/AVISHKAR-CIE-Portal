// Verification script for AVISHKAR Portal 02 — Public Website Redesign
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

async function verifyPublicPortal() {
  console.log("=================================================================");
  console.log("AVISHKAR PORTAL 02: PUBLIC WEBSITE VERIFICATION SUITE");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("=================================================================\n");

  const routes = [
    { path: "/", name: "Homepage (Hero, About, Highlights, Guidelines, Contact, CTA, Footer)" },
    { path: "/events", name: "Events & Competitions Catalog" },
    { path: "/gallery", name: "Festival Photo Gallery & Lightbox" },
    { path: "/status", name: "Student Registration & Payment Status" },
    { path: "/events/evt-001", name: "Published Event Detail Page" },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      totalPassed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      totalFailed++;
    }
  }

  for (const route of routes) {
    console.log(`[Testing Route] ${route.name} (${route.path})`);
    const res = await fetch(`${BASE_URL}${route.path}`);
    assert(res.status === 200, `HTTP 200 OK received for ${route.path}`);

    const html = await res.text();

    // 1. Header & Official Branding
    assert(
      html.includes("home-logo.svg") || html.includes("GD Goenka University"),
      `Official university branding lockup rendered on ${route.path}`
    );

    // 2. Global Institutional Footer
    assert(
      html.includes("AVISHKAR CIE") && html.includes("All rights reserved"),
      `Institutional GD Goenka University footer present on ${route.path}`
    );

    // 3. Brand Colors & Typography
    assert(
      html.includes("0A2047") || html.includes("#0A2047"),
      `Deep Navy Blue (#0A2047) active in styles on ${route.path}`
    );
    assert(
      html.includes("D4AF37") || html.includes("#D4AF37"),
      `Elegant Gold (#D4AF37) active in styles on ${route.path}`
    );

    console.log("");
  }

  console.log("=================================================================");
  console.log(`PUBLIC WEBSITE RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("=================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

verifyPublicPortal().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
