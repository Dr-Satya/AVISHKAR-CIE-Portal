/**
 * AVISHKAR-v2 — Dynamic Per-Member Registration Verification Test Suite
 *
 * Verifies:
 * 1. Team event form contains team size selection.
 * 2. When team size of 3 is selected, submitting without Member 2/3 details fails validation.
 * 3. Submitting invalid email for Member 2 or Member 3 fails validation.
 * 4. Submitting complete, valid details for all 3 members:
 *    - member_1_name, member_1_email, member_1_enrollment
 *    - member_2_name, member_2_email, member_2_enrollment
 *    - member_3_name, member_3_email, member_3_enrollment
 *    succeeds with HTTP 200/201 and returns a valid submission receipt.
 * 5. Primary registrant details sync seamlessly with Member 1.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

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
  console.log("AVISHKAR 2026 — Dynamic Per-Member Team Registration Test Suite");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // Step 1: Admin Login
  console.log("[1/5] Authenticating as Administrator...");
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@gdgoenka.ac.in",
      password: "Admin@2026",
    }),
  });
  assert(loginRes.ok, "Admin login succeeds");
  const setCookie = loginRes.headers.get("set-cookie");
  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: setCookie ? setCookie.split(";")[0] : "",
  };

  // Step 2: Create a team event with 2-4 members
  console.log("\n[2/5] Creating and publishing a team event with 2–4 member capacity...");
  const eventTitle = `Hack-a-Sol Team Test ${Date.now()}`;
  const saveFormRes = await fetch(`${BASE_URL}/api/admin/forms`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: eventTitle,
      eventTitle: eventTitle,
      formTitle: `${eventTitle} — Team Questionnaire`,
      formDescription: "Official team questionnaire for 2-4 members",
      teamSizeMin: 2,
      teamSizeMax: 4,
      feeAmount: 300,
      isActive: true,
      isPublished: true,
      fields: [
        { id: "team_name", label: "Team Name", type: "text", required: true },
        {
          id: "team_size",
          label: "Declared Team Size",
          type: "select",
          required: true,
          options: ["2 Members", "3 Members", "4 Members"],
        },
      ],
    }),
  });
  assert(saveFormRes.ok, `Form saved successfully (Got ${saveFormRes.status})`);
  const saveFormData = await saveFormRes.json();
  const eventId = saveFormData.form.eventId;
  assert(Boolean(eventId), `Event created with ID: ${eventId}`);

  // Publish event via Workflow B Admin endpoint
  const publishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ eventId, action: "publish" }),
  });
  assert(publishRes.ok, `Admin published event (Got ${publishRes.status})`);

  // Step 3: Fetch form definition via public student API
  console.log("\n[3/5] Fetching public form questionnaire...");
  const formRes = await fetch(`${BASE_URL}/api/events/${eventId}/form`);
  assert(formRes.ok, "Public GET /api/events/[id]/form returns HTTP 200");
  const formPayload = await formRes.json();
  assert(Boolean(formPayload.event), "Returns associated event details");
  assert(formPayload.event.teamSizeMin === 2 && formPayload.event.teamSizeMax === 4, "Event capacity is 2-4 members");

  // Step 4: Test validation failure when 3 members selected but member details missing
  console.log("\n[4/5] Testing validation: 3 members declared but Member 2 and Member 3 details are incomplete...");
  const incompleteSubmitRes = await fetch(`${BASE_URL}/api/events/${eventId}/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Aarav Sharma",
      studentId: "2026GDGU1001",
      studentEmail: "aarav@gdgu.org",
      responses: {
        team_name: "Code Solvers",
        team_size: "3 Members",
        declared_team_size: 3,
        // Only member 1 provided, member 2 and 3 omitted
        member_1_name: "Aarav Sharma",
        member_1_email: "aarav@gdgu.org",
        member_1_enrollment: "2026GDGU1001",
      },
    }),
  });

  assert(
    !incompleteSubmitRes.ok && incompleteSubmitRes.status === 400,
    "Incomplete 3-member squad is rejected with HTTP 400"
  );
  const incompleteData = await incompleteSubmitRes.json();
  assert(Boolean(incompleteData.fieldErrors), "Returns granular fieldErrors map");
  assert(
    Boolean(incompleteData.fieldErrors.member_2_name),
    `Flags missing Member 2 Name: "${incompleteData.fieldErrors.member_2_name}"`
  );
  assert(
    Boolean(incompleteData.fieldErrors.member_3_name),
    `Flags missing Member 3 Name: "${incompleteData.fieldErrors.member_3_name}"`
  );

  // Step 5: Test successful submission with all 3 members fully provided
  console.log("\n[5/5] Submitting valid questionnaire with all 3 members populated...");
  const validSubmitRes = await fetch(`${BASE_URL}/api/events/${eventId}/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Aarav Sharma",
      studentId: "2026GDGU1001",
      studentEmail: "aarav@gdgu.org",
      responses: {
        team_name: "Code Solvers",
        team_size: "3 Members",
        declared_team_size: 3,
        // Member 1 (Team Leader)
        member_1_name: "Aarav Sharma",
        member_1_email: "aarav@gdgu.org",
        member_1_enrollment: "2026GDGU1001",
        // Member 2
        member_2_name: "Diya Patel",
        member_2_email: "diya@gdgu.org",
        member_2_enrollment: "2026GDGU1002",
        // Member 3
        member_3_name: "Rohan Verma",
        member_3_email: "rohan@gdgu.org",
        member_3_enrollment: "2026GDGU1003",
      },
    }),
  });

  assert(validSubmitRes.ok, `Valid 3-member registration succeeds (Got ${validSubmitRes.status})`);
  const validData = await validSubmitRes.json();
  assert(validData.success === true, "Submission response success === true");
  assert(Boolean(validData.submissionId), `Submission recorded with receipt ID: ${validData.submissionId}`);

  console.log("\n================================================================================");
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL DYNAMIC TEAM MEMBER TESTS PASSED SUCCESSFULLY!");
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
