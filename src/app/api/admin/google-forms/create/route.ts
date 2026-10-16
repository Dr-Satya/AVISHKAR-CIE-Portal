import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { createRealGoogleForm, verifyGoogleFormUrl } from "@/lib/googleForms";
import { generateQrCodeDataUrl } from "@/lib/qrCode";
import {
  getStoredEvents,
  saveStoredEvent,
  getStoredForms,
  saveStoredForm,
} from "@/lib/dataStore";
import { EventFormRecord, FormField } from "@/types/admin";

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin", "Vice President"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { eventId, title, description, fields, existingGoogleFormUrl, unlink } = body;

    if (!eventId) {
      return NextResponse.json({ success: false, error: "eventId is required." }, { status: 400 });
    }

    const events = getStoredEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found." }, { status: 404 });
    }

    // 0. Handle Unlinking / Disconnecting an existing form
    if (unlink === true) {
      delete event.googleFormId;
      delete event.googleFormUrl;
      delete event.googleFormEditUrl;
      delete event.googleFormVerified;
      delete event.googleFormVerifiedAt;
      event.updatedAt = new Date().toISOString();
      saveStoredEvent(event);

      const forms = getStoredForms(eventId);
      const existingForm = forms[0];
      if (existingForm) {
        delete existingForm.googleFormId;
        delete existingForm.googleFormUrl;
        delete existingForm.googleFormEditUrl;
        delete existingForm.googleFormVerified;
        delete existingForm.googleFormVerifiedAt;
        existingForm.updatedAt = new Date().toISOString();
        saveStoredForm(existingForm);
      }

      await logAdminAction({
        action: "GOOGLE_FORM_UNLINKED",
        actor: auth.session.user,
        targetType: "event",
        targetId: event.id,
        metadata: { eventTitle: event.title },
        token: auth.session.token,
      });

      return NextResponse.json({
        success: true,
        message: "Google Form unlinked successfully.",
      });
    }

    // 1. Linking an existing Google Form URL directly with LIVE ACCESSIBILITY VERIFICATION
    if (existingGoogleFormUrl && typeof existingGoogleFormUrl === "string" && existingGoogleFormUrl.trim()) {
      const cleanUrl = existingGoogleFormUrl.trim();

      // Live verification of the responder URL
      const verification = await verifyGoogleFormUrl(cleanUrl);
      if (!verification.verified) {
        return NextResponse.json(
          {
            success: false,
            verified: false,
            error:
              verification.error ||
              "The provided Google Form link failed accessibility verification. Please check the URL and ensure the form exists and allows responses.",
            code: verification.code || "VERIFICATION_FAILED",
            status: verification.status,
          },
          { status: 422 }
        );
      }

      const verifiedUrl = verification.responderUrl || cleanUrl;
      const extractedId = verification.formId || `manual-${Date.now()}`;
      const editUrl =
        verification.editUrl ||
        (verifiedUrl.includes("/viewform") ? verifiedUrl.replace("/viewform", "/edit") : verifiedUrl);
      const qrDataUrl = await generateQrCodeDataUrl(verifiedUrl);

      event.googleFormId = extractedId;
      event.googleFormUrl = verifiedUrl;
      event.googleFormEditUrl = editUrl;
      event.googleFormVerified = true;
      event.googleFormVerifiedAt = new Date().toISOString();
      event.qrCodeDataUrl = qrDataUrl;
      event.formConfigured = true;
      event.updatedAt = new Date().toISOString();
      saveStoredEvent(event);

      // Also update EventFormRecord
      const forms = getStoredForms(eventId);
      const existingForm = forms[0];
      if (existingForm) {
        existingForm.googleFormId = extractedId;
        existingForm.googleFormUrl = verifiedUrl;
        existingForm.googleFormEditUrl = editUrl;
        existingForm.googleFormVerified = true;
        existingForm.googleFormVerifiedAt = new Date().toISOString();
        existingForm.qrCodeDataUrl = qrDataUrl;
        existingForm.updatedAt = new Date().toISOString();
        saveStoredForm(existingForm);
      } else {
        const newForm: EventFormRecord = {
          id: `form-${eventId}`,
          eventId: event.id,
          eventTitle: event.title,
          formTitle: title || `${event.title} Registration`,
          formDescription: description || "",
          fields: fields || [],
          isActive: true,
          isPublished: true,
          googleFormId: extractedId,
          googleFormUrl: verifiedUrl,
          googleFormEditUrl: editUrl,
          googleFormVerified: true,
          googleFormVerifiedAt: new Date().toISOString(),
          qrCodeDataUrl: qrDataUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveStoredForm(newForm);
      }

      await logAdminAction({
        action: "GOOGLE_FORM_LINKED",
        actor: auth.session.user,
        targetType: "event",
        targetId: event.id,
        metadata: {
          eventTitle: event.title,
          googleFormUrl: verifiedUrl,
          formId: extractedId,
          verified: true,
        },
        token: auth.session.token,
      });

      return NextResponse.json({
        success: true,
        verified: true,
        message: "Google Form verified, linked, and QR code generated successfully.",
        formId: extractedId,
        responderUrl: verifiedUrl,
        editUrl: editUrl,
        qrCodeDataUrl: qrDataUrl,
      });
    }

    // 2. Automated Creation via Google Forms API
    if (!title || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { success: false, error: "Form title and at least one question field are required to create a Google Form." },
        { status: 400 }
      );
    }

    const creationResult = await createRealGoogleForm({
      title: title.trim(),
      description: description?.trim() || "",
      fields: fields as FormField[],
    });

    if (!creationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: creationResult.error,
          code: creationResult.code,
          unsupportedFields: creationResult.unsupportedFields,
        },
        { status: creationResult.code === "GOOGLE_NOT_CONFIGURED" ? 422 : 500 }
      );
    }

    const responderUrl = creationResult.responderUrl!;
    const formId = creationResult.formId!;
    const editUrl = creationResult.editUrl || `https://docs.google.com/forms/d/${formId}/edit`;

    // Generate real QR code for verified responder URL
    const qrCodeDataUrl = await generateQrCodeDataUrl(responderUrl);

    // Persist on EventRecord
    event.googleFormId = formId;
    event.googleFormUrl = responderUrl;
    event.googleFormEditUrl = editUrl;
    event.googleFormVerified = creationResult.verified ?? true;
    event.googleFormVerifiedAt = new Date().toISOString();
    event.qrCodeDataUrl = qrCodeDataUrl;
    event.formConfigured = true;
    event.updatedAt = new Date().toISOString();
    saveStoredEvent(event);

    // Persist on EventFormRecord
    const forms = getStoredForms(eventId);
    const existingForm = forms[0];
    if (existingForm) {
      existingForm.formTitle = title;
      existingForm.formDescription = description || "";
      existingForm.fields = fields;
      existingForm.googleFormId = formId;
      existingForm.googleFormUrl = responderUrl;
      existingForm.googleFormEditUrl = editUrl;
      existingForm.googleFormVerified = creationResult.verified ?? true;
      existingForm.googleFormVerifiedAt = new Date().toISOString();
      existingForm.qrCodeDataUrl = qrCodeDataUrl;
      existingForm.updatedAt = new Date().toISOString();
      saveStoredForm(existingForm);
    } else {
      const newForm: EventFormRecord = {
        id: `form-${eventId}`,
        eventId: event.id,
        eventTitle: event.title,
        formTitle: title,
        formDescription: description || "",
        fields,
        isActive: true,
        isPublished: true,
        googleFormId: formId,
        googleFormUrl: responderUrl,
        googleFormEditUrl: editUrl,
        googleFormVerified: creationResult.verified ?? true,
        googleFormVerifiedAt: new Date().toISOString(),
        qrCodeDataUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveStoredForm(newForm);
    }

    await logAdminAction({
      action: "GOOGLE_FORM_CREATED",
      actor: auth.session.user,
      targetType: "event",
      targetId: event.id,
      metadata: {
        eventTitle: event.title,
        googleFormId: formId,
        responderUrl,
        questionCount: fields.length,
      },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      verified: creationResult.verified ?? true,
      message: "Real Google Form created and verified successfully.",
      formId,
      responderUrl,
      editUrl,
      qrCodeDataUrl,
      unsupportedFields: creationResult.unsupportedFields,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating Google Form";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
