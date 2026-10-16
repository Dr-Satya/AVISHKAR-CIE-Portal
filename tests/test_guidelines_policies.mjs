/**
 * AVISHKAR-v2 — Event Guidelines & Participation Policies Test Suite
 *
 * Verifies:
 * 1. Eyebrow label: OFFICIAL EVENT POLICY
 * 2. Main heading: Event Guidelines & Participation Policies
 * 3. Formal description establishing requirements
 * 4. Policy Section 1: Eligibility & Participation (5 points)
 * 5. Policy Section 2: Registration & Payment Verification (6 points)
 * 6. Policy Section 3: Academic Integrity & Professional Conduct (5 points)
 * 7. Policy Section 4: Event Administration & Decisions (5 points)
 * 8. Participant Acknowledgement section and text
 * 9. Server-rendered HTML at http://localhost:3000/#guidelines
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

async function run() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Event Guidelines & Participation Policies Tests");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // Step 1: Verify Component File Content
  console.log("[1/3] Inspecting GuidelinesSection.tsx Source Code...");
  const compPath = path.resolve("src/components/home/GuidelinesSection.tsx");
  assert(fs.existsSync(compPath), "src/components/home/GuidelinesSection.tsx exists");
  const code = fs.readFileSync(compPath, "utf8");

  // Header Elements
  assert(code.includes("OFFICIAL EVENT POLICY"), "Eyebrow label: 'OFFICIAL EVENT POLICY'");
  assert(code.includes("Event Guidelines &amp; Participation Policies") || code.includes("Event Guidelines & Participation Policies"), "Main heading: 'Event Guidelines & Participation Policies'");
  assert(code.includes("These guidelines establish the requirements for participant eligibility"), "Formal institutional description present");

  // Section 1
  assert(code.includes("Eligibility & Participation"), "Section 1: 'Eligibility & Participation'");
  assert(code.includes("Participation is open to eligible students"), "Section 1 - Point 1 present");
  assert(code.includes("accurate academic and identification details"), "Section 1 - Point 2 present");
  assert(code.includes("valid student identity card may be required"), "Section 1 - Point 3 present");
  assert(code.includes("Interdisciplinary participation and team composition"), "Section 1 - Point 4 present");
  assert(code.includes("comply with applicable university policies"), "Section 1 - Point 5 present");

  // Section 2
  assert(code.includes("Registration & Payment Verification"), "Section 2: 'Registration & Payment Verification'");
  assert(code.includes("designated AVISHKAR registration portal"), "Section 2 - Point 1 present");
  assert(code.includes("accurate, complete, and submitted within the applicable registration period"), "Section 2 - Point 2 present");
  assert(code.includes("Registration fees, where applicable"), "Section 2 - Point 3 present");
  assert(code.includes("Payment confirmation is subject to verification by the authorized administration team"), "Section 2 - Point 4 present");
  assert(code.includes("Submission of a payment receipt or screenshot does not, by itself, constitute payment approval"), "Section 2 - Point 5 present");
  assert(code.includes("applicable verification and approval requirements have been satisfied"), "Section 2 - Point 6 present");

  // Section 3
  assert(code.includes("Academic Integrity & Professional Conduct"), "Section 3: 'Academic Integrity & Professional Conduct'");
  assert(code.includes("originality, attribution, and intellectual property requirements"), "Section 3 - Point 1 present");
  assert(code.includes("Plagiarism, misrepresentation of authorship, unauthorized use of others' work"), "Section 3 - Point 2 present");
  assert(code.includes("permitted tools, software, datasets, external assistance, and AI-generated content"), "Section 3 - Point 3 present");
  assert(code.includes("professionalism and respect"), "Section 3 - Point 4 present");
  assert(code.includes("organizing committee may review reported violations"), "Section 3 - Point 5 present");

  // Section 4
  assert(code.includes("Event Administration & Decisions"), "Section 4: 'Event Administration & Decisions'");
  assert(code.includes("official event schedule, submission deadlines, venue instructions"), "Section 4 - Point 1 present");
  assert(code.includes("communicated through official channels where applicable"), "Section 4 - Point 2 present");
  assert(code.includes("Judging criteria and evaluation procedures"), "Section 4 - Point 3 present");
  assert(code.includes("authorized judging panel or organizing committee"), "Section 4 - Point 4 present");
  assert(code.includes("directed to the designated organizing team"), "Section 4 - Point 5 present");

  // Participant Acknowledgement
  assert(code.includes("Participant Acknowledgement"), "Section 5: 'Participant Acknowledgement'");
  assert(code.includes("By registering for an AVISHKAR event, participants acknowledge"), "Acknowledgement text present");
  assert(code.includes("accuracy of their submitted information and meeting all applicable deadlines"), "Full acknowledgement body verified");

  // Step 2: Verify Public Homepage Rendered HTML
  console.log("\n[2/3] Fetching Homepage HTML from Local Dev Server...");
  const homeRes = await fetch(BASE_URL);
  assert(homeRes.ok, `GET ${BASE_URL} returns HTTP 200 (Got ${homeRes.status})`);
  const html = await homeRes.text();

  assert(html.includes('id="guidelines"'), 'Homepage contains #guidelines section anchor');
  assert(html.includes("OFFICIAL EVENT POLICY"), "Rendered HTML contains 'OFFICIAL EVENT POLICY'");
  assert(html.includes("Event Guidelines &amp; Participation Policies") || html.includes("Event Guidelines & Participation Policies"), "Rendered HTML contains 'Event Guidelines & Participation Policies'");
  assert(html.includes("Eligibility &amp; Participation") || html.includes("Eligibility & Participation"), "Rendered HTML contains Eligibility section");
  assert(html.includes("Registration &amp; Payment Verification") || html.includes("Registration & Payment Verification"), "Rendered HTML contains Registration & Payment section");
  assert(html.includes("Academic Integrity &amp; Professional Conduct") || html.includes("Academic Integrity & Professional Conduct"), "Rendered HTML contains Academic Integrity section");
  assert(html.includes("Event Administration &amp; Decisions") || html.includes("Event Administration & Decisions"), "Rendered HTML contains Event Administration section");
  assert(html.includes("Participant Acknowledgement"), "Rendered HTML contains Participant Acknowledgement section");

  // Step 3: Verify In-Page Anchor Links Across Public Site
  console.log("\n[3/3] Checking In-Page Navigation Links to #guidelines...");
  assert(html.includes('href="/#guidelines"') || html.includes('href="#guidelines"'), "Public page contains anchor links targeting #guidelines");

  console.log("\n================================================================================");
  console.log(`Summary: Passed: ${passedCount}, Failed: ${failedCount}`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
