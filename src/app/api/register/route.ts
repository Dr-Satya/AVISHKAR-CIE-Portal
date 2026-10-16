import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  validatePersonalInfo,
  validateAcademicInfo,
  validatePreviousWork,
  validateClubEngagement,
  validatePaymentInfo,
} from "@/lib/validations/registration";
import { getSupabaseConfigStatus } from "@/lib/supabase";
import { paymentConfig, isOfficialPaymentConfigured } from "@/config/payment";
import { getStoredRegistrations, saveStoredRegistration, saveStoredNotification } from "@/lib/dataStore";
import { RegistrationRecord } from "@/types/admin";

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
    const school = (formData.get("school") as string) || "";
    const program = (formData.get("program") as string) || "";
    const yearOfJoining = (formData.get("yearOfJoining") as string) || "";

    // Optional Previous Work / Startup Details
    const previousWorkDescription = (formData.get("previousWorkDescription") as string) || "";
    const projectName = (formData.get("projectName") as string) || "";
    const projectRole = (formData.get("projectRole") as string) || "";
    const technologiesUsed = (formData.get("technologiesUsed") as string) || "";
    const projectLink = (formData.get("projectLink") as string) || "";

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

    if (receiptFile) {
      const fileExt = receiptFile.name.split(".").pop() || "bin";
      const sanitizedFilename = `${regNumber}_${Date.now()}.${fileExt}`;
      const fileBuffer = await receiptFile.arrayBuffer();

      uploadedStorageUrl = `${supabaseUrl}/storage/v1/object/payment-receipts/${sanitizedFilename}`;

      try {
        const uploadRes = await fetch(uploadedStorageUrl, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": receiptFile.type || "application/octet-stream",
          },
          body: fileBuffer,
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
          fs.writeFileSync(localFilePath, Buffer.from(fileBuffer));
          receiptFilePath = `local:receipts/${sanitizedFilename}`;
        }
      } catch {
        // Fallback to local storage
        const localReceiptsDir = path.join(process.cwd(), ".data", "receipts");
        if (!fs.existsSync(localReceiptsDir)) {
          fs.mkdirSync(localReceiptsDir, { recursive: true });
        }
        const localFilePath = path.join(localReceiptsDir, sanitizedFilename);
        fs.writeFileSync(localFilePath, Buffer.from(fileBuffer));
        receiptFilePath = `local:receipts/${sanitizedFilename}`;
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
      school: school.trim(),
      program: program.trim(),
      year_of_joining: yearOfJoining.trim(),
      course: program.trim(),
      branch: program.trim(),
      academic_year: null,

      // Previous Work / Startup Details (Optional)
      previous_work_description: previousWorkDescription.trim() || null,
      project_name: projectName.trim() || null,
      project_role: projectRole.trim() || null,
      technologies_used: technologiesUsed.trim() || null,
      project_link: projectLink.trim() || null,

      reason_for_joining: reasonForJoining.trim(),
      leadership_interest: leadershipInterest.trim(),
      form_version: "v2-official",
      transaction_id: normalizedTransactionId,
      payment_date: paymentDate.trim(),
      fee_amount: paymentConfig.feeAmount ?? 500,
      receipt_file_path: receiptFilePath,
      receipt_file_name: receiptFile?.name || "receipt",
      receipt_file_size: receiptFile?.size || 0,
      receipt_mime_type: receiptFile?.type || "application/octet-stream",
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
    const insertRes = await fetch(insertUrl, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        registration_number: regNumber,
        student_name: studentName.trim(),
        email: email.trim().toLowerCase(),
        contact_number: contactNumber.trim(),
        gender: gender.trim() || null,
        dob: dob.trim() || null,
        student_id: normalizedStudentId,

        // Official Academic Taxonomy
        school: school.trim(),
        program: program.trim(),
        year_of_joining: yearOfJoining.trim(),

        // Previous Work / Startup Details (Optional)
        previous_work_description: previousWorkDescription.trim() || null,
        project_name: projectName.trim() || null,
        project_role: projectRole.trim() || null,
        technologies_used: technologiesUsed.trim() || null,
        project_link: projectLink.trim() || null,

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
        fee_amount: paymentConfig.feeAmount ?? 500,
        receipt_file_path: receiptFilePath,
        receipt_file_name: receiptFile?.name || "receipt",
        receipt_file_size: receiptFile?.size || 0,
        receipt_mime_type: receiptFile?.type || "application/octet-stream",
        remarks: remarks.trim() || null,
        payment_status: "pending_verification",
      }),
    });

    if (!insertRes.ok) {
      const errorText = await insertRes.text();
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
      return NextResponse.json({
        success: true,
        mode: "persisted_store",
        registrationNumber: regNumber,
        studentId: normalizedStudentId,
        studentName: studentName.trim(),
        transactionId: normalizedTransactionId,
        paymentStatus: "pending_verification",
        submittedAt: new Date().toISOString(),
        message:
          "Your AVISHKAR 2026 registration has been successfully submitted and is pending verification.",
      });
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
