import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";


export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized. Admin session required.",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: session.user,
  });
}
