export type UserRole = "student" | "admin" | "volunteer";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export type PaymentStatus = "pending_upload" | "under_review" | "verified" | "rejected";

export type RegistrationStatus = "draft" | "submitted" | "approved" | "rejected";
