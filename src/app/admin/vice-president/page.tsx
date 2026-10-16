"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Layers,
  ArrowRight,
  Loader2,
  Lock,
  ListTodo,
  TrendingUp,
  PlusCircle,
  AlertTriangle,
  CheckSquare,
  Edit3,
  Trash2,
  Filter,
  Search,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { AdminUser, EventRecord, MemberTaskRecord, MemberRecord, TaskStatus } from "@/types/admin";
import { EventLifecycleTimeline } from "@/components/admin/EventLifecycleTimeline";

export default function VicePresidentPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tasks, setTasks] = useState<MemberTaskRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Task creation / editing modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskEventId, setTaskEventId] = useState("");
  const [taskMemberId, setTaskMemberId] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskNotes, setTaskNotes] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Coordination details modal
  const [coordinationModalEvent, setCoordinationModalEvent] = useState<EventRecord | null>(null);
  const [coordMemberId, setCoordMemberId] = useState("");
  const [coordNotes, setCoordNotes] = useState("");
  const [coordBlockers, setCoordBlockers] = useState("");
  const [coordStatus, setCoordStatus] = useState<"awaiting_coordination" | "in_coordination" | "coordination_ready">("in_coordination");
  const [submittingCoord, setSubmittingCoord] = useState(false);
  const [coordError, setCoordError] = useState<string | null>(null);

  // Filters
  const [taskEventFilter, setTaskEventFilter] = useState("ALL");
  const [taskMemberFilter, setTaskMemberFilter] = useState("ALL");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [todayStr, setTodayStr] = useState("");

  const loadData = async () => {
    try {
      // 1. Session check
      const meRes = await fetch("/api/admin/auth/me");
      if (!meRes.ok) {
        router.push("/admin/vice-president/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // 2. Load events
      const eventsRes = await fetch("/api/admin/events");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }

      // 3. Load tasks
      const tasksRes = await fetch("/api/admin/tasks");
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      // 4. Load members
      const membersRes = await fetch("/api/admin/members");
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }
    } catch (err) {
      console.error("Error loading VP portal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
    loadData();
  }, [router]);

  // Approved proposals available for coordination
  const approvedProposals = useMemo(() => {
    return events.filter((e) => e.status === "approved" || e.status === "published");
  }, [events]);

  // Member Proposals awaiting Vice President operational review (Workflow A - Step 1)
  const pendingVpReviewProposals = useMemo(() => {
    return events.filter(
      (e) =>
        (e.creationSource === "MEMBER_PROPOSAL" || e.creationSource === "council") &&
        e.status === "proposed" &&
        (e.vpStatus === "pending" || !e.vpStatus)
    );
  }, [events]);

  const [submittingVpDecision, setSubmittingVpDecision] = useState(false);

  const handleVpDecision = async (eventId: string, action: "vp_approve" | "vp_reject") => {
    let rejectionReason = "";
    if (action === "vp_reject") {
      const reason = window.prompt("Enter review notes or reasons for rejecting/requesting changes:");
      if (!reason || !reason.trim()) {
        setFeedbackMessage({ type: "error", text: "Rejection requires reason or modification notes." });
        return;
      }
      rejectionReason = reason.trim();
    }

    try {
      setSubmittingVpDecision(true);
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action,
          rejectionReason: action === "vp_reject" ? rejectionReason : undefined,
          comment: action === "vp_approve" ? "Approved by Vice President. Forwarded to President review queue." : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to submit decision." });
        return;
      }

      setFeedbackMessage({
        type: "success",
        text:
          action === "vp_approve"
            ? "Proposal approved and successfully forwarded to the President review queue!"
            : "Proposal rejected.",
      });
      await loadData();
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error submitting decision." });
    } finally {
      setSubmittingVpDecision(false);
    }
  };

  const openCreateTaskModal = (preselectedEventId?: string) => {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskEventId(preselectedEventId || (approvedProposals[0]?.id || ""));
    setTaskMemberId(members[0]?.id || "");
    setTaskPriority("medium");
    setTaskDueDate(new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0]);
    setTaskStatus("todo");
    setTaskNotes("");
    setTaskError(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);

    if (!taskTitle.trim() || !taskEventId || !taskMemberId) {
      setTaskError("Please provide task title, associated event, and assigned member.");
      return;
    }

    const selectedEvent = events.find((e) => e.id === taskEventId);
    const selectedMember = members.find((m) => m.id === taskMemberId);

    try {
      setSubmittingTask(true);
      if (editingTaskId) {
        const res = await fetch("/api/admin/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: editingTaskId,
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            priority: taskPriority,
            dueDate: taskDueDate,
            status: taskStatus,
            notes: taskNotes.trim(),
            memberId: taskMemberId,
            memberName: selectedMember?.fullName || "Member",
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setTaskError(data.error || "Failed to update task.");
          return;
        }
        setFeedbackMessage({ type: "success", text: "Task updated successfully." });
      } else {
        const res = await fetch("/api/admin/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: taskEventId,
            eventTitle: selectedEvent?.title || "Event",
            memberId: taskMemberId,
            memberName: selectedMember?.fullName || "Member",
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            priority: taskPriority,
            dueDate: taskDueDate,
            status: taskStatus,
            notes: taskNotes.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setTaskError(data.error || "Failed to assign task.");
          return;
        }
        setFeedbackMessage({ type: "success", text: "Task assigned to committee member." });
      }

      setIsTaskModalOpen(false);
      await loadData();
    } catch {
      setTaskError("Network error saving task.");
    } finally {
      setSubmittingTask(false);
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
        setFeedbackMessage({ type: "error", text: data.error || "Failed to update task." });
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error updating task status." });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to remove this assigned task?")) return;
    try {
      const res = await fetch(`/api/admin/tasks?taskId=${encodeURIComponent(taskId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedbackMessage({ type: "error", text: data.error || "Failed to delete task." });
        return;
      }
      setFeedbackMessage({ type: "success", text: "Task removed." });
      await loadData();
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error deleting task." });
    }
  };

  const handleOpenCoordinationModal = (event: EventRecord) => {
    setCoordinationModalEvent(event);
    setCoordMemberId(event.coordinatorId || "");
    setCoordNotes(event.coordinationNotes || "");
    setCoordBlockers(event.coordinationBlockers || "");
    setCoordStatus(event.coordinationStatus || "in_coordination");
    setCoordError(null);
  };

  const handleSaveCoordination = async () => {
    if (!coordinationModalEvent) return;
    setCoordError(null);

    const coordinator = members.find((m) => m.id === coordMemberId);

    try {
      setSubmittingCoord(true);
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: coordinationModalEvent.id,
          action: "coordinate",
          coordinatorId: coordMemberId || null,
          coordinatorName: coordinator?.fullName || null,
          coordinatorEmail: coordinator?.email || null,
          coordinationNotes: coordNotes.trim(),
          coordinationBlockers: coordBlockers.trim(),
          coordinationStatus: coordStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCoordError(data.error || "Failed to save coordination details.");
        return;
      }

      setFeedbackMessage({ type: "success", text: "Coordination details updated." });
      setCoordinationModalEvent(null);
      await loadData();
    } catch {
      setCoordError("Network error updating coordination.");
    } finally {
      setSubmittingCoord(false);
    }
  };

  // Blocked and overdue checks
  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const overdueTasks = tasks.filter((t) => todayStr && t.dueDate < todayStr && t.status !== "completed");
  const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress" || t.status === "blocked");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const awaitingCoordCount = approvedProposals.filter((p) => !p.coordinatorId || p.coordinationStatus === "awaiting_coordination").length;

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskEventFilter !== "ALL" && t.eventId !== taskEventFilter) return false;
      if (taskMemberFilter !== "ALL" && t.memberId !== taskMemberFilter) return false;
      if (taskStatusFilter !== "ALL" && t.status !== taskStatusFilter) return false;
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchMember = t.memberName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchMember) return false;
      }
      return true;
    });
  }, [tasks, taskEventFilter, taskMemberFilter, taskStatusFilter, taskSearchQuery]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-700 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading Vice President Portal...</p>
      </div>
    );
  }

  // Strict Role Check: VP or President
  const isAuthorized = user?.role === "Vice President" || user?.role === "President";
  if (!isAuthorized) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-sm my-12">
        <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vice President Authorization Required</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            This portal is restricted to the Vice President or President of AVISHKAR 2026. Your current session role is{" "}
            <span className="font-semibold text-slate-800">{user?.role || "Guest"}</span>.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin/vice-president/login"
            className="px-4 py-2 rounded-lg bg-[#174789] hover:bg-[#123668] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Sign in with Vice President Account
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2047] flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-700 inline" />
            <span>Vice President Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, {user?.fullName || "Vice President"}. Operations coordination, proposal pipeline, and committee duties.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openCreateTaskModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Assign Committee Task</span>
          </button>
        </div>
      </div>

      {/* Blocked Tasks Alert Banner */}
      {blockedTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Logistical Blockers Alert: {blockedTasks.length} Task{blockedTasks.length > 1 ? "s" : ""} Reported Blocked
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Committee members have reported blockers or missing resources on assigned duties requiring VP logistical intervention.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setTaskStatusFilter("blocked");
              document.getElementById("task-roster-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <span>Inspect Blocked Duties ({blockedTasks.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Pending VP Review</span>
          <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1.5">{pendingVpReviewProposals.length}</p>
          <span className="text-[10px] text-purple-700 font-medium mt-1 block">Workflow A proposals</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Awaiting Coordination</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1.5">{awaitingCoordCount}</p>
          <span className="text-[10px] text-amber-700 font-medium mt-1 block">President-approved</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Active Competitions</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1.5">{approvedProposals.length}</p>
          <span className="text-[10px] text-blue-700 font-medium mt-1 block">In operations scope</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Pending Tasks</span>
          <p className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1.5">{pendingTasks.length}</p>
          <span className="text-[10px] text-indigo-700 font-medium mt-1 block">In-flight duties</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Overdue Deliverables</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1.5">{overdueTasks.length}</p>
          <span className="text-[10px] text-rose-700 font-medium mt-1 block">Past due date</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500">Completed Tasks</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1.5">{completedTasks.length}</p>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Verified deliverables</span>
        </div>
      </div>

      {/* Task Creation / Edit Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-600" />
                <span>{editingTaskId ? "Edit Committee Task" : "Assign New Committee Task"}</span>
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {taskError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Set up LAN switches and cabling in Arena"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Event Track *
                </label>
                <select
                  value={taskEventId}
                  onChange={(e) => setTaskEventId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Approved Event Track...</option>
                  {approvedProposals.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignee (Council Member) *
                </label>
                <select
                  value={taskMemberId}
                  onChange={(e) => setTaskMemberId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Committee Member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.role}) - {m.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Operational Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements, deliverables, location, or coordinator contact..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 bg-white"
                  >
                    <option value="todo">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingTask ? "Saving..." : editingTaskId ? "Update Task" : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proposal Coordination Details Modal */}
      {coordinationModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Proposal Coordination Settings</span>
              </h3>
              <button
                onClick={() => setCoordinationModalEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Event: <strong className="text-slate-800">{coordinationModalEvent.title}</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Proposed By: {coordinationModalEvent.proposedBy}
              </p>
            </div>

            {coordError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{coordError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Lead Coordinator
                </label>
                <select
                  value={coordMemberId}
                  onChange={(e) => setCoordMemberId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- No Coordinator Assigned --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.role}) - {m.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coordination Status
                </label>
                <select
                  value={coordStatus}
                  onChange={(e) => setCoordStatus(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="awaiting_coordination">Awaiting Coordination</option>
                  <option value="in_coordination">In Active Coordination</option>
                  <option value="coordination_ready">Coordination Ready for Publishing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operations Notes & Logistics
                </label>
                <textarea
                  rows={2}
                  placeholder="Record venue confirmation, audio/video readiness, volunteer counts..."
                  value={coordNotes}
                  onChange={(e) => setCoordNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blockers / Impediments (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Note any delayed materials, power shortages, or missing rulebook items..."
                  value={coordBlockers}
                  onChange={(e) => setCoordBlockers(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Event Progress Timeline */}
              <div className="pt-2">
                <EventLifecycleTimeline event={coordinationModalEvent} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCoordinationModalEvent(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingCoord}
                onClick={handleSaveCoordination}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingCoord ? "Saving..." : "Save Coordination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 0. Member Proposal Review Queue (Workflow A - Step 1: VP Approval) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-700" />
                <span>Member Proposal Review Queue</span>
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                Workflow A &bull; Step 1
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review event proposals submitted by AVISHKAR members. Approvals immediately route to the President for Step 2 authorization.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 border border-purple-200 shrink-0 self-start sm:self-auto">
            {pendingVpReviewProposals.length} Pending VP Review
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingVpReviewProposals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No member proposals currently awaiting Vice President operational review.
            </div>
          ) : (
            pendingVpReviewProposals.map((item) => (
              <div
                key={item.id}
                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Member Proposal
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                    <span>Proposed By: <strong className="text-slate-800">{item.proposedBy}</strong></span>
                    <span>Team Size: <strong className="text-[#174789]">{item.teamSizeMin}–{item.teamSizeMax} members</strong></span>
                    <span>Venue: <strong className="text-slate-800">{item.venuePlaceholder || "GD Goenka Campus"}</strong></span>
                    <span>Date: <strong className="text-slate-800">{item.datePlaceholder || item.proposedDateTime || "TBD"}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                  <button
                    type="button"
                    onClick={() => handleVpDecision(item.id, "vp_approve")}
                    disabled={submittingVpDecision}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Forward to President</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVpDecision(item.id, "vp_reject")}
                    disabled={submittingVpDecision}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reject / Request Changes</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 1. Proposal Coordination Board (President-Approved Proposals) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-700" />
              <span>Proposal Coordination Board</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              President-approved proposals ready for operational scheduling, coordinator assignments, and tasks.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 self-start sm:self-auto">
            {approvedProposals.length} Approved Proposals
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {approvedProposals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No President-approved proposals currently awaiting coordination.
            </div>
          ) : (
            approvedProposals.map((item) => {
              const eventTasks = tasks.filter((t) => t.eventId === item.id);
              const doneTasks = eventTasks.filter((t) => t.status === "completed");

              return (
                <div key={item.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {item.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                    {/* Readiness Progress Bar */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <div className="w-48 bg-slate-100 rounded h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            eventTasks.length > 0 && doneTasks.length === eventTasks.length
                              ? "bg-teal-500"
                              : doneTasks.length > 0
                              ? "bg-indigo-600"
                              : "bg-slate-300"
                          }`}
                          style={{
                            width: `${
                              eventTasks.length > 0
                                ? Math.round((doneTasks.length / eventTasks.length) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">
                        Readiness:{" "}
                        {eventTasks.length > 0
                          ? Math.round((doneTasks.length / eventTasks.length) * 100)
                          : 0}
                        % ({doneTasks.length}/{eventTasks.length} duties completed)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                      <span>Venue: {item.venuePlaceholder}</span>
                      <span>Target Date: {item.proposedDateTime || item.datePlaceholder}</span>
                      <span>Proposed By: {item.proposedBy}</span>
                      <span>
                        Coordinator:{" "}
                        <strong className="text-slate-800">
                          {item.coordinatorName || "Unassigned"}
                        </strong>
                      </span>
                    </div>

                    {item.coordinationBlockers && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block mt-1">
                        <strong>Blocker:</strong> {item.coordinationBlockers}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 self-start lg:self-center">
                    <div className="text-right sm:text-center px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Task Progress</span>
                      <span className="text-xs font-bold text-slate-800">
                        {doneTasks.length}/{eventTasks.length} Done
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenCoordinationModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Coordination</span>
                    </button>

                    <button
                      onClick={() => openCreateTaskModal(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Committee Activities & Task Coordination */}
      <div id="task-roster-section" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-indigo-700" />
                <span>Committee Duties & Operational Tasks</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign and monitor operational responsibilities across organizing committee leads.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={taskEventFilter}
                onChange={(e) => setTaskEventFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none"
              >
                <option value="ALL">All Event Tracks</option>
                {approvedProposals.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>

              <select
                value={taskMemberFilter}
                onChange={(e) => setTaskMemberFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none"
              >
                <option value="ALL">All Assignees</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="todo">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search duty title, description, or assigned member..."
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No tasks found matching the selected filters. Click &ldquo;Assign Committee Task&rdquo; to add a new task.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === "completed";
              const isBlocked = task.status === "blocked";
              const isOverdue = task.dueDate < todayStr && !isDone;

              return (
                <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, isDone ? "in_progress" : "completed")}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-slate-500"
                        }`}
                        title={isDone ? "Mark as in progress" : "Mark as completed"}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <span
                        className={`text-xs sm:text-sm font-bold text-slate-900 ${
                          isDone ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-600 pl-6">{task.description}</p>
                    )}
                    <div className="pl-6 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Event: <strong className="text-slate-700">{task.eventTitle}</strong></span>
                      <span>Assignee: <strong className="text-slate-700">{task.memberName}</strong></span>
                      <span>Due: <strong className={isOverdue ? "text-rose-600" : "text-slate-700"}>{task.dueDate}</strong></span>
                      <span className="uppercase text-amber-700 font-semibold">{task.priority} Priority</span>
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
                          : task.status === "in_progress"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <option value="todo">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
