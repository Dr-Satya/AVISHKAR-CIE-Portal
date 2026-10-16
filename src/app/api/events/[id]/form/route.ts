import { NextRequest, NextResponse } from "next/server";
import { getStoredEvents, getStoredForms, saveStoredFormSubmission, saveStoredRegistration } from "@/lib/dataStore";
import { EventFormSubmission, RegistrationRecord } from "@/types/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const events = getStoredEvents();
  const event = events.find((e) => e.id === eventId);

  if (!event || event.status !== "published") {
    return NextResponse.json(
      { success: false, error: "Event is not published or does not exist." },
      { status: 404 }
    );
  }

  const forms = getStoredForms(eventId);
  const activeForm = forms.find((f) => f.isActive && f.isPublished !== false);

  if (!activeForm) {
    return NextResponse.json(
      { success: false, error: "No published registration form configured for this event." },
      { status: 404 }
    );
  }

  const now = new Date();
  if (activeForm.registrationStartDate) {
    const start = new Date(activeForm.registrationStartDate);
    if (now < start) {
      return NextResponse.json(
        {
          success: false,
          error: `Registration for this event has not opened yet. It opens on ${start.toLocaleDateString()}.`,
          code: "REGISTRATION_NOT_OPEN",
        },
        { status: 400 }
      );
    }
  }

  if (activeForm.registrationEndDate) {
    const end = new Date(activeForm.registrationEndDate);
    const endTimestamp =
      activeForm.registrationEndDate.length === 10
        ? new Date(`${activeForm.registrationEndDate}T23:59:59.999Z`).getTime()
        : end.getTime();
    if (now.getTime() > endTimestamp) {
      return NextResponse.json(
        {
          success: false,
          error: `Registration for this event has closed on ${end.toLocaleDateString()}.`,
          code: "REGISTRATION_CLOSED",
        },
        { status: 400 }
      );
    }
  }

  const effectiveMin = activeForm.teamSizeMin !== undefined ? activeForm.teamSizeMin : event.teamSizeMin;
  const effectiveMax = activeForm.teamSizeMax !== undefined ? activeForm.teamSizeMax : event.teamSizeMax;
  const effectiveTitle = activeForm.eventTitle || event.title;

  return NextResponse.json({
    success: true,
    event: {
      id: event.id,
      title: effectiveTitle,
      category: event.category,
      teamSizeMin: effectiveMin,
      teamSizeMax: effectiveMax,
    },
    form: activeForm,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const events = getStoredEvents();
    const event = events.find((e) => e.id === eventId);

    if (!event || event.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Cannot submit registration for unpublished or non-existent event." },
        { status: 404 }
      );
    }

    const forms = getStoredForms(eventId);
    const activeForm = forms.find((f) => f.isActive && f.isPublished !== false);

    if (!activeForm) {
      return NextResponse.json(
        { success: false, error: "Registration is not currently open for this event." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (activeForm.registrationStartDate) {
      const start = new Date(activeForm.registrationStartDate);
      if (now < start) {
        return NextResponse.json(
          {
            success: false,
            error: `Registration for this event opens on ${start.toLocaleDateString()}.`,
            code: "REGISTRATION_NOT_OPEN",
          },
          { status: 400 }
        );
      }
    }

    if (activeForm.registrationEndDate) {
      const end = new Date(activeForm.registrationEndDate);
      const endTimestamp =
        activeForm.registrationEndDate.length === 10
          ? new Date(`${activeForm.registrationEndDate}T23:59:59.999Z`).getTime()
          : end.getTime();
      if (now.getTime() > endTimestamp) {
        return NextResponse.json(
          {
            success: false,
            error: `Registration for this event closed on ${end.toLocaleDateString()}.`,
            code: "REGISTRATION_CLOSED",
          },
          { status: 400 }
        );
      }
    }

    const body = await req.json();
    const { studentId, studentEmail, studentName, responses } = body;

    if (!studentId || !studentEmail || !studentName) {
      return NextResponse.json(
        { success: false, error: "Student identification (Name, ID, Email) is required." },
        { status: 400 }
      );
    }

    // Team capacity validation during student submission
    const effectiveMin = activeForm.teamSizeMin !== undefined ? activeForm.teamSizeMin : event.teamSizeMin;
    const effectiveMax = activeForm.teamSizeMax !== undefined ? activeForm.teamSizeMax : event.teamSizeMax;

    if (effectiveMax > 1 || effectiveMin > 1) {
      const teamSizeField = activeForm.fields.find(
        (f) =>
          f.label.toLowerCase().includes("team size") ||
          f.label.toLowerCase().includes("squad size") ||
          f.label.toLowerCase().includes("declared team")
      );

      if (teamSizeField && responses) {
        const rawVal = responses[teamSizeField.id];
        if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
          const matchNum = String(rawVal).match(/\d+/);
          const declaredNum = matchNum ? parseInt(matchNum[0], 10) : NaN;
          if (!isNaN(declaredNum)) {
            if (declaredNum < effectiveMin || declaredNum > effectiveMax) {
              return NextResponse.json(
                {
                  success: false,
                  error: `Declared team size (${declaredNum}) must be between ${effectiveMin} and ${effectiveMax} members.`,
                  fieldErrors: {
                    [teamSizeField.id]: `Team size must be between ${effectiveMin} and ${effectiveMax} members.`,
                  },
                },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // Server-side validation of form responses
    const errors: Record<string, string> = {};
    for (const field of activeForm.fields) {
      // Skip legacy free-form textarea in favor of structured per-member cards
      if (field.label.toLowerCase().includes("additional team member details")) continue;

      const val = responses ? responses[field.id] : undefined;
      if (field.required && (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0))) {
        errors[field.id] = `${field.label} is required.`;
      }
    }

    // Validate structured team member fields if team size > 1
    let declaredSize = 1;
    if (responses?.declared_team_size) {
      declaredSize = Number(responses.declared_team_size) || 1;
    } else {
      const tsField = activeForm.fields.find(
        (f) =>
          f.label.toLowerCase().includes("team size") ||
          f.label.toLowerCase().includes("squad size") ||
          f.label.toLowerCase().includes("declared team")
      );
      if (tsField && responses?.[tsField.id]) {
        const m = String(responses[tsField.id]).match(/\d+/);
        if (m) declaredSize = parseInt(m[0], 10);
      }
    }

    if (declaredSize > 1) {
      for (let m = 1; m <= declaredSize; m++) {
        const mName = responses?.[`member_${m}_name`] || (m === 1 ? studentName : "");
        const mEmail = responses?.[`member_${m}_email`] || (m === 1 ? studentEmail : "");
        const mEnroll = responses?.[`member_${m}_enrollment`] || (m === 1 ? studentId : "");

        if (!mName || !String(mName).trim()) {
          errors[`member_${m}_name`] = `Member ${m} Full Name is required.`;
        }
        if (!mEmail || !String(mEmail).trim()) {
          errors[`member_${m}_email`] = `Member ${m} Mail ID is required.`;
        }
        if (!mEnroll || !String(mEnroll).trim()) {
          errors[`member_${m}_enrollment`] = `Member ${m} Enrollment is required.`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: "Validation failed on event questionnaire.", fieldErrors: errors },
        { status: 400 }
      );
    }


    const submission: EventFormSubmission = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      eventId,
      formId: activeForm.id,
      studentId: String(studentId).trim(),
      studentEmail: String(studentEmail).trim().toLowerCase(),
      studentName: String(studentName).trim(),
      responses: responses || {},
      submittedAt: new Date().toISOString(),
    };

    saveStoredFormSubmission(submission);

    // Also persist a native RegistrationRecord so the student registration appears in the administration portal
    const regRecord: RegistrationRecord = {
      id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      registration_number: `AVK-${Date.now().toString().slice(-6)}`,
      student_name: String(studentName).trim(),
      student_id: String(studentId).trim(),
      email: String(studentEmail).trim().toLowerCase(),
      contact_number: String(responses?.["contact_number"] || responses?.["phone"] || "N/A"),
      gender: null,
      dob: null,
      school: String(responses?.["school"] || responses?.["department"] || "GD Goenka University"),
      program: String(responses?.["program"] || "Undergraduate"),
      year_of_joining: String(responses?.["year"] || "2026"),
      course: null,
      branch: null,
      academic_year: "2026",
      event_id: event.id,
      event_title: event.title,
      previous_work_description: responses?.["previous_work"] ? String(responses["previous_work"]) : null,
      project_name: responses?.["project_name"] ? String(responses["project_name"]) : null,
      project_role: responses?.["project_role"] ? String(responses["project_role"]) : null,
      technologies_used: responses?.["technologies_used"] ? String(responses["technologies_used"]) : null,
      project_link: responses?.["project_link"] ? String(responses["project_link"]) : null,
      reason_for_joining: null,
      leadership_interest: null,
      form_version: String(activeForm.version || 1),
      transaction_id: String(responses?.["transaction_id"] || responses?.["utr"] || `EVT-${Date.now().toString().slice(-4)}`),
      payment_date: new Date().toISOString(),
      fee_amount: activeForm.feeAmount ?? 0,
      receipt_file_path: "",
      receipt_file_name: "",
      receipt_file_size: 0,
      receipt_mime_type: "",
      remarks: `Registered for ${event.title} via Native AI Questionnaire`,
      payment_status: activeForm.feeAmount === 0 || !activeForm.feeAmount ? "verified" : "pending_verification",
      admin_review_notes: null,
      verified_at: activeForm.feeAmount === 0 || !activeForm.feeAmount ? new Date().toISOString() : null,
      verified_by: activeForm.feeAmount === 0 || !activeForm.feeAmount ? "system" : null,
      student_verification_status: "verified",
      student_verified_at: new Date().toISOString(),
      student_verified_by: "system",
      student_verification_notes: "Auto-verified participant via native questionnaire",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveStoredRegistration(regRecord);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      registrationNumber: regRecord.registration_number,
      submittedAt: submission.submittedAt,
      message: `Registration response for ${event.title} successfully submitted.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error submitting event registration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
