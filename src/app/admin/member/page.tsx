"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Layers,
  ArrowRight,
  Loader2,
  Lock,
  Edit3,
  Trash2,
  Send,
  Save,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import { AdminUser, EventRecord, MemberTaskRecord, TaskStatus } from "@/types/admin";
import { EventLifecycleTimeline } from "@/components/admin/EventLifecycleTimeline";

export default function MemberPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tasks, setTasks] = useState<MemberTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal modal / editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventRecord["category"]>("Coding");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [proposedDateTime, setProposedDateTime] = useState("");
  const [venue, setVenue] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"In-Person" | "Virtual" | "Hybrid">("In-Person");
  const [expectedParticipants, setExpectedParticipants] = useState<number>(50);
  const [teamSizeMin, setTeamSizeMin] = useState<number>(1);
  const [teamSizeMax, setTeamSizeMax] = useState<number>(4);
  const [requiredResources, setRequiredResources] = useState("");
  const [supportingDocsUrl, setSupportingDocsUrl] = useState("");

  // Filters
  const [proposalFilter, setProposalFilter] = useState<"ALL" | "draft" | "proposed" | "approved" | "in_coordination" | "rejected">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected proposal details view
  const [selectedProposal, setSelectedProposal] = useState<EventRecord | null>(null);

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/admin/auth/me");
      if (!meRes.ok) {
        router.push("/admin/member/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const eventsRes = await fetch("/api/admin/events");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      const tasksRes = await fetch("/api/admin/tasks");
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (err) {
      console.error("Error loading member portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const resetForm = () => {
    setEditingEventId(null);
    setTitle("");
    setCategory("Coding");
    setDescription("");
    setObjectives("");
    setProposedDateTime("");
    setVenue("");
    setDeliveryMode("In-Person");
    setExpectedParticipants(50);
    setTeamSizeMin(1);
    setTeamSizeMax(4);
    setRequiredResources("");
    setSupportingDocsUrl("");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (event: EventRecord) => {
    setEditingEventId(event.id);
    setTitle(event.title || "");
    setCategory(event.category || "Coding");
    setDescription(event.description || "");
    setObjectives(event.objectives || "");
    setProposedDateTime(event.proposedDateTime || event.datePlaceholder || "");
    setVenue(event.venuePlaceholder || "");
    setDeliveryMode((event.deliveryMode as "In-Person" | "Virtual" | "Hybrid") || "In-Person");
    setExpectedParticipants(event.expectedParticipants || 50);
    setTeamSizeMin(event.teamSizeMin || 1);
    setTeamSizeMax(event.teamSizeMax || 4);
    setRequiredResources(event.requiredResources || "");
    setSupportingDocsUrl(event.supportingDocsUrl || "");
    setIsEditorOpen(true);
  };

  const handleSaveProposal = async (targetStatus: "draft" | "proposed") => {
    setFeedbackMessage(null);

    if (!title.trim() || !description.trim()) {
      setFeedbackMessage({ type: "error", text: "Please provide both competition title and description." });
      return;
    }

    try {
      setSubmitting(true);

      if (editingEventId) {
        // Editing existing proposal/draft
        const res = await fetch("/api/admin/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: editingEventId,
            action: targetStatus === "proposed" ? "submit" : "edit",
            title,
            category,
            description,
            objectives,
            proposedDateTime,
            deliveryMode,
            expectedParticipants,
            teamSizeMin,
            teamSizeMax,
            venuePlaceholder: venue || "Campus Computing Labs",
            requiredResources,
            supportingDocsUrl,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setFeedbackMessage({ type: "error", text: data.error || "Failed to update proposal." });
          return;
        }

        setFeedbackMessage({
          type: "success",
          text: targetStatus === "proposed" ? "Proposal submitted to President Council for executive review!" : "Draft updated successfully.",
        });
      } else {
        // Creating new proposal or draft
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            description,
            objectives,
            proposedDateTime,
            deliveryMode,
            expectedParticipants,
            teamSizeMin,
            teamSizeMax,
            venuePlaceholder: venue || "Campus Computing Labs",
            requiredResources,
            supportingDocsUrl,
            status: targetStatus,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setFeedbackMessage({ type: "error", text: data.error || "Failed to save proposal." });
          return;
        }

        setFeedbackMessage({
          type: "success",
          text: targetStatus === "proposed" ? "Proposal submitted to President Council for executive review!" : "Draft proposal saved in My Proposals.",
        });
      }

      setIsEditorOpen(false);
      resetForm();
      await loadData();
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error saving proposal." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDraft = async (eventId: string) => {
    if (!confirm("Are you sure you want to submit this draft proposal for President review?")) return;
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "submit" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to submit draft." });
        return;
      }
      setFeedbackMessage({ type: "success", text: "Proposal successfully submitted for executive review!" });
      await loadData();
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error submitting draft." });
    }
  };

  const handleDeleteDraft = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this draft proposal permanently?")) return;
    try {
      const res = await fetch(`/api/admin/events?eventId=${encodeURIComponent(eventId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to delete draft." });
        return;
      }
      setFeedbackMessage({ type: "success", text: "Draft proposal deleted." });
      await loadData();
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error deleting draft." });
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to update task progress." });
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error updating task status." });
    }
  };

  // Filtered proposals
  const myProposals = useMemo(() => {
    const userEmail = user?.email?.toLowerCase() || "";
    return events.filter((e) => {
      const isOwner =
        (e.proposedByEmail && e.proposedByEmail.toLowerCase() === userEmail) ||
        e.proposedBy?.toLowerCase().includes(userEmail);
      return isOwner;
    });
  }, [events, user]);

  const filteredProposals = useMemo(() => {
    return myProposals.filter((p) => {
      if (proposalFilter === "draft" && p.status !== "draft") return false;
      if (proposalFilter === "proposed" && p.status !== "proposed") return false;
      if (proposalFilter === "approved" && p.status !== "approved" && p.status !== "published") return false;
      if (proposalFilter === "in_coordination" && !(p.coordinationStatus === "in_coordination" || p.coordinatorId)) return false;
      if (proposalFilter === "rejected" && p.status !== "rejected") return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesId = p.id.toLowerCase().includes(query);
        return matchesTitle || matchesCategory || matchesId;
      }
      return true;
    });
  }, [myProposals, proposalFilter, searchQuery]);

  // Statistics
  const draftCount = myProposals.filter((p) => p.status === "draft").length;
  const pendingCount = myProposals.filter((p) => p.status === "proposed").length;
  const approvedCount = myProposals.filter((p) => p.status === "approved" || p.status === "published").length;
  const rejectedCount = myProposals.filter((p) => p.status === "rejected").length;
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading AVISHKAR Member Workspace...</p>
      </div>
    );
  }

  // Authorization Gate: Member or President
  if (user?.role !== "AVISHKAR Member" && user?.role !== "President") {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-sm my-12">
        <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Member Authorization Required</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            This workspace is restricted to authorized AVISHKAR Council Members. Your current session role is{" "}
            <span className="font-semibold text-slate-800">{user?.role || "Guest"}</span>.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin/member/login"
            className="px-4 py-2 rounded-lg bg-[#174789] hover:bg-[#123668] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Sign in with Member Account
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            Back to Portal Selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2047]">
            Member Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, {user?.fullName || "Council Member"}. Submit event proposals, manage drafts, and track assigned duties.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Event Proposal</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between gap-3 text-xs sm:text-sm border ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold hover:opacity-75 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Draft Proposals</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1.5">{draftCount}</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Saved in workspace</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Pending Review</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1.5">{pendingCount}</p>
          <span className="text-[10px] text-amber-700 font-medium mt-1 block">With President</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Approved Tracks</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1.5">{approvedCount}</p>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Executive approval</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Rejected Proposals</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1.5">{rejectedCount}</p>
          <span className="text-[10px] text-rose-700 font-medium mt-1 block">Feedback available</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500">Assigned Duties</span>
          <p className="text-xl sm:text-2xl font-bold text-[#174789] mt-1.5">
            {completedTasksCount}/{tasks.length}
          </p>
          <span className="text-[10px] text-blue-700 font-medium mt-1 block">Tasks completed</span>
        </div>
      </div>

      {/* Member Action Advisory Banner */}
      {(draftCount > 0 || rejectedCount > 0 || tasks.some((t) => t.status === "todo")) && (
        <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Next Steps for Your Member Workspace
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {draftCount > 0 && `You have ${draftCount} draft proposal${draftCount > 1 ? "s" : ""} saved in your workspace ready for submission. `}
                {rejectedCount > 0 && `Executive feedback is available on ${rejectedCount} proposal${rejectedCount > 1 ? "s" : ""}. `}
                {tasks.some((t) => t.status === "todo") && `You have assigned committee duties awaiting kickoff.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {draftCount > 0 && (
              <button
                onClick={() => {
                  setProposalFilter("draft");
                  document.getElementById("proposals-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                View Drafts ({draftCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Proposal Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in">
            <div className="p-5 sm:p-6 bg-[#0E2A5C] text-white flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  {editingEventId ? "Edit Event Proposal" : "Create Event Proposal"}
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Provide detailed information for the competition track. You can save as a draft or submit directly for review.
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-white/70 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CodeCraft: Algorithmic Duel"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Competition Track / Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventRecord["category"])}
                    className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Coding">Coding</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Design">Design</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Overview of the event format, problem statement summary, and challenge scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objectives & Learning Outcomes *
                </label>
                <textarea
                  rows={2}
                  placeholder="Key student learning outcomes, industry skills evaluated, and competition goals..."
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposed Date & Time *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 14 Oct 2026, 10:00 AM"
                    value={proposedDateTime}
                    onChange={(e) => setProposedDateTime(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposed Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Block A, Lab 301"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Mode
                  </label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value as "In-Person" | "Virtual" | "Hybrid")}
                    className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Participants
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={expectedParticipants}
                    onChange={(e) => setExpectedParticipants(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={teamSizeMin}
                    onChange={(e) => setTeamSizeMin(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={teamSizeMax}
                    onChange={(e) => setTeamSizeMax(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Resources (Labs, hardware, cloud credits, projectors)
                </label>
                <textarea
                  rows={2}
                  placeholder="List specific hardware kits, power boards, projectors, audio gear, or computing prerequisites..."
                  value={requiredResources}
                  onChange={(e) => setRequiredResources(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supporting Documents (Optional URL / Rulebook draft reference)
                </label>
                <input
                  type="text"
                  placeholder="https://... or /docs/rulebook-draft.pdf"
                  value={supportingDocsUrl}
                  onChange={(e) => setSupportingDocsUrl(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveProposal("draft")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveProposal("proposed")}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Submitting..." : "Submit to President"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. "My Proposals" Section with Filters */}
      <div id="proposals-section" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>My Event Proposals</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your competition track proposals, track review decisions, and view President feedback.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-48"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(["ALL", "draft", "proposed", "approved", "in_coordination", "rejected"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setProposalFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    proposalFilter === filterKey
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filterKey === "ALL"
                    ? "All"
                    : filterKey === "draft"
                    ? "Drafts"
                    : filterKey === "proposed"
                    ? "Pending Review"
                    : filterKey === "approved"
                    ? "Approved"
                    : filterKey === "in_coordination"
                    ? "In Coordination"
                    : "Rejected"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredProposals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No proposals found matching the selected filter. Click &ldquo;Create Event Proposal&rdquo; to propose a new track.
            </div>
          ) : (
            filteredProposals.map((item) => {
              const isDraft = item.status === "draft";
              const isPending = item.status === "proposed";
              const isApproved = item.status === "approved" || item.status === "published";
              const isRejected = item.status === "rejected";

              return (
                <div key={item.id} className="p-5 sm:p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {item.category}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{item.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                      {item.objectives && (
                        <p className="text-[11px] text-slate-500 italic">
                          <strong>Objectives:</strong> {item.objectives}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                        <span>Venue: {item.venuePlaceholder || "Campus"} ({item.deliveryMode || "In-Person"})</span>
                        <span>Date: {item.proposedDateTime || item.datePlaceholder}</span>
                        <span>Expected: ~{item.expectedParticipants || 50} Students</span>
                        <span>Teams: {item.teamSizeMin}–{item.teamSizeMax} Members</span>
                        {item.submittedAt && (
                          <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Compact Lifecycle Stepper */}
                      <div className="pt-2">
                        <EventLifecycleTimeline event={item} compact />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 self-start md:self-center">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-md border ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isPending
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : isRejected
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {isApproved
                          ? item.status === "published"
                            ? "Published & Live"
                            : "Approved by President"
                          : isPending
                          ? "Pending Review"
                          : isRejected
                          ? "Rejected"
                          : "Draft"}
                      </span>

                      {/* Actions for drafts */}
                      {isDraft && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Edit Draft"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleSubmitDraft(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                            title="Submit for President Review"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Actions for pending proposals */}
                      {isPending && (
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Update Info</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review feedback display */}
                  {isRejected && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>President Review Decision: Proposal Rejected</span>
                        {item.reviewedAt && (
                          <span className="text-[10px] text-rose-500 font-normal">
                            ({new Date(item.reviewedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-rose-700 pl-5">
                        <strong>Reason / Comments:</strong> {item.rejectionReason || item.reviewComment || "No comment provided."}
                      </p>
                    </div>
                  )}

                  {isApproved && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 px-3 text-xs text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px]">
                          <strong>Approved by President Council:</strong> Available to Vice President for operational coordination and Admin for publishing.
                        </span>
                      </div>
                      {item.coordinatorName && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          Coordinator: {item.coordinatorName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Tasks Assigned by Vice President & Council */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-700" />
              <span>Assigned Committee Duties & Tasks</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tasks assigned to you by the Vice President or Council. Update progress and mark milestones complete.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200 shrink-0 self-start sm:self-auto">
            {tasks.length} Assigned Tasks
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No tasks currently assigned to your account.
            </div>
          ) : (
            tasks.map((task) => {
              const isDone = task.status === "completed";
              const isBlocked = task.status === "blocked";
              const isInProgress = task.status === "in_progress";

              return (
                <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, isDone ? "in_progress" : "completed")}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          isDone
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-slate-300 hover:border-teal-500"
                        }`}
                        title={isDone ? "Mark as In Progress" : "Mark as Completed"}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <h4
                        className={`text-xs sm:text-sm font-bold text-slate-900 ${
                          isDone ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-600 pl-6 leading-relaxed">{task.description}</p>
                    )}
                    <div className="pl-6 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                      <span>Event: <strong className="text-slate-700">{task.eventTitle}</strong></span>
                      <span>Due: <strong className="text-slate-700">{task.dueDate}</strong></span>
                      <span>Priority: <strong className={task.priority === "high" ? "text-rose-600 uppercase" : "capitalize text-slate-700"}>{task.priority}</strong></span>
                      {task.assignedBy && <span>Assigned by: {task.assignedBy}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center pl-6 sm:pl-0">
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                        isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : isBlocked
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : isInProgress
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <option value="todo">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
