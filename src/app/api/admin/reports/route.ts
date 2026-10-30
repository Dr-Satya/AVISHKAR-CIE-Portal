import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import {
  getStoredRegistrations,
  getStoredEvents,
  getStoredFormSubmissions,
} from "@/lib/dataStore";
import { RegistrationRecord } from "@/types/admin";

/**
 * Sanitizes a single cell for CSV output to prevent CSV / Spreadsheet formula injection.
 * Any cell value starting with '=', '+', '-', '@', '\t', or '\r' is prefixed with a single quote.
 */
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Strip formula prefixes or escape them with a leading single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, [
    "President",
    "Vice President",
    "Admin",
    "admin",
  ]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const isCsvExport =
    searchParams.get("export") === "csv" ||
    searchParams.get("format") === "csv" ||
    req.headers.get("accept")?.includes("text/csv");

  const allRegistrations = getStoredRegistrations();
  const allEvents = getStoredEvents();
  const allFormSubmissions = getStoredFormSubmissions();

  // Apply real filters
  let filtered = allRegistrations;

  if (eventId && eventId !== "ALL") {
    filtered = filtered.filter((r) => r.event_id === eventId);
  }

  if (dateFrom) {
    const fromTime = new Date(dateFrom).getTime();
    filtered = filtered.filter((r) => {
      const regTime = new Date(r.created_at || r.payment_date).getTime();
      return regTime >= fromTime;
    });
  }

  if (dateTo) {
    // End of day
    const toTime = new Date(`${dateTo}T23:59:59.999Z`).getTime();
    filtered = filtered.filter((r) => {
      const regTime = new Date(r.created_at || r.payment_date).getTime();
      return regTime <= toTime;
    });
  }

  // Handle CSV Export
  if (isCsvExport) {
    await logAdminAction({
      action: "REPORTS_CSV_EXPORTED",
      actor: auth.session.user,
      targetType: "reports",
      targetId: "all",
      metadata: {
        recordCount: filtered.length,
        eventId: eventId || "ALL",
        dateFrom,
        dateTo,
      },
      token: auth.session.token,
    });

    const headers = [
      "Registration Number",
      "Student Name",
      "Student ID",
      "Email Address",
      "Contact Number",
      "School",
      "Program",
      "Year of Joining",
      "Transaction ID",
      "Fee Amount (INR)",
      "Payment Status",
      "Payment Date",
      "Verified By",
      "Submission Timestamp",
    ];

    const csvRows: string[] = [headers.map(sanitizeCsvCell).join(",")];

    for (const r of filtered) {
      const row = [
        r.registration_number || r.id,
        r.student_name,
        r.student_id,
        r.email,
        r.contact_number,
        r.school,
        r.program,
        r.year_of_joining,
        r.transaction_id,
        r.fee_amount !== null && r.fee_amount !== undefined ? r.fee_amount : 100,
        r.payment_status,
        r.payment_date,
        r.verified_by || "",
        r.created_at,
      ];
      csvRows.push(row.map(sanitizeCsvCell).join(","));
    }

    const csvContent = csvRows.join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="avishkar_report_${Date.now()}.csv"`,
      },
    });
  }

  // 1. Payment Verification Breakdown
  const paymentCounts = {
    pending: filtered.filter(
      (r) => r.payment_status === "pending_verification" || !r.payment_status
    ).length,
    verified: filtered.filter((r) => r.payment_status === "verified").length,
    rejected: filtered.filter((r) => r.payment_status === "rejected").length,
    total: filtered.length,
  };

  // 2. Registrations Per Event
  const registrationsByEvent = allEvents.map((evt) => {
    const directCount = filtered.filter((r) => r.event_id === evt.id).length;
    const formCount = allFormSubmissions.filter((s) => s.eventId === evt.id).length;
    const verifiedDirect = filtered.filter(
      (r) => r.event_id === evt.id && r.payment_status === "verified"
    ).length;

    return {
      eventId: evt.id,
      eventTitle: evt.title,
      category: evt.category,
      status: evt.status,
      count: directCount + formCount,
      verifiedCount: verifiedDirect,
      formSubmissionsCount: formCount,
    };
  });

  // Main Fest general registrations (where event_id is null or not linked)
  const generalRegsCount = filtered.filter((r) => !r.event_id).length;
  const verifiedGeneralRegs = filtered.filter(
    (r) => !r.event_id && r.payment_status === "verified"
  ).length;

  registrationsByEvent.unshift({
    eventId: "main-pass",
    eventTitle: "AVISHKAR Main Fest & Track Pass",
    category: "General",
    status: "published",
    count: generalRegsCount,
    verifiedCount: verifiedGeneralRegs,
    formSubmissionsCount: 0,
  });

  // 3. Registrations By Academic Year / Year of Joining
  const yearCountsMap: Record<string, number> = {};
  for (const r of filtered) {
    const key = r.year_of_joining || r.academic_year || "Not Specified";
    yearCountsMap[key] = (yearCountsMap[key] || 0) + 1;
  }
  const registrationsByAcademicYear = Object.entries(yearCountsMap).map(
    ([year, count]) => ({
      year,
      count,
    })
  );

  // 4. Registrations By Academic School
  const schoolCountsMap: Record<string, number> = {};
  for (const r of filtered) {
    const key = r.school || "Other / Undefined";
    schoolCountsMap[key] = (schoolCountsMap[key] || 0) + 1;
  }
  const registrationsBySchool = Object.entries(schoolCountsMap).map(
    ([school, count]) => ({
      school,
      count,
    })
  );

  // 5. Registrations By Degree / Program
  const programCountsMap: Record<string, number> = {};
  for (const r of filtered) {
    const key = r.program || r.course || "Other / Undefined";
    programCountsMap[key] = (programCountsMap[key] || 0) + 1;
  }
  const registrationsByProgram = Object.entries(programCountsMap)
    .map(([program, count]) => ({ program, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 6. Registration Trends Over Time (Grouped by Date)
  const trendsMap: Record<string, number> = {};
  for (const r of filtered) {
    const dateStr = r.created_at
      ? new Date(r.created_at).toISOString().split("T")[0]
      : r.payment_date
      ? new Date(r.payment_date).toISOString().split("T")[0]
      : "Unknown";
    trendsMap[dateStr] = (trendsMap[dateStr] || 0) + 1;
  }
  const registrationTrends = Object.entries(trendsMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    success: true,
    totalRecords: filtered.length,
    paymentCounts,
    registrationsByEvent,
    registrationsByAcademicYear,
    registrationsBySchool,
    registrationsByProgram,
    registrationTrends,
    totalFormSubmissions: allFormSubmissions.length,
    summary: {
      totalRegistrations: filtered.length,
      verifiedPayments: paymentCounts.verified,
      pendingPayments: paymentCounts.pending,
      rejectedPayments: paymentCounts.rejected,
    },
    breakdown: {
      byEvent: registrationsByEvent,
      byYear: registrationsByAcademicYear,
      bySchool: registrationsBySchool,
      byProgram: registrationsByProgram,
      trends: registrationTrends,
    },
  });
}
