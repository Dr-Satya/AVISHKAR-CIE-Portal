/**
 * AVISHKAR-v2 — Dynamic Form Builder Configuration Test Suite
 *
 * Verifies:
 * 1. Manually enter an event name and generate a form via AI / heuristic engine.
 * 2. Reject an empty event name.
 * 3. Set team capacity to 3–6 and confirm team size options match 3–6 members.
 * 4. Reject a maximum team size smaller than the minimum, or minimum < 1.
 * 5. Confirm team size validation works during student registration.
 * 6. Save the configuration, fetch back from /api/admin/forms, and verify values persist.
 * 7. Confirm existing published forms and registration records remain intact.
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
  console.log("AVISHKAR 2026 — Dynamic Form Builder: Event Name & Team Capacity Tests");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // Step 1: Admin Login
  console.log("[1/7] Authenticating as Administrator...");
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@gdgoenka.ac.in",
      password: "Admin@2026",
    }),
  });

  assert(loginRes.ok, `Admin login succeeds with HTTP 200 (Got ${loginRes.status})`);
  const setCookie = loginRes.headers.get("set-cookie");
  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: setCookie ? setCookie.split(";")[0] : "",
  };

  // Case 2: Reject empty event name
  console.log("\n[2/7] Testing Rejection of Empty Event Name...");
  const emptyNameRes = await fetch(`${BASE_URL}/api/admin/ai/generate-form`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: "   ",
      teamSizeMin: 2,
      teamSizeMax: 4,
      feeAmount: "500",
    }),
  });
  assert(emptyNameRes.status === 400, `Empty/whitespace event name rejected with HTTP 400 (Got ${emptyNameRes.status})`);
  const emptyNameData = await emptyNameRes.json();
  assert(Boolean(emptyNameData.error && emptyNameData.error.toLowerCase().includes("event name")), `Descriptive error returned: "${emptyNameData.error}"`);

  // Case 4: Reject invalid team capacities
  console.log("\n[3/7] Testing Rejection of Invalid Team Capacities...");
  
  // A. max < min
  const invalidRangeRes = await fetch(`${BASE_URL}/api/admin/ai/generate-form`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: "RoboWars 2026",
      teamSizeMin: 5,
      teamSizeMax: 3,
      feeAmount: "500",
    }),
  });
  assert(invalidRangeRes.status === 400, `Max team size < min rejected with HTTP 400 (Got ${invalidRangeRes.status})`);
  const invalidRangeData = await invalidRangeRes.json();
  assert(Boolean(invalidRangeData.error && invalidRangeData.error.includes("greater than or equal")), `Validation message flags capacity constraint: "${invalidRangeData.error}"`);

  // B. min < 1
  const zeroMinRes = await fetch(`${BASE_URL}/api/admin/ai/generate-form`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: "RoboWars 2026",
      teamSizeMin: 0,
      teamSizeMax: 4,
      feeAmount: "500",
    }),
  });
  assert(zeroMinRes.status === 400, `Minimum team size < 1 rejected with HTTP 400 (Got ${zeroMinRes.status})`);

  // Case 1 & 3: Manually enter event name and generate form with team capacity 3-6
  console.log("\n[4/7] Testing Form Generation with Event Name & Team Capacity 3–6...");
  const testEventName = "AI Autonomous Hackathon 2026";
  const genRes = await fetch(`${BASE_URL}/api/admin/ai/generate-form`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: testEventName,
      teamSizeMin: 3,
      teamSizeMax: 6,
      feeAmount: "750",
      registrationStartDate: "2026-10-01",
      registrationEndDate: "2026-11-30",
      prompt: "Generate team questions for AI hackathon",
    }),
  });
  assert(genRes.ok, `Form generation succeeds with HTTP 200 (Got ${genRes.status})`);
  const genData = await genRes.json();
  assert(genData.success === true, "genData.success === true");
  assert(Array.isArray(genData.form?.fields) && genData.form.fields.length >= 4, `Form contains ${genData.form?.fields?.length} fields`);
  assert(genData.form.formTitle.includes("AI Autonomous Hackathon 2026"), `Form title uses entered event name: "${genData.form.formTitle}"`);

  // Verify team size question and options match configured 3 to 6
  const teamSizeField = genData.form.fields.find(f => 
    f.label.toLowerCase().includes("team size") || f.label.toLowerCase().includes("team members")
  );
  assert(Boolean(teamSizeField), "Generated form contains a Team Size field");
  if (teamSizeField) {
    console.log(`  -> Detected Team Size Field options:`, teamSizeField.options);
    const has3 = teamSizeField.options?.some(o => o.includes("3"));
    const has6 = teamSizeField.options?.some(o => o.includes("6"));
    const has2 = teamSizeField.options?.some(o => o.startsWith("2 ") || o === "2");
    const has7 = teamSizeField.options?.some(o => o.startsWith("7 ") || o === "7");
    assert(has3 && has6, "Team size options include min 3 and max 6");
    assert(!has2 && !has7, "Team size options do not exceed or go below configured 3-6 range");
  }

  // Case 6: Save the configuration, verify persistence across re-queries
  console.log("\n[5/7] Testing Save & Persistence of Configuration...");
  const saveRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: testEventName,
      teamSizeMin: 3,
      teamSizeMax: 6,
      formTitle: genData.form.formTitle,
      formDescription: genData.form.formDescription,
      fields: genData.form.fields,
      feeAmount: "750",
      registrationStartDate: "2026-10-01",
      registrationEndDate: "2026-11-30",
      isActive: true,
      isPublished: true,
    }),
  });
  assert(saveRes.ok, `POST /api/admin/forms returns HTTP 200 (Got ${saveRes.status})`);
  const saveData = await saveRes.json();
  assert(saveData.success === true, "Form successfully saved");
  const savedForm = saveData.form;
  assert(Boolean(savedForm.eventId), `Form is linked to event record: ${savedForm.eventId}`);
  assert(savedForm.teamSizeMin === 3, `Saved teamSizeMin is 3 (Got ${savedForm.teamSizeMin})`);
  assert(savedForm.teamSizeMax === 6, `Saved teamSizeMax is 6 (Got ${savedForm.teamSizeMax})`);
  assert(savedForm.eventTitle === testEventName, `Saved eventTitle is "${testEventName}"`);

  // Query back form via GET /api/admin/forms
  const getFormsRes = await fetch(`${BASE_URL}/api/admin/forms`, { headers: authHeaders });
  assert(getFormsRes.ok, "GET /api/admin/forms returns HTTP 200");
  const getFormsData = await getFormsRes.json();
  const retrievedForm = getFormsData.forms?.find(f => f.eventId === savedForm.eventId);
  assert(Boolean(retrievedForm), "Retrieved form exists in database");
  assert(retrievedForm.teamSizeMin === 3 && retrievedForm.teamSizeMax === 6, "Retrieved form preserves teamSizeMin=3 and teamSizeMax=6");
  assert(retrievedForm.eventTitle === testEventName, "Retrieved form preserves entered event name");

  // Case 5: Student registration validation against team capacity
  console.log("\n[6/7] Testing Student Registration Team Capacity Validation...");
  const eventId = savedForm.eventId;
  const activeFields = savedForm.fields;
  const teamField = activeFields.find(f =>
    f.label.toLowerCase().includes("team size") ||
    f.label.toLowerCase().includes("squad size") ||
    f.label.toLowerCase().includes("declared team")
  );
  assert(Boolean(teamField), "Team size field identified in active form");

  // A. Reject student submission with team size below minimum (e.g., 2)
  const submitTooLow = await fetch(`${BASE_URL}/api/events/${eventId}/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "std-test-01",
      studentName: "Alice Smith",
      studentEmail: "alice@gdgoenka.ac.in",
      responses: {
        ...(teamField ? { [teamField.id]: "2 Members" } : {}),
      },
    }),
  });
  assert(submitTooLow.status === 400, `Student submission with team size 2 rejected with HTTP 400 (Got ${submitTooLow.status})`);
  const submitTooLowData = await submitTooLow.json();
  assert(Boolean(submitTooLowData.error && submitTooLowData.error.includes("between 3 and 6")), `Validation specifically enforces 3-6 range: "${submitTooLowData.error}"`);

  // B. Reject student submission with team size above maximum (e.g., 8)
  const submitTooHigh = await fetch(`${BASE_URL}/api/events/${eventId}/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "std-test-01",
      studentName: "Alice Smith",
      studentEmail: "alice@gdgoenka.ac.in",
      responses: {
        ...(teamField ? { [teamField.id]: "8 Members" } : {}),
      },
    }),
  });
  assert(submitTooHigh.status === 400, `Student submission with team size 8 rejected with HTTP 400 (Got ${submitTooHigh.status})`);

  // C. Accept student submission within configured range (e.g., 4)
  const validResponses = {};
  for (const f of activeFields) {
    if (f.id === teamField?.id) {
      validResponses[f.id] = "4 Members";
    } else if (f.type === "radio" || f.type === "select") {
      validResponses[f.id] = f.options?.[0] || "Option 1";
    } else if (f.type === "checkbox") {
      validResponses[f.id] = [f.options?.[0] || "Option 1"];
    } else {
      validResponses[f.id] = "Sample Response";
    }
  }

  const submitValid = await fetch(`${BASE_URL}/api/events/${eventId}/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "std-test-01",
      studentName: "Alice Smith",
      studentEmail: "alice.smith@gdgoenka.ac.in",
      responses: validResponses,
    }),
  });
  assert(submitValid.ok, `Student submission with team size 4 accepted with HTTP 200 (Got ${submitValid.status})`);
  const submitValidData = await submitValid.json();
  assert(submitValidData.success === true, "Valid registration submitted successfully");

  // Case 8: Individual event (min 1, max 1) does not generate redundant team questions
  console.log("\n[6.5/7] Testing Individual Event Form Generation (Capacity: 1 Member)...");
  const soloRes = await fetch(`${BASE_URL}/api/admin/ai/generate-form`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: "Solo Coding Sprint 2026",
      teamSizeMin: 1,
      teamSizeMax: 1,
      feeAmount: "300",
      registrationStartDate: "2026-10-01",
      registrationEndDate: "2026-11-30",
    }),
  });
  assert(soloRes.ok, `Solo event generation succeeds with HTTP 200 (Got ${soloRes.status})`);
  const soloData = await soloRes.json();
  const soloTeamField = soloData.form?.fields?.find(f =>
    f.label.toLowerCase().includes("team size") || f.label.toLowerCase().includes("team members")
  );
  assert(!soloTeamField, "Individual event (1 member) does not generate redundant Team Size question");

  // Case 7: Confirm existing published forms and event records remain intact
  console.log("\n[7/7] Confirming Existing Events & Forms Remain Intact...");
  const eventsListRes = await fetch(`${BASE_URL}/api/admin/events`, { headers: authHeaders });
  assert(eventsListRes.ok, "GET /api/admin/events returns HTTP 200");
  const eventsListData = await eventsListRes.json();
  assert(eventsListData.events?.length > 1, `Existing events list preserved (Total: ${eventsListData.events?.length} events)`);
  
  // Verify existing event status wasn't corrupted
  const sampleExisting = eventsListData.events.find(e => e.id !== eventId);
  assert(Boolean(sampleExisting && sampleExisting.id && sampleExisting.title), `Existing event intact: "${sampleExisting?.title}"`);

  console.log("\n================================================================================");
  console.log(`Summary: Passed: ${passedCount}, Failed: ${failedCount}`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
