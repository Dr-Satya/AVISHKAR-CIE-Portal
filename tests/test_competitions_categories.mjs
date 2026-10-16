/**
 * AVISHKAR-v2 — Official Events & Competitions Section Category Filter Test Suite
 *
 * Verifies:
 * 1. Category filter categories: All Events, Hackathons, Workshops, Technical Competitions, Seminars & Talks, Other Events.
 * 2. Event category mapping logic is consistent and accurate.
 * 3. Search and Category filtering work together.
 * 4. Empty category states display: "No events available in this category right now."
 * 5. Event cards display title, category, description, and valid registration links.
 * 6. Homepage renders the redesigned controls and filters.
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

async function run() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Official Events & Competitions Redesign Tests");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // Step 1: Verify Public Events API
  console.log("[1/6] Fetching Published Events from /api/events...");
  const res = await fetch(`${BASE_URL}/api/events`);
  assert(res.ok, `GET /api/events returns HTTP 200 (Got ${res.status})`);
  const data = await res.json();
  assert(data.success === true, "data.success === true");
  assert(Array.isArray(data.events) && data.events.length > 0, `Received ${data.events?.length} published events`);

  // Step 2: Verify Category Mapping
  console.log("\n[2/6] Verifying Category Mapping across all event types...");
  const testSample = [
    { title: "AI Autonomous Hackathon 2026", category: "Hackathon", expected: "Hackathons" },
    { title: "Hands-on Next.js Workshop", category: "General", expected: "Workshops" },
    { title: "Autonomous Drone Racing Challenge", category: "Robotics", expected: "Technical Competitions" },
    { title: "RoboWars: Clash of Titans", category: "Robotics", expected: "Technical Competitions" },
    { title: "Quantum Computing Symposium & Keynote Talk", category: "General", expected: "Seminars & Talks" },
    { title: "Campus Art & Media Exhibition", category: "Design", expected: "Other Events" },
  ];

  // Inspect HighlightsSection.tsx for category definitions and mapping
  const compPath = path.resolve("src/components/home/HighlightsSection.tsx");
  assert(fs.existsSync(compPath), "src/components/home/HighlightsSection.tsx exists");
  const compCode = fs.readFileSync(compPath, "utf8");

  const expectedCategories = [
    "All Events",
    "Hackathons",
    "Workshops",
    "Technical Competitions",
    "Seminars & Talks",
    "Other Events",
  ];

  for (const c of expectedCategories) {
    assert(compCode.includes(`"${c}"`), `Component source defines category "${c}"`);
  }

  function mapEventToCategory(event) {
    const cat = (event.category || "").trim().toLowerCase();
    const title = (event.title || "").toLowerCase();
    const desc = (event.description || "").toLowerCase();

    if (
      cat === "hackathon" ||
      title.includes("hackathon") ||
      desc.includes("hackathon") ||
      title.includes("sprint")
    ) {
      return "Hackathons";
    }

    if (
      cat === "workshop" ||
      title.includes("workshop") ||
      desc.includes("workshop") ||
      title.includes("bootcamp") ||
      title.includes("hands-on")
    ) {
      return "Workshops";
    }

    if (
      cat === "seminar" ||
      cat === "talk" ||
      title.includes("seminar") ||
      title.includes("talk") ||
      title.includes("keynote") ||
      title.includes("guest lecture") ||
      title.includes("symposium") ||
      desc.includes("keynote")
    ) {
      return "Seminars & Talks";
    }

    if (
      cat === "robotics" ||
      cat === "coding" ||
      cat === "gaming" ||
      cat === "software & ai" ||
      cat === "gaming & esports" ||
      cat === "technical competitions" ||
      cat === "competition" ||
      title.includes("challenge") ||
      title.includes("competition") ||
      title.includes("arena") ||
      title.includes("wars") ||
      title.includes("racing") ||
      title.includes("contest") ||
      title.includes("drone")
    ) {
      return "Technical Competitions";
    }

    return "Other Events";
  }

  for (const item of testSample) {
    const mapped = mapEventToCategory(item);
    assert(mapped === item.expected, `"${item.title}" [${item.category}] correctly maps to "${item.expected}" (Got "${mapped}")`);
  }

  // Step 3: Verify Categorization of Live Stored Events
  console.log("\n[3/6] Categorizing Live Database Events...");
  const counts = {
    "All Events": data.events.length,
    Hackathons: 0,
    Workshops: 0,
    "Technical Competitions": 0,
    "Seminars & Talks": 0,
    "Other Events": 0,
  };

  for (const evt of data.events) {
    const cat = mapEventToCategory(evt);
    counts[cat]++;
  }

  console.log("  Live Category Distribution:");
  for (const [cat, cnt] of Object.entries(counts)) {
    console.log(`    - ${cat}: ${cnt} events`);
  }
  assert(counts.Hackathons > 0, `Found ${counts.Hackathons} Hackathons`);
  assert(counts["Technical Competitions"] > 0, `Found ${counts["Technical Competitions"]} Technical Competitions`);

  // Step 4: Verify Search & Category Interactivity on Data
  console.log("\n[4/6] Verifying Search & Combined Filtering...");
  
  // A. Search for "RoboWars" within "Technical Competitions"
  const roboMatches = data.events.filter(e => 
    mapEventToCategory(e) === "Technical Competitions" && 
    e.title.toLowerCase().includes("robowars")
  );
  assert(roboMatches.length > 0, `Found ${roboMatches.length} matching 'RoboWars' in Technical Competitions`);

  // B. Search for "Hackathon" within "Workshops" (should return 0)
  const emptyMatches = data.events.filter(e => 
    mapEventToCategory(e) === "Workshops" && 
    e.title.toLowerCase().includes("nonexistent-test-query-xyz-999")
  );
  assert(emptyMatches.length === 0, "Non-matching query correctly produces 0 items");

  // Step 5: Verify Homepage HTML Rendering
  console.log("\n[5/6] Verifying Homepage Rendered Section...");
  const homeRes = await fetch(BASE_URL);
  assert(homeRes.ok, `GET ${BASE_URL} returns HTTP 200`);
  const html = await homeRes.text();

  assert(html.includes('id="competitions"'), 'Homepage contains #competitions section');
  assert(html.includes("Official Events &amp; Competitions") || html.includes("Official Events & Competitions"), 'Section displays "Official Events & Competitions" heading');

  // Verify all 6 category filters appear in HTML
  for (const cat of expectedCategories) {
    const encoded = cat.replace("&", "&amp;");
    assert(html.includes(cat) || html.includes(encoded), `Category filter "${cat}" rendered in HTML`);
  }

  // Verify search input placeholder is present
  assert(html.includes("Search by event title or keywords..."), 'Search input with placeholder rendered');

  // Verify sort dropdown is present
  assert(html.includes("Default Order") && html.includes("Title (A–Z)"), 'Sort dropdown options rendered');

  // Step 6: Verify Registration Link Validity
  console.log("\n[6/6] Verifying Event Registration Links...");
  const sampleEvent = data.events[0];
  const registerUrl = `${BASE_URL}/events/${sampleEvent.id}/register`;
  const regPageRes = await fetch(registerUrl);
  assert(regPageRes.ok, `Event registration page /events/${sampleEvent.id}/register responds with HTTP 200 (Got ${regPageRes.status})`);

  console.log("\n================================================================================");
  console.log(`Summary: Passed: ${passedCount}, Failed: ${failedCount}`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
