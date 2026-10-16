const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function verify() {
  console.log(`Checking ${BASE_URL}...`);
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    console.error(`Failed to fetch ${BASE_URL}: ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();
  
  // Find id="about"
  const aboutIdx = html.indexOf('id="about"');
  if (aboutIdx === -1) {
    console.error('Section id="about" not found in HTML!');
    process.exit(1);
  }
  
  // Extract the about section
  const nextSectionIdx = html.indexOf('<section', aboutIdx + 1);
  const aboutSectionHtml = nextSectionIdx !== -1 
    ? html.substring(aboutIdx, nextSectionIdx) 
    : html.substring(aboutIdx, aboutIdx + 2000);

  const matches = (aboutSectionHtml.match(/ABOUT AVISHKAR/g) || []).length;
  console.log(`Total occurrences of 'ABOUT AVISHKAR' inside About section: ${matches}`);
  
  if (matches === 1) {
    console.log('✓ PASS: Exactly one label "ABOUT AVISHKAR" found in the About section.');
  } else {
    console.error(`✗ FAIL: Expected 1 occurrence, found ${matches}`);
    process.exit(1);
  }

  // Verify heading is updated to "A Platform for Innovation and Technical Excellence"
  if (aboutSectionHtml.includes("A Platform for Innovation and Technical Excellence")) {
    console.log('✓ PASS: Heading updated to "A Platform for Innovation and Technical Excellence".');
  } else {
    console.error('✗ FAIL: Expected heading "A Platform for Innovation and Technical Excellence" not found.');
    process.exit(1);
  }

  // Verify heading does not contain "Research"
  const headingMatch = aboutSectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  if (headingMatch && !headingMatch[1].includes("Research")) {
    console.log('✓ PASS: Heading does not contain the word "Research".');
  } else {
    console.error('✗ FAIL: Heading still contains "Research".');
    process.exit(1);
  }

  // Verify description is intact
  if (aboutSectionHtml.includes("Center of Innovation and Entrepreneurship at GD Goenka University")) {
    console.log('✓ PASS: Description preserved.');
  } else {
    console.error('✗ FAIL: Description missing or modified.');
    process.exit(1);
  }

  // Verify 4 pillars are intact
  const pillars = ["Technical Skills", "Innovation &amp; Projects", "Collaboration &amp; Learning", "Student Development"];
  for (const p of pillars) {
    if (aboutSectionHtml.includes(p) || aboutSectionHtml.includes(p.replace(/&amp;/g, "&"))) {
      console.log(`✓ PASS: Pillar "${p}" preserved.`);
    } else {
      console.error(`✗ FAIL: Pillar "${p}" missing.`);
      process.exit(1);
    }
  }

  console.log("\nAll About section validations passed successfully!");
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
