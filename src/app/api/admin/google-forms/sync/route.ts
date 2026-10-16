import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { syncGoogleFormResponses } from "@/lib/googleForms";
import {
  getStoredEvents,
  saveStoredEvent,
  batchSaveStoredGoogleFormResponses,
  getStoredGoogleFormResponses,
} from "@/lib/dataStore";
import { GoogleFormResponseRecord } from "@/types/admin";

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { eventId, directResponses } = body;

    if (!eventId) {
      return NextResponse.json({ success: false, error: "eventId is required." }, { status: 400 });
    }

    const events = getStoredEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    if (!event.googleFormId && !Array.isArray(directResponses)) {
      return NextResponse.json(
        {
          success: false,
          error: "No Google Form is configured for this event. Please create or link a Google Form first.",
          code: "FORM_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    let fetchedResponses: GoogleFormResponseRecord[] = [];

    // 1. Direct responses passed in (for testing, sandbox, or webhook-based feeds)
    if (Array.isArray(directResponses)) {
      fetchedResponses = directResponses.map((r: any, idx: number) => ({
        id: r.id || `gfr-${event.id}-${r.googleResponseId || idx}`,
        eventId: event.id,
        eventTitle: event.title,
        googleFormId: event.googleFormId || "direct-sync",
        googleResponseId: r.googleResponseId || `direct-${Date.now()}-${idx}`,
        studentName: r.studentName || "Participant",
        studentEmail: r.studentEmail || "N/A",
        studentId: r.studentId || "N/A",
        contactNumber: r.contactNumber || "N/A",
        answers: r.answers || {},
        submittedAt: r.submittedAt || new Date().toISOString(),
        synchronizedAt: new Date().toISOString(),
      }));
    } else if (event.googleFormId) {
      // 2. Fetch live responses via Google Forms API
      const syncResult = await syncGoogleFormResponses(
        event.googleFormId,
        event.id,
        event.title
      );

      if (!syncResult.success) {
        event.lastSyncStatus = "error";
        event.lastSyncError = syncResult.error;
        event.updatedAt = new Date().toISOString();
        saveStoredEvent(event);

        return NextResponse.json(
          {
            success: false,
            error: syncResult.error || "Failed to synchronize responses with Google Forms API.",
            code: syncResult.code || "SYNC_FAILED",
          },
          { status: 500 }
        );
      }

      fetchedResponses = syncResult.responses || [];
    }

    // 3. Batch save with deduplication using Google responseId
    const saveSummary = batchSaveStoredGoogleFormResponses(fetchedResponses);
    const nowIso = new Date().toISOString();

    const allResponsesForEvent = getStoredGoogleFormResponses(event.id);
    event.lastSyncAt = nowIso;
    event.lastSyncStatus = "success";
    event.lastSyncError = undefined;
    event.formResponseCount = allResponsesForEvent.length;
    event.updatedAt = nowIso;
    saveStoredEvent(event);

    await logAdminAction({
      action: "RESPONSES_SYNCHRONIZED",
      actor: auth.session.user,
      targetType: "event",
      targetId: event.id,
      metadata: {
        eventTitle: event.title,
        googleFormId: event.googleFormId,
        totalFetched: fetchedResponses.length,
        newRecordsAdded: saveSummary.added,
        duplicatesSkipped: saveSummary.duplicatesSkipped,
        totalCumulative: allResponsesForEvent.length,
      },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      message: `Synchronization complete. Added ${saveSummary.added} new response(s). Skipped ${saveSummary.duplicatesSkipped} duplicate(s).`,
      totalSynced: fetchedResponses.length,
      newAdded: saveSummary.added,
      duplicatesSkipped: saveSummary.duplicatesSkipped,
      totalCumulative: allResponsesForEvent.length,
      lastSyncAt: nowIso,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error synchronizing responses";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
