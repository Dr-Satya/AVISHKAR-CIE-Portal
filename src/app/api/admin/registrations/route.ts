import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, getAdminSupabaseConfig, getAuthorizedSupabaseHeaders } from "@/lib/adminAuth";
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

    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    // Fetch all registrations for authorized admin
    let rawRecords: Record<string, unknown>[] = [];
    const restUrl = `${config.url}/rest/v1/registrations?select=*&order=created_at.desc`;

    try {
      const res = await fetch(restUrl, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const fallbackUrl = `${config.url}/rest/v1/registrations?select=id,registration_number,student_name,student_id,email,contact_number,gender,dob,school,program,year_of_joining,previous_work_description,project_name,project_role,technologies_used,project_link,reason_for_joining,leadership_interest,transaction_id,payment_date,fee_amount,receipt_file_path,receipt_file_name,receipt_file_size,receipt_mime_type,remarks,payment_status,admin_review_notes,verified_at,verified_by,created_at,updated_at&order=created_at.desc`;
        const fallbackRes = await fetch(fallbackUrl, { method: "GET", headers });
        if (fallbackRes.ok) {
          rawRecords = await fallbackRes.json();
        }
      } else {
        rawRecords = await res.json();
      }
    } catch {
      // In case Supabase table is unreachable or empty
    }

    if (!Array.isArray(rawRecords)) {
      rawRecords = [];
    }

    // Merge in any records from local persistent store
    const localRecords = getStoredRegistrations();
    for (const loc of localRecords) {
      const exists = rawRecords.some(
        (r) =>
          r.registration_number === loc.registration_number ||
          (r.student_id && loc.student_id && String(r.student_id).toLowerCase() === loc.student_id.toLowerCase())
      );
      if (!exists) {
        rawRecords.push(loc as unknown as Record<string, unknown>);
      }
    }

    // Normalize student_verification_status on each record
    const normalized: RegistrationRecord[] = rawRecords.map((r) => {
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

      return true;
    });

    return NextResponse.json({
      success: true,
      count: filtered.length,
      totalCount: normalized.length,
      registrations: filtered,
    });
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
