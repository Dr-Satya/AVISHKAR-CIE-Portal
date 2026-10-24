import { NextRequest, NextResponse } from "next/server";
import { getStoredPhotoById, getStoredEvents } from "@/lib/dataStore";
import { getPhotoBuffer } from "@/lib/photoStorage";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Photo ID is required." }, { status: 400 });
    }

    const photo = getStoredPhotoById(id);
    if (!photo) {
      return NextResponse.json({ success: false, error: "Photo not found." }, { status: 404 });
    }

    // Check parent event
    const events = getStoredEvents();
    const parentEvent = events.find((e) => e.id === photo.eventId);

    const isPublished = parentEvent?.status === "published";

    // Security Gate: Restrict access if event is unpublished (draft, proposed, rejected, archived)
    if (!isPublished) {
      const session = await getAdminSessionFromRequest(req);
      const isAuthorizedAdmin =
        session &&
        (session.user.role === "President" ||
          session.user.role === "Admin" ||
          session.user.role === "admin");

      if (!isAuthorizedAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "Access denied: This photo belongs to an event that is not authorized for public display.",
            code: "UNAUTHORIZED_PHOTO_ACCESS",
          },
          { status: 403 }
        );
      }
    }

    // Resolve file from persistent storage
    const fileBuffer = getPhotoBuffer(photo.storagePath, id);
    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, error: "Image file content not found in storage." },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType || "image/jpeg",
        "Cache-Control": isPublished
          ? "public, max-age=86400, stale-while-revalidate=3600"
          : "private, no-cache, no-store",
        "Content-Disposition": `inline; filename="${encodeURIComponent(photo.fileName)}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error retrieving photo.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
