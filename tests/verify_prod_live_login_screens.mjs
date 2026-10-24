// tests/verify_prod_live_login_screens.mjs
// Verification suite against live production Cloudflare Worker

const PROD_URL = "https://avishkar-v2.g-murari2006.workers.dev";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function verifyLive() {
  console.log("================================================================================");
  console.log(`Verifying live production endpoints at ${PROD_URL}`);
  console.log("================================================================================\n");

  // 1. Verify President Login Screen
  console.log("[1/3] Checking live President Portal login screen...");
  const presRes = await fetch(`${PROD_URL}/admin/president/login`, {
    headers: { "Cache-Control": "no-cache" }
  });
  const presHtml = await presRes.text();
  assert(presRes.status === 200, "Live /admin/president/login returns HTTP 200");
  assert(presHtml.includes("AVISHKAR 2026"), "Contains 'AVISHKAR 2026' branding");
  assert(presHtml.includes("President Login"), "Contains 'President Login' heading");
  assert(presHtml.includes("Executive Leadership"), "Contains 'Executive Leadership' role badge");
  assert(!presHtml.includes("Sign in to access the president dashboard."), "Description 'Sign in to access the president dashboard.' is NOT present");
  assert(!presHtml.includes("Authorized access for the Executive President"), "Old subtitle is NOT present");
  assert(presHtml.includes("/images/avishkar-logo.png"), "Renders official AVISHKAR logo (/images/avishkar-logo.png)");
  assert(!presHtml.includes("/images/avishkar-lotus-logo.png"), "Generic lotus logo is NOT present");

  // 2. Verify Administrative Management Login Screen
  console.log("\n[2/3] Checking live Administrative Management login screen...");
  const adminRes = await fetch(`${PROD_URL}/admin/management/login`, {
    headers: { "Cache-Control": "no-cache" }
  });
  const adminHtml = await adminRes.text();
  assert(adminRes.status === 200, "Live /admin/management/login returns HTTP 200");
  assert(adminHtml.includes("AVISHKAR 2026"), "Contains 'AVISHKAR 2026' branding");
  assert(adminHtml.includes("Administrative Management"), "Contains 'Administrative Management' heading");
  assert(adminHtml.includes("Administration"), "Contains 'Administration' role badge");
  assert(!adminHtml.includes("Sign in to access the administration dashboard."), "Description 'Sign in to access the administration dashboard.' is NOT present");
  assert(adminHtml.includes("/images/avishkar-logo.png"), "Renders official AVISHKAR logo (/images/avishkar-logo.png)");
  assert(!adminHtml.includes("/images/avishkar-lotus-logo.png"), "Generic lotus logo is NOT present");

  // 3. Verify Portal Selection
  console.log("\n[3/3] Checking live Portal Selection /admin/dashboard...");
  const dashRes = await fetch(`${PROD_URL}/admin/dashboard`, {
    headers: { "Cache-Control": "no-cache" }
  });
  assert(dashRes.status === 200, "Live /admin/dashboard returns HTTP 200");
  const dashHtml = await dashRes.text();
  assert(dashHtml.includes("President Portal"), "President Portal card present");
  assert(dashHtml.includes("Administrative Management Portal"), "Administrative Management Portal card present");
  assert(dashHtml.includes("/admin/president/login"), "Links to /admin/president/login");
  assert(dashHtml.includes("/admin/management/login"), "Links to /admin/management/login");

  console.log("\n================================================================================");
  console.log("🎉 ALL LIVE PRODUCTION VERIFICATIONS PASSED!");
  console.log("================================================================================");
}

verifyLive().catch(err => {
  console.error(err);
  process.exit(1);
});
