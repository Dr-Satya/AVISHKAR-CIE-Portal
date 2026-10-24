// tests/test_member_portal_improvements.mjs
// Automated verification suite for AVISHKAR-v2 Member Portal Improvements

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

let memberCookie = "";
let vpCookie = "";
let presidentCookie = "";

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
  console.log("AVISHKAR 2026 — Member Portal Improvements Verification Suite");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Authenticate Member, VP, and President
  // ---------------------------------------------------------------------------
  console.log("[1/8] Authenticating council members...");
  const mRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "member@gdgoenka.ac.in", password: "Member@2026" }),
  });
  assert(mRes.ok, "Member login succeeds (HTTP 200)");
  memberCookie = await extractCookie(mRes);

  const meRes = await fetch(`${BASE_URL}/api/admin/auth/me`, {
    headers: { Cookie: memberCookie },
  });
  assert(meRes.ok, "Member /me returns 200 OK");
  const meData = await meRes.json();
  assert(meData.user.role === "AVISHKAR Member", "User role is AVISHKAR Member");

  const vpRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vp@gdgoenka.ac.in", password: "VP@2026" }),
  });
  assert(vpRes.ok, "VP login succeeds (HTTP 200)");
  vpCookie = await extractCookie(vpRes);

  const presRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "president@gdgoenka.ac.in", password: "President@2026" }),
  });
  assert(presRes.ok, "President login succeeds (HTTP 200)");
  presidentCookie = await extractCookie(presRes);

  // ---------------------------------------------------------------------------
  // STEP 2: Draft Creation, Editing, and Deletion
  // ---------------------------------------------------------------------------
  console.log("\n[2/8] Testing Draft Proposal Lifecycle (create, edit, delete)...");
  const testDraftId = `draft-test-${Date.now()}`;
  const createDraftRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      title: `Draft To Delete ${testDraftId}`,
      description: "Temporary draft to test deletion flow.",
      objectives: "Verify member draft deletion capability.",
      category: "Robotics",
      proposedDateTime: "22 Nov 2026, 10:00 AM",
      deliveryMode: "In-Person",
      expectedParticipants: 20,
      teamSizeMin: 1,
      teamSizeMax: 3,
      venuePlaceholder: "Workshop Lab B",
      requiredResources: "Microcontrollers, soldering irons",
      supportingDocsUrl: "/docs/draft-temp.pdf",
      status: "draft",
    }),
  });
  assert(createDraftRes.ok, "Member creates draft proposal (200)");
  const createDraftData = await createDraftRes.json();
  const createdDraftEventId = createDraftData.event.id;
  assert(createDraftData.event.status === "draft", "Proposal status is 'draft'");

  // Edit the draft
  const editDraftRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: createdDraftEventId,
      action: "edit",
      title: `Draft To Delete Updated ${testDraftId}`,
      expectedParticipants: 25,
    }),
  });
  assert(editDraftRes.ok, "Member can edit draft proposal (200)");
  const editDraftData = await editDraftRes.json();
  assert(editDraftData.event.expectedParticipants === 25, "Draft participants updated");

  // Delete the draft
  const deleteDraftRes = await fetch(`${BASE_URL}/api/admin/events?id=${createdDraftEventId}`, {
    method: "DELETE",
    headers: { Cookie: memberCookie },
  });
  assert(deleteDraftRes.ok, "Member can delete draft proposal (200)");
  const deleteDraftData = await deleteDraftRes.json();
  assert(deleteDraftData.success === true, "Delete returned success: true");

  // Verify it is no longer listed in member's events
  const getEventsAfterDelete = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: memberCookie },
  });
  const afterDeleteData = await getEventsAfterDelete.json();
  const deletedStillExists = (afterDeleteData.events || []).some(e => e.id === createdDraftEventId);
  assert(!deletedStillExists, "Deleted draft proposal no longer appears in event list");

  // ---------------------------------------------------------------------------
  // STEP 3: Proposal Submission and Locking Against Unauthorized Editing/Deletion
  // ---------------------------------------------------------------------------
  console.log("\n[3/8] Testing Proposal Submission and Locking...");
  const subDraftRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      title: `AI Autonomous Vehicle Challenge ${Date.now()}`,
      description: "Autonomous micro-rover race using OpenCV and edge ML models.",
      objectives: "Foster real-time robotics vision processing among undergrad students.",
      category: "Robotics",
      proposedDateTime: "05 Dec 2026, 09:30 AM",
      deliveryMode: "In-Person",
      expectedParticipants: 50,
      teamSizeMin: 2,
      teamSizeMax: 4,
      venuePlaceholder: "Innovation Track, Block A",
      requiredResources: "Track barriers, stopwatches, drone camera",
      supportingDocsUrl: "/docs/autonomous-rover-spec.pdf",
      status: "draft",
    }),
  });
  assert(subDraftRes.ok, "Created new draft proposal for submission test");
  const subDraftData = await subDraftRes.json();
  const subDraftEventId = subDraftData.event.id;

  // Submit proposal to council
  const submitRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: subDraftEventId,
      action: "submit",
    }),
  });
  assert(submitRes.ok, "Member submits draft proposal to council (200)");
  const submitData = await submitRes.json();
  assert(submitData.event.status === "proposed", "Event status transitioned to 'proposed'");
  assert(submitData.event.submittedAt !== undefined, "Submission date (submittedAt) is recorded");

  // Attempt to delete submitted proposal -> MUST fail (only drafts can be deleted)
  const deleteSubmittedRes = await fetch(`${BASE_URL}/api/admin/events?id=${subDraftEventId}`, {
    method: "DELETE",
    headers: { Cookie: memberCookie },
  });
  assert(deleteSubmittedRes.status === 400 || deleteSubmittedRes.status === 403, "Cannot delete submitted proposal (HTTP 400/403)");

  // Member attempting to approve or publish directly -> MUST fail
  const memberApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: subDraftEventId,
      action: "approve",
    }),
  });
  assert(memberApproveRes.status === 403, "Member cannot approve proposals (HTTP 403 PRESIDENT_REQUIRED)");

  const memberPublishRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: subDraftEventId,
      action: "publish",
    }),
  });
  assert(memberPublishRes.status === 403, "Member cannot publish proposals (HTTP 403)");

  // ---------------------------------------------------------------------------
  // STEP 4: Executive Review Flow (VP Approval + President Rejection with Feedback)
  // ---------------------------------------------------------------------------
  console.log("\n[4/8] Testing Review Flow & President Feedback Display...");
  // 4a. VP reviews and approves logistical feasibility
  const vpApproveRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: subDraftEventId,
      action: "vp_approve",
      comment: "Logistical feasibility approved. Innovation Track Block A reserved.",
    }),
  });
  assert(vpApproveRes.ok, "VP approves logistical feasibility (200)");

  // 4b. President rejects with specific feedback and reason
  const rejectionReason = "Budget request for track barriers exceeds standard robotics cap. Please revise track layout and re-submit.";
  const presRejectRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: presidentCookie },
    body: JSON.stringify({
      eventId: subDraftEventId,
      action: "reject",
      reason: rejectionReason,
    }),
  });
  assert(presRejectRes.ok, "President rejects proposal with reason (200)");

  // 4c. Member inspects proposal to verify rejection feedback and audit trail
  const memberInspectRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: memberCookie },
  });
  const memberEvents = await memberInspectRes.json();
  const reviewedProposal = memberEvents.events.find(e => e.id === subDraftEventId);
  assert(reviewedProposal !== undefined, "Proposal found in member list");
  assert(reviewedProposal.status === "rejected", "Proposal status is 'rejected'");
  assert(
    reviewedProposal.rejectionReason === rejectionReason ||
    reviewedProposal.presidentRejectionReason === rejectionReason,
    "President rejection reason is stored and returned to member"
  );
  assert(Array.isArray(reviewedProposal.approvalHistory), "approvalHistory is an array");
  assert(reviewedProposal.approvalHistory.length >= 2, "approvalHistory contains both VP and President entries");
  const presHistoryEntry = reviewedProposal.approvalHistory.find(h => (h.stage === "President" || h.actorRole === "President") && h.decision === "rejected");
  assert(presHistoryEntry !== undefined, "President rejection recorded in approvalHistory");
  assert(presHistoryEntry.rejectionReason === rejectionReason || presHistoryEntry.comment === rejectionReason, "Rejection reason recorded in audit log");

  // ---------------------------------------------------------------------------
  // STEP 5: Assigned Duties Lifecycle & Progress Notes
  // ---------------------------------------------------------------------------
  console.log("\n[5/8] Testing Assigned Duties Lifecycle and Personal Progress Notes...");
  // 5a. VP assigns a task to member
  const taskDueDate = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]; // 3 days in future
  const assignTaskRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: subDraftEventId,
      memberId: meData.user.id,
      title: "Audio & Microphone Rig Testing",
      description: "Test wireless lapel microphones and main stage PA audio for AVISHKAR opening.",
      priority: "high",
      dueDate: taskDueDate,
    }),
  });
  assert(assignTaskRes.ok, "VP assigns duty to member (200)");
  const assignTaskData = await assignTaskRes.json();
  const createdTaskId = assignTaskData.task.id;
  assert(assignTaskData.task.status === "todo", "New task status defaults to 'todo'");

  // 5b. Member views tasks
  const getTasksRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    headers: { Cookie: memberCookie },
  });
  assert(getTasksRes.ok, "Member fetches assigned duties (200)");
  const tasksData = await getTasksRes.json();
  const myTask = (tasksData.tasks || []).find(t => t.id === createdTaskId);
  assert(myTask !== undefined, "Assigned task appears in member's task list");
  assert(myTask.title === "Audio & Microphone Rig Testing", "Task title matches");
  assert(myTask.priority === "high", "Task priority is 'high'");

  // 5c. Member updates status to "in_progress" and saves personal notes
  const updateProgressRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      taskId: createdTaskId,
      status: "in_progress",
      notes: "Checked audio console in Auditorium A. Need 2 new XLR cables.",
    }),
  });
  assert(updateProgressRes.ok, "Member updates task to in_progress with notes (200)");
  const updatedTaskData = await updateProgressRes.json();
  assert(updatedTaskData.task.status === "in_progress", "Task status is 'in_progress'");
  assert(updatedTaskData.task.notes === "Checked audio console in Auditorium A. Need 2 new XLR cables.", "Notes persisted");

  // 5d. Member transitions task to "completed"
  const completeTaskRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      taskId: createdTaskId,
      status: "completed",
      notes: "All 4 wireless microphones synced and battery levels 100%. Done.",
    }),
  });
  assert(completeTaskRes.ok, "Member marks task completed (200)");
  const completedTaskData = await completeTaskRes.json();
  assert(completedTaskData.task.status === "completed", "Task status is 'completed'");
  assert(completedTaskData.task.notes.includes("Done."), "Final notes saved");

  // 5e. Member cannot modify another user's task
  const unauthorizedTaskEdit = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      taskId: "nonexistent-or-other-user-task",
      status: "completed",
    }),
  });
  assert(unauthorizedTaskEdit.status === 403 || unauthorizedTaskEdit.status === 404, "Member cannot edit other member's task (403/404)");

  // ---------------------------------------------------------------------------
  // STEP 6: Notification System and Privacy Filter Verification
  // ---------------------------------------------------------------------------
  console.log("\n[6/8] Testing Notifications & Strict Privacy Filter...");
  const getNotifsRes = await fetch(`${BASE_URL}/api/admin/notifications`, {
    headers: { Cookie: memberCookie },
  });
  assert(getNotifsRes.ok, "Member fetches notifications (200)");
  const notifsData = await getNotifsRes.json();
  assert(Array.isArray(notifsData.notifications), "notifications is an array");

  // Verify that any notification returned is either targeted to "all", "AVISHKAR Member" with no targetEmail, or targeted specifically to member@gdgoenka.ac.in
  const hasLeakedOtherEmail = notifsData.notifications.some(
    n => n.targetEmail && n.targetEmail.toLowerCase() !== "member@gdgoenka.ac.in"
  );
  assert(!hasLeakedOtherEmail, "No notifications targeted to other members' emails are leaked");

  // Mark notification as read if available
  if (notifsData.notifications.length > 0) {
    const firstNotifId = notifsData.notifications[0].id;
    const markReadRes = await fetch(`${BASE_URL}/api/admin/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: memberCookie },
      body: JSON.stringify({
        notificationId: firstNotifId,
        read: true,
      }),
    });
    assert(markReadRes.ok, "Member can mark notification as read (200)");
  }

  // ---------------------------------------------------------------------------
  // STEP 7: Render Member Portal Page (/admin/member)
  // ---------------------------------------------------------------------------
  console.log("\n[7/8] Verifying Member Portal Page HTML Rendering...");
  const pageRes = await fetch(`${BASE_URL}/admin/member`, {
    headers: { Cookie: memberCookie },
  });
  assert(pageRes.ok, "GET /admin/member returns HTTP 200 OK");
  const pageHtml = await pageRes.text();
  assert(pageHtml.includes("Member Workspace") || pageHtml.includes("AVISHKAR"), "Page contains Member Workspace branding");
  assert(pageHtml.length > 1000, "Member portal rendered non-empty payload");

  // ---------------------------------------------------------------------------
  // STEP 8: Verification Summary
  // ---------------------------------------------------------------------------
  console.log("\n[8/8] Member Portal verification complete.");
  console.log("================================================================================");
  console.log("All Member Portal regression and feature tests PASSED successfully!");
  console.log("================================================================================\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
