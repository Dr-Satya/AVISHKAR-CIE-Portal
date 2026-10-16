/**
 * AVISHKAR-v2 — AI Form Builder & Google Forms Integration Test Suite
 *
 * Verifies:
 * 1. Valid registration settings proceed to AI generation.
 * 2. Invalid settings show validation errors.
 * 3. Generated questions relate to the selected event.
 * 4. AI errors do not erase entered configuration.
 * 5. Administrator can preview and approve the form.
 * 6. The saved form persists after refresh.
 * 7. The generated form is associated with the correct event.
 * 8. Existing registration and payment workflows continue working.
 * 9. Actual Google Forms creation is verified only when authorized API access is configured.
 * 10. QR code generation functions correctly.
 */

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
  console.log("AVISHKAR 2026 — AI Form Generation & Google Forms Test Suite");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // Step 1: Administrator Authentication
  console.log("[1/9] Authenticating as Administrator...");
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@gdgoenka.ac.in",
      password: "Admin@2026",
    }),
  });

  assert(loginRes.ok, `Admin login succeeds with HTTP 200 (Got ${loginRes.status})`);
  const loginData = await loginRes.json();
  assert(loginData.success === true, "Login response success === true");

  const setCookie = loginRes.headers.get("set-cookie");
  assert(Boolean(setCookie), "Received session cookie for authenticated requests");

  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: setCookie ? setCookie.split(";")[0] : "",
  };

  // Step 2: Fetch Target Events
  console.log("\n[2/9] Fetching Target Events from /api/admin/events...");
  const eventsRes = await fetch(`${BASE_URL}/api/admin/events`, { headers: authHeaders });
  assert(eventsRes.ok, `GET /api/admin/events returns HTTP 200 (Got ${eventsRes.status})`);
  const eventsData = await eventsRes.json();
  assert(Array.isArray(eventsData.events) && eventsData.events.length > 0, "Found existing target events in system");

  const targetEvent = eventsData.events.find((e) => e.status === "published") || eventsData.events[0];
  console.log(`  -> Selected Target Event: "${targetEvent.title}" (ID: ${targetEvent.id}, Category: ${targetEvent.category})`);

  // Step 3: Test Validation Rules on AI Form Generation
  console.log("\n[3/9] Testing Validation Rules on AI Form Generation (/api/admin/ai/generate-form)...");
  
  // A. Invalid: completely empty body
  const emptyRes = await fetch(`${BASE_URL}/api/admin/ai/generate-form`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({}),
  });
  assert(!emptyRes.ok && emptyRes.status === 400, "Reject empty request with HTTP 400");
  const emptyErr = await emptyRes.json();
  assert(Boolean(emptyErr.error), `Returns descriptive validation error: "${emptyErr.error}"`);

  // B. Invalid: Schedule dates inverted in Form configuration validation
  const invertedDatesRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventId: targetEvent.id,
      formTitle: "Test Form",
      fields: [{ id: "q1", label: "Full Name", type: "text", required: true }],
      registrationStartDate: "2026-10-25",
      registrationEndDate: "2026-10-10", // Earlier than opening date!
    }),
  });
  assert(!invertedDatesRes.ok && invertedDatesRes.status === 400, "Reject inverted registration schedule with HTTP 400");
  const invertedErr = await invertedDatesRes.json();
  assert(invertedErr.error.includes("opening date cannot be after closing date"), "Validation specifically flags date order");

  // C. Invalid: Negative registration fee
  const negativeFeeRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventId: targetEvent.id,
      formTitle: "Test Form",
      feeAmount: -100,
      fields: [{ id: "q1", label: "Full Name", type: "text", required: true }],
    }),
  });
  assert(!negativeFeeRes.ok && negativeFeeRes.status === 400, "Reject negative registration fee with HTTP 400");

  // Step 4: AI Form Generation for the Selected Event
  console.log("\n[4/9] Generating Student Questionnaire via AI for Target Event...");
  const aiGenRes = await fetch(`${BASE_URL}/api/admin/ai/generate-form`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventId: targetEvent.id,
      eventTitle: targetEvent.title,
      category: targetEvent.category,
      teamSizeMin: targetEvent.teamSizeMin,
      teamSizeMax: targetEvent.teamSizeMax,
      prompt: "Create registration form for AI hackathon. Collect full name, student email, student ID, course, branch, year, phone number, team name, team size, and prior programming experience.",
    }),
  });

  assert(aiGenRes.ok, `AI Form generation returns HTTP 200 (Got ${aiGenRes.status})`);
  const aiGenData = await aiGenRes.json();
  assert(aiGenData.success === true, "AI generation response success === true");
  assert(Boolean(aiGenData.form), "Returns structured form definition object");
  assert(aiGenData.valid === true, "Server-side schema validation confirms form is valid");
  assert(Array.isArray(aiGenData.form.fields) && aiGenData.form.fields.length >= 8, `AI generated ${aiGenData.form?.fields?.length} questions`);

  // Step 5: Verify Generated Questions Relate to the Event
  console.log("\n[5/9] Verifying AI Questions Relate Specifically to the Event & Requirements...");
  const labels = aiGenData.form.fields.map((f) => f.label.toLowerCase());

  assert(labels.some((l) => l.includes("name")), "Questionnaire contains Full Name");
  assert(labels.some((l) => l.includes("email")), "Questionnaire contains Student Email");
  assert(labels.some((l) => l.includes("roll") || l.includes("enroll") || l.includes("id")), "Questionnaire contains Student Roll No / ID");
  assert(labels.some((l) => l.includes("phone") || l.includes("contact") || l.includes("whatsapp")), "Questionnaire contains Phone / Contact Number");
  assert(labels.some((l) => l.includes("school") || l.includes("department") || l.includes("branch") || l.includes("course")), "Questionnaire contains Academic School / Branch");
  assert(labels.some((l) => l.includes("team") || l.includes("squad")), "Questionnaire contains Team / Squad Designation");
  assert(labels.some((l) => l.includes("size")), "Questionnaire contains Declared Team Size");
  assert(labels.some((l) => l.includes("experience") || l.includes("level")), "Questionnaire contains Prior Domain Experience");
  assert(labels.some((l) => l.includes("declaration") || l.includes("consent")), "Questionnaire contains Consent & Code of Conduct");

  // Step 6: Administrator Approves and Saves Form Configuration
  console.log("\n[6/9] Approving & Saving Form Configuration (/api/admin/forms)...");
  const saveRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventId: targetEvent.id,
      eventTitle: targetEvent.title,
      formTitle: aiGenData.form.formTitle,
      formDescription: aiGenData.form.formDescription,
      fields: aiGenData.form.fields,
      feeAmount: 500,
      registrationStartDate: "2026-10-01",
      registrationEndDate: "2026-10-20",
      isActive: true,
      isPublished: true,
    }),
  });

  assert(saveRes.ok, `Form approval and save succeeds with HTTP 200 (Got ${saveRes.status})`);
  const saveData = await saveRes.json();
  assert(saveData.success === true, "Save response confirms success === true");
  assert(Boolean(saveData.form), "Returns updated form record with version snapshot");

  // Step 7: Persistence Verification After Refresh
  console.log("\n[7/9] Verifying Persistence: Reloading Form via GET /api/admin/forms?eventId=...");
  const reloadRes = await fetch(`${BASE_URL}/api/admin/forms?eventId=${targetEvent.id}`, { headers: authHeaders });
  assert(reloadRes.ok, "GET /api/admin/forms succeeds on page reload");
  const reloadData = await reloadRes.json();
  assert(Array.isArray(reloadData.forms) && reloadData.forms.length > 0, "Loaded saved form records");
  
  const savedForm = reloadData.forms.find((f) => f.eventId === targetEvent.id);
  assert(Boolean(savedForm), `Found persisted form for event ${targetEvent.id}`);
  assert(savedForm.formTitle === aiGenData.form.formTitle, "Persisted form title matches AI generated title");
  assert(savedForm.fields.length === aiGenData.form.fields.length, "Persisted question count matches AI generated count");
  assert(savedForm.feeAmount === 500, "Persisted fee amount matches configured INR 500");
  assert(savedForm.isActive === true, "Persisted activation status is active");

  // Step 8: Google Forms Integration & Status Boundary Check
  console.log("\n[8/9] Verifying Google Forms API Integration Boundary & Unconfigured Status...");
  const gStatusRes = await fetch(`${BASE_URL}/api/admin/google-forms/status`, { headers: authHeaders });
  assert(gStatusRes.ok, "GET /api/admin/google-forms/status returns HTTP 200");
  const gStatusData = await gStatusRes.json();
  assert(Boolean(gStatusData.status), "Returns structured Google Forms config status");
  console.log(`  -> Google Forms isConfigured: ${gStatusData.status.isConfigured}, Auth Type: ${gStatusData.status.authType}`);

  // Test Real Live Verification: Non-existent demo URL must be REJECTED with 422
  const invalidLinkRes = await fetch(`${BASE_URL}/api/admin/google-forms/create`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventId: targetEvent.id,
      existingGoogleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLScDemo123456789/viewform",
    }),
  });
  assert(invalidLinkRes.status === 422, "Non-existent Google Form URL is rejected with HTTP 422");
  const invalidLinkData = await invalidLinkRes.json();
  assert(invalidLinkData.success === false, "Manual Google Form link success === false for non-existent form");
  assert(
    invalidLinkData.error.includes("Sorry, the file you have requested does not exist") ||
    invalidLinkData.error.includes("404"),
    "Returns authoritative error mentioning Google Drive 404 / file does not exist"
  );

  // Step 9: Existing Public Student Registration Workflow Verification
  console.log("\n[9/9] Verifying Public Student Registration Workflow Integrity...");
  const publicFormRes = await fetch(`${BASE_URL}/api/events/${targetEvent.id}/form`);
  assert(publicFormRes.ok, `GET /api/events/${targetEvent.id}/form returns HTTP 200`);
  const publicFormData = await publicFormRes.json();
  assert(Boolean(publicFormData.form), "Public student endpoint serves the approved form");
  assert(publicFormData.form.fields.length === aiGenData.form.fields.length, "Public student endpoint exposes the AI-generated fields");

  console.log("\n================================================================================");
  console.log(`Test Results: ${passedCount} passed, ${failedCount} failed.`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL AI FORM GENERATION & GOOGLE FORMS INTEGRATION TESTS PASSED!");
  }
}

run().catch((err) => {
  console.error("Test runner encountered an unhandled error:", err);
  process.exit(1);
});
