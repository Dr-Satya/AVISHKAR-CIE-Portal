import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import { getGoogleFormsConfigStatus } from "@/lib/googleForms";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const status = getGoogleFormsConfigStatus();

  return NextResponse.json({
    success: true,
    status,
  });
}
