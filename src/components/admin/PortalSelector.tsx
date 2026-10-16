"use client";

import React from "react";
import Link from "next/link";
import {
  Crown,
  Award,
  LayoutDashboard,
  Users,
  ArrowRight,
  Lock,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { AdminRole, AdminUser } from "@/types/admin";

interface PortalSelectorProps {
  user: AdminUser | null;
  compact?: boolean;
}

interface PortalDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  roleRequired: AdminRole;
  icon: React.ReactNode;
  accentColor: "purple" | "amber" | "blue" | "teal";
  highlights: string[];
  isAuthorized: (role?: AdminRole | "admin") => boolean;
}

export function PortalSelector({ user, compact = false }: PortalSelectorProps) {
  const currentRole = user?.role === "admin" ? "Admin" : user?.role;

  const portals: PortalDefinition[] = [
    {
      id: "president",
      title: "President Portal",
      subtitle: "Executive Governance & Oversight",
      description:
        "Executive oversight, official event proposal approvals, council role governance, and security audit logs.",
      href: "/admin/president",
      roleRequired: "President",
      icon: <Crown className="w-6 h-6 text-purple-700" />,
      accentColor: "purple",
      highlights: ["Executive Approvals", "Audit Trail", "Council Oversight"],
      isAuthorized: (role) => role === "President",
    },
    {
      id: "vice-president",
      title: "Vice President Portal",
      subtitle: "Operations & Workflow Coordination",
      description:
        "Event coordination, proposal status tracking, approval workflow pipeline, and committee task management.",
      href: "/admin/vice-president",
      roleRequired: "Vice President",
      icon: <Award className="w-6 h-6 text-indigo-700" />,
      accentColor: "amber",
      highlights: ["Proposal Tracking", "Workflow Coordination", "Committee Tasks"],
      isAuthorized: (role) => role === "Vice President" || role === "President",
    },
    {
      id: "admin",
      title: "Administrative Management Portal",
      subtitle: "Management & Operations Console",
      description:
        "Manage event publishing, registrations, payment verification, council administration, reports, and audit logs.",
      href: "/admin/management/login",
      roleRequired: "Admin",
      icon: <LayoutDashboard className="w-6 h-6 text-blue-700" />,
      accentColor: "blue",
      highlights: ["Event Publishing", "Dynamic Forms", "Payment Verification"],
      isAuthorized: (role) => role === "Admin" || role === "admin" || role === "President",
    },
    {
      id: "member",
      title: "Member Portal",
      subtitle: "Council Track Contributor",
      description:
        "Submit new competition proposals, track review status, access rulebook templates, and complete assigned duties.",
      href: "/admin/member",
      roleRequired: "AVISHKAR Member",
      icon: <Users className="w-6 h-6 text-teal-700" />,
      accentColor: "teal",
      highlights: ["Propose Events", "Track Milestones", "Assigned Tasks"],
      isAuthorized: (role) =>
        role === "AVISHKAR Member" ||
        role === "Admin" ||
        role === "admin" ||
        role === "Vice President" ||
        role === "President",
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      {!compact && (
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#174789] text-white p-6 sm:p-7 rounded-xl shadow-sm border border-slate-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-xs text-xs font-semibold text-blue-200 border border-white/10 mb-2">
              <Shield className="w-3.5 h-3.5 text-teal-300" />
              <span>Role-Based Portal Gateway</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Select Your Portal</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              AVISHKAR 2026 enforces strict role-based access control. Select the dedicated portal for your authorized council responsibilities.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/15 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-teal-400/20 text-teal-300 flex items-center justify-center font-bold text-sm">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-300">Authenticated As</p>
              <p className="text-sm font-bold text-white truncate max-w-[180px]">{user?.fullName || "Council User"}</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-teal-500/20 text-teal-200 border border-teal-400/30">
                {currentRole || "Verifying..."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {portals.map((portal) => {
          const authorized = portal.isAuthorized(currentRole);
          const isCurrentExactRole = currentRole === portal.roleRequired;

          return (
            <div
              key={portal.id}
              className={`group relative rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                authorized
                  ? "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
                  : "bg-slate-50/80 border-slate-200/60 opacity-80"
              }`}
            >
              <div className="p-5 space-y-3.5">
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                      portal.accentColor === "purple"
                        ? "bg-purple-100"
                        : portal.accentColor === "amber"
                        ? "bg-indigo-100"
                        : portal.accentColor === "blue"
                        ? "bg-blue-100"
                        : "bg-teal-100"
                    }`}
                  >
                    {portal.icon}
                  </div>

                  {isCurrentExactRole ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Active Role
                    </span>
                  ) : authorized ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Authorized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                      <Lock className="w-3 h-3" />
                      Restricted
                    </span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {portal.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                  {portal.description}
                </p>

                {/* Feature Highlights */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {portal.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                {authorized ? (
                  <Link
                    href={portal.href}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#174789] hover:bg-[#123668] text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    <span>Open Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    aria-disabled="true"
                    title={`Restricted to ${portal.roleRequired}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Requires {portal.roleRequired}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
