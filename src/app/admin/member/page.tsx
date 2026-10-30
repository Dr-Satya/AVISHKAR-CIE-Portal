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
  Bell,
  RefreshCw,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import { AdminUser, EventRecord, MemberTaskRecord, TaskStatus, NotificationRecord } from "@/types/admin";
import { EventLifecycleTimeline } from "@/components/admin/EventLifecycleTimeline";

export default function MemberPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tasks, setTasks] = useState<MemberTaskRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Modals for deep inspection
  const [selectedProposal, setSelectedProposal] = useState<EventRecord | null>(null);
  const [selectedTask, setSelectedTask] = useState<MemberTaskRecord | null>(null);
  const [taskNotesInput, setTaskNotesInput] = useState("");
  const [savingTaskNotes, setSavingTaskNotes] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const meRes = await fetch("/api/admin/auth/me");
      if (!meRes.ok) {
        router.push("/admin/member/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const [eventsRes, tasksRes, notifsRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/tasks"),
        fetch("/api/admin/notifications"),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (notifsRes.ok) {
        const notifsData = await notifsRes.json();
        if (notifsData.success) {
          setNotifications(notifsData.notifications || []);
          setUnreadNotifCount(notifsData.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("Error loading member portal data:", err);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
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

  const handleReviseProposal = (event: EventRecord) => {
    // Clones the rejected proposal content as a fresh draft
    setEditingEventId(null);
    setTitle(`${event.title} (Revised)`);
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
    setSelectedProposal(null);
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
          text: targetStatus === "proposed" ? "Proposal submitted to Vice President & President for review!" : "Draft updated successfully.",
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
          text: targetStatus === "proposed" ? "Proposal submitted to Vice President & President for review!" : "Draft proposal saved in My Proposals.",
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
    if (!confirm("Are you sure you want to submit this draft proposal for council review?")) return;
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
      if (selectedProposal && selectedProposal.id === eventId) {
        setSelectedProposal({ ...selectedProposal, status: "proposed", submittedAt: new Date().toISOString() });
      }
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
      if (selectedProposal && selectedProposal.id === eventId) {
        setSelectedProposal(null);
      }
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
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : undefined } : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : undefined });
      }
      setFeedbackMessage({ type: "success", text: `Task updated to ${newStatus.replace("_", " ")}.` });
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error updating task status." });
    }
  };

  const handleSaveTaskNotes = async (taskId: string, notes: string) => {
    try {
      setSavingTaskNotes(true);
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to save task notes." });
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, notes } : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, notes });
      }
      setFeedbackMessage({ type: "success", text: "Task progress notes saved." });
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error saving notes." });
    } finally {
      setSavingTaskNotes(false);
    }
  };

  const handleOpenTaskModal = (task: MemberTaskRecord) => {
    setSelectedTask(task);
    setTaskNotesInput(task.notes || "");
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadNotifCount(0);
      }
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const handleNotificationClick = async (notif: NotificationRecord) => {
    if (!notif.read) {
      try {
        await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
        setUnreadNotifCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    }

    // Try linking to a relevant proposal or task
    if (notif.type === "proposal" || notif.type === "approval" || notif.type === "rejection") {
      const matched = events.find((e) => notif.message.includes(e.title) || notif.title.includes(e.title) || notif.link?.includes(e.id));
      if (matched) {
        setSelectedProposal(matched);
        setIsNotifDrawerOpen(false);
        return;
      }
    } else if (notif.type === "task") {
      const matched = tasks.find((t) => notif.message.includes(t.title) || notif.title.includes(t.title) || notif.link?.includes(t.id));
      if (matched) {
        handleOpenTaskModal(matched);
        setIsNotifDrawerOpen(false);
        return;
      }
    }
  };

  const [currentTimestamp] = useState(() => Date.now());

  const isTaskOverdue = (task: MemberTaskRecord): boolean => {
    if (!task.dueDate || task.status === "completed") return false;
    try {
      const due = new Date(task.dueDate + "T23:59:59").getTime();
      return due < currentTimestamp;
    } catch {
      return false;
    }
  };

  // Filtered proposals
  const myProposals = useMemo(() => {
    const userEmail = user?.email?.toLowerCase() || "";
    const userName = (user?.fullName || "").toLowerCase();
    return events.filter((e) => {
      const isOwner =
        (e.proposedByEmail && e.proposedByEmail.toLowerCase() === userEmail) ||
        (userEmail && e.proposedBy?.toLowerCase().includes(userEmail)) ||
        (userName && e.proposedBy?.toLowerCase().includes(userName));
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
        const matchesDesc = (p.description || "").toLowerCase().includes(query);
        return matchesTitle || matchesCategory || matchesId || matchesDesc;
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
        <Loader2 className="w-8 h-8 text-[#0A2047] animate-spin" />
        <p className="text-xs text-[#64748B] font-medium">Loading AVISHKAR Member Workspace...</p>
      </div>
    );
  }

  // Authorization Gate: Member or President
  if (user?.role !== "AVISHKAR Member" && user?.role !== "President" && user?.role !== "Admin") {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-xs my-12">
        <div className="w-14 h-14 rounded-xl bg-[#0A2047]/10 text-[#0A2047] flex items-center justify-center mx-auto border border-[#0A2047]/20">
          <Lock className="w-7 h-7 text-[#0A2047]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0A2047]">Member Authorization Required</h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md mx-auto">
            This workspace is restricted to authorized AVISHKAR Council Members. Your current session role is{" "}
            <span className="font-semibold text-[#172033]">{user?.role || "Guest"}</span>.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin/member/login"
            className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs border border-[#D4AF37]/30 transition-colors"
          >
            Sign in with Member Account
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-lg bg-[#F0F3F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-semibold shadow-xs transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2047]">
              Member Workspace
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
              AVISHKAR Council
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Welcome, {user?.fullName || "Council Member"}. Submit event proposals, manage drafts, and track assigned duties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] hover:bg-[#F0F3F8] text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsNotifDrawerOpen(true)}
            className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] hover:bg-[#F0F3F8] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Council Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-[#0A2047]" />
            <span>Notifications</span>
            {unreadNotifCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#DC2626] text-white text-[10px] font-bold">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
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
        <div
          onClick={() => setProposalFilter("draft")}
          className={`bg-white border rounded-xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all hover:border-[#D4AF37]/60 ${
            proposalFilter === "draft" ? "ring-2 ring-[#0A2047] border-[#0A2047]" : "border-[#E2E8F0]"
          }`}
        >
          <span className="text-[11px] font-semibold text-[#64748B]">Draft Proposals</span>
          <p className="text-xl sm:text-2xl font-bold text-[#172033] mt-1.5">{draftCount}</p>
          <span className="text-[10px] text-[#64748B] font-medium mt-1 block">Saved in workspace</span>
        </div>

        <div
          onClick={() => setProposalFilter("proposed")}
          className={`bg-white border rounded-xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all hover:border-[#D4AF37]/60 ${
            proposalFilter === "proposed" ? "ring-2 ring-amber-500 border-amber-500" : "border-[#E2E8F0]"
          }`}
        >
          <span className="text-[11px] font-semibold text-[#64748B]">Pending Review</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1.5">{pendingCount}</p>
          <span className="text-[10px] text-amber-700 font-medium mt-1 block">Under council review</span>
        </div>

        <div
          onClick={() => setProposalFilter("approved")}
          className={`bg-white border rounded-xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all hover:border-[#D4AF37]/60 ${
            proposalFilter === "approved" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-[#E2E8F0]"
          }`}
        >
          <span className="text-[11px] font-semibold text-[#64748B]">Approved Tracks</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1.5">{approvedCount}</p>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Executive approval</span>
        </div>

        <div
          onClick={() => setProposalFilter("rejected")}
          className={`bg-white border rounded-xl p-4 sm:p-5 shadow-xs cursor-pointer transition-all hover:border-[#D4AF37]/60 ${
            proposalFilter === "rejected" ? "ring-2 ring-rose-500 border-rose-500" : "border-[#E2E8F0]"
          }`}
        >
          <span className="text-[11px] font-semibold text-[#64748B]">Rejected Proposals</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1.5">{rejectedCount}</p>
          <span className="text-[10px] text-rose-700 font-medium mt-1 block">Feedback available</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Assigned Duties</span>
          <p className="text-xl sm:text-2xl font-bold text-[#0A2047] mt-1.5">
            {completedTasksCount}/{tasks.length}
          </p>
          <span className="text-[10px] text-[#0A2047] font-medium mt-1 block">
            {tasks.length > 0 ? `${Math.round((completedTasksCount / tasks.length) * 100)}% completed` : "No duties assigned"}
          </span>
        </div>
      </div>

      {/* Member Action Advisory Banner */}
      {(draftCount > 0 || rejectedCount > 0 || tasks.some((t) => t.status === "todo" || isTaskOverdue(t))) && (
        <div className="bg-gradient-to-r from-[#0A2047]/5 via-[#D4AF37]/5 to-[#0A2047]/5 border border-[#D4AF37]/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#0A2047] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#D4AF37]/30">
              <Clock className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">
                Action Items for Your Workspace
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                {draftCount > 0 && `You have ${draftCount} draft proposal${draftCount > 1 ? "s" : ""} saved. `}
                {rejectedCount > 0 && `Executive feedback is available on ${rejectedCount} rejected proposal${rejectedCount > 1 ? "s" : ""}. `}
                {tasks.some((t) => isTaskOverdue(t)) && `You have overdue committee duties that require attention.`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {draftCount > 0 && (
              <button
                onClick={() => {
                  setProposalFilter("draft");
                  document.getElementById("proposals-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer border border-[#D4AF37]/30"
              >
                View Drafts ({draftCount})
              </button>
            )}
            {rejectedCount > 0 && (
              <button
                onClick={() => {
                  setProposalFilter("rejected");
                  document.getElementById("proposals-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors shadow-xs cursor-pointer border border-rose-200"
              >
                View Feedback ({rejectedCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. "My Proposals" Section with Filters & Search */}
      <div id="proposals-section" className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <span>My Event Proposals</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review your competition track proposals, track review decisions, and view President feedback.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] text-[#172033] placeholder-[#94A3B8] w-full sm:w-48 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(["ALL", "draft", "proposed", "approved", "in_coordination", "rejected"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setProposalFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    proposalFilter === filterKey
                      ? "bg-[#0A2047] text-white shadow-xs"
                      : "bg-[#F0F3F8] text-[#172033] hover:bg-[#E2E8F0]"
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

        <div className="divide-y divide-[#E2E8F0]">
          {filteredProposals.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No proposals found matching the selected filter. Click &ldquo;Create Event Proposal&rdquo; to propose a new track.
            </div>
          ) : (
            filteredProposals.map((item) => {
              const isDraft = item.status === "draft";
              const isPending = item.status === "proposed";
              const isApproved = item.status === "approved" || item.status === "published";
              const isRejected = item.status === "rejected";

              return (
                <div key={item.id} className="p-5 sm:p-6 space-y-3 hover:bg-[#F5F7FA]/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 max-w-3xl flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F3F8] text-[#172033] border border-[#E2E8F0]">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
                          {item.category}
                        </span>
                        <button
                          onClick={() => setSelectedProposal(item)}
                          className="text-sm sm:text-base font-bold text-[#0A2047] hover:underline text-left cursor-pointer"
                        >
                          {item.title}
                        </button>
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">{item.description}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#64748B] pt-1">
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

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 self-start md:self-center">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-md border ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : isPending
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : isRejected
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-[#F0F3F8] text-[#64748B] border-[#E2E8F0]"
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

                      <button
                        onClick={() => setSelectedProposal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F0F3F8] text-[#0A2047] text-xs font-semibold transition-colors cursor-pointer border border-[#E2E8F0] shadow-2xs"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0A2047]" />
                        <span>Details</span>
                      </button>

                      {/* Actions for drafts */}
                      {isDraft && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0F3F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-semibold transition-colors cursor-pointer border border-[#E2E8F0]"
                            title="Edit Draft"
                          >
                            <Edit3 className="w-3 h-3 text-[#64748B]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleSubmitDraft(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                            title="Submit for Council Review"
                          >
                            <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Submit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(item.id)}
                            className="p-1 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0F3F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-semibold transition-colors cursor-pointer border border-[#E2E8F0]"
                          title="Update Proposal Information"
                        >
                          <Edit3 className="w-3 h-3 text-[#64748B]" />
                          <span>Update Info</span>
                        </button>
                      )}

                      {/* Actions for rejected proposals */}
                      {isRejected && (
                        <button
                          onClick={() => handleReviseProposal(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer border border-[#D4AF37]/30"
                          title="Revise Proposal Based on Feedback"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Revise as Draft</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review feedback display */}
                  {isRejected && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Review Decision: Proposal Rejected</span>
                        {item.reviewedAt && (
                          <span className="text-[10px] text-rose-500 font-normal">
                            ({new Date(item.reviewedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-rose-700 pl-5">
                        <strong>Reason / Comments:</strong> {item.rejectionReason || item.presidentRejectionReason || item.vpRejectionReason || item.reviewComment || "No comment provided."}
                      </p>
                    </div>
                  )}

                  {isApproved && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 px-3 text-xs text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px]">
                          <strong>Approved by Council:</strong> Available to Vice President for operational coordination and Admin for publishing.
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
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
              <span>Assigned Committee Duties & Tasks</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Tasks assigned to you by the Vice President or Council. Update progress and mark milestones complete.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20 shrink-0 self-start sm:self-auto">
            {tasks.length} Assigned Tasks
          </span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No tasks currently assigned to your account.
            </div>
          ) : (
            tasks.map((task) => {
              const isDone = task.status === "completed";
              const isBlocked = task.status === "blocked";
              const isInProgress = task.status === "in_progress";
              const overdue = isTaskOverdue(task);

              return (
                <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5F7FA]/60 transition-colors">
                  <div className="space-y-1.5 max-w-2xl flex-1">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, isDone ? "in_progress" : "completed")}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isDone
                            ? "bg-[#0A2047] border-[#0A2047] text-[#D4AF37]"
                            : "border-[#CBD5E1] hover:border-[#0A2047]"
                        }`}
                        title={isDone ? "Mark as In Progress" : "Mark as Completed"}
                      >
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleOpenTaskModal(task)}
                        className={`text-xs sm:text-sm font-bold text-[#172033] hover:text-[#0A2047] hover:underline text-left ${
                          isDone ? "line-through text-[#94A3B8]" : ""
                        }`}
                      >
                        {task.title}
                      </button>

                      {overdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Overdue</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#64748B] pl-6.5 leading-relaxed line-clamp-2">{task.description}</p>
                    )}

                    <div className="pl-6.5 text-[11px] text-[#64748B] flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                      <span>Event: <strong className="text-[#172033] font-semibold">{task.eventTitle}</strong></span>
                      <span className={overdue ? "text-rose-600 font-bold" : ""}>
                        Due: <strong className="font-semibold">{task.dueDate}</strong>
                      </span>
                      <span>
                        Priority:{" "}
                        <strong
                          className={
                            task.priority === "high"
                              ? "text-rose-600 uppercase font-semibold"
                              : "capitalize text-[#172033] font-semibold"
                          }
                        >
                          {task.priority}
                        </strong>
                      </span>
                      {task.assignedBy && <span>Assigned by: {task.assignedBy}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center pl-6.5 sm:pl-0 shrink-0">
                    <button
                      onClick={() => handleOpenTaskModal(task)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#0A2047] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      Details
                    </button>

                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                        isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : isBlocked
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : isInProgress
                          ? "bg-[#0A2047]/10 text-[#0A2047] border-[#0A2047]/20"
                          : "bg-[#F0F3F8] text-[#172033] border-[#E2E8F0]"
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

      {/* Proposal Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in">
            <div className="p-5 sm:p-6 bg-[#0A2047] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
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
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CodeCraft: Algorithmic Duel"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Competition Track / Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventRecord["category"])}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
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
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Overview of the event format, problem statement summary, and challenge scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Objectives & Learning Outcomes *
                </label>
                <textarea
                  rows={2}
                  placeholder="Key student learning outcomes, industry skills evaluated, and competition goals..."
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Proposed Date & Time *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 14 Oct 2026, 10:00 AM"
                    value={proposedDateTime}
                    onChange={(e) => setProposedDateTime(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Proposed Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Block A, Lab 301"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Delivery Mode
                  </label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value as "In-Person" | "Virtual" | "Hybrid")}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Expected Participants
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={expectedParticipants}
                    onChange={(e) => setExpectedParticipants(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={teamSizeMin}
                    onChange={(e) => setTeamSizeMin(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={teamSizeMax}
                    onChange={(e) => setTeamSizeMax(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Required Resources (Labs, hardware, cloud credits, projectors)
                </label>
                <textarea
                  rows={2}
                  placeholder="List specific hardware kits, power boards, projectors, audio gear, or computing prerequisites..."
                  value={requiredResources}
                  onChange={(e) => setRequiredResources(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Supporting Documents (Optional URL / Rulebook draft reference)
                </label>
                <input
                  type="text"
                  placeholder="https://... or /docs/rulebook-draft.pdf"
                  value={supportingDocsUrl}
                  onChange={(e) => setSupportingDocsUrl(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#F5F7FA] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-semibold hover:bg-[#F0F3F8] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveProposal("draft")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F0F3F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-bold transition-colors cursor-pointer border border-[#E2E8F0] disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveProposal("proposed")}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{submitting ? "Submitting..." : "Submit to Council"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in">
            <div className="p-5 sm:p-6 bg-[#0A2047] text-white flex items-start justify-between border-b border-[#D4AF37]/30">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/90 border border-white/20">
                    {selectedProposal.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37] text-[#0A2047]">
                    {selectedProposal.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                    {selectedProposal.status}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold leading-tight">{selectedProposal.title}</h2>
                <p className="text-xs text-white/80 mt-1">
                  Proposed by {selectedProposal.proposedBy} • Created on{" "}
                  {new Date(selectedProposal.createdAt).toLocaleDateString()}
                  {selectedProposal.submittedAt && ` • Submitted on ${new Date(selectedProposal.submittedAt).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-white/70 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Rejection Alert if rejected */}
              {selectedProposal.status === "rejected" && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Review Decision: Proposal Rejected</span>
                  </div>
                  <p className="text-xs text-rose-800 pl-6">
                    <strong>Rejection Rationale:</strong>{" "}
                    {selectedProposal.rejectionReason ||
                      selectedProposal.presidentRejectionReason ||
                      selectedProposal.vpRejectionReason ||
                      selectedProposal.reviewComment ||
                      "No specific reason provided."}
                  </p>
                  {selectedProposal.reviewedBy && (
                    <p className="text-[11px] text-rose-600 pl-6">
                      Reviewed by {selectedProposal.reviewedBy}{" "}
                      {selectedProposal.reviewedAt && `on ${new Date(selectedProposal.reviewedAt).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              )}

              {/* Lifecycle Stepper */}
              <div>
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                  Proposal Review & Approval Workflow
                </h3>
                <EventLifecycleTimeline event={selectedProposal} />
              </div>

              {/* Proposal Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F5F7FA] p-4 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Venue & Mode</span>
                  <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                    {selectedProposal.venuePlaceholder || "Campus"} ({selectedProposal.deliveryMode || "In-Person"})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Proposed Schedule</span>
                  <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                    {selectedProposal.proposedDateTime || selectedProposal.datePlaceholder || "To be confirmed"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Participation Scope</span>
                  <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                    Expected: ~{selectedProposal.expectedParticipants || 50} Students • Team Size: {selectedProposal.teamSizeMin}–{selectedProposal.teamSizeMax}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Supporting Reference</span>
                  {selectedProposal.supportingDocsUrl ? (
                    <a
                      href={selectedProposal.supportingDocsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#0A2047] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>View Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#64748B] mt-0.5 block">No URL attached</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Competition Track Description
                </h3>
                <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
                  {selectedProposal.description}
                </p>
              </div>

              {/* Objectives */}
              {selectedProposal.objectives && (
                <div>
                  <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Objectives & Student Learning Outcomes
                  </h3>
                  <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
                    {selectedProposal.objectives}
                  </p>
                </div>
              )}

              {/* Required Resources */}
              {selectedProposal.requiredResources && (
                <div>
                  <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Required Equipment, Hardware & Facilities
                  </h3>
                  <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-lg border border-[#E2E8F0]">
                    {selectedProposal.requiredResources}
                  </p>
                </div>
              )}

              {/* Review Decision Audit Trail */}
              {selectedProposal.approvalHistory && selectedProposal.approvalHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                    Review History & Council Audit Trail
                  </h3>
                  <div className="space-y-2 border border-[#E2E8F0] rounded-xl overflow-hidden divide-y divide-[#E2E8F0]">
                    {selectedProposal.approvalHistory.map((hist, idx) => (
                      <div key={hist.id || idx} className="p-3 text-xs bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0A2047]">{hist.stage} Review:</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                hist.decision === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : hist.decision === "rejected"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-[#0A2047]/10 text-[#0A2047]"
                              }`}
                            >
                              {hist.decision}
                            </span>
                            <span className="text-[#64748B] text-[11px] font-medium">by {hist.actorName || hist.actorRole}</span>
                          </div>
                          {hist.comment && <p className="text-[11px] text-[#64748B] pl-2">{hist.comment}</p>}
                          {hist.rejectionReason && (
                            <p className="text-[11px] text-rose-700 pl-2 font-semibold">Reason: {hist.rejectionReason}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-[#64748B] shrink-0 font-mono">
                          {new Date(hist.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 bg-[#F5F7FA] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-semibold hover:bg-[#F0F3F8] transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedProposal.status === "draft" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedProposal;
                        setSelectedProposal(null);
                        handleOpenEditModal(target);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0F3F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-semibold transition-colors cursor-pointer border border-[#E2E8F0]"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Edit Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitDraft(selectedProposal.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Submit Proposal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(selectedProposal.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                {selectedProposal.status === "rejected" && (
                  <button
                    type="button"
                    onClick={() => handleReviseProposal(selectedProposal)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Create Revised Draft</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in">
            <div className="p-5 sm:p-6 bg-[#0A2047] text-white flex items-start justify-between border-b border-[#D4AF37]/30">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/90 border border-white/20">
                    {selectedTask.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedTask.priority === "high"
                        ? "bg-rose-500 text-white"
                        : "bg-[#D4AF37] text-[#0A2047]"
                    }`}
                  >
                    {selectedTask.priority} Priority
                  </span>
                  {isTaskOverdue(selectedTask) && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Overdue</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold leading-tight">{selectedTask.title}</h2>
                <p className="text-xs text-white/80 mt-1">
                  Event: {selectedTask.eventTitle} • Assigned by {selectedTask.assignedBy || "Council"}
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-white/70 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Overdue Warning Alert */}
              {isTaskOverdue(selectedTask) && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Deadline Passed:</strong> This duty was scheduled for completion by{" "}
                    <strong>{selectedTask.dueDate}</strong>. Please update your progress status.
                  </span>
                </div>
              )}

              {/* Duty Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F5F7FA] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Current Status</span>
                  <span className="text-xs font-bold text-[#172033] capitalize mt-0.5 block">
                    {selectedTask.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Target Deadline</span>
                  <span className="text-xs font-bold text-[#172033] mt-0.5 block">{selectedTask.dueDate}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block">Completed At</span>
                  <span className="text-xs text-[#172033] mt-0.5 block">
                    {selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleDateString() : "Not yet"}
                  </span>
                </div>
              </div>

              {/* Task Description */}
              <div>
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  Task Instructions & Description
                </h3>
                <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-[#E2E8F0]">
                  {selectedTask.description || "No additional instructions provided."}
                </p>
              </div>

              {/* Quick Status Buttons */}
              <div>
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                  Update Progress Status
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["todo", "in_progress", "blocked", "completed"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateTaskStatus(selectedTask.id, st)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                        selectedTask.status === st
                          ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs"
                          : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F0F3F8]"
                      }`}
                    >
                      {st === "todo"
                        ? "Not Started"
                        : st === "in_progress"
                        ? "In Progress"
                        : st === "blocked"
                        ? "Blocked"
                        : "Completed"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Member Personal Notes Input */}
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">
                  My Duty Progress Notes / Updates
                </label>
                <textarea
                  rows={3}
                  placeholder="Record your personal coordination notes, milestones reached, or blockers encountered..."
                  value={taskNotesInput}
                  onChange={(e) => setTaskNotesInput(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white transition-colors"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    disabled={savingTaskNotes}
                    onClick={() => handleSaveTaskNotes(selectedTask.id, taskNotesInput)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{savingTaskNotes ? "Saving..." : "Save Progress Notes"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F5F7FA] border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-semibold hover:bg-[#F0F3F8] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {isNotifDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl w-full max-w-md h-full max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-right">
            <div className="p-4 bg-[#0A2047] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#D4AF37]" />
                <h2 className="text-sm sm:text-base font-bold">Council Notifications</h2>
                {unreadNotifCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#D4AF37] text-[#0A2047] text-[10px] font-bold">
                    {unreadNotifCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadNotifCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[11px] text-white/80 hover:text-white underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsNotifDrawerOpen(false)}
                  className="text-white/70 hover:text-white text-lg font-bold px-1.5 py-0.5 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] p-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No notifications recorded for your council account.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-[#F0F3F8] transition-colors cursor-pointer flex items-start gap-3 rounded-lg ${
                      !notif.read ? "bg-[#0A2047]/5 font-semibold" : ""
                    }`}
                  >
                    <div className="mt-0.5">
                      {notif.type === "approval" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : notif.type === "rejection" ? (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : notif.type === "task" ? (
                        <CheckSquare className="w-4 h-4 text-[#0A2047] shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#172033] truncate">{notif.title}</p>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-[#94A3B8]">
                        <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                        <span className="text-[#0A2047] font-semibold flex items-center gap-0.5">
                          <span>Inspect</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#F5F7FA] border-t border-[#E2E8F0] text-center">
              <span className="text-[10px] text-[#64748B]">
                Council notifications refresh live with executive decisions
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
