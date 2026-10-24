import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { EventRecord, EventStatus } from "@/types/admin";
import {
  getStoredEvents,
  saveStoredEvent,
  deleteStoredEvent,
  saveStoredNotification,
  getEventRegistrationCount,
  calculateEventReadiness,
} from "@/lib/dataStore";
import { publishEventAtomic } from "@/lib/publishVerification";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const userRole = auth.session.user.role;
  const userEmail = auth.session.user.email.toLowerCase();

  let results = getStoredEvents();

  // Role filtering: AVISHKAR Member can view published events, their own proposals/drafts, or assigned events
  if (userRole === "AVISHKAR Member") {
    results = results.filter((e) => {
      const isOwner =
        (e.proposedByEmail && e.proposedByEmail.toLowerCase() === userEmail) ||
        e.proposedBy.toLowerCase().includes(userEmail);
      const isAssigned = Array.isArray(e.assignedMemberIds) && e.assignedMemberIds.includes(auth.session.user.id);
      const isPublished = e.status === "published";
      return isOwner || isAssigned || isPublished;
    });
  }

  // Coordination filter
  if (statusFilter === "in_coordination") {
    results = results.filter(
      (e) =>
        (e.status === "approved" || e.status === "published") &&
        (e.coordinationStatus === "in_coordination" || Boolean(e.coordinatorId))
    );
  } else if (statusFilter && statusFilter !== "ALL") {
    results = results.filter((e) => e.status === statusFilter);
  }

  const eventsWithCounts = results.map((e) => ({
    ...e,
    registrationCount: getEventRegistrationCount(e.id),
  }));

  return NextResponse.json({
    success: true,
    events: eventsWithCounts,
    userRole,
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
      title,
      description,
      objectives,
      category,
      proposedDateTime,
      deliveryMode,
      expectedParticipants,
      requiredResources,
      supportingDocsUrl,
      teamSizeMin,
      teamSizeMax,
      venuePlaceholder,
      status,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required." },
        { status: 400 }
      );
    }

    const userRole = auth.session.user.role;
    const isMemberRole = userRole === "AVISHKAR Member";
    const creationSource: "MEMBER_PROPOSAL" | "ADMIN_DIRECT" = isMemberRole ? "MEMBER_PROPOSAL" : "ADMIN_DIRECT";

    // Members can ONLY create proposals as "draft" or "proposed" (never approved or published)
    let initialStatus: EventStatus = "draft";
    if (isMemberRole) {
      initialStatus = status === "draft" ? "draft" : "proposed";
    } else {
      initialStatus = (status as EventStatus) || "approved";
    }

    const nowIso = new Date().toISOString();
    const newEvent: EventRecord = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: description.trim(),
      objectives: objectives?.trim() || "",
      category: category || "General",
      proposedDateTime: proposedDateTime || "",
      deliveryMode: deliveryMode || "In-Person",
      expectedParticipants: Number(expectedParticipants) || 0,
      requiredResources: requiredResources?.trim() || "",
      supportingDocsUrl: supportingDocsUrl?.trim() || "",
      status: initialStatus,
      creationSource,
      proposedBy: `${auth.session.user.fullName || auth.session.user.email} (${userRole})`,
      proposedByEmail: auth.session.user.email,
      approvedBy: isMemberRole ? null : (auth.session.user.fullName || "Admin"),
      teamSizeMin: Number(teamSizeMin) || 1,
      teamSizeMax: Number(teamSizeMax) || 4,
      datePlaceholder: proposedDateTime || "Dates to be announced",
      venuePlaceholder: venuePlaceholder || "GD Goenka University Campus",
      assignedMemberIds: [],
      submittedAt: initialStatus === "proposed" ? nowIso : undefined,
      // Member proposals require VP then President approval; Admin-created events do NOT require VP or President approval
      vpStatus: isMemberRole ? (initialStatus === "proposed" ? "pending" : "pending") : "not_required",
      presidentStatus: isMemberRole ? "pending" : "not_required",
      presidentDecisionBy: isMemberRole ? null : (auth.session.user.fullName || auth.session.user.email),
      presidentDecidedAt: isMemberRole ? null : nowIso,
      approvalHistory: [
        {
          id: `hist-${Date.now()}-1`,
          stage: isMemberRole ? "Member" : "Admin",
          decision: initialStatus === "proposed" ? "submitted" : initialStatus === "draft" ? "draft" : "approved",
          actorName: auth.session.user.fullName || auth.session.user.email,
          actorEmail: auth.session.user.email,
          actorRole: userRole,
          timestamp: nowIso,
          comment: initialStatus === "proposed"
            ? "Proposal submitted for Vice President review"
            : isMemberRole
            ? "Draft proposal created"
            : "Direct administrator event created",
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    saveStoredEvent(newEvent);

    if (isMemberRole && initialStatus === "proposed") {
      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: "New Event Proposal in VP Queue",
        message: `Proposal '${newEvent.title}' submitted by ${auth.session.user.fullName || auth.session.user.email} for Vice President review.`,
        type: "proposal",
        targetRole: "Vice President",
        link: "/admin/vice-president",
        read: false,
        createdAt: nowIso,
        actorName: auth.session.user.fullName || auth.session.user.email,
      });
    }

    await logAdminAction({
      action:
        initialStatus === "proposed"
          ? "EVENT_PROPOSED"
          : initialStatus === "draft"
          ? "EVENT_DRAFT_SAVED"
          : "EVENT_CREATED",
      actor: auth.session.user,
      targetType: "event",
      targetId: newEvent.id,
      metadata: { title: newEvent.title, status: newEvent.status },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      event: newEvent,
      message:
        initialStatus === "proposed"
          ? "Event proposal submitted for President review."
          : initialStatus === "draft"
          ? "Draft proposal saved successfully."
          : "Event created successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating event";
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
    const eventId = body.eventId || body.id;
    const rejectionReason = body.rejectionReason || body.reason;
    const {
      action,
      reviewComment,
      title,
      description,
      objectives,
      category,
      proposedDateTime,
      deliveryMode,
      expectedParticipants,
      requiredResources,
      supportingDocsUrl,
      teamSizeMin,
      teamSizeMax,
      venuePlaceholder,
      coordinatorId,
      coordinatorName,
      coordinatorEmail,
      coordinationNotes,
      coordinationBlockers,
      coordinationStatus,
      assignedMemberIds,
    } = body;

    if (!eventId) {
      return NextResponse.json({ success: false, error: "eventId is required." }, { status: 400 });
    }

    const userRole = auth.session.user.role;

    // Strict role check for approval actions
    if ((action === "approve" || action === "reject") && userRole !== "President" && userRole !== "admin" && userRole !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          error: `Only the President has authority to ${action} proposed events.`,
          code: "PRESIDENT_REQUIRED",
        },
        { status: 403 }
      );
    }

    if ((action === "vp_approve" || action === "vp_reject") && userRole !== "Vice President" && userRole !== "President" && userRole !== "admin" && userRole !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Only the Vice President has authority to perform Vice President review.",
          code: "VP_REQUIRED",
        },
        { status: 403 }
      );
    }

    const events = getStoredEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    const userEmail = auth.session.user.email.toLowerCase();
    const isOwner =
      (event.proposedByEmail && event.proposedByEmail.toLowerCase() === userEmail) ||
      event.proposedBy.toLowerCase().includes(userEmail);

    // 1. Submit draft proposal (Member or Author)
    if (action === "submit") {
      if (userRole === "AVISHKAR Member" && !isOwner) {
        return NextResponse.json(
          { success: false, error: "You can only submit your own proposal drafts.", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
      if (event.status !== "draft") {
        return NextResponse.json(
          { success: false, error: `Proposal cannot be submitted from status '${event.status}'. Must be 'draft'.` },
          { status: 400 }
        );
      }
      event.status = "proposed";
      event.creationSource = "MEMBER_PROPOSAL";
      event.submittedAt = new Date().toISOString();
      event.vpStatus = "pending";
      event.presidentStatus = "pending";

      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "Member",
        decision: "submitted",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: new Date().toISOString(),
        comment: "Proposal submitted for Vice President review queue",
      });

      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: "New Event Proposal in VP Queue",
        message: `Proposal '${event.title}' submitted by ${auth.session.user.fullName || auth.session.user.email} for Vice President review.`,
        type: "proposal",
        targetRole: "Vice President",
        link: "/admin/vice-president",
        read: false,
        createdAt: new Date().toISOString(),
        actorName: auth.session.user.fullName || auth.session.user.email,
      });
    }
    // 2. Vice President Approval / Rejection (Workflow A - Step 1)
    else if (action === "vp_approve" || (action === "vp_review" && (body.decision === "approved" || !body.decision))) {
      const nowIso = new Date().toISOString();
      event.vpStatus = "approved";
      event.vpDecisionBy = auth.session.user.fullName || auth.session.user.email;
      event.vpDecidedAt = nowIso;
      event.vpComment = (reviewComment || body.comment || "Logistical and operational feasibility approved by Vice President.").trim();
      event.presidentStatus = "pending";

      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "Vice President",
        decision: "approved",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: nowIso,
        comment: event.vpComment,
      });

      // Forward proposal to President's review queue
      saveStoredNotification({
        id: `notif-${Date.now()}-pres`,
        title: "Proposal Passed VP Review",
        message: `Proposal '${event.title}' approved by Vice President. Ready for President executive review.`,
        type: "approval",
        targetRole: "President",
        link: "/admin/president",
        read: false,
        createdAt: nowIso,
        actorName: auth.session.user.fullName || auth.session.user.email,
      });

      if (event.proposedByEmail) {
        saveStoredNotification({
          id: `notif-${Date.now()}-mem-vp`,
          title: "Proposal Approved by Vice President",
          message: `Your event proposal '${event.title}' was approved by Vice President and advanced to President review.`,
          type: "approval",
          targetRole: "AVISHKAR Member",
          targetEmail: event.proposedByEmail,
          link: "/admin/member",
          read: false,
          createdAt: nowIso,
          actorName: auth.session.user.fullName || auth.session.user.email,
        });
      }
    }
    else if (action === "vp_reject" || (action === "vp_review" && body.decision === "rejected")) {
      const reason = (rejectionReason || reviewComment || body.rejectionReason || "").trim();
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "A rejection reason is strictly required when rejecting a proposal.", code: "REJECTION_REASON_REQUIRED" },
          { status: 400 }
        );
      }
      const nowIso = new Date().toISOString();
      event.status = "rejected";
      event.vpStatus = "rejected";
      event.vpDecisionBy = auth.session.user.fullName || auth.session.user.email;
      event.vpDecidedAt = nowIso;
      event.vpRejectionReason = reason;
      event.vpComment = reason;
      event.rejectionReason = reason;

      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "Vice President",
        decision: "rejected",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: nowIso,
        rejectionReason: reason,
      });

      if (event.proposedByEmail) {
        saveStoredNotification({
          id: `notif-${Date.now()}-mem-vprej`,
          title: "Proposal Rejected by Vice President",
          message: `Proposal '${event.title}' was rejected by the Vice President: ${reason}`,
          type: "rejection",
          targetRole: "AVISHKAR Member",
          targetEmail: event.proposedByEmail,
          link: "/admin/member",
          read: false,
          createdAt: nowIso,
          actorName: auth.session.user.fullName || auth.session.user.email,
        });
      }
    }
    // 3. President Approval (Workflow A - Step 2)
    else if (action === "approve") {
      if (userRole !== "President" && userRole !== "Admin" && userRole !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Only the President has authority to approve proposed events.",
            code: "PRESIDENT_REQUIRED",
          },
          { status: 403 }
        );
      }

      // Member-created proposals MUST first have VP approval
      const isMemberProposal =
        event.creationSource === "MEMBER_PROPOSAL" ||
        event.creationSource === "council" ||
        (event.proposedBy && event.proposedBy.includes("Member")) ||
        event.proposedByEmail === "member@gdgoenka.ac.in";

      if (isMemberProposal && event.vpStatus !== "approved") {
        return NextResponse.json(
          {
            success: false,
            error: `Member-created proposal must first be reviewed and approved by the Vice President before President approval. Current VP status: '${event.vpStatus || "pending"}'.`,
            code: "VP_APPROVAL_REQUIRED",
          },
          { status: 400 }
        );
      }

      event.status = "approved";
      event.approvedBy = auth.session.user.fullName || auth.session.user.email;
      event.reviewedBy = auth.session.user.fullName || auth.session.user.email;
      event.reviewedAt = new Date().toISOString();
      event.reviewComment = (reviewComment || rejectionReason || "Approved by President Council").trim();
      event.presidentStatus = "approved";
      event.presidentDecisionBy = auth.session.user.fullName || auth.session.user.email;
      event.presidentDecidedAt = event.reviewedAt;
      event.presidentComment = event.reviewComment;

      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "President",
        decision: "approved",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: event.reviewedAt,
        comment: event.reviewComment,
      });

      // Notify Administration Management Portal that event is now eligible for final verification and publication
      saveStoredNotification({
        id: `notif-${Date.now()}-adm`,
        title: "Event Proposal Fully Approved",
        message: `'${event.title}' has received both VP and President approvals. It is now eligible for final administrative verification and publication.`,
        type: "approval",
        targetRole: "Admin",
        link: "/admin/forms",
        read: false,
        createdAt: new Date().toISOString(),
        actorName: auth.session.user.fullName || auth.session.user.email,
      });

      if (event.proposedByEmail) {
        saveStoredNotification({
          id: `notif-${Date.now()}-mem`,
          title: "Proposal Approved by President",
          message: `Your event proposal '${event.title}' was approved by the President Council and is now eligible for publication.`,
          type: "approval",
          targetRole: "AVISHKAR Member",
          targetEmail: event.proposedByEmail,
          link: "/admin/member",
          read: false,
          createdAt: new Date().toISOString(),
          actorName: auth.session.user.fullName || auth.session.user.email,
        });
      }
    }
    // 4. President Rejection
    else if (action === "reject") {
      if (userRole !== "President" && userRole !== "Admin" && userRole !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Only the President has authority to reject proposed events.",
            code: "PRESIDENT_REQUIRED",
          },
          { status: 403 }
        );
      }
      const reason = (rejectionReason || reviewComment || "").trim();
      if (!reason) {
        return NextResponse.json(
          {
            success: false,
            error: "A review comment / rejection reason is strictly required when rejecting a proposal.",
            code: "REJECTION_REASON_REQUIRED",
          },
          { status: 400 }
        );
      }
      event.status = "rejected";
      event.reviewedBy = auth.session.user.fullName || auth.session.user.email;
      event.reviewedAt = new Date().toISOString();
      event.rejectionReason = reason;
      event.reviewComment = reason;
      event.presidentStatus = "rejected";
      event.presidentDecisionBy = auth.session.user.fullName || auth.session.user.email;
      event.presidentDecidedAt = event.reviewedAt;
      event.presidentRejectionReason = reason;

      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "President",
        decision: "rejected",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: event.reviewedAt,
        rejectionReason: reason,
      });

      if (event.proposedByEmail) {
        saveStoredNotification({
          id: `notif-${Date.now()}`,
          title: "Proposal Rejected by President",
          message: `Proposal '${event.title}' was rejected by the President: ${reason}`,
          type: "rejection",
          targetRole: "AVISHKAR Member",
          targetEmail: event.proposedByEmail,
          link: "/admin/member",
          read: false,
          createdAt: new Date().toISOString(),
          actorName: auth.session.user.fullName || auth.session.user.email,
        });
      }
    }
    // 5. Publish event (Strict verification and atomic publication)
    else if (action === "publish") {
      if (userRole !== "Admin" && userRole !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Role not authorized to publish events. Admin access required.",
            code: "PUBLISH_FORBIDDEN",
          },
          { status: 403 }
        );
      }

      const pubResult = await publishEventAtomic(
        event.id,
        {
          id: auth.session.user.id,
          email: auth.session.user.email,
          fullName: auth.session.user.fullName,
          role: auth.session.user.role,
        },
        { req }
      );

      if (!pubResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: pubResult.error || "Event verification and publication failed.",
            code: event.status === "rejected" ? "REJECTED_CANNOT_PUBLISH" : "APPROVAL_REQUIRED",
            report: pubResult.report,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        event: pubResult.event,
        report: pubResult.report,
        publicEventUrl: pubResult.publicEventUrl,
        registrationUrl: pubResult.registrationUrl,
        message: pubResult.message,
      });
    }
    // 5. VP / Coordination updates
    else if (action === "coordinate") {
      if (userRole !== "Vice President" && userRole !== "President" && userRole !== "Admin" && userRole !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Role not authorized to coordinate proposals. VP or Executive access required.",
            code: "COORDINATION_FORBIDDEN",
          },
          { status: 403 }
        );
      }
      if (event.status !== "approved" && event.status !== "published") {
        return NextResponse.json(
          {
            success: false,
            error: "Only President-approved or published events can enter the coordination board.",
            code: "MUST_BE_APPROVED",
          },
          { status: 400 }
        );
      }
      if (coordinationStatus === "coordination_ready") {
        const readinessSummary = calculateEventReadiness(event.id);
        if (readinessSummary.mandatoryIncomplete > 0) {
          const incompleteTitles = readinessSummary.items
            .filter((i) => i.isMandatory && i.status !== "completed")
            .map((i) => `'${i.title}'`)
            .slice(0, 3)
            .join(", ");
          return NextResponse.json(
            {
              success: false,
              error: `Cannot mark event as operationally ready while mandatory readiness items remain incomplete: ${incompleteTitles}${
                readinessSummary.mandatoryIncomplete > 3 ? " and others" : ""
              }.`,
              code: "MANDATORY_READINESS_INCOMPLETE",
            },
            { status: 400 }
          );
        }
      }

      if (coordinatorId !== undefined) event.coordinatorId = coordinatorId;
      if (coordinatorName !== undefined) event.coordinatorName = coordinatorName;
      if (coordinatorEmail !== undefined) event.coordinatorEmail = coordinatorEmail;
      if (coordinationNotes !== undefined) event.coordinationNotes = coordinationNotes;
      if (coordinationBlockers !== undefined) event.coordinationBlockers = coordinationBlockers;
      if (coordinationStatus !== undefined) event.coordinationStatus = coordinationStatus;
      if (Array.isArray(assignedMemberIds)) event.assignedMemberIds = assignedMemberIds;

      const nowIso = new Date().toISOString();
      if (coordinationStatus === "coordination_ready" || body.vpStatus === "approved") {
        event.vpStatus = "approved";
        event.vpDecisionBy = auth.session.user.fullName || auth.session.user.email;
        event.vpDecidedAt = nowIso;
        event.vpComment = coordinationNotes || "Logistical coordination completed and verified.";
      } else if (coordinationBlockers && coordinationStatus === "awaiting_coordination") {
        event.vpComment = coordinationNotes;
        event.vpRejectionReason = coordinationBlockers;
      } else if (coordinatorName || coordinationNotes) {
        if (event.vpStatus !== "approved") {
          event.vpStatus = "in_coordination";
        }
        event.vpDecisionBy = auth.session.user.fullName || auth.session.user.email;
        event.vpDecidedAt = nowIso;
        event.vpComment = coordinationNotes || "Under active coordination.";
      }

      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "Vice President",
        decision: "coordinated",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: nowIso,
        comment: coordinationNotes || `Coordination updated to ${event.coordinationStatus || "in_coordination"}`,
      });
    }
    // 5b. Dedicated VP Review action
    else if (action === "vp_review") {
      if (userRole !== "Vice President" && userRole !== "President") {
        return NextResponse.json(
          {
            success: false,
            error: "Only the Vice President or President has authority to provide VP review.",
            code: "VP_REQUIRED",
          },
          { status: 403 }
        );
      }
      const decision = body.decision || body.vpStatus || "approved";
      if (decision === "rejected" && !body.rejectionReason?.trim() && !body.reviewComment?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "A review comment / rejection reason is required for VP rejection.",
            code: "REJECTION_REASON_REQUIRED",
          },
          { status: 400 }
        );
      }
      const nowIso = new Date().toISOString();
      event.vpStatus = decision === "rejected" ? "rejected" : "approved";
      event.vpDecisionBy = auth.session.user.fullName || auth.session.user.email;
      event.vpDecidedAt = nowIso;
      if (decision === "rejected") {
        event.vpRejectionReason = (body.rejectionReason || body.reviewComment || "").trim();
        event.vpComment = event.vpRejectionReason;
      } else {
        event.vpComment = (body.reviewComment || body.comment || "Logistical feasibility approved by Vice President.").trim();
        event.coordinationStatus = "coordination_ready";
      }

      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "Vice President",
        decision: decision === "rejected" ? "rejected" : "approved",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: nowIso,
        comment: event.vpComment || undefined,
        rejectionReason: event.vpRejectionReason || undefined,
      });
    }
    // 6. Edit proposal details
    else if (action === "edit") {
      if (userRole === "AVISHKAR Member") {
        if (!isOwner) {
          return NextResponse.json(
            { success: false, error: "Access denied: You cannot edit another member's proposal.", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
        if (event.status !== "draft" && event.status !== "proposed") {
          return NextResponse.json(
            { success: false, error: `Cannot edit proposal with status '${event.status}'. Only draft or proposed items can be modified.` },
            { status: 400 }
          );
        }
      }
      if (title) event.title = title.trim();
      if (description) event.description = description.trim();
      if (objectives !== undefined) event.objectives = objectives.trim();
      if (category) event.category = category;
      if (proposedDateTime !== undefined) event.proposedDateTime = proposedDateTime;
      if (body.datePlaceholder !== undefined) event.datePlaceholder = body.datePlaceholder.trim();
      if (body.registrationStartDate !== undefined) event.registrationStartDate = body.registrationStartDate;
      if (body.registrationEndDate !== undefined) event.registrationEndDate = body.registrationEndDate;
      if (deliveryMode !== undefined) event.deliveryMode = deliveryMode;
      if (expectedParticipants !== undefined) event.expectedParticipants = Number(expectedParticipants);
      if (requiredResources !== undefined) event.requiredResources = requiredResources.trim();
      if (supportingDocsUrl !== undefined) event.supportingDocsUrl = supportingDocsUrl.trim();
      if (teamSizeMin !== undefined) event.teamSizeMin = Number(teamSizeMin);
      if (teamSizeMax !== undefined) event.teamSizeMax = Number(teamSizeMax);
      if (venuePlaceholder) event.venuePlaceholder = venuePlaceholder.trim();
    } else if (action === "unpublish") {
      // Return to approved status to take off public site while retaining approval and registrations
      event.status = "approved";
      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "Admin",
        decision: "unpublished",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: new Date().toISOString(),
        comment: "Event unpublished from public fest catalogue",
      });
    } else if (action === "archive") {
      // Archive the event while preserving all registrations and historical records
      event.status = "archived";
      if (!event.approvalHistory) event.approvalHistory = [];
      event.approvalHistory.push({
        id: `hist-${Date.now()}`,
        stage: "Admin",
        decision: "archived",
        actorName: auth.session.user.fullName || auth.session.user.email,
        actorEmail: auth.session.user.email,
        actorRole: userRole,
        timestamp: new Date().toISOString(),
        comment: "Event archived by administration",
      });
    }

    event.updatedAt = new Date().toISOString();
    saveStoredEvent(event);

    const actionLogMap: Record<string, string> = {
      publish: "EVENT_PUBLISHED",
      unpublish: "EVENT_UNPUBLISHED",
      archive: "EVENT_ARCHIVED",
      approve: "EVENT_APPROVE",
      reject: "EVENT_REJECT",
      edit: "EVENT_EDITED",
      submit: "EVENT_SUBMITTED",
      coordinate: "TASK_ASSIGN",
    };
    const logActionName = actionLogMap[action] || `EVENT_${(action || "EDIT").toUpperCase()}`;

    await logAdminAction({
      action: logActionName,
      actor: auth.session.user,
      targetType: "event",
      targetId: event.id,
      metadata: { action, rejectionReason: event.rejectionReason, status: event.status },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      event,
      message: `Event status updated to ${event.status}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating event";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "AVISHKAR Member"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || searchParams.get("id");
    if (!eventId) {
      return NextResponse.json({ success: false, error: "eventId is required." }, { status: 400 });
    }

    const events = getStoredEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    const userRole = auth.session.user.role;
    const userEmail = auth.session.user.email.toLowerCase();
    const isOwner =
      (event.proposedByEmail && event.proposedByEmail.toLowerCase() === userEmail) ||
      event.proposedBy.toLowerCase().includes(userEmail);

    if (userRole === "AVISHKAR Member") {
      // Members can ONLY delete their own drafts
      if (!isOwner || event.status !== "draft") {
        return NextResponse.json(
          {
            success: false,
            error: "Members can only delete their own draft proposals.",
            code: "FORBIDDEN",
          },
          { status: 403 }
        );
      }
    }

    deleteStoredEvent(eventId);

    await logAdminAction({
      action: "EVENT_DELETED",
      actor: auth.session.user,
      targetType: "event",
      targetId: eventId,
      metadata: { eventId, title: event.title },
      token: auth.session.token,
    });

    return NextResponse.json({ success: true, message: "Event removed permanently." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting event";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
