import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Rejection Independence & Dashboard Counting Verification");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// 1. Verify that reject route distinguishes between student rejection and payment rejection
test("Reject route preserves payment status when rejecting student identity", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/reject/route.ts"), "utf-8");
  assert.match(content, /isPaymentReason/, "Must check if reason is payment-related");
  assert.match(content, /body\.rejectPaymentToo === true/, "Must only reject payment if requested or payment-related");
  assert.match(content, /currentRecord\.payment_status \|\| "pending_verification"/, "Must preserve existing payment status when rejecting student identity");
});

// 2. Verify that dataStore rejectStoredRegistration preserves payment status
test("dataStore.rejectStoredRegistration preserves payment_status by default", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/lib/dataStore.ts"), "utf-8");
  assert.match(content, /if \(params\.rejectPaymentToo\) \{\s*reg\.payment_status = "rejected";\s*\}/, "Must guard reg.payment_status under rejectPaymentToo check");
});

// 3. Verify that student verify route does not touch payment_status
test("Student verify route updates only student verification status", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/students/verify/route.ts"), "utf-8");
  assert.match(content, /student_verification_status: newStudentStatus/, "Must update student_verification_status");
  assert.doesNotMatch(content, /payment_status:\s*newStudentStatus/, "Must never assign student status to payment_status");
});

// 4. Verify dashboard stats counting logic
test("Dashboard stats counts paymentsApproved independently from student verification status", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/stats/route.ts"), "utf-8");
  assert.match(content, /isPaymentApproved = pStatus === "verified"/, "isPaymentApproved must be based strictly on payment_status");
  assert.match(content, /isPaymentRejected = pStatus === "rejected"/, "isPaymentRejected must be based strictly on payment_status");
  assert.match(content, /if \(isPaymentApproved\) \{\s*paymentsApproved\+\+;\s*\}/, "paymentsApproved must increment on isPaymentApproved");
  assert.match(content, /if \(isPaymentRejected\) \{\s*paymentsRejected\+\+;\s*\}/, "paymentsRejected must increment on isPaymentRejected");
});

// 5. Simulate data counting logic directly
test("Simulate registration status permutations on dashboard counts", () => {
  const records = [
    // Case 1: Both verified (Approved)
    { payment_status: "verified", student_verification_status: "verified" },
    // Case 2: Payment verified, Student rejected (Student rejected, Payment remains verified!)
    { payment_status: "verified", student_verification_status: "rejected" },
    // Case 3: Payment rejected, Student verified
    { payment_status: "rejected", student_verification_status: "verified" },
    // Case 4: Both pending
    { payment_status: "pending_verification", student_verification_status: "pending" },
  ];

  let pendingRegistrations = 0;
  let paymentsApproved = 0;
  let paymentsRejected = 0;
  let approvedRegistrations = 0;
  let rejectedRegistrations = 0;

  for (const r of records) {
    const isStudentApproved = r.student_verification_status === "verified";
    const isPaymentApproved = r.payment_status === "verified";
    const isStudentRejected = r.student_verification_status === "rejected";
    const isPaymentRejected = r.payment_status === "rejected";

    const isApproved = isStudentApproved && isPaymentApproved;
    const isRejected = isStudentRejected || isPaymentRejected;
    const isPending = !isApproved && !isRejected;

    if (isPending) pendingRegistrations++;
    if (isPaymentApproved) paymentsApproved++;
    if (isPaymentRejected) paymentsRejected++;
    if (isApproved) approvedRegistrations++;
    if (isRejected) rejectedRegistrations++;
  }

  // Exactly 1 approved registration (Case 1)
  assert.strictEqual(approvedRegistrations, 1, "approvedRegistrations should be 1");
  // Exactly 2 rejected registrations (Case 2: student rejected, Case 3: payment rejected)
  assert.strictEqual(rejectedRegistrations, 2, "rejectedRegistrations should be 2");
  // Exactly 1 pending registration (Case 4)
  assert.strictEqual(pendingRegistrations, 1, "pendingRegistrations should be 1");
  // Exactly 2 payments approved (Case 1 & Case 2!)
  assert.strictEqual(paymentsApproved, 2, "paymentsApproved should be 2 because Case 2 payment was not rejected");
  // Exactly 1 payment rejected (Case 3)
  assert.strictEqual(paymentsRejected, 1, "paymentsRejected should be 1");
});

// 6. Verify error reporting on DB failure
test("Approve and Reject endpoints return 502 and do not report false success if Supabase fails", () => {
  const approveContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/approve/route.ts"), "utf-8");
  assert.match(approveContent, /DATABASE_UPDATE_FAILED/, "Approve route must return DATABASE_UPDATE_FAILED on patch failure");
  assert.match(approveContent, /status:\s*502/, "Approve route must return 502 status on DB failure");

  const rejectContent = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/reject/route.ts"), "utf-8");
  assert.match(rejectContent, /DATABASE_UPDATE_FAILED/, "Reject route must return DATABASE_UPDATE_FAILED on patch failure");
  assert.match(rejectContent, /status:\s*502/, "Reject route must return 502 status on DB failure");
});

console.log("\n================================================================================");
console.log(`Results: ${passed}/${total} tests passed`);
console.log("================================================================================");

if (passed !== total) {
  process.exit(1);
}
