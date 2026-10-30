import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequest,
  getAdminSupabaseConfig,
  getAuthorizedSupabaseHeaders,
  isValidUuid,
} from "@/lib/adminAuth";
import { RegistrationRecord } from "@/types/admin";
import { getStoredRegistrations } from "@/lib/dataStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Admin session required.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration ID is required.",
        },
        { status: 400 }
      );
    }

    // 1. Check local persistent store first
    const localStore = getStoredRegistrations();
    const localRecord = localStore.find(
      (r) => r.id === id || r.registration_number === id || r.student_id === id
    );

    const config = getAdminSupabaseConfig();
    let remoteRecord: Record<string, unknown> | null = null;

    if (config.isConfigured) {
      try {
        const headers = getAuthorizedSupabaseHeaders(session.token);
        const isUuid = isValidUuid(id);
        const restUrl = isUuid
          ? `${config.url}/rest/v1/registrations?id=eq.${encodeURIComponent(id)}&select=*`
          : `${config.url}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(id)}&select=*`;
        const res = await fetch(restUrl, { method: "GET", headers });
        if (res.ok) {
          const records = await res.json();
          if (Array.isArray(records) && records.length > 0) {
            remoteRecord = records[0];
          }
        }
      } catch {
        // Supabase network failure fallback
      }
    }

    const raw = localRecord || remoteRecord;
    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration not found.",
        },
        { status: 404 }
      );
    }

    let sStatus = raw.student_verification_status as string;
    const reviewNotes = raw.admin_review_notes as string;
    if (!sStatus && reviewNotes) {
      if (reviewNotes.includes("[STUDENT_STATUS: verified]")) {
        sStatus = "verified";
      } else if (reviewNotes.includes("[STUDENT_STATUS: rejected]")) {
        sStatus = "rejected";
      }
    }
    if (!sStatus) sStatus = "pending";

    const record: RegistrationRecord = {
      ...raw,
      student_verification_status: sStatus as any,
      payment_status: (raw.payment_status as any) || "pending_verification",
      verification_history: (raw.verification_history as any) || [],
    } as unknown as RegistrationRecord;

    return NextResponse.json({
      success: true,
      registration: record,
    });
  } catch (error: any) {
    console.error("Single registration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error fetching registration.",
      },
      { status: 500 }
    );
  }
}
