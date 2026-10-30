/**
 * AVISHKAR-v2 End-to-End Test Suite Runner
 * Executes E2E rehearsal and role-based portal workflow validation suites.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(__dirname, "..");

const e2eSuites = [
  "test_admin_dashboard_redesign.mjs",
  "test_mentor_demo_e2e.mjs",
  "test_demo_rehearsal.mjs",
];

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: End-to-End Workflow Test Runner");
console.log("================================================================================\n");

let failedCount = 0;

for (const suite of e2eSuites) {
  const suitePath = path.join(testsRoot, suite);
  console.log(`▶ Running E2E suite: ${suite}`);
  const result = spawnSync("node", [suitePath], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`❌ Suite failed: ${suite} (exit code ${result.status})`);
    failedCount++;
  }
  console.log("\n");
}

if (failedCount > 0) {
  console.error(`💥 ${failedCount} E2E suite(s) failed.`);
  process.exit(1);
} else {
  console.log("✨ All E2E test suites passed successfully!\n");
}
