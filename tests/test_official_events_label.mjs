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

function verifyLabels() {
  console.log("================================================================================");
  console.log("AVISHKAR — Verification of OFFICIAL EVENTS & COMPETITIONS Label & Centering");
  console.log("================================================================================\n");

  const highlightsPath = path.resolve("src/components/home/HighlightsSection.tsx");
  assert(fs.existsSync(highlightsPath), "HighlightsSection.tsx exists");
  const highlightsContent = fs.readFileSync(highlightsPath, "utf-8");

  // 1. Text & Dot presence
  assert(highlightsContent.includes("OFFICIAL EVENTS &amp; COMPETITIONS"), "Label text 'OFFICIAL EVENTS & COMPETITIONS' is present");
  assert(highlightsContent.includes("#D4AF37"), "Gold dot color #D4AF37 is present");
  assert(highlightsContent.includes("rounded-full bg-[#D4AF37]"), "Gold dot is rounded and styled with bg-[#D4AF37]");

  // 2. No box, border, or pill container around the label
  const labelSnippetMatch = highlightsContent.match(/\{\/\* Centered Section Label[\s\S]*?<\/div>\s*<\/div>/);
  assert(Boolean(labelSnippetMatch), "Centered Section Label block identified");
  const snippet = labelSnippetMatch ? labelSnippetMatch[0] : "";

  assert(!snippet.includes("bg-[#EFF6FF]"), "No light blue badge background");
  assert(!snippet.includes("border-[#D9E4F2]"), "No border around the label");
  assert(!snippet.includes("shadow-"), "No shadow on the label");
  assert(!snippet.includes("rounded-md") && !snippet.includes("rounded-lg"), "No rounded box on the label wrapper");

  // 3. Text color Deep Navy Blue (#0A2047)
  assert(snippet.includes("text-[#0A2047]"), "Text color is Deep Navy Blue (#0A2047)");

  // 4. Centered horizontally within parent section
  assert(snippet.includes("w-full flex items-center justify-center"), "Parent wrapper spans full width and centers content horizontally");

  // 5. Vertical alignment with consistent spacing
  assert(snippet.includes("inline-flex items-center gap-2"), "Gold dot and text are aligned with items-center and gap-2");

  // 6. Uppercase text and font weight
  assert(snippet.includes("uppercase") && snippet.includes("font-semibold"), "Uppercase and font-semibold preserved");

  // 7. Verify consistency with OFFICIAL EVENT POLICY and VENUE & INQUIRIES
  const guidelinesPath = path.resolve("src/components/home/GuidelinesSection.tsx");
  assert(fs.existsSync(guidelinesPath), "GuidelinesSection.tsx exists");
  const guidelinesContent = fs.readFileSync(guidelinesPath, "utf-8");
  assert(guidelinesContent.includes("OFFICIAL EVENT POLICY"), "OFFICIAL EVENT POLICY label is present");
  assert(guidelinesContent.includes("w-full flex items-center justify-center"), "GuidelinesSection label is centered with w-full flex items-center justify-center");
  assert(guidelinesContent.includes("text-[#0A2047]"), "GuidelinesSection label uses #0A2047");

  const contactPath = path.resolve("src/components/home/ContactSection.tsx");
  assert(fs.existsSync(contactPath), "ContactSection.tsx exists");
  const contactContent = fs.readFileSync(contactPath, "utf-8");
  assert(contactContent.includes("VENUE &amp; INQUIRIES"), "VENUE & INQUIRIES label is present");
  assert(contactContent.includes("w-full flex items-center justify-center"), "ContactSection label is centered with w-full flex items-center justify-center");
  assert(contactContent.includes("text-[#0A2047]"), "ContactSection label uses #0A2047");

  console.log("\n================================================================================");
  console.log("ALL SECTION LABEL & CENTERING CHECKS PASSED!");
  console.log("================================================================================\n");
}

verifyLabels();
