import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { OperationalBlockerRecord, BlockerSeverity, BlockerStatus } from "@/types/admin";
import {
  getStoredBlockers,
  saveStoredBlocker,
  deleteStoredBlocker,
  getStoredEvents,
  getStoredTasks,
  saveStoredNotification,
} from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId") || undefined;
  const status = searchParams.get("status") || undefined;

  const blockers = getStoredBlockers(eventId, status);

  const stats = {
    total: blockers.length,
    open: blockers.filter((b) => b.status === "open").length,
    inProgress: blockers.filter((b) => b.status === "in_progress").length,
    escalated: blockers.filter((b) => b.status === "escalated").length,
    resolved: blockers.filter((b) => b.status === "resolved").length,
    criticalCount: blockers.filter((b) => b.severity === "critical" && b.status !== "resolved").length,
  };

  return NextResponse.json({
    success: true,
    blockers,
    stats,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      eventId,
      eventTitle,
      taskId,
      taskTitle,
      title,
      description,
      severity = "medium",
      operationalImpact,
      evidenceUrl,
      assignedToId,
      assignedToName,
      assignedToEmail,
      resolutionDeadline,
    } = body;

    if (!eventId || !title || !description || !operationalImpact) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID, issue title, detailed description, and operational impact are required.",
        },
        { status: 400 }
      );
    }

    const events = getStoredEvents();
    const matchedEvent = events.find((e) => e.id === eventId);
    const finalEventTitle = eventTitle || matchedEvent?.title || "Event";

    let finalTaskTitle = taskTitle;
    if (taskId && !finalTaskTitle) {
      const tasks = getStoredTasks();
      const matchedTask = tasks.find((t) => t.id === taskId);
      finalTaskTitle = matchedTask?.title;
    }

    const nowIso = new Date().toISOString();
    const actor = auth.session.user;

    const newBlocker: OperationalBlockerRecord = {
      id: `blk-${Date.now()}`,
      eventId,
      eventTitle: finalEventTitle,
      taskId: taskId || undefined,
      taskTitle: finalTaskTitle || undefined,
      title: title.trim(),
      description: description.trim(),
      severity: (severity as BlockerSeverity) || "medium",
      operationalImpact: operationalImpact.trim(),
      evidenceUrl: evidenceUrl?.trim() || undefined,
      reportedBy: actor.fullName || actor.email,
      reportedByEmail: actor.email,
      reportedByRole: actor.role,
      reportedAt: nowIso,
      assignedToId: assignedToId || undefined,
      assignedToName: assignedToName || undefined,
      assignedToEmail: assignedToEmail || undefined,
      resolutionDeadline: resolutionDeadline || undefined,
      status: "open",
      history: [
        {
          timestamp: nowIso,
          actorName: actor.fullName || actor.email,
          actorRole: actor.role,
          action: "BLOCKER_REPORTED",
          notes: `Issue reported with ${severity.toUpperCase()} severity. Impact: ${operationalImpact.trim()}`,
        },
      ],
    };

    saveStoredBlocker(newBlocker);

    // Notify Vice President
    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title: `Operational Blocker Reported [${newBlocker.severity.toUpperCase()}]`,
      message: `${actor.fullName || actor.role} reported: '${newBlocker.title}' for '${finalEventTitle}'.`,
      type: "blocker",
      targetRole: "Vice President",
      link: "/admin/vice-president",
      read: false,
      createdAt: nowIso,
      actorName: actor.fullName || actor.role,
    });

    // If critical blocker, also notify President directly
    if (newBlocker.severity === "critical") {
      saveStoredNotification({
        id: `notif-${Date.now() + 1}`,
        title: `CRITICAL Operational Alert: ${newBlocker.title}`,
        message: `A critical operational risk was reported for '${finalEventTitle}': ${newBlocker.operationalImpact}`,
        type: "blocker",
        targetRole: "President",
        link: "/admin/president",
        read: false,
        createdAt: nowIso,
        actorName: actor.fullName || actor.role,
      });
    }

    await logAdminAction({
      action: "BLOCKER_REPORTED",
      actor,
      targetType: "operational_blocker",
      targetId: newBlocker.id,
      metadata: { eventId, title: newBlocker.title, severity: newBlocker.severity },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      blocker: newBlocker,
      message: "Operational blocker reported successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error reporting operational blocker";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      blockerId,
      action,
      status,
      resolutionNotes,
      escalationReason,
      assignedToId,
      assignedToName,
      assignedToEmail,
      resolutionDeadline,
      severity,
      description,
      operationalImpact,
    } = body;

    if (!blockerId) {
      return NextResponse.json({ success: false, error: "blockerId is required." }, { status: 400 });
    }

    const blockers = getStoredBlockers();
    const blocker = blockers.find((b) => b.id === blockerId);
    if (!blocker) {
      return NextResponse.json({ success: false, error: "Operational blocker not found." }, { status: 404 });
    }

    const actor = auth.session.user;
    const isMember = actor.role === "AVISHKAR Member";
    const nowIso = new Date().toISOString();

    // 1. ESCALATION WORKFLOW
    if (action === "escalate" || status === "escalated") {
      if (isMember) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Members cannot escalate issues directly to the President." },
          { status: 403 }
        );
      }

      if (!escalationReason || !escalationReason.trim() || escalationReason.trim().length < 5) {
        return NextResponse.json(
          { success: false, error: "A detailed escalation reason (at least 5 characters) is required when escalating to the President." },
          { status: 400 }
        );
      }

      blocker.status = "escalated";
      blocker.escalatedTo = "President";
      blocker.escalatedAt = nowIso;
      blocker.escalatedBy = actor.fullName || actor.email;
      blocker.escalationReason = escalationReason.trim();

      blocker.history.unshift({
        timestamp: nowIso,
        actorName: actor.fullName || actor.email,
        actorRole: actor.role,
        action: "BLOCKER_ESCALATED",
        notes: `Escalated to President: ${escalationReason.trim()}`,
      });

      // Notify the President immediately
      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: `ESCALATION from Vice President: ${blocker.title}`,
        message: `Vice President escalated operational issue for '${blocker.eventTitle}': ${escalationReason.trim()}`,
        type: "blocker",
        targetRole: "President",
        link: "/admin/president",
        read: false,
        createdAt: nowIso,
        actorName: actor.fullName || actor.role,
      });

      saveStoredBlocker(blocker);

      await logAdminAction({
        action: "BLOCKER_ESCALATED",
        actor,
        targetType: "operational_blocker",
        targetId: blocker.id,
        metadata: { eventId: blocker.eventId, title: blocker.title, escalationReason: blocker.escalationReason },
        token: auth.session.token,
      });

      return NextResponse.json({
        success: true,
        blocker,
        message: "Blocker successfully escalated to the President.",
      });
    }

    // 2. RESOLUTION WORKFLOW
    if (action === "resolve" || status === "resolved") {
      if (!resolutionNotes || !resolutionNotes.trim() || resolutionNotes.trim().length < 5) {
        return NextResponse.json(
          { success: false, error: "A comprehensive resolution note (at least 5 characters) is required to close this issue." },
          { status: 400 }
        );
      }

      blocker.status = "resolved";
      blocker.resolutionNotes = resolutionNotes.trim();
      blocker.resolvedAt = nowIso;
      blocker.resolvedBy = actor.fullName || actor.email;

      blocker.history.unshift({
        timestamp: nowIso,
        actorName: actor.fullName || actor.email,
        actorRole: actor.role,
        action: "BLOCKER_RESOLVED",
        notes: `Resolved: ${resolutionNotes.trim()}`,
      });

      // Notify reporter if different from resolver
      if (blocker.reportedByEmail && blocker.reportedByEmail.toLowerCase() !== actor.email.toLowerCase()) {
        saveStoredNotification({
          id: `notif-${Date.now()}`,
          title: `Blocker Resolved: ${blocker.title}`,
          message: `Your reported blocker for '${blocker.eventTitle}' has been resolved by ${actor.fullName || actor.role}.`,
          type: "task",
          targetRole: blocker.reportedByRole as any,
          targetEmail: blocker.reportedByEmail,
          link: "/admin/member",
          read: false,
          createdAt: nowIso,
          actorName: actor.fullName || actor.role,
        });
      }

      saveStoredBlocker(blocker);

      await logAdminAction({
        action: "BLOCKER_RESOLVED",
        actor,
        targetType: "operational_blocker",
        targetId: blocker.id,
        metadata: { eventId: blocker.eventId, title: blocker.title, resolutionNotes: blocker.resolutionNotes },
        token: auth.session.token,
      });

      return NextResponse.json({
        success: true,
        blocker,
        message: "Blocker marked as resolved with resolution notes.",
      });
    }

    // 3. GENERAL UPDATES (assignment, status change to in_progress, deadline)
    if (status) blocker.status = status as BlockerStatus;
    if (assignedToId !== undefined) blocker.assignedToId = assignedToId || undefined;
    if (assignedToName !== undefined) blocker.assignedToName = assignedToName || undefined;
    if (assignedToEmail !== undefined) blocker.assignedToEmail = assignedToEmail || undefined;
    if (resolutionDeadline) blocker.resolutionDeadline = resolutionDeadline;
    if (severity) blocker.severity = severity as BlockerSeverity;
    if (description) blocker.description = description.trim();
    if (operationalImpact) blocker.operationalImpact = operationalImpact.trim();

    blocker.history.unshift({
      timestamp: nowIso,
      actorName: actor.fullName || actor.email,
      actorRole: actor.role,
      action: "BLOCKER_UPDATED",
      notes: `Updated status to ${blocker.status}${assignedToName ? `, assigned to ${assignedToName}` : ""}.`,
    });

    saveStoredBlocker(blocker);

    // If newly assigned, notify assignee
    if (assignedToId && assignedToEmail) {
      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: `Assigned to Resolve Operational Blocker`,
        message: `You were assigned to resolve '${blocker.title}' for '${blocker.eventTitle}'.`,
        type: "task",
        targetEmail: assignedToEmail,
        link: "/admin/vice-president",
        read: false,
        createdAt: nowIso,
        actorName: actor.fullName || actor.role,
      });
    }

    await logAdminAction({
      action: "BLOCKER_UPDATED",
      actor,
      targetType: "operational_blocker",
      targetId: blocker.id,
      metadata: { eventId: blocker.eventId, title: blocker.title, status: blocker.status },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      blocker,
      message: "Blocker updated successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating operational blocker";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["Vice President", "President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const blockerId = searchParams.get("blockerId");
    if (!blockerId) {
      return NextResponse.json({ success: false, error: "blockerId is required." }, { status: 400 });
    }

    const blockers = getStoredBlockers();
    const blocker = blockers.find((b) => b.id === blockerId);
    if (!blocker) {
      return NextResponse.json({ success: false, error: "Operational blocker not found." }, { status: 404 });
    }

    deleteStoredBlocker(blockerId);

    await logAdminAction({
      action: "BLOCKER_DELETED",
      actor: auth.session.user,
      targetType: "operational_blocker",
      targetId: blockerId,
      metadata: { title: blocker.title, eventId: blocker.eventId },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      message: "Operational blocker deleted successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting operational blocker";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
