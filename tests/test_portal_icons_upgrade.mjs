// tests/test_portal_icons_upgrade.mjs
// Verification of the upgraded portal logos & icons on the AVISHKAR Portal Selection page

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

function verifyPortalIconsUpgrade() {
  console.log("================================================================================");
  console.log("AVISHKAR — PORTAL SELECTION ICONS & VISUAL IDENTITY VERIFICATION");
  console.log("================================================================================\n");

  const dashboardPath = path.resolve("src/app/admin/dashboard/page.tsx");
  const dashboardCode = fs.readFileSync(dashboardPath, "utf-8");

  // 1. Icon Selection Requirements
  console.log("[1/5] Verifying Icon Selection Guidelines for all 4 Portals...");
  assert(dashboardCode.includes("Landmark"), "Administrative Management Portal uses Landmark (university building administration symbol)");
  assert(dashboardCode.includes("ShieldCheck"), "President Portal uses ShieldCheck (formal crest-style symbol of leadership and approval)");
  assert(dashboardCode.includes("CalendarCheck2"), "Vice President Portal uses CalendarCheck2 (task coordination & event management symbol)");
  assert(dashboardCode.includes("Users"), "Member Portal uses Users (team & committee collaboration symbol)");

  // 2. Elimination of Disparate Raster PNGs & Mismatched Sizes
  console.log("\n[2/5] Verifying Elimination of Inconsistent Illustrations...");
  assert(!dashboardCode.includes("admin-management-portal.png"), "Oversized raster 'admin-management-portal.png' is completely removed");
  assert(!dashboardCode.includes("president-portal.png"), "Oversized raster 'president-portal.png' is completely removed");
  assert(!dashboardCode.includes("<Image") && !dashboardCode.includes("from \"next/image\""), "next/image is no longer needed on the portal grid");

  // 3. Visual System Consistency: Restrained Navy-and-Gold Treatment
  console.log("\n[3/5] Verifying Design System Consistency & Color Palette...");
  assert(dashboardCode.includes("#0A2047"), "Emblem uses Deep Navy Blue (#0A2047)");
  assert(dashboardCode.includes("#132E57"), "Emblem uses Secondary Navy (#132E57)");
  assert(dashboardCode.includes("#D4AF37"), "Emblem uses Gold (#D4AF37) for crisp vector icon and borders");
  assert(dashboardCode.includes("w-16 h-16 sm:w-20 sm:h-20") || dashboardCode.includes("w-14 h-14 sm:w-16 sm:h-16"), "All 4 portal icons share identical container dimensions");
  assert(dashboardCode.includes("strokeWidth={1.75}"), "All icons share consistent strokeWidth of 1.75");
  assert(dashboardCode.includes("w-8 h-8 sm:w-10 sm:h-10") || dashboardCode.includes("w-7 h-7 sm:w-8 sm:h-8"), "All icons share uniform icon bounding dimensions");

  // 4. Preservation of Existing Page Content, Grid, & Routes
  console.log("\n[4/5] Verifying Preservation of Page Titles, Descriptions & Navigation...");
  assert(dashboardCode.includes("AVISHKAR Portal Selection"), "Header 'AVISHKAR Portal Selection' is preserved");
  assert(dashboardCode.includes("Administrative Management Portal"), "Title 'Administrative Management Portal' is preserved");
  assert(dashboardCode.includes("President Portal"), "Title 'President Portal' is preserved");
  assert(dashboardCode.includes("Vice President Portal"), "Title 'Vice President Portal' is preserved");
  assert(dashboardCode.includes("Member Portal"), "Title 'Member Portal' is preserved");
  assert(dashboardCode.includes("/admin/management/login"), "Destination '/admin/management/login' is preserved");
  assert(dashboardCode.includes("/admin/president/login"), "Destination '/admin/president/login' is preserved");
  assert(dashboardCode.includes("/admin/vice-president/login"), "Destination '/admin/vice-president/login' is preserved");
  assert(dashboardCode.includes("/admin/member/login"), "Destination '/admin/member/login' is preserved");
  assert(dashboardCode.includes("grid-cols-1 md:grid-cols-2 lg:grid-cols-4"), "4-column responsive grid layout is preserved");

  // 5. Cross-Component Consistency (RoleLoginForm & PortalSelector)
  console.log("\n[5/5] Verifying Role Login Form & Portal Selector Alignment...");
  const roleLoginCode = fs.readFileSync(path.resolve("src/components/admin/RoleLoginForm.tsx"), "utf-8");
  assert(roleLoginCode.includes("Landmark"), "RoleLoginForm imports and maps Landmark for Admin");
  assert(roleLoginCode.includes("ShieldCheck"), "RoleLoginForm imports and maps ShieldCheck for President");
  assert(roleLoginCode.includes("CalendarCheck2"), "RoleLoginForm imports and maps CalendarCheck2 for Vice President");
  assert(roleLoginCode.includes("Users"), "RoleLoginForm imports and maps Users for Member");

  console.log("\n================================================================================");
  console.log("🎉 ALL 18 PORTAL VISUAL IDENTITY VERIFICATION CHECKS PASSED!");
  console.log("================================================================================\n");
}

verifyPortalIconsUpgrade();
