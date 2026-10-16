import {
  StudentRegistrationInput,
  RegistrationValidationErrors,
  GenderOption,
  AcademicYearOption,
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
  data: Pick<StudentRegistrationInput, "studentId" | "school" | "program" | "yearOfJoining">
): RegistrationValidationErrors {
  const errors: RegistrationValidationErrors = {};

  // Student ID / Enrolment Number (Required: strictly nonblank after trimming)
  const trimmedId = (data.studentId || "").trim();
  if (!trimmedId || trimmedId.length === 0) {
    errors.studentId = "Student ID / Enrolment Number is required.";
  }

  // School (Required: SOES, SOHAS, SOAS)
  const validSchoolCodes = APPROVED_SCHOOLS.map((s) => s.code);
  if (!data.school || !data.school.trim()) {
    errors.school = "Please select your School.";
  } else if (!validSchoolCodes.includes(data.school as SchoolCode)) {
    errors.school = "Please select an approved School (SOES, SOHAS, SOAS).";
  }

  // Program / Department (Required: dynamic based on selected School)
  const trimmedProgram = (data.program || "").trim();
  if (!trimmedProgram) {
    errors.program = "Please select your Program / Department.";
  } else if (data.school && validSchoolCodes.includes(data.school as SchoolCode)) {
    const validPrograms = PROGRAMS_BY_SCHOOL[data.school as SchoolCode] || [];
    if (!validPrograms.includes(trimmedProgram)) {
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
export function validatePreviousWork(
  data: Partial<
    Pick<
      StudentRegistrationInput,
      | "previousWorkDescription"
      | "projectName"
      | "projectRole"
      | "technologiesUsed"
      | "projectLink"
    >
  >
): RegistrationValidationErrors {
  const errors: RegistrationValidationErrors = {};

  // Field 1: Previous Work or Project Details (Optional, max 2000 chars)
  if (data.previousWorkDescription) {
    if (data.previousWorkDescription.length > 2000) {
      errors.previousWorkDescription =
        "Previous Work or Project Details cannot exceed 2,000 characters.";
    }
  }

  // Field 2: Project or Startup Name (Optional, max 150 chars)
  if (data.projectName) {
    if (data.projectName.length > 150) {
      errors.projectName =
        "Project or Startup Name cannot exceed 150 characters.";
    }
  }

  // Field 3: Your Role (Optional, max 100 chars)
  if (data.projectRole) {
    if (data.projectRole.length > 100) {
      errors.projectRole = "Your Role cannot exceed 100 characters.";
    }
  }

  // Field 4: Technologies Used (Optional, max 500 chars)
  if (data.technologiesUsed) {
    if (data.technologiesUsed.length > 500) {
      errors.technologiesUsed =
        "Technologies Used cannot exceed 500 characters.";
    }
  }

  // Field 5: Project Link / Portfolio URL (Optional, validate only when non-empty)
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
 * Full validation across all steps
 */
export function validateAllRegistration(
  data: StudentRegistrationInput,
  includePayment = true
): RegistrationValidationErrors {
  const errors = {
    ...validatePersonalInfo(data),
    ...validateAcademicInfo(data),
    ...validatePreviousWork(data),
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
