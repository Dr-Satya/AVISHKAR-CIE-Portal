import { NextResponse } from "next/server";
import { getStoredEvents } from "@/lib/dataStore";

/**
 * Public Events API: Returns strictly approved & published competitions.
 * Unapproved drafts, member proposals, and archived tracks are never exposed.
 */
export async function GET() {
  const allEvents = getStoredEvents();
  // Filter strictly to published events only (drafts, proposed, rejected, archived are hidden)
  const publishedEvents = allEvents.filter((e) => e.status === "published");

  // Sanitize internal admin metadata before exposing publicly
  const sanitizedEvents = publishedEvents.map((e) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      approvalHistory,
      proposedByEmail,
      coordinatorEmail,
      coordinationNotes,
      coordinationBlockers,
      presidentRejectionReason,
      vpRejectionReason,
      assignedMemberIds,
      verificationErrors,
      lastSyncError,
      ...publicFields
    } = e;
    return publicFields;
  });

  return NextResponse.json({
    success: true,
    events: sanitizedEvents,
  });
}
