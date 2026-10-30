"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  ShieldAlert,
  Crown,
  FileText,
  User,
  Calendar,
  AlertCircle,
  ExternalLink,
  History,
} from "lucide-react";
import { OperationalBlockerRecord, BlockerSeverity, BlockerStatus, EventRecord, MemberRecord, MemberTaskRecord } from "@/types/admin";

interface OperationalBlockerModalProps {
  isOpen: boolean;
  mode: "report" | "resolve" | "escalate" | "view";
  onClose: () => void;
  blocker?: OperationalBlockerRecord | null;
  events: EventRecord[];
  tasks: MemberTaskRecord[];
  members: MemberRecord[];
  onReportBlocker: (data: any) => Promise<void>;
  onResolveBlocker: (blockerId: string, resolutionNotes: string) => Promise<void>;
  onEscalateBlocker: (blockerId: string, escalationReason: string) => Promise<void>;
}

export function OperationalBlockerModal({
  isOpen,
  mode,
  onClose,
  blocker,
  events,
  tasks,
  members,
  onReportBlocker,
  onResolveBlocker,
  onEscalateBlocker,
}: OperationalBlockerModalProps) {
  // Report form state
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [taskId, setTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BlockerSeverity>("high");
  const [operationalImpact, setOperationalImpact] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [resolutionDeadline, setResolutionDeadline] = useState(() =>
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );

  // Resolve form state
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Escalate form state
  const [escalationReason, setEscalationReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const relevantTasks = tasks.filter((t) => !eventId || t.eventId === eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (mode === "report") {
        if (!eventId || !title.trim() || !description.trim() || !operationalImpact.trim()) {
          setErrorMsg("Please fill in event, issue title, description, and operational impact.");
          setSubmitting(false);
          return;
        }

        const selectedEvent = events.find((ev) => ev.id === eventId);
        const selectedTask = tasks.find((t) => t.id === taskId);
        const selectedMember = members.find((m) => m.id === assignedToId);

        await onReportBlocker({
          eventId,
          eventTitle: selectedEvent?.title || "Event",
          taskId: taskId || undefined,
          taskTitle: selectedTask?.title || undefined,
          title: title.trim(),
          description: description.trim(),
          severity,
          operationalImpact: operationalImpact.trim(),
          evidenceUrl: evidenceUrl.trim() || undefined,
          assignedToId: assignedToId || undefined,
          assignedToName: selectedMember?.fullName || undefined,
          assignedToEmail: selectedMember?.email || undefined,
          resolutionDeadline: resolutionDeadline || undefined,
        });
        onClose();
      } else if (mode === "resolve") {
        if (!blocker || !resolutionNotes.trim() || resolutionNotes.trim().length < 5) {
          setErrorMsg("Please provide comprehensive resolution notes (at least 5 characters).");
          setSubmitting(false);
          return;
        }
        await onResolveBlocker(blocker.id, resolutionNotes.trim());
        onClose();
      } else if (mode === "escalate") {
        if (!blocker || !escalationReason.trim() || escalationReason.trim().length < 5) {
          setErrorMsg("Please describe the specific escalation reason and why Presidential intervention is required.");
          setSubmitting(false);
          return;
        }
        await onEscalateBlocker(blocker.id, escalationReason.trim());
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error processing request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Modal Header */}
        <div
          className={`p-5 border-b text-white flex items-center justify-between ${
            mode === "escalate"
              ? "bg-gradient-to-r from-amber-700 to-rose-800 border-rose-900"
              : mode === "resolve"
              ? "bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-950"
              : "bg-gradient-to-r from-[#0A2047] to-[#132E57] border-[#132E57]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {mode === "escalate" ? (
              <Crown className="w-5 h-5 text-[#D4AF37]" />
            ) : mode === "resolve" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === "report" && "Report Operational Blocker & Risk"}
                {mode === "resolve" && "Resolve Operational Blocker"}
                {mode === "escalate" && "Escalate Blocker to President"}
                {mode === "view" && "Operational Blocker Details"}
              </h3>
              <p className="text-xs text-white/80">
                {mode === "report" && "Log an impediment, technical failure, or missing resource that could delay an event."}
                {mode === "resolve" && "Document verified resolution and audit evidence to close this issue."}
                {mode === "escalate" && "Formal executive escalation to President Council for policy or budgetary decision."}
                {mode === "view" && "Audit trail, operational impact, and resolution timeline."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mx-4 mt-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content / Form */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {mode === "report" && (
            <form id="blocker-form" onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Affected Event *</label>
                <select
                  required
                  value={eventId}
                  onChange={(e) => {
                    setEventId(e.target.value);
                    setTaskId("");
                  }}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                >
                  <option value="">Select event...</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Associated Duty / Task (Optional)</label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                >
                  <option value="">-- No specific task linked --</option>
                  {relevantTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.memberName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Delay in Delivery of Polycarbonate Arena Shields"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Severity *</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as BlockerSeverity)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                  >
                    <option value="low">Low (Minor inconvenience)</option>
                    <option value="medium">Medium (Requires attention)</option>
                    <option value="high">High (Threatens event delivery)</option>
                    <option value="critical">Critical (Event stoppage risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Resolution Deadline</label>
                  <input
                    type="date"
                    value={resolutionDeadline}
                    onChange={(e) => setResolutionDeadline(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Issue Description & Root Cause *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain exactly what happened, when it occurred, and current status..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Operational Impact on Event *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="How does this impede event scheduling, attendee safety, or competition rounds?..."
                  value={operationalImpact}
                  onChange={(e) => setOperationalImpact(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Assign Resolver</label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Evidence URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                  />
                </div>
              </div>
            </form>
          )}

          {mode === "resolve" && blocker && (
            <form id="resolve-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <p>
                  <strong>Issue:</strong> {blocker.title}
                </p>
                <p>
                  <strong>Event:</strong> {blocker.eventTitle}
                </p>
                <p>
                  <strong>Operational Impact:</strong> {blocker.operationalImpact}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Resolution Notes & Evidence *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the operational steps taken to resolve this blocker (e.g. vendor replacement panels received and verified by technical marshal)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-emerald-700 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                ✓ Recording a resolution will notify the reporter and record an audit log timestamp.
              </div>
            </form>
          )}

          {mode === "escalate" && blocker && (
            <form id="escalate-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-900">
                <p>
                  <strong>Issue:</strong> {blocker.title}
                </p>
                <p>
                  <strong>Severity:</strong> {blocker.severity.toUpperCase()}
                </p>
                <p>
                  <strong>Event:</strong> {blocker.eventTitle}
                </p>
                <p>
                  <strong>Impact:</strong> {blocker.operationalImpact}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Escalation Reason & Action Requested from President *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this requires Presidential executive authorization (e.g., emergency budget allocation required for alternative venue equipment, or policy exception needed)..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-rose-700 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-700" />
                  Executive Escalation Notice
                </p>
                <p>
                  Escalating this issue sends a priority notification to the President Council and pins this blocker to the executive audit alert list.
                </p>
              </div>
            </form>
          )}

          {mode === "view" && blocker && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    blocker.severity === "critical"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : blocker.severity === "high"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}
                >
                  {blocker.severity} Severity
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    blocker.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : blocker.status === "escalated"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {blocker.status}
                </span>
                <span className="font-mono text-slate-500">{blocker.id}</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{blocker.title}</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">{blocker.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                <p>
                  <strong>Operational Impact:</strong> {blocker.operationalImpact}
                </p>
                <p>
                  <strong>Event Track:</strong> {blocker.eventTitle}
                </p>
                {blocker.taskTitle && (
                  <p>
                    <strong>Linked Duty:</strong> {blocker.taskTitle}
                  </p>
                )}
                <p>
                  <strong>Reported By:</strong> {blocker.reportedBy} ({blocker.reportedByRole}) on{" "}
                  {new Date(blocker.reportedAt).toLocaleString()}
                </p>
                <p>
                  <strong>Assigned Resolver:</strong> {blocker.assignedToName || "Unassigned"}
                </p>
                {blocker.resolutionDeadline && (
                  <p>
                    <strong>Target Deadline:</strong> {blocker.resolutionDeadline}
                  </p>
                )}
                {blocker.evidenceUrl && (
                  <p>
                    <strong>Supporting Evidence:</strong>{" "}
                    <a
                      href={blocker.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline inline-flex items-center gap-1"
                    >
                      View External Link <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                )}
              </div>

              {blocker.escalationReason && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    Escalated to President by {blocker.escalatedBy} on{" "}
                    {blocker.escalatedAt && new Date(blocker.escalatedAt).toLocaleDateString()}
                  </p>
                  <p>{blocker.escalationReason}</p>
                </div>
              )}

              {blocker.resolutionNotes && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved by {blocker.resolvedBy} on{" "}
                    {blocker.resolvedAt && new Date(blocker.resolvedAt).toLocaleDateString()}
                  </p>
                  <p>{blocker.resolutionNotes}</p>
                </div>
              )}

              {/* History trail */}
              {Array.isArray(blocker.history) && blocker.history.length > 0 && (
                <div className="pt-2">
                  <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Audit History
                  </h5>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {blocker.history.map((h, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-100 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-800">{h.action}</span> by {h.actorName} ({h.actorRole}) &bull;{" "}
                        {new Date(h.timestamp).toLocaleString()}
                        {h.notes && <p className="text-slate-500 mt-0.5">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </button>

          {mode === "report" && (
            <button
              type="submit"
              form="blocker-form"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Logging..." : "Log Blocker"}</span>
            </button>
          )}

          {mode === "resolve" && (
            <button
              type="submit"
              form="resolve-form"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? "Resolving..." : "Confirm Resolution"}</span>
            </button>
          )}

          {mode === "escalate" && (
            <button
              type="submit"
              form="escalate-form"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{submitting ? "Escalating..." : "Confirm Escalation to President"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
