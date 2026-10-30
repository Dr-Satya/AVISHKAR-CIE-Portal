import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectBufferMimeType,
  validateDocumentBuffer,
  createValidMinimalPdfBuffer,
  createValidMinimalPngBuffer,
  createValidMinimalJpegBuffer,
  createValidMinimalWebpBuffer,
} from "../src/lib/fileValidation.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("🧪 AVISHKAR-v2: Document Upload, Magic-Byte Inspection & Retrieval Test Suite");
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

// -----------------------------------------------------------------------------
// 1. Spec-Compliant Binary Signatures (PDF, PNG, JPEG, WebP)
// -----------------------------------------------------------------------------
runTest("Detects valid spec-compliant PDF header and minimal structure", () => {
  const pdfBuf = createValidMinimalPdfBuffer();
  assert.ok(pdfBuf.byteLength >= 100, `PDF buffer length should be >= 100, got ${pdfBuf.byteLength}`);
  const info = detectBufferMimeType(pdfBuf, "receipt.pdf");
  assert.equal(info.mimeType, "application/pdf");
  assert.equal(info.extension, "pdf");
  assert.equal(info.isPdf, true);
  assert.equal(info.isValidSignature, true);
  assert.equal(info.isCorruptedOrTruncated, false);
});

runTest("Detects valid spec-compliant PNG header and signature", () => {
  const pngBuf = createValidMinimalPngBuffer();
  assert.ok(pngBuf.byteLength >= 64, `PNG buffer length should be >= 64, got ${pngBuf.byteLength}`);
  const info = detectBufferMimeType(pngBuf, "receipt.png");
  assert.equal(info.mimeType, "image/png");
  assert.equal(info.extension, "png");
  assert.equal(info.isImage, true);
  assert.equal(info.isValidSignature, true);
  assert.equal(info.isCorruptedOrTruncated, false);
});

runTest("Detects valid spec-compliant JPEG header and signature", () => {
  const jpgBuf = createValidMinimalJpegBuffer();
  assert.ok(jpgBuf.byteLength >= 64, `JPEG buffer length should be >= 64, got ${jpgBuf.byteLength}`);
  const info = detectBufferMimeType(jpgBuf, "proof.jpg");
  assert.equal(info.mimeType, "image/jpeg");
  assert.equal(info.extension, "jpg");
  assert.equal(info.isImage, true);
  assert.equal(info.isValidSignature, true);
  assert.equal(info.isCorruptedOrTruncated, false);
});

runTest("Detects valid spec-compliant WebP header and signature", () => {
  const webpBuf = createValidMinimalWebpBuffer();
  const info = detectBufferMimeType(webpBuf, "proof.webp");
  assert.equal(info.extension, "webp");
  assert.equal(info.isImage, true);
});

// -----------------------------------------------------------------------------
// 2. Strict Rejection of Corrupt, Empty, and Fake/Dummy Uploads
// -----------------------------------------------------------------------------
runTest("Rejects empty buffer (0 bytes)", () => {
  const emptyBuf = new Uint8Array(0);
  const info = detectBufferMimeType(emptyBuf, "empty.pdf");
  assert.equal(info.isValidSignature, false);
  assert.equal(info.isCorruptedOrTruncated, true);

  const valRes = validateDocumentBuffer(emptyBuf, "empty.pdf", { maxBytes: 5 * 1024 * 1024 });
  assert.equal(valRes.valid, false);
  assert.match(valRes.error, /empty/i);
});

runTest("Rejects the exact 40-byte test string 'DUMMY RECEIPT PROOF FOR MENTOR DEMO 2026'", () => {
  const dummyString = "DUMMY RECEIPT PROOF FOR MENTOR DEMO 2026";
  const dummyBuf = Buffer.from(dummyString);
  assert.equal(dummyBuf.byteLength, 40, "Legacy dummy string is exactly 40 bytes");

  const info = detectBufferMimeType(dummyBuf, "AVISHKAR-2026-159993_1791829245689.pdf");
  assert.equal(info.isValidSignature, false);
  assert.equal(info.isCorruptedOrTruncated, true);

  const valRes = validateDocumentBuffer(dummyBuf, "AVISHKAR-2026-159993_1791829245689.pdf", {
    maxBytes: 10 * 1024 * 1024,
  });
  assert.equal(valRes.valid, false);
  assert.match(valRes.error, /truncated|corrupt|too small|signature/i);
});

runTest("Rejects fake ASCII text masquerading as PNG or JPG", () => {
  const fakePngBuf = Buffer.from("This is a text string claiming to be an image file.");
  const info = detectBufferMimeType(fakePngBuf, "fake.png");
  assert.equal(info.isValidSignature, false);
  assert.equal(info.isCorruptedOrTruncated, true);

  const valRes = validateDocumentBuffer(fakePngBuf, "fake.png", { maxBytes: 5 * 1024 * 1024 });
  assert.equal(valRes.valid, false);
});

runTest("Rejects truncated PDF (header only without minimal structural size)", () => {
  const truncatedPdf = new TextEncoder().encode("%PDF-1.4 header only but truncated");
  assert.ok(truncatedPdf.byteLength < 100);
  const info = detectBufferMimeType(truncatedPdf, "truncated.pdf");
  assert.equal(info.isCorruptedOrTruncated, true);
  assert.equal(info.isValidSignature, false);
});

runTest("Rejects executable binary and shell script payloads", () => {
  const exeBuf = Buffer.from("MZ\x90\x00\x03\x00\x00\x00DOS executable mock payload");
  const exeInfo = detectBufferMimeType(exeBuf, "payload.pdf");
  assert.equal(exeInfo.isValidSignature, false);

  const shBuf = Buffer.from("#!/bin/bash\nrm -rf /tmp/data\n");
  const shInfo = detectBufferMimeType(shBuf, "script.png");
  assert.equal(shInfo.isValidSignature, false);
});

// -----------------------------------------------------------------------------
// 3. Multi-Tier Base64 Round-Trip Integrity
// -----------------------------------------------------------------------------
runTest("Preserves binary PDF bytes across base64 encoding and decoding", () => {
  const originalPdf = createValidMinimalPdfBuffer();
  const base64 = Buffer.from(originalPdf).toString("base64");
  const decoded = Buffer.from(base64, "base64");
  assert.equal(decoded.byteLength, originalPdf.byteLength);
  assert.deepEqual(new Uint8Array(decoded), originalPdf, "Decoded bytes must match original PDF exactly");

  const info = detectBufferMimeType(decoded, "test.pdf");
  assert.equal(info.mimeType, "application/pdf");
  assert.equal(info.isValidSignature, true);
});

runTest("Preserves binary PNG bytes across base64 encoding and decoding", () => {
  const originalPng = createValidMinimalPngBuffer();
  const base64 = Buffer.from(originalPng).toString("base64");
  const decoded = Buffer.from(base64, "base64");
  assert.equal(decoded.byteLength, originalPng.byteLength);
  assert.deepEqual(new Uint8Array(decoded), originalPng, "Decoded bytes must match original PNG exactly");

  const info = detectBufferMimeType(decoded, "test.png");
  assert.equal(info.mimeType, "image/png");
  assert.equal(info.isValidSignature, true);
});

// -----------------------------------------------------------------------------
// 4. Verification of API Route Code Implementation
// -----------------------------------------------------------------------------
runTest("Registration API verifies both receipt and id_card buffers before upload", () => {
  const regCode = fs.readFileSync(path.join(rootDir, "src/app/api/register/route.ts"), "utf-8");
  assert.match(regCode, /validateDocumentBuffer\(rawReceiptBuffer/, "Must validate receipt buffer");
  assert.match(regCode, /validateDocumentBuffer\(rawIdCardBuffer/, "Must validate ID card buffer");
  assert.match(regCode, /"x-upsert":\s*"true"/, "Must pass x-upsert header to Supabase Storage");
  assert.match(regCode, /receipt_file_size:\s*receiptFileSize/, "Must store verified receipt byte length");
  assert.match(regCode, /receipt_mime_type:\s*receiptDetectedMime/, "Must store verified receipt MIME type");
  assert.match(regCode, /id_card_file_size:\s*idCardFileSize/, "Must store verified ID card byte length");
  assert.match(regCode, /id_card_mime_type:\s*idCardFile \? idCardDetectedMime : null/, "Must store verified ID card MIME type");
});

runTest("Admin Receipt API inspects binary headers and handles private authenticated downloads", () => {
  const receiptCode = fs.readFileSync(path.join(rootDir, "src/app/api/admin/receipt/route.ts"), "utf-8");
  assert.match(receiptCode, /detectBufferMimeType/, "Must use detectBufferMimeType to verify bytes");
  assert.match(receiptCode, /storage\/v1\/object\/authenticated/, "Must query Supabase authenticated endpoint");
  assert.match(receiptCode, /FILE_CORRUPTED|corrupted or truncated/, "Must catch and reject corrupted storage files with 422");
  assert.match(receiptCode, /"X-Content-Type-Options":\s*"nosniff"/, "Must set security nosniff header");
});

runTest("Admin ID Card API inspects binary headers and handles private authenticated downloads", () => {
  const idCardCode = fs.readFileSync(path.join(rootDir, "src/app/api/admin/id-card/route.ts"), "utf-8");
  assert.match(idCardCode, /detectBufferMimeType/, "Must use detectBufferMimeType to verify bytes");
  assert.match(idCardCode, /storage\/v1\/object\/authenticated/, "Must query Supabase authenticated endpoint");
  assert.match(idCardCode, /FILE_CORRUPTED|corrupted or truncated/, "Must catch and reject corrupted storage files with 422");
  assert.match(idCardCode, /"X-Content-Type-Options":\s*"nosniff"/, "Must set security nosniff header");
});

runTest("RegistrationDetailModal validates document availability via server API check", () => {
  const modalCode = fs.readFileSync(path.join(rootDir, "src/components/admin/RegistrationDetailModal.tsx"), "utf-8");
  assert.match(modalCode, /\/api\/admin\/receipt\?path=/, "Must verify receipt via dedicated admin API endpoint");
  assert.match(modalCode, /\/api\/admin\/id-card\?path=/, "Must verify ID card via dedicated admin API endpoint");
  assert.match(modalCode, /setReceiptError/, "Must set receipt error on non-ok HTTP status");
  assert.match(modalCode, /setIdCardError/, "Must set ID card error on non-ok HTTP status");
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
console.log("================================================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
