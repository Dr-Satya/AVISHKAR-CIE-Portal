"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  Users,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  FileText,
  AlertTriangle,
  Eye,
  MessageSquare,
  Search,
  Filter,
  Check,
} from "lucide-react";
import { AdminUser, EventRecord, MemberRecord, AuditLogRecord } from "@/types/admin";
import { EventLifecycleTimeline } from "@/components/admin/EventLifecycleTimeline";

export default function PresidentPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal decision modal state
  const [activeDecisionModal, setActiveDecisionModal] = useState<{
    event: EventRecord;
    action: "approve" | "reject";
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Proposal detail inspect modal
  const [inspectEvent, setInspectEvent] = useState<EventRecord | null>(null);

  // Queue filter
  const [queueTab, setQueueTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    try {
      // 1. Session check
      const meRes = await fetch("/api/admin/auth/me");
      if (!meRes.ok) {
        router.push("/admin/president/login");
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

      // 3. Load members
      const membersRes = await fetch("/api/admin/members");
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      // 4. Load audit logs
      const auditRes = await fetch("/api/admin/audit-logs");
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.auditLogs || []);
      }
    } catch (err) {
      console.error("Error loading president portal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleOpenDecision = (event: EventRecord, action: "approve" | "reject") => {
    setDecisionError(null);
    setRejectionReason("");
    setApprovalNote("");
    setActiveDecisionModal({ event, action });
  };

  const handleConfirmDecision = async () => {
    if (!activeDecisionModal) return;
    const { event, action } = activeDecisionModal;

    setDecisionError(null);

    // Mandate rejection comment
    if (action === "reject" && !rejectionReason.trim()) {
      setDecisionError("A review comment / rejection reason is strictly required when rejecting a proposal.");
      return;
    }

    try {
      setSubmittingDecision(true);
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          action,
          rejectionReason: rejectionReason.trim(),
          reviewComment: action === "reject" ? rejectionReason.trim() : approvalNote.trim() || "Approved by President Council",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDecisionError(data.error || `Failed to ${action} proposal.`);
        return;
      }

      setFeedbackMessage({
        type: "success",
        text: `Proposal '${event.title}' successfully ${action === "approve" ? "approved" : "rejected"}!`,
      });

      setActiveDecisionModal(null);
      await loadData();
    } catch {
      setDecisionError("Network error while submitting proposal decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-700 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading President Executive Portal...</p>
      </div>
    );
  }

  // Strict Role Check: Only President has access to this portal
  if (user?.role !== "President") {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-sm my-12">
        <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">President Authorization Required</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            This portal is restricted to the Executive President of AVISHKAR 2026. Your current session role is{" "}
            <span className="font-semibold text-slate-800">{user?.role || "Guest"}</span>.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin/president/login"
            className="px-4 py-2 rounded-lg bg-[#174789] hover:bg-[#123668] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Sign in with President Account
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

  // Member proposals that have received Vice President approval and are ready for President review (Workflow A - Step 2)
  const pendingProposals = events.filter(
    (e) =>
      (e.creationSource === "MEMBER_PROPOSAL" || e.creationSource === "council") &&
      e.status === "proposed" &&
      e.vpStatus === "approved"
  );
  const awaitingVpReview = events.filter(
    (e) =>
      (e.creationSource === "MEMBER_PROPOSAL" || e.creationSource === "council") &&
      e.status === "proposed" &&
      (e.vpStatus === "pending" || !e.vpStatus)
  );
  const approvedProposals = events.filter(
    (e) =>
      (e.creationSource === "MEMBER_PROPOSAL" || e.creationSource === "council") &&
      (e.presidentStatus === "approved" || e.status === "approved" || e.status === "published")
  );
  const publishedEvents = events.filter((e) => e.status === "published");
  const rejectedProposals = events.filter(
    (e) =>
      (e.creationSource === "MEMBER_PROPOSAL" || e.creationSource === "council") &&
      (e.presidentStatus === "rejected" || e.status === "rejected")
  );

  const queueItems =
    queueTab === "pending"
      ? pendingProposals
      : queueTab === "approved"
      ? approvedProposals
      : queueTab === "rejected"
      ? rejectedProposals
      : events.filter(
          (e) =>
            (e.creationSource === "MEMBER_PROPOSAL" || e.creationSource === "council") &&
            e.status !== "draft"
        );

  const filteredQueueItems = queueItems.filter((e) => {
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchProposer = e.proposedBy.toLowerCase().includes(q);
      const matchId = e.id.toLowerCase().includes(q);
      return matchTitle || matchProposer || matchId;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2047] flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-700 inline" />
            <span>President Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome, {user?.fullName || "President"}. Executive event proposal approvals, committee oversight, and audit logs.
          </p>
        </div>
      </div>

      {/* Executive Action Banner */}
      {pendingProposals.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Action Required: {pendingProposals.length} Proposal{pendingProposals.length > 1 ? "s" : ""} Awaiting Executive Review
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Council members have submitted competition proposals requiring formal presidential authorization before logistical planning can begin.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setQueueTab("pending");
              document.getElementById("review-queue-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <span>Review Queue ({pendingProposals.length})</span>
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

      {awaitingVpReview.length > 0 && (
        <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Workflow A Pipeline: <strong>{awaitingVpReview.length}</strong> member proposal{awaitingVpReview.length > 1 ? "s are" : " is"} currently undergoing Step 1 (Vice President operational review) and will enter this queue once approved by the Vice President.
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{pendingProposals.length}</p>
          <span className="text-[11px] text-purple-700 font-medium mt-1 block">Awaiting executive decision</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Approved Proposals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{approvedProposals.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">In VP/Admin pipeline</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rejected Proposals</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{rejectedProposals.length}</p>
          <span className="text-[11px] text-rose-700 font-medium mt-1 block">Feedback saved</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Published</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{publishedEvents.length}</p>
          <span className="text-[11px] text-blue-700 font-medium mt-1 block">Live on public portal</span>
        </div>
      </div>

      {/* Decision Modal (Approve / Reject) */}
      {activeDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {activeDecisionModal.action === "approve" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Approve Proposal</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>Reject Proposal</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setActiveDecisionModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Competition Track: <strong className="text-slate-800">{activeDecisionModal.event.title}</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Proposed By: {activeDecisionModal.event.proposedBy}
              </p>
            </div>

            {decisionError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{decisionError}</span>
              </div>
            )}

            {activeDecisionModal.action === "reject" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection * (Mandatory for member feedback)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this proposal is not approved (e.g., overlapping track, insufficient lab space, budget constraints, safety review required)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approval Notes / Committee Directives (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Approved for Main Auditorium. Assign VP Operations for scheduling and sponsor allocation."
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveDecisionModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleConfirmDecision}
                className={`px-5 py-2 rounded-lg text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 ${
                  activeDecisionModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submittingDecision
                  ? "Processing..."
                  : activeDecisionModal.action === "approve"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Proposal Modal */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 animate-in fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {inspectEvent.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">{inspectEvent.title}</h3>
              </div>
              <button
                onClick={() => setInspectEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <strong className="text-slate-900 block mb-0.5">Description:</strong>
                <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {inspectEvent.description}
                </p>
              </div>

              {inspectEvent.objectives && (
                <div>
                  <strong className="text-slate-900 block mb-0.5">Objectives:</strong>
                  <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {inspectEvent.objectives}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Proposed Date</span>
                  <span className="font-semibold text-slate-800">{inspectEvent.proposedDateTime || inspectEvent.datePlaceholder}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Venue & Mode</span>
                  <span className="font-semibold text-slate-800">{inspectEvent.venuePlaceholder} ({inspectEvent.deliveryMode || "In-Person"})</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Participants</span>
                  <span className="font-semibold text-slate-800">~{inspectEvent.expectedParticipants || 50} Students</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Team Sizes</span>
                  <span className="font-semibold text-slate-800">{inspectEvent.teamSizeMin}–{inspectEvent.teamSizeMax} Members</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Submitter</span>
                  <span className="font-semibold text-slate-800 truncate block">{inspectEvent.proposedBy}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Submission Date</span>
                  <span className="font-semibold text-slate-800">
                    {inspectEvent.submittedAt ? new Date(inspectEvent.submittedAt).toLocaleDateString() : "Earlier"}
                  </span>
                </div>
              </div>

              {inspectEvent.requiredResources && (
                <div>
                  <strong className="text-slate-900 block mb-0.5">Required Resources:</strong>
                  <p className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {inspectEvent.requiredResources}
                  </p>
                </div>
              )}

              {inspectEvent.reviewComment && (
                <div>
                  <strong className="text-slate-900 block mb-0.5">Review Decision Comment:</strong>
                  <p className="bg-purple-50 p-2.5 rounded-lg border border-purple-100 text-purple-900">
                    {inspectEvent.reviewComment}
                  </p>
                </div>
              )}

              {/* Event Progress Timeline */}
              <div className="pt-2">
                <EventLifecycleTimeline event={inspectEvent} />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">ID: {inspectEvent.id}</span>
              <div className="flex items-center gap-2">
                {inspectEvent.status === "proposed" && (
                  <>
                    <button
                      onClick={() => {
                        setInspectEvent(null);
                        handleOpenDecision(inspectEvent, "approve");
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Approve Proposal
                    </button>
                    <button
                      onClick={() => {
                        setInspectEvent(null);
                        handleOpenDecision(inspectEvent, "reject");
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setInspectEvent(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Proposal Review Queue */}
      <div id="review-queue-section" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700" />
                <span>Event Proposal Review Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and authorize proposed event tracks submitted by AVISHKAR members.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setQueueTab("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  queueTab === "pending"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Pending ({pendingProposals.length})
              </button>
              <button
                onClick={() => setQueueTab("approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  queueTab === "approved"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Approved ({approvedProposals.length})
              </button>
              <button
                onClick={() => setQueueTab("rejected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  queueTab === "rejected"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Rejected ({rejectedProposals.length})
              </button>
              <button
                onClick={() => setQueueTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  queueTab === "all"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Proposals
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search proposal title, category, or submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-2 px-2.5 rounded-md border border-slate-200 bg-slate-50/50 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="ALL">All Categories</option>
                <option value="Coding">Coding</option>
                <option value="Robotics">Robotics</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Design">Design</option>
                <option value="Gaming">Gaming</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredQueueItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No event proposals match your filter criteria.
            </div>
          ) : (
            filteredQueueItems.map((event) => {
              const isPending = event.status === "proposed";
              const isApproved = event.status === "approved" || event.status === "published";
              const isRejected = event.status === "rejected";

              return (
                <div key={event.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {event.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        {event.category}
                      </span>
                      {event.vpStatus === "approved" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>VP Approved ({event.vpApprovedBy || "Vice President"})</span>
                        </span>
                      )}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{event.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                      <span>Proposed By: <strong className="text-slate-700">{event.proposedBy}</strong></span>
                      <span>Venue: {event.venuePlaceholder}</span>
                      <span>Team Sizes: {event.teamSizeMin}–{event.teamSizeMax} Members</span>
                      {event.submittedAt && (
                        <span>Submitted: {new Date(event.submittedAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Review comment preview if decision was made */}
                    {event.reviewComment && (
                      <div className="pt-1 text-[11px]">
                        <span className="text-slate-500">Executive Decision: </span>
                        <strong className={isRejected ? "text-rose-700" : "text-emerald-700"}>
                          {event.reviewComment}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
                    <button
                      onClick={() => setInspectEvent(event)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      title="Inspect full details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleOpenDecision(event, "approve")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleOpenDecision(event, "reject")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-md border ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isApproved ? "Approved by Council" : "Rejected"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Committee Overview & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Committee Overview */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Organizing Committee Roster</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Council roles, departments, and active leads.</p>
            </div>
            <Link
              href="/admin/members"
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Manage Roster
            </Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className="p-3.5 px-5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900">{m.fullName}</p>
                  <p className="text-[11px] text-slate-500">{m.email} &bull; {m.department}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Read-Only Audit Log Preview */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-700" />
                <span>Executive Governance & Audit Trail</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Restricted immutable log of administrative operations.</p>
            </div>
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-purple-700 hover:underline"
            >
              Full Log
            </Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No audit records recorded yet.</div>
            ) : (
              auditLogs.slice(0, 7).map((log) => (
                <div key={log.id} className="p-3 px-5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Actor: {log.actorEmail} ({log.actorRole}) &bull; Target: {log.targetType}: {log.targetId}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
