/**
 * AVISHKAR 2026 — Admin Portal Data Models, Roles & Types
 */

export type UserRole = "President" | "Vice President" | "Admin" | "AVISHKAR Member" | "Student";
export type AdminRole = "President" | "Vice President" | "Admin" | "AVISHKAR Member";

export type StudentVerificationStatus = "pending" | "verified" | "rejected";
export type PaymentVerificationStatus = "pending_verification" | "verified" | "rejected";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole | "admin";
  lastSignInAt?: string;
  fullName?: string;
}

export type EventStatus =
  | "draft"
  | "proposed"
  | "approved"
  | "verification_failed"
  | "published"
  | "rejected"
  | "archived";

export type ApprovalDecisionStatus = "pending" | "approved" | "rejected" | "not_required" | "in_coordination";

export interface ApprovalHistoryEntry {
  id: string;
  stage: "Member" | "Vice President" | "President" | "Admin";
  decision: "draft" | "submitted" | "approved" | "rejected" | "coordinated" | "published" | "unpublished" | "archived";
  actorName: string;
  actorEmail?: string;
  actorRole?: string;
  timestamp: string;
  comment?: string | null;
  rejectionReason?: string | null;
}

export interface EventRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: "Hackathon" | "Robotics" | "Gaming" | "Design" | "Coding" | "General";
  status: EventStatus;
  proposedBy: string;
  proposedByEmail?: string;
  approvedBy: string | null;
  teamSizeMin: number;
  teamSizeMax: number;
  datePlaceholder: string;
  venuePlaceholder: string;
  rulebookUrl?: string;
  feeAmount?: number;
  assignedMemberIds: string[];
  createdAt: string;
  updatedAt: string;

  // Proposal and review metadata
  objectives?: string;
  proposedDateTime?: string;
  deliveryMode?: "In-Person" | "Virtual" | "Hybrid" | string;
  expectedParticipants?: number;
  requiredResources?: string;
  supportingDocsUrl?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
  rejectionReason?: string;

  // Independent Vice President and President decision tracking
  vpStatus?: ApprovalDecisionStatus;
  vpDecisionBy?: string | null;
  vpApprovedBy?: string | null;
  vpDecidedAt?: string | null;
  vpComment?: string | null;
  vpRejectionReason?: string | null;

  presidentStatus?: ApprovalDecisionStatus;
  presidentDecisionBy?: string | null;
  presidentDecidedAt?: string | null;
  presidentComment?: string | null;
  presidentRejectionReason?: string | null;

  // Chronological approval history log
  approvalHistory?: ApprovalHistoryEntry[];

  // Registration schedule & metrics
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationCount?: number;

  // VP Coordination fields
  coordinatorId?: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinationNotes?: string;
  coordinationBlockers?: string;
  coordinationStatus?: "awaiting_coordination" | "in_coordination" | "coordination_ready";

  // Two Event Creation Workflows: Member proposals vs Admin direct creation
  creationSource?: "MEMBER_PROPOSAL" | "ADMIN_DIRECT" | "admin" | "council";
  googleFormId?: string;
  googleFormUrl?: string;
  googleFormEditUrl?: string;
  googleFormVerified?: boolean;
  googleFormVerifiedAt?: string;
  qrCodeDataUrl?: string;
  formConfigured?: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: "success" | "error" | "unconfigured";
  lastSyncError?: string | null;
  formResponseCount?: number;

  // Final verification and publishing workflow
  publishedAt?: string;
  publishedBy?: string;
  verificationStatus?: "not_verified" | "passed" | "failed";
  verificationErrors?: string[];
  lastVerifiedAt?: string;

  // Event Photo Gallery & Cover Image
  coverPhotoId?: string;
  coverPhotoUrl?: string;
  photoCount?: number;
}

export interface VerificationCheckItem {
  passed: boolean;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  error?: string;
  warning?: string;
}

export interface EventVerificationReport {
  eventId: string;
  eventTitle: string;
  canPublish: boolean;
  isAlreadyPublished: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    approval: VerificationCheckItem;
    eventDetails: VerificationCheckItem;
    registrationForm: VerificationCheckItem;
    registrationLinks: VerificationCheckItem & {
      publicEventUrl: string;
      registrationUrl: string;
    };
    qrCode: VerificationCheckItem & {
      destination: string;
      qrDataUrl?: string;
    };
    googleForms: VerificationCheckItem & {
      enabled: boolean;
      url?: string;
      verified?: boolean;
    };
    environmentUrl: VerificationCheckItem & {
      baseUrl: string;
      isLocalhost: boolean;
      isProduction: boolean;
    };
  };
  event?: EventRecord;
  form?: EventFormRecord;
}

export type FormFieldType =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "select"
  | "date"
  | "file"
  | "number";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  order?: number;
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

export interface FormVersionSnapshot {
  version: number;
  formTitle: string;
  eventTitle?: string;
  teamSizeMin?: number;
  teamSizeMax?: number;
  feeAmount?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
  fields: FormField[];
  updatedAt: string;
  updatedBy?: string;
  changeNote?: string;
}

export interface EventFormRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  formTitle: string;
  formDescription: string;
  fields: FormField[];
  isActive: boolean;
  isPublished?: boolean;
  teamSizeMin?: number;
  teamSizeMax?: number;
  feeAmount?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
  version?: number;
  history?: FormVersionSnapshot[];
  googleFormId?: string;
  googleFormUrl?: string;
  googleFormEditUrl?: string;
  googleFormVerified?: boolean;
  googleFormVerifiedAt?: string;
  qrCodeDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}


export interface GoogleFormResponseRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  googleFormId: string;
  googleResponseId: string;
  studentName: string;
  studentEmail: string;
  studentId?: string;
  contactNumber?: string;
  answers: Record<string, unknown>;
  rawAnswers?: Record<string, unknown>;
  submittedAt: string;
  synchronizedAt: string;
  registrationId?: string;
}

export interface GoogleFormsConfigStatus {
  isConfigured: boolean;
  authType: "service_account" | "oauth2" | "none";
  missingFields: string[];
  clientEmail?: string;
  error?: string;
  setupInstructions?: {
    serviceAccount: string[];
    oauth2: string[];
  };
}

export interface EventFormSubmission {
  id: string;
  eventId: string;
  formId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  responses: Record<string, unknown>;
  submittedAt: string;
}

export type ResourceCategory = "rulebook" | "document" | "photo" | "guide" | "schedule" | "problem_statement" | "link";

export interface EventResourceRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  title: string;
  category: ResourceCategory;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  status: "pending_review" | "approved";
  createdAt: string;
}

export interface EventPhotoRecord {
  id: string;
  eventId: string;
  eventTitle?: string;
  url: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  caption?: string;
  isCover: boolean;
  displayOrder: number;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface MemberRecord {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  role: AdminRole;
  department: string;
  assignedEventIds: string[];
  status: "active" | "invited" | "suspended";
  joinedAt: string;
}

export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface TaskReassignmentEntry {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  reassignedBy: string;
  reassignedAt: string;
  reason: string;
}

export interface TaskActivityEntry {
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details?: string;
}

export interface MemberTaskRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  dueTime?: string;
  createdAt: string;
  assignedBy?: string;
  assignedByRole?: string;
  notes?: string;
  completedAt?: string;
  updatedAt?: string;
  subtasks?: TaskSubtask[];
  completionCriteria?: string;
  dependsOnTaskIds?: string[];
  reassignmentHistory?: TaskReassignmentEntry[];
  completionNotes?: string;
  completionEvidenceUrl?: string;
  history?: TaskActivityEntry[];
}

export type ReadinessCategory =
  | "venue_seating"
  | "equipment_technical"
  | "committee_volunteers"
  | "logistics_materials"
  | "scheduling_coordination"
  | "other_mandatory";

export type ReadinessItemStatus = "completed" | "pending" | "blocked" | "overdue";

export interface EventReadinessItem {
  id: string;
  eventId: string;
  category: ReadinessCategory;
  title: string;
  description?: string;
  isMandatory: boolean;
  status: ReadinessItemStatus;
  responsibleMemberId?: string;
  responsibleMemberName?: string;
  deadline: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventReadinessSummary {
  eventId: string;
  eventTitle: string;
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  blockedItems: number;
  overdueItems: number;
  mandatoryCount: number;
  mandatoryIncomplete: number;
  readinessPercentage: number;
  isOperationallyReady: boolean;
  items: EventReadinessItem[];
}

export type BlockerSeverity = "low" | "medium" | "high" | "critical";
export type BlockerStatus = "open" | "in_progress" | "escalated" | "resolved";

export interface OperationalBlockerRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  taskId?: string;
  taskTitle?: string;
  title: string;
  description: string;
  severity: BlockerSeverity;
  operationalImpact: string;
  evidenceUrl?: string;
  reportedBy: string;
  reportedByEmail: string;
  reportedByRole: string;
  reportedAt: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  resolutionDeadline?: string;
  status: BlockerStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  escalatedTo?: "President";
  escalatedAt?: string;
  escalatedBy?: string;
  escalationReason?: string;
  history: Array<{
    timestamp: string;
    actorName: string;
    actorRole: string;
    action: string;
    notes?: string;
  }>;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type NotificationType = "proposal" | "approval" | "rejection" | "task" | "publish" | "payment" | "system" | "blocker";

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetRole?: UserRole | "all";
  targetEmail?: string;
  link?: string;
  read: boolean;
  createdAt: string;
  actorName?: string;
}

export interface RegistrationRecord {
  id: string;
  registration_number: string;

  // Student Identity & Contact
  student_name: string;
  student_id: string;
  email: string;
  contact_number: string;
  gender: string | null;
  dob: string | null;

  // Academic Details
  school: string;
  program: string;
  year_of_joining: string;
  course: string | null;
  branch: string | null;
  academic_year: string | null;
  admission_number?: string | null;
  id_card_file_path?: string | null;
  id_card_file_name?: string | null;
  id_card_file_size?: number | null;
  id_card_mime_type?: string | null;

  // Event association (optional, for event-specific registrations)
  event_id?: string | null;
  event_title?: string | null;

  // Previous Work / Startup Details (Optional)
  has_startup_or_project?: string | null;
  team_leader_name?: string | null;
  team_leader_enrollment?: string | null;
  team_leader_email?: string | null;
  team_leader_contact?: string | null;
  student_role?: string | null;
  team_structure?: string | null;
  team_members?: any; // TeamMemberEntry[] or JSON or string
  startup_title?: string | null;
  startup_details?: string | null;
  startup_stage?: string | null;
  support_needed?: any; // string[] or JSON or string
  other_support_details?: string | null;

  // Legacy mirrors (backward-compatible)
  previous_work_description?: string | null;
  project_name?: string | null;
  project_role?: string | null;
  technologies_used?: string | null;
  project_link?: string | null;

  // Club Engagement
  reason_for_joining: string | null;
  leadership_interest: string | null;
  form_version: string | null;

  // Payment Verification
  transaction_id: string;
  payment_date: string;
  fee_amount: number | null;
  receipt_file_path: string;
  receipt_file_name: string;
  receipt_file_size: number;
  receipt_mime_type: string;
  remarks: string | null;
  payment_status: PaymentVerificationStatus;
  admin_review_notes: string | null;
  rejection_reason?: string | null;
  student_rejection_reason?: string | null;
  verified_at: string | null;
  verified_by: string | null;
  verification_history?: Array<{
    action: "approve" | "verify" | "reject" | "pending";
    actorEmail: string;
    timestamp: string;
    reason?: string;
    notes?: string;
  }>;

  // Student Eligibility Verification (Independent of payment)
  student_verification_status: StudentVerificationStatus;
  student_verified_at: string | null;
  student_verified_by: string | null;
  student_verification_notes: string | null;

  // Audit Timestamps
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalRegistrations: number;
  pendingRegistrations: number;
  pendingStudentVerification: number;
  pendingPaymentVerification: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  paymentsApproved: number;
  paymentsRejected: number;
  totalEvents: number;
  pendingEventApprovals: number;
  publishedEvents: number;
  activeMembers: number;
  lastUpdated: string;
}

export interface AdminFilterState {
  search: string;
  school: string;
  program: string;
  yearOfJoining: string;
  studentVerificationStatus: string;
  paymentStatus: string;
  eventId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaymentVerificationPayload {
  registrationId: string;
  action: "approve" | "verify" | "reject" | "pending";
  rejectionReason?: string;
  notes?: string;
}

export interface StudentVerificationPayload {
  registrationId: string;
  action: "approve" | "verify" | "reject" | "pending";
  rejectionReason?: string;
  notes?: string;
  requirePaymentVerified?: boolean;
}

// ============================================================================
// Automated Student Email Notification System Models
// ============================================================================

export type EmailNotificationEventType =
  | "registration_submitted"
  | "registration_approved"
  | "registration_rejected";

export type EmailNotificationStatus = "pending" | "sent" | "failed" | "simulated";

export interface StudentEmailNotificationRecord {
  id: string;
  registrationId: string;
  registrationNumber: string;
  recipientEmail: string;
  recipientName: string;
  eventType: EmailNotificationEventType;
  subject: string;
  status: EmailNotificationStatus;
  provider: "resend" | "sandbox";
  providerMessageId?: string | null;
  errorMessage?: string | null;
  attempts: number;
  idempotencyKey: string;
  createdAt: string;
  lastAttemptAt: string;
}
