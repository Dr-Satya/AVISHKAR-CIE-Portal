import { NextRequest, NextResponse } from "next/server";
import { getStoredEvents, getStoredPhotos } from "@/lib/dataStore";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Event ID or slug is required." },
        { status: 400 }
      );
    }

    const events = getStoredEvents();
    const event = events.find((e) => e.id === id || e.slug === id);

    // Gate: Strictly published events only for public gallery
    if (!event || event.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Event not found or not authorized for public viewing." },
        { status: 404 }
      );
    }

    const photos = getStoredPhotos(event.id);
    const coverPhoto = photos.find((p) => p.isCover) || photos[0] || null;

    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventTitle: event.title,
      photos,
      coverPhoto,
      total: photos.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error loading event photos.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
