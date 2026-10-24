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
  ShieldCheck,
  Bell,
  Check,
  ExternalLink,
  ChevronRight,
  Crown,
  FileText,
  RefreshCw,
  Plus,
  Send,
  Eye,
  Link as LinkIcon,
  X,
} from "lucide-react";
import {
  AdminUser,
  EventRecord,
  MemberTaskRecord,
  MemberRecord,
  TaskStatus,
  TaskPriority,
  EventReadinessSummary,
  EventReadinessItem,
  ReadinessCategory,
  OperationalBlockerRecord,
  BlockerSeverity,
  BlockerStatus,
  NotificationRecord,
} from "@/types/admin";
import { EventLifecycleTimeline } from "@/components/admin/EventLifecycleTimeline";
import { EventReadinessModal } from "@/components/admin/EventReadinessModal";
import { OperationalBlockerModal } from "@/components/admin/OperationalBlockerModal";
import { TaskDetailModal } from "@/components/admin/TaskDetailModal";

export default function VicePresidentPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tasks, setTasks] = useState<MemberTaskRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [readinessSummaries, setReadinessSummaries] = useState<EventReadinessSummary[]>([]);
  const [blockers, setBlockers] = useState<OperationalBlockerRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Task creation / editing modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskEventId, setTaskEventId] = useState("");
  const [taskMemberId, setTaskMemberId] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("17:00");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskCompletionCriteria, setTaskCompletionCriteria] = useState("");
  const [taskSubtasks, setTaskSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const [taskDependsOnTaskIds, setTaskDependsOnTaskIds] = useState<string[]>([]);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Inspect modals
  const [selectedInspectTask, setSelectedInspectTask] = useState<MemberTaskRecord | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);

  // Event Readiness modal
  const [selectedReadinessEvent, setSelectedReadinessEvent] = useState<EventRecord | null>(null);
  const [selectedReadinessSummary, setSelectedReadinessSummary] = useState<EventReadinessSummary | null>(null);
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);

  // Operational Blockers modal
  const [blockerModalMode, setBlockerModalMode] = useState<"report" | "resolve" | "escalate" | "view" | null>(null);
  const [selectedBlocker, setSelectedBlocker] = useState<OperationalBlockerRecord | null>(null);

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
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<"ALL" | TaskPriority>("ALL");
  const [taskDeadlineFilter, setTaskDeadlineFilter] = useState<"ALL" | "overdue" | "today" | "upcoming">("ALL");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  const [blockerStatusFilter, setBlockerStatusFilter] = useState<"ALL" | BlockerStatus>("ALL");
  const [blockerSeverityFilter, setBlockerSeverityFilter] = useState<"ALL" | BlockerSeverity>("ALL");

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [todayStr, setTodayStr] = useState("");

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Session check
      const meRes = await fetch("/api/admin/auth/me");
      if (!meRes.ok) {
        router.push("/admin/vice-president/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // 2. Parallel data fetching
      const [eventsRes, tasksRes, membersRes, readinessRes, blockersRes, notifsRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/tasks"),
        fetch("/api/admin/members"),
        fetch("/api/admin/readiness"),
        fetch("/api/admin/blockers"),
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

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      if (readinessRes.ok) {
        const rdyData = await readinessRes.json();
        setReadinessSummaries(rdyData.summaries || []);
      }

      if (blockersRes.ok) {
        const blkData = await blockersRes.json();
        setBlockers(blkData.blockers || []);
      }

      if (notifsRes.ok) {
        const nData = await notifsRes.json();
        if (nData.success) {
          setNotifications(nData.notifications || []);
          setUnreadNotifCount(nData.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("Error loading VP portal:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
    loadData();
  }, [router]);

  // Approved proposals available for coordination & readiness
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

  // Filtered blockers
  const filteredBlockers = useMemo(() => {
    return blockers.filter((b) => {
      if (blockerStatusFilter !== "ALL" && b.status !== blockerStatusFilter) return false;
      if (blockerSeverityFilter !== "ALL" && b.severity !== blockerSeverityFilter) return false;
      return true;
    });
  }, [blockers, blockerStatusFilter, blockerSeverityFilter]);

  // Critical and active blockers
  const criticalActiveBlockers = useMemo(() => {
    return blockers.filter((b) => (b.severity === "critical" || b.severity === "high") && b.status !== "resolved");
  }, [blockers]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskEventFilter !== "ALL" && t.eventId !== taskEventFilter) return false;
      if (taskMemberFilter !== "ALL" && t.memberId !== taskMemberFilter) return false;
      if (taskStatusFilter !== "ALL" && t.status !== taskStatusFilter) return false;
      if (taskPriorityFilter !== "ALL" && t.priority !== taskPriorityFilter) return false;

      if (taskDeadlineFilter !== "ALL") {
        const isDone = t.status === "completed";
        if (taskDeadlineFilter === "overdue" && (!t.dueDate || t.dueDate >= todayStr || isDone)) return false;
        if (taskDeadlineFilter === "today" && t.dueDate !== todayStr) return false;
        if (taskDeadlineFilter === "upcoming" && (t.dueDate <= todayStr || isDone)) return false;
      }

      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchMember = t.memberName.toLowerCase().includes(q);
        const matchEvent = t.eventTitle?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchMember && !matchEvent) return false;
      }
      return true;
    });
  }, [tasks, taskEventFilter, taskMemberFilter, taskStatusFilter, taskPriorityFilter, taskDeadlineFilter, taskSearchQuery, todayStr]);

  // Operational metrics
  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const overdueTasks = tasks.filter((t) => todayStr && t.dueDate < todayStr && t.status !== "completed");
  const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress" || t.status === "blocked");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const awaitingCoordCount = approvedProposals.filter((p) => !p.coordinatorId || p.coordinationStatus === "awaiting_coordination").length;

  // Average operational readiness %
  const averageReadiness = useMemo(() => {
    if (readinessSummaries.length === 0) return 0;
    const sum = readinessSummaries.reduce((acc, curr) => acc + curr.readinessPercentage, 0);
    return Math.round(sum / readinessSummaries.length);
  }, [readinessSummaries]);

  // Events requiring operational attention (critical blockers, mandatory incomplete, overdue duties)
  const eventsNeedingAttention = useMemo(() => {
    return approvedProposals.filter((ev) => {
      const summary = readinessSummaries.find((s) => s.eventId === ev.id);
      const hasMandatoryIncomplete = summary && summary.mandatoryIncomplete > 0;
      const hasBlockers = blockers.some((b) => b.eventId === ev.id && b.status !== "resolved");
      const hasOverdue = tasks.some((t) => t.eventId === ev.id && t.dueDate < todayStr && t.status !== "completed");
      return hasMandatoryIncomplete || hasBlockers || hasOverdue;
    });
  }, [approvedProposals, readinessSummaries, blockers, tasks, todayStr]);

  // ---------------------------------------------------------------------------
  // HANDLERS: Proposals, Tasks, Readiness, Blockers, Notifications
  // ---------------------------------------------------------------------------

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
            ? "Proposal approved and successfully forwarded to President review queue!"
            : "Proposal rejected.",
      });
      await loadData(true);
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
    setTaskDueTime("17:00");
    setTaskStatus("todo");
    setTaskNotes("");
    setTaskCompletionCriteria("");
    setTaskSubtasks([]);
    setNewSubtaskInput("");
    setTaskDependsOnTaskIds([]);
    setTaskError(null);
    setIsTaskModalOpen(true);
  };

  const handleAddSubtaskToForm = () => {
    if (!newSubtaskInput.trim()) return;
    setTaskSubtasks((prev) => [...prev, newSubtaskInput.trim()]);
    setNewSubtaskInput("");
  };

  const handleRemoveSubtaskFromForm = (idx: number) => {
    setTaskSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);

    if (!taskTitle.trim() || !taskEventId || !taskMemberId) {
      setTaskError("Please provide task title, associated event track, and assigned member.");
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
            dueTime: taskDueTime,
            status: taskStatus,
            notes: taskNotes.trim(),
            completionCriteria: taskCompletionCriteria.trim(),
            memberId: taskMemberId,
            memberName: selectedMember?.fullName || "Member",
            memberEmail: selectedMember?.email,
            dependsOnTaskIds: taskDependsOnTaskIds,
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
            memberEmail: selectedMember?.email,
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            priority: taskPriority,
            dueDate: taskDueDate,
            dueTime: taskDueTime,
            status: taskStatus,
            notes: taskNotes.trim(),
            completionCriteria: taskCompletionCriteria.trim(),
            subtasks: taskSubtasks.map((st, idx) => ({
              id: `st-${Date.now()}-${idx}`,
              title: st,
              completed: false,
            })),
            dependsOnTaskIds: taskDependsOnTaskIds,
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
      await loadData(true);
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
      setFeedbackMessage({ type: "success", text: `Task marked as ${newStatus.replace("_", " ")}.` });
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error updating task status." });
    }
  };

  const handleUpdateTaskDetails = async (taskData: any) => {
    const res = await fetch("/api/admin/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to update task details.");
    }
    setTasks((prev) => prev.map((t) => (t.id === taskData.taskId ? data.task : t)));
    if (selectedInspectTask && selectedInspectTask.id === taskData.taskId) {
      setSelectedInspectTask(data.task);
    }
    setFeedbackMessage({ type: "success", text: "Task details updated." });
  };

  const handleReassignTask = async (taskId: string, newMemberId: string, reason: string) => {
    const chosenMember = members.find((m) => m.id === newMemberId);
    const res = await fetch("/api/admin/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        memberId: newMemberId,
        memberName: chosenMember?.fullName || "Member",
        memberEmail: chosenMember?.email,
        reassignmentReason: reason,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to reassign task.");
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    if (selectedInspectTask && selectedInspectTask.id === taskId) {
      setSelectedInspectTask(data.task);
    }
    setFeedbackMessage({ type: "success", text: `Task reassigned to ${chosenMember?.fullName}.` });
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
      await loadData(true);
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error deleting task." });
    }
  };

  // Readiness Handlers
  const handleOpenReadinessModal = (event: EventRecord) => {
    setSelectedReadinessEvent(event);
    const sum = readinessSummaries.find((s) => s.eventId === event.id) || null;
    setSelectedReadinessSummary(sum);
    setIsReadinessModalOpen(true);
  };

  const handleReadinessStatusChange = async (itemId: string, status: "completed" | "pending" | "blocked", notes?: string) => {
    const res = await fetch("/api/admin/readiness", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status, notes }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to update readiness requirement.");
    }
    setReadinessSummaries((prev) =>
      prev.map((s) => (s.eventId === data.summary.eventId ? data.summary : s))
    );
    setSelectedReadinessSummary(data.summary);
  };

  const handleAddReadinessItem = async (itemData: any) => {
    const res = await fetch("/api/admin/readiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to add readiness requirement.");
    }
    setReadinessSummaries((prev) => {
      const exists = prev.some((s) => s.eventId === data.summary.eventId);
      if (exists) {
        return prev.map((s) => (s.eventId === data.summary.eventId ? data.summary : s));
      }
      return [...prev, data.summary];
    });
    setSelectedReadinessSummary(data.summary);
    setFeedbackMessage({ type: "success", text: "Readiness requirement added." });
  };

  const handleDeleteReadinessItem = async (itemId: string) => {
    const res = await fetch(`/api/admin/readiness?itemId=${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete requirement.");
    }
    setReadinessSummaries((prev) =>
      prev.map((s) => (s.eventId === data.summary.eventId ? data.summary : s))
    );
    setSelectedReadinessSummary(data.summary);
  };

  // Blocker Handlers
  const handleOpenReportBlocker = (presetEventId?: string) => {
    setSelectedBlocker(null);
    setBlockerModalMode("report");
  };

  const handleReportBlocker = async (blockerData: any) => {
    const res = await fetch("/api/admin/blockers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockerData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to report operational blocker.");
    }
    setBlockers((prev) => [data.blocker, ...prev]);
    setFeedbackMessage({ type: "success", text: "Operational blocker logged." });
    await loadData(true);
  };

  const handleResolveBlocker = async (blockerId: string, resolutionNotes: string) => {
    const res = await fetch("/api/admin/blockers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockerId, action: "resolve", resolutionNotes }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to resolve blocker.");
    }
    setBlockers((prev) => prev.map((b) => (b.id === blockerId ? data.blocker : b)));
    setFeedbackMessage({ type: "success", text: "Blocker marked as resolved." });
    await loadData(true);
  };

  const handleEscalateBlocker = async (blockerId: string, escalationReason: string) => {
    const res = await fetch("/api/admin/blockers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockerId, action: "escalate", escalationReason }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to escalate blocker.");
    }
    setBlockers((prev) => prev.map((b) => (b.id === blockerId ? data.blocker : b)));
    setFeedbackMessage({ type: "success", text: "Blocker successfully escalated to President Council." });
    await loadData(true);
  };

  // Coordination Modal Handlers
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
      await loadData(true);
    } catch {
      setCoordError("Network error updating coordination.");
    } finally {
      setSubmittingCoord(false);
    }
  };

  // Notifications
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

  const handleNotificationItemClick = async (notif: NotificationRecord) => {
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
        console.error("Failed to mark item read:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0A2047] animate-spin" />
        <p className="text-xs text-[#64748B] font-medium">Loading Operations Directorate...</p>
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
            This operations portal is restricted to the Vice President or President of AVISHKAR 2026. Your current session role is{" "}
            <span className="font-semibold text-slate-800">{user?.role || "Guest"}</span>.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin/vice-president/login"
            className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs border border-[#D4AF37]/30 transition-colors"
          >
            Sign in with Vice President Account
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2047] flex items-center gap-2">
            <Award className="w-6 h-6 text-[#D4AF37] inline" />
            <span>Vice President Operations Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Welcome, {user?.fullName || "Vice President"}. Operational readiness auditing, advanced task coordination, and blocker resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotifDrawerOpen(true)}
            className="relative p-2.5 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F5F7FA] transition-colors cursor-pointer shadow-xs"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4 text-[#0A2047]" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Report Blocker Button */}
          <button
            onClick={() => handleOpenReportBlocker()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Report Blocker</span>
          </button>

          {/* Assign Task Button */}
          <button
            onClick={() => openCreateTaskModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>Assign Committee Task</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Critical Operational Attention Banner */}
      {eventsNeedingAttention.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Operational Attention Required: {eventsNeedingAttention.length} Event{eventsNeedingAttention.length > 1 ? "s" : ""} Flagged</span>
                {criticalActiveBlockers.length > 0 && (
                  <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                    {criticalActiveBlockers.length} Critical Issue{criticalActiveBlockers.length > 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Mandatory readiness requirements, active blockers, or overdue committee duties require logistical coordination.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                document.getElementById("event-readiness-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <span>Inspect Readiness</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                document.getElementById("blockers-tracker-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <span>Inspect Blockers ({blockers.filter((b) => b.status !== "resolved").length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

      {/* Upgraded KPI Cards (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5 sm:gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B]">Pending VP Review</span>
          <p className="text-xl sm:text-2xl font-bold text-[#0A2047] mt-1.5">{pendingVpReviewProposals.length}</p>
          <span className="text-[10px] text-[#0A2047] font-medium mt-1 block">Workflow A Step 1</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B]">Awaiting Coordination</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1.5">{awaitingCoordCount}</p>
          <span className="text-[10px] text-amber-700 font-medium mt-1 block">President-approved</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B]">Active Competitions</span>
          <p className="text-xl sm:text-2xl font-bold text-[#172033] mt-1.5">{approvedProposals.length}</p>
          <span className="text-[10px] text-[#0A2047] font-medium mt-1 block">In operations scope</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B]">Avg Event Readiness</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1.5">{averageReadiness}%</p>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
            {readinessSummaries.filter((s) => s.isOperationallyReady).length} fully certified
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#64748B]">Pending / Overdue</span>
          <p className="text-xl sm:text-2xl font-bold text-[#0A2047] mt-1.5">
            {pendingTasks.length} <span className="text-xs text-rose-600">({overdueTasks.length} late)</span>
          </p>
          <span className="text-[10px] text-[#64748B] font-medium mt-1 block">In-flight duties</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Operational Blockers</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1.5">
            {blockers.filter((b) => b.status !== "resolved").length}{" "}
            <span className="text-xs text-purple-700">
              ({blockers.filter((b) => b.status === "escalated").length} esc)
            </span>
          </p>
          <span className="text-[10px] text-rose-700 font-medium mt-1 block">
            {criticalActiveBlockers.length} critical risks
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. EVENT READINESS TRACKER SECTION */}
      {/* -------------------------------------------------------------------- */}
      <div id="event-readiness-section" className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A2047]/5">
          <div>
            <h2 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <span>Event Readiness Tracker</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Event-level operational readiness checklists. Calculated dynamically from actual inspection records across venue, equipment, safety, and committee criteria.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20 shrink-0 self-start sm:self-auto">
            {approvedProposals.length} Approved Events in Scope
          </span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {approvedProposals.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No President-approved events currently ready for readiness tracking.
            </div>
          ) : (
            approvedProposals.map((item) => {
              const summary = readinessSummaries.find((s) => s.eventId === item.id);
              const percent = summary ? summary.readinessPercentage : 0;
              const isReady = summary?.isOperationallyReady;
              const mandatoryIncomplete = summary ? summary.mandatoryIncomplete : 0;
              const hasBlocked = summary && summary.blockedItems > 0;

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F5F7FA] transition-colors"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F3F8] text-[#172033] font-bold border border-[#E2E8F0]">
                        {item.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
                        {item.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#172033]">{item.title}</h3>

                      {isReady ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Operationally Certified
                        </span>
                      ) : mandatoryIncomplete > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          ⚠️ {mandatoryIncomplete} Mandatory Incomplete
                        </span>
                      ) : null}

                      {hasBlocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          Impediment Reported
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748B] leading-relaxed">{item.description}</p>

                    {/* Progress Bar & Calculated Percentage */}
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <div className="w-48 bg-[#E2E8F0] rounded h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isReady
                              ? "bg-emerald-500"
                              : hasBlocked
                              ? "bg-amber-500"
                              : "bg-[#0A2047]"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#172033]">
                        Readiness: {percent}% ({summary?.completedItems || 0}/{summary?.totalItems || 0} checks fulfilled)
                      </span>
                    </div>

                    {/* Category Breakdown Badges */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64748B] pt-0.5">
                      <span>Venue: <strong className="text-slate-800">{item.venuePlaceholder}</strong></span>
                      <span>Target Date: <strong className="text-slate-800">{item.proposedDateTime || item.datePlaceholder}</strong></span>
                      <span>Coordinator: <strong className="text-[#0A2047]">{item.coordinatorName || "Unassigned"}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                    <button
                      onClick={() => handleOpenReadinessModal(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Audit Checklist ({summary?.totalItems || 0})</span>
                    </button>

                    <button
                      onClick={() => openCreateTaskModal(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F0F3F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-semibold transition-colors cursor-pointer border border-[#E2E8F0]"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#0A2047]" />
                      <span>Add Duty</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. OPERATIONAL BLOCKERS, RISKS & ESCALATION TRACKER */}
      {/* -------------------------------------------------------------------- */}
      <div id="blockers-tracker-section" className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0A2047]/5">
          <div>
            <h2 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Operational Blockers, Risks &amp; Escalation Tracker</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Track issues delaying event execution. Resolve operational bottlenecks or escalate high-impact risks directly to the President.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={blockerStatusFilter}
              onChange={(e) => setBlockerStatusFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
            >
              <option value="ALL">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated to President</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={blockerSeverityFilter}
              onChange={(e) => setBlockerSeverityFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={() => handleOpenReportBlocker()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Blocker</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {filteredBlockers.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No operational blockers found matching current filters.
            </div>
          ) : (
            filteredBlockers.map((b) => {
              const isCritical = b.severity === "critical";
              const isResolved = b.status === "resolved";
              const isEscalated = b.status === "escalated";

              return (
                <div
                  key={b.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    isCritical && !isResolved
                      ? "bg-rose-50/40 hover:bg-rose-50/60"
                      : isEscalated
                      ? "bg-purple-50/30 hover:bg-purple-50/50"
                      : isResolved
                      ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                      : "hover:bg-[#F5F7FA]"
                  }`}
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                          b.severity === "critical"
                            ? "bg-rose-600 text-white animate-pulse"
                            : b.severity === "high"
                            ? "bg-amber-500 text-white"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {b.severity}
                      </span>

                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isEscalated
                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {b.eventTitle}
                      </span>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{b.title}</h4>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>

                    <div className="text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                      <strong>Operational Impact:</strong> {b.operationalImpact}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                      <span>Reported by: <strong className="text-slate-800">{b.reportedBy} ({b.reportedByRole})</strong></span>
                      <span>Assignee: <strong className="text-slate-800">{b.assignedToName || "Unassigned"}</strong></span>
                      {b.resolutionDeadline && (
                        <span>Deadline: <strong className="text-slate-800">{b.resolutionDeadline}</strong></span>
                      )}
                      <span>Logged: <strong>{new Date(b.reportedAt).toLocaleDateString()}</strong></span>
                    </div>

                    {b.escalationReason && (
                      <div className="text-[11px] text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-200">
                        <strong>Escalated to President:</strong> {b.escalationReason} (by {b.escalatedBy})
                      </div>
                    )}

                    {b.resolutionNotes && (
                      <div className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <strong>Resolution Note:</strong> {b.resolutionNotes} (by {b.resolvedBy})
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                    <button
                      onClick={() => {
                        setSelectedBlocker(b);
                        setBlockerModalMode("view");
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Trail</span>
                    </button>

                    {!isResolved && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBlocker(b);
                            setBlockerModalMode("resolve");
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>

                        {!isEscalated && (
                          <button
                            onClick={() => {
                              setSelectedBlocker(b);
                              setBlockerModalMode("escalate");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                            title="Escalate to President for executive intervention"
                          >
                            <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Escalate</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. COMMITTEE DUTIES & ADVANCED TASK MANAGEMENT */}
      {/* -------------------------------------------------------------------- */}
      <div id="task-roster-section" className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#D4AF37]" />
                <span>Committee Duties &amp; Advanced Task Management</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Assign and monitor operational duties with subtasks, task prerequisites, authorized reassignment, and completion notes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={taskEventFilter}
                onChange={(e) => setTaskEventFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
              >
                <option value="ALL">All Event Tracks</option>
                {approvedProposals.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>

              <select
                value={taskMemberFilter}
                onChange={(e) => setTaskMemberFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
              >
                <option value="ALL">All Assignees</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>

              <select
                value={taskPriorityFilter}
                onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
              >
                <option value="ALL">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
              >
                <option value="ALL">All Statuses</option>
                <option value="todo">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={taskDeadlineFilter}
                onChange={(e) => setTaskDeadlineFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
              >
                <option value="ALL">All Deadlines</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search duty title, description, event track, or assigned member..."
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] placeholder:text-[#64748B]/60 focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
            />
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No tasks found matching the selected filters. Click &ldquo;Assign Committee Task&rdquo; to add a new duty.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === "completed";
              const isBlocked = task.status === "blocked";
              const isOverdue = task.dueDate < todayStr && !isDone;
              const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
              const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
              const hasDependencies = Array.isArray(task.dependsOnTaskIds) && task.dependsOnTaskIds.length > 0;

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5F7FA] transition-colors"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, isDone ? "in_progress" : "completed")}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-[#E2E8F0] hover:border-[#0A2047]"
                        }`}
                        title={isDone ? "Reopen task" : "Mark as completed"}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <span
                        onClick={() => {
                          setSelectedInspectTask(task);
                          setIsTaskDetailModalOpen(true);
                        }}
                        className={`text-xs sm:text-sm font-bold cursor-pointer hover:underline ${
                          isDone ? "line-through text-[#64748B]" : "text-[#172033]"
                        }`}
                      >
                        {task.title}
                      </span>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          task.priority === "critical"
                            ? "bg-rose-600 text-white font-extrabold"
                            : task.priority === "high"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.priority}
                      </span>

                      {isOverdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          OVERDUE
                        </span>
                      )}

                      {hasDependencies && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          <span>{task.dependsOnTaskIds?.length} Prereq</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#64748B] pl-6 leading-relaxed">{task.description}</p>
                    )}

                    {hasSubtasks && (
                      <div className="pl-6 pt-1 flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full"
                            style={{
                              width: `${Math.round(
                                (completedSubtasks / (task.subtasks?.length || 1)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {completedSubtasks}/{task.subtasks?.length} Subtasks
                        </span>
                      </div>
                    )}

                    <div className="pl-6 text-[11px] text-[#64748B] flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Event: <strong className="text-[#172033]">{task.eventTitle}</strong></span>
                      <span>Assignee: <strong className="text-[#172033]">{task.memberName}</strong></span>
                      <span>
                        Due: <strong className={isOverdue ? "text-rose-600" : "text-[#172033]"}>
                          {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ""}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center pl-6 sm:pl-0">
                    <button
                      onClick={() => {
                        setSelectedInspectTask(task);
                        setIsTaskDetailModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Inspect
                    </button>

                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                        isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : isBlocked
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : task.status === "in_progress"
                          ? "bg-[#0A2047]/10 text-[#0A2047] border-[#0A2047]/20"
                          : "bg-[#F0F3F8] text-[#172033] border-[#E2E8F0]"
                      }`}
                    >
                      <option value="todo">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

      {/* -------------------------------------------------------------------- */}
      {/* 4. MEMBER PROPOSAL REVIEW QUEUE (Workflow A - Step 1: VP Approval) */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A2047]/5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
                <span>Member Proposal Review Queue</span>
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
                Workflow A &bull; Step 1
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review event proposals submitted by AVISHKAR members. Approvals immediately route to the President for Step 2 executive authorization.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20 shrink-0 self-start sm:self-auto">
            {pendingVpReviewProposals.length} Pending VP Review
          </span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {pendingVpReviewProposals.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No member proposals currently awaiting Vice President operational review.
            </div>
          ) : (
            pendingVpReviewProposals.map((item) => (
              <div
                key={item.id}
                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F5F7FA] transition-colors"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F3F8] text-[#172033] font-bold border border-[#E2E8F0]">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Member Proposal
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#172033]">{item.title}</h3>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#64748B] pt-1">
                    <span>Proposed By: <strong className="text-[#172033]">{item.proposedBy}</strong></span>
                    <span>Team Size: <strong className="text-[#0A2047]">{item.teamSizeMin}–{item.teamSizeMax} members</strong></span>
                    <span>Venue: <strong className="text-[#172033]">{item.venuePlaceholder || "GD Goenka Campus"}</strong></span>
                    <span>Date: <strong className="text-[#172033]">{item.datePlaceholder || item.proposedDateTime || "TBD"}</strong></span>
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

      {/* -------------------------------------------------------------------- */}
      {/* 5. PROPOSAL COORDINATION BOARD (President-Approved Proposals) */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <span>Proposal Coordination Board</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              President-approved proposals ready for operational scheduling, coordinator assignments, and logistics parameter setup.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20 shrink-0 self-start sm:self-auto">
            {approvedProposals.length} Approved Proposals
          </span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {approvedProposals.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No President-approved proposals currently awaiting coordination.
            </div>
          ) : (
            approvedProposals.map((item) => {
              const eventTasks = tasks.filter((t) => t.eventId === item.id);
              const doneTasks = eventTasks.filter((t) => t.status === "completed");

              return (
                <div key={item.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F5F7FA] transition-colors">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F3F8] text-[#172033] border border-[#E2E8F0]">
                        {item.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
                        {item.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#172033]">{item.title}</h3>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{item.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#64748B] pt-1">
                      <span>Venue: {item.venuePlaceholder}</span>
                      <span>Target Date: {item.proposedDateTime || item.datePlaceholder}</span>
                      <span>Proposed By: {item.proposedBy}</span>
                      <span>
                        Coordinator:{" "}
                        <strong className="text-[#172033]">
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
                    <div className="text-right sm:text-center px-3 py-1 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B] block font-medium">Duty Progress</span>
                      <span className="text-xs font-bold text-[#172033]">
                        {doneTasks.length}/{eventTasks.length} Done
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenCoordinationModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F0F3F8] hover:bg-[#E2E8F0] text-[#172033] text-xs font-semibold transition-colors cursor-pointer border border-[#E2E8F0]"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Coordination</span>
                    </button>

                    <button
                      onClick={() => openCreateTaskModal(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* NOTIFICATIONS DRAWER / SIDE OVERLAY */}
      {/* -------------------------------------------------------------------- */}
      {isNotifDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#0A2047] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-bold text-sm sm:text-base text-white">Operations Notifications</h3>
                {unreadNotifCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadNotifCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsNotifDrawerOpen(false)}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {notifications.length} alerts &bull; {unreadNotifCount} unread
              </span>
              {unreadNotifCount > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No notifications recorded.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationItemClick(n)}
                    className={`p-4 transition-colors cursor-pointer ${
                      n.read ? "bg-white hover:bg-slate-50" : "bg-blue-50/50 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsNotifDrawerOpen(false);
                          }}
                          className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#E2E8F0] bg-slate-50 text-right">
              <button
                onClick={() => setIsNotifDrawerOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* UPGRADED TASK CREATION / EDITING MODAL */}
      {/* -------------------------------------------------------------------- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-[#E2E8F0] bg-[#0A2047] text-white flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[#D4AF37]" />
                <span>{editingTaskId ? "Edit Committee Task" : "Assign New Committee Task"}</span>
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {taskError && (
              <div className="p-3 mx-5 mt-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="p-5 overflow-y-auto flex-1 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Set up LAN switches and cabling in Arena"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-[#E2E8F0] bg-white text-[#172033] placeholder:text-[#64748B]/60 focus:outline-none focus:ring-2 focus:ring-[#0A2047] focus:border-[#0A2047]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Associated Event Track *
                  </label>
                  <select
                    value={taskEventId}
                    onChange={(e) => setTaskEventId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] bg-white text-[#172033]"
                  >
                    <option value="">Select Event Track...</option>
                    {approvedProposals.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title} ({e.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Assignee (Council Member) *
                  </label>
                  <select
                    value={taskMemberId}
                    onChange={(e) => setTaskMemberId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] bg-white text-[#172033]"
                  >
                    <option value="">Select Member...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Description / Operational Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements, deliverables, location, or coordinator contact..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033] placeholder:text-[#64748B]/60 focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Completion Criteria
                </label>
                <input
                  type="text"
                  placeholder="e.g., Verified by Technical Marshal, all 120 nodes communicating..."
                  value={taskCompletionCriteria}
                  onChange={(e) => setTaskCompletionCriteria(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs px-2.5 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Due Time</label>
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full text-xs px-2.5 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033]"
                  >
                    <option value="todo">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Subtasks Builder */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Optional Subtasks / Deliverables Checklist
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add step or milestone..."
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtaskToForm();
                      }
                    }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskToForm}
                    className="px-3 py-1.5 rounded-md bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                  >
                    Add Step
                  </button>
                </div>
                {taskSubtasks.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {taskSubtasks.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                        <span>{idx + 1}. {st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtaskFromForm(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Prerequisites / Dependencies */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Task Dependencies (Prerequisites that must complete first)
                </label>
                <div className="max-h-28 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2 space-y-1 bg-slate-50">
                  {tasks
                    .filter((t) => (!taskEventId || t.eventId === taskEventId) && t.id !== editingTaskId)
                    .map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-xs text-slate-800 p-1 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskDependsOnTaskIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTaskDependsOnTaskIds((prev) => [...prev, t.id]);
                            } else {
                              setTaskDependsOnTaskIds((prev) => prev.filter((id) => id !== t.id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-[#0A2047]"
                        />
                        <span className="font-medium truncate">{t.title} ({t.memberName})</span>
                      </label>
                    ))}
                  {tasks.filter((t) => (!taskEventId || t.eventId === taskEventId) && t.id !== editingTaskId).length === 0 && (
                    <span className="text-[11px] text-slate-400 p-1 block">No other tasks available for this event track.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F0F3F8] text-[#172033] text-xs font-semibold hover:bg-[#E2E8F0] border border-[#E2E8F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingTask ? "Saving..." : editingTaskId ? "Update Task" : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PROPOSAL COORDINATION DETAILS MODAL */}
      {/* -------------------------------------------------------------------- */}
      {coordinationModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0A2047] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#D4AF37]" />
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
              <p className="text-xs text-[#64748B]">
                Event: <strong className="text-[#172033]">{coordinationModalEvent.title}</strong>
              </p>
              <p className="text-[11px] text-[#64748B]">
                Proposed By: {coordinationModalEvent.proposedBy}
              </p>
            </div>

            {coordError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{coordError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Assigned Lead Coordinator
                </label>
                <select
                  value={coordMemberId}
                  onChange={(e) => setCoordMemberId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] bg-white text-[#172033]"
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
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Coordination Status
                </label>
                <select
                  value={coordStatus}
                  onChange={(e) => setCoordStatus(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-md border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] bg-white text-[#172033]"
                >
                  <option value="awaiting_coordination">Awaiting Coordination</option>
                  <option value="in_coordination">In Active Coordination</option>
                  <option value="coordination_ready">Coordination Ready for Publishing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Operations Notes &amp; Logistics
                </label>
                <textarea
                  rows={2}
                  placeholder="Record venue confirmation, audio/video readiness, volunteer counts..."
                  value={coordNotes}
                  onChange={(e) => setCoordNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033] placeholder:text-[#64748B]/60 focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Blockers / Impediments (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Note any delayed materials, power shortages, or missing rulebook items..."
                  value={coordBlockers}
                  onChange={(e) => setCoordBlockers(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E2E8F0] bg-white text-[#172033] placeholder:text-[#64748B]/60 focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
                />
              </div>

              <div className="pt-2">
                <EventLifecycleTimeline event={coordinationModalEvent} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setCoordinationModalEvent(null)}
                className="px-4 py-2 rounded-lg bg-[#F0F3F8] text-[#172033] text-xs font-semibold hover:bg-[#E2E8F0] border border-[#E2E8F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingCoord}
                onClick={handleSaveCoordination}
                className="px-5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingCoord ? "Saving..." : "Save Coordination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODALS: Readiness, Blockers, Task Details */}
      {/* -------------------------------------------------------------------- */}
      <EventReadinessModal
        isOpen={isReadinessModalOpen}
        onClose={() => setIsReadinessModalOpen(false)}
        event={selectedReadinessEvent}
        summary={selectedReadinessSummary}
        members={members}
        onItemStatusChange={handleReadinessStatusChange}
        onAddItem={handleAddReadinessItem}
        onDeleteItem={handleDeleteReadinessItem}
      />

      <OperationalBlockerModal
        isOpen={blockerModalMode !== null}
        mode={blockerModalMode || "report"}
        onClose={() => setBlockerModalMode(null)}
        blocker={selectedBlocker}
        events={approvedProposals}
        tasks={tasks}
        members={members}
        onReportBlocker={handleReportBlocker}
        onResolveBlocker={handleResolveBlocker}
        onEscalateBlocker={handleEscalateBlocker}
      />

      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        task={selectedInspectTask}
        allTasks={tasks}
        members={members}
        onUpdateStatus={handleUpdateTaskStatus}
        onUpdateTask={handleUpdateTaskDetails}
        onReassignTask={handleReassignTask}
      />
    </div>
  );
}
