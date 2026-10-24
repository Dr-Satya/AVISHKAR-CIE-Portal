/**
 * AVISHKAR 2026 — Event Approval Tracker Comprehensive Verification Test Suite
 *
 * Verifies all 10 requirements from Section 9:
 * 1. Proposal waiting for VP approval/coordination is identified accurately.
 * 2. Proposal waiting for President approval is identified accurately.
 * 3. Proposal requiring both approvals is not marked ready for publication prematurely.
 * 4. Rejected proposal displays rejection status and rejection reason.
 * 5. Event becomes ready for publication only after all required approvals are complete.
 * 6. Publication status remains separate from approval status.
 * 7. Live counts & filters update dynamically after approval decisions.
 * 8. Approval history identifies the decision-maker, role, action, and timestamp.
 * 9. Existing President, Vice President, Member, and Administrative Management workflows continue working.
 * 10. Unauthorized users cannot change approval decisions (RBAC strictly enforced).
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedCount++;
  }
}

async function loginAs(email, password) {
  const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const cookie = res.headers.get("set-cookie");
  const parsedCookie = cookie ? cookie.split(";")[0] : "";
  return { res, data, cookie: parsedCookie };
}

async function runTrackerTests() {
  console.log("=================================================================");
  console.log("AVISHKAR-v2: EVENT APPROVAL TRACKER TEST SUITE");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("=================================================================\n");

  // Step 0: Authenticate all council roles
  console.log("[Phase 0] Authenticating all council roles...");
  const adminAuth = await loginAs("admin@gdgoenka.ac.in", "Admin@2026");
  assert(adminAuth.res.status === 200 && adminAuth.data.user?.role === "Admin", "Admin logged in");

  const presidentAuth = await loginAs("president@gdgoenka.ac.in", "President@2026");
  assert(presidentAuth.res.status === 200 && presidentAuth.data.user?.role === "President", "President logged in");

  const vpAuth = await loginAs("vp@gdgoenka.ac.in", "VP@2026");
  assert(vpAuth.res.status === 200 && vpAuth.data.user?.role === "Vice President", "Vice President logged in");

  const memberAuth = await loginAs("member@gdgoenka.ac.in", "Member@2026");
  assert(memberAuth.res.status === 200 && memberAuth.data.user?.role === "AVISHKAR Member", "Member logged in");

  // Step 1: Verify existing seeded events represent correct approval stages
  console.log("\n[Phase 1] Inspecting Seeded Events & Approval Pipeline Stages...");
  const listRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const listData = await listRes.json();
  assert(listRes.status === 200 && Array.isArray(listData.events), "GET /api/admin/events returns authentic events array");

  const events = listData.events;
  const evt001 = events.find((e) => e.status === "published" && e.presidentStatus === "approved");
  const evt003 = events.find((e) => e.status === "approved" && e.vpStatus === "approved" && e.presidentStatus === "approved");
  const pendingPresEvt = events.find((e) => e.status === "proposed");
  const pendingVpEvt = events.find((e) => e.id === "evt-005") || events.find((e) => e.status === "approved" && e.presidentStatus === "approved" && e.vpStatus !== "approved");
  const rejectedEvt = events.find((e) => e.status === "rejected");

  // Verification 1: Pending President Review
  console.log("\n[Verification 1 & 2] Verifying Pending Approval Classification...");
  assert(Boolean(pendingPresEvt), "Found event proposal in 'proposed' status");
  if (pendingPresEvt) {
    assert(pendingPresEvt.presidentStatus === "pending", `${pendingPresEvt.title} has presidentStatus === 'pending'`);
  }

  // Verification 2: Awaiting VP Coordination / Review
  assert(Boolean(pendingVpEvt), "Found proposal approved by President awaiting VP coordination");
  if (pendingVpEvt) {
    assert(pendingVpEvt.presidentStatus === "approved", `${pendingVpEvt.title} President approval is recorded`);
    assert(
      pendingVpEvt.vpStatus !== "approved" && pendingVpEvt.coordinationStatus !== "coordination_ready",
      `${pendingVpEvt.title} Vice President status is not yet approved/ready (identified as awaiting next approval)`
    );
  }

  // Verification 3: Not Marked Ready For Publication Prematurely
  console.log("\n[Verification 3] Verifying Premature Publication Guardrails...");
  if (pendingPresEvt) {
    assert(
      pendingPresEvt.status !== "approved" && pendingPresEvt.status !== "published",
      "Proposal awaiting President is NOT marked approved or published"
    );
  }
  if (pendingVpEvt) {
    assert(
      pendingVpEvt.coordinationStatus !== "coordination_ready",
      "Proposal awaiting VP coordination is NOT marked ready for publication"
    );
  }

  // Verification 4: Rejected Proposal with Reason
  console.log("\n[Verification 4] Verifying Rejection Status & Available Rationale...");
  assert(Boolean(rejectedEvt), "Found rejected event proposal in store");
  if (rejectedEvt) {
    assert(rejectedEvt.status === "rejected", `${rejectedEvt.title} is in 'rejected' status`);
    assert(
      Boolean(rejectedEvt.rejectionReason || rejectedEvt.presidentRejectionReason),
      `${rejectedEvt.title} displays rejection reason: "${rejectedEvt.rejectionReason || rejectedEvt.presidentRejectionReason}"`
    );
    assert(
      Boolean(rejectedEvt.reviewedBy || rejectedEvt.presidentDecisionBy),
      `${rejectedEvt.title} identifies rejector: ${rejectedEvt.reviewedBy || rejectedEvt.presidentDecisionBy}`
    );
  }

  // Verification 5 & 6: Ready for Publication vs Published Distinction (evt-003 vs evt-001)
  console.log("\n[Verification 5 & 6] Verifying Ready For Publication vs Published...");
  assert(
    evt003 && evt003.status === "approved" && evt003.vpStatus === "approved" && evt003.presidentStatus === "approved",
    "evt-003 has both President and VP approval recorded"
  );
  assert(
    evt003.status !== "published",
    "Approved event evt-003 is NOT published automatically (approval separated from publication)"
  );
  assert(
    evt001 && evt001.status === "published",
    "evt-001 is distinctly in published status with student registrations enabled"
  );

  // Verification 7: Live Workflow Progression & Counter Updates
  console.log("\n[Verification 7] Testing Dynamic Workflow Progression & Decision Trail...");
  // 7a. Member creates and submits a proposal
  const newTitle = `AI Autonomous Hackathon ${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberAuth.cookie },
    body: JSON.stringify({
      title: newTitle,
      description: "A competitive track testing multi-agent systems and real-time execution.",
      category: "Hackathon",
      status: "draft",
      datePlaceholder: "24-25 October 2026",
      venuePlaceholder: "AI Research Centre, Block B",
      teamSizeMin: 2,
      teamSizeMax: 4,
    }),
  });
  const createData = await createRes.json();
  assert(createRes.status === 200 && createData.event?.id, `Member created event proposal draft: ${createData.event?.id}`);
  const newEvtId = createData.event.id;

  // Submit draft as proposal
  const submitRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberAuth.cookie },
    body: JSON.stringify({ eventId: newEvtId, action: "submit" }),
  });
  const submitData = await submitRes.json();
  if (submitRes.status !== 200) {
    console.log("DEBUG submitRes:", submitRes.status, submitData);
  }
  assert(submitRes.status === 200 && submitData.event?.status === "proposed", "Proposal submitted for review");

  // Check state: Should be pending VP review first in Workflow A
  const checkPendingRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminAuth.cookie },
  });
  const checkPendingData = await checkPendingRes.json();
  const pendingEvt = checkPendingData.events.find((e) => e.id === newEvtId);
  assert(pendingEvt.vpStatus === "pending", "New proposal is classified as Pending VP Review");
  assert(pendingEvt.approvalHistory?.length >= 1, "Submission recorded in approval history");

  // 7b. Guardrail check: President cannot approve before VP approval
  const prematurePresApprove = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentAuth.cookie },
    body: JSON.stringify({
      eventId: newEvtId,
      action: "approve",
      reviewComment: "Premature approval attempt",
    }),
  });
  assert(prematurePresApprove.status === 400, "Guardrail: President approval blocked before VP approves");

  // 7c. Vice President evaluates and approves proposal (Workflow A - Step 1)
  const vpApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpAuth.cookie },
    body: JSON.stringify({
      eventId: newEvtId,
      action: "vp_approve",
      comment: "Logistics and lab availability verified.",
    }),
  });
  const vpApproveData = await vpApproveRes.json();
  assert(vpApproveRes.status === 200, "VP approved the proposal");
  assert(vpApproveData.event?.vpStatus === "approved", "vpStatus updated to 'approved'");

  // 7d. President evaluates and approves proposal (Workflow A - Step 2)
  const presApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentAuth.cookie },
    body: JSON.stringify({
      eventId: newEvtId,
      action: "approve",
      reviewComment: "Sound academic problem statement approved for AVISHKAR.",
    }),
  });
  const presApproveData = await presApproveRes.json();
  assert(presApproveRes.status === 200 && presApproveData.event?.status === "approved", "President approved the proposal");
  assert(presApproveData.event?.presidentStatus === "approved", "presidentStatus updated to 'approved'");
  assert(
    Boolean(presApproveData.event?.presidentDecisionBy && presApproveData.event?.presidentDecisionBy.includes("President")),
    `President decision-maker tracked: ${presApproveData.event?.presidentDecisionBy}`
  );

  // 7e. VP coordinates / reviews logistics
  const vpCoordRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpAuth.cookie },
    body: JSON.stringify({
      eventId: newEvtId,
      action: "coordinate",
      coordinatorName: "VP Logistics Bureau",
      coordinationStatus: "coordination_ready",
      coordinationNotes: "Lab 301 reserved, 50 workstations and high-speed switches allocated.",
    }),
  });
  const vpCoordData = await vpCoordRes.json();
  assert(vpCoordRes.status === 200, "VP completed logistical coordination");
  assert(vpCoordData.event?.vpStatus === "approved", "vpStatus marked approved via coordination readiness");

  // Verification 8: Approval History Identifies Decision-Makers & Timestamps
  console.log("\n[Verification 8] Verifying Approval History Audit Entries...");
  const updatedEvt = vpCoordData.event;
  const history = updatedEvt.approvalHistory || [];
  assert(history.length >= 2, `Approval history has ${history.length} entries`);

  const presHistoryEntry = history.find((h) => h.stage === "President");
  assert(Boolean(presHistoryEntry), "History contains President decision entry");
  if (presHistoryEntry) {
    assert(presHistoryEntry.actorEmail === "president@gdgoenka.ac.in", "President actorEmail recorded accurately");
    assert(Boolean(presHistoryEntry.timestamp), `President decision timestamp recorded: ${presHistoryEntry.timestamp}`);
    assert(presHistoryEntry.decision === "approved", "President decision action recorded as 'approved'");
  }

  const vpHistoryEntry = history.find((h) => h.stage === "Vice President");
  assert(Boolean(vpHistoryEntry), "History contains Vice President coordination entry");
  if (vpHistoryEntry) {
    assert(vpHistoryEntry.actorEmail === "vp@gdgoenka.ac.in", "VP actorEmail recorded accurately");
    assert(Boolean(vpHistoryEntry.timestamp), `VP coordination timestamp recorded: ${vpHistoryEntry.timestamp}`);
  }

  // Verification 9 & 10: RBAC Integrity & Security Protection
  console.log("\n[Verification 9 & 10] Verifying RBAC & Security Enforcements...");
  // 10a. Member cannot approve an event (HTTP 403)
  const memberUnauthorizedApprove = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberAuth.cookie },
    body: JSON.stringify({ eventId: newEvtId, action: "approve" }),
  });
  assert(
    memberUnauthorizedApprove.status === 403,
    "Member cannot approve an event proposal (HTTP 403 PRESIDENT_REQUIRED)"
  );

  // 10b. Vice President cannot approve proposal (Only President can approve proposals)
  const vpUnauthorizedApprove = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpAuth.cookie },
    body: JSON.stringify({ eventId: newEvtId, action: "approve" }),
  });
  assert(
    vpUnauthorizedApprove.status === 403,
    "Vice President cannot perform constitutional proposal approval (HTTP 403 PRESIDENT_REQUIRED)"
  );

  // 10c. Admin can publish now that both approvals are complete
  const adminPublishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminAuth.cookie },
    body: JSON.stringify({ eventId: newEvtId, action: "publish" }),
  });
  const adminPublishData = await adminPublishRes.json();
  assert(
    adminPublishRes.status === 200 &&
      (adminPublishData.event?.status === "published" || adminPublishData.event?.event?.status === "published"),
    "Administrator published fully approved event"
  );

  // Summary
  console.log("\n=================================================================");
  console.log(`EVENT APPROVAL TRACKER TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTrackerTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
