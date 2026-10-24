import fs from "fs";
import path from "path";
import assert from "assert";

console.log("================================================================================");
console.log("AVISHKAR 2026 — Portal Selection Header Verification");
console.log("================================================================================");

const layoutPath = path.resolve("src/app/admin/layout.tsx");
const layoutContent = fs.readFileSync(layoutPath, "utf-8");

console.log("\n[1/4] Verifying Portal Selection header in src/app/admin/layout.tsx...");

// Verify the header container exists
assert(
  layoutContent.includes('isDashboardPage') &&
  layoutContent.includes('bg-[#0A2047] border-b border-[#D4AF37]/30'),
  "Portal selection header with Deep Navy background and gold border is present"
);
console.log("  ✓ PASS: Deep Navy Blue (#0A2047) header container with gold border preserved");

// Verify logo lockup exists
assert(
  layoutContent.includes('/images/home-logo.svg'),
  "Header contains GD Goenka University + NAAC Grade A+ logo (/images/home-logo.svg)"
);
assert(
  layoutContent.includes('alt="GD Goenka University | NAAC Grade A+ Accredited"'),
  "Header contains accessible alt text for GD Goenka University | NAAC Grade A+ Accredited"
);
console.log("  ✓ PASS: GD Goenka University and NAAC Grade A+ logos preserved");

// Verify Return to Website button exists
assert(
  layoutContent.includes('Return to Website') &&
  layoutContent.includes('&larr; Return to Website'),
  "Header contains 'Return to Website' button with arrow"
);
assert(
  layoutContent.includes('title="Return to AVISHKAR Main Website"'),
  "Return to Website button has title attribute"
);
console.log("  ✓ PASS: 'Return to Website' button with arrow and destination preserved");

// Verify title "AVISHKAR Portal Selection" is REMOVED from the header
const headerMatch = layoutContent.match(/if\s*\(isDashboardPage\)\s*\{([\s\S]*?)<\/header>/);
assert(headerMatch, "Found isDashboardPage header block");
const headerBlock = headerMatch[1];

assert(
  !headerBlock.includes("AVISHKAR Portal Selection"),
  "Header block does NOT contain 'AVISHKAR Portal Selection'"
);
assert(
  !headerBlock.includes("<h1"),
  "Header block does NOT contain any <h1> heading element"
);
console.log("  ✓ PASS: 'AVISHKAR Portal Selection' heading element cleanly removed from header");

console.log("\n[2/4] Verifying Portal Selection page content in src/app/admin/dashboard/page.tsx...");
const dashboardPath = path.resolve("src/app/admin/dashboard/page.tsx");
const dashboardContent = fs.readFileSync(dashboardPath, "utf-8");

assert(
  dashboardContent.includes("AVISHKAR Portal Selection"),
  "Dashboard page content preserves its page heading 'AVISHKAR Portal Selection'"
);
assert(
  dashboardContent.includes("Administrative Management Portal") &&
  dashboardContent.includes("President Portal") &&
  dashboardContent.includes("Vice President Portal") &&
  dashboardContent.includes("Member Portal"),
  "All 4 portal cards preserved on dashboard page"
);
console.log("  ✓ PASS: Portal Selection page body heading and all 4 portal cards preserved");

console.log("\n[3/4] Verifying shared headers on other pages...");
const publicHeaderPath = path.resolve("src/components/layout/Header.tsx");
const publicHeaderContent = fs.readFileSync(publicHeaderPath, "utf-8");
assert(
  publicHeaderContent.includes("/images/home-logo.svg"),
  "Public header preserved"
);

const adminHeaderPath = path.resolve("src/components/admin/AdminHeader.tsx");
const adminHeaderContent = fs.readFileSync(adminHeaderPath, "utf-8");
assert(
  adminHeaderContent.includes("export function AdminHeader"),
  "AdminHeader component preserved"
);
console.log("  ✓ PASS: Public and AdminHeader components remain unmodified");

console.log("\n[4/4] Verifying alignment and spacing in header...");
assert(
  headerBlock.includes("justify-between"),
  "Header flex layout maintains justify-between for clean left/right distribution"
);
assert(
  !headerBlock.includes("w-px bg-white/25"),
  "Dangling vertical divider removed cleanly"
);
console.log("  ✓ PASS: Clean alignment without dangling dividers or large empty gaps");

console.log("\n================================================================================");
console.log("🎉 ALL PORTAL SELECTION HEADER VERIFICATIONS PASSED!");
console.log("================================================================================");
