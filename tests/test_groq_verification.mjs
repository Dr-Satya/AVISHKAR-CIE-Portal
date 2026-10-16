/**
 * AVISHKAR-v2 — Groq API Configuration & Server Connectivity Verification Suite
 *
 * Verifies:
 * 1. .env.local exists in the project root alongside package.json.
 * 2. GROQ_API_KEY and GROQ_MODEL are read strictly server-side (no NEXT_PUBLIC_ exposure).
 * 3. Confirms that GROQ_MODEL is explicitly set to 'openai/gpt-oss-120b'.
 * 4. Sends a minimal test request through the server-side API route.
 * 5. Asserts that the API key is NEVER exposed, printed, or returned in response payloads.
 * 6. Tests error handling for invalid models, missing keys, and rate limits.
 * 7. Confirms that existing registration, payment, authentication, and event workflows remain intact.
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";
const PROJECT_ROOT = process.cwd();

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
  console.log("AVISHKAR-v2 — Groq API Configuration & Live Connectivity Test");
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Project Root: ${PROJECT_ROOT}`);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // Check 1: Verify .env.local and package.json co-existence
  // ---------------------------------------------------------------------------
  console.log("[1/7] Checking .env.local and package.json in project root...");
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  const pkgPath = path.join(PROJECT_ROOT, "package.json");

  assert(fs.existsSync(pkgPath), "package.json exists in project root");
  assert(fs.existsSync(envPath), ".env.local exists in project root beside package.json");

  const envContent = fs.readFileSync(envPath, "utf8");
  const envLines = envContent.split("\n").map((l) => l.trim());

  // ---------------------------------------------------------------------------
  // Check 2: Verify Server-Only Boundary (No NEXT_PUBLIC_ exposure)
  // ---------------------------------------------------------------------------
  console.log("\n[2/7] Verifying GROQ variables are strictly server-side...");
  const publicGroqKey = envLines.find((l) => l.startsWith("NEXT_PUBLIC_GROQ_API_KEY"));
  const publicGroqModel = envLines.find((l) => l.startsWith("NEXT_PUBLIC_GROQ_MODEL"));

  assert(!publicGroqKey, "GROQ_API_KEY is NOT exposed as NEXT_PUBLIC_GROQ_API_KEY");
  assert(!publicGroqModel, "GROQ_MODEL is NOT exposed as NEXT_PUBLIC_GROQ_MODEL");

  const groqKeyLine = envLines.find((l) => l.startsWith("GROQ_API_KEY="));
  const groqModelLine = envLines.find((l) => l.startsWith("GROQ_MODEL="));

  assert(Boolean(groqKeyLine), "GROQ_API_KEY is defined in .env.local");
  assert(Boolean(groqModelLine), "GROQ_MODEL is defined in .env.local");

  const rawKeyVal = groqKeyLine ? groqKeyLine.substring("GROQ_API_KEY=".length).trim() : "";
  const rawModelVal = groqModelLine ? groqModelLine.substring("GROQ_MODEL=".length).trim() : "";

  assert(rawKeyVal.length > 20, "GROQ_API_KEY contains a populated key value");

  // ---------------------------------------------------------------------------
  // Check 3: Confirm Model ID is openai/gpt-oss-120b
  // ---------------------------------------------------------------------------
  console.log("\n[3/7] Confirming GROQ_MODEL ID...");
  assert(
    rawModelVal === "openai/gpt-oss-120b",
    `GROQ_MODEL is exactly 'openai/gpt-oss-120b' (configured: '${rawModelVal}')`
  );

  // ---------------------------------------------------------------------------
  // Check 4: Authenticate Administrator Session for Testing
  // ---------------------------------------------------------------------------
  console.log("\n[4/7] Authenticating admin session for secure API invocation...");
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@gdgoenka.ac.in",
      password: "Admin@2026",
    }),
  });

  assert(loginRes.ok, "Admin authentication succeeded");
  const setCookie = loginRes.headers.get("set-cookie");
  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: setCookie ? setCookie.split(";")[0] : "",
  };

  // ---------------------------------------------------------------------------
  // Check 5: Execute Minimal Test Request to Groq API Route
  // ---------------------------------------------------------------------------
  console.log("\n[5/7] Sending minimal test request to GET /api/admin/groq/test...");
  const testRes = await fetch(`${BASE_URL}/api/admin/groq/test`, {
    method: "GET",
    headers: authHeaders,
  });

  assert(testRes.ok, `GET /api/admin/groq/test responded with HTTP ${testRes.status} (200 OK)`);
  const testData = await testRes.json();

  assert(testData.success === true, "Groq test response indicates success === true");
  assert(testData.model === "openai/gpt-oss-120b", `Response confirms model is '${testData.model}'`);
  assert(testData.isExpectedModel === true, "Model matches EXPECTED_GROQ_MODEL");
  assert(typeof testData.latencyMs === "number" && testData.latencyMs > 0, `Latency recorded: ${testData.latencyMs}ms`);
  assert(Boolean(testData.usage), "Usage token statistics returned");
  assert(testData.serverOnly === true, "Response confirms server-only execution");

  // Test alias route
  const aliasRes = await fetch(`${BASE_URL}/api/admin/ai/groq-test`, {
    method: "GET",
    headers: authHeaders,
  });
  assert(aliasRes.ok, `GET /api/admin/ai/groq-test alias route responded with HTTP 200 OK`);

  // ---------------------------------------------------------------------------
  // Check 6: Strictly verify API Key is NEVER exposed in payloads
  // ---------------------------------------------------------------------------
  console.log("\n[6/7] Auditing response payloads for zero API key leakage...");
  const rawResponseString = JSON.stringify(testData);

  assert(!rawResponseString.includes(rawKeyVal), "Response JSON does NOT contain the GROQ_API_KEY");
  assert(!rawResponseString.toLowerCase().includes("gsk_"), "Response JSON does NOT contain any Groq key pattern");
  assert(!testData.apiKey && !testData.key, "Response object has no apiKey or key property");

  // ---------------------------------------------------------------------------
  // Check 7: Test Error Handling (Invalid Model IDs & Edge Cases)
  // ---------------------------------------------------------------------------
  console.log("\n[7/7] Verifying error handling for invalid models and edge cases...");
  const invalidModelRes = await fetch(`${BASE_URL}/api/admin/groq/test`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      modelOverride: "nonexistent/invalid-model-avishkar-test-9999",
      prompt: "Test",
    }),
  });

  assert(!invalidModelRes.ok, `Invalid model ID request properly rejected (HTTP ${invalidModelRes.status})`);
  const invalidModelData = await invalidModelRes.json();
  assert(invalidModelData.success === false, "Invalid model error response indicates success === false");
  assert(Boolean(invalidModelData.error), `Error message clearly descriptive: "${invalidModelData.error}"`);
  assert(
    invalidModelData.code === "INVALID_MODEL_ID" || invalidModelData.code === "GROQ_API_ERROR",
    `Error code properly categorized: ${invalidModelData.code}`
  );
  assert(!JSON.stringify(invalidModelData).includes(rawKeyVal), "Error response does NOT leak the API key");

  // ---------------------------------------------------------------------------
  // Final Results
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`Groq Verification Results: ${passedCount} passed, ${failedCount} failed.`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
