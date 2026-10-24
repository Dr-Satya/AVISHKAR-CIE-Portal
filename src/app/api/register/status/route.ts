import { NextRequest, NextResponse } from "next/server";
import { getStoredRegistrations } from "@/lib/dataStore";
import { getAdminSupabaseConfig } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";

  if (!query) {
    return NextResponse.json(
      { success: false, error: "Student ID / Enrolment Number or Registration Number is required." },
      { status: 400 }
    );
  }

  const cleanQuery = query.toLowerCase();

  // 1. Check local dataStore first
  const localList = getStoredRegistrations();
  const localMatch = localList.find(
    (r) =>
      r.registration_number?.toLowerCase() === cleanQuery ||
      r.student_id?.toLowerCase() === cleanQuery
  );

  if (localMatch) {
    return NextResponse.json({
      success: true,
      found: true,
      registration: {
        registrationNumber: localMatch.registration_number,
        studentName: localMatch.student_name,
        studentId: localMatch.student_id,
        school: localMatch.school,
        program: localMatch.program,
        yearOfJoining: localMatch.year_of_joining,
        paymentStatus: localMatch.payment_status || "pending_verification",
        studentVerificationStatus: localMatch.student_verification_status || "pending",
        studentVerificationNotes: localMatch.student_verification_notes || null,
        studentVerifiedAt: localMatch.student_verified_at || null,
        adminReviewNotes: localMatch.admin_review_notes || null,
        paymentVerifiedAt: localMatch.verified_at || null,
        transactionId: localMatch.transaction_id,
        submittedAt: localMatch.payment_date,
        hasStartupOrProject: localMatch.has_startup_or_project || null,
        startupTitle: localMatch.startup_title || localMatch.project_name || null,
        startupStage: localMatch.startup_stage || null,
        studentRole: localMatch.student_role || localMatch.project_role || null,
        teamStructure: localMatch.team_structure || null,
        teamMembers: localMatch.team_members || [],
        supportNeeded: localMatch.support_needed || [],
        technologiesUsed: localMatch.technologies_used || null,
      },
    });
  }

  // 2. Check Supabase REST
  const config = getAdminSupabaseConfig();
  if (config.isConfigured) {
    try {
      const restUrl = `${config.url}/rest/v1/registrations?or=(registration_number.ilike.${encodeURIComponent(
        query
      )},student_id.ilike.${encodeURIComponent(query)})&select=registration_number,student_name,student_id,school,program,year_of_joining,payment_status,student_verification_status,student_verification_notes,student_verified_at,admin_review_notes,verified_at,transaction_id,payment_date&limit=1`;

      const res = await fetch(restUrl, {
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.serviceRoleKey || config.anonKey}`,
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const match = rows[0];
          return NextResponse.json({
            success: true,
            found: true,
            registration: {
              registrationNumber: match.registration_number,
              studentName: match.student_name,
              studentId: match.student_id,
              school: match.school,
              program: match.program,
              yearOfJoining: match.year_of_joining,
              paymentStatus: match.payment_status || "pending_verification",
              studentVerificationStatus: match.student_verification_status || "pending",
              studentVerificationNotes: match.student_verification_notes || null,
              studentVerifiedAt: match.student_verified_at || null,
              adminReviewNotes: match.admin_review_notes || null,
              paymentVerifiedAt: match.verified_at || null,
              transactionId: match.transaction_id,
              submittedAt: match.payment_date,
            },
          });
        }
      }
    } catch {
      // Supabase lookup fallback
    }
  }

  return NextResponse.json(
    {
      success: false,
      found: false,
      error: "No AVISHKAR 2026 registration found matching that Student ID or Registration Number.",
    },
    { status: 404 }
  );
}
