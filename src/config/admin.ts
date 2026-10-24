/**
 * AVISHKAR 2026 — Admin Portal Configuration, Roles & Navigation Constants
 */

import { AdminRole, UserRole } from "@/types/admin";

export interface AdminNavItem {
  title: string;
  href: string;
  iconName:
    | "LayoutDashboard"
    | "Calendar"
    | "FileText"
    | "FolderOpen"
    | "Users"
    | "UserCheck"
    | "Settings"
    | "CreditCard"
    | "ShieldCheck"
    | "BarChart3"
    | "ClipboardList"
    | "Images";
  description: string;
  allowedRoles: AdminRole[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: "Overview",
    href: "/admin/overview",
    iconName: "LayoutDashboard",
    description: "Overview and real-time operations",
    allowedRoles: ["President", "Vice President", "Admin", "AVISHKAR Member"],
  },
  {
    title: "Events",
    href: "/admin/events",
    iconName: "Calendar",
    description: "Event creation, proposals, approvals & publishing",
    allowedRoles: ["President", "Vice President", "Admin", "AVISHKAR Member"],
  },
  {
    title: "Payments",
    href: "/admin/payments",
    iconName: "CreditCard",
    description: "Payment receipt verification & UTR auditing",
    allowedRoles: ["President", "Admin"],
  },
  {
    title: "Forms",
    href: "/admin/forms",
    iconName: "FileText",
    description: "Google Forms-style configurable registration forms",
    allowedRoles: ["Admin", "President"],
  },
  {
    title: "Members",
    href: "/admin/members",
    iconName: "UserCheck",
    description: "Council roster, task assignments & member roles",
    allowedRoles: ["President", "Vice President", "Admin"],
  },
  {
    title: "Reports",
    href: "/admin/reports",
    iconName: "BarChart3",
    description: "Financial, academic & event analytics",
    allowedRoles: ["President", "Admin"],
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    iconName: "ShieldCheck",
    description: "Immutable governance & security action logs",
    allowedRoles: ["President", "Admin"],
  },
  {
    title: "Registrations",
    href: "/admin/registrations",
    iconName: "Users",
    description: "Student roster, academic search & verification",
    allowedRoles: ["Admin"],
  },
  {
    title: "Resources",
    href: "/admin/resources",
    iconName: "FolderOpen",
    description: "Rulebooks, documents & media categorized by event",
    allowedRoles: ["Admin"],
  },
  {
    title: "Event Photos",
    href: "/admin/photos",
    iconName: "Images",
    description: "Event photo galleries, cover images & batch uploads",
    allowedRoles: ["President", "Admin"],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    iconName: "Settings",
    description: "Role-based access matrix, audit logs & system setup",
    allowedRoles: ["President"],
  },
];

/**
 * Returns strictly the navigation items relevant to the authenticated user's role.
 * Links the primary 'Dashboard' to each role's specific dashboard URL.
 */
export function getNavItemsForRole(role: AdminRole): AdminNavItem[] {
  switch (role) {
    case "President":
      return [
        {
          title: "President Console",
          href: "/admin/president",
          iconName: "LayoutDashboard",
          description: "Executive proposal approvals & committee oversight",
          allowedRoles: ["President"],
        },
        {
          title: "Overview",
          href: "/admin/overview",
          iconName: "LayoutDashboard",
          description: "Portal overview & operations",
          allowedRoles: ["President"],
        },
        {
          title: "Events",
          href: "/admin/events",
          iconName: "Calendar",
          description: "Event proposal queue & approvals",
          allowedRoles: ["President"],
        },
        {
          title: "Payments",
          href: "/admin/payments",
          iconName: "CreditCard",
          description: "Financial review queue & UTR verification",
          allowedRoles: ["President"],
        },
        {
          title: "Forms",
          href: "/admin/forms",
          iconName: "FileText",
          description: "Event registration forms & schedule",
          allowedRoles: ["President"],
        },
        {
          title: "Members",
          href: "/admin/members",
          iconName: "UserCheck",
          description: "Organizing council committee roster & status",
          allowedRoles: ["President"],
        },
        {
          title: "Reports",
          href: "/admin/reports",
          iconName: "BarChart3",
          description: "Participation, finances & cohort analytics",
          allowedRoles: ["President"],
        },
        {
          title: "Audit Logs",
          href: "/admin/audit-logs",
          iconName: "ShieldCheck",
          description: "Immutable governance & security logs",
          allowedRoles: ["President"],
        },
        {
          title: "Event Photos",
          href: "/admin/photos",
          iconName: "Images",
          description: "Event photo galleries & cover images",
          allowedRoles: ["President"],
        },
        {
          title: "Settings",
          href: "/admin/settings",
          iconName: "Settings",
          description: "Executive security parameters & setup",
          allowedRoles: ["President"],
        },
      ];

    case "Vice President":
      return [
        {
          title: "VP Console",
          href: "/admin/vice-president",
          iconName: "LayoutDashboard",
          description: "Operations coordination & proposal tracking",
          allowedRoles: ["Vice President"],
        },
        {
          title: "Events & Proposals",
          href: "/admin/events",
          iconName: "Calendar",
          description: "Proposal pipeline & coordination",
          allowedRoles: ["Vice President"],
        },
        {
          title: "Committee Tasks",
          href: "/admin/members",
          iconName: "UserCheck",
          description: "Assigned committee activities & tasks",
          allowedRoles: ["Vice President"],
        },
      ];

    case "AVISHKAR Member":
      return [
        {
          title: "Member Workspace",
          href: "/admin/member",
          iconName: "LayoutDashboard",
          description: "Event proposals & assigned activities",
          allowedRoles: ["AVISHKAR Member"],
        },
        {
          title: "Events & Proposals",
          href: "/admin/events",
          iconName: "Calendar",
          description: "Submit & view competition tracks",
          allowedRoles: ["AVISHKAR Member"],
        },
      ];

    case "Admin":
    default:
      return [
        {
          title: "Overview",
          href: "/admin/overview",
          iconName: "LayoutDashboard",
          description: "Administrative operations hub",
          allowedRoles: ["Admin"],
        },
        {
          title: "Events",
          href: "/admin/events",
          iconName: "Calendar",
          description: "Publish & manage competitions",
          allowedRoles: ["Admin"],
        },
        {
          title: "Payments",
          href: "/admin/payments",
          iconName: "CreditCard",
          description: "Payment receipt verification & UTR auditing",
          allowedRoles: ["Admin"],
        },
        {
          title: "Forms",
          href: "/admin/forms",
          iconName: "FileText",
          description: "Dynamic registration form builder",
          allowedRoles: ["Admin"],
        },
        {
          title: "Members",
          href: "/admin/members",
          iconName: "UserCheck",
          description: "Council member management & assignments",
          allowedRoles: ["Admin"],
        },
        {
          title: "Reports",
          href: "/admin/reports",
          iconName: "BarChart3",
          description: "Financial, academic & event analytics",
          allowedRoles: ["Admin"],
        },
        {
          title: "Audit Logs",
          href: "/admin/audit-logs",
          iconName: "ShieldCheck",
          description: "Security & administrative action logs",
          allowedRoles: ["Admin"],
        },
        {
          title: "Registrations",
          href: "/admin/registrations",
          iconName: "Users",
          description: "Student registration roster & verification",
          allowedRoles: ["Admin"],
        },
        {
          title: "Resources",
          href: "/admin/resources",
          iconName: "FolderOpen",
          description: "Rulebooks, assets & media repository",
          allowedRoles: ["Admin"],
        },
        {
          title: "Event Photos",
          href: "/admin/photos",
          iconName: "Images",
          description: "Event photo galleries, cover images & batch uploads",
          allowedRoles: ["Admin"],
        },
      ];
  }
}

export interface RolePermissions {
  canViewOperationsOverview: boolean;
  canApproveEvents: boolean;
  canCreateEvents: boolean;
  canProposeEvents: boolean;
  canPublishEvents: boolean;
  canManageForms: boolean;
  canManageResources: boolean;
  canSubmitResources: boolean;
  canManageRegistrations: boolean;
  canManageMemberRoles: boolean;
  canAssignTasks: boolean;
  canViewAuditLogs: boolean;
  canAccessSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  President: {
    canViewOperationsOverview: true,
    canApproveEvents: true,
    canCreateEvents: true,
    canProposeEvents: true,
    canPublishEvents: true,
    canManageForms: true,
    canManageResources: true,
    canSubmitResources: true,
    canManageRegistrations: true,
    canManageMemberRoles: true,
    canAssignTasks: true,
    canViewAuditLogs: true,
    canAccessSettings: true,
  },
  "Vice President": {
    canViewOperationsOverview: true,
    canApproveEvents: false, // President executive approval
    canCreateEvents: true,
    canProposeEvents: true,
    canPublishEvents: false,
    canManageForms: false,
    canManageResources: true,
    canSubmitResources: true,
    canManageRegistrations: true,
    canManageMemberRoles: false, // President only
    canAssignTasks: true, // VP coordinates committee tasks
    canViewAuditLogs: false,
    canAccessSettings: false,
  },
  Admin: {
    canViewOperationsOverview: true,
    canApproveEvents: false, // President approval required
    canCreateEvents: true,
    canProposeEvents: true,
    canPublishEvents: false, // Only approved events can be published
    canManageForms: true,
    canManageResources: true,
    canSubmitResources: true,
    canManageRegistrations: true,
    canManageMemberRoles: false, // President only
    canAssignTasks: true,
    canViewAuditLogs: false, // President only
    canAccessSettings: true,
  },
  "AVISHKAR Member": {
    canViewOperationsOverview: false, // Only assigned events & tasks
    canApproveEvents: false,
    canCreateEvents: false,
    canProposeEvents: true,
    canPublishEvents: false,
    canManageForms: false,
    canManageResources: false,
    canSubmitResources: true, // For assigned events
    canManageRegistrations: false,
    canManageMemberRoles: false,
    canAssignTasks: false,
    canViewAuditLogs: false,
    canAccessSettings: false,
  },
  Student: {
    canViewOperationsOverview: false,
    canApproveEvents: false,
    canCreateEvents: false,
    canProposeEvents: false,
    canPublishEvents: false,
    canManageForms: false,
    canManageResources: false,
    canSubmitResources: false,
    canManageRegistrations: false,
    canManageMemberRoles: false,
    canAssignTasks: false,
    canViewAuditLogs: false,
    canAccessSettings: false,
  },
};

export const PAYMENT_STATUS_LABELS: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" | "neutral" }
> = {
  pending_verification: {
    label: "Pending Verification",
    variant: "warning",
  },
  verified: {
    label: "Payment Verified",
    variant: "success",
  },
  rejected: {
    label: "Payment Rejected",
    variant: "danger",
  },
};

export const STUDENT_STATUS_LABELS: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" | "neutral" }
> = {
  pending: {
    label: "Pending Verification",
    variant: "warning",
  },
  verified: {
    label: "Student Verified",
    variant: "success",
  },
  rejected: {
    label: "Student Rejected",
    variant: "danger",
  },
};

export const ADMIN_SESSION_COOKIE_NAME = "avishkar_admin_token";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
