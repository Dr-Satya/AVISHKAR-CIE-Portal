export type GenderOption = "Male" | "Female" | "Other" | "Prefer not to say";

export type AcademicYearOption =
  | "1st Year"
  | "2nd Year"
  | "3rd Year"
  | "4th Year"
  | "5th Year / Postgraduate";

export interface StudentRegistrationInput {
  // Step 1: Personal Information
  studentName: string;
  email: string;
  contactNumber: string;
  gender?: GenderOption | "";
  dob?: string;

  // Step 2: Academic Information (GD Goenka University)
  studentId: string;
  school: string;
  program: string;
  yearOfJoining: string;

  // Legacy fields (optional / backward-compatible)
  course?: string;
  branch?: string;
  academicYear?: AcademicYearOption | "";

  // Step 3: Previous Work / Startup Details (Optional)
  previousWorkDescription?: string;
  projectName?: string;
  projectRole?: string;
  technologiesUsed?: string;
  projectLink?: string;

  // Step 4: Club Engagement
  reasonForJoining: string;
  leadershipInterest: "Yes" | "No" | "";

  // Step 5: Payment & Receipt Details
  transactionId?: string;
  paymentDate?: string;
  receiptFile?: File | null;
  receiptFileName?: string;
  receiptFileSize?: number;
  receiptFileType?: string;
  remarks?: string;
}

export interface PaymentDetailsInput {
  transactionId: string;
  paymentDate: string;
  receiptFile: File | null;
  remarks?: string;
}

export interface RegistrationValidationErrors {
  studentName?: string;
  email?: string;
  contactNumber?: string;
  gender?: string;
  dob?: string;
  studentId?: string;
  school?: string;
  program?: string;
  yearOfJoining?: string;
  course?: string;
  branch?: string;
  academicYear?: string;
  previousWorkDescription?: string;
  projectName?: string;
  projectRole?: string;
  technologiesUsed?: string;
  projectLink?: string;
  reasonForJoining?: string;
  leadershipInterest?: string;
  transactionId?: string;
  paymentDate?: string;
  receiptFile?: string;
  general?: string;
}

export type RegistrationStep = 1 | 2 | 3 | 4 | 5;

export type SubmissionStatus =
  | "idle"
  | "submitting"
  | "success"
  | "unconfigured_backend"
  | "error";

export interface RegistrationSubmissionResult {
  success: boolean;
  mode: "persisted" | "unconfigured_backend" | "validation_error";
  registrationNumber?: string | null;
  provisionalReference?: string | null;
  isProvisional?: boolean;
  studentId?: string;
  studentName?: string;
  transactionId?: string;
  paymentStatus: "pending_verification" | "unconfigured_backend" | "rejected";
  submittedAt: string;
  message: string;
  missingRequirements?: string[];
}
