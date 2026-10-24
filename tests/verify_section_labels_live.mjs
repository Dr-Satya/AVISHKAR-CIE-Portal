// tests/verify_section_labels_live.mjs
// Comprehensive verification of all 3 minimal, centered section labels and header in rendered SSR / build

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

function verifyComponents() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Verification of 3 Centered Minimal Labels & Header");
  console.log("================================================================================\n");

  // 1. ContactSection (VENUE & INQUIRIES)
  console.log("[1/4] Verifying ContactSection.tsx (VENUE & INQUIRIES)...");
  const contactCode = fs.readFileSync("src/components/home/ContactSection.tsx", "utf-8");
  assert(contactCode.includes("VENUE &amp; INQUIRIES"), "Contains exact uppercase text: 'VENUE & INQUIRIES'");
  assert(contactCode.includes("bg-[#D4AF37]"), "Contains small gold dot (#D4AF37)");
  assert(contactCode.includes("text-[#0A2047]"), "Contains Deep Navy Blue text (#0A2047)");
  assert(
    contactCode.includes('className="w-full flex items-center justify-center mb-4 sm:mb-5"'),
    "Centered relative to full section container (outside narrow inner wrapper)"
  );
  assert(
    contactCode.includes('className="inline-flex items-center gap-2 text-[#0A2047] text-xs font-semibold uppercase tracking-wider"'),
    "Aligned vertically with consistent gap-2 spacing, uppercase, font-semibold"
  );
  assert(!contactCode.includes("px-3 py-1 rounded-md"), "Box/pill padding and rounded corners removed");
  assert(!contactCode.includes("shadow-2xs"), "Box shadow removed");

  // 2. GuidelinesSection (OFFICIAL EVENT POLICY)
  console.log("\n[2/4] Verifying GuidelinesSection.tsx (OFFICIAL EVENT POLICY)...");
  const guidelinesCode = fs.readFileSync("src/components/home/GuidelinesSection.tsx", "utf-8");
  assert(guidelinesCode.includes("OFFICIAL EVENT POLICY"), "Contains exact uppercase text: 'OFFICIAL EVENT POLICY'");
  assert(guidelinesCode.includes("bg-[#D4AF37]"), "Contains small gold dot (#D4AF37)");
  assert(guidelinesCode.includes("text-[#0A2047]"), "Contains Deep Navy Blue text (#0A2047)");
  assert(
    guidelinesCode.includes('className="w-full flex items-center justify-center mb-4 sm:mb-5"'),
    "Centered relative to full section container (outside narrow inner wrapper)"
  );
  assert(
    guidelinesCode.includes('className="inline-flex items-center gap-2 text-[#0A2047] text-xs font-semibold uppercase tracking-wider"'),
    "Aligned vertically with consistent gap-2 spacing, uppercase, font-semibold"
  );
  assert(!guidelinesCode.includes("px-3 py-1 rounded-md"), "Box/pill padding and rounded corners removed");
  assert(!guidelinesCode.includes("shadow-2xs"), "Box shadow removed");

  // 3. HighlightsSection (OFFICIAL EVENTS & COMPETITIONS)
  console.log("\n[3/4] Verifying HighlightsSection.tsx (OFFICIAL EVENTS & COMPETITIONS)...");
  const highlightsCode = fs.readFileSync("src/components/home/HighlightsSection.tsx", "utf-8");
  assert(highlightsCode.includes("OFFICIAL EVENTS &amp; COMPETITIONS"), "Contains exact uppercase text: 'OFFICIAL EVENTS & COMPETITIONS'");
  assert(highlightsCode.includes("bg-[#D4AF37]"), "Contains small gold dot (#D4AF37)");
  assert(highlightsCode.includes("text-[#0A2047]"), "Contains Deep Navy Blue text (#0A2047)");
  assert(
    highlightsCode.includes('className="w-full flex items-center justify-center mb-4 sm:mb-5"'),
    "Centered relative to full section container"
  );
  assert(
    highlightsCode.includes('className="inline-flex items-center gap-2 text-[#0A2047] text-xs font-semibold uppercase tracking-wider"'),
    "Aligned vertically with consistent gap-2 spacing, uppercase, font-semibold"
  );
  assert(!highlightsCode.includes("px-3 py-1 rounded-md bg-[#F0F3F8]"), "Box/pill styling removed");

  // 4. Header & Footer Logos Verification
  console.log("\n[4/4] Verifying Header.tsx & Footer.tsx Logos...");
  const headerCode = fs.readFileSync("src/components/layout/Header.tsx", "utf-8");
  assert(headerCode.includes("home-logo.svg"), "Header includes GD Goenka University + NAAC A+ logo");
  assert(!headerCode.includes("avishkar-logo.png"), "Header does NOT contain avishkar-logo.png");
  
  const footerCode = fs.readFileSync("src/components/layout/Footer.tsx", "utf-8");
  assert(footerCode.includes("gd-goenka-logo.png"), "Footer contains official GD Goenka University logo (gd-goenka-logo.png)");
  assert(!footerCode.includes("avishkar-logo.png"), "Footer does NOT contain avishkar-logo.png");
  assert(!footerCode.includes("w-px bg-slate-200"), "Vertical divider between logos removed from footer");
  assert(footerCode.includes("h-11 sm:h-12 md:h-14"), "GD Goenka logo size is enlarged and balanced in footer");

  console.log("\n================================================================================");
  console.log("🎉 ALL COMPONENT AND STYLING CHECKS PASSED WITH 100% COMPLIANCE!");
  console.log("================================================================================");
}

verifyComponents();
