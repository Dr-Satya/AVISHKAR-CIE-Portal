import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, getAdminSupabaseConfig, getAuthorizedSupabaseHeaders } from "@/lib/adminAuth";
import { DashboardStats } from "@/types/admin";
import { getStoredRegistrations, getStoredEvents, getStoredMembers } from "@/lib/dataStore";


export async function GET(req: NextRequest) {
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

    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    // Fetch registrations from Supabase REST with exact count header
    let registrations: Record<string, unknown>[] = [];
    let exactDbCount: number | null = null;
    const restUrl = `${config.url}/rest/v1/registrations?select=*&order=created_at.desc`;

    try {
      const res = await fetch(restUrl, {
        method: "GET",
        headers: {
          ...headers,
          Prefer: "count=exact",
        },
      });

      if (!res.ok) {
        // If error is due to specific column, retry with legacy core fields
        const fallbackUrl = `${config.url}/rest/v1/registrations?select=id,registration_number,student_name,student_id,school,program,year_of_joining,payment_status,student_verification_status,admin_review_notes,student_verification_notes,created_at,updated_at&order=created_at.desc`;
        const fallbackRes = await fetch(fallbackUrl, {
          method: "GET",
          headers: {
            ...headers,
            Prefer: "count=exact",
          },
        });

        if (fallbackRes.ok) {
          const contentRange = fallbackRes.headers.get("content-range");
          if (contentRange) {
            const match = contentRange.match(/\/(\d+)$/);
            if (match) exactDbCount = parseInt(match[1], 10);
          }
          registrations = await fallbackRes.json();
        }
      } else {
        const contentRange = res.headers.get("content-range");
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)$/);
          if (match) exactDbCount = parseInt(match[1], 10);
        }
        registrations = await res.json();
      }
    } catch (fetchErr) {
      console.warn("Supabase registration fetch in stats error:", fetchErr);
    }

    if (!Array.isArray(registrations)) {
      registrations = [];
    }

    // Merge in any records from local persistent store with robust deduplication
    const localRecords = getStoredRegistrations();
    const dedupedMap = new Map<string, Record<string, unknown>>();

    // Helper to get normalized deduplication keys
    const getKey = (r: Record<string, unknown>) => {
      if (r.id) return `id:${String(r.id).trim().toLowerCase()}`;
      if (r.registration_number) return `reg:${String(r.registration_number).trim().toUpperCase()}`;
      if (r.student_id) return `stu:${String(r.student_id).trim().toLowerCase()}`;
      return null;
    };

    // First populate from Supabase records
    for (const r of registrations) {
      const primaryKey = getKey(r) || `temp:${Math.random()}`;
      dedupedMap.set(primaryKey, r);
    }

    // Merge in local store records (preserving more recent status decisions)
    for (const loc of localRecords) {
      const locObj = loc as unknown as Record<string, unknown>;
      const primaryKey = getKey(locObj);

      let existingKey: string | null = null;
      if (primaryKey && dedupedMap.has(primaryKey)) {
        existingKey = primaryKey;
      } else {
        // Check secondary keys
        for (const [key, existing] of dedupedMap.entries()) {
          const idMatch = loc.id && existing.id && String(loc.id) === String(existing.id);
          const regMatch = loc.registration_number && existing.registration_number &&
            String(loc.registration_number).toUpperCase() === String(existing.registration_number).toUpperCase();
          const stuMatch = loc.student_id && existing.student_id &&
            String(loc.student_id).toLowerCase() === String(existing.student_id).toLowerCase();

          if (idMatch || regMatch || stuMatch) {
            existingKey = key;
            break;
          }
        }
      }

      if (existingKey) {
        // Merge records giving priority to the most recently updated decision
        const existing = dedupedMap.get(existingKey)!;
        const locUpdated = loc.updated_at ? new Date(loc.updated_at).getTime() : 0;
        const existingUpdated = existing.updated_at ? new Date(existing.updated_at as string).getTime() : 0;

        if (locUpdated >= existingUpdated) {
          dedupedMap.set(existingKey, { ...existing, ...locObj });
        }
      } else if (primaryKey) {
        dedupedMap.set(primaryKey, locObj);
      }
    }

    const unifiedRegistrations = Array.from(dedupedMap.values());

    // Calculate actual figures from authentic database records
    // Total includes pending, approved, and rejected registrations (never filtered by status)
    const totalRegistrations = exactDbCount !== null && exactDbCount > unifiedRegistrations.length
      ? exactDbCount
      : unifiedRegistrations.length;

    let pendingStudentVerification = 0;
    let pendingPaymentVerification = 0;
    let approvedRegistrations = 0;
    let rejectedRegistrations = 0;
    let paymentsApproved = 0;
    let paymentsRejected = 0;
    let pendingRegistrations = 0;

    const schoolCounts: Record<string, number> = {
      SOES: 0,
      SOHAS: 0,
      SOAS: 0,
      Other: 0,
    };

    for (const record of unifiedRegistrations) {
      const pStatus = (record.payment_status as string) || "pending_verification";

      // Student verification status check with fallback to admin_review_notes
      let sStatus = record.student_verification_status as string | undefined;
      const notes = record.admin_review_notes as string | undefined;
      if (!sStatus && notes) {
        if (notes.includes("[STUDENT_STATUS: verified]")) {
          sStatus = "verified";
        } else if (notes.includes("[STUDENT_STATUS: rejected]")) {
          sStatus = "rejected";
        }
      }
      if (!sStatus) {
        sStatus = "pending";
      }

      if (pStatus === "pending_verification") {
        pendingPaymentVerification++;
      }

      if (sStatus === "pending") {
        pendingStudentVerification++;
      }

      const isStudentApproved = sStatus === "verified";
      const isPaymentApproved = pStatus === "verified";
      const isStudentRejected = sStatus === "rejected";
      const isPaymentRejected = pStatus === "rejected";

      // Requirement 2 & 3: Final approval requires BOTH verified; Rejection of either rejects overall
      const isApproved = isStudentApproved && isPaymentApproved;
      const isRejected = isStudentRejected || isPaymentRejected;
      // Pending registrations strictly require an administrative decision (exclude rejected and approved)
      const isPending = !isApproved && !isRejected;

      if (isPending) {
        pendingRegistrations++;
      }

      // Payments verified / approved
      if (isPaymentApproved) {
        paymentsApproved++;
      }

      // Payments rejected (strictly payment rejections)
      if (isPaymentRejected) {
        paymentsRejected++;
      }

      if (isApproved) {
        approvedRegistrations++;
      }

      if (isRejected) {
        rejectedRegistrations++;
      }

      const school = ((record.school as string) || "").toUpperCase();
      if (school.includes("SOES")) schoolCounts.SOES++;
      else if (school.includes("SOHAS")) schoolCounts.SOHAS++;
      else if (school.includes("SOAS")) schoolCounts.SOAS++;
      else if (school) schoolCounts.Other++;
    }

    const allEvents = getStoredEvents();
    const publishedEvents = allEvents.filter((e) => e.status === "published").length;
    const totalEvents = allEvents.length;
    const pendingEventApprovals = allEvents.filter((e) => e.status === "proposed").length;
    const membersList = getStoredMembers();
    const activeMembers = membersList.filter((m) => m.status === "active").length || membersList.length || 12;

    const stats: DashboardStats = {
      totalRegistrations,
      pendingRegistrations,
      pendingStudentVerification,
      pendingPaymentVerification,
      approvedRegistrations,
      rejectedRegistrations,
      paymentsApproved,
      paymentsRejected,
      totalEvents,
      pendingEventApprovals,
      publishedEvents,
      activeMembers,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        stats,
        schoolCounts,
        recentRegistrations: unifiedRegistrations.slice(0, 5),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Dashboard stats error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error calculating statistics.",
      },
      { status: 500 }
    );
  }
}
