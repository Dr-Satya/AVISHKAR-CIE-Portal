// tests/test_demo_rehearsal.mjs
// End-to-End rehearsal verification test for tomorrow's demo

import fs from "fs";
import path from "path";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const {
  authenticateLocalCouncil,
  getStoredRegistrations,
  saveStoredRegistration,
  updateStoredRegistrationPayment,
  getStoredEvents,
  saveStoredEvent,
  getStoredTasks,
  saveStoredTask,
} = jiti("../src/lib/dataStore.ts");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runDemoRehearsal() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — End-to-End Demo Readiness Rehearsal");
  console.log("================================================================================\n");

  // 1. Verify Council Auth for all 4 Portals
  console.log("[1/6] Testing Role Authentication & RBAC for all 4 council accounts...");
  const rolesToTest = [
    { email: "admin@gdgoenka.ac.in", pass: "Admin@2026", expectedRole: "Admin" },
    { email: "president@gdgoenka.ac.in", pass: "President@2026", expectedRole: "President" },
    { email: "vp@gdgoenka.ac.in", pass: "VP@2026", expectedRole: "Vice President" },
    { email: "member@gdgoenka.ac.in", pass: "Member@2026", expectedRole: "AVISHKAR Member" },
  ];

  for (const r of rolesToTest) {
    const auth = authenticateLocalCouncil(r.email, r.pass);
    assert(auth.authenticated === true, `Auth successful for ${r.expectedRole} (${r.email})`);
    assert(auth.user?.role === r.expectedRole, `Role matches ${r.expectedRole}`);
  }

  // Bad credentials test
  const badAuth = authenticateLocalCouncil("admin@gdgoenka.ac.in", "WrongPassword");
  assert(badAuth.authenticated === false, "Bad password correctly rejected");

  // 2. Student Registration Simulation
  console.log("\n[2/6] Testing Student Registration & Persistence...");
  const testStudentId = `GDGU_DEMO_${Date.now()}`;
  const testRegNum = `AVISHKAR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const testTxId = `TXN_DEMO_${Date.now()}`;

  const testRegistration = {
    id: `reg-demo-${Date.now()}`,
    registration_number: testRegNum,
    student_name: "Aarav Sharma (Demo Student)",
    email: "aarav.sharma@gdgoenka.ac.in",
    contact_number: "9876543210",
    gender: "Male",
    dob: "2004-08-12",
    student_id: testStudentId,
    school: "School of Engineering & Sciences (SOES)",
    program: "B.Tech Computer Science & Engineering",
    year_of_joining: "2023",
    course: "B.Tech Computer Science & Engineering",
    branch: "B.Tech Computer Science & Engineering",
    academic_year: null,
    previous_work_description: "Built IoT sensor prototype for campus energy tracking",
    project_name: "Campus Energy Pulse",
    project_role: "Lead Developer",
    technologies_used: "Node.js, React, MQTT",
    project_link: "https://github.com/example/campus-energy",
    reason_for_joining: "Eager to innovate and present cutting-edge tech at AVISHKAR",
    leadership_interest: "Technical Track Coordinator",
    form_version: "v2-official",
    transaction_id: testTxId,
    payment_date: "2026-10-24",
    fee_amount: 500,
    receipt_file_path: "payment-receipts/demo_receipt.png",
    receipt_file_name: "demo_receipt.png",
    receipt_file_size: 1048576,
    receipt_mime_type: "image/png",
    remarks: "Demo test transaction",
    payment_status: "pending_verification",
    admin_review_notes: null,
    verified_at: null,
    verified_by: null,
    student_verification_status: "pending",
    student_verified_at: null,
    student_verified_by: null,
    student_verification_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveStoredRegistration(testRegistration);

  const storedList = getStoredRegistrations();
  const foundReg = storedList.find((r) => r.registration_number === testRegNum);
  assert(Boolean(foundReg), `Registration ${testRegNum} successfully persisted`);
  assert(foundReg?.payment_status === "pending_verification", "Initial payment status is 'pending_verification'");
  assert(foundReg?.student_id === testStudentId, "Student ID matches submitted record");

  // 3. Payment Verification by Admin
  console.log("\n[3/6] Testing Payment Verification by Organizing Admin...");
  const updatedReg = updateStoredRegistrationPayment(
    testRegNum,
    "approve",
    undefined,
    "Bank UTR confirmed against university account",
    "admin@gdgoenka.ac.in"
  );

  assert(Boolean(updatedReg), "Payment update executed");
  assert(updatedReg?.payment_status === "verified", "Payment status transitioned to 'verified'");
  assert(Boolean(updatedReg?.verified_at), "Verification timestamp recorded");
  assert(updatedReg?.verified_by === "admin@gdgoenka.ac.in", "Verifying admin email recorded");

  // Re-read from store to ensure disk persistence
  const reReadList = getStoredRegistrations();
  const reReadReg = reReadList.find((r) => r.registration_number === testRegNum);
  assert(reReadReg?.payment_status === "verified", "Verified payment status successfully persisted on disk");

  // 4. Member Event Proposal Submission
  console.log("\n[4/6] Testing Member Event Proposal Submission...");
  const demoEventId = `evt-demo-${Date.now()}`;
  const testProposal = {
    id: demoEventId,
    title: "AI & Quantum Frontiers 2026 (Demo Event)",
    slug: `ai-quantum-frontiers-${Date.now()}`,
    description: "Hands-on quantum computing algorithms and neural network optimization competition.",
    category: "Technical",
    status: "proposed",
    proposedBy: "member@gdgoenka.ac.in",
    teamSizeMin: 2,
    teamSizeMax: 4,
    datePlaceholder: "October 2026",
    venuePlaceholder: "Auditorium Block A, GD Goenka University",
    rulebookUrl: null,
    assignedMemberIds: ["mem-003"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveStoredEvent(testProposal);
  const eventsAfterProposal = getStoredEvents();
  const foundProposal = eventsAfterProposal.find((e) => e.id === demoEventId);
  assert(Boolean(foundProposal), "Event proposal successfully submitted");
  assert(foundProposal?.status === "proposed", "Event status is 'proposed'");

  // 5. Vice President Operations Review & Task Assignment
  console.log("\n[5/6] Testing Vice President Review & Operations Task Delegation...");
  // VP review does not publish; VP marks proposal reviewed and delegates tasks
  const testTask = {
    id: `tsk-demo-${Date.now()}`,
    eventId: demoEventId,
    eventTitle: testProposal.title,
    memberId: "mem-003",
    memberName: "Technical Track Coordinator (Member)",
    title: "Prepare Quantum Simulator Lab Machines",
    description: "Install Qiskit and cloud compute credentials for event participants.",
    status: "todo",
    priority: "high",
    dueDate: "2026-10-25",
    createdAt: new Date().toISOString(),
  };

  saveStoredTask(testTask);
  const tasksAfter = getStoredTasks();
  const foundTask = tasksAfter.find((t) => t.id === testTask.id);
  assert(Boolean(foundTask), "Operations task created and assigned to Member");
  assert(foundTask?.eventId === demoEventId, "Task associated with correct event");

  // 6. President Approval & Final Publication
  console.log("\n[6/6] Testing President Approval & Event Publication...");
  const eventToApprove = getStoredEvents().find((e) => e.id === demoEventId);
  assert(Boolean(eventToApprove), "Found demo event for approval");

  // VP approves first
  eventToApprove.vpStatus = "approved";
  eventToApprove.vpApprovedBy = "vp@gdgoenka.ac.in";
  eventToApprove.vpApprovedAt = new Date().toISOString();
  saveStoredEvent(eventToApprove);
  assert(getStoredEvents().find((e) => e.id === demoEventId)?.vpStatus === "approved", "VP marked event approved");

  // President gives executive approval
  eventToApprove.status = "approved";
  eventToApprove.approvedBy = "president@gdgoenka.ac.in";
  eventToApprove.approvedAt = new Date().toISOString();
  saveStoredEvent(eventToApprove);
  assert(getStoredEvents().find((e) => e.id === demoEventId)?.status === "approved", "President approved event");

  // Admin publishes
  eventToApprove.status = "published";
  eventToApprove.publishedAt = new Date().toISOString();
  saveStoredEvent(eventToApprove);
  assert(getStoredEvents().find((e) => e.id === demoEventId)?.status === "published", "Event status is 'published' and visible publicly");

  console.log("\n================================================================================");
  console.log("🎉 ALL DEMO REHEARSAL SEQUENCES COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");
}

runDemoRehearsal();
