"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface StatusRegistration {
  registrationNumber: string;
  studentName: string;
  studentId: string;
  school: string;
  program: string;
  yearOfJoining: string;
  paymentStatus: string;
  studentVerificationStatus: string;
  studentVerificationNotes?: string | null;
  studentVerifiedAt?: string | null;
  adminReviewNotes?: string | null;
  paymentVerifiedAt?: string | null;
  transactionId: string;
  submittedAt: string;
}

export default function StudentStatusPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch(`/api/register/status?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data.registration);
      } else {
        setError(data.error || "No registration found with those credentials.");
      }
    } catch {
      setError("Failed to query status. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{label}: Verified</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{label}: Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{label}: Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="py-8 sm:py-16 bg-[#F5F7FA] min-h-[calc(100vh-80px)]">
      <Container size="default">
        {/* Breadcrumb Back */}
        <div className="mb-5 sm:mb-6 max-w-xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Return to AVISHKAR Homepage</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="max-w-xl mx-auto text-center mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2047]/5 border border-[#0A2047]/10 text-[#0A2047] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>GD Goenka University &bull; Live Status Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2047] tracking-tight">
            Check Registration &amp; Payment Status
          </h1>
          <div className="flex items-center justify-center gap-1.5 pt-0.5" aria-hidden="true">
            <div className="w-6 h-0.5 bg-[#D4AF37] rounded-full" />
            <div className="w-12 h-0.5 bg-[#0A2047] rounded-full" />
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed pt-1">
            Track your student credentials verification and accounts confirmation in real time.
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-[#E2E8F0] shadow-xs space-y-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A2047] uppercase tracking-wider">
                Student ID or Registration Reference
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder=""
                  className="w-full h-11 px-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:border-[#0A2047] focus:ring-2 focus:ring-[#0A2047]/15 focus:outline-none transition-colors pr-10 font-mono text-[#172033] placeholder:text-[#94A3B8]"
                />
                <Search className="w-4 h-4 text-[#64748B] absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full h-11 rounded-lg bg-[#0A2047] hover:bg-[#132E57] active:bg-[#19365F] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Searching Records...</span>
                </>
              ) : (
                <>
                  <span>Check Status</span>
                  <Search className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="pt-4 border-t border-[#E2E8F0] space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#0A2047]">{result.studentName}</h3>
                  <p className="text-xs text-[#64748B] font-mono">ID: {result.studentId}</p>
                </div>
                <span className="font-mono text-xs font-semibold text-[#0A2047] bg-[#0A2047]/5 px-2.5 py-1 rounded-md border border-[#0A2047]/15">
                  {result.registrationNumber}
                </span>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(result.studentVerificationStatus, "Registration Approval")}
                {getStatusBadge(result.paymentStatus, "Payment")}
              </div>

              {/* Registration Status Outcome Banner */}
              {result.studentVerificationStatus === "verified" && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Registration Approved</span>
                  </div>
                  <p className="text-emerald-700">
                    Your registration for AVISHKAR 2026 is officially approved. Please carry your valid GD Goenka University Student ID on event day.
                  </p>
                </div>
              )}

              {result.studentVerificationStatus === "rejected" && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Registration Rejected</span>
                  </div>
                  <p className="text-rose-700">
                    {result.studentVerificationNotes || "Your registration was not approved by the AVISHKAR organizing committee."}
                  </p>
                </div>
              )}

              {result.studentVerificationStatus === "pending" && (
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Registration Review In Progress: Your registration details are under administrative review.
                  </span>
                </div>
              )}

              {result.paymentStatus === "pending_verification" && (
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Payment Verification Pending: Payment proof has been submitted and is awaiting verification by the accounts desk.
                  </span>
                </div>
              )}

              {result.paymentStatus === "verified" && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Reconciled &amp; Verified</span>
                  </div>
                  <p className="text-emerald-700">
                    Your registration fee transaction has been reconciled and confirmed by the accounts desk.
                  </p>
                </div>
              )}

              {result.paymentStatus === "rejected" && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Payment Verification Rejected</span>
                  </div>
                  <p className="text-rose-700">
                    {result.adminReviewNotes || "Payment transaction could not be reconciled with the university accounts ledger. Please contact the organizing committee."}
                  </p>
                </div>
              )}

              {/* Details table */}
              <div className="bg-[#F5F7FA] p-4 rounded-lg border border-[#E2E8F0] text-xs space-y-2">
                <div className="flex justify-between border-b border-[#E2E8F0] pb-1.5">
                  <span className="text-[#64748B]">Academic School:</span>
                  <span className="font-medium text-[#172033]">{result.school}</span>
                </div>
                <div className="flex justify-between border-b border-[#E2E8F0] pb-1.5">
                  <span className="text-[#64748B]">Program / Degree:</span>
                  <span className="font-medium text-[#172033]">{result.program}</span>
                </div>
                <div className="flex justify-between border-b border-[#E2E8F0] pb-1.5">
                  <span className="text-[#64748B]">Transaction ID / UTR:</span>
                  <span className="font-mono text-[#172033]">{result.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Registration Date:</span>
                  <span className="text-[#64748B]">{result.submittedAt}</span>
                </div>
              </div>

              <div className="p-3 bg-[#0A2047]/5 rounded-lg border border-[#0A2047]/10 text-xs text-[#0A2047]">
                <p>
                  * Registrations and payments are manually verified against the receiving university account by the organizing council.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[#64748B] bg-white border border-[#E2E8F0] px-4 py-2 rounded-lg shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>GD Goenka University &bull; Official Student Credential Verification</span>
          </div>
        </div>
      </Container>
    </div>
  );
}
