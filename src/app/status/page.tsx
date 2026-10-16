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
    <div className="py-8 sm:py-16 bg-[#F8FAFC]/60 min-h-[calc(100vh-80px)]">
      <Container size="default">
        {/* Breadcrumb Back */}
        <div className="mb-5 sm:mb-6 max-w-xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#153D73] hover:text-[#2563EB] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to AVISHKAR Homepage</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="max-w-xl mx-auto text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-normal text-[#174789] font-institutional">
            Check Registration &amp; Payment Status
          </h1>
        </div>

        {/* Search Box */}
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Student ID or Registration Reference
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 22001015001 or AVISHKAR-2026-123456"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none transition-colors pr-10 font-mono"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full py-2.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching Records...</span>
                </>
              ) : (
                <span>Check Status</span>
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
            <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#174789]">{result.studentName}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {result.studentId}</p>
                </div>
                <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
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
                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Payment Verification Pending: Payment proof has been submitted and is awaiting verification by the accounts desk.
                  </span>
                </div>
              )}

              {/* Details table */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Academic School:</span>
                  <span className="font-medium text-slate-800">{result.school}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Program / Degree:</span>
                  <span className="font-medium text-slate-800">{result.program}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Transaction ID / UTR:</span>
                  <span className="font-mono text-slate-800">{result.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registration Date:</span>
                  <span className="text-slate-600">{result.submittedAt}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-800">
                <p>
                  * Registrations and payments are manually verified against the receiving university account by the organizing council.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[#475569] bg-white border border-[#D9E4F2] px-4 py-2 rounded-lg shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            <span>GD Goenka University &bull; Official Student Credential Verification</span>
          </div>
        </div>
      </Container>
    </div>
  );
}
