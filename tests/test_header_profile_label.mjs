// tests/test_header_profile_label.mjs
// Test to verify the removal of the profile label and user icon from Administrative Management Portal

import fs from "fs";
import path from "path";

const headerFile = path.resolve("src/components/admin/AdminHeader.tsx");
const sidebarFile = path.resolve("src/components/admin/AdminSidebar.tsx");

console.log("=================================================================");
console.log("VERIFYING REMOVAL OF PROFILE LABEL IN ADMINISTRATIVE MANAGEMENT");
console.log("=================================================================\n");

let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${name}`);
    process.exitCode = 1;
  }
}

// 1. Check AdminHeader.tsx
const headerContent = fs.readFileSync(headerFile, "utf-8");

assert(
  headerContent.includes("isAdminManagement"),
  "AdminHeader defines isAdminManagement condition to distinguish Administrative Management from other portals"
);

assert(
  headerContent.includes("!isAdminManagement && user?.email"),
  "AdminHeader suppresses user profile label and user icon when isAdminManagement is true"
);

assert(
  headerContent.includes("!isAdminManagement && badge &&"),
  "AdminHeader suppresses Portal Administrator badge when isAdminManagement is true"
);

assert(
  headerContent.includes("Notification"),
  "AdminHeader preserves notification dropdown and controls"
);

// Verify that the divider and padding are inside the conditional block and not orphaned
const userProfileBlockRegex = /\{!isAdminManagement\s*&&\s*user\?\.email\s*&&\s*\(\s*<div[^>]*border-l[^>]*>[\s\S]*?<User[^>]*\/>[\s\S]*?<\/div>\s*\)\}/;
assert(
  userProfileBlockRegex.test(headerContent),
  "User profile container, user icon, and divider styling (border-l) are all cleanly scoped inside the conditional"
);

// Verify that President, VP, Member paths are exempt from removal
assert(
  headerContent.includes('!pathname.startsWith("/admin/president")') &&
  headerContent.includes('!pathname.startsWith("/admin/vice-president")') &&
  headerContent.includes('!pathname.startsWith("/admin/member")'),
  "President, Vice President, and Member portals are preserved and retain their profile label"
);

// 2. Check AdminSidebar.tsx
const sidebarContent = fs.readFileSync(sidebarFile, "utf-8");
assert(
  !sidebarContent.includes("Symposium Organiz"),
  "AdminSidebar does not contain 'Symposium Organiz' text"
);

assert(
  sidebarContent.includes("Sign Out"),
  "AdminSidebar preserves Sign Out and navigation functionality"
);

console.log(`\nResults: ${passed}/${total} assertions passed.`);
if (passed === total) {
  console.log("🎉 ALL VERIFICATION CHECKS PASSED!");
}
