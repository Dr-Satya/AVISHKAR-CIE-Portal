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
  X,
  TrendingUp,
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
  const [allRegistrations, setAllRegistrations] = useState<RegistrationRecord[]>([]);
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

  // Fetch all registrations to compute authentic, live KPI metrics
  const fetchAllForMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/registrations");
      if (res.ok) {
        const data = await res.json();
        setAllRegistrations(data.registrations || []);
      }
    } catch {
      // non-blocking for metrics
    }
  }, []);

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
        await Promise.all([fetchPayments(), fetchAllForMetrics()]);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [fetchPayments, fetchAllForMetrics]);

  // Compute live, authentic metrics from real records
  const metrics = {
    total: allRegistrations.length,
    pending: allRegistrations.filter(
      (r) => r.payment_status === "pending_verification" || !r.payment_status
    ).length,
    verified: allRegistrations.filter((r) => r.payment_status === "verified").length,
    rejected: allRegistrations.filter((r) => r.payment_status === "rejected").length,
    verifiedRevenue: allRegistrations
      .filter((r) => r.payment_status === "verified")
      .reduce((sum, r) => sum + (r.fee_amount !== null && r.fee_amount !== undefined ? r.fee_amount : 500), 0),
  };

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
      await Promise.all([fetchPayments(), fetchAllForMetrics()]);
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
      await Promise.all([fetchPayments(), fetchAllForMetrics()]);
    } catch {
      setErrorMessage("Network error submitting rejection.");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0A2047] tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#D4AF37]" />
            <span>Financial Payment Verification Queue</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Payment Review Queue — Audit student UPI transaction proofs and UTR references against GD Goenka University statements.
          </p>
        </div>

        <button
          onClick={() => {
            fetchPayments();
            fetchAllForMetrics();
          }}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] bg-white shadow-2xs transition-colors self-start sm:self-auto disabled:opacity-50 cursor-pointer"
          title="Sync payments and recompute live statistics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0A2047]" : "text-[#64748B]"}`} />
          <span>Sync Payments</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="p-1 rounded-md text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Authentic KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Review */}
        <button
          onClick={() => setFilterTab("pending_verification")}
          className={`text-left p-4 rounded-xl border bg-white shadow-2xs transition-all cursor-pointer ${
            filterTab === "pending_verification"
              ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-xs"
              : "border-[#E2E8F0] hover:border-[#CBD5E1]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A2047] font-mono tracking-tight">
            {metrics.pending}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>Awaiting auditor verification</span>
          </p>
        </button>

        {/* Card 2: Verified Payments */}
        <button
          onClick={() => setFilterTab("verified")}
          className={`text-left p-4 rounded-xl border bg-white shadow-2xs transition-all cursor-pointer ${
            filterTab === "verified"
              ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-xs"
              : "border-[#E2E8F0] hover:border-[#CBD5E1]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Verified Payments
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A2047] font-mono tracking-tight">
            {metrics.verified}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <span>Reconciled with bank statements</span>
          </p>
        </button>

        {/* Card 3: Rejected Submissions */}
        <button
          onClick={() => setFilterTab("rejected")}
          className={`text-left p-4 rounded-xl border bg-white shadow-2xs transition-all cursor-pointer ${
            filterTab === "rejected"
              ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-xs"
              : "border-[#E2E8F0] hover:border-[#CBD5E1]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Rejected Submissions
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A2047] font-mono tracking-tight">
            {metrics.rejected}
          </div>
          <p className="text-[11px] text-rose-700 font-medium mt-1 flex items-center gap-1">
            <span>Flagged with documented reason</span>
          </p>
        </button>

        {/* Card 4: Total Submissions & Verified Revenue */}
        <button
          onClick={() => setFilterTab("ALL")}
          className={`text-left p-4 rounded-xl border bg-white shadow-2xs transition-all cursor-pointer ${
            filterTab === "ALL"
              ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-xs"
              : "border-[#E2E8F0] hover:border-[#CBD5E1]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Submissions
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#0A2047]/5 border border-[#0A2047]/10 flex items-center justify-center text-[#0A2047]">
              <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A2047] font-mono tracking-tight">
            {metrics.total}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1 font-mono">
            ₹{metrics.verifiedRevenue.toLocaleString()} verified revenue
          </p>
        </button>
      </div>

      {/* Controls & Filter Tabs */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Tabs with Active Navy & Gold Dot */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold p-1 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setFilterTab("pending_verification")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              filterTab === "pending_verification"
                ? "bg-[#0A2047] text-white shadow-2xs font-bold"
                : "text-[#64748B] hover:text-[#0A2047] hover:bg-white"
            }`}
          >
            {filterTab === "pending_verification" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
            )}
            <span>Pending Review</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === "pending_verification"
                  ? "bg-white/20 text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {metrics.pending}
            </span>
          </button>

          <button
            onClick={() => setFilterTab("verified")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              filterTab === "verified"
                ? "bg-[#0A2047] text-white shadow-2xs font-bold"
                : "text-[#64748B] hover:text-[#0A2047] hover:bg-white"
            }`}
          >
            {filterTab === "verified" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
            )}
            <span>Verified</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === "verified"
                  ? "bg-white/20 text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {metrics.verified}
            </span>
          </button>

          <button
            onClick={() => setFilterTab("rejected")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              filterTab === "rejected"
                ? "bg-[#0A2047] text-white shadow-2xs font-bold"
                : "text-[#64748B] hover:text-[#0A2047] hover:bg-white"
            }`}
          >
            {filterTab === "rejected" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
            )}
            <span>Rejected</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === "rejected"
                  ? "bg-white/20 text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {metrics.rejected}
            </span>
          </button>

          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              filterTab === "ALL"
                ? "bg-[#0A2047] text-white shadow-2xs font-bold"
                : "text-[#64748B] hover:text-[#0A2047] hover:bg-white"
            }`}
          >
            {filterTab === "ALL" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
            )}
            <span>All Submissions</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterTab === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {metrics.total}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll no, or UTR..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] bg-white placeholder:text-[#64748B] text-[#172033]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0A2047] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Review Queue Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#64748B] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0A2047] mx-auto" />
            <p className="font-medium">Loading payment verification records from secure storage...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F5F7FA] text-[#64748B] border border-[#E2E8F0] mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="text-sm font-bold text-[#172033]">No Records in this Queue</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1">
              {filterTab === "pending_verification"
                ? "All submitted payments have been verified or no new submissions exist."
                : "No registrations match the selected status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Registration ID</th>
                  <th className="py-3.5 px-4 font-bold">Student Details</th>
                  <th className="py-3.5 px-4 font-bold">Academic Unit</th>
                  <th className="py-3.5 px-4 font-bold">Submitted Fee</th>
                  <th className="py-3.5 px-4 font-bold">Transaction Reference / UTR</th>
                  <th className="py-3.5 px-4 font-bold text-center">Payment Proof</th>
                  <th className="py-3.5 px-4 font-bold">Submission Time</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {registrations.map((reg) => {
                  const paymentMeta = PAYMENT_STATUS_LABELS[reg.payment_status] || {
                    label: reg.payment_status,
                    variant: "neutral",
                  };
                  const eventName = reg.event_title || reg.program || "AVISHKAR Main Fest";

                  return (
                    <tr key={reg.id} className="hover:bg-[#F0F3F8]/60 transition-colors">
                      {/* Registration ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#0A2047] whitespace-nowrap">
                        {reg.registration_number || reg.id}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="font-bold text-[#172033]">{reg.student_name}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">
                          Roll: {reg.student_id}
                        </div>
                      </td>

                      {/* Academic Unit / School */}
                      <td className="py-3.5 px-4 text-[#172033] min-w-[150px]">
                        <span className="font-medium truncate max-w-[190px] block" title={eventName}>
                          {eventName}
                        </span>
                        <span className="text-[11px] text-[#64748B] block truncate">
                          {reg.school}
                        </span>
                      </td>

                      {/* Submitted Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-[#0A2047]">
                        ₹{reg.fee_amount !== null && reg.fee_amount !== undefined ? reg.fee_amount : 500}
                      </td>

                      {/* UTR with copy */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[11px] font-mono font-bold text-[#172033] bg-[#F5F7FA] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                            {reg.transaction_id || "NOT PROVIDED"}
                          </code>
                          {reg.transaction_id && (
                            <button
                              onClick={() => copyToClipboard(reg.transaction_id)}
                              className="p-1 text-[#64748B] hover:text-[#0A2047] rounded-md transition-colors cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F0F3F8] text-[#0A2047] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                            title="View uploaded payment receipt"
                          >
                            <Eye className="w-3 h-3 text-[#D4AF37]" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#64748B] italic">No receipt</span>
                        )}
                      </td>

                      {/* Submission Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#64748B] text-[11px]">
                        <div className="font-medium text-[#172033]">
                          {new Date(reg.created_at || reg.payment_date).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {new Date(reg.created_at || reg.payment_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            paymentMeta.variant === "success"
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                              : paymentMeta.variant === "danger"
                              ? "bg-rose-50 border border-rose-200 text-rose-800"
                              : "bg-amber-50 border border-amber-200 text-amber-800"
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
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
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
                              className="px-2.5 py-1 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                              title="Reject payment (requires reason)"
                            >
                              Reject
                            </button>
                          )}

                          {/* View History Action */}
                          <button
                            onClick={() => setHistoryModalRecord(reg)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] transition-colors cursor-pointer"
                            title="Audit history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Review Modal */}
                          <button
                            onClick={() => setSelectedRecord(reg)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] transition-colors cursor-pointer"
                            title="Open full student profile"
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
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A2047] text-base">Verify Student Payment</h3>
                <p className="text-xs text-[#64748B]">
                  Confirm UTR match with university receiving account.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Student:</span>
                <span className="font-bold text-[#172033]">{verifyModalRecord.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Roll No / Student ID:</span>
                <span className="font-mono font-bold text-[#172033]">{verifyModalRecord.student_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">UTR Reference:</span>
                <code className="font-mono font-bold text-[#0A2047] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {verifyModalRecord.transaction_id}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Fee Amount:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{verifyModalRecord.fee_amount ?? 500}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Auditor Reconciliation Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g., Verified against HDFC merchant settlement batch 104..."
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0A2047] focus:outline-none text-[#172033]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setVerifyModalRecord(null)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F0F3F8] text-xs font-semibold text-[#172033] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyDirect}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionSubmitting ? "Verifying..." : "Confirm Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal (MANDATORY REASON REQUIRED) */}
      {rejectModalRecord && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A2047] text-base">Reject Payment Submission</h3>
                <p className="text-xs text-[#64748B]">
                  A specific rejection reason is strictly mandatory.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Student:</span>
                <span className="font-bold text-[#172033]">{rejectModalRecord.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">UTR Reference:</span>
                <code className="font-mono font-bold text-[#0A2047] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {rejectModalRecord.transaction_id}
                </code>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Rejection Reason * <span className="text-rose-600 font-normal">(Required)</span>
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0A2047] focus:outline-none mb-2 bg-white text-[#172033]"
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
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0A2047] focus:outline-none text-[#172033]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setRejectModalRecord(null)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F0F3F8] text-xs font-semibold text-[#172033] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDirect}
                disabled={actionSubmitting || (!rejectionReason && !rejectionNotes.trim())}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision History Modal */}
      {historyModalRecord && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0A2047]" />
                <h3 className="font-bold text-[#0A2047] text-base">Payment Verification History</h3>
              </div>
              <button
                onClick={() => setHistoryModalRecord(null)}
                className="text-[#64748B] hover:text-[#0A2047] p-1 rounded-lg hover:bg-[#F0F3F8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-xs space-y-1">
              <div>Student: <span className="font-bold text-[#172033]">{historyModalRecord.student_name}</span></div>
              <div>Registration Ref: <code className="font-bold text-[#0A2047]">{historyModalRecord.registration_number || historyModalRecord.id}</code></div>
              <div>Current Status: <span className="font-bold capitalize text-[#0A2047]">{historyModalRecord.payment_status}</span></div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {historyModalRecord.verification_history && historyModalRecord.verification_history.length > 0 ? (
                historyModalRecord.verification_history.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-[#E2E8F0] bg-white space-y-1 text-xs">
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
                      <span className="text-[10px] text-[#64748B]">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] font-medium">
                      Auditor: <span className="font-mono text-[#172033]">{item.actorEmail}</span>
                    </div>
                    {item.reason && (
                      <div className="text-rose-700 font-medium">Reason: {item.reason}</div>
                    )}
                    {item.notes && <div className="text-[#64748B] italic">Notes: {item.notes}</div>}
                  </div>
                ))
              ) : historyModalRecord.verified_at ? (
                <div className="p-3 rounded-xl border border-[#E2E8F0] bg-white space-y-1 text-xs">
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
                    <span className="text-[10px] text-[#64748B]">
                      {new Date(historyModalRecord.verified_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Auditor: <span className="font-mono text-[#172033]">{historyModalRecord.verified_by || "Admin"}</span>
                  </div>
                  {historyModalRecord.admin_review_notes && (
                    <div className="text-[#172033] italic">
                      Review notes: {historyModalRecord.admin_review_notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No prior verification actions recorded for this registration.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setHistoryModalRecord(null)}
                className="px-4 py-2 rounded-xl bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {proofModalRecord && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0A2047]" />
                <h3 className="font-bold text-[#0A2047] text-base">Payment Proof Inspection</h3>
              </div>
              <button
                onClick={() => setProofModalRecord(null)}
                className="text-[#64748B] hover:text-[#0A2047] p-1 rounded-lg hover:bg-[#F0F3F8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-[#172033]">{proofModalRecord.student_name}</span>
                <span className="text-[#64748B] font-mono ml-2">UTR: {proofModalRecord.transaction_id}</span>
              </div>
              <a
                href={`/api/admin/receipt?path=${encodeURIComponent(proofModalRecord.receipt_file_path)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0A2047] hover:text-[#132E57] hover:underline font-semibold flex items-center gap-1"
              >
                Open Full File <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
              </a>
            </div>

            <div className="relative rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 flex items-center justify-center min-h-[260px] max-h-[460px] overflow-hidden">
              <img
                src={`/api/admin/receipt?path=${encodeURIComponent(proofModalRecord.receipt_file_path)}`}
                alt="Payment Receipt Proof"
                className="max-h-[420px] w-auto max-w-full rounded-lg object-contain shadow-xs bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setProofModalRecord(null)}
                className="px-4 py-2 rounded-xl bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold cursor-pointer transition-colors"
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
          fetchAllForMetrics();
        }}
      />
    </div>
  );
}
