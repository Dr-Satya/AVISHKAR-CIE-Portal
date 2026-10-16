import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { getStoredEvents, reorderStoredPhotos } from "@/lib/dataStore";

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();
    const { eventId, photoIds } = body;

    if (!eventId || !Array.isArray(photoIds)) {
      return NextResponse.json(
        { success: false, error: "eventId and photoIds array are required." },
        { status: 400 }
      );
    }

    const events = getStoredEvents();
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) {
      return NextResponse.json(
        { success: false, error: `Event with ID '${eventId}' not found.` },
        { status: 404 }
      );
    }

    const reorderedPhotos = reorderStoredPhotos(eventId, photoIds);

    await logAdminAction({
      action: "EVENT_PHOTOS_REORDERED",
      actor: auth.session.user,
      targetType: "event_photos",
      targetId: eventId,
      metadata: { eventId, photoIdsOrder: photoIds },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      message: "Gallery photo order updated successfully.",
      photos: reorderedPhotos,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error reordering photos.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
