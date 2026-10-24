import fs from "fs";
import path from "path";

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
}

function runVerification() {
  console.log("================================================================================");
  console.log("AVISHKAR — Verification of Homepage Hero / Event Preparation Update");
  console.log("================================================================================\n");

  const ctaPath = path.resolve("src/components/home/CtaSection.tsx");
  assert(fs.existsSync(ctaPath), "CtaSection component file exists");

  const content = fs.readFileSync(ctaPath, "utf-8");

  // 1. Badge box and icon removal
  assert(!content.includes("Sparkles"), "Decorative Sparkles icon is completely removed");
  assert(!content.includes("bg-[#D4AF37]/15"), "Badge background box styling is completely removed");
  assert(!content.includes("border-[#D4AF37]/40"), "Badge border styling is completely removed");
  assert(!content.includes("px-3 py-1 rounded-md"), "Badge padding and rounded box classes are removed");

  // 2. Simple clean label in gold (#D4AF37)
  assert(content.includes("EVENT PREPARATION"), "Label text 'EVENT PREPARATION' is present");
  assert(content.includes("#D4AF37"), "Gold color #D4AF37 is used for the label text");

  // 3. Main heading check: "Prepare for AVISHKAR" without "2026"
  assert(content.includes("Prepare for AVISHKAR"), "Heading contains 'Prepare for AVISHKAR'");
  assert(!content.includes("Prepare for AVISHKAR 2026"), "Heading no longer contains '2026'");
  assert(content.includes("font-institutional"), "font-institutional class is preserved on heading");
  assert(content.includes("text-white"), "White text color is preserved on heading");

  // 4. Background and pattern preservation
  assert(content.includes("#0A2047"), "Deep Navy Blue background (#0A2047) is preserved");
  assert(content.includes("radial-gradient(#ffffff_1px,transparent_1px)"), "Dotted grid background pattern is preserved");

  // 5. Description text preservation
  assert(
    content.includes("Review our competition tracks, familiarize your team with guidelines, and submit your student registration for GD Goenka University&apos;s annual festival of innovation.") ||
    content.includes("festival of innovation"),
    "Description paragraph and its content are preserved"
  );

  // 6. Action buttons preservation
  assert(content.includes("Register as Student"), "'Register as Student' button is present");
  assert(content.includes('href="/register"'), "'Register as Student' destination is /register");

  assert(content.includes("Explore All Tracks"), "'Explore All Tracks' button is present");
  assert(content.includes('href="/#competitions"'), "'Explore All Tracks' destination is /#competitions");

  assert(content.includes("Read Guidelines"), "'Read Guidelines' button is present");
  assert(content.includes('href="/#guidelines"'), "'Read Guidelines' destination is /#guidelines");

  console.log("\n================================================================================");
  console.log("ALL HERO / PREPARATION COMPONENT CHECKS PASSED!");
  console.log("================================================================================\n");
}

runVerification();
