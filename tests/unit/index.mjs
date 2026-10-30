/**
 * AVISHKAR-v2 Unit Test Suite Runner
 * Executes unit-level validation suites for document inspection, status synchronization, and persistence guards.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(__dirname, "..");

const unitSuites = [
  "test_document_upload_and_retrieval.mjs",
  "test_dashboard_counting_and_rejection_sync.mjs",
  "test_student_approval_persistence_regression.mjs",
];

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Unit Test Suite Runner");
console.log("================================================================================\n");

let failedCount = 0;

for (const suite of unitSuites) {
  const suitePath = path.join(testsRoot, suite);
  console.log(`▶ Running unit suite: ${suite}`);
  const result = spawnSync("node", [suitePath], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`❌ Suite failed: ${suite} (exit code ${result.status})`);
    failedCount++;
  }
  console.log("\n");
}

if (failedCount > 0) {
  console.error(`💥 ${failedCount} unit suite(s) failed.`);
  process.exit(1);
} else {
  console.log("✨ All unit test suites passed successfully!\n");
}
