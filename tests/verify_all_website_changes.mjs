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

function verifyAllChanges() {
  console.log("================================================================================");
  console.log("AVISHKAR — PRE-DEPLOYMENT VERIFICATION OF ALL 6 LATEST WEBSITE CHANGES");
  console.log("================================================================================\n");

  // 1. Header: AVISHKAR logo removed, GD Goenka & NAAC logos retained
  console.log("[1/6] Inspecting Header (src/components/layout/Header.tsx)...");
  const headerContent = fs.readFileSync("src/components/layout/Header.tsx", "utf-8");
  assert(headerContent.includes("home-logo.svg"), "Header includes GD Goenka University + NAAC A+ logo (home-logo.svg)");
  assert(!headerContent.includes("avishkar-logo"), "Header does NOT include AVISHKAR logo");
  assert(headerContent.includes("Track Status"), "Header includes 'Track Status' button");
  assert(headerContent.includes("Student Registration"), "Header includes 'Student Registration' button");

  // 2. HighlightsSection: Centered 'OFFICIAL EVENTS & COMPETITIONS' without badge box
  console.log("\n[2/6] Inspecting Events Section (src/components/home/HighlightsSection.tsx)...");
  const highlightsContent = fs.readFileSync("src/components/home/HighlightsSection.tsx", "utf-8");
  assert(highlightsContent.includes("OFFICIAL EVENTS &amp; COMPETITIONS"), "Section includes 'OFFICIAL EVENTS & COMPETITIONS'");
  assert(highlightsContent.includes("w-full flex items-center justify-center"), "Label is centered using w-full flex items-center justify-center");
  assert(highlightsContent.includes("rounded-full bg-[#D4AF37]"), "Gold dot (#D4AF37) is retained before label");
  assert(highlightsContent.includes("text-[#0A2047]"), "Text color is Deep Navy Blue (#0A2047)");
  assert(!highlightsContent.includes("bg-[#EFF6FF]") && !highlightsContent.includes("border-[#D9E4F2]"), "No rectangular badge box or border around label");

  // 3. GuidelinesSection & ContactSection: Centered box-free labels
  console.log("\n[3/6] Inspecting Policy & Venue Sections...");
  const guidelinesContent = fs.readFileSync("src/components/home/GuidelinesSection.tsx", "utf-8");
  assert(guidelinesContent.includes("OFFICIAL EVENT POLICY"), "Guidelines includes 'OFFICIAL EVENT POLICY'");
  assert(guidelinesContent.includes("w-full flex items-center justify-center"), "Guidelines label is horizontally centered");
  assert(guidelinesContent.includes("rounded-full bg-[#D4AF37]"), "Guidelines retains gold dot");
  assert(guidelinesContent.includes("text-[#0A2047]"), "Guidelines label uses Deep Navy Blue (#0A2047)");

  const contactContent = fs.readFileSync("src/components/home/ContactSection.tsx", "utf-8");
  assert(contactContent.includes("VENUE &amp; INQUIRIES"), "Contact includes 'VENUE & INQUIRIES'");
  assert(contactContent.includes("w-full flex items-center justify-center"), "Contact label is horizontally centered");
  assert(contactContent.includes("rounded-full bg-[#D4AF37]"), "Contact retains gold dot");
  assert(contactContent.includes("text-[#0A2047]"), "Contact label uses Deep Navy Blue (#0A2047)");

  // 4. Hero Heading: 'Prepare for AVISHKAR'
  console.log("\n[4/6] Inspecting Hero Section Heading (src/components/home/CtaSection.tsx)...");
  const ctaContent = fs.readFileSync("src/components/home/CtaSection.tsx", "utf-8");
  assert(ctaContent.includes("Prepare for AVISHKAR"), "Heading reads 'Prepare for AVISHKAR'");
  assert(!ctaContent.includes("Prepare for AVISHKAR 2026"), "Heading does NOT contain '2026'");

  // 5. Hero Badge Box: 'EVENT PREPARATION' clean label
  console.log("\n[5/6] Inspecting Hero 'EVENT PREPARATION' Label (src/components/home/CtaSection.tsx)...");
  assert(ctaContent.includes("EVENT PREPARATION"), "Label text 'EVENT PREPARATION' is present");
  assert(!ctaContent.includes("Sparkles"), "Decorative Sparkles icon is completely removed");
  assert(!ctaContent.includes("bg-[#D4AF37]/15"), "Badge box background is removed");
  assert(ctaContent.includes("text-[#D4AF37]"), "Label uses gold color #D4AF37");

  // 6. Footer: Only official GD Goenka University logo, no AVISHKAR logo or divider
  console.log("\n[6/6] Inspecting Footer (src/components/layout/Footer.tsx)...");
  const footerContent = fs.readFileSync("src/components/layout/Footer.tsx", "utf-8");
  assert(footerContent.includes("gd-goenka-logo.png"), "Footer contains official GD Goenka University logo (gd-goenka-logo.png)");
  assert(!footerContent.includes("avishkar-logo.png"), "Footer does NOT contain AVISHKAR logo (avishkar-logo.png)");
  assert(!footerContent.includes("bg-slate-200 shrink-0"), "Footer does NOT contain vertical divider between logos");

  console.log("\n================================================================================");
  console.log("ALL 6 PRE-DEPLOYMENT VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  console.log("================================================================================\n");
}

verifyAllChanges();
