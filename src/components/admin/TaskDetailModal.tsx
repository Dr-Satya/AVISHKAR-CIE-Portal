"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  User,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Edit3,
  ExternalLink,
  History,
  Link as LinkIcon,
  UserCheck,
} from "lucide-react";
import { MemberTaskRecord, MemberRecord, TaskStatus, TaskPriority, TaskSubtask } from "@/types/admin";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: MemberTaskRecord | null;
  allTasks: MemberTaskRecord[];
  members: MemberRecord[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onUpdateTask: (taskData: any) => Promise<void>;
  onReassignTask: (taskId: string, newMemberId: string, reason: string) => Promise<void>;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  allTasks,
  members,
  onUpdateStatus,
  onUpdateTask,
  onReassignTask,
}: TaskDetailModalProps) {
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignMemberId, setReassignMemberId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [submittingReassign, setSubmittingReassign] = useState(false);

  // Notes & subtasks editing
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(task?.subtasks || []);
  const [completionNotes, setCompletionNotes] = useState(task?.completionNotes || "");
  const [completionEvidenceUrl, setCompletionEvidenceUrl] = useState(task?.completionEvidenceUrl || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when task changes
  React.useEffect(() => {
    if (task) {
      setSubtasks(task.subtasks || []);
      setCompletionNotes(task.completionNotes || "");
      setCompletionEvidenceUrl(task.completionEvidenceUrl || "");
      setIsReassigning(false);
      setReassignMemberId("");
      setReassignReason("");
      setErrorMsg(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const isDone = task.status === "completed";
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = task.dueDate < todayStr && !isDone;

  // Prerequisite tasks check
  const prereqTasks = allTasks.filter((t) => task.dependsOnTaskIds?.includes(t.id));
  const hasIncompletePrereq = prereqTasks.some((t) => t.status !== "completed");

  const handleToggleSubtask = async (stId: string) => {
    const updated = subtasks.map((st) =>
      st.id === stId
        ? {
            ...st,
            completed: !st.completed,
            completedAt: !st.completed ? new Date().toISOString() : undefined,
          }
        : st
    );
    setSubtasks(updated);
    try {
      await onUpdateTask({ taskId: task.id, subtasks: updated });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to toggle subtask.");
    }
  };

  const handleSaveCompletionDetails = async () => {
    try {
      setSavingNotes(true);
      setErrorMsg(null);
      await onUpdateTask({
        taskId: task.id,
        completionNotes: completionNotes.trim(),
        completionEvidenceUrl: completionEvidenceUrl.trim(),
        subtasks,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save details.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignMemberId || !reassignReason.trim()) {
      setErrorMsg("Please select a new assignee and provide a clear reassignment reason.");
      return;
    }
    try {
      setSubmittingReassign(true);
      setErrorMsg(null);
      await onReassignTask(task.id, reassignMemberId, reassignReason.trim());
      setIsReassigning(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to reassign task.");
    } finally {
      setSubmittingReassign(false);
    }
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#0A2047] text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold border border-white/20">
                {task.eventTitle}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  task.priority === "critical"
                    ? "bg-rose-500 text-white"
                    : task.priority === "high"
                    ? "bg-amber-400 text-slate-900"
                    : "bg-[#D4AF37]/20 text-[#D4AF37]"
                }`}
              >
                {task.priority} Priority
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500 text-white">
                  OVERDUE
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mx-5 mt-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Responsible Assignee</span>
              <div className="font-bold text-slate-900 flex items-center justify-between gap-2 mt-0.5">
                <span>{task.memberName}</span>
                <button
                  onClick={() => setIsReassigning(!isReassigning)}
                  className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
                >
                  {isReassigning ? "Cancel" : "Reassign"}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Deadline</span>
              <span className={`font-bold mt-0.5 block ${isOverdue ? "text-rose-600" : "text-slate-900"}`}>
                {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ""}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Assigned By</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {task.assignedBy || "Operations Directorate"} ({task.assignedByRole || "VP"})
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block mt-0.5 ${
                  isDone
                    ? "bg-emerald-100 text-emerald-800"
                    : task.status === "blocked"
                    ? "bg-rose-100 text-rose-800"
                    : task.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                {task.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>

          {/* Reassignment Form */}
          {isReassigning && (
            <form onSubmit={handleConfirmReassign} className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
              <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-700" />
                <span>Reassign Duty to Another Committee Member</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-950 mb-1">New Assignee *</label>
                  <select
                    required
                    value={reassignMemberId}
                    onChange={(e) => setReassignMemberId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-blue-300 bg-white text-slate-900"
                  >
                    <option value="">Select Member...</option>
                    {members
                      .filter((m) => m.id !== task.memberId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-blue-950 mb-1">Reassignment Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Scheduling conflict, specialized technical expertise needed..."
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-blue-300 bg-white text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReassigning(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign}
                  className="px-4 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-bold disabled:opacity-50"
                >
                  {submittingReassign ? "Reassigning..." : "Confirm Reassignment"}
                </button>
              </div>
            </form>
          )}

          {/* Task Description */}
          {task.description && (
            <div>
              <span className="text-[11px] font-bold text-slate-900 block mb-1">Operational Description</span>
              <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Completion Criteria */}
          {task.completionCriteria && (
            <div>
              <span className="text-[11px] font-bold text-slate-900 block mb-1">Completion Criteria</span>
              <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
                {task.completionCriteria}
              </p>
            </div>
          )}

          {/* Dependencies Section */}
          {prereqTasks.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-700" />
                <span>Prerequisite Task Dependencies ({prereqTasks.length})</span>
              </span>
              <div className="space-y-1.5">
                {prereqTasks.map((prereq) => (
                  <div
                    key={prereq.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{prereq.title}</span>
                      <span className="text-[10px] text-slate-500 block">Assigned to: {prereq.memberName}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        prereq.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {prereq.status === "completed" ? "✓ Completed" : "⏳ Pending"}
                    </span>
                  </div>
                ))}
              </div>
              {hasIncompletePrereq && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                  ⚠️ This task cannot be marked completed until all prerequisite dependencies above are completed.
                </p>
              )}
            </div>
          )}

          {/* Subtasks Checklist */}
          {subtasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-900">
                  Subtasks Checklist ({completedSubtasksCount}/{subtasks.length})
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {Math.round((completedSubtasksCount / subtasks.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${(completedSubtasksCount / subtasks.length) * 100}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <label
                    key={st.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                      st.completed ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st.id)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span className={`text-xs ${st.completed ? "line-through text-slate-500" : "font-semibold text-slate-800"}`}>
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Completion Notes & Evidence Submission */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-900 mb-1">
                Completion Notes / Deliverable Summary
              </label>
              <textarea
                rows={2}
                placeholder="Document completion evidence, deliverable location, or sign-off notes..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-900 focus:ring-2 focus:ring-[#0A2047]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-900 mb-1">
                Supporting Evidence URL (e.g., photo drive, sign-off sheet, report)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={completionEvidenceUrl}
                onChange={(e) => setCompletionEvidenceUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-900 focus:ring-2 focus:ring-[#0A2047]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingNotes}
                onClick={handleSaveCompletionDetails}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {savingNotes ? "Saving Notes..." : "Save Progress Notes"}
              </button>
            </div>
          </div>

          {/* Reassignment History */}
          {Array.isArray(task.reassignmentHistory) && task.reassignmentHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-600" />
                <span>Reassignment Audit Trail</span>
              </h5>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {task.reassignmentHistory.map((rh, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-100 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-900">
                      {rh.fromMemberName} &rarr; {rh.toMemberName}
                    </span>{" "}
                    by {rh.reassignedBy} on {new Date(rh.reassignedAt).toLocaleString()}
                    <p className="text-slate-700 italic mt-0.5">&ldquo;{rh.reason}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          {Array.isArray(task.history) && task.history.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>Activity History</span>
              </h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {task.history.map((h, idx) => (
                  <div key={idx} className="text-[11px] text-slate-600 flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50">
                    <span>
                      <strong className="text-slate-800">{h.action}</strong> ({h.details})
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(h.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-700 text-xs font-semibold hover:bg-slate-100"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {!isDone ? (
              <button
                type="button"
                disabled={hasIncompletePrereq}
                onClick={async () => {
                  try {
                    await onUpdateStatus(task.id, "completed");
                    onClose();
                  } catch (err: unknown) {
                    setErrorMsg(err instanceof Error ? err.message : "Failed to mark task completed.");
                  }
                }}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  hasIncompletePrereq
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                }`}
                title={hasIncompletePrereq ? "Prerequisites must complete first" : "Mark as Completed"}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Task</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await onUpdateStatus(task.id, "in_progress");
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Reopen Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
