import {
  StudentRegistrationInput,
  RegistrationValidationErrors,
  GenderOption,
  AcademicYearOption,
  STARTUP_STATUS_OPTIONS,
  STUDENT_PROJECT_ROLE_OPTIONS,
  TEAM_STRUCTURE_OPTIONS,
  STARTUP_STAGE_OPTIONS,
} from "@/types/registration";
import {
  APPROVED_SCHOOLS,
  SchoolCode,
  PROGRAMS_BY_SCHOOL,
  YEAR_OF_JOINING_OPTIONS,
  LEADERSHIP_INTEREST_OPTIONS,
} from "@/config/academic";
import { paymentConfig } from "@/config/payment";

export const GENDER_OPTIONS: GenderOption[] = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
];

export const ACADEMIC_YEAR_OPTIONS: AcademicYearOption[] = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year / Postgraduate",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Validates Personal Information (Step 1)
 */
export function validatePersonalInfo(
  data: Pick<StudentRegistrationInput, "studentName" | "email" | "contactNumber" | "gender" | "dob">
): RegistrationValidationErrors {
  const errors: RegistrationValidationErrors = {};

  // Student Name (Required)
  const trimmedName = (data.studentName || "").trim();
  if (!trimmedName) {
    errors.studentName = "Student Name is required.";
  } else if (trimmedName.length < 2) {
    errors.studentName = "Student Name must be at least 2 characters long.";
  } else if (trimmedName.length > 100) {
    errors.studentName = "Student Name cannot exceed 100 characters.";
  }

  // Email Address (Required)
  const trimmedEmail = (data.email || "").trim();
  if (!trimmedEmail) {
    errors.email = "Email Address is required.";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address.";
  }

  // Contact Number (Required, 10-digit Indian mobile)
  const trimmedPhone = (data.contactNumber || "").trim().replace(/\D/g, "");
  if (!data.contactNumber || !data.contactNumber.trim()) {
    errors.contactNumber = "Contact Number is required.";
  } else if (!PHONE_REGEX.test(trimmedPhone)) {
    errors.contactNumber = "Please enter a valid 10-digit mobile number.";
  }

  // Gender (Optional - only validate if provided)
  if (data.gender && data.gender.trim()) {
    if (!GENDER_OPTIONS.includes(data.gender as GenderOption)) {
      errors.gender = "Please select a valid gender option.";
    }
  }

  // Date of Birth (Optional - only validate if provided)
  if (data.dob && data.dob.trim()) {
    const dobDate = new Date(data.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(dobDate.getTime())) {
      errors.dob = "Please enter a valid date of birth.";
    } else if (dobDate >= today) {
      errors.dob = "Date of Birth cannot be today or in the future.";
    } else {
      const birthYear = dobDate.getFullYear();
      const currentYear = today.getFullYear();
      if (birthYear < 1960 || currentYear - birthYear > 80) {
        errors.dob = "Please enter a realistic date of birth.";
      }
    }
  }

  return errors;
}

/**
 * Validates Academic Information (Step 2)
 * Strictly nonblank student ID; School & Program grounded in official source
 */
export function validateAcademicInfo(
  data: Pick<StudentRegistrationInput, "studentId" | "school" | "program" | "yearOfJoining"> & {
    admissionNumber?: string;
    idCardFile?: File | null;
  }
): RegistrationValidationErrors {
  const errors: RegistrationValidationErrors = {};

  // Student ID / Enrolment Number (Required: strictly nonblank after trimming)
  const trimmedId = (data.studentId || "").trim();
  if (!trimmedId || trimmedId.length === 0) {
    errors.studentId = "Student ID / Enrolment Number is required.";
  }

  // Admission Number (Compulsory: strictly nonblank after trimming)
  const trimmedAdm = (data.admissionNumber || "").trim();
  if (!trimmedAdm || trimmedAdm.length === 0) {
    errors.admissionNumber = "Admission Number is required.";
  } else if (trimmedAdm.length > 100) {
    errors.admissionNumber = "Admission Number cannot exceed 100 characters.";
  }

  // Student ID Card Document (Compulsory: JPG, JPEG, PNG, WebP, or PDF up to 5 MB)
  if (!data.idCardFile) {
    errors.idCardFile = "Student ID card document is required.";
  } else {
    const file = data.idCardFile;
    if (file.size === 0) {
      errors.idCardFile = "The uploaded file is empty.";
    } else if (file.size > 5 * 1024 * 1024) {
      errors.idCardFile = `File size (${(file.size / (1024 * 1024)).toFixed(
        2
      )} MB) exceeds the 5 MB limit.`;
    } else {
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      if (
        !allowedExtensions.includes(ext) ||
        (file.type && !allowedMimes.includes(file.type))
      ) {
        errors.idCardFile =
          "Invalid file type. Please upload a JPG, JPEG, PNG, WebP, or PDF file.";
      }
    }
  }

  // School (Required)
  const validSchoolCodes = APPROVED_SCHOOLS.map((s) => s.code as string);
  const legacyCodes = ["SOES", "SOHAS", "SOAS", "SOM", "SOL", "SMAS", "SOHSS", "UID"];
  const allAllowedSchools = [...validSchoolCodes, ...legacyCodes];

  if (!data.school || !data.school.trim()) {
    errors.school = "Please select your School.";
  } else if (!allAllowedSchools.includes(data.school)) {
    errors.school = "Please select an approved School.";
  }

  // Program / Department (Required: dynamic based on selected School)
  const trimmedProgram = (data.program || "").trim();
  if (!trimmedProgram) {
    errors.program = "Please select your Program / Department.";
  } else if (data.school) {
    const validPrograms = PROGRAMS_BY_SCHOOL[data.school] || [];
    if (validPrograms.length > 0 && !validPrograms.includes(trimmedProgram) && trimmedProgram !== "Others") {
      errors.program = "Please select a valid program for the chosen school.";
    }
  }

  // Year of Joining (Required: 2021-2026)
  if (!data.yearOfJoining || !data.yearOfJoining.trim()) {
    errors.yearOfJoining = "Please select your Year of Joining University.";
  } else if (!YEAR_OF_JOINING_OPTIONS.includes(data.yearOfJoining as any)) {
    errors.yearOfJoining = "Please select a valid Year of Joining.";
  }

  return errors;
}

/**
 * Validates Club Engagement & Interests (Step 3)
 */
export function validateClubEngagement(
  data: Pick<StudentRegistrationInput, "reasonForJoining" | "leadershipInterest">
): RegistrationValidationErrors {
  const errors: RegistrationValidationErrors = {};

  // Motivation: "Why do you want to join AVISHKAR?"
  const trimmedReason = (data.reasonForJoining || "").trim();
  if (!trimmedReason) {
    errors.reasonForJoining = "Please explain why you want to join AVISHKAR.";
  } else if (trimmedReason.length < 10) {
    errors.reasonForJoining = "Please provide a reason of at least 10 characters.";
  } else if (trimmedReason.length > 2000) {
    errors.reasonForJoining = "Reason cannot exceed 2000 characters.";
  }

  // Leadership interest: "Are you interested in leadership roles within AVISHKAR?"
  if (!data.leadershipInterest || !data.leadershipInterest.trim()) {
    errors.leadershipInterest = "Please indicate if you are interested in leadership roles.";
  } else if (!LEADERSHIP_INTEREST_OPTIONS.includes(data.leadershipInterest as any)) {
    errors.leadershipInterest = "Please select either Yes or No.";
  }

  return errors;
}

/**
 * Validates Payment and Receipt Information (Step 4)
 */
export function validatePaymentInfo(
  data: Pick<StudentRegistrationInput, "transactionId" | "paymentDate" | "receiptFile">
): RegistrationValidationErrors {
  const errors: RegistrationValidationErrors = {};

  // Transaction ID / Reference
  const trimmedTxId = (data.transactionId || "").trim();
  if (!trimmedTxId) {
    errors.transactionId = "Transaction ID / UTR number is required.";
  } else if (trimmedTxId.length < 6) {
    errors.transactionId =
      "Transaction ID must be at least 6 characters (e.g. 12-digit UPI UTR).";
  } else if (trimmedTxId.length > 50) {
    errors.transactionId = "Transaction ID cannot exceed 50 characters.";
  } else if (!/^[A-Za-z0-9_-]+$/.test(trimmedTxId)) {
    errors.transactionId =
      "Transaction ID must contain only alphanumeric characters, hyphens, or underscores.";
  }

  // Payment Date
  if (!data.paymentDate || !data.paymentDate.trim()) {
    errors.paymentDate = "Payment date is required.";
  } else {
    const payDate = new Date(data.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(payDate.getTime())) {
      errors.paymentDate = "Please enter a valid payment date.";
    } else if (payDate > today) {
      errors.paymentDate = "Payment date cannot be in the future.";
    }
  }

  // Receipt File (up to 10 MB per updated requirement)
  if (!data.receiptFile) {
    errors.receiptFile = "Payment receipt screenshot or document is required.";
  } else {
    const file = data.receiptFile;
    const maxBytes = paymentConfig.maxFileSizeMB * 1024 * 1024;

    if (file.size <= 0) {
      errors.receiptFile = "The uploaded file is empty.";
    } else if (file.size > maxBytes) {
      errors.receiptFile = `File size (${(file.size / (1024 * 1024)).toFixed(
        1
      )}MB) exceeds the maximum allowed limit of ${paymentConfig.maxFileSizeMB}MB.`;
    } else if (
      file.type &&
      !paymentConfig.allowedMimeTypes.includes(file.type.toLowerCase())
    ) {
      errors.receiptFile =
        "Invalid file type. Allowed formats: JPG, PNG, WebP, or PDF.";
    }
  }

  return errors;
}

/**
 * Validates Previous Work / Startup Details (Step 3 - Strictly Optional)
 *
 * Rules:
 * - The entire section and all fields are optional.
 * - Empty / whitespace-only values produce ZERO errors.
 * - Length limits:
 *   - previousWorkDescription: max 2,000 characters
 *   - projectName: max 150 characters
 *   - projectRole: max 100 characters
 *   - technologiesUsed: max 500 characters
 *   - projectLink: max 500 characters, valid http/https URL only when provided
 */
/**
 * Validates Startup & Innovation Details (Step 3 - Strictly Optional)
 *
 * Rules:
 * - The entire section and all fields are strictly optional.
 * - If status is "No, not yet." or empty, zero validation errors are produced.
 * - If status is "Yes, I have started a startup." or "I am currently developing a startup or project.":
 *   - Fields remain optional to submit, but when provided, bounds and formats are validated.
 *   - teamLeaderEmail: valid email format when non-empty
 *   - teamLeaderContact: 10-digit mobile number when non-empty
 *   - startupTitle: max 200 chars
 *   - startupDetails: max 3,000 chars
 *   - technologiesUsed: max 1,000 chars
 *   - projectLink: max 500 chars, valid http/https URL only when provided
 *   - otherSupportDetails: max 500 chars
 *   - teamMembers: for any partially completed team member row, requires name, enrollment, role
 */
export function validateStartupDetails(
  data: Partial<StudentRegistrationInput>
): RegistrationValidationErrors {
  const errors: RegistrationValidationErrors = {};

  // If no startup / project, or "No, not yet.", or empty, skip all startup validation
  if (!data.hasStartupOrProject || data.hasStartupOrProject === "No, not yet.") {
    // Check legacy fields only if someone provided legacy inputs directly
    if (data.projectLink && data.projectLink.trim()) {
      const trimmedUrl = data.projectLink.trim();
      if (trimmedUrl.length > 500) {
        errors.projectLink = "Project Link or Portfolio URL cannot exceed 500 characters.";
      } else {
        try {
          const parsed = new URL(trimmedUrl);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            errors.projectLink = "Please enter a valid web URL starting with http:// or https://";
          } else if (!parsed.hostname || !parsed.hostname.includes(".")) {
            errors.projectLink = "Please enter a valid URL with a proper domain name.";
          }
        } catch {
          errors.projectLink = "Please enter a valid URL (e.g., https://github.com/username/project).";
        }
      }
    }
    return errors;
  }

  // Validate status option if provided
  if (
    data.hasStartupOrProject &&
    !STARTUP_STATUS_OPTIONS.includes(data.hasStartupOrProject as any)
  ) {
    errors.hasStartupOrProject = "Please select a valid startup status option.";
  }

  // 1. Student's Role in Project (if provided, must be valid)
  if (
    data.studentRole &&
    !STUDENT_PROJECT_ROLE_OPTIONS.includes(data.studentRole as any)
  ) {
    errors.studentRole = "Please select a valid role in the project.";
  }

  // 2. Startup Stage (if provided, must be valid)
  if (
    data.startupStage &&
    !STARTUP_STAGE_OPTIONS.includes(data.startupStage as any)
  ) {
    errors.startupStage = "Please select a valid startup stage.";
  }

  // 3. Team Structure (if provided, must be valid)
  if (
    data.teamStructure &&
    !TEAM_STRUCTURE_OPTIONS.includes(data.teamStructure as any)
  ) {
    errors.teamStructure = "Please select a valid team structure.";
  }

  // 4. Team Leader / Founder Information (Optional, but validated if provided)
  if (data.teamLeaderName && data.teamLeaderName.length > 150) {
    errors.teamLeaderName = "Team Leader / Founder Name cannot exceed 150 characters.";
  }

  if (data.teamLeaderEnrollment && data.teamLeaderEnrollment.length > 50) {
    errors.teamLeaderEnrollment = "Enrollment Number cannot exceed 50 characters.";
  }

  if (data.teamLeaderEmail && data.teamLeaderEmail.trim()) {
    const trimmedEmail = data.teamLeaderEmail.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.teamLeaderEmail = "Please enter a valid email address for Team Leader.";
    }
  }

  if (data.teamLeaderContact && data.teamLeaderContact.trim()) {
    const trimmedPhone = data.teamLeaderContact.trim().replace(/\D/g, "");
    if (!PHONE_REGEX.test(trimmedPhone)) {
      errors.teamLeaderContact = "Please enter a valid 10-digit mobile number for Team Leader.";
    }
  }

  // 5. Team Members (if Team Project)
  if (data.teamStructure === "Team Project" && Array.isArray(data.teamMembers)) {
    for (let i = 0; i < data.teamMembers.length; i++) {
      const member = data.teamMembers[i];
      const hasAnyField = Boolean(
        (member.fullName && member.fullName.trim()) ||
        (member.enrollmentNumber && member.enrollmentNumber.trim()) ||
        (member.roleInTeam && member.roleInTeam.trim())
      );

      if (hasAnyField) {
        if (!member.fullName || member.fullName.trim().length < 2) {
          errors.teamMembers = `Member #${i + 1}: Please provide a valid Full Name (at least 2 characters).`;
          break;
        }
        if (!member.enrollmentNumber || !member.enrollmentNumber.trim()) {
          errors.teamMembers = `Member #${i + 1}: Enrollment Number is required.`;
          break;
        }
        if (!member.roleInTeam || !member.roleInTeam.trim()) {
          errors.teamMembers = `Member #${i + 1}: Role in Team is required.`;
          break;
        }
      }
    }
  }

  // 6. Startup / Product / Project Title
  const effectiveTitle = (data.startupTitle || data.projectName || "").trim();
  if (effectiveTitle && effectiveTitle.length > 200) {
    errors.startupTitle = "Project / Startup Title cannot exceed 200 characters.";
    errors.projectName = "Project / Startup Title cannot exceed 200 characters.";
  }

  // 7. Startup / Product / Project Details
  const effectiveDetails = (data.startupDetails || data.previousWorkDescription || "").trim();
  if (effectiveDetails && effectiveDetails.length > 3000) {
    errors.startupDetails = "Startup / Project Details cannot exceed 3,000 characters.";
    errors.previousWorkDescription = "Startup / Project Details cannot exceed 3,000 characters.";
  }

  // 8. Technologies Used
  const effectiveTech = (data.technologiesUsed || "").trim();
  if (effectiveTech && effectiveTech.length > 1000) {
    errors.technologiesUsed = "Technology Stack cannot exceed 1,000 characters.";
  }

  // 9. Support Needed & Other Details
  if (
    Array.isArray(data.supportNeeded) &&
    data.supportNeeded.includes("Other") &&
    (!data.otherSupportDetails || !data.otherSupportDetails.trim())
  ) {
    errors.otherSupportDetails = "Please describe the other kind of support needed.";
  }

  if (data.otherSupportDetails && data.otherSupportDetails.length > 500) {
    errors.otherSupportDetails = "Other Support Details cannot exceed 500 characters.";
  }

  // 7. Project Link / Portfolio URL
  if (data.projectLink && data.projectLink.trim()) {
    const trimmedUrl = data.projectLink.trim();
    if (trimmedUrl.length > 500) {
      errors.projectLink = "Project Link or Portfolio URL cannot exceed 500 characters.";
    } else {
      try {
        const parsed = new URL(trimmedUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          errors.projectLink =
            "Please enter a valid web URL starting with http:// or https://";
        } else if (!parsed.hostname || !parsed.hostname.includes(".")) {
          errors.projectLink =
            "Please enter a valid URL with a proper domain name (e.g., https://github.com/username/project).";
        }
      } catch {
        errors.projectLink =
          "Please enter a valid URL (e.g., https://github.com/username/project).";
      }
    }
  }

  return errors;
}

/**
 * Validates Previous Work / Startup Details (Backward compatible helper)
 */
export function validatePreviousWork(
  data: Partial<StudentRegistrationInput>
): RegistrationValidationErrors {
  const startupErrors = validateStartupDetails(data);
  const legacyErrors: RegistrationValidationErrors = {};

  // Maintain backward-compatible checks for legacy fields if directly passed
  if (data.previousWorkDescription && data.previousWorkDescription.length > 2000) {
    legacyErrors.previousWorkDescription =
      "Previous Work or Project Details cannot exceed 2,000 characters.";
  }

  if (data.projectName && data.projectName.length > 150) {
    legacyErrors.projectName =
      "Project or Startup Name cannot exceed 150 characters.";
  }

  if (data.projectRole && data.projectRole.length > 100) {
    legacyErrors.projectRole = "Your Role cannot exceed 100 characters.";
  }

  if (data.technologiesUsed && data.technologiesUsed.length > 500) {
    legacyErrors.technologiesUsed =
      "Technologies Used cannot exceed 500 characters.";
  }

  return {
    ...legacyErrors,
    ...startupErrors,
  };
}

/**
 * Full validation across all steps
 */
export function validateAllRegistration(
  data: StudentRegistrationInput,
  includePayment = true
): RegistrationValidationErrors {
  const errors = {
    ...validatePersonalInfo(data),
    ...validateAcademicInfo(data),
    ...validateStartupDetails(data),
    ...validateClubEngagement(data),
  };

  if (includePayment) {
    return {
      ...errors,
      ...validatePaymentInfo(data),
    };
  }

  return errors;
}
