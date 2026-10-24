import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { EventReadinessItem, ReadinessCategory, ReadinessItemStatus } from "@/types/admin";
import {
  getStoredReadinessItems,
  saveStoredReadinessItem,
  deleteStoredReadinessItem,
  calculateEventReadiness,
  ensureDefaultReadinessChecklist,
  getStoredEvents,
  saveStoredNotification,
  readDataStore,
} from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (eventId && eventId !== "ALL") {
    const summary = calculateEventReadiness(eventId);
    return NextResponse.json({
      success: true,
      summary,
    });
  }

  // If no eventId or ALL, return readiness summaries for all approved and published events
  const events = getStoredEvents().filter((e) => e.status === "approved" || e.status === "published");
  const summaries = events.map((e) => calculateEventReadiness(e.id));

  return NextResponse.json({
    success: true,
    summaries,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["Vice President", "President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      eventId,
      category,
      title,
      description,
      isMandatory = true,
      deadline,
      responsibleMemberId,
      responsibleMemberName,
      notes,
    } = body;

    if (!eventId || !title || !category || !deadline) {
      return NextResponse.json(
        { success: false, error: "Event ID, category, title, and deadline are required." },
        { status: 400 }
      );
    }

    const events = getStoredEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    const newItem: EventReadinessItem = {
      id: `rdy-${eventId}-${Date.now()}`,
      eventId,
      category: category as ReadinessCategory,
      title: title.trim(),
      description: description?.trim() || "",
      isMandatory: Boolean(isMandatory),
      status: "pending",
      deadline,
      responsibleMemberId: responsibleMemberId || undefined,
      responsibleMemberName: responsibleMemberName || undefined,
      notes: notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveStoredReadinessItem(newItem);

    // If assigned to a responsible member, notify them
    if (responsibleMemberId) {
      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: "Readiness Requirement Assigned",
        message: `You were assigned readiness item '${newItem.title}' for '${event.title}'.`,
        type: "task",
        targetRole: "AVISHKAR Member",
        link: "/admin/vice-president",
        read: false,
        createdAt: new Date().toISOString(),
        actorName: auth.session.user.fullName || auth.session.user.role,
      });
    }

    await logAdminAction({
      action: "READINESS_ITEM_CREATED",
      actor: auth.session.user,
      targetType: "event_readiness",
      targetId: newItem.id,
      metadata: { eventId, title: newItem.title, category: newItem.category, isMandatory: newItem.isMandatory },
      token: auth.session.token,
    });

    const updatedSummary = calculateEventReadiness(eventId);

    return NextResponse.json({
      success: true,
      item: newItem,
      summary: updatedSummary,
      message: "Event readiness item added successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating readiness item";
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
    const { itemId, status, notes, responsibleMemberId, responsibleMemberName, deadline, isMandatory, title, description } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: "itemId is required." }, { status: 400 });
    }

    const items = getStoredReadinessItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Readiness item not found." }, { status: 404 });
    }

    const userRole = auth.session.user.role;
    const isMember = userRole === "AVISHKAR Member";

    if (isMember) {
      // Member can only update status and notes for items assigned to them
      if (item.responsibleMemberId && item.responsibleMemberId !== auth.session.user.id) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You can only update readiness items assigned to you." },
          { status: 403 }
        );
      }
      if (status) item.status = status as ReadinessItemStatus;
      if (notes !== undefined) item.notes = notes;
    } else {
      // VP, President, Admin
      if (status) item.status = status as ReadinessItemStatus;
      if (notes !== undefined) item.notes = notes;
      if (title) item.title = title.trim();
      if (description !== undefined) item.description = description.trim();
      if (responsibleMemberId !== undefined) item.responsibleMemberId = responsibleMemberId || undefined;
      if (responsibleMemberName !== undefined) item.responsibleMemberName = responsibleMemberName || undefined;
      if (deadline) item.deadline = deadline;
      if (isMandatory !== undefined) item.isMandatory = Boolean(isMandatory);
    }

    if (item.status === "completed") {
      item.completedAt = new Date().toISOString();
      item.completedBy = auth.session.user.fullName || auth.session.user.role;
    } else {
      delete item.completedAt;
      delete item.completedBy;
    }

    item.updatedAt = new Date().toISOString();
    saveStoredReadinessItem(item);

    // Notify Vice President if an item is marked blocked
    if (item.status === "blocked") {
      const event = getStoredEvents().find((e) => e.id === item.eventId);
      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: "Readiness Requirement Blocked Alert",
        message: `Readiness check '${item.title}' has been reported BLOCKED for '${event?.title || item.eventId}'.`,
        type: "blocker",
        targetRole: "Vice President",
        link: "/admin/vice-president",
        read: false,
        createdAt: new Date().toISOString(),
        actorName: auth.session.user.fullName || auth.session.user.role,
      });
    }

    await logAdminAction({
      action: "READINESS_ITEM_UPDATED",
      actor: auth.session.user,
      targetType: "event_readiness",
      targetId: item.id,
      metadata: { eventId: item.eventId, title: item.title, status: item.status },
      token: auth.session.token,
    });

    const updatedSummary = calculateEventReadiness(item.eventId);

    return NextResponse.json({
      success: true,
      item,
      summary: updatedSummary,
      message: `Readiness item updated to ${item.status}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating readiness item";
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
    const itemId = searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ success: false, error: "itemId is required." }, { status: 400 });
    }

    const items = getStoredReadinessItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Readiness item not found." }, { status: 404 });
    }

    deleteStoredReadinessItem(itemId);

    await logAdminAction({
      action: "READINESS_ITEM_DELETED",
      actor: auth.session.user,
      targetType: "event_readiness",
      targetId: itemId,
      metadata: { title: item.title, eventId: item.eventId },
      token: auth.session.token,
    });

    const updatedSummary = calculateEventReadiness(item.eventId);

    return NextResponse.json({
      success: true,
      summary: updatedSummary,
      message: "Readiness item deleted successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting readiness item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
