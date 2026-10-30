/**
 * AVISHKAR-v2 Integration Test Suite Runner
 * Executes integration suites for multi-tier document previews, registration submission, Resend notifications, and QR integration.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(__dirname, "..");

const integrationSuites = [
  "test_document_preview_approval.mjs",
  "test_api_register.mjs",
  "test_email_notifications.mjs",
  "test_phonepe_qr_integration.mjs",
];

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Integration Test Suite Runner");
console.log("================================================================================\n");

let failedCount = 0;

for (const suite of integrationSuites) {
  const suitePath = path.join(testsRoot, suite);
  console.log(`▶ Running integration suite: ${suite}`);
  const result = spawnSync("node", [suitePath], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`❌ Suite failed: ${suite} (exit code ${result.status})`);
    failedCount++;
  }
  console.log("\n");
}

if (failedCount > 0) {
  console.error(`💥 ${failedCount} integration suite(s) failed.`);
  process.exit(1);
} else {
  console.log("✨ All integration test suites passed successfully!\n");
}
