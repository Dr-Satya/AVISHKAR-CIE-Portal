import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import {
  validateStartupDetails,
  validateAllRegistration,
} from "../src/lib/validations/registration.js";
import {
  getStoredRegistrations,
  saveStoredRegistration,
  readDataStore,
  writeDataStore,
} from "../src/lib/dataStore.js";
import { PATCH as registerPatchHandler } from "../src/app/api/register/route.ts";
import { GET as statusGetHandler } from "../src/app/api/register/status/route.ts";

console.log("==================================================");
console.log("RUNNING AVISHKAR-v2 STARTUP & INCUBATION TEST SUITE");
console.log("==================================================");

const tests = [];

function it(name, fn) {
  tests.push({ name, fn });
}

// -------------------------------------------------------------
// 1. Validation Tests: Optionality & Skipping
// -------------------------------------------------------------
it("1.1 Empty startup details returns zero errors (100% optional)", () => {
  const errors = validateStartupDetails({});
  assert.deepStrictEqual(errors, {});
});

it("1.2 Selecting 'No, not yet.' returns zero errors", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "No, not yet.",
  });
  assert.deepStrictEqual(errors, {});
});

it("1.3 'Skip for now' button behavior produces valid submission payload", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: undefined,
    startupTitle: "",
    startupDetails: "",
  });
  assert.deepStrictEqual(errors, {});
});

// -------------------------------------------------------------
// 2. Validation Tests: Handling Empty & Partially Completed Sections
// -------------------------------------------------------------
it("2.1 Selecting 'Yes, I have started a startup.' allows partial submission without blocking registration", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "",
    startupDetails: "",
  });
  assert.deepStrictEqual(errors, {}, "Optional section must not block registration with partial fields");
});

it("2.2 Enforces maximum character bounds for title and details", () => {
  const tooLongTitle = "A".repeat(201);
  const tooLongDetails = "B".repeat(3001);
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: tooLongTitle,
    startupDetails: tooLongDetails,
  });
  assert.ok(errors.startupTitle, "Title > 200 characters should produce validation error");
  assert.ok(errors.startupDetails, "Details > 3000 characters should produce validation error");
});

// -------------------------------------------------------------
// 3. Validation Tests: Roles & Stages & Structure Options
// -------------------------------------------------------------
it("3.1 Validates student role choices (whitelisted options pass, arbitrary strings fail)", () => {
  const validRoles = [
    "Team Leader / Founder",
    "Co-founder",
    "Team Member",
    "Individual Innovator",
  ];
  for (const role of validRoles) {
    const err = validateStartupDetails({
      hasStartupOrProject: "Yes, I have started a startup.",
      startupTitle: "AgriTech AI",
      startupDetails: "A platform helping farmers predict crop yield using AI sensors.",
      studentRole: role,
      teamStructure: "Individual Project",
      startupStage: "Prototype / MVP",
    });
    assert.strictEqual(err.studentRole, undefined, `Role ${role} should be valid`);
  }

  const invalid = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "AgriTech AI",
    studentRole: "Arbitrary Non-Existent Role",
  });
  assert.ok(invalid.studentRole, "Arbitrary role should fail validation");
});

it("3.2 Validates startup stages (whitelisted stages pass, arbitrary stages fail)", () => {
  const validStages = [
    "Idea",
    "Research / Validation",
    "Prototype / MVP",
    "Testing / Pilot",
    "Launched / In Production",
  ];
  for (const stage of validStages) {
    const err = validateStartupDetails({
      hasStartupOrProject: "Yes, I have started a startup.",
      startupTitle: "Quantum Logistics",
      startupDetails: "Optimizing delivery routes with quantum algorithms and edge compute.",
      startupStage: stage,
    });
    assert.strictEqual(err.startupStage, undefined, `Stage ${stage} should be valid`);
  }

  const invalid = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "Quantum Logistics",
    startupStage: "Series D Unicorn",
  });
  assert.ok(invalid.startupStage, "Invalid stage should fail validation");
});

it("3.3 Validates team structure options", () => {
  const validStructures = ["Individual Project", "Team Project"];
  for (const struct of validStructures) {
    const err = validateStartupDetails({
      hasStartupOrProject: "Yes, I have started a startup.",
      teamStructure: struct,
    });
    assert.strictEqual(err.teamStructure, undefined);
  }

  const invalid = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    teamStructure: "Company with 500 Employees",
  });
  assert.ok(invalid.teamStructure);
});

// -------------------------------------------------------------
// 4. Team Structure & Dynamic Team Members
// -------------------------------------------------------------
it("4.1 Individual project accepts empty team members", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "Solo App",
    studentRole: "Individual Innovator",
    teamStructure: "Individual Project",
    teamMembers: [],
  });
  assert.strictEqual(errors.teamMembers, undefined);
});

it("4.2 Validates team member fields when partially filled", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    teamStructure: "Team Project",
    teamMembers: [
      { fullName: "", enrollmentNumber: "GDGU123", roleInTeam: "Developer" },
    ],
  });
  assert.ok(errors.teamMembers, "Should reject team member with missing full name");
});

it("4.3 Valid dynamic team members pass successfully", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "CleanWater Tech",
    startupDetails: "Low-cost smart IoT filtration system for rural and urban households.",
    studentRole: "Team Leader / Founder",
    teamStructure: "Team Project",
    startupStage: "Prototype / MVP",
    teamMembers: [
      { fullName: "Aarav Sharma", enrollmentNumber: "23001011401", roleInTeam: "IoT Lead" },
      { fullName: "Diya Patel", enrollmentNumber: "23001011402", roleInTeam: "Frontend / Mobile" },
      { fullName: "Kabir Khan", enrollmentNumber: "23001011403", roleInTeam: "Embedded Firmware" },
    ],
  });
  assert.strictEqual(errors.teamMembers, undefined);
});

// -------------------------------------------------------------
// 5. Incubation Support Requirements & 'Other' Field
// -------------------------------------------------------------
it("5.1 Standard incubation support selections pass validation", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "HealthPulse",
    startupDetails: "Wearable continuous diagnostic device with AI telemetry.",
    supportNeeded: [
      "Mentorship",
      "Funding Opportunities",
      "Incubation Support / Workspace",
      "Investor Connections",
    ],
  });
  assert.strictEqual(errors.supportNeeded, undefined);
  assert.strictEqual(errors.otherSupportDetails, undefined);
});

it("5.2 Selecting 'Other' requires specifying otherSupportDetails", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "HealthPulse",
    startupDetails: "Wearable continuous diagnostic device with AI telemetry.",
    supportNeeded: ["Mentorship", "Other"],
    otherSupportDetails: "",
  });
  assert.ok(errors.otherSupportDetails, "Should require explanation for 'Other'");
});

it("5.3 Selecting 'Other' with detailed explanation passes", () => {
  const errors = validateStartupDetails({
    hasStartupOrProject: "Yes, I have started a startup.",
    startupTitle: "HealthPulse",
    startupDetails: "Wearable continuous diagnostic device with AI telemetry.",
    supportNeeded: ["Mentorship", "Other"],
    otherSupportDetails: "Need assistance with ISO medical certification and clinical trials.",
  });
  assert.strictEqual(errors.otherSupportDetails, undefined);
});

// -------------------------------------------------------------
// 6. Data Store Persistence & Record Integrity
// -------------------------------------------------------------
it("6.1 Baseline: Existing records in .data/avishkar_store.json count is exactly 74", () => {
  const initial = getStoredRegistrations();
  assert.strictEqual(initial.length, 74, `Expected 74 registrations, got ${initial.length}`);
});

it("6.2 Saves a student registration without startup details (optional flow)", () => {
  const testRegId = `test-reg-optional-${Date.now()}`;
  const testRegNumber = `AVISHKAR-TEST-OPT-${Math.floor(100000 + Math.random() * 900000)}`;
  const testRecord = {
    id: testRegId,
    registration_number: testRegNumber,
    student_name: "Test Optional Student",
    email: "test_opt@gdgu.org",
    contact_number: "9876543210",
    gender: "Male",
    dob: "2003-05-15",
    student_id: "23001019991",
    school: "School of Engineering",
    program: "B.Tech Computer Science & Engineering",
    year_of_joining: "2023",
    course: "B.Tech Computer Science & Engineering",
    branch: "B.Tech Computer Science & Engineering",
    academic_year: null,
    reason_for_joining: "Networking and technology innovation.",
    leadership_interest: "Yes, interested in Team Lead role",
    form_version: "v2-official",
    transaction_id: `TX-OPT-${Date.now()}`,
    payment_date: "2026-10-02",
    fee_amount: 500,
    receipt_file_path: "payment-receipts/dummy.png",
    receipt_file_name: "dummy.png",
    receipt_file_size: 1024,
    receipt_mime_type: "image/png",
    remarks: "Optional flow verification",
    payment_status: "pending_verification",
    admin_review_notes: null,
    verified_at: null,
    verified_by: null,
    student_verification_status: "pending",
    student_verified_at: null,
    student_verified_by: null,
    student_verification_notes: null,
    has_startup_or_project: null,
    team_leader_name: null,
    team_leader_enrollment: null,
    team_leader_email: null,
    team_leader_contact: null,
    student_role: null,
    team_structure: null,
    team_members: null,
    startup_title: null,
    startup_details: null,
    startup_stage: null,
    support_needed: null,
    other_support_details: null,
    technologies_used: null,
    previous_work_description: null,
    project_name: null,
    project_role: null,
    project_link: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    saveStoredRegistration(testRecord);

    const afterSave = getStoredRegistrations();
    const found = afterSave.find((r) => r.registration_number === testRegNumber);
    assert.ok(found, "Saved optional registration must exist in dataStore");
    assert.strictEqual(found.has_startup_or_project, null);
  } finally {
    const store = readDataStore();
    store.registrations = store.registrations.filter((r) => r.registration_number !== testRegNumber);
    writeDataStore(store);
  }
});

it("6.3 Saves a student registration with full startup, dynamic team and incubation support", () => {
  const testRegId = `test-reg-startup-${Date.now()}`;
  const testRegNumber = `AVISHKAR-TEST-STARTUP-${Math.floor(100000 + Math.random() * 900000)}`;
  const testRecord = {
    id: testRegId,
    registration_number: testRegNumber,
    student_name: "Founder Student",
    email: "founder@gdgu.org",
    contact_number: "9812345678",
    gender: "Female",
    dob: "2002-11-20",
    student_id: "23001019992",
    school: "School of Engineering",
    program: "B.Tech Artificial Intelligence",
    year_of_joining: "2023",
    course: "B.Tech Artificial Intelligence",
    branch: "B.Tech Artificial Intelligence",
    academic_year: null,
    reason_for_joining: "Seeking seed funding and mentorship at AVISHKAR.",
    leadership_interest: "Yes, interested in Executive role",
    form_version: "v2-official",
    transaction_id: `TX-STARTUP-${Date.now()}`,
    payment_date: "2026-10-02",
    fee_amount: 500,
    receipt_file_path: "payment-receipts/dummy.png",
    receipt_file_name: "dummy.png",
    receipt_file_size: 2048,
    receipt_mime_type: "image/png",
    remarks: "Full startup flow verification",
    payment_status: "pending_verification",
    admin_review_notes: null,
    verified_at: null,
    verified_by: null,
    student_verification_status: "pending",
    student_verified_at: null,
    student_verified_by: null,
    student_verification_notes: null,

    // Rich Startup & Incubation Data
    has_startup_or_project: "Yes, I have started a startup.",
    team_leader_name: "Founder Student",
    team_leader_enrollment: "23001019992",
    team_leader_email: "founder@gdgu.org",
    team_leader_contact: "9812345678",
    student_role: "Team Leader / Founder",
    team_structure: "Team Project",
    team_members: [
      { fullName: "Aryan Gupta", enrollmentNumber: "23001019993", roleInTeam: "AI Research" },
      { fullName: "Meera Nair", enrollmentNumber: "23001019994", roleInTeam: "Product Design" },
    ],
    startup_title: "NeuroAssist AI",
    startup_details: "AI platform for personalized real-time assistance for neurodivergent students.",
    startup_stage: "Prototype / MVP",
    technologies_used: "Next.js, Python, PyTorch, Supabase, Tailwind CSS",
    support_needed: [
      "Mentorship",
      "Funding Opportunities",
      "Incubation Support / Workspace",
      "Other",
    ],
    other_support_details: "Clinical trial access at GD Goenka healthcare facilities.",
    previous_work_description: "AI platform for personalized real-time assistance for neurodivergent students.",
    project_name: "NeuroAssist AI",
    project_role: "Team Leader / Founder",
    project_link: "https://github.com/neuroassist/ai-platform",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    saveStoredRegistration(testRecord);

    const afterSave = getStoredRegistrations();
    const found = afterSave.find((r) => r.registration_number === testRegNumber);
    assert.ok(found, "Saved startup registration must exist");
    assert.strictEqual(found.startup_title, "NeuroAssist AI");
    assert.strictEqual(found.startup_stage, "Prototype / MVP");
    assert.strictEqual(found.student_role, "Team Leader / Founder");
    assert.strictEqual(found.team_structure, "Team Project");
    assert.strictEqual(found.team_members.length, 2);
    assert.deepStrictEqual(found.support_needed, [
      "Mentorship",
      "Funding Opportunities",
      "Incubation Support / Workspace",
      "Other",
    ]);
    assert.strictEqual(found.other_support_details, "Clinical trial access at GD Goenka healthcare facilities.");

    // Test updating startup details without creating duplicate or touching payment
    const updatedRecord = {
      ...found,
      startup_stage: "Testing / Pilot",
      updated_at: new Date().toISOString(),
    };
    saveStoredRegistration(updatedRecord);

    const afterUpdate = getStoredRegistrations();
    const matching = afterUpdate.filter((r) => r.registration_number === testRegNumber);
    assert.strictEqual(matching.length, 1, "Must not create duplicate registrations on update");
    assert.strictEqual(matching[0].startup_stage, "Testing / Pilot");
    assert.strictEqual(matching[0].payment_status, "pending_verification", "Payment status must remain intact");
  } finally {
    const store = readDataStore();
    store.registrations = store.registrations.filter((r) => r.registration_number !== testRegNumber);
    writeDataStore(store);
  }
});

// -------------------------------------------------------------
// 7. API Security, Status & Authorization Verification
// -------------------------------------------------------------
it("7.1 Security: PATCH rejects update without student ID or email authentication (401)", async () => {
  const req = new NextRequest("http://localhost:3000/api/register", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registrationNumber: "AVISHKAR-2026-134471",
      startupTitle: "Hacked Startup",
    }),
  });
  const res = await registerPatchHandler(req);
  assert.strictEqual(res.status, 401, "Must require student ownership credentials");
});

it("7.2 Security: PATCH blocks attempt to edit another student's record with wrong credentials (403)", async () => {
  const req = new NextRequest("http://localhost:3000/api/register", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registrationNumber: "AVISHKAR-2026-134471",
      studentId: "99999999999", // wrong ID
      email: "attacker@gmail.com", // wrong email
      startupTitle: "Unauthorized Takeover",
    }),
  });
  const res = await registerPatchHandler(req);
  assert.strictEqual(res.status, 403, "Must block unauthorized student modifications");
});

it("7.3 End-to-End: PATCH securely updates startup details for authenticated student", async () => {
  const testReg = {
    id: `reg-patch-test-${Date.now()}`,
    registration_number: "AVISHKAR-TEST-PATCH-001",
    student_name: "Aman Sharma",
    email: "aman.sharma@gdgu.org",
    contact_number: "9876543210",
    gender: "Male",
    dob: "2003-01-01",
    student_id: "23001019999",
    school: "School of Engineering",
    program: "B.Tech Computer Science",
    year_of_joining: "2023",
    course: "B.Tech Computer Science",
    branch: "B.Tech Computer Science",
    academic_year: null,
    reason_for_joining: "Innovation",
    leadership_interest: "Yes",
    form_version: "v2-official",
    transaction_id: "TX-PATCH-TEST",
    payment_date: "2026-10-02",
    fee_amount: 500,
    receipt_file_path: "payment-receipts/dummy.png",
    receipt_file_name: "dummy.png",
    receipt_file_size: 1024,
    receipt_mime_type: "image/png",
    remarks: "Test remarks",
    payment_status: "pending_verification",
    admin_review_notes: null,
    verified_at: null,
    verified_by: null,
    student_verification_status: "pending",
    student_verified_at: null,
    student_verified_by: null,
    student_verification_notes: null,
    has_startup_or_project: null,
    team_leader_name: null,
    team_leader_enrollment: null,
    team_leader_email: null,
    team_leader_contact: null,
    student_role: null,
    team_structure: null,
    team_members: null,
    startup_title: null,
    startup_details: null,
    startup_stage: null,
    support_needed: null,
    other_support_details: null,
    technologies_used: null,
    previous_work_description: null,
    project_name: null,
    project_role: null,
    project_link: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    saveStoredRegistration(testReg);

    const updateReq = new NextRequest("http://localhost:3000/api/register", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationNumber: "AVISHKAR-TEST-PATCH-001",
        studentId: "23001019999", // correct student ID
        hasStartupOrProject: "Yes, I have started a startup.",
        startupTitle: "AeroDyne Drones",
        startupDetails: "Autonomous medical supply delivery drones for high altitude terrains.",
        startupStage: "Prototype / MVP",
        studentRole: "Team Leader / Founder",
        teamStructure: "Individual Project",
        supportNeeded: ["Mentorship", "Funding Opportunities"],
      }),
    });

    const updateRes = await registerPatchHandler(updateReq);
    assert.strictEqual(updateRes.status, 200, "Update must succeed with valid credentials");

    const updatedData = await updateRes.json();
    assert.strictEqual(updatedData.success, true);

    const afterPatch = getStoredRegistrations();
    const patched = afterPatch.find((r) => r.registration_number === "AVISHKAR-TEST-PATCH-001");
    assert.ok(patched);
    assert.strictEqual(patched.startup_title, "AeroDyne Drones");
    assert.strictEqual(patched.startup_stage, "Prototype / MVP");
    assert.strictEqual(patched.student_role, "Team Leader / Founder");
    assert.strictEqual(patched.payment_status, "pending_verification", "Payment status untouched");
  } finally {
    const store = readDataStore();
    store.registrations = store.registrations.filter((r) => r.registration_number !== "AVISHKAR-TEST-PATCH-001");
    writeDataStore(store);
  }
});

it("7.4 Status Lookup: Returns rich startup and incubation details when queried", async () => {
  const testReg = {
    id: `reg-status-test-${Date.now()}`,
    registration_number: "AVISHKAR-TEST-STATUS-001",
    student_name: "Sanya Gupta",
    email: "sanya@gdgu.org",
    contact_number: "9876543211",
    gender: "Female",
    dob: "2003-02-02",
    student_id: "23001019998",
    school: "School of Engineering",
    program: "B.Tech Computer Science",
    year_of_joining: "2023",
    course: "B.Tech Computer Science",
    branch: "B.Tech Computer Science",
    academic_year: null,
    reason_for_joining: "Networking",
    leadership_interest: "Yes",
    form_version: "v2-official",
    transaction_id: "TX-STATUS-TEST",
    payment_date: "2026-10-02",
    fee_amount: 500,
    receipt_file_path: "payment-receipts/dummy.png",
    receipt_file_name: "dummy.png",
    receipt_file_size: 1024,
    receipt_mime_type: "image/png",
    remarks: "Status test",
    payment_status: "pending_verification",
    admin_review_notes: null,
    verified_at: null,
    verified_by: null,
    student_verification_status: "pending",
    student_verified_at: null,
    student_verified_by: null,
    student_verification_notes: null,
    has_startup_or_project: "Yes, I have started a startup.",
    team_leader_name: "Sanya Gupta",
    team_leader_enrollment: "23001019998",
    team_leader_email: "sanya@gdgu.org",
    team_leader_contact: "9876543211",
    student_role: "Team Leader / Founder",
    team_structure: "Individual Project",
    team_members: null,
    startup_title: "GreenLeaf Organic AI",
    startup_details: "Soil health telemetry using IoT sensors and machine learning.",
    startup_stage: "Research / Validation",
    support_needed: ["Mentorship", "Technical Guidance"],
    other_support_details: null,
    technologies_used: "Python, Raspberry Pi, LoRaWAN",
    previous_work_description: "Soil health telemetry using IoT sensors and machine learning.",
    project_name: "GreenLeaf Organic AI",
    project_role: "Team Leader / Founder",
    project_link: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    saveStoredRegistration(testReg);

    const statusReq = new NextRequest("http://localhost:3000/api/register/status?query=23001019998");
    const statusRes = await statusGetHandler(statusReq);
    assert.strictEqual(statusRes.status, 200);

    const statusData = await statusRes.json();
    assert.strictEqual(statusData.found, true);
    assert.strictEqual(statusData.registration.startupTitle, "GreenLeaf Organic AI");
    assert.strictEqual(statusData.registration.startupStage, "Research / Validation");
    assert.deepStrictEqual(statusData.registration.supportNeeded, ["Mentorship", "Technical Guidance"]);
  } finally {
    const store = readDataStore();
    store.registrations = store.registrations.filter((r) => r.registration_number !== "AVISHKAR-TEST-STATUS-001");
    writeDataStore(store);
  }
});

it("7.5 Final integrity check: Exactly 74 student records remain intact", () => {
  const finalRegistrations = getStoredRegistrations();
  assert.strictEqual(finalRegistrations.length, 74, `Expected 74 registrations, got ${finalRegistrations.length}`);
});

async function runAll() {
  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`[PASS] ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${t.name}`);
      console.error(err);
      failed++;
    }
  }

  console.log("==================================================");
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll();
