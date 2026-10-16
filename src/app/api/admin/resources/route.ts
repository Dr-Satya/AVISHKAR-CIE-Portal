import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { EventResourceRecord, ResourceCategory } from "@/types/admin";
import { getStoredResources, saveStoredResource, deleteStoredResource } from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const category = searchParams.get("category");

  let list = getStoredResources(eventId || undefined);
  if (category && category !== "ALL") {
    list = list.filter((r) => r.category === category);
  }

  return NextResponse.json({
    success: true,
    resources: list,
    userRole: auth.session.user.role,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { eventId, eventTitle, title, category, fileUrl, fileName, fileSize } = body;

    if (!eventId || !title || !category) {
      return NextResponse.json(
        { success: false, error: "Event ID, resource title, and category are required." },
        { status: 400 }
      );
    }

    const userRole = auth.session.user.role;
    // Members submit for review; Admins/President auto-approve
    const initialStatus = userRole === "AVISHKAR Member" ? "pending_review" : "approved";

    const newResource: EventResourceRecord = {
      id: `res-${Date.now()}`,
      eventId,
      eventTitle: eventTitle || "General Event",
      title: title.trim(),
      category: category as ResourceCategory,
      fileUrl: fileUrl || "#",
      fileName: fileName || `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      fileSize: fileSize || "1.2 MB",
      uploadedBy: `${auth.session.user.fullName || auth.session.user.email} (${userRole})`,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    saveStoredResource(newResource);

    await logAdminAction({
      action: "RESOURCE_UPLOADED",
      actor: auth.session.user,
      targetType: "resource",
      targetId: newResource.id,
      metadata: { eventId, title: newResource.title, category: newResource.category },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      resource: newResource,
      message:
        userRole === "AVISHKAR Member"
          ? "Resource submitted for admin approval."
          : "Resource uploaded and approved.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error uploading resource";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { resourceId, action } = body;

    const resources = getStoredResources();
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) {
      return NextResponse.json({ success: false, error: "Resource not found." }, { status: 404 });
    }

    if (action === "approve") {
      resource.status = "approved";
    }

    saveStoredResource(resource);

    await logAdminAction({
      action: "RESOURCE_APPROVED",
      actor: auth.session.user,
      targetType: "resource",
      targetId: resource.id,
      metadata: { action, title: resource.title },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      resource,
      message: "Resource successfully approved.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating resource";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");
    if (!resourceId) {
      return NextResponse.json({ success: false, error: "resourceId is required." }, { status: 400 });
    }

    deleteStoredResource(resourceId);

    await logAdminAction({
      action: "RESOURCE_DELETED",
      actor: auth.session.user,
      targetType: "resource",
      targetId: resourceId,
      metadata: { resourceId },
      token: auth.session.token,
    });

    return NextResponse.json({ success: true, message: "Resource removed successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting resource";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
