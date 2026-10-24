// tests/test_header_logo_removal.mjs
// Verification that AVISHKAR logo is removed from the public website header while preserved in footer

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function verifyHeader() {
  console.log(`Verifying rendered homepage at ${BASE_URL}...`);
  const res = await fetch(BASE_URL);
  assert(res.ok, `Homepage returned HTTP ${res.status}`);

  const html = await res.text();

  // Extract <header ...> ... </header>
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
  assert(Boolean(headerMatch), "Public <header> found in rendered HTML");

  const headerHtml = headerMatch[0];

  // 1. Check GD Goenka University + NAAC Grade A+ logo is present in header
  assert(
    headerHtml.includes("home-logo.svg") || headerHtml.includes("GD Goenka University"),
    "GD Goenka University / NAAC logo lockup is present in header"
  );

  // 2. Check AVISHKAR logo image is NOT present in header
  assert(
    !headerHtml.includes("avishkar-logo.png"),
    "AVISHKAR logo (avishkar-logo.png) is NOT present in header"
  );

  // 3. Check navigation items are present
  assert(headerHtml.includes("Track Status"), "'Track Status' button is present in header");
  assert(headerHtml.includes("Student Registration"), "'Student Registration' button is present in header");

  // 4. Check footer contains only GD Goenka University logo without AVISHKAR logo
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  assert(Boolean(footerMatch), "Public <footer> found in rendered HTML");
  const footerHtml = footerMatch[0];
  assert(
    footerHtml.includes("gd-goenka-logo.png"),
    "GD Goenka University logo (gd-goenka-logo.png) is PRESENT in footer"
  );
  assert(
    !footerHtml.includes("avishkar-logo.png"),
    "AVISHKAR logo (avishkar-logo.png) is REMOVED from footer"
  );

  console.log("\n========================================================");
  console.log("🎉 All header logo removal verifications passed!");
  console.log("========================================================");
}

verifyHeader().catch((err) => {
  console.error(err);
  process.exit(1);
});
