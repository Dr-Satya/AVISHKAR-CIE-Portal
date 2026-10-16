import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { verifyGoogleFormUrl, verifyGoogleFormViaApi, getGoogleFormsConfigStatus } from "@/lib/googleForms";
import { generateQrCodeDataUrl } from "@/lib/qrCode";
import { getStoredEvents, saveStoredEvent, getStoredForms, saveStoredForm } from "@/lib/dataStore";

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin", "Vice President"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { url, formId, eventId, persist } = body;

    if (!url && !formId) {
      return NextResponse.json(
        { success: false, error: "Either 'url' or 'formId' must be provided for verification." },
        { status: 400 }
      );
    }

    let verificationResult;

    // 1. If formId is given and Google API is configured, try API verification first
    const configStatus = getGoogleFormsConfigStatus();
    if (formId && configStatus.isConfigured) {
      verificationResult = await verifyGoogleFormViaApi(formId);
    } else if (url) {
      verificationResult = await verifyGoogleFormUrl(url);
    } else {
      // formId given but Google Cloud credentials not configured
      // Fallback: construct standard Google Form URLs and verify via HTTP
      const testUrl1 = `https://docs.google.com/forms/d/e/${formId}/viewform`;
      const testUrl2 = `https://docs.google.com/forms/d/${formId}/viewform`;
      let res = await verifyGoogleFormUrl(testUrl1);
      if (!res.verified) {
        res = await verifyGoogleFormUrl(testUrl2);
      }
      verificationResult = res;
    }

    if (!verificationResult.verified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: verificationResult.error || "Google Form verification failed.",
          code: verificationResult.code || "VERIFICATION_FAILED",
          status: verificationResult.status,
        },
        { status: 422 }
      );
    }

    const verifiedResponderUrl = verificationResult.responderUrl!;
    const verifiedFormId = verificationResult.formId || formId;
    const verifiedEditUrl =
      verificationResult.editUrl ||
      (verifiedResponderUrl.includes("/viewform")
        ? verifiedResponderUrl.replace("/viewform", "/edit")
        : undefined);

    let qrCodeDataUrl: string | undefined;

    // 2. If requested to persist to an event and form in database
    if (persist && eventId) {
      const events = getStoredEvents();
      const event = events.find((e) => e.id === eventId);
      if (event) {
        qrCodeDataUrl = await generateQrCodeDataUrl(verifiedResponderUrl);
        event.googleFormId = verifiedFormId;
        event.googleFormUrl = verifiedResponderUrl;
        event.googleFormEditUrl = verifiedEditUrl;
        event.googleFormVerified = true;
        event.googleFormVerifiedAt = new Date().toISOString();
        event.qrCodeDataUrl = qrCodeDataUrl;
        event.formConfigured = true;
        event.updatedAt = new Date().toISOString();
        saveStoredEvent(event);

        const forms = getStoredForms(eventId);
        const existingForm = forms[0];
        if (existingForm) {
          existingForm.googleFormId = verifiedFormId;
          existingForm.googleFormUrl = verifiedResponderUrl;
          existingForm.googleFormEditUrl = verifiedEditUrl;
          existingForm.googleFormVerified = true;
          existingForm.googleFormVerifiedAt = new Date().toISOString();
          existingForm.qrCodeDataUrl = qrCodeDataUrl;
          existingForm.updatedAt = new Date().toISOString();
          saveStoredForm(existingForm);
        }

        await logAdminAction({
          action: "GOOGLE_FORM_VERIFIED",
          actor: auth.session.user,
          targetType: "event",
          targetId: event.id,
          metadata: {
            eventTitle: event.title,
            formId: verifiedFormId,
            responderUrl: verifiedResponderUrl,
          },
          token: auth.session.token,
        });
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      formId: verifiedFormId,
      responderUrl: verifiedResponderUrl,
      editUrl: verifiedEditUrl,
      title: verificationResult.title,
      qrCodeDataUrl,
      message: "Google Form verified and accessible.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error verifying Google Form";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
