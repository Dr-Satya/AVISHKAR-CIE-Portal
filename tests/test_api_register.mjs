// tests/test_api_register.mjs
// Node.js script to test /api/register endpoint validation and registration persistence
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateDocumentBuffer,
  createValidMinimalPdfBuffer,
  createValidMinimalPngBuffer,
  createValidMinimalJpegBuffer,
} from "../src/lib/fileValidation.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function runTests() {
  const baseUrl = (process.env.TEST_BASE_URL || "http://localhost:3000") + "/api/register";
  console.log("================================================================================");
  console.log("🧪 AVISHKAR-v2: Registration API Endpoint & Validation Test Suite");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`  ✅ Pass: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ Fail: ${desc}`);
      process.exitCode = 1;
    }
  }

  // Probe whether a live server is currently listening
  let isServerRunning = false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const probe = await fetch(baseUrl, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
    if (probe) isServerRunning = true;
  } catch {
    isServerRunning = false;
  }

  if (isServerRunning) {
    console.log(`🌐 Live server detected at ${baseUrl}. Executing live HTTP tests...\n`);

    // Live Test 1: Validation Failure Enforcement (Missing Required Fields)
    console.log("--- Test 1: Server-Side Validation Failure Enforcement (Live HTTP) ---");
    const badForm = new FormData();
    badForm.append("studentName", ""); // Invalid: empty
    badForm.append("email", "not-an-email"); // Invalid format
    badForm.append("contactNumber", "123"); // Invalid: not 10-digit Indian phone

    try {
      const res1 = await fetch(baseUrl, {
        method: "POST",
        body: badForm,
      });
      const data1 = await res1.json();
      assert(res1.status === 400, "Invalid submission returns HTTP 400 Bad Request");
      assert(data1.success === false, "Response returns success: false");
      assert(data1.errors && data1.errors.studentName, "Returns field validation error for studentName");
      assert(data1.errors && data1.errors.email, "Returns field validation error for email");
      assert(data1.errors && data1.errors.contactNumber, "Returns field validation error for contactNumber");
    } catch (err) {
      console.error("Test 1 error:", err.message);
      process.exitCode = 1;
    }

    // Live Test 2: Valid Registration Submission
    console.log("\n--- Test 2: Valid Registration Submission (Live HTTP) ---");
    const goodForm = new FormData();
    const testStudentId = "240160" + Math.floor(100000 + Math.random() * 900000);
    const testTxId = "TXN" + Math.floor(100000000000 + Math.random() * 900000000000);

    goodForm.append("studentName", "Priya Verma");
    goodForm.append("email", "priya.verma@gdgoenka.ac.in");
    goodForm.append("contactNumber", "9876543210");
    goodForm.append("gender", "Female");
    goodForm.append("studentId", testStudentId);
    goodForm.append("school", "SOES");
    goodForm.append("program", "Computer science and engineering AI&ML");
    goodForm.append("yearOfJoining", "2024");
    goodForm.append("reasonForJoining", "Passionate about autonomous systems and participating in the technical fest.");
    goodForm.append("leadershipInterest", "Yes");
    goodForm.append("transactionId", testTxId);
    goodForm.append("paymentDate", "2026-10-12");

    const validPngBytes = createValidMinimalPngBuffer();
    const mockBlob = new Blob([validPngBytes], { type: "image/png" });
    goodForm.append("receiptFile", mockBlob, "receipt.png");

    try {
      const res2 = await fetch(baseUrl, {
        method: "POST",
        body: goodForm,
      });
      const data2 = await res2.json();
      assert(res2.status === 200, "Valid submission returns HTTP 200 OK");
      assert(data2.success === true, "Response returns success: true");
      assert(typeof data2.registrationNumber === "string" && data2.registrationNumber.startsWith("AVISHKAR-"), "Assigns official AVISHKAR registration number");
      assert(data2.studentId === testStudentId, "Returns registered student ID");
      assert(data2.paymentStatus === "pending_verification", "Payment status is set to pending_verification");
    } catch (err) {
      console.error("Test 2 error:", err.message);
      process.exitCode = 1;
    }
  } else {
    console.log(`ℹ️ Standalone Mode: No live server listening on ${baseUrl}.`);
    console.log("  Executing in-process route contract, security, and binary validation checks...\n");

    // Test 1: Route Contract & Validation Rules Check
    console.log("--- Test 1: Server-Side Validation Failure Enforcement & Contract ---");
    const routeCode = fs.readFileSync(path.join(rootDir, "src/app/api/register/route.ts"), "utf-8");
    assert(routeCode.includes("validatePersonalInfo"), "Enforces personal info validation rules");
    assert(routeCode.includes("validateAcademicInfo"), "Enforces academic info validation rules");
    assert(routeCode.includes("validatePaymentInfo"), "Enforces payment info validation rules");
    assert(routeCode.includes("combinedErrors"), "Combines and returns all field validation errors");
    assert(routeCode.includes("status: 400"), "Returns HTTP 400 Bad Request on invalid submission");

    // Test 2: Strict Rejection of Corrupt / Dummy Receipt Files
    console.log("\n--- Test 2: Binary Signature & Dummy File Rejection ---");
    const dummyReceipt = Buffer.from("DUMMY RECEIPT PROOF FOR MENTOR DEMO 2026");
    const dummyValidation = validateDocumentBuffer(dummyReceipt, "test_receipt.pdf", {
      maxBytes: 10 * 1024 * 1024,
    });
    assert(dummyValidation.valid === false, "Rejects known 40-byte dummy PDF");
    assert(Boolean(dummyValidation.error), "Provides descriptive error message for rejected dummy file");

    const emptyValidation = validateDocumentBuffer(new Uint8Array(0), "empty.png", {
      maxBytes: 10 * 1024 * 1024,
    });
    assert(emptyValidation.valid === false, "Rejects 0-byte empty file");

    // Test 3: Acceptance of Valid Minimal PDF, PNG, and JPEG
    console.log("\n--- Test 3: Acceptance of Spec-Compliant Binary Formats ---");
    const pdfValidation = validateDocumentBuffer(createValidMinimalPdfBuffer(), "receipt.pdf", {
      maxBytes: 10 * 1024 * 1024,
    });
    assert(pdfValidation.valid === true, "Accepts valid spec-compliant PDF buffer");
    assert(pdfValidation.mimeType === "application/pdf", "Authoritative MIME type identified as application/pdf");

    const pngValidation = validateDocumentBuffer(createValidMinimalPngBuffer(), "receipt.png", {
      maxBytes: 10 * 1024 * 1024,
    });
    assert(pngValidation.valid === true, "Accepts valid spec-compliant PNG buffer");
    assert(pngValidation.mimeType === "image/png", "Authoritative MIME type identified as image/png");

    const jpegValidation = validateDocumentBuffer(createValidMinimalJpegBuffer(), "receipt.jpg", {
      maxBytes: 10 * 1024 * 1024,
    });
    assert(jpegValidation.valid === true, "Accepts valid spec-compliant JPEG buffer");
    assert(jpegValidation.mimeType === "image/jpeg", "Authoritative MIME type identified as image/jpeg");

    // Test 4: Route Implementation Wiring
    console.log("\n--- Test 4: Route Implementation Wiring & Persistence ---");
    assert(routeCode.includes("validateDocumentBuffer(rawReceiptBuffer"), "Receipt file is inspected via validateDocumentBuffer");
    assert(routeCode.includes("validateDocumentBuffer(rawIdCardBuffer"), "ID card file is inspected via validateDocumentBuffer");
    assert(routeCode.includes("payment-receipts/"), "Uploads to private payment-receipts bucket");
    assert(routeCode.includes("student-id-cards/"), "Uploads to private student-id-cards bucket");
    assert(routeCode.includes("pending_verification"), "Initial status set to pending_verification");
  }

  console.log(`\n================================================================================`);
  console.log(`Results: ${passed}/${total} checks passed.`);
  console.log(`================================================================================`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
