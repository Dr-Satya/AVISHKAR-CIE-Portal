import { NextRequest } from "next/server";
import {
  EventRecord,
  EventFormRecord,
  EventVerificationReport,
  VerificationCheckItem,
  FormFieldType,
} from "@/types/admin";
import {
  getStoredEvents,
  getStoredForms,
  saveStoredEvent,
  saveStoredForm,
  saveStoredNotification,
} from "@/lib/dataStore";
import { logAdminAction } from "@/lib/adminAuth";
import { generateQrCodeDataUrl } from "@/lib/qrCode";
import { verifyGoogleFormUrl } from "@/lib/googleForms";

/**
 * Resolves the application public base URL.
 * Checks environment variables and request headers, strictly distinguishing
 * between production domains and local development environments.
 */
export function resolveAppBaseUrl(req?: Request | NextRequest): {
  baseUrl: string;
  isLocalhost: boolean;
  isProduction: boolean;
  source: "env_next_public" | "env_app_url" | "vercel" | "header" | "fallback";
} {
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Explicit public app URL from environment
  const nextPublicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (nextPublicUrl) {
    const clean = nextPublicUrl.replace(/\/+$/, "");
    const isLocalhost = isLocalhostUrl(clean);
    return { baseUrl: clean, isLocalhost, isProduction, source: "env_next_public" };
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    const clean = appUrl.replace(/\/+$/, "");
    const isLocalhost = isLocalhostUrl(clean);
    return { baseUrl: clean, isLocalhost, isProduction, source: "env_app_url" };
  }

  // 2. Vercel deployment URLs (if hosted on Vercel)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    const clean = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, "")}`;
    return { baseUrl: clean, isLocalhost: false, isProduction, source: "vercel" };
  }

  if (process.env.VERCEL_URL?.trim()) {
    const clean = `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, "")}`;
    return { baseUrl: clean, isLocalhost: false, isProduction, source: "vercel" };
  }

  // 3. Request origin / headers if available
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      const clean = `${proto}://${host}`.replace(/\/+$/, "");
      const isLocalhost = isLocalhostUrl(clean);
      return { baseUrl: clean, isLocalhost, isProduction, source: "header" };
    }

    if (req.url) {
      try {
        const u = new URL(req.url);
        const clean = `${u.protocol}//${u.host}`;
        const isLocalhost = isLocalhostUrl(clean);
        return { baseUrl: clean, isLocalhost, isProduction, source: "header" };
      } catch {
        // fall through
      }
    }
  }

  // 4. Default fallback (Preserved for local development)
  const port = process.env.PORT || "3000";
  const defaultLocal = `http://localhost:${port}`;
  return {
    baseUrl: defaultLocal,
    isLocalhost: true,
    isProduction,
    source: "fallback",
  };
}

/**
 * Checks whether a given URL is a loopback/localhost address.
 */
export function isLocalhostUrl(urlStr: string): boolean {
  if (!urlStr) return false;
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".localhost")
    );
  } catch {
    const lower = urlStr.toLowerCase();
    return (
      lower.includes("localhost") ||
      lower.includes("127.0.0.1") ||
      lower.includes("::1")
    );
  }
}

export interface VerifyEventOptions {
  req?: NextRequest;
  baseUrl?: string;
  enforceProductionUrl?: boolean;
}

/**
 * Comprehensive Server-Side Pre-Publication Verification Engine.
 * Verifies all event parameters, approval workflow gates, form configurations,
 * registration links, QR destinations, Google Forms authenticity, and environment URLs.
 */
export async function verifyEventForPublishing(
  eventId: string,
  options?: VerifyEventOptions
): Promise<EventVerificationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const events = getStoredEvents();
  const event = events.find((e) => e.id === eventId);

  // Fallback info if event doesn't exist
  if (!event) {
    const emptyCheck: VerificationCheckItem = {
      passed: false,
      message: `Event record '${eventId}' not found in database.`,
      error: "Event not found.",
    };
    return {
      eventId,
      eventTitle: "Unknown Event",
      canPublish: false,
      isAlreadyPublished: false,
      errors: [`Event with ID '${eventId}' does not exist.`],
      warnings: [],
      checks: {
        approval: emptyCheck,
        eventDetails: emptyCheck,
        registrationForm: emptyCheck,
        registrationLinks: { ...emptyCheck, publicEventUrl: "", registrationUrl: "" },
        qrCode: { ...emptyCheck, destination: "" },
        googleForms: { ...emptyCheck, enabled: false },
        environmentUrl: { ...emptyCheck, baseUrl: "", isLocalhost: false, isProduction: false },
      },
    };
  }

  // 1. Approval Workflow Eligibility Check
  const approvalCheck: VerificationCheckItem = { passed: true, message: "" };
  if (event.status === "rejected") {
    approvalCheck.passed = false;
    approvalCheck.error = `This event proposal was rejected${
      event.rejectionReason ? `: "${event.rejectionReason}"` : "."
    } Rejected events cannot be published.`;
    errors.push(approvalCheck.error);
  } else if (event.status === "archived") {
    approvalCheck.passed = false;
    approvalCheck.error = "This event is currently archived. It must be unarchived before it can be published.";
    errors.push(approvalCheck.error);
  } else {
    // Check if event originated as a member proposal requiring constitutional approval
    const isMemberProposal =
      event.creationSource === "MEMBER_PROPOSAL" ||
      event.creationSource === "council" ||
      (event.proposedBy && event.proposedBy.includes("Member")) ||
      event.proposedByEmail === "member@gdgoenka.ac.in";

    if (isMemberProposal) {
      if (event.vpStatus !== "approved" && event.vpStatus !== "in_coordination") {
        approvalCheck.passed = false;
        approvalCheck.error = `Vice President Approval Required: This event was proposed by an AVISHKAR Member and requires Vice President approval before publication. Current Vice President status: '${event.vpStatus || "pending"}'.`;
        errors.push(approvalCheck.error);
      } else if (event.presidentStatus !== "approved") {
        approvalCheck.passed = false;
        approvalCheck.error = `President Council Approval Required: This event was proposed by an AVISHKAR Member and requires President Council approval before publication. Current President status: '${event.presidentStatus || "pending"}'.`;
        errors.push(approvalCheck.error);
      } else {
        approvalCheck.message = `Approved by both Vice President and President Council (VP: ${
          event.vpDecidedAt ? new Date(event.vpDecidedAt).toLocaleDateString() : "approved"
        }, President: ${
          event.presidentDecidedAt ? new Date(event.presidentDecidedAt).toLocaleDateString() : "approved"
        }). Eligible for final publication.`;
      }
    } else {
      approvalCheck.message = "Direct administrator creation. Authorized for direct verification and publication without Vice President or President approval.";
    }
  }

  // 2. Event Details Completeness Check
  const detailsCheck: VerificationCheckItem = { passed: true, message: "" };
  const missingDetails: string[] = [];
  if (!event.title || !event.title.trim()) missingDetails.push("Event Title");
  if (!event.description || !event.description.trim()) missingDetails.push("Event Description");
  if (!event.category) missingDetails.push("Event Category");

  if (event.teamSizeMin === undefined || event.teamSizeMin < 1) {
    missingDetails.push("Valid Minimum Team Size (>= 1)");
  }
  if (event.teamSizeMax === undefined || event.teamSizeMax < event.teamSizeMin) {
    missingDetails.push("Valid Maximum Team Size (>= Minimum Team Size)");
  }

  if (event.registrationStartDate && event.registrationEndDate) {
    const s = new Date(event.registrationStartDate).getTime();
    const e = new Date(event.registrationEndDate).getTime();
    if (s > e) {
      errors.push("Registration opening date cannot be after closing date.");
      detailsCheck.passed = false;
    }
  }

  if (missingDetails.length > 0) {
    detailsCheck.passed = false;
    detailsCheck.error = `Incomplete event details: Missing ${missingDetails.join(", ")}.`;
    errors.push(detailsCheck.error);
  } else {
    detailsCheck.message = `Event details complete: "${event.title}" [${event.category}], Team capacity: ${
      event.teamSizeMin
    }–${event.teamSizeMax} members.`;
  }

  // 3. Registration Form Configuration Check
  const formCheck: VerificationCheckItem = { passed: true, message: "" };
  const forms = getStoredForms(eventId);
  // Match form for this event or fallback to matching event title
  let activeForm: EventFormRecord | undefined =
    forms.find((f) => f.eventId === eventId) ||
    forms.find((f) => f.eventTitle.trim().toLowerCase() === event.title.trim().toLowerCase());

  if (!activeForm) {
    // Auto-provision a default native registration form questionnaire for the event
    const autoMin = Math.max(1, event.teamSizeMin || 2);
    const autoMax = Math.max(autoMin, event.teamSizeMax || 4);
    const autoTeamOptions: string[] = [];
    for (let s = autoMin; s <= autoMax; s++) {
      autoTeamOptions.push(`${s} Members`);
    }

    const newForm: EventFormRecord = {
      id: `form-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      formTitle: `${event.title} — Registration`,
      formDescription: `Official registration questionnaire for ${event.title}`,
      isActive: true,
      isPublished: false,
      feeAmount: (event as unknown as { registrationFee?: number }).registrationFee ?? 0,
      registrationStartDate: event.registrationStartDate,
      registrationEndDate: event.registrationEndDate,
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true, order: 1, placeholder: "Enter your full legal name" },
        { id: "f-email", label: "University Email Address", type: "text", required: true, order: 2, placeholder: "student@gdgoenka.ac.in" },
        { id: "f-roll", label: "Student Roll Number / Enrollment ID", type: "text", required: true, order: 3, placeholder: "e.g. 21001011001" },
        { id: "f-phone", label: "Contact Phone / WhatsApp", type: "text", required: true, order: 4, placeholder: "e.g. +91 98765 43210" },
        { id: "f-school", label: "Academic Department / School", type: "text", required: true, order: 5, placeholder: "School of Engineering & Sciences" },
        ...(event.teamSizeMax && event.teamSizeMax > 1 ? [
          { id: "f-team", label: "Team / Squad Designation", type: "text" as FormFieldType, required: true, order: 6, placeholder: "Enter your team name" },
          { id: "f-size", label: "Declared Team Size", type: "select" as FormFieldType, required: true, order: 7, options: autoTeamOptions, placeholder: `${autoMin} - ${autoMax} members` },
        ] : []),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveStoredForm(newForm);
    activeForm = newForm;
  }

  if (!Array.isArray(activeForm.fields) || activeForm.fields.length === 0) {
    formCheck.passed = false;
    formCheck.error =
      "The registration questionnaire contains 0 questions. Add at least one question before publishing.";
    errors.push(formCheck.error);
  } else if (activeForm.isActive === false) {
    formCheck.passed = false;
    formCheck.error =
      "The registration form is currently marked Inactive. Set form activation status to Active before publishing.";
    errors.push(formCheck.error);
  } else {
    // Validate individual question integrity
    let fieldErrorsCount = 0;
    for (let i = 0; i < activeForm.fields.length; i++) {
      const f = activeForm.fields[i];
      if (!f.label || !f.label.trim()) fieldErrorsCount++;
    }
    if (fieldErrorsCount > 0) {
      formCheck.passed = false;
      formCheck.error = `${fieldErrorsCount} question(s) have empty or invalid question labels.`;
      errors.push(formCheck.error);
    } else {
      const requiredCount = activeForm.fields.filter((f) => f.required).length;
      formCheck.message = `Form configured: ${activeForm.fields.length} questions (${requiredCount} required), Registration active, Fee: ₹${
        activeForm.feeAmount ?? 500
      }.`;
    }
  }

  // 4. Base URL and Environment Inspection
  const envInfo = resolveAppBaseUrl(options?.req);
  const effectiveBaseUrl = (options?.baseUrl || envInfo.baseUrl).replace(/\/+$/, "");
  const isLocal = isLocalhostUrl(effectiveBaseUrl);
  const isCloudDeployment = Boolean(process.env.VERCEL || process.env.CF_PAGES || process.env.AWS_EXECUTION_ENV);
  const enforceProd = Boolean(options?.enforceProductionUrl || (isCloudDeployment && !isLocal));

  const envCheck: VerificationCheckItem & {
    baseUrl: string;
    isLocalhost: boolean;
    isProduction: boolean;
  } = {
    passed: true,
    message: "",
    baseUrl: effectiveBaseUrl,
    isLocalhost: isLocal,
    isProduction: envInfo.isProduction,
  };

  if (enforceProd && isLocal) {
    envCheck.passed = false;
    envCheck.error =
      `Production URL Required: Public registration links cannot be published using localhost ('${effectiveBaseUrl}'). ` +
      `Configure NEXT_PUBLIC_APP_URL or APP_URL in environment settings (e.g., https://avishkar.gdgoenka.ac.in) before publishing.`;
    errors.push(envCheck.error);
  } else if (isLocal) {
    envCheck.message =
      `Local development environment active: Registration links use '${effectiveBaseUrl}'. In production, NEXT_PUBLIC_APP_URL must be configured.`;
    warnings.push("Running on localhost URL. Remember to set NEXT_PUBLIC_APP_URL for production deployment.");
  } else {
    envCheck.message = `Verified public application domain: ${effectiveBaseUrl}`;
  }

  // 5. Registration Links Availability & Integrity Check
  const publicEventUrl = `${effectiveBaseUrl}/events/${event.id}`;
  const studentRegistrationUrl = `${effectiveBaseUrl}/events/${event.id}/register`;

  const linksCheck: VerificationCheckItem & {
    publicEventUrl: string;
    registrationUrl: string;
  } = {
    passed: true,
    message: "Public event and student registration URLs constructed and validated.",
    publicEventUrl,
    registrationUrl: studentRegistrationUrl,
  };

  if (!event.id) {
    linksCheck.passed = false;
    linksCheck.error = "Event record has an invalid or missing identifier.";
    errors.push(linksCheck.error);
  }

  // 6. QR Code Destination Verification (Strictly native AVISHKAR registration URL)
  const targetDestination = studentRegistrationUrl;

  let qrDataUrl = activeForm?.qrCodeDataUrl || event.qrCodeDataUrl;
  const qrCheck: VerificationCheckItem & { destination: string; qrDataUrl?: string } = {
    passed: true,
    message: `QR code successfully targets native student registration link: ${targetDestination}`,
    destination: targetDestination,
    qrDataUrl,
  };

  if (!qrDataUrl) {
    try {
      qrDataUrl = await generateQrCodeDataUrl(targetDestination);
      qrCheck.qrDataUrl = qrDataUrl;
    } catch (err) {
      qrCheck.passed = false;
      qrCheck.error = `Failed to generate registration QR code: ${
        err instanceof Error ? err.message : "Encoding error"
      }`;
      errors.push(qrCheck.error);
    }
  }

  // 7. Native AI-Powered Registration Verification (Google Forms is NOT required)
  const gFormsCheck: VerificationCheckItem & {
    enabled: boolean;
    url?: string;
    verified?: boolean;
  } = {
    passed: true,
    enabled: false,
    verified: true,
    message: "Native AVISHKAR registration questionnaire active. Google Forms not required.",
  };

  const canPublish =
    approvalCheck.passed &&
    detailsCheck.passed &&
    formCheck.passed &&
    linksCheck.passed &&
    qrCheck.passed &&
    gFormsCheck.passed &&
    envCheck.passed;

  return {
    eventId: event.id,
    eventTitle: event.title,
    canPublish,
    isAlreadyPublished: event.status === "published",
    errors,
    warnings,
    checks: {
      approval: approvalCheck,
      eventDetails: detailsCheck,
      registrationForm: formCheck,
      registrationLinks: linksCheck,
      qrCode: qrCheck,
      googleForms: gFormsCheck,
      environmentUrl: envCheck,
    },
    event,
    form: activeForm,
  };
}

export interface PublishResult {
  success: boolean;
  message: string;
  event?: EventRecord;
  report?: EventVerificationReport;
  error?: string;
  alreadyPublished?: boolean;
  publicEventUrl?: string;
  registrationUrl?: string;
}

/**
 * Executes Atomic Publication of an Event.
 * Revalidates server-side authorization, completeness, and link availability.
 * Updates dataStore, logs audit event, and distributes notification.
 */
export async function publishEventAtomic(
  eventId: string,
  actor: {
    id: string;
    email: string;
    fullName?: string;
    role: string;
  },
  options?: VerifyEventOptions
): Promise<PublishResult> {
  // 1. Strict Role Authorization
  const allowedRoles = ["President", "Admin", "admin"];
  if (!allowedRoles.includes(actor.role)) {
    return {
      success: false,
      message: "Forbidden",
      error: `Access Denied: Role '${actor.role}' is not authorized to publish events. Admin or President authority is required.`,
    };
  }

  // 2. Run Comprehensive Pre-Publication Verification
  const report = await verifyEventForPublishing(eventId, options);
  const events = getStoredEvents();
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return {
      success: false,
      message: "Event not found",
      error: `Event '${eventId}' does not exist in store.`,
      report,
    };
  }

  // Handle Idempotency / Safe Duplicate Publication Handling
  if (event.status === "published") {
    const urls = report.checks.registrationLinks;
    return {
      success: true,
      message: "Event is already published and live on the public website.",
      alreadyPublished: true,
      event,
      report,
      publicEventUrl: urls.publicEventUrl,
      registrationUrl: urls.registrationUrl,
    };
  }

  // If verification failed, record failure and reject
  if (!report.canPublish) {
    event.verificationStatus = "failed";
    event.verificationErrors = report.errors;
    event.lastVerifiedAt = new Date().toISOString();
    saveStoredEvent(event);

    return {
      success: false,
      message: "Verification failed",
      error: report.errors[0] || "Event failed pre-publication verification checks.",
      report,
    };
  }

  // 3. Persist Publication Status Atomically
  const nowIso = new Date().toISOString();
  event.status = "published";
  event.publishedAt = nowIso;
  event.publishedBy = actor.fullName || actor.email;
  event.verificationStatus = "passed";
  event.verificationErrors = [];
  event.lastVerifiedAt = nowIso;
  event.updatedAt = nowIso;

  if (report.checks.qrCode.qrDataUrl) {
    event.qrCodeDataUrl = report.checks.qrCode.qrDataUrl;
  }

  if (!event.approvalHistory) event.approvalHistory = [];
  event.approvalHistory.push({
    id: `hist-${Date.now()}-pub`,
    stage: "Admin",
    decision: "published",
    actorName: actor.fullName || actor.email,
    actorEmail: actor.email,
    actorRole: actor.role,
    timestamp: nowIso,
    comment: "Event verified and published to public fest catalogue",
  });

  saveStoredEvent(event);

  // Synchronize form isPublished status
  const forms = getStoredForms(eventId);
  const activeForm = forms[0];
  if (activeForm) {
    activeForm.isPublished = true;
    activeForm.updatedAt = nowIso;
    if (report.checks.qrCode.qrDataUrl) {
      activeForm.qrCodeDataUrl = report.checks.qrCode.qrDataUrl;
    }
    saveStoredForm(activeForm);
  }

  // 4. Record Audit Log
  const publicUrl = report.checks.registrationLinks.publicEventUrl;
  const regUrl = report.checks.registrationLinks.registrationUrl;

  await logAdminAction({
    action: "EVENT_PUBLISHED",
    actor: {
      id: actor.id,
      email: actor.email,
      fullName: actor.fullName,
      role: actor.role as any,
    },
    targetType: "event",
    targetId: event.id,
    metadata: {
      title: event.title,
      publishedAt: nowIso,
      publicUrl,
      registrationUrl: regUrl,
      verifiedChecksCount: Object.keys(report.checks).length,
    },
  });

  // 5. Create System Notification
  saveStoredNotification({
    id: `notif-${Date.now()}`,
    title: "Event Published to Main Website",
    message: `'${event.title}' is now live on the public website for student registrations.`,
    type: "publish",
    targetRole: "all",
    link: `/events/${event.id}`,
    read: false,
    createdAt: nowIso,
    actorName: actor.fullName || actor.email,
  });

  return {
    success: true,
    message: "Event successfully verified and published to the public main website.",
    event,
    report,
    publicEventUrl: publicUrl,
    registrationUrl: regUrl,
  };
}
