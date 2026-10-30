import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  EventRecord,
  EventFormRecord,
  EventFormSubmission,
  EventResourceRecord,
  MemberRecord,
  MemberTaskRecord,
  AuditLogRecord,
  AdminRole,
  RegistrationRecord,
  NotificationRecord,
  ApprovalHistoryEntry,
  GoogleFormResponseRecord,
  EventPhotoRecord,
  EventReadinessItem,
  EventReadinessSummary,
  OperationalBlockerRecord,
  ReadinessCategory,
  StudentEmailNotificationRecord,
} from "../types/admin.ts";

export interface CouncilCredential {
  email: string;
  passwordHash: string; // SHA-256 of salt + password
  salt: string;
  role: AdminRole;
  fullName: string;
}

export interface StoreData {
  events: EventRecord[];
  forms: EventFormRecord[];
  formSubmissions: EventFormSubmission[];
  resources: EventResourceRecord[];
  members: MemberRecord[];
  tasks: MemberTaskRecord[];
  auditLogs: AuditLogRecord[];
  councilCredentials: CouncilCredential[];
  registrations: RegistrationRecord[];
  notifications?: NotificationRecord[];
  googleFormResponses?: GoogleFormResponseRecord[];
  photos?: EventPhotoRecord[];
  readinessItems?: EventReadinessItem[];
  blockers?: OperationalBlockerRecord[];
  documents?: Record<string, StoredDocument>;
  emailNotifications?: StudentEmailNotificationRecord[];
}

export interface StoredDocument {
  id: string;
  type: "id_card" | "receipt";
  fileName: string;
  mimeType: string;
  dataBase64: string;
  fileSize: number;
  uploadedAt: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "avishkar_store.json");

declare global {
  // eslint-disable-next-line no-var
  var __avishkar_memory_store: StoreData | undefined;
}

function hashPassword(password: string, salt: string): string {
  return crypto.createHash("sha256").update(salt + password).digest("hex");
}

function getInitialStore(): StoreData {
  const presidentSalt = "salt_pres_2026";
  const vpSalt = "salt_vp_2026";
  const adminSalt = "salt_adm_2026";
  const memberSalt = "salt_mem_2026";

  const initialCredentials: CouncilCredential[] = [
    {
      email: "president@gdgoenka.ac.in",
      passwordHash: hashPassword("President@2026", presidentSalt),
      salt: presidentSalt,
      role: "President",
      fullName: "President Council (Executive Lead)",
    },
    {
      email: "vp@gdgoenka.ac.in",
      passwordHash: hashPassword("VP@2026", vpSalt),
      salt: vpSalt,
      role: "Vice President",
      fullName: "Vice President Council (Operations Co-Lead)",
    },
    {
      email: "vicepresident@gdgoenka.ac.in",
      passwordHash: hashPassword("VicePresident@2026", vpSalt),
      salt: vpSalt,
      role: "Vice President",
      fullName: "Vice President Council (Operations Co-Lead)",
    },
    {
      email: "admin@gdgoenka.ac.in",
      passwordHash: hashPassword("Admin@2026", adminSalt),
      salt: adminSalt,
      role: "Admin",
      fullName: "Organizing Administrator",
    },
    {
      email: "member@gdgoenka.ac.in",
      passwordHash: hashPassword("Member@2026", memberSalt),
      salt: memberSalt,
      role: "AVISHKAR Member",
      fullName: "Technical Track Coordinator (Member)",
    },
  ];

  const initialEvents: EventRecord[] = [
    {
      id: "evt-001",
      title: "Hack-a-Sol: 24h Innovation Hackathon",
      slug: "hack-a-sol-2026",
      description: "Flagship 24-hour hackathon tackling real-world challenges in AI, Web3, and Sustainable Tech.",
      category: "Hackathon",
      status: "published",
      proposedBy: "Dr. Vivek Sharma (SOES)",
      proposedByEmail: "member@gdgoenka.ac.in",
      approvedBy: "President Council",
      teamSizeMin: 2,
      teamSizeMax: 4,
      datePlaceholder: "13-14 October 2026",
      venuePlaceholder: "Central Computing Lab, GD Goenka University",
      rulebookUrl: "/docs/hack-a-sol-rules.pdf",
      assignedMemberIds: ["mem-001", "mem-002"],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      presidentStatus: "approved",
      presidentDecisionBy: "President Council",
      presidentDecidedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      presidentComment: "Approved flagship hackathon competition format and university sponsorship.",
      vpStatus: "approved",
      vpDecisionBy: "Vice President Council",
      vpDecidedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      vpComment: "Lab capacity, high-speed networking, and faculty mentors confirmed.",
      coordinationStatus: "coordination_ready",
      coordinatorName: "Technical Track Coordinator (Member)",
      coordinatorEmail: "member@gdgoenka.ac.in",
      approvalHistory: [
        {
          id: "hist-001-1",
          stage: "Member",
          decision: "submitted",
          actorName: "Dr. Vivek Sharma (SOES)",
          actorRole: "AVISHKAR Member",
          timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
        {
          id: "hist-001-2",
          stage: "President",
          decision: "approved",
          actorName: "President Council",
          actorRole: "President",
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          comment: "Approved flagship hackathon competition format and university sponsorship.",
        },
        {
          id: "hist-001-3",
          stage: "Vice President",
          decision: "coordinated",
          actorName: "Vice President Council",
          actorRole: "Vice President",
          timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
          comment: "Lab capacity, high-speed networking, and faculty mentors confirmed.",
        },
        {
          id: "hist-001-4",
          stage: "Admin",
          decision: "published",
          actorName: "Organizing Administrator",
          actorRole: "Admin",
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: "evt-002",
      title: "RoboWars: Clash of Titans",
      slug: "robowars-2026",
      description: "High-voltage combat robotics competition in 15kg and 30kg weight classes with custom safety arena.",
      category: "Robotics",
      status: "published",
      proposedBy: "Robotics Society",
      proposedByEmail: "member@gdgoenka.ac.in",
      approvedBy: "President Council",
      teamSizeMin: 1,
      teamSizeMax: 4,
      datePlaceholder: "13 October 2026",
      venuePlaceholder: "Mechanical Engineering Arena",
      rulebookUrl: "/docs/robowars-rules.pdf",
      assignedMemberIds: ["mem-002"],
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      presidentStatus: "approved",
      presidentDecisionBy: "President Council",
      presidentDecidedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      presidentComment: "Approved combat arena construction guidelines and safety measures.",
      vpStatus: "approved",
      vpDecisionBy: "Vice President Council",
      vpDecidedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      vpComment: "Arena polycarbonate shielding and emergency power cutoff verified.",
      coordinationStatus: "coordination_ready",
      approvalHistory: [
        {
          id: "hist-002-1",
          stage: "Member",
          decision: "submitted",
          actorName: "Robotics Society",
          actorRole: "AVISHKAR Member",
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: "hist-002-2",
          stage: "President",
          decision: "approved",
          actorName: "President Council",
          actorRole: "President",
          timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
          comment: "Approved combat arena construction guidelines and safety measures.",
        },
        {
          id: "hist-002-3",
          stage: "Vice President",
          decision: "coordinated",
          actorName: "Vice President Council",
          actorRole: "Vice President",
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: "hist-002-4",
          stage: "Admin",
          decision: "published",
          actorName: "Organizing Administrator",
          actorRole: "Admin",
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: "evt-003",
      title: "CodeCraft: Algorithmic Duel",
      slug: "codecraft-2026",
      description: "Speed competitive programming tournament covering graph algorithms, dynamic programming, and systems.",
      category: "Coding",
      status: "approved",
      proposedBy: "Competitive Coding Club",
      proposedByEmail: "member@gdgoenka.ac.in",
      approvedBy: "President Council",
      teamSizeMin: 1,
      teamSizeMax: 2,
      datePlaceholder: "14 October 2026",
      venuePlaceholder: "Auditorium Block A",
      assignedMemberIds: ["mem-003"],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      presidentStatus: "approved",
      presidentDecisionBy: "President Council",
      presidentDecidedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      presidentComment: "Approved algorithmic track. Ready for public scheduling.",
      vpStatus: "approved",
      vpDecisionBy: "Vice President Council",
      vpDecidedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      vpComment: "Judging platform and server auto-grading environment provisioned.",
      coordinationStatus: "coordination_ready",
      approvalHistory: [
        {
          id: "hist-003-1",
          stage: "Member",
          decision: "submitted",
          actorName: "Competitive Coding Club",
          actorRole: "AVISHKAR Member",
          timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
          id: "hist-003-2",
          stage: "President",
          decision: "approved",
          actorName: "President Council",
          actorRole: "President",
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
          comment: "Approved algorithmic track. Ready for public scheduling.",
        },
        {
          id: "hist-003-3",
          stage: "Vice President",
          decision: "coordinated",
          actorName: "Vice President Council",
          actorRole: "Vice President",
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          comment: "Judging platform and server auto-grading environment provisioned.",
        },
      ],
    },
    {
      id: "evt-004",
      title: "DesignX: Next-Gen UI/UX Sprint",
      slug: "designx-2026",
      description: "Interactive rapid product design sprint focusing on accessibility, micro-interactions, and visual systems.",
      category: "Design",
      status: "proposed",
      proposedBy: "Design Guild (Member Submission)",
      proposedByEmail: "member@gdgoenka.ac.in",
      approvedBy: null,
      teamSizeMin: 1,
      teamSizeMax: 3,
      datePlaceholder: "To be confirmed by President",
      venuePlaceholder: "Design Studio 2, Block C",
      assignedMemberIds: ["mem-001"],
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      presidentStatus: "pending",
      vpStatus: "pending",
      approvalHistory: [
        {
          id: "hist-004-1",
          stage: "Member",
          decision: "submitted",
          actorName: "Design Guild (Member Submission)",
          actorRole: "AVISHKAR Member",
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ],
    },
    {
      id: "evt-005",
      title: "CyberShield: Capture The Flag Arena",
      slug: "cybershield-2026",
      description: "Collegiate offensive/defensive cybersecurity challenge covering binary exploitation, web vulnerabilities, and reverse engineering.",
      category: "Coding",
      status: "approved",
      proposedBy: "InfoSec Student Chapter",
      proposedByEmail: "member@gdgoenka.ac.in",
      approvedBy: "President Council",
      teamSizeMin: 2,
      teamSizeMax: 4,
      datePlaceholder: "14 October 2026",
      venuePlaceholder: "Cyber Range, Block B",
      assignedMemberIds: ["mem-002"],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      presidentStatus: "approved",
      presidentDecisionBy: "President Council",
      presidentDecidedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      presidentComment: "Approved topic. VP must complete isolated network coordination prior to release.",
      vpStatus: "pending",
      coordinationStatus: "awaiting_coordination",
      approvalHistory: [
        {
          id: "hist-005-1",
          stage: "Member",
          decision: "submitted",
          actorName: "InfoSec Student Chapter",
          actorRole: "AVISHKAR Member",
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: "hist-005-2",
          stage: "President",
          decision: "approved",
          actorName: "President Council",
          actorRole: "President",
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          comment: "Approved topic. VP must complete isolated network coordination prior to release.",
        },
      ],
    },
    {
      id: "evt-006",
      title: "DroneRace: High-Speed FPV Indoor Circuit",
      slug: "dronerace-2026",
      description: "Indoor high-speed quadcopter racing through illuminated obstacle rings inside the main auditorium.",
      category: "Robotics",
      status: "rejected",
      proposedBy: "Aeromodelling Guild",
      proposedByEmail: "member@gdgoenka.ac.in",
      approvedBy: null,
      teamSizeMin: 1,
      teamSizeMax: 2,
      datePlaceholder: "Pending Venue Approval",
      venuePlaceholder: "Main University Auditorium",
      assignedMemberIds: [],
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      presidentStatus: "rejected",
      presidentDecisionBy: "President Council",
      presidentDecidedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      presidentRejectionReason: "Safety hazard: High-speed lithium-battery drones cannot be safely flown indoors without net containment.",
      rejectionReason: "Safety hazard: High-speed lithium-battery drones cannot be safely flown indoors without net containment.",
      reviewedBy: "President Council",
      reviewedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      vpStatus: "not_required",
      approvalHistory: [
        {
          id: "hist-006-1",
          stage: "Member",
          decision: "submitted",
          actorName: "Aeromodelling Guild",
          actorRole: "AVISHKAR Member",
          timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
          id: "hist-006-2",
          stage: "President",
          decision: "rejected",
          actorName: "President Council",
          actorRole: "President",
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
          rejectionReason: "Safety hazard: High-speed lithium-battery drones cannot be safely flown indoors without net containment.",
        },
      ],
    },
  ];

  const initialForms: EventFormRecord[] = [
    {
      id: "form-001",
      eventId: "evt-001",
      eventTitle: "Hack-a-Sol: 24h Innovation Hackathon",
      formTitle: "Hack-a-Sol 2026 — Team Registration & Problem Track Selection",
      formDescription: "Register your squad, select your technical domain track, and provide repository/project details.",
      isActive: true,
      isPublished: true,
      fields: [
        {
          id: "f-1",
          label: "Team Designation / Squad Name",
          type: "text",
          required: true,
          order: 1,
          placeholder: "e.g., CyberPulse Pioneers",
        },
        {
          id: "f-2",
          label: "Primary Problem Track",
          type: "select",
          required: true,
          order: 2,
          options: ["AI & Intelligent Agents", "Decentralized Systems & Web3", "ClimateTech & Sustainability", "Healthcare Systems"],
        },
        {
          id: "f-3",
          label: "GitHub / Portfolio Repository URL",
          type: "text",
          required: false,
          order: 3,
          placeholder: "https://github.com/...",
        },
        {
          id: "f-4",
          label: "Check-in Arrival Date",
          type: "date",
          required: true,
          order: 4,
        },
        {
          id: "f-5",
          label: "Hardware Requirements or Power Outlet Needs",
          type: "textarea",
          required: false,
          order: 5,
          placeholder: "Specify specialized microcontrollers, GPUs, or high-draw peripherals...",
        },
      ],
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: "form-002",
      eventId: "evt-002",
      eventTitle: "RoboWars: Clash of Titans",
      formTitle: "RoboWars 2026 — Bot Specifications & Safety Verification",
      formDescription: "Provide mechanical specs, weapon mechanism details, and battery safety compliance data.",
      isActive: true,
      isPublished: true,
      fields: [
        {
          id: "f-rw-1",
          label: "Combat Bot Name",
          type: "text",
          required: true,
          order: 1,
          placeholder: "e.g., Titanium Crusher",
        },
        {
          id: "f-rw-2",
          label: "Weight Category",
          type: "select",
          required: true,
          order: 2,
          options: ["15 kg Featherweight", "30 kg Middleweight"],
        },
        {
          id: "f-rw-3",
          label: "Weapon System Type",
          type: "select",
          required: true,
          order: 3,
          options: ["Horizontal Spinner", "Vertical Drum / Disc", "Pneumatic Flipper", "Wedge / Rammer"],
        },
      ],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const initialResources: EventResourceRecord[] = [
    {
      id: "res-001",
      eventId: "evt-001",
      eventTitle: "Hack-a-Sol: 24h Innovation Hackathon",
      title: "Official Rulebook & Evaluation Rubric v2.1",
      category: "rulebook",
      fileUrl: "/docs/hack-a-sol-rules.pdf",
      fileName: "hack-a-sol-rules.pdf",
      fileSize: "2.4 MB",
      uploadedBy: "Dr. Vivek Sharma (SOES)",
      status: "approved",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "res-002",
      eventId: "evt-002",
      eventTitle: "RoboWars: Clash of Titans",
      title: "Arena Safety Guidelines & Weapon Fail-Safe Specs",
      category: "guide",
      fileUrl: "/docs/robowars-safety.pdf",
      fileName: "robowars-safety.pdf",
      fileSize: "1.8 MB",
      uploadedBy: "Robotics Society",
      status: "approved",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "res-003",
      eventId: "evt-003",
      eventTitle: "CodeCraft: Algorithmic Duel",
      title: "Competitive Programming Schedule & Scoring Rules",
      category: "schedule",
      fileUrl: "/docs/codecraft-schedule.pdf",
      fileName: "codecraft-schedule.pdf",
      fileSize: "650 KB",
      uploadedBy: "Competitive Coding Club",
      status: "approved",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  const initialMembers: MemberRecord[] = [
    {
      id: "mem-001",
      fullName: "President Council (Executive Lead)",
      email: "president@gdgoenka.ac.in",
      role: "President",
      department: "School of Engineering & Sciences (SOES)",
      assignedEventIds: ["evt-001", "evt-002", "evt-003", "evt-004"],
      status: "active",
      joinedAt: "2026-01-15T09:00:00Z",
    },
    {
      id: "mem-001b",
      fullName: "Vice President Council (Operations Co-Lead)",
      email: "vp@gdgoenka.ac.in",
      role: "Vice President",
      department: "School of Engineering & Sciences (SOES)",
      assignedEventIds: ["evt-001", "evt-002", "evt-003"],
      status: "active",
      joinedAt: "2026-01-18T10:00:00Z",
    },
    {
      id: "mem-002",
      fullName: "Organizing Administrator",
      email: "admin@gdgoenka.ac.in",
      role: "Admin",
      department: "School of Engineering & Sciences (SOES)",
      assignedEventIds: ["evt-001", "evt-002"],
      status: "active",
      joinedAt: "2026-01-20T10:00:00Z",
    },
    {
      id: "mem-003",
      fullName: "Technical Track Coordinator (Member)",
      email: "member@gdgoenka.ac.in",
      role: "AVISHKAR Member",
      department: "School of Engineering & Sciences (SOES)",
      assignedEventIds: ["evt-003", "evt-004"],
      status: "active",
      joinedAt: "2026-02-01T11:00:00Z",
    },
  ];

  const initialTasks: MemberTaskRecord[] = [
    {
      id: "tsk-001",
      eventId: "evt-001",
      eventTitle: "Hack-a-Sol: 24h Innovation Hackathon",
      memberId: "mem-002",
      memberName: "Organizing Administrator",
      title: "Lab Machine Network Configuration & Cloud Credits",
      description: "Ensure high-speed internet allocation and local server proxies for 50 participating teams.",
      status: "in_progress",
      priority: "high",
      dueDate: "2026-10-13",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "tsk-002",
      eventId: "evt-002",
      eventTitle: "RoboWars: Clash of Titans",
      memberId: "mem-003",
      memberName: "Technical Track Coordinator (Member)",
      title: "Polycarbonate Arena Inspection & Emergency Cutoff Test",
      description: "Verify double-pane Lexan containment and wireless emergency master kill-switch operation.",
      status: "todo",
      priority: "high",
      dueDate: "2026-10-13",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ];

  const initialAuditLogs: AuditLogRecord[] = [
    {
      id: "aud-001",
      action: "EVENT_APPROVED",
      actorId: "usr_president",
      actorEmail: "president@gdgoenka.ac.in",
      actorRole: "President",
      targetType: "event",
      targetId: "evt-001",
      metadata: { details: "Approved 'Hack-a-Sol: 24h Innovation Hackathon' for event schedule." },
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "aud-002",
      action: "EVENT_PUBLISHED",
      actorId: "usr_admin",
      actorEmail: "admin@gdgoenka.ac.in",
      actorRole: "Admin",
      targetType: "event",
      targetId: "evt-001",
      metadata: { details: "Published 'Hack-a-Sol: 24h Innovation Hackathon' to public website." },
      timestamp: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString(),
    },
  ];

  const initialNotifications: NotificationRecord[] = [
    {
      id: "notif-01",
      title: "New Event Proposal",
      message: "Member submitted 'Drone Racing League' for event review.",
      type: "proposal",
      targetRole: "President",
      link: "/admin/president",
      read: false,
      createdAt: "2026-10-12T09:15:00.000Z",
      actorName: "AVISHKAR Member",
    },
    {
      id: "notif-02",
      title: "Proposal Approved",
      message: "President approved 'AI Hackathon 2026'. Ready for VP logistics coordination.",
      type: "approval",
      targetRole: "Vice President",
      link: "/admin/vice-president",
      read: false,
      createdAt: "2026-10-12T09:45:00.000Z",
      actorName: "President Council",
    },
    {
      id: "notif-03",
      title: "Committee Duty Assigned",
      message: "Vice President assigned: 'Arena Safety & Power Setup for Robotics Challenge'.",
      type: "task",
      targetRole: "AVISHKAR Member",
      targetEmail: "member@gdgoenka.ac.in",
      link: "/admin/member",
      read: false,
      createdAt: "2026-10-12T10:00:00.000Z",
      actorName: "Vice President",
    },
    {
      id: "notif-04",
      title: "Event Track Published",
      message: "Admin published 'AI Hackathon 2026' to public attendee catalogue.",
      type: "publish",
      targetRole: "all",
      link: "/events",
      read: true,
      createdAt: "2026-10-12T10:30:00.000Z",
      actorName: "Portal Admin",
    },
  ];

  const initialReadinessItems: EventReadinessItem[] = [
    // evt-001 (Hack-a-Sol)
    {
      id: "rdy-001-01",
      eventId: "evt-001",
      category: "venue_seating",
      title: "Auditorium & Lab 3 Seating Allocation (120 Capacity)",
      description: "Dual-row workstation desk layout with dedicated power rails.",
      isMandatory: true,
      status: "completed",
      responsibleMemberId: "mem-003",
      responsibleMemberName: "Technical Track Coordinator (Member)",
      deadline: "2026-10-20",
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedBy: "Technical Track Coordinator",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "rdy-001-02",
      eventId: "evt-001",
      category: "equipment_technical",
      title: "Dedicated Gigabit Wi-Fi SSIDs & Core Switch Uplinks",
      description: "Isolated VLAN for hackathon attendees with priority bandwidth shaping.",
      isMandatory: true,
      status: "completed",
      responsibleMemberId: "mem-003",
      responsibleMemberName: "Technical Track Coordinator (Member)",
      deadline: "2026-10-21",
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      completedBy: "Technical Track Coordinator",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "rdy-001-03",
      eventId: "evt-001",
      category: "committee_volunteers",
      title: "Mentor Roster & 24h Evaluator Shift Briefings",
      description: "Confirmation of faculty mentors and industry jury members.",
      isMandatory: true,
      status: "completed",
      responsibleMemberId: "mem-002",
      responsibleMemberName: "Vice President Council (Operations Co-Lead)",
      deadline: "2026-10-22",
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      completedBy: "Vice President Council",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "rdy-001-04",
      eventId: "evt-001",
      category: "logistics_materials",
      title: "Participant ID Badges & Lanyards Printed",
      description: "Color-coded participant, mentor, and organizer pass badges.",
      isMandatory: false,
      status: "completed",
      responsibleMemberId: "mem-001",
      responsibleMemberName: "Organizing Administrator",
      deadline: "2026-10-22",
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedBy: "Organizing Administrator",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "rdy-001-05",
      eventId: "evt-001",
      category: "scheduling_coordination",
      title: "24-Hour Event Timeline & Emergency Lab Access Protocols",
      description: "Signed campus safety clearance and night-pass protocols.",
      isMandatory: true,
      status: "completed",
      responsibleMemberId: "mem-002",
      responsibleMemberName: "Vice President Council (Operations Co-Lead)",
      deadline: "2026-10-22",
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      completedBy: "Vice President Council",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    // evt-002 (RoboWars)
    {
      id: "rdy-002-01",
      eventId: "evt-002",
      category: "venue_seating",
      title: "Polycarbonate Arena Containment Enclosure Certified",
      description: "8mm polycarbonate double-wall impact containment inspection.",
      isMandatory: true,
      status: "completed",
      responsibleMemberId: "mem-003",
      responsibleMemberName: "Technical Track Coordinator (Member)",
      deadline: "2026-10-20",
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedBy: "Technical Track Coordinator",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "rdy-002-02",
      eventId: "evt-002",
      category: "equipment_technical",
      title: "Master Wireless Emergency Arena Kill-Switch Certified",
      description: "Independent RF cutoff tested on both 433MHz and 2.4GHz bands.",
      isMandatory: true,
      status: "completed",
      responsibleMemberId: "mem-003",
      responsibleMemberName: "Technical Track Coordinator (Member)",
      deadline: "2026-10-21",
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      completedBy: "Technical Track Coordinator",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "rdy-002-03",
      eventId: "evt-002",
      category: "logistics_materials",
      title: "Spare Lexan Replacement Shields & Steel Floor Rivets",
      description: "Reserve panels for arena maintenance between combat brackets.",
      isMandatory: false,
      status: "blocked",
      responsibleMemberId: "mem-001",
      responsibleMemberName: "Organizing Administrator",
      deadline: "2026-10-21",
      notes: "Freight delayed by supplier; backup vendor contacted.",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "rdy-002-04",
      eventId: "evt-002",
      category: "equipment_technical",
      title: "LiPo Battery Fire Safe Containment & Charging Bench",
      description: "Explosion-proof charging boxes and dry chemical fire extinguishers.",
      isMandatory: true,
      status: "pending",
      responsibleMemberId: "mem-003",
      responsibleMemberName: "Technical Track Coordinator (Member)",
      deadline: "2026-10-23",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: "rdy-002-05",
      eventId: "evt-002",
      category: "committee_volunteers",
      title: "Scrutineers & Pit Marshals Safety Briefing",
      description: "Weight class calibration and fail-safe radio check training.",
      isMandatory: true,
      status: "completed",
      responsibleMemberId: "mem-002",
      responsibleMemberName: "Vice President Council (Operations Co-Lead)",
      deadline: "2026-10-22",
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      completedBy: "Vice President Council",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  const initialBlockers: OperationalBlockerRecord[] = [
    {
      id: "blk-001",
      eventId: "evt-002",
      eventTitle: "RoboWars: Clash of Titans",
      taskId: "tsk-002",
      taskTitle: "Polycarbonate Arena Inspection & Emergency Cutoff Test",
      title: "Delayed Shipment of Heavy-Duty Lexan Panels",
      description: "Supplier reported a 48-hour freight delay on 8mm polycarbonate replacement panels required for arena blast shield reinforcement.",
      severity: "high",
      operationalImpact: "Spare Lexan shield needed before live combat rounds; backup supplier quotation obtained.",
      reportedBy: "Technical Track Coordinator (Member)",
      reportedByEmail: "member@gdgoenka.ac.in",
      reportedByRole: "AVISHKAR Member",
      reportedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      assignedToId: "mem-002",
      assignedToName: "Vice President Council (Operations Co-Lead)",
      assignedToEmail: "vp@gdgoenka.ac.in",
      resolutionDeadline: "2026-10-22",
      status: "open",
      history: [
        {
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          actorName: "Technical Track Coordinator (Member)",
          actorRole: "AVISHKAR Member",
          action: "BLOCKER_REPORTED",
          notes: "Reported supplier logistics delay.",
        },
      ],
    },
    {
      id: "blk-002",
      eventId: "evt-001",
      eventTitle: "Hack-a-Sol: 24h Innovation Hackathon",
      title: "Subnet IP Exhaustion in Lab 3 Dual-Band Router",
      description: "DHCP scope in Lab 3 was configured for /26 (64 IPs), but expected participant devices plus mentors exceed 140 devices.",
      severity: "critical",
      operationalImpact: "Participants will fail to obtain IP addresses during initial registration and repository checkout.",
      reportedBy: "Vice President Council",
      reportedByEmail: "vp@gdgoenka.ac.in",
      reportedByRole: "Vice President",
      reportedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      assignedToId: "mem-003",
      assignedToName: "Technical Track Coordinator (Member)",
      assignedToEmail: "member@gdgoenka.ac.in",
      resolutionDeadline: "2026-10-21",
      status: "in_progress",
      history: [
        {
          timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
          actorName: "Vice President Council",
          actorRole: "Vice President",
          action: "BLOCKER_REPORTED",
          notes: "Identified during network pre-flight testing.",
        },
        {
          timestamp: new Date(Date.now() - 86400000 * 1 + 3600000).toISOString(),
          actorName: "Technical Track Coordinator (Member)",
          actorRole: "AVISHKAR Member",
          action: "STATUS_UPDATED",
          notes: "Campus IT contacted to expand subnet mask to /24.",
        },
      ],
    },
  ];

  return {
    events: initialEvents,
    forms: initialForms,
    formSubmissions: [],
    resources: initialResources,
    members: initialMembers,
    tasks: initialTasks,
    auditLogs: initialAuditLogs,
    councilCredentials: initialCredentials,
    registrations: [],
    notifications: initialNotifications,
    googleFormResponses: [],
    photos: [],
    readinessItems: initialReadinessItems,
    blockers: initialBlockers,
    emailNotifications: [],
  };
}

/**
 * Reads data store from disk with automatic seed creation.
 */
export function readDataStore(): StoreData {
  if (globalThis.__avishkar_memory_store) {
    return globalThis.__avishkar_memory_store;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        // directory may already exist or be locked transiently
      }
    }

    if (!fs.existsSync(STORE_FILE)) {
      const initial = getInitialStore();
      try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
      } catch {
        // ignore write error on read-only environments
      }
      globalThis.__avishkar_memory_store = initial;
      return initial;
    }

    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);

    // Merge in any missing arrays if schema evolved
    const initial = getInitialStore();

    // Ensure newly added roles (like Vice President) are merged into council credentials
    const existingCreds: CouncilCredential[] = parsed.councilCredentials || [];
    const mergedCreds = [...existingCreds];
    for (const initCred of initial.councilCredentials) {
      if (!mergedCreds.some((c) => c.email.toLowerCase() === initCred.email.toLowerCase())) {
        mergedCreds.push(initCred);
      }
    }

    // Ensure newly added members (like Vice President) are merged into council roster
    const existingMembers: MemberRecord[] = parsed.members || [];
    const mergedMembers = [...existingMembers];
    for (const initMem of initial.members) {
      if (!mergedMembers.some((m) => m.email.toLowerCase() === initMem.email.toLowerCase())) {
        mergedMembers.push(initMem);
      }
    }

    // Ensure all existing events have accurate presidentStatus, vpStatus, and approvalHistory
    const rawEvents: EventRecord[] = parsed.events || initial.events;
    // Also include any initial events that aren't in rawEvents yet (like newly seeded evt-005, evt-006)
    const allMergedEvents: EventRecord[] = [...rawEvents];
    for (const initEvt of initial.events) {
      if (!allMergedEvents.some((e) => e.id === initEvt.id)) {
        allMergedEvents.push(initEvt);
      }
    }

    const migratedEvents = allMergedEvents.map((evt) => {
      const initMatch = initial.events.find((ie) => ie.id === evt.id);

      const presidentStatus =
        evt.presidentStatus ||
        (initMatch ? initMatch.presidentStatus : undefined) ||
        (evt.status === "approved" || evt.status === "published" || evt.approvedBy
          ? "approved"
          : evt.status === "rejected"
          ? "rejected"
          : evt.status === "proposed"
          ? "pending"
          : "not_required");

      const vpStatus =
        evt.vpStatus ||
        (initMatch ? initMatch.vpStatus : undefined) ||
        (evt.status === "published" || evt.coordinationStatus === "coordination_ready"
          ? "approved"
          : evt.status === "rejected"
          ? "not_required"
          : evt.status === "approved"
          ? (evt.coordinationStatus === "in_coordination" ? "in_coordination" : "pending")
          : "not_required");

      const approvalHistory =
        evt.approvalHistory && evt.approvalHistory.length > 0
          ? evt.approvalHistory
          : initMatch && initMatch.approvalHistory
          ? initMatch.approvalHistory
          : [
              {
                id: `hist-${evt.id}-init`,
                stage: "Member" as const,
                decision: (evt.status === "draft" ? "draft" : "submitted") as ApprovalHistoryEntry["decision"],
                actorName: evt.proposedBy || "Event Coordinator",
                timestamp: evt.submittedAt || evt.createdAt || new Date().toISOString(),
              },
              ...(presidentStatus === "approved"
                ? [
                    {
                      id: `hist-${evt.id}-pres`,
                      stage: "President" as const,
                      decision: "approved" as const,
                      actorName: evt.presidentDecisionBy || evt.approvedBy || "President Council",
                      timestamp:
                        evt.presidentDecidedAt ||
                        evt.reviewedAt ||
                        evt.updatedAt ||
                        new Date().toISOString(),
                      comment: evt.presidentComment || "Approved by President Council.",
                    },
                  ]
                : presidentStatus === "rejected"
                ? [
                    {
                      id: `hist-${evt.id}-pres-rej`,
                      stage: "President" as const,
                      decision: "rejected" as const,
                      actorName: evt.presidentDecisionBy || evt.reviewedBy || "President Council",
                      timestamp:
                        evt.presidentDecidedAt ||
                        evt.reviewedAt ||
                        evt.updatedAt ||
                        new Date().toISOString(),
                      rejectionReason: evt.rejectionReason || "Proposal rejected.",
                    },
                  ]
                : []),
              ...(vpStatus === "approved"
                ? [
                    {
                      id: `hist-${evt.id}-vp`,
                      stage: "Vice President" as const,
                      decision: "coordinated" as const,
                      actorName: evt.vpDecisionBy || "Vice President Council",
                      timestamp: evt.vpDecidedAt || evt.updatedAt || new Date().toISOString(),
                      comment: evt.vpComment || "Logistics coordinated.",
                    },
                  ]
                : []),
              ...(evt.status === "published"
                ? [
                    {
                      id: `hist-${evt.id}-pub`,
                      stage: "Admin" as const,
                      decision: "published" as const,
                      actorName: "Organizing Administrator",
                      timestamp: evt.updatedAt || new Date().toISOString(),
                    },
                  ]
                : []),
            ];

      const rawSource = evt.creationSource || (initMatch ? initMatch.creationSource : undefined);
      const creationSource: "MEMBER_PROPOSAL" | "ADMIN_DIRECT" =
        rawSource === "admin" || rawSource === "ADMIN_DIRECT"
          ? "ADMIN_DIRECT"
          : "MEMBER_PROPOSAL";

      return {
        ...evt,
        creationSource,
        presidentStatus,
        presidentDecisionBy:
          evt.presidentDecisionBy ||
          (initMatch ? initMatch.presidentDecisionBy : presidentStatus === "approved" ? "President Council" : null),
        presidentDecidedAt:
          evt.presidentDecidedAt || (initMatch ? initMatch.presidentDecidedAt : null),
        presidentComment:
          evt.presidentComment || (initMatch ? initMatch.presidentComment : null),
        presidentRejectionReason:
          evt.presidentRejectionReason ||
          (initMatch ? initMatch.presidentRejectionReason : evt.rejectionReason || null),
        vpStatus,
        vpDecisionBy:
          evt.vpDecisionBy ||
          (initMatch ? initMatch.vpDecisionBy : vpStatus === "approved" ? "Vice President Council" : null),
        vpDecidedAt: evt.vpDecidedAt || (initMatch ? initMatch.vpDecidedAt : null),
        vpComment: evt.vpComment || (initMatch ? initMatch.vpComment : null),
        vpRejectionReason:
          evt.vpRejectionReason || (initMatch ? initMatch.vpRejectionReason : null),
        approvalHistory,
      };
    });

    // Sanitize any demo/placeholder Google Form references
    const sanitizedEvents = migratedEvents.map((e) => {
      if (
        e.googleFormId &&
        (e.googleFormId.includes("Demo") ||
          e.googleFormId.includes("mock") ||
          e.googleFormId.includes("sandbox"))
      ) {
        const copy = { ...e };
        delete copy.googleFormId;
        delete copy.googleFormUrl;
        delete copy.googleFormEditUrl;
        delete copy.googleFormVerified;
        delete copy.googleFormVerifiedAt;
        return copy;
      }
      return e;
    });

    const rawForms: EventFormRecord[] = parsed.forms || initial.forms;
    const sanitizedForms = rawForms.map((f) => {
      if (
        f.googleFormId &&
        (f.googleFormId.includes("Demo") ||
          f.googleFormId.includes("mock") ||
          f.googleFormId.includes("sandbox"))
      ) {
        const copy = { ...f };
        delete copy.googleFormId;
        delete copy.googleFormUrl;
        delete copy.googleFormEditUrl;
        delete copy.googleFormVerified;
        delete copy.googleFormVerifiedAt;
        return copy;
      }
      return f;
    });

    const rawPhotos: EventPhotoRecord[] = parsed.photos || [];

    // Ensure events reflect latest cover photo and photo count
    const enrichedEvents = sanitizedEvents.map((evt) => {
      const eventPhotos = rawPhotos.filter((p) => p.eventId === evt.id);
      const coverPhoto = eventPhotos.find((p) => p.isCover) || eventPhotos[0];
      return {
        ...evt,
        photoCount: eventPhotos.length,
        coverPhotoId: coverPhoto ? coverPhoto.id : evt.coverPhotoId,
        coverPhotoUrl: coverPhoto ? coverPhoto.url : evt.coverPhotoUrl,
      };
    });

    const finalStore: StoreData = {
      events: enrichedEvents,
      forms: sanitizedForms,
      formSubmissions: parsed.formSubmissions || [],
      resources: parsed.resources || initial.resources,
      members: mergedMembers,
      tasks: parsed.tasks || initial.tasks,
      auditLogs: parsed.auditLogs || initial.auditLogs,
      councilCredentials: mergedCreds,
      registrations: parsed.registrations || [],
      notifications:
        parsed.notifications && parsed.notifications.length > 0
          ? parsed.notifications
          : initial.notifications,
      googleFormResponses: parsed.googleFormResponses || [],
      photos: rawPhotos,
      readinessItems:
        parsed.readinessItems && parsed.readinessItems.length > 0
          ? parsed.readinessItems
          : initial.readinessItems || [],
      blockers:
        parsed.blockers && parsed.blockers.length > 0
          ? parsed.blockers
          : initial.blockers || [],
      documents: parsed.documents || {},
      emailNotifications: parsed.emailNotifications || [],
    };
    globalThis.__avishkar_memory_store = finalStore;
    return finalStore;
  } catch (err) {
    console.error("Error reading data store, using initial seed:", err);
    const initial = getInitialStore();
    globalThis.__avishkar_memory_store = initial;
    return initial;
  }
}

/**
 * Writes data store to disk atomically.
 */
export function writeDataStore(data: StoreData): void {
  globalThis.__avishkar_memory_store = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        // directory may already exist or be locked transiently
      }
    }
    const content = JSON.stringify(data, null, 2);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.writeFileSync(STORE_FILE, content, "utf8");
        break;
      } catch (err: unknown) {
        const error = err as { code?: string };
        if (error && (error.code === "EBUSY" || error.code === "EPERM") && attempt < 4) {
          const start = Date.now();
          while (Date.now() - start < 40) {}
          continue;
        }
        throw err;
      }
    }
  } catch {
    // Filesystem write errors in read-only / bundle environments are safely ignored
  }
}

/**
 * Validates a council user's credentials against provisioned local council store.
 */
export function authenticateLocalCouncil(
  email: string,
  password: string
): { authenticated: boolean; user?: { email: string; role: AdminRole; fullName: string } } {
  const store = readDataStore();
  const cleanEmail = email.trim().toLowerCase();
  const cred = store.councilCredentials.find((c) => c.email.toLowerCase() === cleanEmail);

  if (!cred) {
    return { authenticated: false };
  }

  const hash = hashPassword(password, cred.salt);
  if (hash === cred.passwordHash) {
    return {
      authenticated: true,
      user: {
        email: cred.email,
        role: cred.role,
        fullName: cred.fullName,
      },
    };
  }

  // Fallback to initial seed credential for council accounts (e.g. after test resets)
  const initial = getInitialStore();
  const initCred = initial.councilCredentials.find((c) => c.email.toLowerCase() === cleanEmail);
  if (initCred) {
    const initHash = hashPassword(password, initCred.salt);
    if (initHash === initCred.passwordHash) {
      return {
        authenticated: true,
        user: {
          email: initCred.email,
          role: cred.role || initCred.role,
          fullName: cred.fullName || initCred.fullName,
        },
      };
    }
  }

  return { authenticated: false };
}

/**
 * Resets a council member's password or provisions credentials with a secure salt and hash.
 * Plaintext passwords are NEVER stored in the database or store.
 */
export function resetCouncilCredential(
  email: string,
  newPassword?: string
): { success: boolean; tempPassword?: string; error?: string } {
  const store = readDataStore();
  const cleanEmail = email.trim().toLowerCase();
  const cred = store.councilCredentials.find((c) => c.email.toLowerCase() === cleanEmail);
  const member = store.members.find((m) => m.email.toLowerCase() === cleanEmail);

  const tempPassword = newPassword || `Avishkar@${Math.floor(100000 + Math.random() * 900000)}`;
  const salt = `salt_${Date.now()}`;
  const passwordHash = hashPassword(tempPassword, salt);

  if (cred) {
    cred.salt = salt;
    cred.passwordHash = passwordHash;
  } else {
    store.councilCredentials.push({
      email: cleanEmail,
      salt,
      passwordHash,
      role: member ? member.role : "AVISHKAR Member",
      fullName: member ? member.fullName : "Council Member",
    });
  }

  writeDataStore(store);
  return { success: true, tempPassword };
}

/**
 * Accidental Lockout Prevention: Verifies whether a council member can be safely deactivated or removed.
 * Blocks deactivating the last active Administrator or sole active President.
 */
export function canDeactivateMember(memberIdOrEmail: string): { allowed: boolean; reason?: string } {
  const store = readDataStore();
  const clean = memberIdOrEmail.trim().toLowerCase();
  const member = store.members.find(
    (m) => m.id.toLowerCase() === clean || m.email.toLowerCase() === clean
  );
  if (!member) return { allowed: false, reason: "Member record not found in council roster." };

  if (member.role === "Admin") {
    const activeAdmins = store.members.filter((m) => m.role === "Admin" && m.status === "active");
    const otherActiveAdmins = activeAdmins.filter(
      (m) => m.id.toLowerCase() !== member.id.toLowerCase() && m.email.toLowerCase() !== member.email.toLowerCase()
    );
    if (otherActiveAdmins.length === 0) {
      return {
        allowed: false,
        reason: "Security Guardrail: Cannot deactivate the last active authorized Administrator account.",
      };
    }
  }

  if (member.role === "President") {
    const activePresidents = store.members.filter((m) => m.role === "President" && m.status === "active");
    const otherActivePresidents = activePresidents.filter(
      (m) => m.id.toLowerCase() !== member.id.toLowerCase() && m.email.toLowerCase() !== member.email.toLowerCase()
    );
    if (otherActivePresidents.length === 0) {
      return {
        allowed: false,
        reason: "Security Guardrail: Cannot deactivate the last active primary executive President account.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Returns registration count for a specific event (including form submissions and direct registrations)
 */
export function getEventRegistrationCount(eventId: string): number {
  const store = readDataStore();
  const formSubmissionsCount = (store.formSubmissions || []).filter((s) => s.eventId === eventId).length;
  const directRegsCount = (store.registrations || []).filter((r) => r.event_id === eventId).length;
  return formSubmissionsCount + directRegsCount;
}

// -----------------------------------------------------------------------------
// STORE DATA ACCESS HELPERS
// -----------------------------------------------------------------------------

export function getStoredEvents(): EventRecord[] {
  return readDataStore().events;
}

export function saveStoredEvent(event: EventRecord): void {
  const store = readDataStore();
  const idx = store.events.findIndex((e) => e.id === event.id);
  if (idx >= 0) {
    store.events[idx] = event;
  } else {
    store.events.unshift(event);
  }
  writeDataStore(store);
}

export function deleteStoredEvent(eventId: string): void {
  const store = readDataStore();
  store.events = store.events.filter((e) => e.id !== eventId);
  writeDataStore(store);
}

export function getStoredForms(eventId?: string): EventFormRecord[] {
  const store = readDataStore();
  if (eventId) {
    return store.forms.filter((f) => f.eventId === eventId);
  }
  return store.forms;
}

export function saveStoredForm(form: EventFormRecord): void {
  const store = readDataStore();
  const idx = store.forms.findIndex((f) => f.id === form.id || f.eventId === form.eventId);
  if (idx >= 0) {
    store.forms[idx] = form;
  } else {
    store.forms.push(form);
  }
  writeDataStore(store);
}

export function getStoredFormSubmissions(eventId?: string): EventFormSubmission[] {
  const store = readDataStore();
  if (eventId) {
    return store.formSubmissions.filter((s) => s.eventId === eventId);
  }
  return store.formSubmissions;
}

export function saveStoredFormSubmission(submission: EventFormSubmission): void {
  const store = readDataStore();
  store.formSubmissions.push(submission);
  writeDataStore(store);
}

export function getStoredResources(eventId?: string): EventResourceRecord[] {
  const store = readDataStore();
  if (eventId && eventId !== "ALL") {
    return store.resources.filter((r) => r.eventId === eventId);
  }
  return store.resources;
}

export function saveStoredResource(resource: EventResourceRecord): void {
  const store = readDataStore();
  const idx = store.resources.findIndex((r) => r.id === resource.id);
  if (idx >= 0) {
    store.resources[idx] = resource;
  } else {
    store.resources.unshift(resource);
  }
  writeDataStore(store);
}

export function deleteStoredResource(resourceId: string): void {
  const store = readDataStore();
  store.resources = store.resources.filter((r) => r.id !== resourceId);
  writeDataStore(store);
}

export function getStoredMembers(): MemberRecord[] {
  return readDataStore().members;
}

export function saveStoredMember(member: MemberRecord): void {
  const store = readDataStore();
  const idx = store.members.findIndex((m) => m.id === member.id || m.email === member.email);
  if (idx >= 0) {
    store.members[idx] = member;
  } else {
    store.members.push(member);
  }
  writeDataStore(store);
}

export function getStoredTasks(memberId?: string): MemberTaskRecord[] {
  const store = readDataStore();
  if (memberId) {
    return store.tasks.filter((t) => t.memberId === memberId);
  }
  return store.tasks;
}

export function saveStoredTask(task: MemberTaskRecord): void {
  const store = readDataStore();
  const idx = store.tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    store.tasks[idx] = task;
  } else {
    store.tasks.unshift(task);
  }
  writeDataStore(store);
}

export function getStoredAuditLogs(): AuditLogRecord[] {
  return readDataStore().auditLogs;
}

export function saveStoredAuditLog(log: AuditLogRecord): void {
  const store = readDataStore();
  store.auditLogs.unshift(log);
  // Keep last 200 logs
  if (store.auditLogs.length > 200) {
    store.auditLogs = store.auditLogs.slice(0, 200);
  }
  writeDataStore(store);
}

// -----------------------------------------------------------------------------
// REGISTRATION STORAGE HELPERS
// -----------------------------------------------------------------------------

export function getStoredRegistrations(): RegistrationRecord[] {
  return readDataStore().registrations || [];
}

export function saveStoredRegistration(reg: RegistrationRecord): void {
  const store = readDataStore();
  if (!store.registrations) store.registrations = [];
  const idx = store.registrations.findIndex(
    (r) => r.id === reg.id || r.registration_number === reg.registration_number
  );
  if (idx >= 0) {
    store.registrations[idx] = reg;
  } else {
    store.registrations.unshift(reg);
  }
  writeDataStore(store);
}

export function updateStoredRegistrationPayment(
  registrationId: string,
  action: "approve" | "verify" | "reject" | "pending",
  rejectionReason?: string,
  notes?: string,
  actorEmail?: string
): RegistrationRecord | null {
  const store = readDataStore();
  if (!store.registrations) return null;
  const reg = store.registrations.find(
    (r) => r.id === registrationId || r.registration_number === registrationId
  );
  if (!reg) return null;

  const nowIso = new Date().toISOString();
  reg.payment_status = (action === "approve" || action === "verify") ? "verified" : action === "pending" ? "pending_verification" : "rejected";
  reg.verified_at = action === "pending" ? null : nowIso;
  reg.verified_by = action === "pending" ? null : (actorEmail || "admin");
  reg.admin_review_notes =
    action === "reject"
      ? `[Payment Rejected]: ${rejectionReason || ""}${notes ? ` | Notes: ${notes}` : ""}`
      : (action === "approve" || action === "verify")
      ? `[Payment Approved by ${actorEmail || "admin"}]${notes ? ` | Notes: ${notes}` : ""}`
      : `[Payment Status Reset to Pending by ${actorEmail || "admin"}]${notes ? ` | Notes: ${notes}` : ""}`;
  
  if (!reg.verification_history) {
    reg.verification_history = [];
  }
  reg.verification_history.unshift({
    action: action === "pending" ? "pending" : (action === "verify" ? "approve" : action),
    actorEmail: actorEmail || "admin",
    timestamp: nowIso,
    reason: rejectionReason,
    notes,
  });

  reg.updated_at = nowIso;
  writeDataStore(store);
  return reg;
}

export function getStoredRegistrationById(registrationId: string): RegistrationRecord | null {
  const store = readDataStore();
  if (!store.registrations) return null;
  return (
    store.registrations.find(
      (r) => r.id === registrationId || r.registration_number === registrationId
    ) || null
  );
}

export function updateStoredRegistrationStudent(
  registrationId: string,
  action: "approve" | "verify" | "reject" | "pending",
  rejectionReason?: string,
  notes?: string,
  actorEmail?: string,
  requirePaymentVerified?: boolean
): RegistrationRecord | null {
  const store = readDataStore();
  if (!store.registrations) return null;
  const reg = store.registrations.find(
    (r) => r.id === registrationId || r.registration_number === registrationId
  );
  if (!reg) return null;

  if ((action === "approve" || (requirePaymentVerified && action === "verify")) && reg.payment_status !== "verified") {
    const error: any = new Error("Payment Verification Pending. Final registration approval requires a verified payment. Please verify the payment in the Payments module first.");
    error.code = "PAYMENT_NOT_VERIFIED";
    throw error;
  }

  const nowIso = new Date().toISOString();
  reg.student_verification_status = (action === "approve" || action === "verify") ? "verified" : action === "pending" ? "pending" : "rejected";
  reg.student_verified_at = action === "pending" ? null : nowIso;
  reg.student_verified_by = action === "pending" ? null : (actorEmail || "admin");
  reg.student_verification_notes =
    action === "reject"
      ? `[Student Rejected]: ${rejectionReason || ""}${notes ? ` | Notes: ${notes}` : ""}`
      : (action === "approve" || action === "verify")
      ? `[Student Verified by ${actorEmail || "admin"}]${notes ? ` | Notes: ${notes}` : ""}`
      : `[Student Verification Reset to Pending by ${actorEmail || "admin"}]${notes ? ` | Notes: ${notes}` : ""}`;

  if (!reg.verification_history) {
    reg.verification_history = [];
  }
  reg.verification_history.unshift({
    action: action === "pending" ? "pending" : (action === "verify" ? "approve" : action),
    actorEmail: actorEmail || "admin",
    timestamp: nowIso,
    reason: rejectionReason,
    notes,
  });

  reg.updated_at = nowIso;
  writeDataStore(store);
  return reg;
}

export function approveStoredRegistration(params: {
  registrationId: string;
  actorEmail?: string;
  notes?: string;
}): RegistrationRecord | null {
  const store = readDataStore();
  if (!store.registrations) return null;
  const reg = store.registrations.find(
    (r) => r.id === params.registrationId || r.registration_number === params.registrationId
  );
  if (!reg) return null;

  const nowIso = new Date().toISOString();
  reg.student_verification_status = "verified";
  reg.payment_status = "verified";
  reg.verified_by = params.actorEmail || "admin";
  reg.verified_at = nowIso;
  reg.student_verified_at = nowIso;
  reg.student_verified_by = params.actorEmail || "admin";
  reg.student_verification_notes = params.notes || "Student ID card and university affiliation verified.";

  const combinedNotes = `[STUDENT_STATUS: verified]\n[PAYMENT_STATUS: verified]\n[VERIFIED_BY: ${params.actorEmail || "admin"}]\n[VERIFIED_AT: ${nowIso}]\n${params.notes ? `[NOTES: ${params.notes}]` : ""}`;
  reg.admin_review_notes = reg.admin_review_notes ? `${reg.admin_review_notes}\n${combinedNotes}` : combinedNotes;

  if (!reg.verification_history) reg.verification_history = [];
  reg.verification_history.unshift({
    action: "approve",
    actorEmail: params.actorEmail || "admin",
    timestamp: nowIso,
    notes: params.notes || "Dual approval confirmed (Student Affiliation & Payment verified).",
  });

  reg.updated_at = nowIso;
  writeDataStore(store);
  return reg;
}

export function rejectStoredRegistration(params: {
  registrationId: string;
  rejectionReason: string;
  actorEmail?: string;
  notes?: string;
  rejectPaymentToo?: boolean;
}): RegistrationRecord | null {
  const store = readDataStore();
  if (!store.registrations) return null;
  const reg = store.registrations.find(
    (r) => r.id === params.registrationId || r.registration_number === params.registrationId
  );
  if (!reg) return null;

  const nowIso = new Date().toISOString();
  reg.student_verification_status = "rejected";
  if (params.rejectPaymentToo) {
    reg.payment_status = "rejected";
  }
  reg.verified_by = params.actorEmail || "admin";
  reg.verified_at = nowIso;
  reg.student_verified_at = nowIso;
  reg.student_verified_by = params.actorEmail || "admin";
  reg.rejection_reason = params.rejectionReason;
  reg.student_rejection_reason = params.rejectionReason;

  const combinedNotes = `[STUDENT_STATUS: rejected]\n[PAYMENT_STATUS: ${reg.payment_status}]\n[REJECTION_REASON: ${params.rejectionReason}]\n[REJECTED_BY: ${params.actorEmail || "admin"}]\n[REJECTED_AT: ${nowIso}]${params.notes ? `\n[NOTES: ${params.notes}]` : ""}`;
  reg.admin_review_notes = reg.admin_review_notes ? `${reg.admin_review_notes}\n${combinedNotes}` : combinedNotes;

  if (!reg.verification_history) reg.verification_history = [];
  reg.verification_history.unshift({
    action: "reject",
    actorEmail: params.actorEmail || "admin",
    timestamp: nowIso,
    reason: params.rejectionReason,
    notes: params.notes,
  });

  reg.updated_at = nowIso;
  writeDataStore(store);
  return reg;
}

export function saveStoredDocument(doc: StoredDocument): void {
  const store = readDataStore();
  if (!store.documents) store.documents = {};
  store.documents[doc.id] = doc;
  const cleanId = doc.id.replace(/^(local:(id_cards|receipts)\/|student-id-cards\/|payment-receipts\/|\/)+/, "");
  const base = path.basename(cleanId);
  store.documents[base] = doc;
  store.documents[cleanId] = doc;
  writeDataStore(store);
}

export function getStoredDocument(idOrPath: string): StoredDocument | null {
  if (!idOrPath) return null;
  const store = readDataStore();
  if (!store.documents) return null;

  if (store.documents[idOrPath]) return store.documents[idOrPath];

  const clean = idOrPath.replace(/^(local:(id_cards|receipts)\/|student-id-cards\/|payment-receipts\/|\/)+/, "");
  if (store.documents[clean]) return store.documents[clean];

  const base = path.basename(clean);
  if (store.documents[base]) return store.documents[base];

  for (const [key, doc] of Object.entries(store.documents)) {
    if (key.includes(base) || (doc.fileName && doc.fileName === base)) {
      return doc;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS STORAGE HELPERS
// -----------------------------------------------------------------------------

export function getStoredNotifications(role?: string, email?: string): NotificationRecord[] {
  const store = readDataStore();
  const all = store.notifications || [];
  if (!role && !email) return all;
  return all.filter((n) => {
    if (n.targetRole === "all") return true;
    if (n.targetEmail) {
      return email ? n.targetEmail.toLowerCase() === email.toLowerCase() : false;
    }
    if (role && n.targetRole === role) return true;
    if (email && n.targetEmail && n.targetEmail.toLowerCase() === email.toLowerCase()) return true;
    return false;
  });
}

export function saveStoredNotification(notif: NotificationRecord): boolean {
  const store = readDataStore();
  if (!store.notifications) store.notifications = [];

  // Prevent duplicate unread notifications within 2 hours
  const twoHoursAgo = Date.now() - 2 * 3600 * 1000;
  const isDuplicate = store.notifications.some((n) => {
    const isSameTargetRole = n.targetRole === notif.targetRole;
    const isSameTargetEmail =
      (!notif.targetEmail && !n.targetEmail) ||
      (Boolean(n.targetEmail) && Boolean(notif.targetEmail) && n.targetEmail?.toLowerCase() === notif.targetEmail?.toLowerCase());
    const isSameTitle = n.title === notif.title;
    const isSameType = n.type === notif.type;
    const isSameLink = n.link === notif.link;
    const isRecent = new Date(n.createdAt).getTime() > twoHoursAgo;
    return isSameTargetRole && isSameTargetEmail && isSameTitle && isSameType && isSameLink && isRecent && !n.read;
  });

  if (isDuplicate) {
    return false;
  }

  store.notifications.unshift(notif);
  if (store.notifications.length > 150) {
    store.notifications = store.notifications.slice(0, 150);
  }
  writeDataStore(store);
  return true;
}

export function markStoredNotificationRead(id: string): void {
  const store = readDataStore();
  if (!store.notifications) return;
  const target = store.notifications.find((n) => n.id === id);
  if (target) {
    target.read = true;
    writeDataStore(store);
  }
}

export function markAllStoredNotificationsRead(role?: string, email?: string): void {
  const store = readDataStore();
  if (!store.notifications) return;
  store.notifications.forEach((n) => {
    if (!role && !email) {
      n.read = true;
    } else if (n.targetRole === "all" || (role && n.targetRole === role) || (email && n.targetEmail && n.targetEmail.toLowerCase() === email.toLowerCase())) {
      n.read = true;
    }
  });
  writeDataStore(store);
}

// -----------------------------------------------------------------------------
// GOOGLE FORMS SYNCHRONIZED RESPONSES STORAGE HELPERS
// -----------------------------------------------------------------------------

export function getStoredGoogleFormResponses(eventId?: string): GoogleFormResponseRecord[] {
  const store = readDataStore();
  const all = store.googleFormResponses || [];
  if (!eventId || eventId === "ALL") return all;
  return all.filter((r) => r.eventId === eventId);
}

export function saveStoredGoogleFormResponse(response: GoogleFormResponseRecord): boolean {
  const store = readDataStore();
  if (!store.googleFormResponses) store.googleFormResponses = [];
  const existing = store.googleFormResponses.find(
    (r) => r.googleResponseId === response.googleResponseId && r.eventId === response.eventId
  );
  if (existing) {
    return false; // Skip duplicate record
  }
  store.googleFormResponses.unshift(response);
  writeDataStore(store);
  return true;
}

export function batchSaveStoredGoogleFormResponses(
  responses: GoogleFormResponseRecord[]
): { added: number; updated: number; duplicatesSkipped: number } {
  const store = readDataStore();
  if (!store.googleFormResponses) store.googleFormResponses = [];
  let added = 0;
  let duplicatesSkipped = 0;

  for (const resp of responses) {
    const existingIndex = store.googleFormResponses.findIndex(
      (r) => r.googleResponseId === resp.googleResponseId && r.eventId === resp.eventId
    );
    if (existingIndex >= 0) {
      duplicatesSkipped++;
    } else {
      store.googleFormResponses.unshift(resp);
      added++;
    }
  }

  if (added > 0) {
    writeDataStore(store);
  }

  return { added, updated: 0, duplicatesSkipped };
}

// -----------------------------------------------------------------------------
// EVENT PHOTOS & GALLERY STORAGE HELPERS
// -----------------------------------------------------------------------------

export function getStoredPhotos(eventId?: string): EventPhotoRecord[] {
  const store = readDataStore();
  const all = store.photos || [];
  const filtered = eventId && eventId !== "ALL" ? all.filter((p) => p.eventId === eventId) : all;
  return [...filtered].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
  });
}

export function getStoredPhotoById(id: string): EventPhotoRecord | undefined {
  const store = readDataStore();
  return (store.photos || []).find((p) => p.id === id);
}

export function saveStoredPhoto(photo: EventPhotoRecord): void {
  const store = readDataStore();
  if (!store.photos) store.photos = [];
  const idx = store.photos.findIndex((p) => p.id === photo.id);

  if (photo.isCover) {
    store.photos = store.photos.map((p) =>
      p.eventId === photo.eventId && p.id !== photo.id ? { ...p, isCover: false } : p
    );
  }

  if (idx >= 0) {
    store.photos[idx] = photo;
  } else {
    const existingForEvent = store.photos.filter((p) => p.eventId === photo.eventId);
    if (existingForEvent.length === 0) {
      photo.isCover = true;
    }
    store.photos.push(photo);
  }

  const evtIdx = store.events.findIndex((e) => e.id === photo.eventId);
  if (evtIdx >= 0) {
    const eventPhotos = store.photos.filter((p) => p.eventId === photo.eventId);
    const cover = eventPhotos.find((p) => p.isCover) || eventPhotos[0];
    store.events[evtIdx] = {
      ...store.events[evtIdx],
      photoCount: eventPhotos.length,
      coverPhotoId: cover ? cover.id : undefined,
      coverPhotoUrl: cover ? cover.url : undefined,
    };
  }

  writeDataStore(store);
}

export function saveStoredPhotos(newPhotos: EventPhotoRecord[]): void {
  if (newPhotos.length === 0) return;
  const store = readDataStore();
  if (!store.photos) store.photos = [];

  for (const photo of newPhotos) {
    const idx = store.photos.findIndex((p) => p.id === photo.id);
    if (photo.isCover) {
      store.photos = store.photos.map((p) =>
        p.eventId === photo.eventId && p.id !== photo.id ? { ...p, isCover: false } : p
      );
    }
    if (idx >= 0) {
      store.photos[idx] = photo;
    } else {
      const existingForEvent = store.photos.filter((p) => p.eventId === photo.eventId);
      if (existingForEvent.length === 0 && !newPhotos.some((np) => np.eventId === photo.eventId && np.isCover)) {
        photo.isCover = true;
      }
      store.photos.push(photo);
    }
  }

  const affectedEventIds = Array.from(new Set(newPhotos.map((p) => p.eventId)));
  for (const eventId of affectedEventIds) {
    const evtIdx = store.events.findIndex((e) => e.id === eventId);
    if (evtIdx >= 0) {
      const eventPhotos = store.photos.filter((p) => p.eventId === eventId);
      const cover = eventPhotos.find((p) => p.isCover) || eventPhotos[0];
      store.events[evtIdx] = {
        ...store.events[evtIdx],
        photoCount: eventPhotos.length,
        coverPhotoId: cover ? cover.id : undefined,
        coverPhotoUrl: cover ? cover.url : undefined,
      };
    }
  }

  writeDataStore(store);
}

export function deleteStoredPhoto(id: string): { success: boolean; photo?: EventPhotoRecord } {
  const store = readDataStore();
  if (!store.photos) return { success: false };
  const target = store.photos.find((p) => p.id === id);
  if (!target) return { success: false };

  store.photos = store.photos.filter((p) => p.id !== id);

  if (target.isCover) {
    const remainingForEvent = store.photos.filter((p) => p.eventId === target.eventId);
    if (remainingForEvent.length > 0) {
      remainingForEvent[0].isCover = true;
    }
  }

  const evtIdx = store.events.findIndex((e) => e.id === target.eventId);
  if (evtIdx >= 0) {
    const eventPhotos = store.photos.filter((p) => p.eventId === target.eventId);
    const cover = eventPhotos.find((p) => p.isCover);
    store.events[evtIdx] = {
      ...store.events[evtIdx],
      photoCount: eventPhotos.length,
      coverPhotoId: cover ? cover.id : undefined,
      coverPhotoUrl: cover ? cover.url : undefined,
    };
  }

  writeDataStore(store);
  return { success: true, photo: target };
}

export function reorderStoredPhotos(eventId: string, photoIdsInOrder: string[]): EventPhotoRecord[] {
  const store = readDataStore();
  if (!store.photos) store.photos = [];

  const idToOrder = new Map<string, number>();
  photoIdsInOrder.forEach((id, index) => {
    idToOrder.set(id, index + 1);
  });

  store.photos = store.photos.map((p) => {
    if (p.eventId === eventId && idToOrder.has(p.id)) {
      return {
        ...p,
        displayOrder: idToOrder.get(p.id)!,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });

  writeDataStore(store);
  return getStoredPhotos(eventId);
}

export function setStoredEventCoverPhoto(eventId: string, photoId: string): EventPhotoRecord | undefined {
  const store = readDataStore();
  if (!store.photos) return undefined;

  let chosen: EventPhotoRecord | undefined;
  store.photos = store.photos.map((p) => {
    if (p.eventId === eventId) {
      if (p.id === photoId) {
        chosen = { ...p, isCover: true, updatedAt: new Date().toISOString() };
        return chosen;
      }
      return { ...p, isCover: false, updatedAt: new Date().toISOString() };
    }
    return p;
  });

  if (chosen) {
    const evtIdx = store.events.findIndex((e) => e.id === eventId);
    if (evtIdx >= 0) {
      store.events[evtIdx] = {
        ...store.events[evtIdx],
        coverPhotoId: chosen.id,
        coverPhotoUrl: chosen.url,
      };
    }
    writeDataStore(store);
  }

  return chosen;
}

export function updateStoredPhotoCaption(id: string, caption: string): EventPhotoRecord | undefined {
  const store = readDataStore();
  if (!store.photos) return undefined;
  const idx = store.photos.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;

  store.photos[idx] = {
    ...store.photos[idx],
    caption: caption.trim(),
    updatedAt: new Date().toISOString(),
  };

  writeDataStore(store);
  return store.photos[idx];
}

// -----------------------------------------------------------------------------
// EVENT READINESS TRACKER STORAGE HELPERS
// -----------------------------------------------------------------------------

export function getStoredReadinessItems(eventId?: string): EventReadinessItem[] {
  const store = readDataStore();
  const all = store.readinessItems || [];
  if (!eventId || eventId === "ALL") return all;
  return all.filter((i) => i.eventId === eventId);
}

export function saveStoredReadinessItem(item: EventReadinessItem): void {
  const store = readDataStore();
  if (!store.readinessItems) store.readinessItems = [];
  const idx = store.readinessItems.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    store.readinessItems[idx] = item;
  } else {
    store.readinessItems.unshift(item);
  }
  writeDataStore(store);
}

export function deleteStoredReadinessItem(itemId: string): void {
  const store = readDataStore();
  if (!store.readinessItems) return;
  store.readinessItems = store.readinessItems.filter((i) => i.id !== itemId);
  writeDataStore(store);
}

export function ensureDefaultReadinessChecklist(eventId: string, eventTitle: string): EventReadinessItem[] {
  const store = readDataStore();
  if (!store.readinessItems) store.readinessItems = [];
  const existing = store.readinessItems.filter((i) => i.eventId === eventId);
  if (existing.length > 0) return existing;

  const defaultTemplates: Array<{
    category: ReadinessCategory;
    title: string;
    description: string;
    isMandatory: boolean;
    daysOffset: number;
  }> = [
    {
      category: "venue_seating",
      title: `${eventTitle} — Venue Space & Desk Layout Allocation`,
      description: "Verify physical room capacity, participant desks, and seating arrangement.",
      isMandatory: true,
      daysOffset: 3,
    },
    {
      category: "venue_seating",
      title: `${eventTitle} — Stage AV & Acoustic Balance Verification`,
      description: "Check projector HDMI handshakes, stage audio monitors, and presentation mics.",
      isMandatory: false,
      daysOffset: 4,
    },
    {
      category: "equipment_technical",
      title: `${eventTitle} — High-Speed Technical Network Infrastructure`,
      description: "Dedicated Wi-Fi SSID configuration, subnets, and uplink bandwidth allocation.",
      isMandatory: true,
      daysOffset: 4,
    },
    {
      category: "equipment_technical",
      title: `${eventTitle} — Master Electrical Drops & UPS Backup Rails`,
      description: "Power surge distribution strips tested at participant stations.",
      isMandatory: true,
      daysOffset: 5,
    },
    {
      category: "committee_volunteers",
      title: `${eventTitle} — Lead Track Coordinator & Host Briefing`,
      description: "Assign stage anchors, time-keepers, and technical evaluators.",
      isMandatory: true,
      daysOffset: 5,
    },
    {
      category: "committee_volunteers",
      title: `${eventTitle} — Volunteer Crew Shift Rostering & Duties`,
      description: "Roster active student volunteers for crowd navigation and desk support.",
      isMandatory: true,
      daysOffset: 6,
    },
    {
      category: "logistics_materials",
      title: `${eventTitle} — Badges, Lanyards & Registration Kits`,
      description: "Printed attendee badges, participant IDs, and rulebook prints ready.",
      isMandatory: false,
      daysOffset: 6,
    },
    {
      category: "logistics_materials",
      title: `${eventTitle} — Trophy Plaques, Medals & Certificates Verified`,
      description: "Official GD Goenka seal certificates and winner mementos stocked.",
      isMandatory: true,
      daysOffset: 7,
    },
    {
      category: "scheduling_coordination",
      title: `${eventTitle} — Detailed Timeline, Buffer Slots & Team Briefing`,
      description: "Round schedules, submission deadlines, and jury evaluation windows.",
      isMandatory: true,
      daysOffset: 6,
    },
    {
      category: "scheduling_coordination",
      title: `${eventTitle} — Campus Security & Emergency Standby Coordination`,
      description: "Campus gate entry permissions and medical first aid station standby.",
      isMandatory: true,
      daysOffset: 7,
    },
  ];

  const now = Date.now();
  const createdItems: EventReadinessItem[] = defaultTemplates.map((t, idx) => {
    const deadline = new Date(now + t.daysOffset * 86400000).toISOString().split("T")[0];
    return {
      id: `rdy-${eventId}-${idx + 1}-${Date.now()}`,
      eventId,
      category: t.category,
      title: t.title,
      description: t.description,
      isMandatory: t.isMandatory,
      status: "pending",
      deadline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  store.readinessItems.push(...createdItems);
  writeDataStore(store);
  return createdItems;
}

export function calculateEventReadiness(eventId: string): EventReadinessSummary {
  const store = readDataStore();
  let items = (store.readinessItems || []).filter((i) => i.eventId === eventId);
  const event = store.events.find((e) => e.id === eventId);
  const eventTitle = event?.title || "Event";

  if (items.length === 0 && event) {
    items = ensureDefaultReadinessChecklist(eventId, eventTitle);
  }

  const today = new Date().toISOString().split("T")[0];
  const itemsWithComputedOverdue = items.map((item) => {
    if (item.status === "pending" && item.deadline && item.deadline < today) {
      return { ...item, status: "overdue" as const };
    }
    return item;
  });

  const totalItems = itemsWithComputedOverdue.length;
  const completedItems = itemsWithComputedOverdue.filter((i) => i.status === "completed").length;
  const pendingItems = itemsWithComputedOverdue.filter((i) => i.status === "pending").length;
  const blockedItems = itemsWithComputedOverdue.filter((i) => i.status === "blocked").length;
  const overdueItems = itemsWithComputedOverdue.filter((i) => i.status === "overdue").length;
  const mandatoryItems = itemsWithComputedOverdue.filter((i) => i.isMandatory);
  const mandatoryCount = mandatoryItems.length;
  const mandatoryIncomplete = mandatoryItems.filter((i) => i.status !== "completed").length;

  const readinessPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const isOperationallyReady = mandatoryIncomplete === 0 && completedItems === totalItems;

  return {
    eventId,
    eventTitle,
    totalItems,
    completedItems,
    pendingItems,
    blockedItems,
    overdueItems,
    mandatoryCount,
    mandatoryIncomplete,
    readinessPercentage,
    isOperationallyReady,
    items: itemsWithComputedOverdue,
  };
}

// -----------------------------------------------------------------------------
// OPERATIONAL BLOCKERS & RISKS STORAGE HELPERS
// -----------------------------------------------------------------------------

export function getStoredBlockers(eventId?: string, status?: string): OperationalBlockerRecord[] {
  const store = readDataStore();
  let blockers = store.blockers || [];
  if (eventId && eventId !== "ALL") {
    blockers = blockers.filter((b) => b.eventId === eventId);
  }
  if (status && status !== "ALL") {
    blockers = blockers.filter((b) => b.status === status);
  }
  return blockers;
}

export function saveStoredBlocker(blocker: OperationalBlockerRecord): void {
  const store = readDataStore();
  if (!store.blockers) store.blockers = [];
  const idx = store.blockers.findIndex((b) => b.id === blocker.id);
  if (idx >= 0) {
    store.blockers[idx] = blocker;
  } else {
    store.blockers.unshift(blocker);
  }
  writeDataStore(store);
}

export function deleteStoredBlocker(blockerId: string): void {
  const store = readDataStore();
  if (!store.blockers) return;
  store.blockers = store.blockers.filter((b) => b.id !== blockerId);
  writeDataStore(store);
}

// -----------------------------------------------------------------------------
// TASK DEPENDENCY & CIRCULAR DEPENDENCY VALIDATION HELPER
// -----------------------------------------------------------------------------

export function hasCircularDependency(
  taskId: string,
  candidatePrerequisiteIds: string[],
  allTasks: MemberTaskRecord[]
): boolean {
  if (candidatePrerequisiteIds.includes(taskId)) {
    return true; // Direct self-dependency
  }

  const visited = new Set<string>();
  const queue = [...candidatePrerequisiteIds];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === taskId) {
      return true; // Cycle detected
    }
    if (!visited.has(currentId)) {
      visited.add(currentId);
      const prereqTask = allTasks.find((t) => t.id === currentId);
      if (prereqTask && Array.isArray(prereqTask.dependsOnTaskIds)) {
        for (const nextPrereqId of prereqTask.dependsOnTaskIds) {
          if (!visited.has(nextPrereqId)) {
            queue.push(nextPrereqId);
          }
        }
      }
    }
  }

  return false;
}

// -----------------------------------------------------------------------------
// STUDENT REGISTRATION EMAIL NOTIFICATION STORAGE HELPERS
// -----------------------------------------------------------------------------

export function getStoredEmailNotifications(
  registrationIdOrNumber?: string
): StudentEmailNotificationRecord[] {
  const store = readDataStore();
  const all = store.emailNotifications || [];
  if (!registrationIdOrNumber) return all;
  const query = registrationIdOrNumber.trim().toLowerCase();
  return all.filter(
    (n) =>
      n.registrationId.toLowerCase() === query ||
      n.registrationNumber.toLowerCase() === query
  );
}

export function getStoredEmailNotificationByIdempotencyKey(
  idempotencyKey: string
): StudentEmailNotificationRecord | null {
  const store = readDataStore();
  const all = store.emailNotifications || [];
  return all.find((n) => n.idempotencyKey === idempotencyKey) || null;
}

export function getStoredEmailNotificationById(
  id: string
): StudentEmailNotificationRecord | null {
  const store = readDataStore();
  const all = store.emailNotifications || [];
  return all.find((n) => n.id === id) || null;
}

export function saveStoredEmailNotification(
  record: StudentEmailNotificationRecord
): boolean {
  const store = readDataStore();
  if (!store.emailNotifications) {
    store.emailNotifications = [];
  }

  const existingIdx = store.emailNotifications.findIndex(
    (n) => n.id === record.id || n.idempotencyKey === record.idempotencyKey
  );

  if (existingIdx >= 0) {
    store.emailNotifications[existingIdx] = {
      ...store.emailNotifications[existingIdx],
      ...record,
    };
  } else {
    store.emailNotifications.unshift(record);
  }

  writeDataStore(store);
  return true;
}

export function updateStoredEmailNotification(
  id: string,
  updates: Partial<StudentEmailNotificationRecord>
): boolean {
  const store = readDataStore();
  if (!store.emailNotifications) return false;

  const target = store.emailNotifications.find((n) => n.id === id);
  if (!target) return false;

  Object.assign(target, updates);
  target.lastAttemptAt = new Date().toISOString();
  writeDataStore(store);
  return true;
}

