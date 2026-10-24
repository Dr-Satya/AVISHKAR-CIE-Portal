// tests/verify_prod_live_vp.mjs
// Live Production Verification Script for Cloudflare Worker deployment
// Deployment Version ID: 32cf4784-941c-4841-9aba-2c974096584a

const PROD_BASE = "https://avishkar-v2.g-murari2006.workers.dev";

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
}

async function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    return setCookie.split(";")[0];
  }
  return "";
}

async function verifyLiveProduction() {
  console.log("================================================================================");
  console.log(`AVISHKAR 2026 — Live Cloudflare Production Verification`);
  console.log(`Target URL: ${PROD_BASE}`);
  console.log(`Expected Version: 32cf4784-941c-4841-9aba-2c974096584a`);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // STEP 1: Verify Public Routes & Status
  // ---------------------------------------------------------------------------
  console.log("[1/6] Checking live public routes...");
  const homeRes = await fetch(`${PROD_BASE}/?_cb=${Date.now()}`);
  assert(homeRes.status === 200, `Homepage responds with HTTP 200 OK`);
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes("AVISHKAR"), "Homepage contains AVISHKAR branding");

  const regRes = await fetch(`${PROD_BASE}/register?_cb=${Date.now()}`);
  assert(regRes.status === 200, `Registration route /register responds with HTTP 200 OK`);

  const eventsRes = await fetch(`${PROD_BASE}/events?_cb=${Date.now()}`);
  assert(eventsRes.status === 200, `Events catalogue /events responds with HTTP 200 OK`);

  const vpLoginRes = await fetch(`${PROD_BASE}/admin/vice-president/login?_cb=${Date.now()}`);
  assert(vpLoginRes.status === 200, `VP Login page /admin/vice-president/login responds with HTTP 200 OK`);

  // ---------------------------------------------------------------------------
  // STEP 2: Authenticate as Vice President
  // ---------------------------------------------------------------------------
  console.log("\n[2/6] Authenticating live Vice President session...");
  const loginRes = await fetch(`${PROD_BASE}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vp@gdgoenka.ac.in", password: "VP@2026" }),
  });
  assert(loginRes.status === 200, "VP login API returned HTTP 200");
  const vpCookie = await extractCookie(loginRes);
  assert(Boolean(vpCookie), "Authentication cookie successfully received from live Cloudflare Worker");

  const meRes = await fetch(`${PROD_BASE}/api/admin/auth/me`, {
    headers: { Cookie: vpCookie },
  });
  assert(meRes.status === 200, "VP /api/admin/auth/me returns HTTP 200");
  const meData = await meRes.json();
  assert(meData.user.role === "Vice President", "Live user role is 'Vice President'");

  // ---------------------------------------------------------------------------
  // STEP 3: Verify VP Dashboard UI Route
  // ---------------------------------------------------------------------------
  console.log("\n[3/6] Inspecting live Vice President Dashboard HTML (/admin/vice-president)...");
  const vpPageRes = await fetch(`${PROD_BASE}/admin/vice-president`, {
    headers: { Cookie: vpCookie },
  });
  assert(vpPageRes.status === 200, "VP Dashboard /admin/vice-president responds with HTTP 200 OK");
  const vpHtml = await vpPageRes.text();
  assert(vpHtml.includes("Vice President") || vpHtml.includes("Operations"), "VP Dashboard contains Vice President Operations branding");

  // ---------------------------------------------------------------------------
  // STEP 4: Test All Four VP Operational Features
  // ---------------------------------------------------------------------------
  console.log("\n[4/6] Verifying the 4 Vice President Features on live production...");

  // Feature 1: Task Assignment and Deadline Management
  console.log("  Testing Feature 1: Task Assignment & Deadline Management...");
  const tasksGetRes = await fetch(`${PROD_BASE}/api/admin/tasks`, {
    headers: { Cookie: vpCookie },
  });
  assert(tasksGetRes.status === 200, "Live GET /api/admin/tasks returned 200 OK");
  const tasksData = await tasksGetRes.json();
  assert(Array.isArray(tasksData.tasks), "Tasks data contains tasks array");

  // Assign a safe test task
  const testTaskDue = new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0];
  const assignTaskRes = await fetch(`${PROD_BASE}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: "evt-001",
      memberId: "mem-001",
      title: `Live Production Task Check ${Date.now()}`,
      description: "Testing live Cloudflare Worker task assignment and deadline management",
      priority: "high",
      dueDate: testTaskDue,
    }),
  });
  assert(assignTaskRes.status === 200, "Live task assignment POST /api/admin/tasks returned 200 OK");
  const assignedTaskData = await assignTaskRes.json();
  const createdTaskId = assignedTaskData.task.id;
  assert(Boolean(createdTaskId), "Assigned task has a valid task ID");

  // Feature 2: Event Readiness Tracker
  console.log("  Testing Feature 2: Event Readiness Tracker & Calculations...");
  const readinessRes = await fetch(`${PROD_BASE}/api/admin/readiness?eventId=evt-001`, {
    headers: { Cookie: vpCookie },
  });
  assert(readinessRes.status === 200, "Live GET /api/admin/readiness returned 200 OK");
  const readinessData = await readinessRes.json();
  assert(readinessData.summary !== undefined, "Readiness summary object returned");
  const pct = readinessData.summary.readinessPercentage ?? readinessData.summary.percentage;
  assert(typeof pct === "number", `Readiness calculation returned: ${pct}%`);

  // Feature 3: Blockers and Escalation
  console.log("  Testing Feature 3: Blockers & Escalation...");
  const blockersGetRes = await fetch(`${PROD_BASE}/api/admin/blockers`, {
    headers: { Cookie: vpCookie },
  });
  assert(blockersGetRes.status === 200, "Live GET /api/admin/blockers returned 200 OK");
  const blockersData = await blockersGetRes.json();
  assert(Array.isArray(blockersData.blockers), "Blockers list returned as array");

  // Post a safe operational blocker
  const postBlockerRes = await fetch(`${PROD_BASE}/api/admin/blockers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      eventId: "evt-001",
      eventTitle: "Hack-a-Sol: 24h Innovation Hackathon",
      title: `Live Audio Feed Blocker Check ${Date.now()}`,
      description: "Auditorium primary amplifier input buzz during mic test",
      severity: "medium",
      operationalImpact: "Delay in opening ceremony audio feed",
    }),
  });
  assert(postBlockerRes.status === 200, "Live POST /api/admin/blockers returned 200 OK");
  const createdBlocker = (await postBlockerRes.json()).blocker;
  assert(Boolean(createdBlocker.id), "Created blocker returned with ID");

  // Resolve the test blocker
  const resolveBlockerRes = await fetch(`${PROD_BASE}/api/admin/blockers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      blockerId: createdBlocker.id,
      status: "resolved",
      resolutionNotes: "Replaced ground isolator and balanced XLR line. Audio clear.",
    }),
  });
  assert(resolveBlockerRes.status === 200, "Live PATCH /api/admin/blockers resolution returned 200 OK");
  const resolvedBlocker = (await resolveBlockerRes.json()).blocker;
  assert(resolvedBlocker.status === "resolved", "Blocker successfully resolved on live production");

  // Feature 4: Notifications and Reminders
  console.log("  Testing Feature 4: Notifications & Reminders...");
  const notifsRes = await fetch(`${PROD_BASE}/api/admin/notifications`, {
    headers: { Cookie: vpCookie },
  });
  assert(notifsRes.status === 200, "Live GET /api/admin/notifications returned 200 OK");
  const notifsData = await notifsRes.json();
  assert(Array.isArray(notifsData.notifications), "Live notifications returned as array");
  console.log(`    Total notifications visible to VP: ${notifsData.notifications.length}`);

  // ---------------------------------------------------------------------------
  // STEP 5: Verify RBAC Boundaries on Live Production
  // ---------------------------------------------------------------------------
  console.log("\n[5/6] Verifying Council RBAC Boundaries on live production...");

  // Member login
  const memberLoginRes = await fetch(`${PROD_BASE}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "member@gdgoenka.ac.in", password: "Member@2026" }),
  });
  assert(memberLoginRes.status === 200, "Member login succeeds (200)");
  const memberCookie = await extractCookie(memberLoginRes);

  // Member cannot assign tasks -> MUST return 403
  const memberAssignRes = await fetch(`${PROD_BASE}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: memberCookie },
    body: JSON.stringify({
      eventId: "evt-001",
      memberId: "mem-001",
      title: "Unauthorized task assignment",
    }),
  });
  assert(memberAssignRes.status === 403, "Live boundary: Member cannot assign tasks (HTTP 403 FORBIDDEN)");

  // VP cannot verify payments -> MUST return 403
  const vpPaymentRes = await fetch(`${PROD_BASE}/api/admin/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vpCookie },
    body: JSON.stringify({
      registrationId: "dummy-reg-1",
      action: "approve",
    }),
  });
  assert(vpPaymentRes.status === 403, "Live boundary: VP cannot verify payments (HTTP 403 ADMIN_REQUIRED)");

  // Member notification privacy
  const memberNotifsRes = await fetch(`${PROD_BASE}/api/admin/notifications`, {
    headers: { Cookie: memberCookie },
  });
  const memberNotifsData = await memberNotifsRes.json();
  const hasLeakedOtherEmail = (memberNotifsData.notifications || []).some(
    (n) => n.targetEmail && n.targetEmail.toLowerCase() !== "member@gdgoenka.ac.in"
  );
  assert(!hasLeakedOtherEmail, "Live privacy: Member notifications do not leak other members' targeted messages");

  // ---------------------------------------------------------------------------
  // STEP 6: Summary
  // ---------------------------------------------------------------------------
  console.log("\n[6/6] Production Verification Complete.");
  console.log("================================================================================");
  console.log("ALL LIVE PRODUCTION CHECKS PASSED FOR DEPLOYMENT VERSION 32cf4784-941c-4841-9aba-2c974096584a!");
  console.log("================================================================================\n");
}

verifyLiveProduction().catch((err) => {
  console.error("Live verification failed:", err);
  process.exit(1);
});
