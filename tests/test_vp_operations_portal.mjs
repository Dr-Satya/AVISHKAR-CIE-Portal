// tests/test_vp_operations_portal.mjs
// Automated verification suite for AVISHKAR-v2 Vice President Operations Portal:
// 1. Event Readiness Tracker & Mandatory Item Gating
// 2. Advanced Task Assignment, Subtasks, Reassignment & Circular Dependency Detection
// 3. Operational Blockers, Resolution Gating & Presidential Escalation
// 4. Notifications & 2-Hour De-duplication
// 5. Strict Role Boundaries & Integrity Checks

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

let memberCookie = "";
let vpCookie = "";
let presidentCookie = "";
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
  console.log("AVISHKAR 2026 — Vice President Operations Management Portal Verification Suite");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Authenticate all roles
  // ---------------------------------------------------------------------------
  console.log("[1/6] Authenticating council accounts...");

  // VP login
  const vpRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vp@gdgoenka.ac.in", password: "VP@2026" }),
  });
  assert(vpRes.ok, "Vice President login succeeds (200)");
  vpCookie = await extractCookie(vpRes);

  const vpMe = await fetch(`${BASE_URL}/api/admin/auth/me`, {
    headers: { Cookie: vpCookie },
  });
  const vpMeData = await vpMe.json();
  assert(vpMeData.user.role === "AVISHKAR Vice President", "VP role verified");

  // President login
  const pRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "president@gdgoenka.ac.in", password: "President@2026" }),
  });
  assert(pRes.ok, "President login succeeds (200)");
  presidentCookie = await extractCookie(pRes);

  // Member login
  const mRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "member@gdgoenka.ac.in", password: "Member@2026" }),
  });
  assert(mRes.ok, "Member login succeeds (200)");
  memberCookie = await extractCookie(mRes);

  // Admin login
  const aRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gdgoenka.ac.in", password: "Admin@2026" }),
  });
  assert(aRes.ok, "Admin login succeeds (200)");
  adminCookie = await extractCookie(aRes);

  // ---------------------------------------------------------------------------
  // STEP 2: Event Readiness Tracker & Mandatory Item Gating
  // ---------------------------------------------------------------------------
  console.log("\n[2/6] Verifying Event Readiness Tracker & Mandatory Item Gating...");

  // Query readiness for evt-001
  const readRes = await fetch(`${BASE_URL}/api/admin/readiness?eventId=evt-001`, {
    headers: { Cookie: vpCookie },
  });
  assert(readRes.ok, "VP can query event readiness for evt-001");
  const readData = await readRes.json();
  assert(Array.isArray(readData.items), "Readiness items returned as an array");
  assert(readData.summary && typeof readData.summary.percentage === "number", "Readiness summary percentage returned");
  console.log(`    Current readiness percentage: ${readData.summary.percentage}% (Completed: ${readData.summary.completedCount}/${readData.summary.totalCount}, Mandatory Incomplete: ${readData.summary.mandatoryIncomplete})`);

  // Add a new mandatory checklist item to evt-001
  const createItemRes = await fetch(`${BASE_URL}/api/admin/readiness`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: "evt-001",
      category: "venue",
      title: "Audio Mixer & Podium Mic Soundcheck",
      description: "Verify primary and backup microphone feeds to the main amplifier",
      isMandatory: true,
      status: "pending",
      assignedMemberName: "Aarav Sharma",
      assignedMemberEmail: "aarav.sharma@gdgoenka.ac.in",
      deadline: "2026-11-09T18:00:00Z",
    }),
  });
  assert(createItemRes.ok, "VP can add a new readiness checklist item");
  const newItem = await createItemRes.json();
  assert(newItem.isMandatory === true, "New checklist item is flagged as mandatory");

  // Attempt to transition event coordination status to 'coordination_ready' while mandatory items are incomplete
  const failCoordRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: "evt-001",
      coordinationStatus: "coordination_ready",
    }),
  });
  assert(failCoordRes.status === 400, "Event cannot be marked coordination_ready with incomplete mandatory items (HTTP 400)");
  const failCoordData = await failCoordRes.json();
  assert(failCoordData.error && failCoordData.error.includes("mandatory readiness checklist"), "Detailed mandatory item failure error returned");
  console.log(`    Validation message: "${failCoordData.error}"`);

  // Mark all mandatory items for evt-001 complete
  const itemsToComplete = readData.items.concat([newItem]).filter((i) => i.isMandatory);
  for (const item of itemsToComplete) {
    const patchRes = await fetch(`${BASE_URL}/api/admin/readiness`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: vpCookie },
      body: JSON.stringify({
        id: item.id,
        status: "completed",
        notes: "Verified and soundcheck completed by VP operations inspection team.",
      }),
    });
    assert(patchRes.ok, `Marked mandatory item ${item.id} (${item.title}) as completed`);
  }

  // Verify updated summary
  const readRes2 = await fetch(`${BASE_URL}/api/admin/readiness?eventId=evt-001`, {
    headers: { Cookie: vpCookie },
  });
  const readData2 = await readRes2.json();
  assert(readData2.summary.mandatoryIncomplete === 0, "All mandatory items are verified completed (mandatoryIncomplete === 0)");

  // Now transition event coordination status to 'coordination_ready' -> should succeed!
  const successCoordRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: "evt-001",
      coordinationStatus: "coordination_ready",
      coordinationNotes: "All operational prerequisites and equipment verified by VP.",
    }),
  });
  assert(successCoordRes.ok, "Event successfully marked coordination_ready once mandatory items are satisfied (HTTP 200)");

  // ---------------------------------------------------------------------------
  // STEP 3: Advanced Task Assignment, Subtasks, Reassignment & Cycle Detection
  // ---------------------------------------------------------------------------
  console.log("\n[3/6] Verifying Task Assignment, Subtasks, Reassignment & Cycle Detection...");

  // Create Task Alpha (prerequisite)
  const taskAlphaRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      title: "Stage Rigging & Safety Inspection",
      description: "Perform structural check of the stage truss and lighting rigs",
      category: "Logistics",
      priority: "critical",
      dueDate: "2026-11-08",
      dueTime: "11:00",
      assignedMemberId: "mem-001",
      assignedMemberName: "Aarav Sharma",
      assignedMemberEmail: "aarav.sharma@gdgoenka.ac.in",
      eventId: "evt-001",
      subtasks: [
        { id: "sub-1", title: "Truss structural bolts torqued", isCompleted: false },
        { id: "sub-2", title: "Safety cables anchored", isCompleted: false },
      ],
      completionCriteria: "Safety inspector signoff certificate uploaded",
    }),
  });
  assert(taskAlphaRes.ok, "VP created Task Alpha (priority: critical, with 2 subtasks)");
  const taskAlpha = await taskAlphaRes.json();
  assert(taskAlpha.priority === "critical", "Task Alpha has priority 'critical'");
  assert(taskAlpha.subtasks.length === 2, "Task Alpha has 2 subtasks");

  // Create Task Beta (depends on Task Alpha)
  const taskBetaRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      title: "Audio Mixer Console Hookup",
      description: "Connect multi-channel sound desk once stage rigging is secure",
      category: "Technical",
      priority: "high",
      dueDate: "2026-11-08",
      dueTime: "14:00",
      assignedMemberId: "mem-001",
      assignedMemberName: "Aarav Sharma",
      assignedMemberEmail: "aarav.sharma@gdgoenka.ac.in",
      eventId: "evt-001",
      dependsOnTaskIds: [taskAlpha.id],
      subtasks: [],
    }),
  });
  assert(taskBetaRes.ok, "VP created Task Beta depending on Task Alpha");
  const taskBeta = await taskBetaRes.json();
  assert(taskBeta.dependsOnTaskIds.includes(taskAlpha.id), "Task Beta records dependency on Task Alpha");

  // Attempt to complete Task Beta while Task Alpha is still pending
  const failBetaComplete = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: taskBeta.id,
      status: "completed",
      completionNotes: "Tried to complete early",
    }),
  });
  assert(failBetaComplete.status === 400, "Task Beta cannot be completed while prerequisite Task Alpha is pending (HTTP 400)");
  const failBetaData = await failBetaComplete.json();
  assert(failBetaData.error && failBetaData.error.includes("Prerequisite"), "Prerequisite completion error message returned");
  console.log(`    Validation message: "${failBetaData.error}"`);

  // Test Circular Dependency Detection:
  // Try to update Task Alpha so it depends on Task Beta (creates Alpha -> Beta -> Alpha cycle!)
  const failCycleRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: taskAlpha.id,
      dependsOnTaskIds: [taskBeta.id],
    }),
  });
  assert(failCycleRes.status === 400, "Circular task dependency is rejected (HTTP 400)");
  const failCycleData = await failCycleRes.json();
  assert(failCycleData.error && failCycleData.error.toLowerCase().includes("circular"), "Circular dependency rejected with descriptive error");
  console.log(`    Cycle detection response: "${failCycleData.error}"`);

  // Reassign Task Alpha to another member with audit reason
  const reassignRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: taskAlpha.id,
      assignedMemberId: "mem-002",
      reassignmentReason: "Aarav assigned to morning registration desk; Diya taking over rigging duties.",
    }),
  });
  assert(reassignRes.ok, "VP successfully reassigned Task Alpha with audit reason");
  const reassignedTask = await reassignRes.json();
  assert(reassignedTask.assignedMemberId === "mem-002", "Task assigned to Diya Patel (mem-002)");
  assert(Array.isArray(reassignedTask.reassignmentHistory) && reassignedTask.reassignmentHistory.length > 0, "Reassignment history entry recorded");
  assert(reassignedTask.reassignmentHistory[0].reason.includes("Diya taking over"), "Audit reason captured in history");

  // Complete subtasks on Task Alpha
  const updatedSubtasks = reassignedTask.subtasks.map((s) => ({ ...s, isCompleted: true }));
  const patchSubtasksRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: taskAlpha.id,
      subtasks: updatedSubtasks,
    }),
  });
  assert(patchSubtasksRes.ok, "Task Alpha subtasks updated to completed");

  // Complete Task Alpha
  const completeAlphaRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: taskAlpha.id,
      status: "completed",
      completionNotes: "All truss pins safety checked and signed off.",
      completionEvidenceUrl: "https://drive.google.com/safety-cert-001.pdf",
    }),
  });
  assert(completeAlphaRes.ok, "Task Alpha successfully marked completed");

  // Now complete Task Beta -> should succeed since Task Alpha is now completed
  const completeBetaRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: taskBeta.id,
      status: "completed",
      completionNotes: "Sound desk connected and tested with stage lines.",
    }),
  });
  assert(completeBetaRes.ok, "Task Beta successfully completed now that prerequisite is satisfied");

  // ---------------------------------------------------------------------------
  // STEP 4: Operational Blockers, Resolution Gating & Presidential Escalation
  // ---------------------------------------------------------------------------
  console.log("\n[4/6] Verifying Operational Blockers, Resolution Gating & Escalation...");

  // Member reports an operational blocker
  const createBlockerRes = await fetch(`${BASE_URL}/api/admin/blockers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      title: "Main Stage LED Wall HDMI Matrix Unit Faulty",
      description: "Port 3 and 4 have sync flickering on the video processor",
      severity: "critical",
      category: "equipment",
      eventId: "evt-001",
      eventName: "Hack-a-Sol: 24h Innovation Hackathon",
      impactAssessment: "Opening keynote presentations cannot display multi-input split video feeds",
    }),
  });
  assert(createBlockerRes.ok, "Member can report an operational blocker");
  const blocker = await createBlockerRes.json();
  assert(blocker.severity === "critical", "Blocker severity is critical");
  assert(blocker.status === "open", "Blocker initial status is open");

  // Member attempts to escalate directly to President -> Must be FORBIDDEN (403)
  const memberEscalateRes = await fetch(`${BASE_URL}/api/admin/blockers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      id: blocker.id,
      escalateTo: "President",
      escalationReason: "Direct escalation attempt without VP clearance",
    }),
  });
  assert(memberEscalateRes.status === 403, "Direct escalation to President by non-VP member is strictly forbidden (HTTP 403)");

  // Attempt to resolve blocker without providing resolution notes
  const failResolveRes = await fetch(`${BASE_URL}/api/admin/blockers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: blocker.id,
      status: "resolved",
    }),
  });
  assert(failResolveRes.status === 400, "Resolving blocker requires resolution notes (HTTP 400)");
  const failResolveData = await failResolveRes.json();
  assert(failResolveData.error && failResolveData.error.includes("Resolution notes are required"), "Descriptive resolution notes error returned");

  // VP escalates the blocker to President with required reason
  const vpEscalateRes = await fetch(`${BASE_URL}/api/admin/blockers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: blocker.id,
      escalateTo: "President",
      escalationReason: "Requires emergency equipment rental authorization from council contingency budget.",
    }),
  });
  assert(vpEscalateRes.ok, "VP successfully escalates blocker to President with reason");
  const escalatedBlocker = await vpEscalateRes.json();
  assert(escalatedBlocker.status === "escalated", "Blocker status is 'escalated'");
  assert(escalatedBlocker.escalatedTo === "President", "Blocker recorded escalated to President");
  assert(escalatedBlocker.escalationReason.includes("emergency equipment rental"), "Escalation reason saved");

  // President reviews and resolves the blocker with resolution notes
  const presResolveRes = await fetch(`${BASE_URL}/api/admin/blockers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentCookie },
    body: JSON.stringify({
      id: blocker.id,
      status: "resolved",
      resolutionNotes: "Contingency release authorized. Secondary Roland 4K HDMI matrix unit dispatched from AV vendor.",
    }),
  });
  assert(presResolveRes.ok, "President successfully resolves escalated blocker with notes");
  const resolvedBlocker = await presResolveRes.json();
  assert(resolvedBlocker.status === "resolved", "Blocker status updated to 'resolved'");
  assert(Boolean(resolvedBlocker.resolvedAt), "Blocker has resolvedAt timestamp");
  assert(resolvedBlocker.resolutionNotes.includes("Secondary Roland"), "Resolution notes recorded");

  // ---------------------------------------------------------------------------
  // STEP 5: Notification Center & De-duplication
  // ---------------------------------------------------------------------------
  console.log("\n[5/6] Verifying Notification Center & 2-Hour De-duplication...");

  // Query notifications for VP
  const notifRes = await fetch(`${BASE_URL}/api/admin/notifications`, {
    headers: { Cookie: vpCookie },
  });
  assert(notifRes.ok, "VP can fetch notifications");
  const notifData = await notifRes.json();
  assert(Array.isArray(notifData.notifications), "Notifications returned as an array");
  console.log(`    Total notifications: ${notifData.notifications.length}, Unread: ${notifData.unreadCount}`);

  // Trigger two identical notifications via data store / API within 2 hours
  const notif1Res = await fetch(`${BASE_URL}/api/admin/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      recipientEmail: "vp@gdgoenka.ac.in",
      type: "blocker",
      title: "Vendor Dispatch Confirmation",
      message: "The audio vendor confirmed shipment of backup gear.",
      link: "/admin/vice-president",
    }),
  });
  assert(notif1Res.ok, "First notification created");
  const n1 = await notif1Res.json();

  // Second notification with identical recipient, type, and title
  const notif2Res = await fetch(`${BASE_URL}/api/admin/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      recipientEmail: "vp@gdgoenka.ac.in",
      type: "blocker",
      title: "Vendor Dispatch Confirmation",
      message: "Duplicate call within 2h window",
      link: "/admin/vice-president",
    }),
  });
  assert(notif2Res.ok, "Second notification request handled");
  const n2 = await notif2Res.json();
  assert(n1.id === n2.id, "Second notification was successfully de-duplicated into original notification ID within 2 hours!");

  // Mark notification read
  const markReadRes = await fetch(`${BASE_URL}/api/admin/notifications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      id: n1.id,
      read: true,
    }),
  });
  assert(markReadRes.ok, "Notification marked as read");

  // ---------------------------------------------------------------------------
  // STEP 6: Role Boundaries & Integrity Checks
  // ---------------------------------------------------------------------------
  console.log("\n[6/6] Verifying Role Boundaries & Operational Integrity...");

  // VP cannot publish event to live public site (only Admin role can publish)
  const vpPublishRes = await fetch(`${BASE_URL}/api/admin/events/evt-001/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({ isPublished: true }),
  });
  assert(vpPublishRes.status === 403, "VP cannot directly publish events to public site (HTTP 403 - reserved for Admin)");

  // Member cannot coordinate events
  const memberCoordRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      id: "evt-001",
      coordinationStatus: "coordination_in_progress",
    }),
  });
  assert(memberCoordRes.status === 403, "Regular members cannot modify event coordinationStatus (HTTP 403)");

  // President can review and approve proposals without operational conflict
  const presReviewRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: presidentCookie },
  });
  assert(presReviewRes.ok, "President can view full event coordination and approval boards");

  console.log("\n================================================================================");
  console.log("🎉 ALL 6 TEST SUITE PHASES PASSED WITH ZERO FAILURES!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
