import { NextResponse } from "next/server";
import { getStoredEvents, getStoredPhotos } from "@/lib/dataStore";

export async function GET() {
  try {
    const allEvents = getStoredEvents();
    const publishedEvents = allEvents.filter((e) => e.status === "published");
    const publishedEventMap = new Map(publishedEvents.map((e) => [e.id, e]));

    const allPhotos = getStoredPhotos();
    const publicPhotos = allPhotos
      .filter((p) => publishedEventMap.has(p.eventId))
      .map((p) => ({
        ...p,
        eventTitle: publishedEventMap.get(p.eventId)?.title || p.eventTitle,
        eventCategory: publishedEventMap.get(p.eventId)?.category,
        eventSlug: publishedEventMap.get(p.eventId)?.slug,
      }));

    return NextResponse.json({
      success: true,
      photos: publicPhotos,
      events: publishedEvents.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        category: e.category,
        coverPhotoUrl: e.coverPhotoUrl,
      })),
      total: publicPhotos.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error loading public gallery.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
