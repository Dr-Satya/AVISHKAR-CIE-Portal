import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { generateFormDefinition, validateFormDefinition } from "@/lib/aiFormBuilder";

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      prompt,
      eventName,
      eventTitle,
      category,
      teamSizeMin,
      teamSizeMax,
      feeAmount,
      registrationStartDate,
      registrationEndDate,
      eventId,
    } = body;

    // 1. Resolve & validate Event Name (Required)
    const rawName = eventName !== undefined ? eventName : eventTitle;
    let finalTitle = typeof rawName === "string" ? rawName.trim() : "";

    if (eventId && !finalTitle) {
      const { getStoredEvents } = await import("@/lib/dataStore");
      const storedEvents = getStoredEvents();
      const match = storedEvents.find((e) => e.id === eventId);
      if (match) {
        finalTitle = match.title.trim();
      }
    }

    if (!finalTitle) {
      return NextResponse.json(
        { success: false, error: "Event name is required." },
        { status: 400 }
      );
    }

    // 2. Validate Team Member Capacity
    const parsedMin = teamSizeMin !== undefined && teamSizeMin !== null ? Number(teamSizeMin) : 2;
    const parsedMax = teamSizeMax !== undefined && teamSizeMax !== null ? Number(teamSizeMax) : 4;

    if (isNaN(parsedMin) || parsedMin < 1 || !Number.isInteger(parsedMin)) {
      return NextResponse.json(
        { success: false, error: "Minimum team members must be a whole number of at least 1." },
        { status: 400 }
      );
    }

    if (isNaN(parsedMax) || parsedMax < parsedMin || !Number.isInteger(parsedMax)) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum team members must be greater than or equal to minimum team members.",
        },
        { status: 400 }
      );
    }

    // 3. Validate Schedule Dates
    if (registrationStartDate && registrationEndDate) {
      const start = new Date(registrationStartDate).getTime();
      const end = new Date(registrationEndDate).getTime();
      if (start > end) {
        return NextResponse.json(
          { success: false, error: "Registration opening date cannot be after closing date." },
          { status: 400 }
        );
      }
    }

    // 4. Validate Registration Fee
    let parsedFee: number | undefined = undefined;
    if (feeAmount !== undefined && feeAmount !== null && feeAmount !== "") {
      parsedFee = Number(feeAmount);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return NextResponse.json(
          { success: false, error: "Registration fee must be a non-negative number (INR)." },
          { status: 400 }
        );
      }
    }

    // 5. Construct Prompt
    let finalPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const isIndividual = parsedMin === 1 && parsedMax === 1;

    if (!finalPrompt) {
      if (isIndividual) {
        finalPrompt = `Create official registration form for "${finalTitle}". Participation model: Individual (1 participant). Category: ${category || "Competition"}. Collect verified student identification, academic school/branch, contact details, and event-specific domain questions.`;
      } else {
        finalPrompt = `Create official registration form for "${finalTitle}". Participation model: Team-based (${parsedMin} to ${parsedMax} members). Category: ${category || "Competition"}. Collect verified student identification, academic school/branch, team designation, declared team size, team member details, and event-specific domain questions.`;
      }
    }

    const generated = await generateFormDefinition({
      prompt: finalPrompt,
      eventTitle: finalTitle,
      category: category?.trim() || "General",
      teamSizeMin: parsedMin,
      teamSizeMax: parsedMax,
      feeAmount: parsedFee,
      registrationStartDate,
      registrationEndDate,
    });

    const validation = validateFormDefinition(generated.fields);

    await logAdminAction({
      action: "AI_FORM_GENERATED",
      actor: auth.session.user,
      targetType: "event_form",
      targetId: eventId || "manual_config",
      metadata: {
        eventName: finalTitle,
        formTitle: generated.formTitle,
        provider: generated.providerUsed,
        teamSizeMin: parsedMin,
        teamSizeMax: parsedMax,
        questionCount: generated.fields.length,
      },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      form: generated,
      valid: validation.valid,
      validationErrors: validation.errors,
      providerUsed: generated.providerUsed,
      eventTitle: finalTitle,
      teamSizeMin: parsedMin,
      teamSizeMax: parsedMax,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error generating form via AI";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
