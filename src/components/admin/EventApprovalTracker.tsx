"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  Filter,
  Eye,
  FileText,
  Globe,
  Send,
  MinusCircle,
  RefreshCw,
  Award,
} from "lucide-react";
import { AdminRole, AdminUser, EventRecord } from "@/types/admin";

export type TrackerFilter =
  | "ALL"
  | "PENDING_PRESIDENT"
  | "PENDING_VP"
  | "PENDING_MULTIPLE"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED"
  | "REJECTED";

interface EventApprovalTrackerProps {
  events: EventRecord[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  user?: AdminUser | null;
  onPublishEvent?: (eventId: string) => Promise<void>;
  publishingId?: string | null;
}

export function getPresidentDecision(event: EventRecord) {
  if (event.creationSource === "ADMIN_DIRECT") {
    return {
      status: "not_required" as const,
      label: "Not Required",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: CheckCircle2,
      decisionBy: "Administrator Direct Entry",
      decidedAt: event.createdAt,
      comment: "Direct Administrator event creation — no council approvals required.",
    };
  }
  if (event.presidentStatus === "rejected" || event.status === "rejected") {
    return {
      status: "rejected" as const,
      label: "Rejected",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      icon: XCircle,
      decisionBy: event.presidentDecisionBy || event.reviewedBy || "President Council",
      decidedAt: event.presidentDecidedAt || event.reviewedAt || event.updatedAt,
      rejectionReason:
        event.presidentRejectionReason ||
        event.rejectionReason ||
        event.reviewComment ||
        "Proposal rejected by President Council.",
    };
  }
  if (
    event.presidentStatus === "approved" ||
    event.approvedBy ||
    event.status === "approved" ||
    event.status === "published"
  ) {
    return {
      status: "approved" as const,
      label: "Approved",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: CheckCircle2,
      decisionBy: event.presidentDecisionBy || event.approvedBy || "President Council",
      decidedAt: event.presidentDecidedAt || event.reviewedAt || event.createdAt,
      comment: event.presidentComment || event.reviewComment || "Approved by President Council.",
    };
  }
  if (event.status === "proposed" || event.presidentStatus === "pending") {
    return {
      status: "pending" as const,
      label: "Pending Approval",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock,
      decisionBy: null,
      decidedAt: null,
    };
  }
  return {
    status: "not_required" as const,
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    icon: FileText,
    decisionBy: null,
    decidedAt: null,
  };
}

export function getVicePresidentDecision(event: EventRecord) {
  if (event.creationSource === "ADMIN_DIRECT") {
    return {
      status: "not_required" as const,
      label: "Not Required",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: CheckCircle2,
      decisionBy: "Administrator Direct Entry",
      decidedAt: event.createdAt,
      comment: "Direct Administrator event creation — no council approvals required.",
    };
  }
  if (event.status === "rejected") {
    return {
      status: "not_required" as const,
      label: "Not Required",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      icon: MinusCircle,
      decisionBy: null,
      decidedAt: null,
    };
  }
  if (event.vpStatus === "rejected") {
    return {
      status: "rejected" as const,
      label: "Rejected",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      icon: XCircle,
      decisionBy: event.vpDecisionBy || "Vice President Council",
      decidedAt: event.vpDecidedAt || event.updatedAt,
      rejectionReason:
        event.vpRejectionReason || event.vpComment || "Logistical feasibility rejected by VP Council.",
    };
  }
  if (
    event.vpStatus === "approved" ||
    event.coordinationStatus === "coordination_ready" ||
    event.status === "published"
  ) {
    return {
      status: "approved" as const,
      label: "Approved",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: CheckCircle2,
      decisionBy: event.vpDecisionBy || "Vice President Council",
      decidedAt: event.vpDecidedAt || event.updatedAt,
      comment: event.vpComment || "Logistical coordination verified & ready.",
    };
  }
  if (
    event.coordinationStatus === "in_coordination" ||
    (event.coordinatorName && event.status === "approved")
  ) {
    return {
      status: "in_coordination" as const,
      label: "In Coordination",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      icon: Users,
      decisionBy: event.coordinatorName || event.vpDecisionBy || "Vice President Council",
      decidedAt: event.vpDecidedAt || event.updatedAt,
      comment: event.coordinationNotes || "Logistics and task duties currently in progress.",
    };
  }
  if (event.status === "approved" || event.presidentStatus === "approved") {
    return {
      status: "pending" as const,
      label: "Pending Coordination",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock,
      decisionBy: null,
      decidedAt: null,
    };
  }
  if (event.status === "proposed") {
    return {
      status: "pending" as const,
      label: "Pending VP Review",
      badgeClass: "bg-amber-50/70 text-amber-700 border-amber-200",
      icon: Clock,
      decisionBy: null,
      decidedAt: null,
    };
  }
  return {
    status: "not_required" as const,
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    icon: FileText,
    decisionBy: null,
    decidedAt: null,
  };
}

export function getOverallApprovalStatus(event: EventRecord) {
  if (event.creationSource === "ADMIN_DIRECT") {
    if (event.status === "published") {
      return {
        stage: "published" as const,
        label: "Published (Direct)",
        badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
        dotClass: "bg-teal-500",
        description: "Live on official AVISHKAR website for student registrations",
        nextActor: "Students (Live)",
      };
    }
    return {
      stage: "ready_for_publication" as const,
      label: "Ready to Publish (Direct)",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      dotClass: "bg-blue-500",
      description: "Administrator direct event. Ready for immediate verification & publishing.",
      nextActor: "Administrator (Publish)",
    };
  }

  if (event.status === "published") {
    return {
      stage: "published" as const,
      label: "Published",
      badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
      dotClass: "bg-teal-500",
      description: "Live on official AVISHKAR website for student registrations",
      nextActor: "Students (Live)",
    };
  }
  if (
    event.status === "rejected" ||
    event.presidentStatus === "rejected" ||
    event.vpStatus === "rejected"
  ) {
    return {
      stage: "rejected" as const,
      label: "Rejected",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      dotClass: "bg-rose-500",
      description:
        event.presidentRejectionReason ||
        event.rejectionReason ||
        event.vpRejectionReason ||
        "Event proposal was rejected.",
      nextActor: "Proposal Author",
    };
  }
  if (event.status === "approved") {
    const presDec = getPresidentDecision(event);
    const vpDec = getVicePresidentDecision(event);
    const presApproved = presDec.status === "approved";
    const vpApproved = vpDec.status === "approved";

    if (presApproved && vpApproved) {
      return {
        stage: "ready_for_publication" as const,
        label: "Ready for Publication",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dotClass: "bg-emerald-500",
        description: "President approved & VP coordination complete. Ready for catalogue publication.",
        nextActor: "Administrator (Publish)",
      };
    }
    return {
      stage: "awaiting_next_approval" as const,
      label: "Awaiting Next Approval",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      dotClass: "bg-indigo-500",
      description: "President approved. Awaiting Vice President logistical coordination.",
      nextActor: "Vice President",
    };
  }
  if (event.status === "proposed") {
    if (event.vpStatus === "approved") {
      return {
        stage: "awaiting_next_approval" as const,
        label: "Pending President Review",
        badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
        dotClass: "bg-purple-500",
        description: "VP approved. Awaiting Executive President final decision.",
        nextActor: "President",
      };
    }
    return {
      stage: "pending_approval" as const,
      label: "Pending VP Review",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      dotClass: "bg-amber-500",
      description: "Submitted member proposal awaiting Vice President operational review.",
      nextActor: "Vice President",
    };
  }
  return {
    stage: "draft" as const,
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
    description: "Working draft not yet submitted for review.",
    nextActor: "Member",
  };
}

export function EventApprovalTracker({
  events,
  onRefresh,
  isRefreshing = false,
  user,
  onPublishEvent,
  publishingId = null,
}: EventApprovalTrackerProps) {
  const [filter, setFilter] = useState<TrackerFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);

  // Compute live summary counts directly from stored records
  const counts = useMemo(() => {
    let pendingPresident = 0;
    let pendingVp = 0;
    let pendingMultiple = 0;
    let readyForPublication = 0;
    let published = 0;
    let rejected = 0;

    for (const e of events) {
      const overall = getOverallApprovalStatus(e);

      if (overall.stage === "published") {
        published++;
      } else if (overall.stage === "rejected") {
        rejected++;
      } else if (overall.stage === "ready_for_publication") {
        readyForPublication++;
      } else if (overall.stage === "awaiting_next_approval") {
        pendingVp++;
      } else if (overall.stage === "pending_approval") {
        pendingPresident++;
        pendingMultiple++; // Needs President and downstream VP
      }
    }

    return {
      total: events.length,
      pendingPresident,
      pendingVp,
      pendingMultiple,
      readyForPublication,
      published,
      rejected,
    };
  }, [events]);

  // Filter events based on active tab and query
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const overall = getOverallApprovalStatus(e);
      const pres = getPresidentDecision(e);
      const vp = getVicePresidentDecision(e);

      let matchesFilter = true;
      if (filter === "PENDING_PRESIDENT") {
        matchesFilter = pres.status === "pending" && e.status === "proposed";
      } else if (filter === "PENDING_VP") {
        matchesFilter =
          overall.stage === "awaiting_next_approval" ||
          (e.status === "approved" && vp.status !== "approved");
      } else if (filter === "PENDING_MULTIPLE") {
        matchesFilter = e.status === "proposed";
      } else if (filter === "READY_FOR_PUBLICATION") {
        matchesFilter = overall.stage === "ready_for_publication";
      } else if (filter === "PUBLISHED") {
        matchesFilter = overall.stage === "published";
      } else if (filter === "REJECTED") {
        matchesFilter = overall.stage === "rejected";
      }

      let matchesCategory = true;
      if (categoryFilter !== "ALL") {
        matchesCategory = e.category === categoryFilter;
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch =
          e.title.toLowerCase().includes(q) ||
          e.proposedBy.toLowerCase().includes(q) ||
          (e.venuePlaceholder && e.venuePlaceholder.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q);
      }

      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [events, filter, categoryFilter, searchQuery]);

  const userRole: AdminRole =
    user?.role === "admin" ? "Admin" : (user?.role as AdminRole) || "Admin";
  const canPublish = userRole === "Admin" || userRole === "President";

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filter === "ALL"
              ? "bg-[#174789] text-white border-[#174789] shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                filter === "ALL" ? "text-blue-100" : "text-slate-500"
              }`}
            >
              All Events
            </span>
            <Calendar className={`w-4 h-4 ${filter === "ALL" ? "text-blue-200" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black mt-1">{counts.total}</p>
        </button>

        <button
          onClick={() => setFilter("PENDING_PRESIDENT")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filter === "PENDING_PRESIDENT"
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                filter === "PENDING_PRESIDENT" ? "text-amber-100" : "text-amber-700"
              }`}
            >
              Pending Pres.
            </span>
            <Clock className={`w-4 h-4 ${filter === "PENDING_PRESIDENT" ? "text-amber-100" : "text-amber-500"}`} />
          </div>
          <p
            className={`text-2xl font-black mt-1 ${
              filter === "PENDING_PRESIDENT" ? "text-white" : "text-amber-600"
            }`}
          >
            {counts.pendingPresident}
          </p>
        </button>

        <button
          onClick={() => setFilter("PENDING_VP")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filter === "PENDING_VP"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                filter === "PENDING_VP" ? "text-indigo-100" : "text-indigo-700"
              }`}
            >
              Pending VP
            </span>
            <Users className={`w-4 h-4 ${filter === "PENDING_VP" ? "text-indigo-100" : "text-indigo-500"}`} />
          </div>
          <p
            className={`text-2xl font-black mt-1 ${
              filter === "PENDING_VP" ? "text-white" : "text-indigo-600"
            }`}
          >
            {counts.pendingVp}
          </p>
        </button>

        <button
          onClick={() => setFilter("READY_FOR_PUBLICATION")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filter === "READY_FOR_PUBLICATION"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                filter === "READY_FOR_PUBLICATION" ? "text-emerald-100" : "text-emerald-700"
              }`}
            >
              Ready to Publish
            </span>
            <CheckCircle2
              className={`w-4 h-4 ${
                filter === "READY_FOR_PUBLICATION" ? "text-emerald-100" : "text-emerald-500"
              }`}
            />
          </div>
          <p
            className={`text-2xl font-black mt-1 ${
              filter === "READY_FOR_PUBLICATION" ? "text-white" : "text-emerald-600"
            }`}
          >
            {counts.readyForPublication}
          </p>
        </button>

        <button
          onClick={() => setFilter("PUBLISHED")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filter === "PUBLISHED"
              ? "bg-teal-600 text-white border-teal-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-teal-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                filter === "PUBLISHED" ? "text-teal-100" : "text-teal-700"
              }`}
            >
              Published
            </span>
            <Globe className={`w-4 h-4 ${filter === "PUBLISHED" ? "text-teal-100" : "text-teal-500"}`} />
          </div>
          <p
            className={`text-2xl font-black mt-1 ${
              filter === "PUBLISHED" ? "text-white" : "text-teal-600"
            }`}
          >
            {counts.published}
          </p>
        </button>

        <button
          onClick={() => setFilter("REJECTED")}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filter === "REJECTED"
              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                filter === "REJECTED" ? "text-rose-100" : "text-rose-700"
              }`}
            >
              Rejected
            </span>
            <XCircle className={`w-4 h-4 ${filter === "REJECTED" ? "text-rose-100" : "text-rose-500"}`} />
          </div>
          <p
            className={`text-2xl font-black mt-1 ${
              filter === "REJECTED" ? "text-white" : "text-rose-600"
            }`}
          >
            {counts.rejected}
          </p>
        </button>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Workflow Stage Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TrackerFilter)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#174789]/20"
            >
              <option value="ALL">All Stages ({counts.total})</option>
              <option value="PENDING_PRESIDENT">Pending President Approval ({counts.pendingPresident})</option>
              <option value="PENDING_VP">Pending VP Approval ({counts.pendingVp})</option>
              <option value="PENDING_MULTIPLE">Pending Multiple Approvals ({counts.pendingMultiple})</option>
              <option value="READY_FOR_PUBLICATION">Ready for Publication ({counts.readyForPublication})</option>
              <option value="PUBLISHED">Published ({counts.published})</option>
              <option value="REJECTED">Rejected ({counts.rejected})</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#174789]/20"
          >
            <option value="ALL">All Categories</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Robotics">Robotics</option>
            <option value="Coding">Coding</option>
            <option value="Design">Design</option>
            <option value="Gaming">Gaming</option>
            <option value="General">General</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event name, proposed by, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174789]/20"
            />
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#174789] hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Refresh approval tracker records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Approval Tracker Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Event Name</th>
                <th className="py-3.5 px-4">Proposed By</th>
                <th className="py-3.5 px-4">Submission Date</th>
                <th className="py-3.5 px-4 text-center">Vice President Status</th>
                <th className="py-3.5 px-4 text-center">President Status</th>
                <th className="py-3.5 px-4">Overall Status</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No event proposals found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No events match the selected workflow filter or search query.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const presDec = getPresidentDecision(event);
                  const vpDec = getVicePresidentDecision(event);
                  const overall = getOverallApprovalStatus(event);

                  const submissionDateStr = event.submittedAt || event.createdAt;
                  const formattedSubDate = submissionDateStr
                    ? new Date(submissionDateStr).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";

                  const updatedDateStr = event.updatedAt || event.createdAt;
                  const formattedUpDate = updatedDateStr
                    ? new Date(updatedDateStr).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  const PresIcon = presDec.icon;
                  const VpIcon = vpDec.icon;

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      {/* Event Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 group-hover:text-[#174789] transition-colors">
                          {event.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono text-[10px] text-slate-400">{event.id}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{event.category}</span>
                          <span>•</span>
                          <span>Team: {event.teamSizeMin}–{event.teamSizeMax}</span>
                        </div>
                      </td>

                      {/* Proposed By */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{event.proposedBy}</div>
                        {event.proposedByEmail && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]" title={event.proposedByEmail}>
                            {event.proposedByEmail}
                          </div>
                        )}
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formattedSubDate}
                      </td>

                      {/* Vice President Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${vpDec.badgeClass}`}
                          title={vpDec.comment || vpDec.rejectionReason || vpDec.label}
                        >
                          <VpIcon className="w-3 h-3 shrink-0" />
                          <span>{vpDec.label}</span>
                        </span>
                        {vpDec.decisionBy && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto" title={vpDec.decisionBy}>
                            {vpDec.decisionBy}
                          </div>
                        )}
                      </td>

                      {/* President Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${presDec.badgeClass}`}
                          title={presDec.comment || presDec.rejectionReason || presDec.label}
                        >
                          <PresIcon className="w-3 h-3 shrink-0" />
                          <span>{presDec.label}</span>
                        </span>
                        {presDec.decisionBy && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto" title={presDec.decisionBy}>
                            {presDec.decisionBy}
                          </div>
                        )}
                      </td>

                      {/* Overall Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${overall.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${overall.dotClass}`} />
                            <span>{overall.label}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium line-clamp-1 max-w-[180px]">
                            Next: {overall.nextActor}
                          </span>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formattedUpDate}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Inspect full proposal and approval history trail"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>

                          {/* Quick Publish Action if Ready for Publication */}
                          {overall.stage === "ready_for_publication" && canPublish && onPublishEvent && (
                            <button
                              onClick={() => onPublishEvent(event.id)}
                              disabled={publishingId === event.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#174789] hover:bg-[#123668] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Publish approved event to public catalogue"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>{publishingId === event.id ? "Publishing..." : "Publish"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> event proposals
          </span>
          <span className="text-[11px] text-slate-400">
            Click on any event row to open the complete decision trail and audit history.
          </span>
        </div>
      </div>

      {/* Event Details and Approval History Modal */}
      {selectedEvent && (
        <EventApprovalDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onPublish={
            canPublish && onPublishEvent
              ? async (id) => {
                  await onPublishEvent(id);
                  setSelectedEvent(null);
                }
              : undefined
          }
          isPublishing={publishingId === selectedEvent.id}
          canPublish={canPublish}
        />
      )}
    </div>
  );
}

interface EventApprovalDetailModalProps {
  event: EventRecord;
  onClose: () => void;
  onPublish?: (id: string) => Promise<void>;
  isPublishing?: boolean;
  canPublish?: boolean;
}

export function EventApprovalDetailModal({
  event,
  onClose,
  onPublish,
  isPublishing = false,
  canPublish = false,
}: EventApprovalDetailModalProps) {
  const presDec = getPresidentDecision(event);
  const vpDec = getVicePresidentDecision(event);
  const overall = getOverallApprovalStatus(event);

  const PresIcon = presDec.icon;
  const VpIcon = vpDec.icon;

  const isReadyToPublish = overall.stage === "ready_for_publication";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-[#0E2A5C] text-white flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/90">
                {event.id}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-400/20 text-blue-200 border border-blue-400/30">
                {event.category}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${overall.badgeClass}`}>
                {overall.label}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {event.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Current Blocking Stage Banner */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                Current Workflow Stage
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${overall.dotClass} animate-pulse`} />
                <span>{overall.label}</span>
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {overall.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Next Action Required By
              </span>
              <span className="text-xs font-bold text-[#174789] block mt-0.5">
                {overall.nextActor}
              </span>
            </div>
          </div>

          {/* Rejection Alert (If Rejected) */}
          {(presDec.status === "rejected" || vpDec.status === "rejected" || event.status === "rejected") && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Proposal Decision: Rejected</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                <strong>Reason: </strong>
                {presDec.rejectionReason ||
                  vpDec.rejectionReason ||
                  event.rejectionReason ||
                  "No rejection rationale recorded."}
              </p>
            </div>
          )}

          {/* Independent Executive Approvals Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Independent Executive Approvals
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* President Approval Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    <span>President Council</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${presDec.badgeClass}`}
                  >
                    <PresIcon className="w-3 h-3" />
                    <span>{presDec.label}</span>
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Decided By:</span>
                    <span className="font-semibold text-slate-800">
                      {presDec.decisionBy || "Awaiting President"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Decision Date:</span>
                    <span className="font-medium text-slate-700">
                      {presDec.decidedAt
                        ? new Date(presDec.decidedAt).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Pending"}
                    </span>
                  </div>

                  {presDec.comment && (
                    <div className="pt-1.5 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 block font-medium">President Comment:</span>
                      <p className="text-slate-700 italic mt-0.5">&ldquo;{presDec.comment}&rdquo;</p>
                    </div>
                  )}

                  {presDec.rejectionReason && (
                    <div className="pt-1.5 border-t border-slate-100 text-[11px] text-rose-700">
                      <span className="font-semibold block">Rejection Rationale:</span>
                      <p className="mt-0.5">{presDec.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vice President Coordination Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Vice President Council</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${vpDec.badgeClass}`}
                  >
                    <VpIcon className="w-3 h-3" />
                    <span>{vpDec.label}</span>
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Coordinated By:</span>
                    <span className="font-semibold text-slate-800">
                      {event.coordinatorName || vpDec.decisionBy || "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Coordination Status:</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {(event.coordinationStatus || "Awaiting Coordination").replace(/_/g, " ")}
                    </span>
                  </div>

                  {vpDec.decidedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sign-Off Date:</span>
                      <span className="font-medium text-slate-700">
                        {new Date(vpDec.decidedAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {vpDec.comment && (
                    <div className="pt-1.5 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 block font-medium">VP Notes:</span>
                      <p className="text-slate-700 italic mt-0.5">&ldquo;{vpDec.comment}&rdquo;</p>
                    </div>
                  )}

                  {event.coordinationBlockers && (
                    <div className="pt-1.5 border-t border-slate-100 text-[11px] text-amber-700">
                      <span className="font-semibold block">Logistical Blocker:</span>
                      <p className="mt-0.5">{event.coordinationBlockers}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Proposal Specifications */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Proposal Details & Logistics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Proposed By</span>
                <span className="font-semibold text-slate-800">{event.proposedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Submission Date</span>
                <span className="font-semibold text-slate-800">
                  {event.submittedAt || event.createdAt
                    ? new Date(event.submittedAt || event.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Venue</span>
                <span className="font-semibold text-slate-800">{event.venuePlaceholder}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Target Dates</span>
                <span className="font-semibold text-slate-800">
                  {event.proposedDateTime || event.datePlaceholder}
                </span>
              </div>
            </div>

            <div className="text-xs pt-2 border-t border-slate-200/60">
              <span className="text-slate-400 block text-[11px] font-medium">Description</span>
              <p className="text-slate-700 mt-0.5 leading-relaxed">{event.description}</p>
            </div>

            {event.objectives && (
              <div className="text-xs pt-1">
                <span className="text-slate-400 block text-[11px] font-medium">Objectives</span>
                <p className="text-slate-700 mt-0.5 leading-relaxed">{event.objectives}</p>
              </div>
            )}
          </div>

          {/* Chronological Approval & Decision History Trail */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Chronological Approval Trail</span>
              <span className="text-[11px] font-normal text-slate-400">
                {event.approvalHistory?.length || 1} logged events
              </span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {(!event.approvalHistory || event.approvalHistory.length === 0) ? (
                <div className="p-4 text-xs text-slate-600 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Send className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Proposal Submitted</span>
                      <span className="text-[11px] text-slate-400">
                        {event.submittedAt
                          ? new Date(event.submittedAt).toLocaleString("en-IN")
                          : new Date(event.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Submitted by {event.proposedBy} for executive evaluation.
                    </p>
                  </div>
                </div>
              ) : (
                event.approvalHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 text-xs flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        item.decision === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.decision === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : item.decision === "published"
                          ? "bg-teal-100 text-teal-700"
                          : item.decision === "coordinated"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.decision === "approved" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : item.decision === "rejected" ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : item.decision === "published" ? (
                        <Globe className="w-3.5 h-3.5" />
                      ) : item.decision === "coordinated" ? (
                        <Users className="w-3.5 h-3.5" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 capitalize">
                          {item.stage} • {item.decision}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(item.timestamp).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Actor: <strong className="text-slate-700">{item.actorName}</strong> ({item.actorRole || item.stage})
                      </div>
                      {item.comment && (
                        <p className="text-[11px] text-slate-600 mt-1 italic bg-slate-50 p-2 rounded-md border border-slate-100">
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      )}
                      {item.rejectionReason && (
                        <p className="text-[11px] text-rose-700 mt-1 font-medium bg-rose-50/70 p-2 rounded-md border border-rose-200">
                          Rejection Reason: {item.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Current Status:{" "}
            <span className="font-semibold text-slate-800 capitalize">
              {event.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            {isReadyToPublish && canPublish && onPublish && (
              <button
                onClick={() => onPublish(event.id)}
                disabled={isPublishing}
                className="px-4 py-2 rounded-lg bg-[#174789] hover:bg-[#123668] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isPublishing ? "Publishing Event..." : "Publish Event Now"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
