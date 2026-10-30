// tests/test_student_approval_persistence_regression.mjs
// Regression test suite for AVISHKAR-v2 student registration approval & persistence

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const jiti = createJiti(import.meta.url);
const { isValidUuid, getSafeUuid, sanitizeDatabaseError } = jiti("../src/lib/supabaseDbUtils.ts");

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Student Approval & Database Persistence Regression Suite");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof res.then === "function") {
      res.then(
        () => {
          console.log(`  ✅ [PASS] ${name}`);
          passedTests++;
        },
        (err) => {
          console.error(`  ❌ [FAIL] ${name}`);
          console.error(`     Error: ${err.message}`);
          process.exitCode = 1;
        }
      );
      return res;
    }
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. UUID Validation & Non-UUID Guard Tests
runTest("UUID validation distinguishes RFC-4122 UUIDs from council IDs, emails, and reg numbers", () => {

  const validUuid1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  const validUuid2 = "550e8400-e29b-41d4-a716-446655440000";

  assert.strictEqual(isValidUuid(validUuid1), true, "Standard UUIDv4 must be valid");
  assert.strictEqual(isValidUuid(validUuid2), true, "Standard UUIDv1 must be valid");
  assert.strictEqual(getSafeUuid(validUuid1), validUuid1, "getSafeUuid must return clean UUID");

  // Non-UUID values that caused PostgreSQL 22P02 error
  assert.strictEqual(isValidUuid("usr_admin"), false, "'usr_admin' is not a UUID");
  assert.strictEqual(getSafeUuid("usr_admin"), null, "getSafeUuid('usr_admin') must return null");

  assert.strictEqual(isValidUuid("admin@gdgu.org"), false, "Email address is not a UUID");
  assert.strictEqual(getSafeUuid("admin@gdgu.org"), null, "getSafeUuid(email) must return null");

  assert.strictEqual(isValidUuid("reg-1791829245689-1234"), false, "Local store ID is not a UUID");
  assert.strictEqual(getSafeUuid("reg-1791829245689-1234"), null, "getSafeUuid(localId) must return null");

  assert.strictEqual(isValidUuid("AVISHKAR-2026-159993"), false, "Registration number is not a UUID");
  assert.strictEqual(getSafeUuid("AVISHKAR-2026-159993"), null, "getSafeUuid(regNumber) must return null");

  assert.strictEqual(isValidUuid(null), false, "null must return false");
  assert.strictEqual(isValidUuid(undefined), false, "undefined must return false");
  assert.strictEqual(isValidUuid(""), false, "Empty string must return false");
});

// 2. Database Error Sanitization & PII/Secret Masking
runTest("sanitizeDatabaseError strips secrets and PII while delivering clear diagnostics", () => {

  // Case A: PostgreSQL 22P02 invalid UUID error
  const rawUuidErr = JSON.stringify({
    code: "22P02",
    details: null,
    hint: null,
    message: 'invalid input syntax for type uuid: "usr_admin"',
  });
  const sanitizedUuid = sanitizeDatabaseError(rawUuidErr, 400);
  assert.match(sanitizedUuid, /Invalid UUID format \(22P02\)/, "Must identify 22P02 error");
  assert.doesNotMatch(sanitizedUuid, /usr_admin/, "Should not leak internal identifier details");

  // Case B: PostgreSQL 42703 column does not exist error
  const rawColErr = JSON.stringify({
    code: "42703",
    details: null,
    hint: null,
    message: 'column "student_rejection_reason" of relation "registrations" does not exist',
  });
  const sanitizedCol = sanitizeDatabaseError(rawColErr, 400);
  assert.match(sanitizedCol, /Schema mismatch \(42703\)/, "Must identify column mismatch");
  assert.match(sanitizedCol, /student_rejection_reason/, "Must identify the missing column");

  // Case C: Secret and PII redaction
  const rawLeakErr = 'Error for student email john.doe@gdgu.org with Bearer eyJhbGciOiJIUzI1Ni.secret and apikey=secret123';
  const sanitizedLeak = sanitizeDatabaseError(rawLeakErr, 500);
  assert.doesNotMatch(sanitizedLeak, /john\.doe@gdgu\.org/, "Must redact student email");
  assert.match(sanitizedLeak, /\[REDACTED_EMAIL\]/, "Must replace email with redaction placeholder");
  assert.doesNotMatch(sanitizedLeak, /eyJhbGciOiJIUzI1Ni/, "Must redact token");
  assert.match(sanitizedLeak, /\[REDACTED_TOKEN\]|\[REDACTED\]/, "Must mask token/key");
});

// 3. Approval Endpoint Code Structure & Security Gates
runTest("Approval route uses safe UUIDs, safe target routing, and awaits DB persistence", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/approve/route.ts"), "utf-8");

  // Security gate checks
  assert.match(content, /getAdminSessionFromRequest/, "Must enforce admin authentication");
  assert.match(content, /session\.user\.role !== "Admin"/, "Must enforce Admin role");
  assert.match(content, /idCardConfirmed !== true \|\| paymentConfirmed !== true/, "Must strictly require dual checkboxes");
  assert.match(content, /id_card_file_path/, "Must validate ID card document existence");
  assert.match(content, /receipt_file_path/, "Must validate receipt document existence");

  // Safe identifier resolution
  assert.match(content, /isValidUuid/, "Must import and use isValidUuid");
  assert.match(content, /getSafeUuid/, "Must import and use getSafeUuid");
  assert.match(content, /safeVerifiedByUuid/, "Must pass safe UUID or null for verified_by");
  assert.match(content, /registration_number=eq\./, "Must fall back to registration_number when ID is not a UUID");

  // DB update before dataStore commit
  const dbPatchIndex = content.indexOf("patchRes = await fetch(patchUrl");
  const dataStoreCommitIndex = content.indexOf("approveStoredRegistration({");
  assert.ok(dbPatchIndex > 0, "Must have DB patch fetch call");
  assert.ok(dataStoreCommitIndex > 0, "Must have approveStoredRegistration call");
  assert.ok(dbPatchIndex < dataStoreCommitIndex, "Must execute Supabase update BEFORE committing to dataStore");

  // Error handling
  assert.match(content, /sanitizeDatabaseError/, "Must sanitize database error");
  assert.match(content, /DATABASE_UPDATE_FAILED/, "Must return DATABASE_UPDATE_FAILED on failure");
  assert.match(content, /status:\s*502/, "Must return HTTP 502 on DB update failure");
});

// 4. Rejection Endpoint Code Structure & Unsupported Column Removal
runTest("Rejection route removes non-existent columns and routes identifiers safely", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/reject/route.ts"), "utf-8");

  // Non-existent columns must be removed from PATCH body
  assert.doesNotMatch(content, /student_rejection_reason:/, "Must NOT send non-existent student_rejection_reason column");
  assert.doesNotMatch(content, /rejection_reason:/, "Must NOT send non-existent rejection_reason column to DB");

  // Safe identifier routing and UUID handling
  assert.match(content, /isValidUuid/, "Must import and use isValidUuid");
  assert.match(content, /getSafeUuid/, "Must import and use getSafeUuid");
  assert.match(content, /safeVerifiedByUuid/, "Must pass safe UUID or null for verified_by");
  assert.match(content, /registration_number=eq\./, "Must fall back to registration_number when ID is not a UUID");

  // DB update before dataStore commit
  const dbPatchIndex = content.indexOf("patchRes = await fetch(patchUrl");
  const dataStoreCommitIndex = content.indexOf("rejectStoredRegistration({");
  assert.ok(dbPatchIndex > 0, "Must have DB patch fetch call");
  assert.ok(dataStoreCommitIndex > 0, "Must have rejectStoredRegistration call");
  assert.ok(dbPatchIndex < dataStoreCommitIndex, "Must execute Supabase update BEFORE committing to dataStore");
});

// 5. Payments & Students Verify Routes Safe Identifier Routing
runTest("Payments and Students verify routes use safe UUID and registration_number queries", () => {
  const payContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/payments/verify/route.ts"), "utf-8");
  assert.doesNotMatch(payContent, /or=\(id\.eq\./, "Must NOT perform or=(id.eq...) with non-UUID identifiers");
  assert.match(payContent, /isValidUuid\(registrationId\)/, "Must check isValidUuid on registrationId");
  assert.match(payContent, /safeVerifiedByUuid/, "Must use safe UUID for verified_by");

  const stuContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/students/verify/route.ts"), "utf-8");
  assert.doesNotMatch(stuContent, /or=\(id\.eq\./, "Must NOT perform or=(id.eq...) with non-UUID identifiers");
  assert.match(stuContent, /isValidUuid\(registrationId\)/, "Must check isValidUuid on registrationId");
  assert.match(stuContent, /safeStudentVerifiedBy/, "Must use safe UUID for student_verified_by");
});

// 6. Registration Listing UUID Preservation
runTest("Admin registrations route preserves authentic database UUIDs during merge", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/route.ts"), "utf-8");
  assert.match(content, /realDbUuid/, "Must extract real database UUID");
  assert.match(content, /isValidUuid\(existing\.id\)/, "Must check if existing.id is a valid UUID");
});

console.log("\n================================================================================");
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
console.log("================================================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
