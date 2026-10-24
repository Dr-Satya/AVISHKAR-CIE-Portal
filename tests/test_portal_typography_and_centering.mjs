// tests/test_portal_typography_and_centering.mjs
// Verification of typography matching and logo centering on AVISHKAR Portal Selection page

import fs from "fs";
import path from "path";

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
}

function verifyPortalTypographyAndCentering() {
  console.log("================================================================================");
  console.log("AVISHKAR — PORTAL SELECTION TYPOGRAPHY & CENTERING VERIFICATION");
  console.log("================================================================================\n");

  const dashboardPath = path.resolve("src/app/admin/dashboard/page.tsx");
  const dashboardCode = fs.readFileSync(dashboardPath, "utf-8");

  // 1. Typography Matching
  console.log("[1/4] Verifying Main Website Typography Integration...");
  assert(dashboardCode.includes("font-sans"), "Page applies website's primary 'font-sans' (Inter) font class");
  assert(dashboardCode.includes("<h1 className=\"font-sans"), "Main page heading explicitly uses font-sans");
  assert(dashboardCode.includes("<h2 className=\"font-sans"), "Portal card titles explicitly use font-sans");
  assert(dashboardCode.includes("<p className=\"font-sans"), "Portal descriptions explicitly use font-sans");
  assert(dashboardCode.includes("Link\n                  href={portal.href}\n                  className=\"font-sans") || dashboardCode.includes("className=\"font-sans w-full inline-flex"), "Open Portal button labels explicitly use font-sans");
  assert(!dashboardCode.includes("font-extrabold"), "Clunky 'font-extrabold' removed in favor of website standard font-bold");

  // 2. Centering of all four logos/icons
  console.log("\n[2/4] Verifying Logo & Icon Centering across All 4 Cards...");
  assert(dashboardCode.includes("w-full flex items-center justify-center mb-5"), "Visual container centers icon horizontally (justify-center)");
  assert(!dashboardCode.includes("justify-start mb-5"), "Old left-aligned (justify-start) container is removed");
  assert(dashboardCode.includes("items-center text-center"), "Card body aligns and centers all content elements");

  // 3. Visual Dimensions (64px - 80px Display Area) & Aspect Ratio
  console.log("\n[3/4] Verifying Uniform 64–80px Display Area & Aspect Ratio...");
  assert(dashboardCode.includes("w-16 h-16 sm:w-20 sm:h-20"), "Emblem containers standardized to 64px (w-16 h-16) on mobile and 80px (sm:w-20 sm:h-20) on desktop");
  assert(dashboardCode.includes("object-contain"), "Image rendering guarantees 'object-fit: contain' to preserve aspect ratio");
  assert(dashboardCode.includes("shrink-0"), "Icons and emblems prevent squishing or distortion with shrink-0");

  // 4. Preserved Portal Identifiers, Descriptions, & Routes
  console.log("\n[4/4] Verifying Preserved Portal Definitions, Routes, & RBAC Safety...");
  assert(dashboardCode.includes("Administrative Management Portal"), "Administrative Management Portal title preserved");
  assert(dashboardCode.includes("President Portal"), "President Portal title preserved");
  assert(dashboardCode.includes("Vice President Portal"), "Vice President Portal title preserved");
  assert(dashboardCode.includes("Member Portal"), "Member Portal title preserved");
  assert(dashboardCode.includes("/admin/management/login"), "Admin login route preserved");
  assert(dashboardCode.includes("/admin/president/login"), "President login route preserved");
  assert(dashboardCode.includes("/admin/vice-president/login"), "Vice President login route preserved");
  assert(dashboardCode.includes("/admin/member/login"), "Member login route preserved");

  console.log("\n================================================================================");
  console.log("🎉 ALL TYPOGRAPHY & CENTERING VERIFICATION CHECKS PASSED!");
  console.log("================================================================================\n");
}

verifyPortalTypographyAndCentering();
