export type GenderOption = "Male" | "Female" | "Other" | "Prefer not to say";

export type AcademicYearOption =
  | "1st Year"
  | "2nd Year"
  | "3rd Year"
  | "4th Year"
  | "5th Year / Postgraduate";

// Startup & Innovation Details Types
export type StartupStatusOption =
  | "Yes, I have started a startup."
  | "I am currently developing a startup or project."
  | "No, not yet.";

export const STARTUP_STATUS_OPTIONS: StartupStatusOption[] = [
  "Yes, I have started a startup.",
  "I am currently developing a startup or project.",
  "No, not yet.",
];

export type StudentProjectRoleOption =
  | "Team Leader / Founder"
  | "Co-founder"
  | "Team Member"
  | "Individual Innovator";

export const STUDENT_PROJECT_ROLE_OPTIONS: StudentProjectRoleOption[] = [
  "Team Leader / Founder",
  "Co-founder",
  "Team Member",
  "Individual Innovator",
];

export type TeamStructureOption = "Individual Project" | "Team Project";

export const TEAM_STRUCTURE_OPTIONS: TeamStructureOption[] = [
  "Individual Project",
  "Team Project",
];

export type StartupStageOption =
  | "Idea"
  | "Research / Validation"
  | "Prototype / MVP"
  | "Testing / Pilot"
  | "Launched / In Production";

export const STARTUP_STAGE_OPTIONS: StartupStageOption[] = [
  "Idea",
  "Research / Validation",
  "Prototype / MVP",
  "Testing / Pilot",
  "Launched / In Production",
];

export const INCUBATION_SUPPORT_OPTIONS = [
  "Mentorship",
  "Funding Opportunities",
  "Incubation Support / Workspace",
  "Technical Guidance",
  "Pitch Deck Review",
  "Investor Connections",
  "Marketing and Customer Acquisition",
  "Legal and Compliance Guidance",
  "Cloud Credits and Technical Resources",
  "Government Grants and Startup Programs",
  "Networking and Demo Opportunities",
  "Other",
] as const;

export type IncubationSupportOption = (typeof INCUBATION_SUPPORT_OPTIONS)[number];

export interface TeamMemberEntry {
  id?: string;
  fullName: string;
  enrollmentNumber: string;
  roleInTeam: string;
}

export interface StudentRegistrationInput {
  // Step 1: Personal Information
  studentName: string;
  email: string;
  contactNumber: string;
  gender?: GenderOption | "";
  dob?: string;

  // Step 2: Academic Information (GD Goenka University)
  studentId: string;
  admissionNumber: string;
  idCardFile?: File | null;
  idCardFileName?: string;
  idCardFileSize?: number;
  idCardMimeType?: string;
  school: string;
  program: string;
  yearOfJoining: string;

  // Legacy fields (optional / backward-compatible)
  course?: string;
  branch?: string;
  academicYear?: AcademicYearOption | "";

  // Step 3: Startup & Innovation Details (Optional)
  hasStartupOrProject?: StartupStatusOption | "";
  teamLeaderName?: string;
  teamLeaderEnrollment?: string;
  teamLeaderEmail?: string;
  teamLeaderContact?: string;
  studentRole?: StudentProjectRoleOption | "";
  teamStructure?: TeamStructureOption | "";
  teamMembers?: TeamMemberEntry[];
  startupTitle?: string;
  startupDetails?: string;
  startupStage?: StartupStageOption | "";
  technologiesUsed?: string;
  supportNeeded?: string[];
  otherSupportDetails?: string;
  projectLink?: string;

  // Legacy mirrors (backward-compatible)
  previousWorkDescription?: string;
  projectName?: string;
  projectRole?: string;

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
  admissionNumber?: string;
  idCardFile?: string;
  school?: string;
  program?: string;
  yearOfJoining?: string;
  course?: string;
  branch?: string;
  academicYear?: string;

  // Startup & Innovation Errors
  hasStartupOrProject?: string;
  teamLeaderName?: string;
  teamLeaderEnrollment?: string;
  teamLeaderEmail?: string;
  teamLeaderContact?: string;
  studentRole?: string;
  teamStructure?: string;
  teamMembers?: string;
  startupTitle?: string;
  startupDetails?: string;
  startupStage?: string;
  technologiesUsed?: string;
  supportNeeded?: string;
  otherSupportDetails?: string;
  projectLink?: string;

  // Legacy field errors
  previousWorkDescription?: string;
  projectName?: string;
  projectRole?: string;

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
  mode: "persisted" | "unconfigured_backend" | "validation_error" | "persisted_store";
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
  emailNotification?: {
    status: "sent" | "simulated" | "failed" | "skipped";
    message?: string;
    recipient?: string;
  };
}
