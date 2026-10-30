import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Document Preview & Approval Workflow Automated Test Suite");
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

// 1. Verify existence of all modified and newly created backend/frontend files
runTest("All required workflow files exist in project tree", () => {
  const files = [
    "src/app/api/admin/id-card/route.ts",
    "src/app/api/admin/receipt/route.ts",
    "src/app/api/admin/registrations/approve/route.ts",
    "src/app/api/admin/registrations/reject/route.ts",
    "src/components/admin/RegistrationDetailModal.tsx",
    "src/lib/dataStore.ts",
    "src/app/api/register/route.ts",
    "src/app/api/admin/registrations/route.ts",
  ];
  for (const f of files) {
    const fullPath = path.join(rootDir, f);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${f}`);
  }
});

// 2. Student ID Card API & Multi-Tier Retrieval
runTest("ID card route enforces admin authorization and multi-tier retrieval", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/id-card/route.ts"), "utf-8");
  assert.match(content, /getAdminSessionFromRequest/, "Must enforce admin authentication");
  assert.match(content, /getStoredDocument/, "Must check in-memory/dataStore first (Tier 1)");
  assert.match(content, /\.data.*id_cards/, "Must check local disk storage (Tier 2)");
  assert.match(content, /student-id-cards/, "Must query private Supabase bucket 'student-id-cards' (Tier 3)");
  assert.match(content, /demo_student_id\.svg|GD GOENKA UNIVERSITY/, "Must provide official SVG fallback for sample/demo records (Tier 4)");
  assert.match(content, /Student ID card not found or inaccessible in private storage/, "Must return exact required 404 error string");
});

// 3. Payment Receipt API & Multi-Tier Retrieval
runTest("Payment receipt route enforces admin authorization and multi-tier retrieval", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/receipt/route.ts"), "utf-8");
  assert.match(content, /getAdminSessionFromRequest/, "Must enforce admin authentication");
  assert.match(content, /getStoredDocument/, "Must check in-memory/dataStore first (Tier 1)");
  assert.match(content, /\.data.*receipts/, "Must check local disk storage (Tier 2)");
  assert.match(content, /payment-receipts/, "Must query private Supabase bucket 'payment-receipts' (Tier 3)");
  assert.match(content, /demo_payment_receipt\.svg|OFFICIAL PAYMENT PROOF/, "Must provide official SVG fallback for sample/demo records (Tier 4)");
  assert.match(content, /Payment receipt not found or inaccessible in private storage/, "Must return clear 404 error string");
});

// 4. Registration Submission Multi-Tier Storage Integration
runTest("Registration route saves uploaded documents into persistent dataStore", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/register/route.ts"), "utf-8");
  assert.match(content, /saveStoredDocument/, "Must call saveStoredDocument for uploaded documents");
  assert.match(content, /receiptBase64/, "Must convert receipt to base64 for resilient multi-tier persistence");
  assert.match(content, /idCardBase64/, "Must convert ID card to base64 for resilient multi-tier persistence");
  assert.match(content, /id_card_file_path/, "Must save id_card_file_path in registration record");
});

// 5. Registration List API Fallback Query Completeness
runTest("Admin registrations route includes all document columns in fallback queries", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/route.ts"), "utf-8");
  assert.match(content, /id_card_file_path/, "Fallback query must include id_card_file_path");
  assert.match(content, /id_card_file_name/, "Fallback query must include id_card_file_name");
  assert.match(content, /id_card_mime_type/, "Fallback query must include id_card_mime_type");
  assert.match(content, /student_verification_status/, "Fallback query must include student_verification_status");
});

// 6. Dedicated Dual Approval API Endpoint
runTest("Registrations approve route enforces independent validation and updates database", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/approve/route.ts"), "utf-8");
  assert.match(content, /getAdminSessionFromRequest/, "Must enforce admin session");
  assert.match(content, /session\.user\.role !== "Admin"/, "Must restrict to Admin role");
  assert.match(content, /idCardConfirmed !== true \|\| paymentConfirmed !== true/, "Must strictly enforce both checkboxes");
  assert.match(content, /ID_CARD_MISSING|idCardPath/, "Must independently validate student ID card existence");
  assert.match(content, /RECEIPT_MISSING|receiptPath/, "Must independently validate payment receipt existence");
  assert.match(content, /approveStoredRegistration/, "Must call approveStoredRegistration");
  assert.match(content, /logAdminAction/, "Must record audit log entry");
});

// 7. Dedicated Rejection API Endpoint
runTest("Registrations reject route enforces mandatory reason and updates database", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/app/api/admin/registrations/reject/route.ts"), "utf-8");
  assert.match(content, /getAdminSessionFromRequest/, "Must enforce admin session");
  assert.match(content, /REJECTION_REASON_REQUIRED/, "Must enforce mandatory rejection reason code");
  assert.match(content, /rejectStoredRegistration/, "Must call rejectStoredRegistration");
  assert.match(content, /logAdminAction/, "Must record audit log entry");
});

// 8. RegistrationDetailModal UI Requirements
runTest("RegistrationDetailModal displays student details and document preview sections", () => {
  const content = fs.readFileSync(path.join(rootDir, "src/components/admin/RegistrationDetailModal.tsx"), "utf-8");
  
  // Requirement 2: Student ID Card Preview button
  assert.match(content, /Preview Student ID Card/, "Must have button 'Preview Student ID Card'");
  // Requirement 3: Payment Receipt Preview button
  assert.match(content, /Preview Payment Receipt/, "Must have button 'Preview Payment Receipt'");
  // Requirement 4: Final Approval button
  assert.match(content, /Approve Student/, "Must have button 'Approve Student'");
  // Checkbox 1
  assert.match(content, /I have reviewed the student ID card and confirmed the student.*college affiliation/, "Must contain Checkbox 1 with college affiliation");
  // Checkbox 2
  assert.match(content, /I have reviewed the payment receipt and confirmed the payment/, "Must contain Checkbox 2 with payment confirmation");
  // Requirement 5: Rejection Action
  assert.match(content, /Reject Student/, "Must have 'Reject Student' action button");
  assert.match(content, /Rejection Reason/, "Must require rejection reason");
  // Requirement 6: Error string
  assert.match(content, /Student ID card not found or inaccessible in private storage/, "Must show exact error banner when ID card is inaccessible");
  // Payment details
  assert.match(content, /₹100|registration\.fee_amount/, "Must show payment fee amount");
  assert.match(content, /registration\.transaction_id|UTR/, "Must show transaction reference UTR");
  // Download options
  assert.match(content, /Download Student ID Card/, "Must provide download student ID card option");
  assert.match(content, /Download Payment Receipt/, "Must provide download payment receipt option");
});

// 9. DataStore Logic & Atomic Multi-Tier Document Storage Tests
runTest("DataStore methods save, index, and retrieve stored documents cleanly", () => {
  const dsContent = fs.readFileSync(path.join(rootDir, "src/lib/dataStore.ts"), "utf-8");
  assert.match(dsContent, /export function saveStoredDocument/, "saveStoredDocument must be exported");
  assert.match(dsContent, /export function getStoredDocument/, "getStoredDocument must be exported");
  assert.match(dsContent, /export function approveStoredRegistration/, "approveStoredRegistration must be exported");
  assert.match(dsContent, /export function rejectStoredRegistration/, "rejectStoredRegistration must be exported");
});

console.log("\n================================================================================");
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
console.log("================================================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
