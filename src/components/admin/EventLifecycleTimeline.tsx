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
  const isRejected = event.status === "rejected";

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
      id: "president_review",
      name: "President Review",
      role: "President",
      status: isDraft
        ? "upcoming"
        : isProposed
        ? "current"
        : "completed",
      timestamp: event.reviewedAt,
      details: isProposed
        ? "In executive queue awaiting decision"
        : event.reviewedBy
        ? `Reviewed by ${event.reviewedBy}`
        : "Executive evaluation",
      nextAction: isProposed
        ? "President must inspect and Approve or Reject"
        : undefined,
      icon: Eye,
    },
  ];

  if (isRejected) {
    stages.push({
      id: "decision_rejected",
      name: "Proposal Rejected",
      role: "President",
      status: "rejected",
      timestamp: event.reviewedAt || event.updatedAt,
      details: event.rejectionReason
        ? `Reason: ${event.rejectionReason}`
        : "Executive feedback logged",
      nextAction: "Member can review feedback and submit a revised draft",
      icon: XCircle,
    });
  } else {
    stages.push({
      id: "decision_approved",
      name: "Executive Approval",
      role: "President",
      status: isDraft || isProposed ? "upcoming" : "completed",
      timestamp: event.reviewedAt,
      details: isApproved || isPublished
        ? event.reviewComment || "Approved by President Council"
        : "Pending executive sign-off",
      icon: CheckCircle2,
    });

    stages.push({
      id: "vp_coordination",
      name: "VP Coordination",
      role: "Vice President",
      status:
        isDraft || isProposed
          ? "upcoming"
          : isApproved
          ? "current"
          : "completed",
      details: event.coordinatorName
        ? `Lead: ${event.coordinatorName}`
        : event.coordinationStatus === "in_coordination"
        ? "In logistical coordination"
        : "Awaiting duty assignment",
      nextAction: isApproved
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

  const getStatusColor = (status: TimelineStage["status"]) => {
    switch (status) {
      case "completed":
        return {
          ring: "border-teal-500 bg-teal-50 text-teal-700",
          badge: "bg-teal-50 text-teal-700 border-teal-200",
          bar: "bg-teal-500",
          dot: "bg-teal-500",
        };
      case "current":
        return {
          ring: "border-blue-600 bg-blue-50 text-blue-700 animate-pulse",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          bar: "bg-slate-200",
          dot: "bg-blue-600",
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
                  className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium shrink-0 ${colors.badge}`}
                  title={`${stage.name} (${stage.role}) - ${stage.status}`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{stage.name}</span>
                </div>
                {idx < stages.length - 1 && (
                  <div
                    className={`w-3 h-0.5 shrink-0 ${
                      stage.status === "completed" ? "bg-teal-500" : "bg-slate-200"
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
    <div className={`bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-[#0A2047] flex items-center gap-2">
            <span>Event Progress Lifecycle</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                isRejected
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : isPublished
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isApproved
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : isProposed
                  ? "bg-purple-50 text-purple-700 border-purple-200"
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
          <p className="text-xs text-slate-500 mt-0.5">
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
            return (
              <div
                key={stage.id}
                className={`relative rounded-xl border p-3.5 transition-all ${
                  stage.status === "current"
                    ? "border-blue-300 bg-blue-50/40 shadow-xs"
                    : stage.status === "rejected"
                    ? "border-rose-300 bg-rose-50/40"
                    : stage.status === "completed"
                    ? "border-teal-200 bg-teal-50/20"
                    : "border-slate-200 bg-slate-50/50 opacity-70"
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
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {stage.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${colors.badge}`}
                      >
                        {stage.role}
                      </span>
                    </div>

                    {stage.timestamp && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>{formatDate(stage.timestamp)}</span>
                      </p>
                    )}

                    {stage.details && (
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {stage.details}
                      </p>
                    )}

                    {stage.nextAction && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-start gap-1 text-[10px] text-blue-700 font-medium">
                        <ArrowRight className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{stage.nextAction}</span>
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
