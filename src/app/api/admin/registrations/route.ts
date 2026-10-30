import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequest,
  getAdminSupabaseConfig,
  getAuthorizedSupabaseHeaders,
  isValidUuid,
} from "@/lib/adminAuth";
import { RegistrationRecord } from "@/types/admin";
import { getStoredRegistrations } from "@/lib/dataStore";

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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const school = searchParams.get("school")?.trim() || "";
    const program = searchParams.get("program")?.trim() || "";
    const year = searchParams.get("year")?.trim() || "";
    const studentStatus = searchParams.get("studentStatus")?.trim() || "";
    const paymentStatus = searchParams.get("paymentStatus")?.trim() || "";
    const overallStatus = searchParams.get("overallStatus")?.trim() || searchParams.get("status")?.trim() || "";

    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    // Fetch all registrations for authorized admin with count=exact
    let rawRecords: Record<string, unknown>[] = [];
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
        const fullColumns = "id,registration_number,student_name,student_id,admission_number,email,contact_number,gender,dob,school,program,year_of_joining,previous_work_description,project_name,project_role,technologies_used,project_link,has_startup_or_project,team_leader_name,team_leader_enrollment,team_leader_email,team_leader_contact,student_role,team_structure,team_members,startup_title,startup_details,startup_stage,support_needed,other_support_details,reason_for_joining,leadership_interest,transaction_id,payment_date,fee_amount,receipt_file_path,receipt_file_name,receipt_file_size,receipt_mime_type,id_card_file_path,id_card_file_name,id_card_file_size,id_card_mime_type,remarks,payment_status,student_verification_status,admin_review_notes,student_verification_notes,verified_at,verified_by,created_at,updated_at";
        const fallbackUrl = `${config.url}/rest/v1/registrations?select=${fullColumns}&order=created_at.desc`;
        let fallbackRes = await fetch(fallbackUrl, {
          method: "GET",
          headers: {
            ...headers,
            Prefer: "count=exact",
          },
        });
        if (!fallbackRes.ok) {
          // Narrower fallback if 011 migration columns don't exist yet in remote Supabase table
          const legacyColumns = "id,registration_number,student_name,student_id,email,contact_number,gender,dob,school,program,year_of_joining,previous_work_description,project_name,project_role,technologies_used,project_link,reason_for_joining,leadership_interest,transaction_id,payment_date,fee_amount,receipt_file_path,receipt_file_name,receipt_file_size,receipt_mime_type,remarks,payment_status,student_verification_status,admin_review_notes,student_verification_notes,verified_at,verified_by,created_at,updated_at";
          fallbackRes = await fetch(`${config.url}/rest/v1/registrations?select=${legacyColumns}&order=created_at.desc`, {
            method: "GET",
            headers: { ...headers, Prefer: "count=exact" },
          });
        }
        if (fallbackRes.ok) {
          const contentRange = fallbackRes.headers.get("content-range");
          if (contentRange) {
            const match = contentRange.match(/\/(\d+)$/);
            if (match) exactDbCount = parseInt(match[1], 10);
          }
          rawRecords = await fallbackRes.json();
        }
      } else {
        const contentRange = res.headers.get("content-range");
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)$/);
          if (match) exactDbCount = parseInt(match[1], 10);
        }
        rawRecords = await res.json();
      }
    } catch {
      // In case Supabase table is unreachable or empty
    }

    if (!Array.isArray(rawRecords)) {
      rawRecords = [];
    }

    // Merge in any records from local persistent store with robust deduplication
    const localRecords = getStoredRegistrations();
    const dedupedMap = new Map<string, Record<string, unknown>>();

    const getKey = (r: Record<string, unknown>) => {
      if (r.id) return `id:${String(r.id).trim().toLowerCase()}`;
      if (r.registration_number) return `reg:${String(r.registration_number).trim().toUpperCase()}`;
      if (r.student_id) return `stu:${String(r.student_id).trim().toLowerCase()}`;
      return null;
    };

    // First populate from Supabase records
    for (const r of rawRecords) {
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
        const existing = dedupedMap.get(existingKey)!;
        const locUpdated = loc.updated_at ? new Date(loc.updated_at).getTime() : 0;
        const existingUpdated = existing.updated_at ? new Date(existing.updated_at as string).getTime() : 0;

        const realDbUuid = isValidUuid(existing.id)
          ? (existing.id as string)
          : isValidUuid(loc.id)
          ? (loc.id as string)
          : null;

        if (locUpdated >= existingUpdated) {
          dedupedMap.set(existingKey, {
            ...existing,
            ...locObj,
            ...(realDbUuid ? { id: realDbUuid } : {}),
            id_card_file_path: (locObj.id_card_file_path as string) || (existing.id_card_file_path as string) || null,
            receipt_file_path: (locObj.receipt_file_path as string) || (existing.receipt_file_path as string) || null,
          });
        } else {
          dedupedMap.set(existingKey, {
            ...locObj,
            ...existing,
            ...(realDbUuid ? { id: realDbUuid } : {}),
            id_card_file_path: (existing.id_card_file_path as string) || (locObj.id_card_file_path as string) || null,
            receipt_file_path: (existing.receipt_file_path as string) || (locObj.receipt_file_path as string) || null,
          });
        }
      } else if (primaryKey) {
        dedupedMap.set(primaryKey, locObj);
      }
    }

    const unifiedRecords = Array.from(dedupedMap.values());

    // Normalize student_verification_status on each record
    const normalized: RegistrationRecord[] = unifiedRecords.map((r) => {
      let sStatus = r.student_verification_status as string | undefined;
      const notes = r.admin_review_notes as string | undefined;
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

      return {
        ...(r as unknown as RegistrationRecord),
        student_verification_status: sStatus as RegistrationRecord["student_verification_status"],
        payment_status: ((r.payment_status as string) || "pending_verification") as RegistrationRecord["payment_status"],
      };
    });

    // Apply Filters in memory
    const filtered = normalized.filter((r) => {
      if (search) {
        const nameMatch = (r.student_name || "").toLowerCase().includes(search);
        const idMatch = (r.student_id || "").toLowerCase().includes(search);
        const emailMatch = (r.email || "").toLowerCase().includes(search);
        const utrMatch = (r.transaction_id || "").toLowerCase().includes(search);
        const regMatch = (r.registration_number || "").toLowerCase().includes(search);

        if (!nameMatch && !idMatch && !emailMatch && !utrMatch && !regMatch) {
          return false;
        }
      }

      if (school && school !== "ALL") {
        if ((r.school || "").toUpperCase() !== school.toUpperCase()) {
          return false;
        }
      }

      if (program && program !== "ALL") {
        if ((r.program || "").toLowerCase() !== program.toLowerCase()) {
          return false;
        }
      }

      if (year && year !== "ALL") {
        if ((r.year_of_joining || "").toString() !== year.toString()) {
          return false;
        }
      }

      if (studentStatus && studentStatus !== "ALL") {
        if (r.student_verification_status !== studentStatus) {
          return false;
        }
      }

      if (paymentStatus && paymentStatus !== "ALL") {
        if (r.payment_status !== paymentStatus) {
          return false;
        }
      }

      if (overallStatus && overallStatus !== "ALL") {
        const isStudentApproved = r.student_verification_status === "verified";
        const isPaymentApproved = r.payment_status === "verified";
        const isStudentRejected = r.student_verification_status === "rejected";
        const isPaymentRejected = r.payment_status === "rejected";

        const isApproved = isStudentApproved && isPaymentApproved;
        const isRejected = isStudentRejected || isPaymentRejected;
        const isPending = !isApproved && !isRejected;

        if (overallStatus === "approved" && !isApproved) return false;
        if (overallStatus === "rejected" && !isRejected) return false;
        if (overallStatus === "pending" && !isPending) return false;
      }

      return true;
    });

    const finalTotalCount = exactDbCount !== null && exactDbCount > normalized.length
      ? exactDbCount
      : normalized.length;

    return NextResponse.json(
      {
        success: true,
        count: filtered.length,
        totalCount: finalTotalCount,
        registrations: filtered,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Registrations list API error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error fetching registrations.",
      },
      { status: 500 }
    );
  }
}
