// tests/test_policy_label_styling.mjs
// Verification suite for minimal, centered section labels without rectangular boxes

import fs from "fs";
import path from "path";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  ✓ PASS: ${message}`);
}

function runVerification() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Section Labels & Header Minimal Styling Verification");
  console.log("================================================================================\n");

  // 1. GuidelinesSection.tsx Verification
  console.log("[1/3] Inspecting GuidelinesSection.tsx...");
  const guidelinesPath = path.resolve("src/components/home/GuidelinesSection.tsx");
  assert(fs.existsSync(guidelinesPath), "GuidelinesSection.tsx exists");
  const guidelinesContent = fs.readFileSync(guidelinesPath, "utf-8");

  assert(guidelinesContent.includes("OFFICIAL EVENT POLICY"), "Contains 'OFFICIAL EVENT POLICY' text");
  assert(guidelinesContent.includes("bg-[#D4AF37]"), "Gold dot (#D4AF37) is present");
  assert(guidelinesContent.includes("text-[#0A2047]"), "Text color is Deep Navy Blue (#0A2047)");
  assert(
    guidelinesContent.includes("w-full flex items-center justify-center") &&
    guidelinesContent.includes("inline-flex items-center gap-2"),
    "Label is centered horizontally and elements aligned vertically"
  );
  // Ensure the old pill styling is gone
  assert(!guidelinesContent.includes("px-3 py-1 rounded-md bg-white"), "Old rectangular box styling removed from GuidelinesSection");

  // 2. HighlightsSection.tsx Verification
  console.log("\n[2/3] Inspecting HighlightsSection.tsx...");
  const highlightsPath = path.resolve("src/components/home/HighlightsSection.tsx");
  assert(fs.existsSync(highlightsPath), "HighlightsSection.tsx exists");
  const highlightsContent = fs.readFileSync(highlightsPath, "utf-8");

  assert(highlightsContent.includes("OFFICIAL EVENTS &amp; COMPETITIONS"), "Contains 'OFFICIAL EVENTS & COMPETITIONS' text");
  assert(highlightsContent.includes("bg-[#D4AF37]"), "Gold dot (#D4AF37) is present");
  assert(highlightsContent.includes("text-[#0A2047]"), "Text color is Deep Navy Blue (#0A2047)");
  assert(
    highlightsContent.includes("w-full flex items-center justify-center") &&
    highlightsContent.includes("inline-flex items-center gap-2"),
    "Label is centered horizontally and elements aligned vertically"
  );
  // Ensure the old pill styling is gone
  assert(!highlightsContent.includes("px-3 py-1 rounded-md bg-[#F0F3F8]"), "Old rectangular box styling removed from HighlightsSection");

  // 3. ContactSection.tsx Verification
  console.log("\n[3/4] Inspecting ContactSection.tsx...");
  const contactPath = path.resolve("src/components/home/ContactSection.tsx");
  assert(fs.existsSync(contactPath), "ContactSection.tsx exists");
  const contactContent = fs.readFileSync(contactPath, "utf-8");

  assert(contactContent.includes("VENUE &amp; INQUIRIES"), "Contains 'VENUE & INQUIRIES' text");
  assert(contactContent.includes("bg-[#D4AF37]"), "Gold dot (#D4AF37) is present");
  assert(contactContent.includes("text-[#0A2047]"), "Text color is Deep Navy Blue (#0A2047)");
  assert(
    contactContent.includes("w-full flex items-center justify-center") &&
    contactContent.includes("inline-flex items-center gap-2"),
    "Label is centered horizontally and elements aligned vertically"
  );
  // Ensure the old pill styling is gone
  assert(!contactContent.includes("px-3 py-1 rounded-md bg-white"), "Old rectangular box styling removed from ContactSection");

  // 4. Header.tsx Verification
  console.log("\n[4/4] Inspecting Header.tsx...");
  const headerPath = path.resolve("src/components/layout/Header.tsx");
  assert(fs.existsSync(headerPath), "Header.tsx exists");
  const headerContent = fs.readFileSync(headerPath, "utf-8");

  assert(headerContent.includes("home-logo.svg"), "GD Goenka University + NAAC Grade A+ logo is present");
  assert(!headerContent.includes("avishkar-logo.png"), "AVISHKAR logo is removed from public header");
  assert(headerContent.includes("Track Status"), "Track Status button preserved");
  assert(headerContent.includes("Student Registration"), "Student Registration button preserved");

  console.log("\n================================================================================");
  console.log("🎉 ALL VERIFICATIONS PASSED!");
  console.log("================================================================================");
}

runVerification();
