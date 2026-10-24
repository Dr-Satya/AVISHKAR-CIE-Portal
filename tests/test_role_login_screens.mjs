// tests/test_role_login_screens.mjs
// Automated verification for Member, VP, President, and Admin login screens

import fs from "fs";
import path from "path";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function verifyRoleLoginScreens() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Role Portals Login Screens Verification");
  console.log("================================================================================\n");

  // 1. Verify Member Login Page
  console.log("[1/5] Inspecting src/app/admin/member/login/page.tsx...");
  const memberPagePath = path.resolve("src/app/admin/member/login/page.tsx");
  assert(fs.existsSync(memberPagePath), "Member login page exists");
  const memberPageContent = fs.readFileSync(memberPagePath, "utf-8");

  assert(memberPageContent.includes('expectedRole="AVISHKAR Member"'), "Expected role is 'AVISHKAR Member'");
  assert(memberPageContent.includes('roleHeading="Member Login"'), "Role heading is 'Member Login'");
  assert(memberPageContent.includes('roleBadge="Technical Committee"'), "Role badge is 'Technical Committee'");
  assert(!memberPageContent.includes("roleSubtitle="), "Description/roleSubtitle is removed from Member login page");

  // 2. Verify Vice President Login Page
  console.log("\n[2/5] Inspecting src/app/admin/vice-president/login/page.tsx...");
  const vpPagePath = path.resolve("src/app/admin/vice-president/login/page.tsx");
  assert(fs.existsSync(vpPagePath), "Vice President login page exists");
  const vpPageContent = fs.readFileSync(vpPagePath, "utf-8");

  assert(vpPageContent.includes('expectedRole="Vice President"'), "Expected role is 'Vice President'");
  assert(vpPageContent.includes('roleHeading="Vice President Login"'), "Role heading is 'Vice President Login'");
  assert(vpPageContent.includes('roleBadge="Operations Co-Lead"'), "Role badge is 'Operations Co-Lead'");
  assert(!vpPageContent.includes("roleSubtitle="), "Description/roleSubtitle is removed from Vice President login page");

  // 3. Verify RoleLoginForm Component
  console.log("\n[3/5] Inspecting src/components/admin/RoleLoginForm.tsx...");
  const formPath = path.resolve("src/components/admin/RoleLoginForm.tsx");
  assert(fs.existsSync(formPath), "RoleLoginForm.tsx exists");
  const formContent = fs.readFileSync(formPath, "utf-8");

  // Official AVISHKAR logo check
  assert(formContent.includes('src="/images/avishkar-logo.png"'), "Uses official AVISHKAR logo (/images/avishkar-logo.png)");
  assert(!formContent.includes('src="/images/avishkar-lotus-logo.png"'), "Generic lotus logo removed from RoleLoginForm");
  assert(formContent.includes('alt="AVISHKAR — Center of Innovation and Entrepreneurship"'), "Descriptive accessible alt text for official logo");
  assert(formContent.includes("h-16 sm:h-20 w-auto object-contain"), "Responsive, proportional aspect-ratio styling preserved");

  // Description conditional rendering
  assert(formContent.includes("roleSubtitle?: string"), "roleSubtitle is optional in RoleLoginFormProps");
  assert(formContent.includes("{roleSubtitle && ("), "Description only renders when roleSubtitle is provided");

  // Heading & Branding preservation
  assert(formContent.includes("AVISHKAR 2026"), "Preserves 'AVISHKAR 2026' heading");
  assert(formContent.includes("GD Goenka University &bull; Official Role Portal"), "Preserves 'GD Goenka University • Official Role Portal' subtitle");

  // Form controls & functionality
  assert(formContent.includes("Official Email"), "Official Email field label present");
  assert(formContent.includes("Password"), "Password field label present");
  assert(formContent.includes("showPassword"), "Password visibility toggle present");
  assert(formContent.includes("Sign In"), "Sign In submit button present");
  assert(formContent.includes("&larr; Back to Portal Selection"), "Back to Portal Selection link present");
  assert(formContent.includes("Return to AVISHKAR public homepage"), "Return to AVISHKAR public homepage link present");

  // 4. Verify President Login Page
  console.log("\n[4/5] Inspecting President Login Page...");
  const presPageContent = fs.readFileSync("src/app/admin/president/login/page.tsx", "utf-8");
  assert(presPageContent.includes('expectedRole="President"'), "President login page remains valid");
  assert(presPageContent.includes('roleHeading="President Login"'), "Role heading is 'President Login'");
  assert(presPageContent.includes('roleBadge="Executive Leadership"'), "Role badge is 'Executive Leadership'");
  assert(!presPageContent.includes("roleSubtitle="), "Description/roleSubtitle is removed from President login page");

  // 5. Verify Admin Management Login Page
  console.log("\n[5/5] Inspecting Admin Management Login Page...");
  const adminPageContent = fs.readFileSync("src/app/admin/management/login/page.tsx", "utf-8");
  assert(adminPageContent.includes('expectedRole="Admin"'), "Admin Management login page remains valid");
  assert(adminPageContent.includes('roleHeading="Administrative Management"'), "Role heading is 'Administrative Management'");
  assert(!adminPageContent.includes("roleSubtitle="), "Description/roleSubtitle is removed from Admin Management login page");

  console.log("\n================================================================================");
  console.log("🎉 ALL ROLE LOGIN SCREENS VERIFICATIONS PASSED!");
  console.log("================================================================================");
}

verifyRoleLoginScreens();
