"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Search,
  Eye,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  ExternalLink,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { RegistrationRecord } from "@/types/admin";
import { RegistrationDetailModal } from "@/components/admin/RegistrationDetailModal";
import { PAYMENT_STATUS_LABELS } from "@/config/admin";

export default function PaymentReviewQueuePage() {
  const [filterTab, setFilterTab] = useState<"pending_verification" | "verified" | "rejected" | "ALL">(
    "pending_verification"
  );
  const [search, setSearch] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedRecord, setSelectedRecord] = useState<RegistrationRecord | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modals for Direct Actions: Quick Verify, Reject with Reason, History Viewer, Proof Viewer
  const [rejectModalRecord, setRejectModalRecord] = useState<RegistrationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  const [verifyModalRecord, setVerifyModalRecord] = useState<RegistrationRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  const [historyModalRecord, setHistoryModalRecord] = useState<RegistrationRecord | null>(null);
  const [proofModalRecord, setProofModalRecord] = useState<RegistrationRecord | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage("");

      const params = new URLSearchParams();
      if (filterTab !== "ALL") params.set("paymentStatus", filterTab);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to load payment review queue.");
        return;
      }

      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error loading payments.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterTab, search]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ignore) {
        await fetchPayments();
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [fetchPayments]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleVerifyDirect = async () => {
    if (!verifyModalRecord) return;
    try {
      setActionSubmitting(true);
      setErrorMessage("");
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: verifyModalRecord.id,
          action: "approve",
          notes: verificationNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to verify payment.");
        return;
      }

      setSuccessMessage(`Payment for ${verifyModalRecord.student_name} verified successfully.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      setVerifyModalRecord(null);
      setVerificationNotes("");
      await fetchPayments();
    } catch {
      setErrorMessage("Network error verifying payment.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRejectDirect = async () => {
    if (!rejectModalRecord) return;
    if (!rejectionReason.trim()) {
      setErrorMessage("A rejection reason is strictly required before rejecting a payment.");
      return;
    }
    try {
      setActionSubmitting(true);
      setErrorMessage("");
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: rejectModalRecord.id,
          action: "reject",
          rejectionReason: rejectionReason.trim(),
          notes: rejectionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to reject payment.");
        return;
      }

      setSuccessMessage(`Payment for ${rejectModalRecord.student_name} has been rejected.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      setRejectModalRecord(null);
      setRejectionReason("");
      setRejectionNotes("");
      await fetchPayments();
    } catch {
      setErrorMessage("Network error submitting rejection.");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#174789] tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#174789]" />
            Financial Payment Verification Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit student UPI transaction proofs against university receiving statements.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#174789] hover:bg-slate-50 border border-slate-300 bg-white shadow-2xs transition-colors self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#174789]" : ""}`} />
          <span>Sync Payments</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="font-bold">&times;</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="font-bold">&times;</button>
        </div>
      )}

      {/* Controls & Filter Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilterTab("pending_verification")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterTab === "pending_verification"
                ? "bg-[#174789] text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilterTab("verified")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterTab === "verified"
                ? "bg-[#174789] text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Verified Payments
          </button>
          <button
            onClick={() => setFilterTab("rejected")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterTab === "rejected"
                ? "bg-[#174789] text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Rejected Payments
          </button>
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterTab === "ALL"
                ? "bg-[#174789] text-white shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Submissions
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll no, or UTR..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#174789] bg-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Review Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
            Loading payment proofs from secure storage...
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Records in this Queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {filterTab === "pending_verification"
                ? "All submitted payments have been verified or no new submissions exist."
                : "No registrations match the selected status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Registration ID</th>
                  <th className="py-3 px-4 font-bold">Student Name</th>
                  <th className="py-3 px-4 font-bold">Event</th>
                  <th className="py-3 px-4 font-bold">Submitted Amount</th>
                  <th className="py-3 px-4 font-bold">UTR / Reference</th>
                  <th className="py-3 px-4 font-bold text-center">Payment Proof</th>
                  <th className="py-3 px-4 font-bold">Submission Time</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => {
                  const paymentMeta = PAYMENT_STATUS_LABELS[reg.payment_status] || {
                    label: reg.payment_status,
                    variant: "neutral",
                  };
                  const eventName = reg.event_title || reg.program || "AVISHKAR Main Fest";

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Registration ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {reg.registration_number || reg.id}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="font-bold text-slate-900">{reg.student_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {reg.student_id}
                        </div>
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-4 text-slate-700 min-w-[140px]">
                        <span className="font-medium truncate max-w-[180px] block" title={eventName}>
                          {eventName}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {reg.school}
                        </span>
                      </td>

                      {/* Submitted Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        ₹{reg.fee_amount !== null && reg.fee_amount !== undefined ? reg.fee_amount : 500}
                      </td>

                      {/* UTR with copy */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {reg.transaction_id || "NOT PROVIDED"}
                          </code>
                          {reg.transaction_id && (
                            <button
                              onClick={() => copyToClipboard(reg.transaction_id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="Copy UTR Reference"
                            >
                              {copiedUtr === reg.transaction_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Payment Proof Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {reg.receipt_file_path ? (
                          <button
                            onClick={() => setProofModalRecord(reg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="View uploaded proof securely"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No file</span>
                        )}
                      </td>

                      {/* Submission Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        <div>{new Date(reg.created_at || reg.payment_date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(reg.created_at || reg.payment_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            paymentMeta.variant === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : paymentMeta.variant === "danger"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {paymentMeta.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Verify Action */}
                          {reg.payment_status !== "verified" && (
                            <button
                              onClick={() => {
                                setVerifyModalRecord(reg);
                                setVerificationNotes("");
                              }}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                              title="Verify payment against bank statement"
                            >
                              Verify
                            </button>
                          )}

                          {/* Reject Action */}
                          {reg.payment_status !== "rejected" && (
                            <button
                              onClick={() => {
                                setRejectModalRecord(reg);
                                setRejectionReason("");
                                setRejectionNotes("");
                              }}
                              className="px-2.5 py-1 rounded-md border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                              title="Reject payment (requires reason)"
                            >
                              Reject
                            </button>
                          )}

                          {/* View History Action */}
                          <button
                            onClick={() => setHistoryModalRecord(reg)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="View verification decision history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Review Modal */}
                          <button
                            onClick={() => setSelectedRecord(reg)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-[#174789] hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="Open full student profile & audit"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
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

      {/* Verify Payment Modal */}
      {verifyModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Verify Student Payment</h3>
                <p className="text-xs text-slate-500">
                  Confirm UTR match with university receiving bank account.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>Student: <span className="font-bold text-slate-900">{verifyModalRecord.student_name}</span></div>
              <div>Roll No: <span className="font-mono font-bold text-slate-800">{verifyModalRecord.student_id}</span></div>
              <div>UTR Reference: <code className="font-bold text-slate-900">{verifyModalRecord.transaction_id}</code></div>
              <div>Amount: <span className="font-bold text-emerald-700">₹{verifyModalRecord.fee_amount ?? 500}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Auditor Reconciliation Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g., Verified against HDFC merchant settlement batch 104..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#174789] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setVerifyModalRecord(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyDirect}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionSubmitting ? "Verifying..." : "Confirm Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal (MANDATORY REASON REQUIRED) */}
      {rejectModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reject Payment Submission</h3>
                <p className="text-xs text-slate-500">
                  A specific rejection reason is strictly mandatory.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>Student: <span className="font-bold text-slate-900">{rejectModalRecord.student_name}</span></div>
              <div>UTR Reference: <code className="font-bold text-slate-900">{rejectModalRecord.transaction_id}</code></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason * <span className="text-rose-600 font-normal">(Required)</span>
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none mb-2 bg-white"
              >
                <option value="">Select standard rejection rationale...</option>
                <option value="Transaction ID / UTR not found in university bank statement">
                  Transaction ID / UTR not found in bank statement
                </option>
                <option value="Incorrect fee amount submitted">Incorrect fee amount submitted</option>
                <option value="Illegible or blank payment proof screenshot">
                  Illegible or blank payment proof screenshot
                </option>
                <option value="Duplicate transaction reference ID previously claimed">
                  Duplicate transaction reference ID previously claimed
                </option>
                <option value="Payment reversed or failed at payer bank">
                  Payment reversed or failed at payer bank
                </option>
                <option value="Custom Reason">Other (Specify below)</option>
              </select>

              <textarea
                rows={2}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Additional audit guidance or clarification for student..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalRecord(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDirect}
                disabled={actionSubmitting || (!rejectionReason && !rejectionNotes.trim())}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision History Modal */}
      {historyModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#174789]" />
                <h3 className="font-bold text-slate-900 text-base">Payment Verification History</h3>
              </div>
              <button
                onClick={() => setHistoryModalRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>Student: <span className="font-bold text-slate-900">{historyModalRecord.student_name}</span></div>
              <div>Registration Ref: <code className="font-bold text-slate-900">{historyModalRecord.registration_number || historyModalRecord.id}</code></div>
              <div>Current Status: <span className="font-bold capitalize text-[#174789]">{historyModalRecord.payment_status}</span></div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {historyModalRecord.verification_history && historyModalRecord.verification_history.length > 0 ? (
                historyModalRecord.verification_history.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          item.action === "approve"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.action === "approve" ? "Verified & Approved" : "Rejected"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      Auditor: <span className="font-mono text-slate-800">{item.actorEmail}</span>
                    </div>
                    {item.reason && (
                      <div className="text-rose-700 font-medium">Reason: {item.reason}</div>
                    )}
                    {item.notes && <div className="text-slate-600 italic">Notes: {item.notes}</div>}
                  </div>
                ))
              ) : historyModalRecord.verified_at ? (
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        historyModalRecord.payment_status === "verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {historyModalRecord.payment_status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(historyModalRecord.verified_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Auditor: <span className="font-mono text-slate-800">{historyModalRecord.verified_by || "Admin"}</span>
                  </div>
                  {historyModalRecord.admin_review_notes && (
                    <div className="text-slate-700 italic">
                      Review notes: {historyModalRecord.admin_review_notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No prior verification actions recorded for this registration.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setHistoryModalRecord(null)}
                className="px-4 py-2 rounded-lg bg-[#174789] text-white text-xs font-semibold cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {proofModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#174789]" />
                <h3 className="font-bold text-slate-900 text-base">Payment Proof Inspection</h3>
              </div>
              <button
                onClick={() => setProofModalRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">{proofModalRecord.student_name}</span>
                <span className="text-slate-400 font-mono ml-2">UTR: {proofModalRecord.transaction_id}</span>
              </div>
              <a
                href={`/api/admin/receipt?path=${encodeURIComponent(proofModalRecord.receipt_file_path)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Open Full File <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative rounded-xl border border-slate-300 bg-slate-900/5 p-4 flex items-center justify-center min-h-[260px] max-h-[460px] overflow-hidden">
              <img
                src={`/api/admin/receipt?path=${encodeURIComponent(proofModalRecord.receipt_file_path)}`}
                alt="Payment Receipt Proof"
                className="max-h-[420px] w-auto max-w-full rounded-lg object-contain shadow-xs bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setProofModalRecord(null)}
                className="px-4 py-2 rounded-lg bg-[#174789] text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Detail Modal */}
      <RegistrationDetailModal
        registration={selectedRecord}
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        onUpdateSuccess={() => {
          setSelectedRecord(null);
          fetchPayments();
        }}
      />
    </div>
  );
}
