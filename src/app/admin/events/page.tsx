"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  Filter,
  Users,
  MapPin,
  FileText,
  AlertTriangle,
  Eye,
  Edit2,
  Archive,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ClipboardList,
  Layers,
} from "lucide-react";
import { AdminRole, AdminUser, EventRecord, EventStatus } from "@/types/admin";
import { EventApprovalTracker } from "@/components/admin/EventApprovalTracker";

export default function AdminEventsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"tracker" | "operations">("tracker");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    eventId: string;
    action: "unpublish" | "archive";
    eventTitle: string;
  } | null>(null);

  // Active event for edit or preview
  const [activeEvent, setActiveEvent] = useState<EventRecord | null>(null);

  // Form states for Create / Edit
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventRecord["category"]>("Hackathon");
  const [teamSizeMin, setTeamSizeMin] = useState("1");
  const [teamSizeMax, setTeamSizeMax] = useState("4");
  const [datePlaceholder, setDatePlaceholder] = useState("13-14 October 2026");
  const [venuePlaceholder, setVenuePlaceholder] = useState("GD Goenka University Campus");
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationEndDate, setRegistrationEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Read URL query parameter for tab selection (?tab=tracker vs ?tab=operations)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "operations" || tabParam === "all") {
        setViewMode("operations");
      } else if (tabParam === "tracker") {
        setViewMode("tracker");
      }
    }
  }, []);

  const pendingApprovalCount = useMemo(() => {
    return events.filter(
      (e) =>
        e.status === "proposed" ||
        (e.status === "approved" &&
          e.coordinationStatus !== "coordination_ready" &&
          e.vpStatus !== "approved")
    ).length;
  }, [events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to load events.");
      }
    } catch {
      setErrorMessage("Network error while retrieving events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/admin/auth/me");
        if (meRes.ok) {
          const data = await meRes.json();
          setUser(data.user);
        }
        await fetchEvents();
      } catch {
        // ignore
      }
    }
    init();
  }, []);

  const userRole: AdminRole =
    user?.role === "admin" ? "Admin" : (user?.role as AdminRole) || "Admin";

  const handleAction = async (
    eventId: string,
    action: "approve" | "reject" | "publish" | "unpublish" | "archive"
  ) => {
    try {
      setErrorMessage(null);
      let rejectionReason = "";
      if (action === "reject") {
        const inputReason = window.prompt("Please enter the reason for rejecting this proposal:");
        if (!inputReason || !inputReason.trim()) {
          setErrorMessage("Rejection cancelled: A rejection reason is required.");
          return;
        }
        rejectionReason = inputReason.trim();
      }

      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action, rejectionReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || `Action '${action}' failed.`);
        return;
      }

      setActionMessage(data.message || `Event action '${action}' completed.`);
      setTimeout(() => setActionMessage(null), 4000);
      await fetchEvents();
    } catch {
      setErrorMessage("Network error processing event action.");
    }
  };

  const handleOpenEdit = (event: EventRecord) => {
    setActiveEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setCategory(event.category);
    setTeamSizeMin(String(event.teamSizeMin || 1));
    setTeamSizeMax(String(event.teamSizeMax || 4));
    setDatePlaceholder(event.datePlaceholder || event.proposedDateTime || "");
    setVenuePlaceholder(event.venuePlaceholder || "");
    setRegistrationStartDate(event.registrationStartDate || "");
    setRegistrationEndDate(event.registrationEndDate || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !title || !description) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeEvent.id,
          action: "edit",
          title,
          description,
          category,
          datePlaceholder,
          venuePlaceholder,
          registrationStartDate,
          registrationEndDate,
          teamSizeMin: parseInt(teamSizeMin) || 1,
          teamSizeMax: parseInt(teamSizeMax) || 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update event details.");
        return;
      }

      setActionMessage("Event updated successfully.");
      setTimeout(() => setActionMessage(null), 4000);
      setEditModalOpen(false);
      setActiveEvent(null);
      await fetchEvents();
    } catch {
      setErrorMessage("Network error updating event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          datePlaceholder,
          venuePlaceholder,
          registrationStartDate,
          registrationEndDate,
          teamSizeMin: parseInt(teamSizeMin) || 1,
          teamSizeMax: parseInt(teamSizeMax) || 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit event.");
        return;
      }

      setActionMessage(data.message);
      setTimeout(() => setActionMessage(null), 4000);
      setCreateModalOpen(false);
      setTitle("");
      setDescription("");
      await fetchEvents();
    } catch {
      setErrorMessage("Network error creating event.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "published"
          ? e.status === "published"
          : filterStatus === "approved"
          ? e.status === "approved"
          : filterStatus === "proposed"
          ? e.status === "proposed"
          : filterStatus === "archived"
          ? e.status === "archived"
          : filterStatus === "draft"
          ? e.status === "draft"
          : true;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.venuePlaceholder && e.venuePlaceholder.toLowerCase().includes(q)) ||
        (e.proposedBy && e.proposedBy.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [events, filterStatus, searchQuery]);

  const getApprovalBadge = (event: EventRecord) => {
    if (event.approvedBy || event.status === "approved" || event.status === "published") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Approved</span>
        </span>
      );
    }
    if (event.status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Rejected</span>
        </span>
      );
    }
    if (event.status === "proposed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Pending Approval</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <FileText className="w-3 h-3 text-slate-500" />
        <span>Draft</span>
      </span>
    );
  };

  const getPublicationBadge = (status: EventStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Globe className="w-3 h-3 text-emerald-600" />
            <span>Public (Live)</span>
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Archive className="w-3 h-3 text-slate-500" />
            <span>Archived</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            <span>Unpublished</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0A2047]">Events & Competitions Management</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Oversee competition tracks, enforce presidential approvals, manage publication and track registrations.
          </p>
        </div>

        <button
          onClick={() => {
            setTitle("");
            setDescription("");
            setCategory("Hackathon");
            setTeamSizeMin("1");
            setTeamSizeMax("4");
            setDatePlaceholder("13-14 October 2026");
            setVenuePlaceholder("GD Goenka University Campus");
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>{userRole === "AVISHKAR Member" ? "Submit Proposal" : "Create Event"}</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold cursor-pointer">&times;</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold cursor-pointer">&times;</button>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <div className="bg-[#F1F5F9] p-1 rounded-xl inline-flex border border-[#E2E8F0]">
          <button
            onClick={() => setViewMode("tracker")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === "tracker"
                ? "bg-[#0A2047] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0A2047] hover:bg-white/60"
            }`}
          >
            <ClipboardList className={`w-4 h-4 ${viewMode === "tracker" ? "text-[#D4AF37]" : "text-[#64748B]"}`} />
            <span>Event Approval Tracker</span>
            {pendingApprovalCount > 0 && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  viewMode === "tracker" ? "bg-amber-400 text-[#0A2047]" : "bg-amber-100 text-amber-800"
                }`}
              >
                {pendingApprovalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode("operations")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === "operations"
                ? "bg-[#0A2047] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0A2047] hover:bg-white/60"
            }`}
          >
            <Layers className={`w-4 h-4 ${viewMode === "operations" ? "text-[#D4AF37]" : "text-[#64748B]"}`} />
            <span>All Events & Operations</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                viewMode === "operations" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
              }`}
            >
              {events.length}
            </span>
          </button>
        </div>
      </div>

      {viewMode === "tracker" ? (
        <EventApprovalTracker
          events={events}
          onRefresh={fetchEvents}
          isRefreshing={loading}
          user={user}
          onPublishEvent={async (id) => {
            try {
              setPublishingId(id);
              await handleAction(id, "publish");
            } finally {
              setPublishingId(null);
            }
          }}
          publishingId={publishingId}
        />
      ) : (
        <>
          {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {[
            { label: "All Events", value: "ALL" },
            { label: "Published", value: "published" },
            { label: "Approved", value: "approved" },
            { label: "Pending Approval", value: "proposed" },
            { label: "Drafts", value: "draft" },
            { label: "Archived", value: "archived" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === tab.value
                  ? "bg-[#0A2047] text-white shadow-xs"
                  : "bg-slate-100 text-[#64748B] hover:text-[#0A2047] hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event, venue, or lead..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] bg-white text-[#172033] placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse font-medium">
            Loading events &amp; proposals...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-14 text-center text-slate-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <h3 className="font-bold text-[#172033] text-sm">No Events Found</h3>
            <p className="text-xs text-[#64748B] mt-1">
              No event tracks match the current filter criteria or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Event Name</th>
                  <th className="py-3 px-4 font-bold">Event Date</th>
                  <th className="py-3 px-4 font-bold">Venue</th>
                  <th className="py-3 px-4 font-bold">Approval Status</th>
                  <th className="py-3 px-4 font-bold">Publication Status</th>
                  <th className="py-3 px-4 font-bold text-center">Registrations</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => {
                  const isApproved =
                    evt.status === "approved" || evt.status === "published" || Boolean(evt.approvedBy);
                  const canPublish =
                    evt.status === "approved" && (userRole === "President" || userRole === "Admin");

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Event Name */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-bold text-[#0A2047] text-sm">{evt.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0A2047]/5 text-[#0A2047] border border-[#0A2047]/15">
                            {evt.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono truncate">
                            {evt.slug}
                          </span>
                        </div>
                      </td>

                      {/* Event Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#172033]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{evt.datePlaceholder || evt.proposedDateTime || "TBD"}</span>
                        </div>
                        {evt.registrationEndDate && (
                          <div className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                            Reg closes: {evt.registrationEndDate}
                          </div>
                        )}
                      </td>

                      {/* Venue */}
                      <td className="py-3.5 px-4 text-[#172033]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {evt.venuePlaceholder || "Campus Arena"}
                          </span>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getApprovalBadge(evt)}
                        {evt.approvedBy && (
                          <div className="text-[10px] text-[#64748B] mt-0.5 truncate max-w-[140px] font-medium">
                            By {evt.approvedBy}
                          </div>
                        )}
                      </td>

                      {/* Publication Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getPublicationBadge(evt.status)}
                      </td>

                      {/* Registration Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-[#0A2047] font-bold text-xs border border-slate-200">
                          <Users className="w-3 h-3 text-[#64748B]" />
                          <span>{evt.registrationCount ?? 0}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Action */}
                          <button
                            onClick={() => {
                              setActiveEvent(evt);
                              setPreviewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0A2047] hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                            title="Preview Event"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Action */}
                          <button
                            onClick={() => handleOpenEdit(evt)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0A2047] hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* President Approve / Reject for proposals */}
                          {evt.status === "proposed" && userRole === "President" && (
                            <>
                              <button
                                onClick={() => handleAction(evt.id, "approve")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(evt.id, "reject")}
                                className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Publish Action (strictly only if approved) */}
                          {canPublish && (
                            <button
                              onClick={() => handleAction(evt.id, "publish")}
                              className="px-2.5 py-1 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Publish approved event to public catalogue"
                            >
                              <Globe className="w-3 h-3 text-[#D4AF37]" />
                              <span>Publish</span>
                            </button>
                          )}

                          {/* Unpublish Action (with confirmation) */}
                          {evt.status === "published" && (userRole === "President" || userRole === "Admin") && (
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  open: true,
                                  eventId: evt.id,
                                  action: "unpublish",
                                  eventTitle: evt.title,
                                })
                              }
                              className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                              title="Unpublish event from public site"
                            >
                              Unpublish
                            </button>
                          )}

                          {/* Archive Action (with confirmation) */}
                          {evt.status !== "archived" && (userRole === "President" || userRole === "Admin") && (
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  open: true,
                                  eventId: evt.id,
                                  action: "archive",
                                  eventTitle: evt.title,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                              title="Archive Event"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Confirmation Modal for Unpublish & Archive */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A2047] text-base">
                  {confirmModal.action === "unpublish" ? "Confirm Unpublish Event" : "Confirm Archive Event"}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {confirmModal.action === "unpublish"
                    ? "This event will be taken off the public website. Existing student registrations will remain preserved."
                    : "Archived events are removed from active queues while preserving historical records and registrations."}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs font-medium text-slate-800">
              Event: <span className="font-bold text-[#0A2047]">{confirmModal.eventTitle}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-xs font-semibold text-[#172033] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { eventId, action } = confirmModal;
                  setConfirmModal(null);
                  await handleAction(eventId, action);
                }}
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-xs cursor-pointer ${
                  confirmModal.action === "unpublish"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-[#0A2047] hover:bg-[#132E57]"
                }`}
              >
                Yes, {confirmModal.action === "unpublish" ? "Unpublish Event" : "Archive Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0A2047]/10 flex items-center justify-center text-[#0A2047]">
                  <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2047] text-base">
                    {userRole === "AVISHKAR Member"
                      ? "Submit Event Proposal"
                      : "Create New AVISHKAR Competition"}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Fill in event parameters and competition guidelines</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-[#0A2047] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CodeCombat: Algorithmic Duel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventRecord["category"])}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033] bg-white font-medium"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Coding">Coding</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Design">Design</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Team Size (Min - Max)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={teamSizeMin}
                      onChange={(e) => setTeamSizeMin(e.target.value)}
                      className="w-16 px-2 py-2 text-xs border border-[#E2E8F0] rounded-lg text-center font-bold text-[#0A2047]"
                    />
                    <span className="text-[#64748B] font-semibold">to</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={teamSizeMax}
                      onChange={(e) => setTeamSizeMax(e.target.value)}
                      className="w-16 px-2 py-2 text-xs border border-[#E2E8F0] rounded-lg text-center font-bold text-[#0A2047]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Description & Guidelines *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the format, problem tracks, scoring criteria, and guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Event Date / Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g., 13-14 October 2026"
                    value={datePlaceholder}
                    onChange={(e) => setDatePlaceholder(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Venue Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Lab 2, GD Goenka University"
                    value={venuePlaceholder}
                    onChange={(e) => setVenuePlaceholder(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-xs font-semibold text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>
                    {submitting
                      ? "Submitting..."
                      : userRole === "AVISHKAR Member"
                      ? "Submit Proposal"
                      : "Create Event"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editModalOpen && activeEvent && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0A2047]/10 flex items-center justify-center text-[#0A2047]">
                  <Edit2 className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2047] text-base">Edit Event Details</h3>
                  <p className="text-[11px] text-[#64748B]">Update competition tracks, schedules and guidelines</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-[#0A2047] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventRecord["category"])}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033] bg-white font-medium"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Coding">Coding</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Design">Design</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Team Size (Min - Max)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={teamSizeMin}
                      onChange={(e) => setTeamSizeMin(e.target.value)}
                      className="w-16 px-2 py-2 text-xs border border-[#E2E8F0] rounded-lg text-center font-bold text-[#0A2047]"
                    />
                    <span className="text-[#64748B] font-semibold">to</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={teamSizeMax}
                      onChange={(e) => setTeamSizeMax(e.target.value)}
                      className="w-16 px-2 py-2 text-xs border border-[#E2E8F0] rounded-lg text-center font-bold text-[#0A2047]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Date Placeholder</label>
                  <input
                    type="text"
                    value={datePlaceholder}
                    onChange={(e) => setDatePlaceholder(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Venue Location</label>
                  <input
                    type="text"
                    value={venuePlaceholder}
                    onChange={(e) => setVenuePlaceholder(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E2E8F0]">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">Registration Opens</label>
                  <input
                    type="date"
                    value={registrationStartDate}
                    onChange={(e) => setRegistrationStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Registration Closes</label>
                  <input
                    type="date"
                    value={registrationEndDate}
                    onChange={(e) => setRegistrationEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]/15 focus:border-[#0A2047] focus:outline-none text-[#172033]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-xs font-semibold text-[#172033] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Event Modal */}
      {previewModalOpen && activeEvent && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#8C6D1F] border border-[#D4AF37]/40">
                  {activeEvent.category}
                </span>
                <span className="text-xs text-[#64748B]">Public Card Preview</span>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-slate-400 hover:text-[#0A2047] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#0A2047]">{activeEvent.title}</h3>
              <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-line">
                {activeEvent.description}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Event Schedule</span>
                  <span className="font-semibold text-[#172033]">
                    {activeEvent.datePlaceholder || "Dates to be announced"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Venue Location</span>
                  <span className="font-semibold text-[#172033]">
                    {activeEvent.venuePlaceholder || "GD Goenka University"}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Team Formation</span>
                  <span className="font-semibold text-[#172033]">
                    {activeEvent.teamSizeMin} to {activeEvent.teamSizeMax} Members
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Public Status</span>
                  <span className="font-semibold text-[#172033] capitalize">
                    {activeEvent.status}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] pt-1">
                <span>Proposed by: <strong className="text-[#172033]">{activeEvent.proposedBy}</strong></span>
                {activeEvent.approvedBy && (
                  <span className="block text-emerald-700 font-medium mt-0.5">
                    Presidential Approval Ratified: {activeEvent.approvedBy}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
