import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Admin Management Dashboard Redesign Verification");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// 1. Verify src/app/admin/overview/page.tsx has all 6 summary cards with required routes
runTest("Overview page renders all 6 clickable summary cards", () => {
  const overviewFile = path.join(rootDir, "src/app/admin/overview/page.tsx");
  assert.ok(fs.existsSync(overviewFile), "overview page.tsx should exist");
  const content = fs.readFileSync(overviewFile, "utf-8");

  // Card 1: Total Registered Students -> /admin/registrations
  assert.match(content, /href="\/admin\/registrations"/, "Card 1 must navigate to /admin/registrations");
  assert.match(content, /Total Registered Students/i, "Card 1 must have title Total Registered Students");

  // Card 2: Pending Registrations -> /admin/registrations?status=pending
  assert.match(content, /href="\/admin\/registrations\?status=pending"/, "Card 2 must navigate to /admin/registrations?status=pending");
  assert.match(content, /Pending Registrations/i, "Card 2 must have title Pending Registrations");

  // Card 3: Payments Approved -> /admin/payments?status=verified
  assert.match(content, /href="\/admin\/payments\?status=verified"/, "Card 3 must navigate to /admin/payments?status=verified");
  assert.match(content, /Payments Approved/i, "Card 3 must have title Payments Approved");

  // Card 4: Payments Rejected -> /admin/payments?status=rejected
  assert.match(content, /href="\/admin\/payments\?status=rejected"/, "Card 4 must navigate to /admin/payments?status=rejected");
  assert.match(content, /Payments Rejected/i, "Card 4 must have title Payments Rejected");

  // Card 5: Published Events -> /admin/events?status=published
  assert.match(content, /href="\/admin\/events\?status=published"/, "Card 5 must navigate to /admin/events?status=published");
  assert.match(content, /Published Events/i, "Card 5 must have title Published Events");

  // Card 6: Main / Events Management -> /admin/events
  assert.match(content, /href="\/admin\/events"/, "Card 6 must navigate to /admin/events");
  assert.match(content, /Events Management/i, "Card 6 must have title Events Management");
});

// 2. Verify all cards are fully wrapped in <Link> components (entire card clickable)
runTest("All cards are fully wrapped in <Link> with interactive hover/cursor styles", () => {
  const overviewFile = path.join(rootDir, "src/app/admin/overview/page.tsx");
  const content = fs.readFileSync(overviewFile, "utf-8");

  // Check that the cards are rendered using Link wrappers with cursor-pointer and group styling
  const linkMatches = content.match(/<Link\s+href="[^"]*"\s+className="group[^"]*cursor-pointer/g);
  assert.ok(linkMatches && linkMatches.length >= 6, `Should have at least 6 clickable cards, found ${linkMatches ? linkMatches.length : 0}`);
});

// 3. Verify /api/admin/stats route computes all 6 metrics dynamically
runTest("Stats API computes dynamic counts for all 6 metrics without hardcoded numbers", () => {
  const statsRouteFile = path.join(rootDir, "src/app/api/admin/stats/route.ts");
  assert.ok(fs.existsSync(statsRouteFile), "stats route.ts must exist");
  const content = fs.readFileSync(statsRouteFile, "utf-8");

  // Checks dynamic calculations
  assert.match(content, /paymentsApproved\+\+/, "Must dynamically count paymentsApproved");
  assert.match(content, /paymentsRejected\+\+/, "Must dynamically count paymentsRejected");
  assert.match(content, /pendingRegistrations\+\+/, "Must dynamically count pendingRegistrations");
  assert.match(content, /isPending = !isApproved && !isRejected/, "Must exclude approved and rejected from pending registrations");
  assert.match(content, /getStoredEvents\(\)/, "Must use getStoredEvents()");
  assert.match(content, /getStoredMembers\(\)/, "Must use getStoredMembers()");
  assert.match(content, /e\.status === "published"/, "Must filter published events by e.status === 'published'");

  // No hardcoded totalEvents: 4 or publishedEvents: 3
  assert.doesNotMatch(content, /totalEvents:\s*4/, "Should not have hardcoded totalEvents: 4");
  assert.doesNotMatch(content, /publishedEvents:\s*3/, "Should not have hardcoded publishedEvents: 3");
});

// 4. Verify DashboardStats interface contains all required metric fields
runTest("DashboardStats TypeScript type defines all metrics", () => {
  const adminTypesFile = path.join(rootDir, "src/types/admin.ts");
  const content = fs.readFileSync(adminTypesFile, "utf-8");

  assert.match(content, /totalRegistrations:\s*number;/, "Must declare totalRegistrations");
  assert.match(content, /pendingRegistrations:\s*number;/, "Must declare pendingRegistrations");
  assert.match(content, /paymentsApproved:\s*number;/, "Must declare paymentsApproved");
  assert.match(content, /paymentsRejected:\s*number;/, "Must declare paymentsRejected");
  assert.match(content, /publishedEvents:\s*number;/, "Must declare publishedEvents");
  assert.match(content, /totalEvents:\s*number;/, "Must declare totalEvents");
});

// 5. Verify Destination Page 1: /admin/registrations respects ?status=pending
runTest("/admin/registrations handles ?status=pending and ?paymentStatus filters", () => {
  const regPageFile = path.join(rootDir, "src/app/admin/registrations/page.tsx");
  const content = fs.readFileSync(regPageFile, "utf-8");

  assert.match(content, /useSearchParams/, "Must use useSearchParams");
  assert.match(content, /statusParam === "pending"/, "Must map status=pending parameter");
  assert.match(content, /setOverallStatus\("pending"\)/, "Must set overallStatus to pending on pending filter");
});

// 6. Verify Destination Page 2: /admin/payments respects ?status=verified and ?status=rejected
runTest("/admin/payments handles ?status=verified and ?status=rejected tabs", () => {
  const payPageFile = path.join(rootDir, "src/app/admin/payments/page.tsx");
  const content = fs.readFileSync(payPageFile, "utf-8");

  assert.match(content, /useSearchParams/, "Must use useSearchParams");
  assert.match(content, /s === "verified"/, "Must handle verified status filter");
  assert.match(content, /s === "rejected"/, "Must handle rejected status filter");
  assert.match(content, /Suspense/, "Must wrap in Suspense for useSearchParams");
});

// 7. Verify Destination Page 3: /admin/events respects ?status=published
runTest("/admin/events handles ?status=published view and filter", () => {
  const eventsPageFile = path.join(rootDir, "src/app/admin/events/page.tsx");
  const content = fs.readFileSync(eventsPageFile, "utf-8");

  assert.match(content, /statusParam/, "Must read statusParam");
  assert.match(content, /setViewMode\("operations"\)/, "Must switch to operations viewMode on status filter");
  assert.match(content, /setFilterStatus\(statusParam\)/, "Must set filterStatus to statusParam");
  assert.match(content, /Suspense/, "Must wrap in Suspense for useSearchParams");
});

// 8. Verify existing Event Approval Pipeline and Recent Registrations are present on overview
runTest("Overview page preserves Event Approval Pipeline and Recent Registrations table", () => {
  const overviewFile = path.join(rootDir, "src/app/admin/overview/page.tsx");
  const content = fs.readFileSync(overviewFile, "utf-8");

  assert.match(content, /Event Approval Pipeline/i, "Must preserve Event Approval Pipeline section");
  assert.match(content, /Recent Student Registrations/i, "Must have Recent Student Registrations table");
  assert.match(content, /getPresidentDecision/, "Must use executive tracker helper for President");
  assert.match(content, /getVicePresidentDecision/, "Must use executive tracker helper for Vice President");
});

console.log("\n--------------------------------------------------------------------------------");
console.log(`Test Results: ${passedTests} / ${totalTests} Passed`);
console.log("--------------------------------------------------------------------------------\n");

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log("✨ All 8 Admin Dashboard Redesign verification tests passed!");
}
