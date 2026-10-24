// tests/test_admin_login_screen.mjs
// Automated verification for Administrative Management Login Screen improvements

import fs from "fs";
import path from "path";
import crypto from "crypto";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function verifyAdminLoginScreen() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Administrative Management Login Screen Verification");
  console.log("================================================================================\n");

  // 1. Inspect existing project assets and verify official AVISHKAR logo
  console.log("[1/4] Inspecting official AVISHKAR logo asset in public/images/...");
  const officialLogoPath = path.resolve("public/images/avishkar-logo.png");
  assert(fs.existsSync(officialLogoPath), "Official logo public/images/avishkar-logo.png exists");
  const officialLogoBuf = fs.readFileSync(officialLogoPath);
  assert(officialLogoBuf.length > 50000, "Official logo is high resolution asset (>50KB)");

  // Verify generic lotus logo is distinct
  const lotusPath = path.resolve("public/images/avishkar-lotus-logo.png");
  assert(fs.existsSync(lotusPath), "Lotus logo reference exists in asset repo");
  const lotusBuf = fs.readFileSync(lotusPath);
  const officialHash = crypto.createHash("sha256").update(officialLogoBuf).digest("hex");
  const lotusHash = crypto.createHash("sha256").update(lotusBuf).digest("hex");
  assert(officialHash !== lotusHash, "Official AVISHKAR logo is verified distinct from generic lotus logo");

  // 2. Inspect src/app/admin/management/login/page.tsx
  console.log("\n[2/4] Inspecting src/app/admin/management/login/page.tsx...");
  const adminPagePath = path.resolve("src/app/admin/management/login/page.tsx");
  assert(fs.existsSync(adminPagePath), "Administrative Management login page exists");
  const adminPageContent = fs.readFileSync(adminPagePath, "utf-8");

  assert(adminPageContent.includes('expectedRole="Admin"'), "Expected role configured as 'Admin'");
  assert(adminPageContent.includes('roleHeading="Administrative Management"'), "Heading is 'Administrative Management'");
  assert(adminPageContent.includes('roleBadge="Administration"'), "Badge is 'Administration'");
  assert(adminPageContent.includes('targetDashboard="/admin/overview"'), "Target dashboard points to /admin/overview");
  assert(!adminPageContent.includes("Sign in to access the administration dashboard."), "Description text 'Sign in to access the administration dashboard.' is completely removed");
  assert(!adminPageContent.includes("roleSubtitle="), "roleSubtitle prop is completely omitted");

  // 3. Inspect src/components/admin/RoleLoginForm.tsx
  console.log("\n[3/4] Inspecting src/components/admin/RoleLoginForm.tsx...");
  const formPath = path.resolve("src/components/admin/RoleLoginForm.tsx");
  assert(fs.existsSync(formPath), "RoleLoginForm.tsx exists");
  const formContent = fs.readFileSync(formPath, "utf-8");

  // Official AVISHKAR logo verification in component
  assert(formContent.includes('src="/images/avishkar-logo.png"'), "Uses official AVISHKAR logo (/images/avishkar-logo.png)");
  assert(!formContent.includes('src="/images/avishkar-lotus-logo.png"'), "Generic lotus logo is NOT used");
  assert(formContent.includes('alt="AVISHKAR — Center of Innovation and Entrepreneurship"'), "Descriptive accessible alt text for official logo");
  assert(formContent.includes("h-16 sm:h-20 w-auto object-contain"), "Preserves logo original aspect ratio and responsive scaling");
  assert(formContent.includes("flex flex-col items-center text-center"), "Logo and branding are centered horizontally");

  // Branding & Heading preservation
  assert(formContent.includes("AVISHKAR 2026"), "Preserves 'AVISHKAR 2026' heading");
  assert(formContent.includes("GD Goenka University &bull; Official Role Portal"), "Preserves 'GD Goenka University • Official Role Portal' subtitle");
  assert(formContent.includes("Landmark"), "Landmark symbol used for Administration role icon");

  // Interface controls preservation
  assert(formContent.includes("Official Email"), "Official Email field label present");
  assert(formContent.includes("Password"), "Password field label present");
  assert(formContent.includes("showPassword"), "Password show/hide toggle present");
  assert(formContent.includes("Sign In"), "Sign In submit button present");
  assert(formContent.includes("Sign In to Administration"), "Sign In to Administration accessible label present");
  assert(formContent.includes("&larr; Back to Portal Selection"), "Back to Portal Selection link present");
  assert(formContent.includes("href=\"/admin/dashboard\""), "Back link navigates to /admin/dashboard");
  assert(formContent.includes("Back to Website"), "Back to Website accessible link reference present");
  assert(formContent.includes("href=\"/\""), "Website return link points to '/'");

  // Deep Navy & Gold palette preservation
  assert(formContent.includes("#0A2047"), "Deep Navy Blue (#0A2047) palette preserved");
  assert(formContent.includes("#D4AF37"), "Gold (#D4AF37) accent color preserved");

  // 4. Verify other role login pages remain intact
  console.log("\n[4/4] Verifying all role login pages maintain stability...");
  const memberPage = fs.readFileSync("src/app/admin/member/login/page.tsx", "utf-8");
  assert(memberPage.includes('expectedRole="AVISHKAR Member"'), "Member login page remains valid");
  const vpPage = fs.readFileSync("src/app/admin/vice-president/login/page.tsx", "utf-8");
  assert(vpPage.includes('expectedRole="Vice President"'), "Vice President login page remains valid");
  const presPage = fs.readFileSync("src/app/admin/president/login/page.tsx", "utf-8");
  assert(presPage.includes('expectedRole="President"'), "President login page remains valid");

  console.log("\n================================================================================");
  console.log("🎉 ALL ADMINISTRATIVE MANAGEMENT LOGIN SCREEN VERIFICATIONS PASSED!");
  console.log("================================================================================");
}

verifyAdminLoginScreen();
