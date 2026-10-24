"use client";

import React from "react";
import {
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
  Globe,
  CreditCard,
  Clock,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { EventRecord } from "@/types/admin";

interface EventLifecycleTimelineProps {
  event: EventRecord;
  className?: string;
  compact?: boolean;
}

interface TimelineStage {
  id: string;
  name: string;
  role: string;
  status: "completed" | "current" | "upcoming" | "rejected";
  timestamp?: string;
  details?: string;
  nextAction?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function EventLifecycleTimeline({
  event,
  className = "",
  compact = false,
}: EventLifecycleTimelineProps) {
  const isDraft = event.status === "draft";
  const isProposed = event.status === "proposed";
  const isApproved = event.status === "approved";
  const isPublished = event.status === "published";
  const isVpApproved = event.vpStatus === "approved";
  const isVpRejected = event.vpStatus === "rejected";
  const isPresidentApproved = event.presidentStatus === "approved" || isApproved || isPublished;
  const isPresidentRejected = event.presidentStatus === "rejected";
  const isRejected = event.status === "rejected" || isVpRejected || isPresidentRejected;

  const stages: TimelineStage[] = [
    {
      id: "draft",
      name: "Draft Created",
      role: "Member",
      status: "completed",
      timestamp: event.createdAt,
      details: `Created by ${event.proposedBy || "Council Member"}`,
      nextAction: isDraft ? "Member must review and submit for approval" : undefined,
      icon: FileText,
    },
    {
      id: "submitted",
      name: "Proposal Submitted",
      role: "Member",
      status: isDraft ? "current" : "completed",
      timestamp: event.submittedAt || (isDraft ? undefined : event.createdAt),
      details: isDraft ? "Saved as working draft" : "Submitted for executive review",
      nextAction: isDraft ? "Click 'Submit Proposal' to request review" : undefined,
      icon: Send,
    },
    {
      id: "vp_review",
      name: "VP Logistical Review",
      role: "Vice President",
      status: isDraft
        ? "upcoming"
        : isVpRejected
        ? "rejected"
        : isVpApproved
        ? "completed"
        : isProposed
        ? "current"
        : "completed",
      timestamp: event.vpDecidedAt || undefined,
      details: isVpRejected
        ? event.vpRejectionReason || "Logistical feasibility rejected by Vice President"
        : isVpApproved
        ? event.vpComment || "Logistical & operational feasibility approved"
        : isProposed
        ? "Awaiting Vice President logistical review"
        : "Operational review",
      nextAction: isProposed && !isVpApproved && !isVpRejected
        ? "Vice President reviews venue and technical feasibility"
        : undefined,
      icon: Eye,
    },
    {
      id: "president_review",
      name: "President Executive Approval",
      role: "President",
      status: isDraft || (isProposed && !isVpApproved && !isVpRejected)
        ? "upcoming"
        : isPresidentRejected
        ? "rejected"
        : isPresidentApproved
        ? "completed"
        : isProposed && isVpApproved
        ? "current"
        : isRejected
        ? "rejected"
        : "upcoming",
      timestamp: event.presidentDecidedAt || event.reviewedAt || undefined,
      details: isPresidentRejected
        ? event.presidentRejectionReason || event.rejectionReason || "Rejected by President Council"
        : isPresidentApproved
        ? event.presidentComment || event.reviewComment || "Executive constitutional approval granted"
        : isProposed && isVpApproved
        ? "In executive queue awaiting President decision"
        : "Constitutional review",
      nextAction: isProposed && isVpApproved && !isPresidentApproved && !isPresidentRejected
        ? "President evaluates proposal for constitutional approval"
        : undefined,
      icon: CheckCircle2,
    },
  ];

  if (isRejected) {
    stages.push({
      id: "decision_rejected",
      name: "Proposal Rejected",
      role: isVpRejected ? "Vice President" : "President",
      status: "rejected",
      timestamp: event.reviewedAt || event.vpDecidedAt || event.updatedAt,
      details: event.rejectionReason || event.presidentRejectionReason || event.vpRejectionReason
        ? `Reason: ${event.rejectionReason || event.presidentRejectionReason || event.vpRejectionReason}`
        : "Executive feedback logged",
      nextAction: "Member can review feedback and submit a revised draft",
      icon: XCircle,
    });
  } else {
    stages.push({
      id: "vp_coordination",
      name: "VP Coordination",
      role: "Vice President",
      status:
        isDraft || isProposed
          ? "upcoming"
          : isApproved && event.coordinationStatus !== "coordination_ready"
          ? "current"
          : "completed",
      details: event.coordinatorName
        ? `Lead: ${event.coordinatorName}`
        : event.coordinationStatus === "in_coordination"
        ? "In logistical coordination"
        : isApproved
        ? "Awaiting duty assignment"
        : "Ready for coordination",
      nextAction: isApproved && event.coordinationStatus !== "coordination_ready"
        ? "VP assigns coordinators and logistical tasks"
        : undefined,
      icon: Users,
    });

    stages.push({
      id: "admin_publishing",
      name: "Admin Publishing",
      role: "Admin",
      status:
        isPublished
          ? "completed"
          : isApproved
          ? "upcoming"
          : "upcoming",
      timestamp: isPublished ? event.updatedAt : undefined,
      details: isPublished ? "Live in public catalogue" : "Awaiting catalogue release",
      nextAction:
        isApproved
          ? "Admin publishes event once coordination is verified"
          : undefined,
      icon: Globe,
    });

    if (isPublished) {
      stages.push({
        id: "public_registration",
        name: "Public Registration",
        role: "Student",
        status: "current",
        details: "Open for attendee registrations",
        nextAction: "Accepting student submissions and payment receipts",
        icon: CreditCard,
      });

      stages.push({
        id: "payment_verification",
        name: "Payment Verification",
        role: "Admin",
        status: "current",
        details: "Mandatory UTR check against university account",
        nextAction: "Admin manually approves registration receipts",
        icon: CheckCircle2,
      });
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "President":
        return "bg-[#0A2047] text-[#D4AF37] border-[#0A2047]";
      case "Vice President":
        return "bg-[#0A2047]/10 text-[#0A2047] border-[#0A2047]/20";
      case "Admin":
        return "bg-[#132E57]/10 text-[#132E57] border-[#132E57]/20";
      case "Student":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Member":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: TimelineStage["status"]) => {
    switch (status) {
      case "completed":
        return {
          ring: "border-emerald-500 bg-emerald-50 text-emerald-700",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          bar: "bg-emerald-500",
          dot: "bg-emerald-500",
        };
      case "current":
        return {
          ring: "border-[#D4AF37] bg-[#0A2047] text-[#D4AF37] shadow-xs",
          badge: "bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20",
          bar: "bg-[#E2E8F0]",
          dot: "bg-[#0A2047]",
        };
      case "rejected":
        return {
          ring: "border-rose-600 bg-rose-50 text-rose-700",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          bar: "bg-rose-300",
          dot: "bg-rose-600",
        };
      case "upcoming":
      default:
        return {
          ring: "border-slate-300 bg-slate-50 text-slate-400",
          badge: "bg-slate-100 text-slate-500 border-slate-200",
          bar: "bg-slate-200",
          dot: "bg-slate-300",
        };
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {stages.map((stage, idx) => {
            const colors = getStatusColor(stage.status);
            const Icon = stage.icon;
            return (
              <React.Fragment key={stage.id}>
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-semibold shrink-0 transition-colors ${
                    stage.status === "current"
                      ? "bg-[#0A2047] text-white border-[#0A2047]"
                      : colors.badge
                  }`}
                  title={`${stage.name} (${stage.role}) - ${stage.status}`}
                >
                  <Icon className={`w-3 h-3 shrink-0 ${stage.status === "current" ? "text-[#D4AF37]" : ""}`} />
                  <span>{stage.name}</span>
                </div>
                {idx < stages.length - 1 && (
                  <div
                    className={`w-3.5 h-0.5 shrink-0 ${
                      stage.status === "completed" ? "bg-emerald-500" : "bg-[#E2E8F0]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-[#0A2047] flex items-center gap-2">
            <span>Event Progress Lifecycle</span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                isRejected
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : isPublished
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isApproved
                  ? "bg-[#0A2047]/10 text-[#0A2047] border-[#0A2047]/20"
                  : isProposed
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {isRejected
                ? "Proposal Rejected"
                : isPublished
                ? "Published & Active"
                : isApproved
                ? "Approved — In Coordination"
                : isProposed
                ? "Pending Review"
                : "Draft"}
            </span>
          </h4>
          <p className="text-xs text-[#64748B] mt-0.5">
            Institutional event governance, approval gate & publication pipeline
          </p>
        </div>
      </div>

      {/* Stepper Grid / Horizontal Trail */}
      <div className="mt-6 relative">
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const colors = getStatusColor(stage.status);
            const Icon = stage.icon;
            const roleBadgeStyle = getRoleBadge(stage.role);
            return (
              <div
                key={stage.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  stage.status === "current"
                    ? "border-[#D4AF37]/60 bg-gradient-to-br from-white to-[#FDFBF7] shadow-sm ring-1 ring-[#D4AF37]/20"
                    : stage.status === "rejected"
                    ? "border-rose-300 bg-rose-50/40"
                    : stage.status === "completed"
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-[#E2E8F0] bg-slate-50/50 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${colors.ring}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#172033] truncate">
                        {stage.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border shrink-0 ${roleBadgeStyle}`}
                      >
                        {stage.role}
                      </span>
                    </div>

                    {stage.timestamp && (
                      <p className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                        <span>{formatDate(stage.timestamp)}</span>
                      </p>
                    )}

                    {stage.details && (
                      <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                        {stage.details}
                      </p>
                    )}

                    {stage.nextAction && (
                      <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-start gap-1 text-[10px] text-[#0A2047] font-semibold">
                        <ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-[#D4AF37]" />
                        <span className="leading-tight">{stage.nextAction}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
