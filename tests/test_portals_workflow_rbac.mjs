// tests/test_portals_workflow_rbac.mjs
// Automated verification suite for AVISHKAR-v2 President, VP, Member portals & shared workflow

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

let memberCookie = "";
let presidentCookie = "";
let vpCookie = "";
let adminCookie = "";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    return setCookie.split(";")[0];
  }
  return "";
}

async function runTests() {
  console.log("================================================================================");
  console.log("AVISHKAR 2026 — Role Portals, Shared Workflow & RBAC Automated Test Suite");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Authenticate all roles
  // ---------------------------------------------------------------------------
  console.log("[1/13] Authenticating council accounts...");
  // Member
  const mRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "member@gdgoenka.ac.in", password: "Member@2026" }),
  });
  assert(mRes.ok, "Member login succeeds (200)");
  memberCookie = await extractCookie(mRes);

  // President
  const pRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "president@gdgoenka.ac.in", password: "President@2026" }),
  });
  assert(pRes.ok, "President login succeeds (200)");
  presidentCookie = await extractCookie(pRes);

  // VP
  const vpRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vp@gdgoenka.ac.in", password: "VP@2026" }),
  });
  assert(vpRes.ok, "Vice President login succeeds (200)");
  vpCookie = await extractCookie(vpRes);

  // Admin
  const aRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gdgoenka.ac.in", password: "Admin@2026" }),
  });
  assert(aRes.ok, "Admin login succeeds (200)");
  adminCookie = await extractCookie(aRes);

  // ---------------------------------------------------------------------------
  // STEP 2: Member can create, edit, and submit their own proposal
  // ---------------------------------------------------------------------------
  console.log("\n[2/13] Testing Member proposal creation, draft editing, and submission...");
  // 2a. Save draft
  const draftRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      title: "BioHack: Synthetic Biology Sprint",
      description: "Genetic algorithm modeling and bio-computing hackathon.",
      objectives: "Hands-on genetic data analysis and algorithmic modeling.",
      category: "Hackathon",
      proposedDateTime: "15 Oct 2026, 09:00 AM",
      deliveryMode: "In-Person",
      expectedParticipants: 40,
      teamSizeMin: 2,
      teamSizeMax: 4,
      venuePlaceholder: "BioTech Research Lab, Block D",
      requiredResources: "High-memory workstations, sterile bench kits",
      supportingDocsUrl: "/docs/biohack-spec.pdf",
      status: "draft",
    }),
  });
  assert(draftRes.ok, "Member can save draft proposal (200)");
  const draftData = await draftRes.json();
  const draftEventId = draftData.event.id;
  assert(draftData.event.status === "draft", "Proposal status initialized to 'draft'");
  assert(draftData.event.objectives === "Hands-on genetic data analysis and algorithmic modeling.", "Objectives preserved");

  // 2b. Edit draft
  const editDraftRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      action: "edit",
      title: "BioHack: Synthetic Biology & AI Sprint (v2)",
      expectedParticipants: 60,
    }),
  });
  assert(editDraftRes.ok, "Member can edit their own draft proposal (200)");
  const editDraftData = await editDraftRes.json();
  assert(editDraftData.event.title.includes("(v2)"), "Title updated in draft");
  assert(editDraftData.event.expectedParticipants === 60, "Expected participants updated to 60");

  // 2c. Submit draft for review
  const submitDraftRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      action: "submit",
    }),
  });
  assert(submitDraftRes.ok, "Member can submit draft proposal for President review (200)");
  const submitDraftData = await submitDraftRes.json();
  assert(submitDraftData.event.status === "proposed", "Proposal status transitioned from draft to 'proposed'");
  assert(Boolean(submitDraftData.event.submittedAt), "Submission timestamp recorded");

  // ---------------------------------------------------------------------------
  // STEP 3: Member cannot modify another member's proposal
  // ---------------------------------------------------------------------------
  console.log("\n[3/13] Testing cross-member modification security...");
  // Admin creates an event
  const adminEvtRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "Faculty Robotics Exhibition",
      description: "Exhibition organized by faculty admin.",
      category: "Robotics",
      status: "proposed",
    }),
  });
  assert(adminEvtRes.ok, "Admin creates event (200)");
  const adminEvtData = await adminEvtRes.json();
  const adminEvtId = adminEvtData.event.id;

  // Member tries to edit the admin's event
  const memberEditOtherRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: adminEvtId,
      action: "edit",
      title: "Hacked by Member",
    }),
  });
  assert(memberEditOtherRes.status === 403, "Member is forbidden from editing another user's proposal (HTTP 403)");

  // ---------------------------------------------------------------------------
  // STEP 4: President can approve or reject a pending proposal
  // ---------------------------------------------------------------------------
  console.log("\n[4/13] Testing President proposal decision workflow...");
  // President approves the member's submitted proposal
  const approveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      action: "approve",
      reviewComment: "Approved for full schedule by President Council.",
    }),
  });
  assert(approveRes.ok, "President can approve proposal (200)");
  const approveData = await approveRes.json();
  assert(approveData.event.status === "approved", "Proposal status transitioned to 'approved'");
  assert(approveData.event.approvedBy.includes("President"), "Reviewer recorded as President");
  assert(Boolean(approveData.event.reviewedAt), "Review timestamp recorded");

  // ---------------------------------------------------------------------------
  // STEP 5: Rejection requires a comment
  // ---------------------------------------------------------------------------
  console.log("\n[5/13] Testing mandatory rejection comment enforcement...");
  // Member creates a second proposal to be rejected
  const prop2Res = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      title: "Overclocking Arena 2026",
      description: "Sub-zero liquid nitrogen hardware overclocking.",
      category: "Gaming",
      status: "proposed",
    }),
  });
  assert(prop2Res.ok, "Member submits second proposal (200)");
  const prop2Data = await prop2Res.json();
  const prop2Id = prop2Data.event.id;

  // President attempts reject WITHOUT comment
  const rejectNoCommentRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentCookie },
    body: JSON.stringify({
      eventId: prop2Id,
      action: "reject",
      rejectionReason: "", // Empty comment
    }),
  });
  assert(rejectNoCommentRes.status === 400, "Rejecting without comment fails with HTTP 400");
  const rejectNoCommentData = await rejectNoCommentRes.json();
  assert(rejectNoCommentData.code === "REJECTION_REASON_REQUIRED", "Error code is REJECTION_REASON_REQUIRED");

  // President rejects WITH comment
  const rejectWithCommentRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentCookie },
    body: JSON.stringify({
      eventId: prop2Id,
      action: "reject",
      rejectionReason: "Safety hazard: Liquid nitrogen is not permitted inside campus computing labs.",
    }),
  });
  assert(rejectWithCommentRes.ok, "Rejecting with comment succeeds (200)");
  const rejectWithCommentData = await rejectWithCommentRes.json();
  assert(rejectWithCommentData.event.status === "rejected", "Status transitioned to 'rejected'");
  assert(rejectWithCommentData.event.rejectionReason.includes("Safety hazard"), "Rejection reason saved");

  // ---------------------------------------------------------------------------
  // STEP 6: VP sees approved proposals and can assign tasks & coordination
  // ---------------------------------------------------------------------------
  console.log("\n[6/13] Testing Vice President coordination and task assignment...");
  // VP coordination
  const coordRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      action: "coordinate",
      coordinatorName: "Technical Track Coordinator (Member)",
      coordinatorEmail: "member@gdgoenka.ac.in",
      coordinationStatus: "in_coordination",
      coordinationNotes: "Lab 301 reserved. Biosafety cabinets confirmed.",
    }),
  });
  assert(coordRes.ok, "VP can coordinate approved proposal (200)");
  const coordData = await coordRes.json();
  assert(coordData.event.coordinatorName === "Technical Track Coordinator (Member)", "Coordinator assigned");

  // VP assigns task to member
  const taskRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      eventTitle: "BioHack: Synthetic Biology & AI Sprint (v2)",
      memberId: "mem-003",
      memberName: "Technical Track Coordinator (Member)",
      title: "Coordinate with Biotech Lab In-charge for Workstations",
      description: "Obtain clearance for 15 workstations and safety protocols.",
      priority: "high",
      dueDate: "2026-10-14",
      status: "todo",
    }),
  });
  assert(taskRes.ok, "VP can assign committee task (200)");
  const taskData = await taskRes.json();
  const createdTaskId = taskData.task.id;
  assert(taskData.task.assignedByRole === "Vice President", "Task records VP as assigner");

  // ---------------------------------------------------------------------------
  // STEP 7: Members can update only tasks assigned to them
  // ---------------------------------------------------------------------------
  console.log("\n[7/13] Testing member task ownership and progress updates...");
  // Member updates their own task to in_progress
  const updateTaskRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      taskId: createdTaskId,
      status: "in_progress",
    }),
  });
  assert(updateTaskRes.ok, "Member can update status of their assigned task (200)");
  const updateTaskData = await updateTaskRes.json();
  assert(updateTaskData.task.status === "in_progress", "Task status updated to in_progress");

  // Member marks their task completed
  const completeTaskRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      taskId: createdTaskId,
      status: "completed",
    }),
  });
  assert(completeTaskRes.ok, "Member marks task completed (200)");
  const completeTaskData = await completeTaskRes.json();
  assert(completeTaskData.task.status === "completed", "Task status is completed");

  // VP assigns a task to mem-002 (Admin), not to member (mem-003)
  const taskOtherRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      eventTitle: "BioHack: Synthetic Biology & AI Sprint (v2)",
      memberId: "mem-002",
      memberName: "Organizing Administrator",
      title: "Audio Visual Wiring for Main Auditorium",
      priority: "medium",
    }),
  });
  const taskOtherData = await taskOtherRes.json();
  const otherTaskId = taskOtherData.task.id;

  // Member tries to modify the other person's task
  const memberTamperRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      taskId: otherTaskId,
      status: "completed",
    }),
  });
  assert(memberTamperRes.status === 403, "Member is forbidden from updating tasks assigned to others (HTTP 403)");

  // ---------------------------------------------------------------------------
  // STEP 8: VP cannot override President decisions or publish events
  // ---------------------------------------------------------------------------
  console.log("\n[8/13] Testing VP permissions boundary...");
  // VP tries to approve a proposed event
  const vpApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: adminEvtId,
      action: "approve",
    }),
  });
  assert(vpApproveRes.status === 403, "VP cannot approve proposals (HTTP 403 PRESIDENT_REQUIRED)");

  // VP tries to publish an event
  const vpPublishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      action: "publish",
    }),
  });
  assert(vpPublishRes.status === 403, "VP cannot publish events (HTTP 403)");

  // VP tries to verify payment
  const vpPaymentRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      registrationId: "dummy-reg-1",
      action: "approve",
    }),
  });
  assert(vpPaymentRes.status === 403, "VP cannot verify payments (HTTP 403 ADMIN_REQUIRED_FOR_PAYMENTS)");

  // President also cannot verify payments
  const presPaymentRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: presidentCookie },
    body: JSON.stringify({
      registrationId: "dummy-reg-1",
      action: "approve",
    }),
  });
  assert(presPaymentRes.status === 403, "President cannot verify payments (HTTP 403 ADMIN_REQUIRED_FOR_PAYMENTS)");

  // ---------------------------------------------------------------------------
  // STEP 9: Admin can publish eligible approved events
  // ---------------------------------------------------------------------------
  console.log("\n[9/13] Testing Admin event publishing...");
  const adminPublishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      action: "publish",
    }),
  });
  assert(adminPublishRes.ok, "Admin can publish President-approved event (200)");
  const adminPublishData = await adminPublishRes.json();
  assert(adminPublishData.event.status === "published", "Event status transitioned to 'published'");

  // ---------------------------------------------------------------------------
  // STEP 10: Rejected proposals cannot be published
  // ---------------------------------------------------------------------------
  console.log("\n[10/13] Testing rejected proposal publishing prevention...");
  const adminPublishRejectedRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      eventId: prop2Id, // The rejected event
      action: "publish",
    }),
  });
  assert(adminPublishRejectedRes.status === 400, "Publishing rejected proposal fails with HTTP 400");
  const adminPublishRejectedData = await adminPublishRejectedRes.json();
  assert(
    adminPublishRejectedData.code === "REJECTED_CANNOT_PUBLISH" ||
    adminPublishRejectedData.code === "APPROVAL_REQUIRED",
    "Rejected proposal rejected from publishing"
  );

  // ---------------------------------------------------------------------------
  // STEP 11: Unauthorized API calls return 401 or 403
  // ---------------------------------------------------------------------------
  console.log("\n[11/13] Testing unauthorized API call handling...");
  // Unauthenticated GET
  const unauthGetRes = await fetch(`${BASE_URL}/api/admin/events`);
  assert(unauthGetRes.status === 401, "Unauthenticated GET /api/admin/events returns HTTP 401");

  // Unauthenticated POST
  const unauthPostRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Unauth task" }),
  });
  assert(unauthPostRes.status === 401, "Unauthenticated POST /api/admin/tasks returns HTTP 401");

  // Member assigning task
  const memberAssignRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: draftEventId,
      memberId: "mem-001",
      title: "Unauthorized task assignment",
    }),
  });
  assert(memberAssignRes.status === 403, "Member attempting to assign task returns HTTP 403 FORBIDDEN");

  // ---------------------------------------------------------------------------
  // STEP 12: Existing student registration and payment verification still work
  // ---------------------------------------------------------------------------
  console.log("\n[12/13] Testing student registration and payment verification preservation...");
  // Register a student using FormData
  const studentDummyId = `TEST_WF_${Date.now()}`;
  const regFormData = new FormData();
  regFormData.append("studentName", "Aditya Roy");
  regFormData.append("email", `aditya.${Date.now()}@gdgoenka.ac.in`);
  regFormData.append("contactNumber", "9876543210");
  regFormData.append("gender", "Male");
  regFormData.append("dob", "2003-05-15");
  regFormData.append("studentId", studentDummyId);
  regFormData.append("school", "SOES");
  regFormData.append("program", "Computer science and engineering CORE");
  regFormData.append("yearOfJoining", "2023");
  regFormData.append("reasonForJoining", "Passionate about competitive hacking, and AI tracks.");
  regFormData.append("leadershipInterest", "Yes");
  regFormData.append("transactionId", `UTR${Date.now()}`);
  regFormData.append("paymentDate", "2026-10-13");
  regFormData.append("remarks", "Workflow Preservation Test");

  const dummyReceiptContent = Buffer.from("DUMMY RECEIPT PROOF FOR RBAC WORKFLOW TEST");
  const receiptBlob = new Blob([dummyReceiptContent], { type: "application/pdf" });
  regFormData.append("receiptFile", receiptBlob, "test_receipt.pdf");

  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    body: regFormData,
  });
  assert(regRes.ok, "Student registration succeeds (200/201)");
  const regData = await regRes.json();
  const testRegNum = regData.registrationNumber;
  assert(Boolean(testRegNum), "Student received registration number");

  // Lookup in admin roster
  const rosterRes = await fetch(`${BASE_URL}/api/admin/registrations?search=${encodeURIComponent(studentDummyId)}`, {
    headers: { Cookie: adminCookie },
  });
  assert(rosterRes.ok, "Admin can query registration roster");
  const rosterData = await rosterRes.json();
  const foundReg = rosterData.registrations.find((r) => r.student_id === studentDummyId);
  assert(Boolean(foundReg), "Found registered student in admin roster");
  const testRegId = foundReg.id || foundReg.registration_number;

  // Admin approves payment
  const payVerifyRes = await fetch(`${BASE_URL}/api/admin/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      registrationId: testRegId,
      action: "approve",
      notes: "Payment verified by authorized Admin",
    }),
  });
  assert(payVerifyRes.ok, "Admin payment approval succeeds (200)");
  const payVerifyData = await payVerifyRes.json();
  assert(payVerifyData.registration.payment_status === "verified", "Payment status is verified");

  // ---------------------------------------------------------------------------
  // STEP 13: Existing data & store persistence verified
  // ---------------------------------------------------------------------------
  console.log("\n[13/13] Verifying persistent store and audit logs...");
  const eventsListRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  assert(eventsListRes.ok, "Admin can retrieve events store");
  const eventsListData = await eventsListRes.json();
  const foundPublished = eventsListData.events.find((e) => e.id === draftEventId);
  assert(Boolean(foundPublished), "Created proposal persists in events store");
  assert(foundPublished.status === "published", "Persisted status is 'published'");
  assert(foundPublished.coordinatorName === "Technical Track Coordinator (Member)", "Persisted coordinator matches");

  // Check audit logs
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Cookie: presidentCookie },
  });
  assert(auditRes.ok, "President can retrieve audit logs");
  const auditData = await auditRes.json();
  assert(auditData.auditLogs.length > 0, "Audit logs recorded governance actions");
  const hasProposalApprovedLog = auditData.auditLogs.some((l) => l.action === "EVENT_APPROVE");
  assert(hasProposalApprovedLog, "EVENT_APPROVE audit log entry recorded");

  console.log("\n================================================================================");
  console.log("🎉 ALL 13 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("FATAL TEST SUITE ERROR:", err);
  process.exit(1);
});
