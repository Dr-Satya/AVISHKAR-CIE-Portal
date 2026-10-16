import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import { publishEventAtomic } from "@/lib/publishVerification";

/**
 * POST /api/admin/events/[id]/publish
 * Executes final verification and atomic publication of an event.
 * Revalidates server-side authorization (Admin or President only), completeness,
 * and link availability before persisting live publication status.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { id: eventId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const enforceProductionUrl = Boolean(body.enforceProductionUrl);
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl : undefined;

    const result = await publishEventAtomic(
      eventId,
      {
        id: auth.session.user.id,
        email: auth.session.user.email,
        fullName: auth.session.user.fullName,
        role: auth.session.user.role,
      },
      {
        req,
        baseUrl,
        enforceProductionUrl,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Event verification and publication failed.",
          report: result.report,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      event: result.event,
      report: result.report,
      publicEventUrl: result.publicEventUrl,
      registrationUrl: result.registrationUrl,
      alreadyPublished: result.alreadyPublished ?? false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error publishing event";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
