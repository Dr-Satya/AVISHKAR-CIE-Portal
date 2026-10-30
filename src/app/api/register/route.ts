import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  validatePersonalInfo,
  validateAcademicInfo,
  validatePreviousWork,
  validateClubEngagement,
  validatePaymentInfo,
  validateStartupDetails,
} from "@/lib/validations/registration";
import { getSupabaseConfigStatus } from "@/lib/supabase";
import { paymentConfig, isOfficialPaymentConfigured } from "@/config/payment";
import {
  getStoredRegistrations,
  saveStoredRegistration,
  saveStoredNotification,
  saveStoredDocument,
} from "@/lib/dataStore";
import { validateDocumentBuffer } from "@/lib/fileValidation";
import { RegistrationRecord } from "@/types/admin";
import { TeamMemberEntry } from "@/types/registration";
import { sendRegistrationSubmittedEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    // -------------------------------------------------------------------------
    // STEP 0: Pre-Launch Holding Gate
    // Block all submissions, receipt uploads, and registration creation while
    // official dates and payment recipient details remain unconfirmed.
    // -------------------------------------------------------------------------
    if (!isOfficialPaymentConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Registration is currently closed pending official announcement of registration fees and schedule.",
          code: "REGISTRATION_CLOSED",
        },
        { status: 423 }
      );
    }

    const formData = await request.formData();

    // Extract official form fields
    const studentName = (formData.get("studentName") as string) || "";
    const email = (formData.get("email") as string) || "";
    const contactNumber = (formData.get("contactNumber") as string) || "";
    const gender = (formData.get("gender") as string) || "";
    const dob = (formData.get("dob") as string) || "";

    const studentId = (formData.get("studentId") as string) || "";
    const admissionNumber = (formData.get("admissionNumber") as string) || "";
    const idCardFile = formData.get("idCardFile") as File | null;
    const school = (formData.get("school") as string) || "";
    const program = (formData.get("program") as string) || "";
    const yearOfJoining = (formData.get("yearOfJoining") as string) || "";

    // Optional Previous Work / Startup Details
    const previousWorkDescription = (formData.get("previousWorkDescription") as string) || "";
    const projectName = (formData.get("projectName") as string) || "";
    const projectRole = (formData.get("projectRole") as string) || "";
    const technologiesUsed = (formData.get("technologiesUsed") as string) || "";
    const projectLink = (formData.get("projectLink") as string) || "";

    // Optional Startup & Innovation Details (Mentor incubation form)
    const hasStartupOrProject = (formData.get("hasStartupOrProject") as string) || "";
    const teamLeaderName = (formData.get("teamLeaderName") as string) || "";
    const teamLeaderEnrollment = (formData.get("teamLeaderEnrollment") as string) || "";
    const teamLeaderEmail = (formData.get("teamLeaderEmail") as string) || "";
    const teamLeaderContact = (formData.get("teamLeaderContact") as string) || "";
    const studentRole = (formData.get("studentRole") as string) || "";
    const teamStructure = (formData.get("teamStructure") as string) || "";

    let teamMembers: TeamMemberEntry[] = [];
    const rawTeamMembers = formData.get("teamMembers");
    if (typeof rawTeamMembers === "string" && rawTeamMembers.trim()) {
      try {
        const parsed = JSON.parse(rawTeamMembers);
        if (Array.isArray(parsed)) teamMembers = parsed;
      } catch {
        // invalid JSON
      }
    }

    const startupTitle = (formData.get("startupTitle") as string) || "";
    const startupDetails = (formData.get("startupDetails") as string) || "";
    const startupStage = (formData.get("startupStage") as string) || "";

    let supportNeeded: string[] = [];
    const rawSupportNeeded = formData.get("supportNeeded");
    if (typeof rawSupportNeeded === "string" && rawSupportNeeded.trim()) {
      try {
        const parsed = JSON.parse(rawSupportNeeded);
        if (Array.isArray(parsed)) {
          supportNeeded = parsed;
        } else {
          supportNeeded = rawSupportNeeded.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        supportNeeded = rawSupportNeeded.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    const otherSupportDetails = (formData.get("otherSupportDetails") as string) || "";

    const reasonForJoining = (formData.get("reasonForJoining") as string) || "";
    const leadershipInterest = (formData.get("leadershipInterest") as string) || "";

    const transactionId = (formData.get("transactionId") as string) || "";
    const paymentDate = (formData.get("paymentDate") as string) || "";
    const remarks = (formData.get("remarks") as string) || "";
    const receiptFile = formData.get("receiptFile") as File | null;

    // Server-side validation
    const personalErrors = validatePersonalInfo({
      studentName,
      email,
      contactNumber,
      gender: gender as any,
      dob,
    });

    const academicErrors = validateAcademicInfo({
      studentId,
      admissionNumber,
      idCardFile,
      school,
      program,
      yearOfJoining,
    });

    const previousWorkErrors = validatePreviousWork({
      previousWorkDescription,
      projectName,
      projectRole,
      technologiesUsed,
      projectLink,
    });

    const startupErrors = validateStartupDetails({
      hasStartupOrProject: (hasStartupOrProject as any) || undefined,
      teamLeaderName,
      teamLeaderEnrollment,
      teamLeaderEmail,
      teamLeaderContact,
      studentRole: (studentRole as any) || undefined,
      teamStructure: (teamStructure as any) || undefined,
      teamMembers,
      startupTitle,
      startupDetails,
      startupStage: (startupStage as any) || undefined,
      supportNeeded,
      otherSupportDetails,
    });

    const clubErrors = validateClubEngagement({
      reasonForJoining,
      leadershipInterest: leadershipInterest as any,
    });

    const paymentErrors = validatePaymentInfo({
      transactionId,
      paymentDate,
      receiptFile,
    });

    const combinedErrors = {
      ...personalErrors,
      ...academicErrors,
      ...previousWorkErrors,
      ...startupErrors,
      ...clubErrors,
      ...paymentErrors,
    };

    if (Object.keys(combinedErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors: combinedErrors,
          message: "Validation failed. Please review the highlighted fields.",
        },
        { status: 400 }
      );
    }

    const normalizedStudentId = studentId.trim();
    const normalizedAdmissionNumber = admissionNumber.trim();
    const normalizedTransactionId = transactionId.trim().toUpperCase();

    // Check backend Supabase configuration
    const configStatus = getSupabaseConfigStatus();

    // If Supabase credentials are not present, return honest unconfigured status
    if (!configStatus.hasUrl || (!configStatus.hasServiceRoleKey && !configStatus.hasAnonKey)) {
      const provisionalRef = `PROV-REF-${Math.floor(100000 + Math.random() * 900000)}`;

      return NextResponse.json(
        {
          success: true,
          mode: "unconfigured_backend",
          isProvisional: true,
          provisionalReference: provisionalRef,
          registrationNumber: null, // Null to prevent treating provisional references as real persisted IDs
          studentId: normalizedStudentId,
          studentName: studentName.trim(),
          transactionId: normalizedTransactionId,
          paymentStatus: "unconfigured_backend",
          submittedAt: new Date().toISOString(),
          message:
            "Registration data validated successfully in local demo mode. Note: Supabase database is not configured in this environment, so no persistent registration ID was issued.",
          missingRequirements: [
            "NEXT_PUBLIC_SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY (Server-only)",
            "Private Storage Bucket: payment-receipts",
          ],
        },
        { status: 200 }
      );
    }

    // When Supabase is configured:
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    // 1. Check for duplicate in local dataStore
    const storedRegistrations = getStoredRegistrations();
    const isLocalDupStudent = storedRegistrations.some(
      (r) => r.student_id?.toLowerCase() === normalizedStudentId.toLowerCase()
    );
    if (isLocalDupStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "A registration for this Student ID / Roll Number has already been submitted.",
        },
        { status: 409 }
      );
    }
    const isLocalDupTx = storedRegistrations.some(
      (r) => r.transaction_id?.toUpperCase() === normalizedTransactionId.toUpperCase()
    );
    if (isLocalDupTx) {
      return NextResponse.json(
        {
          success: false,
          message: "This Transaction Reference ID has already been submitted for another registration.",
        },
        { status: 409 }
      );
    }

    // 1b. Check for duplicate studentId or transactionId via Supabase REST API (if permissions allow)
    const duplicateCheckUrl = `${supabaseUrl}/rest/v1/registrations?or=(student_id.ilike.${encodeURIComponent(
      normalizedStudentId
    )},transaction_id.ilike.${encodeURIComponent(normalizedTransactionId)})&select=id,student_id,transaction_id`;

    try {
      const duplicateCheckRes = await fetch(duplicateCheckUrl, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (duplicateCheckRes.ok) {
        const existing = await duplicateCheckRes.json();
        if (Array.isArray(existing) && existing.length > 0) {
          const isDuplicateStudent = existing.some(
            (r: any) => r.student_id?.toLowerCase() === normalizedStudentId.toLowerCase()
          );
          return NextResponse.json(
            {
              success: false,
              message: isDuplicateStudent
                ? "A registration for this Student ID / Roll Number has already been submitted."
                : "This Transaction Reference ID has already been submitted for another registration.",
            },
            { status: 409 }
          );
        }
      }
    } catch {
      // In case pre-flight check fails or is denied by RLS, proceed to DB insert where UNIQUE constraints enforce atomicity
    }

    // 2. Upload file to private storage bucket 'payment-receipts' with local fallback
    const regNumber = `AVISHKAR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    let receiptFilePath = "";
    let uploadedStorageUrl = "";
    let receiptDetectedMime = "application/octet-stream";
    let receiptDetectedExt = "bin";
    let receiptFileSize = 0;

    if (receiptFile) {
      const rawReceiptBuffer = await receiptFile.arrayBuffer();
      const receiptValidation = validateDocumentBuffer(rawReceiptBuffer, receiptFile.name, {
        maxBytes: paymentConfig.maxFileSizeMB * 1024 * 1024,
        minBytes: 64,
        allowedMimes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
      });

      if (!receiptValidation.valid || !receiptValidation.buffer) {
        return NextResponse.json(
          {
            success: false,
            message:
              receiptValidation.error ||
              "The uploaded payment receipt is empty, truncated, or malformed. Uploaded file must be a genuine image (JPG, PNG, WebP) or PDF document. Dummy text and fake placeholder files are rejected.",
          },
          { status: 400 }
        );
      }

      receiptDetectedMime = receiptValidation.mimeType!;
      receiptDetectedExt = receiptValidation.extension!;
      const receiptBuffer = receiptValidation.buffer;
      receiptFileSize = receiptValidation.size!;

      const sanitizedFilename = `${regNumber}_${Date.now()}.${receiptDetectedExt}`;
      uploadedStorageUrl = `${supabaseUrl}/storage/v1/object/payment-receipts/${sanitizedFilename}`;

      try {
        const uploadRes = await fetch(uploadedStorageUrl, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": receiptDetectedMime,
            "x-upsert": "true",
          },
          body: receiptBuffer,
        });

        if (uploadRes.ok) {
          receiptFilePath = `payment-receipts/${sanitizedFilename}`;
        } else {
          // Fallback to local storage
          const localReceiptsDir = path.join(process.cwd(), ".data", "receipts");
          if (!fs.existsSync(localReceiptsDir)) {
            fs.mkdirSync(localReceiptsDir, { recursive: true });
          }
          const localFilePath = path.join(localReceiptsDir, sanitizedFilename);
          fs.writeFileSync(localFilePath, Buffer.from(receiptBuffer));
          receiptFilePath = `local:receipts/${sanitizedFilename}`;
        }
      } catch {
        // Fallback to local storage
        const localReceiptsDir = path.join(process.cwd(), ".data", "receipts");
        if (!fs.existsSync(localReceiptsDir)) {
          fs.mkdirSync(localReceiptsDir, { recursive: true });
        }
        const localFilePath = path.join(localReceiptsDir, sanitizedFilename);
        fs.writeFileSync(localFilePath, Buffer.from(receiptBuffer));
        receiptFilePath = `local:receipts/${sanitizedFilename}`;
      }

      // Persist document to multi-tier resilient data store
      try {
        const receiptBase64 = Buffer.from(receiptBuffer).toString("base64");
        saveStoredDocument({
          id: receiptFilePath || sanitizedFilename,
          type: "receipt",
          fileName: receiptFile.name,
          mimeType: receiptDetectedMime,
          dataBase64: receiptBase64,
          fileSize: receiptFileSize,
          uploadedAt: new Date().toISOString(),
        });
      } catch (docSaveErr) {
        console.warn("Could not save receipt to memory store:", docSaveErr);
      }
    }

    // 2b. Upload Student ID Card to private storage bucket 'student-id-cards' with local fallback
    let idCardFilePath = "";
    let uploadedIdCardStorageUrl = "";
    let idCardDetectedMime = "application/octet-stream";
    let idCardDetectedExt = "bin";
    let idCardFileSize = 0;

    if (idCardFile) {
      const rawIdCardBuffer = await idCardFile.arrayBuffer();
      const idCardValidation = validateDocumentBuffer(rawIdCardBuffer, idCardFile.name, {
        maxBytes: 5 * 1024 * 1024,
        minBytes: 64,
        allowedMimes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
      });

      if (!idCardValidation.valid || !idCardValidation.buffer) {
        return NextResponse.json(
          {
            success: false,
            message:
              idCardValidation.error ||
              "Uploaded ID card file content does not match a valid image (JPG, PNG, WebP) or PDF document. Malformed, truncated, or fake files are rejected.",
          },
          { status: 400 }
        );
      }

      idCardDetectedMime = idCardValidation.mimeType!;
      idCardDetectedExt = idCardValidation.extension!;
      const idCardBuffer = idCardValidation.buffer;
      idCardFileSize = idCardValidation.size!;

      const sanitizedIdCardFilename = `idcard_${regNumber}_${Date.now()}.${idCardDetectedExt}`;
      uploadedIdCardStorageUrl = `${supabaseUrl}/storage/v1/object/student-id-cards/${sanitizedIdCardFilename}`;

      try {
        const uploadRes = await fetch(uploadedIdCardStorageUrl, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": idCardDetectedMime,
            "x-upsert": "true",
          },
          body: idCardBuffer,
        });

        if (uploadRes.ok) {
          idCardFilePath = `student-id-cards/${sanitizedIdCardFilename}`;
        } else {
          // Fallback to local storage
          const localIdCardsDir = path.join(process.cwd(), ".data", "id_cards");
          if (!fs.existsSync(localIdCardsDir)) {
            fs.mkdirSync(localIdCardsDir, { recursive: true });
          }
          const localFilePath = path.join(localIdCardsDir, sanitizedIdCardFilename);
          fs.writeFileSync(localFilePath, Buffer.from(idCardBuffer));
          idCardFilePath = `local:id_cards/${sanitizedIdCardFilename}`;
        }
      } catch {
        // Fallback to local storage
        const localIdCardsDir = path.join(process.cwd(), ".data", "id_cards");
        if (!fs.existsSync(localIdCardsDir)) {
          fs.mkdirSync(localIdCardsDir, { recursive: true });
        }
        const localFilePath = path.join(localIdCardsDir, sanitizedIdCardFilename);
        fs.writeFileSync(localFilePath, Buffer.from(idCardBuffer));
        idCardFilePath = `local:id_cards/${sanitizedIdCardFilename}`;
      }

      // Persist document to multi-tier resilient data store
      try {
        const idCardBase64 = Buffer.from(idCardBuffer).toString("base64");
        saveStoredDocument({
          id: idCardFilePath || sanitizedIdCardFilename,
          type: "id_card",
          fileName: idCardFile.name,
          mimeType: idCardDetectedMime,
          dataBase64: idCardBase64,
          fileSize: idCardFileSize,
          uploadedAt: new Date().toISOString(),
        });
      } catch (docSaveErr) {
        console.warn("Could not save ID card to memory store:", docSaveErr);
      }
    }

    const regRecord: RegistrationRecord = {
      id: `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      registration_number: regNumber,
      student_name: studentName.trim(),
      email: email.trim().toLowerCase(),
      contact_number: contactNumber.trim(),
      gender: gender.trim() || null,
      dob: dob.trim() || null,
      student_id: normalizedStudentId,
      admission_number: normalizedAdmissionNumber || null,
      id_card_file_path: idCardFilePath || null,
      id_card_file_name: idCardFile?.name || null,
      id_card_file_size: idCardFileSize || null,
      id_card_mime_type: idCardFile ? idCardDetectedMime : null,
      school: school.trim(),
      program: program.trim(),
      year_of_joining: yearOfJoining.trim(),
      course: program.trim(),
      branch: program.trim(),
      academic_year: null,

      // Previous Work / Startup Details (Optional & backward compatible)
      previous_work_description: (previousWorkDescription.trim() || startupDetails.trim()) || null,
      project_name: (projectName.trim() || startupTitle.trim()) || null,
      project_role: (projectRole.trim() || studentRole.trim()) || null,
      technologies_used: technologiesUsed.trim() || null,
      project_link: projectLink.trim() || null,

      // Startup & Innovation Details (Mentor incubation form)
      has_startup_or_project: hasStartupOrProject.trim() || null,
      team_leader_name: teamLeaderName.trim() || null,
      team_leader_enrollment: teamLeaderEnrollment.trim() || null,
      team_leader_email: teamLeaderEmail.trim() || null,
      team_leader_contact: teamLeaderContact.trim() || null,
      student_role: studentRole.trim() || null,
      team_structure: teamStructure.trim() || null,
      team_members: teamMembers.length > 0 ? teamMembers : null,
      startup_title: startupTitle.trim() || null,
      startup_details: startupDetails.trim() || null,
      startup_stage: startupStage.trim() || null,
      support_needed: supportNeeded.length > 0 ? supportNeeded : null,
      other_support_details: otherSupportDetails.trim() || null,

      reason_for_joining: reasonForJoining.trim(),
      leadership_interest: leadershipInterest.trim(),
      form_version: "v2-official",
      transaction_id: normalizedTransactionId,
      payment_date: paymentDate.trim(),
      fee_amount: paymentConfig.feeAmount ?? 100,
      receipt_file_path: receiptFilePath,
      receipt_file_name: receiptFile?.name || "receipt",
      receipt_file_size: receiptFileSize,
      receipt_mime_type: receiptDetectedMime,
      remarks: remarks.trim() || null,
      payment_status: "pending_verification",
      admin_review_notes: null,
      verified_at: null,
      verified_by: null,
      student_verification_status: "pending",
      student_verified_at: null,
      student_verified_by: null,
      student_verification_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Always persist to local store
    saveStoredRegistration(regRecord);

    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title: "New Student Registration",
      message: `Registration ${regNumber} received for ${studentName.trim()} (${normalizedStudentId}). Payment pending verification.`,
      type: "payment",
      targetRole: "Admin",
      link: "/admin/payments",
      read: false,
      createdAt: new Date().toISOString(),
      actorName: "Student Applicant",
    });

    // 3. Insert record into Supabase registrations table
    const insertUrl = `${supabaseUrl}/rest/v1/registrations`;
    const basePayload = {
      registration_number: regNumber,
      student_name: studentName.trim(),
      email: email.trim().toLowerCase(),
      contact_number: contactNumber.trim(),
      gender: gender.trim() || null,
      dob: dob.trim() || null,
      student_id: normalizedStudentId,
      admission_number: normalizedAdmissionNumber || null,
      id_card_file_path: idCardFilePath || null,
      id_card_file_name: idCardFile?.name || null,
      id_card_file_size: idCardFileSize || null,
      id_card_mime_type: idCardFile ? idCardDetectedMime : null,

      // Official Academic Taxonomy
      school: school.trim(),
      program: program.trim(),
      year_of_joining: yearOfJoining.trim(),

      // Previous Work / Startup Details (Optional)
      previous_work_description: (previousWorkDescription.trim() || startupDetails.trim()) || null,
      project_name: (projectName.trim() || startupTitle.trim()) || null,
      project_role: (projectRole.trim() || studentRole.trim()) || null,
      technologies_used: technologiesUsed.trim() || null,
      project_link: projectLink.trim() || null,

      // Startup & Innovation Details
      has_startup_or_project: hasStartupOrProject.trim() || null,
      team_leader_name: teamLeaderName.trim() || null,
      team_leader_enrollment: teamLeaderEnrollment.trim() || null,
      team_leader_email: teamLeaderEmail.trim() || null,
      team_leader_contact: teamLeaderContact.trim() || null,
      student_role: studentRole.trim() || null,
      team_structure: teamStructure.trim() || null,
      team_members: teamMembers.length > 0 ? teamMembers : null,
      startup_title: startupTitle.trim() || null,
      startup_details: startupDetails.trim() || null,
      startup_stage: startupStage.trim() || null,
      support_needed: supportNeeded.length > 0 ? supportNeeded : null,
      other_support_details: otherSupportDetails.trim() || null,

      // Club Engagement
      reason_for_joining: reasonForJoining.trim(),
      leadership_interest: leadershipInterest.trim(),

      // Form Version Tracking (explicitly marks new registrations)
      form_version: "v2-official",

      // Backward-compatible legacy column mirrors (academic_year explicitly NULL)
      course: program.trim(),
      branch: program.trim(),
      academic_year: null,

      // Payment info
      transaction_id: normalizedTransactionId,
      payment_date: paymentDate.trim(),
      fee_amount: paymentConfig.feeAmount ?? 100,
      receipt_file_path: receiptFilePath,
      receipt_file_name: receiptFile?.name || "receipt",
      receipt_file_size: receiptFileSize,
      receipt_mime_type: receiptDetectedMime,
      remarks: remarks.trim() || null,
      payment_status: "pending_verification",
      student_verification_status: "pending",
    };

    let insertRes = await fetch(insertUrl, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(basePayload),
    });

    if (!insertRes.ok) {
      let errorText = await insertRes.text();

      // Graceful fallback: If remote Supabase schema has not yet migrated admission_number or id_card columns
      const hasAdmError = errorText.includes("admission_number") && "admission_number" in basePayload;
      const hasIdCardError = errorText.includes("id_card") && "id_card_file_path" in basePayload;

      if (hasAdmError || hasIdCardError) {
        const retryPayload = { ...basePayload };
        if (hasAdmError) {
          delete (retryPayload as any).admission_number;
        }
        if (hasIdCardError) {
          delete (retryPayload as any).id_card_file_path;
          delete (retryPayload as any).id_card_file_name;
          delete (retryPayload as any).id_card_file_size;
          delete (retryPayload as any).id_card_mime_type;
        }
        const retryRes = await fetch(insertUrl, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(retryPayload),
        });
        if (retryRes.ok) {
          insertRes = retryRes;
        } else {
          errorText = await retryRes.text();
        }
      }

      if (!insertRes.ok) {
        console.error("Database insert error:", errorText);

        // Attempt cleanup of uploaded receipt file if database insert fails
        if (uploadedStorageUrl) {
          try {
            await fetch(uploadedStorageUrl, {
              method: "DELETE",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            });
          } catch (cleanupErr) {
            console.error("Receipt cleanup error after failed insert:", cleanupErr);
          }
        }

        // Attempt cleanup of uploaded student ID card file if database insert fails
        if (uploadedIdCardStorageUrl) {
          try {
            await fetch(uploadedIdCardStorageUrl, {
              method: "DELETE",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            });
          } catch (cleanupErr) {
            console.error("ID card cleanup error after failed insert:", cleanupErr);
          }
        }

      // Check for unique constraint violations (HTTP 409 or Postgres code 23505)
      const isUniqueConflict =
        insertRes.status === 409 ||
        errorText.includes("23505") ||
        errorText.includes("idx_registrations_student_id") ||
        errorText.includes("idx_registrations_transaction_id") ||
        errorText.includes("duplicate key");

      if (isUniqueConflict) {
        const lowerErr = errorText.toLowerCase();
        let conflictMessage =
          "A registration with this Student ID or Transaction ID has already been submitted.";

        if (lowerErr.includes("student_id")) {
          conflictMessage =
            "A registration for this Student ID / Roll Number has already been submitted.";
        } else if (lowerErr.includes("transaction_id")) {
          conflictMessage =
            "This Transaction Reference ID has already been submitted for another registration.";
        }

        return NextResponse.json(
          {
            success: false,
            message: conflictMessage,
          },
          { status: 409 }
        );
      }

      console.warn("Supabase insert had error, retained in local persistent store:", errorText);

      // Automated Student Email Notification (Decoupled & Non-blocking)
      let emailStatusInfo: { status: "sent" | "simulated" | "failed" | "skipped"; message?: string; recipient?: string } | undefined;
      try {
        const emailResult = await sendRegistrationSubmittedEmail({
          registrationId: regRecord.id,
          registrationNumber: regNumber,
          recipientEmail: email.trim().toLowerCase(),
          recipientName: studentName.trim(),
          studentId: normalizedStudentId,
          admissionNumber: normalizedAdmissionNumber || null,
          school: school.trim(),
          program: program.trim(),
          transactionId: normalizedTransactionId,
        });
        emailStatusInfo = {
          status: emailResult.status || (emailResult.simulated ? "simulated" : emailResult.success ? "sent" : "failed"),
          recipient: email.trim().toLowerCase(),
        };
      } catch (emailErr) {
        console.warn("[Register Route] Non-blocking email dispatch error:", emailErr);
        emailStatusInfo = {
          status: "failed",
          message: "Failed to dispatch email",
          recipient: email.trim().toLowerCase(),
        };
      }

      return NextResponse.json({
        success: true,
        mode: "persisted_store",
        registrationNumber: regNumber,
        studentId: normalizedStudentId,
        studentName: studentName.trim(),
        transactionId: normalizedTransactionId,
        paymentStatus: "pending_verification",
        submittedAt: new Date().toISOString(),
        emailNotification: emailStatusInfo,
        message:
          "Your AVISHKAR 2026 registration has been successfully submitted and is pending verification.",
      });
    }
  }

    // Automated Student Email Notification (Decoupled & Non-blocking)
    let emailStatusInfo: { status: "sent" | "simulated" | "failed" | "skipped"; message?: string; recipient?: string } | undefined;
    try {
      const emailResult = await sendRegistrationSubmittedEmail({
        registrationId: regRecord.id,
        registrationNumber: regNumber,
        recipientEmail: email.trim().toLowerCase(),
        recipientName: studentName.trim(),
        studentId: normalizedStudentId,
        admissionNumber: normalizedAdmissionNumber || null,
        school: school.trim(),
        program: program.trim(),
        transactionId: normalizedTransactionId,
      });
      emailStatusInfo = {
        status: emailResult.status || (emailResult.simulated ? "simulated" : emailResult.success ? "sent" : "failed"),
        recipient: email.trim().toLowerCase(),
      };
    } catch (emailErr) {
      console.warn("[Register Route] Non-blocking email dispatch error:", emailErr);
      emailStatusInfo = {
        status: "failed",
        message: "Failed to dispatch email",
        recipient: email.trim().toLowerCase(),
      };
    }

    // 4. Return success response with confirmed registration number
    return NextResponse.json({
      success: true,
      mode: "persisted",
      registrationNumber: regNumber,
      studentId: normalizedStudentId,
      studentName: studentName.trim(),
      transactionId: normalizedTransactionId,
      paymentStatus: "pending_verification",
      submittedAt: new Date().toISOString(),
      emailNotification: emailStatusInfo,
      message:
        "Your AVISHKAR 2026 registration has been successfully submitted and is pending verification.",
    });
  } catch (error: any) {
    console.error("Unhandled registration route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred while processing the registration.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request payload. Expected JSON body." },
        { status: 400 }
      );
    }

    const {
      registrationNumber,
      studentId,
      email,
      hasStartupOrProject,
      teamLeaderName,
      teamLeaderEnrollment,
      teamLeaderEmail,
      teamLeaderContact,
      studentRole,
      teamStructure,
      teamMembers,
      startupTitle,
      startupDetails,
      startupStage,
      supportNeeded,
      otherSupportDetails,
      technologiesUsed,
    } = body;

    const normalizedRegNumber = (registrationNumber || "").trim().toUpperCase();
    if (!normalizedRegNumber) {
      return NextResponse.json(
        { success: false, message: "Registration number is required to update details." },
        { status: 400 }
      );
    }

    // Identity verification: either studentId OR email must be provided to verify ownership
    const cleanStudentId = (studentId || "").trim().toLowerCase();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanStudentId && !cleanEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication failed. Please provide your Student ID or Email to verify ownership.",
        },
        { status: 401 }
      );
    }

    const storedRegistrations = getStoredRegistrations();
    const existingIndex = storedRegistrations.findIndex(
      (r) => r.registration_number?.toUpperCase() === normalizedRegNumber
    );

    if (existingIndex === -1) {
      return NextResponse.json(
        { success: false, message: "No registration found matching that registration number." },
        { status: 404 }
      );
    }

    const existing = storedRegistrations[existingIndex];

    // Verify ownership: studentId OR email must match
    const matchesStudentId = cleanStudentId && existing.student_id?.toLowerCase() === cleanStudentId;
    const matchesEmail = cleanEmail && existing.email?.toLowerCase() === cleanEmail;

    if (!matchesStudentId && !matchesEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. The provided Student ID or Email does not match this registration record.",
        },
        { status: 403 }
      );
    }

    // Validate startup details using the same validator
    const startupErrors = validateStartupDetails({
      hasStartupOrProject: (hasStartupOrProject as any) || undefined,
      teamLeaderName,
      teamLeaderEnrollment,
      teamLeaderEmail,
      teamLeaderContact,
      studentRole: (studentRole as any) || undefined,
      teamStructure: (teamStructure as any) || undefined,
      teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
      startupTitle,
      startupDetails,
      startupStage: (startupStage as any) || undefined,
      supportNeeded: Array.isArray(supportNeeded) ? supportNeeded : [],
      otherSupportDetails,
    });

    if (Object.keys(startupErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors: startupErrors,
          message: "Validation failed for startup details.",
        },
        { status: 400 }
      );
    }

    // Safely update only startup fields; all payment, verification, and academic data remain strictly unchanged
    const updatedRecord: RegistrationRecord = {
      ...existing,
      has_startup_or_project: hasStartupOrProject ? hasStartupOrProject.trim() : null,
      team_leader_name: teamLeaderName ? teamLeaderName.trim() : null,
      team_leader_enrollment: teamLeaderEnrollment ? teamLeaderEnrollment.trim() : null,
      team_leader_email: teamLeaderEmail ? teamLeaderEmail.trim() : null,
      team_leader_contact: teamLeaderContact ? teamLeaderContact.trim() : null,
      student_role: studentRole ? studentRole.trim() : null,
      team_structure: teamStructure ? teamStructure.trim() : null,
      team_members: Array.isArray(teamMembers) && teamMembers.length > 0 ? teamMembers : null,
      startup_title: startupTitle ? startupTitle.trim() : null,
      startup_details: startupDetails ? startupDetails.trim() : null,
      startup_stage: startupStage ? startupStage.trim() : null,
      support_needed: Array.isArray(supportNeeded) && supportNeeded.length > 0 ? supportNeeded : null,
      other_support_details: otherSupportDetails ? otherSupportDetails.trim() : null,
      technologies_used: technologiesUsed ? technologiesUsed.trim() : existing.technologies_used,

      // Bridge legacy fields
      project_name: startupTitle ? startupTitle.trim() : existing.project_name,
      project_role: studentRole ? studentRole.trim() : existing.project_role,
      previous_work_description: startupDetails ? startupDetails.trim() : existing.previous_work_description,

      updated_at: new Date().toISOString(),
    };

    saveStoredRegistration(updatedRecord);

    // Sync to Supabase if configured
    const configStatus = getSupabaseConfigStatus();
    if (configStatus.hasUrl && (configStatus.hasServiceRoleKey || configStatus.hasAnonKey)) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

        const updateUrl = `${supabaseUrl}/rest/v1/registrations?registration_number=eq.${encodeURIComponent(
          existing.registration_number
        )}`;

        await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            has_startup_or_project: updatedRecord.has_startup_or_project,
            team_leader_name: updatedRecord.team_leader_name,
            team_leader_enrollment: updatedRecord.team_leader_enrollment,
            team_leader_email: updatedRecord.team_leader_email,
            team_leader_contact: updatedRecord.team_leader_contact,
            student_role: updatedRecord.student_role,
            team_structure: updatedRecord.team_structure,
            team_members: updatedRecord.team_members,
            startup_title: updatedRecord.startup_title,
            startup_details: updatedRecord.startup_details,
            startup_stage: updatedRecord.startup_stage,
            support_needed: updatedRecord.support_needed,
            other_support_details: updatedRecord.other_support_details,
            project_name: updatedRecord.project_name,
            project_role: updatedRecord.project_role,
            previous_work_description: updatedRecord.previous_work_description,
            updated_at: updatedRecord.updated_at,
          }),
        });
      } catch (syncErr) {
        console.warn("Supabase PATCH sync failed, persisted in local store:", syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Startup and innovation details updated successfully.",
      registrationNumber: existing.registration_number,
    });
  } catch (error: any) {
    console.error("Unhandled registration PATCH error:", error);
    return NextResponse.json(
      { success: false, message: "An internal server error occurred while updating registration." },
      { status: 500 }
    );
  }
}
