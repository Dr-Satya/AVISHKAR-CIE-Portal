import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { EventFormRecord, EventRecord, FormField, FormVersionSnapshot } from "@/types/admin";
import { getStoredEvents, getStoredForms, saveStoredEvent, saveStoredForm } from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const eventName = searchParams.get("eventName");

  let forms = getStoredForms(eventId || undefined);
  if (eventName) {
    const query = eventName.trim().toLowerCase();
    forms = forms.filter((f) => f.eventTitle.toLowerCase().includes(query));
  }

  return NextResponse.json({
    success: true,
    forms,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      eventId: rawEventId,
      eventName,
      eventTitle,
      formTitle,
      formDescription,
      fields,
      isActive,
      isPublished,
      feeAmount,
      teamSizeMin,
      teamSizeMax,
      registrationStartDate,
      registrationEndDate,
      changeNote,
    } = body;

    // 1. Resolve & validate Event Name (Required)
    const rawName = eventName !== undefined ? eventName : eventTitle;
    let resolvedEventTitle = typeof rawName === "string" ? rawName.trim() : "";
    if (!resolvedEventTitle && rawEventId) {
      const existingEvt = getStoredEvents().find((e) => e.id === rawEventId);
      if (existingEvt) {
        resolvedEventTitle = existingEvt.title.trim();
      }
    }

    if (!resolvedEventTitle) {
      return NextResponse.json(
        { success: false, error: "Event name is required." },
        { status: 400 }
      );
    }

    if (!formTitle || !formTitle.trim()) {
      return NextResponse.json(
        { success: false, error: "Form title is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, error: "Fields array is required." },
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

    // 3. Validate registration fee
    if (feeAmount !== undefined && feeAmount !== null && feeAmount !== "") {
      const numFee = Number(feeAmount);
      if (isNaN(numFee) || numFee < 0) {
        return NextResponse.json(
          { success: false, error: "Registration fee must be a valid non-negative number." },
          { status: 400 }
        );
      }
    }

    // 4. Validate schedule dates
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

    // 5. Validate field definitions
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.id || !f.label || !f.label.trim()) {
        return NextResponse.json(
          { success: false, error: `Field at position ${i + 1} must have a non-empty question label.` },
          { status: 400 }
        );
      }
      if (!f.type) {
        return NextResponse.json(
          { success: false, error: `Field '${f.label}' must have a valid input type.` },
          { status: 400 }
        );
      }
    }

    // 6. Event Record Linking or Creation (No orphan or foreign-key violations)
    const allEvents = getStoredEvents();
    let targetEvent: EventRecord | undefined = undefined;

    if (rawEventId) {
      targetEvent = allEvents.find((e) => e.id === rawEventId);
    }
    if (!targetEvent) {
      targetEvent = allEvents.find(
        (e) => e.title.trim().toLowerCase() === resolvedEventTitle.toLowerCase()
      );
    }

    const nowIso = new Date().toISOString();
    let finalEventId: string;

    if (targetEvent) {
      // Update existing event details to align with the form builder configuration
      finalEventId = targetEvent.id;
      targetEvent.title = resolvedEventTitle;
      targetEvent.teamSizeMin = parsedMin;
      targetEvent.teamSizeMax = parsedMax;
      if (body.description) targetEvent.description = body.description.trim();
      if (body.category) targetEvent.category = body.category;
      if (body.venuePlaceholder) targetEvent.venuePlaceholder = body.venuePlaceholder.trim();
      if (body.proposedDateTime) targetEvent.proposedDateTime = body.proposedDateTime.trim();
      if (registrationStartDate) targetEvent.registrationStartDate = registrationStartDate;
      if (registrationEndDate) targetEvent.registrationEndDate = registrationEndDate;
      targetEvent.formConfigured = true;
      targetEvent.updatedAt = nowIso;
      saveStoredEvent(targetEvent);
    } else {
      // Create a valid, compliant EventRecord for this new event (ready for review & verification, not auto-published)
      finalEventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newEvent: EventRecord = {
        id: finalEventId,
        title: resolvedEventTitle,
        slug: resolvedEventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: body.description?.trim() || formDescription?.trim() || `Official competition track for ${resolvedEventTitle}.`,
        category: (body.category as any) || "General",
        status: "approved", // Ready for review and verification, not auto-published to public site
        proposedBy: auth.session.user.fullName || auth.session.user.email,
        proposedByEmail: auth.session.user.email,
        approvedBy: auth.session.user.fullName || auth.session.user.email,
        presidentStatus: "not_required",
        vpStatus: "not_required",
        creationSource: "ADMIN_DIRECT",
        teamSizeMin: parsedMin,
        teamSizeMax: parsedMax,
        datePlaceholder: body.proposedDateTime?.trim() || (registrationStartDate ? `From ${registrationStartDate}` : "Avishkar 2026"),
        proposedDateTime: body.proposedDateTime?.trim() || "",
        venuePlaceholder: body.venuePlaceholder?.trim() || "GD Goenka University Campus",
        registrationStartDate: registrationStartDate || undefined,
        registrationEndDate: registrationEndDate || undefined,
        assignedMemberIds: [],
        formConfigured: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      saveStoredEvent(newEvent);
      targetEvent = newEvent;
    }

    // 7. Save Event Form Record
    const existingForms = getStoredForms(finalEventId);
    const existing = existingForms[0];
    let savedForm: EventFormRecord;

    const parsedFee =
      feeAmount !== undefined && feeAmount !== null && feeAmount !== ""
        ? Number(feeAmount)
        : existing?.feeAmount !== undefined
        ? existing.feeAmount
        : 100;

    if (existing) {
      const historyList: FormVersionSnapshot[] = Array.isArray(existing.history) ? [...existing.history] : [];
      const currentVersion = existing.version || 1;

      // Add historical snapshot
      historyList.push({
        version: currentVersion,
        formTitle: existing.formTitle,
        eventTitle: existing.eventTitle,
        teamSizeMin: existing.teamSizeMin,
        teamSizeMax: existing.teamSizeMax,
        feeAmount: existing.feeAmount,
        registrationStartDate: existing.registrationStartDate,
        registrationEndDate: existing.registrationEndDate,
        fields: existing.fields,
        updatedAt: existing.updatedAt || nowIso,
        updatedBy: auth.session.user.email,
        changeNote: changeNote || "Form configuration updated",
      });

      savedForm = {
        ...existing,
        eventId: finalEventId,
        eventTitle: resolvedEventTitle,
        formTitle,
        formDescription: formDescription || "",
        fields: fields as FormField[],
        teamSizeMin: parsedMin,
        teamSizeMax: parsedMax,
        feeAmount: parsedFee,
        registrationStartDate: registrationStartDate !== undefined ? registrationStartDate : existing.registrationStartDate,
        registrationEndDate: registrationEndDate !== undefined ? registrationEndDate : existing.registrationEndDate,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : existing.isPublished ?? true,
        version: currentVersion + 1,
        history: historyList,
        updatedAt: nowIso,
      };

      if (existing.feeAmount !== undefined && existing.feeAmount !== parsedFee) {
        await logAdminAction({
          action: "REGISTRATION_FEE_CHANGED",
          actor: auth.session.user,
          targetType: "event_form",
          targetId: savedForm.id,
          metadata: {
            eventId: finalEventId,
            eventTitle: savedForm.eventTitle,
            previousFee: existing.feeAmount,
            newFee: parsedFee,
          },
          token: auth.session.token,
        });
      }

      if (isActive !== undefined && existing.isActive !== Boolean(isActive)) {
        await logAdminAction({
          action: Boolean(isActive) ? "FORM_ACTIVATED" : "FORM_DEACTIVATED",
          actor: auth.session.user,
          targetType: "event_form",
          targetId: savedForm.id,
          metadata: { eventId: finalEventId, formTitle, isActive: Boolean(isActive) },
          token: auth.session.token,
        });
      }
    } else {
      savedForm = {
        id: `form-${Date.now()}`,
        eventId: finalEventId,
        eventTitle: resolvedEventTitle,
        formTitle,
        formDescription: formDescription || "",
        fields: fields as FormField[],
        teamSizeMin: parsedMin,
        teamSizeMax: parsedMax,
        feeAmount: parsedFee,
        registrationStartDate: registrationStartDate || undefined,
        registrationEndDate: registrationEndDate || undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        version: 1,
        history: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    }

    saveStoredForm(savedForm);

    await logAdminAction({
      action: "FORM_SAVED",
      actor: auth.session.user,
      targetType: "event_form",
      targetId: savedForm.id,
      metadata: {
        eventId: finalEventId,
        eventName: resolvedEventTitle,
        formTitle,
        teamSizeMin: parsedMin,
        teamSizeMax: parsedMax,
        version: savedForm.version,
        fieldCount: fields.length,
        feeAmount: savedForm.feeAmount,
        isActive: savedForm.isActive,
        isPublished: savedForm.isPublished,
      },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      form: savedForm,
      eventId: finalEventId,
      event: targetEvent,
      message: `Registration form configuration (v${savedForm.version || 1}) saved successfully.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving form configuration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
