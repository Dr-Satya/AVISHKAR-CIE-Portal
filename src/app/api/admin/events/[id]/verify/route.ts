import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import { verifyEventForPublishing } from "@/lib/publishVerification";

/**
 * GET /api/admin/events/[id]/verify
 * Performs full server-side pre-publication verification check on an event.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(req, [
    "President",
    "Vice President",
    "Admin",
    "AVISHKAR Member",
    "admin",
  ]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { id: eventId } = await params;
  const { searchParams } = new URL(req.url);
  const enforceProductionUrl = searchParams.get("enforceProductionUrl") === "true";

  try {
    const report = await verifyEventForPublishing(eventId, {
      req,
      enforceProductionUrl,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verifying event";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/events/[id]/verify
 * Allows passing custom verification options (e.g. enforceProductionUrl, custom baseUrl).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(req, [
    "President",
    "Vice President",
    "Admin",
    "AVISHKAR Member",
    "admin",
  ]);
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

    const report = await verifyEventForPublishing(eventId, {
      req,
      baseUrl,
      enforceProductionUrl,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verifying event";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
