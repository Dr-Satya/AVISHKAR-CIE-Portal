"use client";

import React from "react";
import Link from "next/link";
import {
  RegistrationSubmissionResult,
  StudentRegistrationInput,
} from "@/types/registration";
import {
  CheckCircle2,
  Clock,
  Printer,
  ArrowRight,
  FileText,
  RotateCcw,
} from "lucide-react";

interface SubmissionSuccessProps {
  result: RegistrationSubmissionResult;
  formData: StudentRegistrationInput;
  onReset: () => void;
}

export function SubmissionSuccess({
  result,
  formData,
  onReset,
}: SubmissionSuccessProps) {
  const isPersisted =
    result.mode === "persisted" ||
    (result.mode as string) === "persisted_store" ||
    Boolean(result.registrationNumber);

  const handlePrint = () => {
    window.print();
  };

  if (!isPersisted) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2 pb-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-[#0A2047] font-institutional">
            Registration Opening Soon
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            GD Goenka University &bull; AVISHKAR 2026 Innovation Fest
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs space-y-5 text-center">
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <p className="font-semibold text-sm">
              Official Registration Not Yet Active
            </p>
            <p className="text-amber-800 leading-relaxed max-w-md mx-auto">
              Live registration submissions are currently locked pending official schedule, fee, and payment channel ratification. No registration record was created.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] font-medium text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Form</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white font-medium text-xs transition-colors shadow-xs border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 cursor-pointer"
            >
              <span>Return to Homepage</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Success / Status Header */}
      <div className="text-center space-y-2 pb-2">
        <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2047] tracking-tight">
          Registration Submitted Successfully
        </h2>
        <div className="flex items-center justify-center gap-1.5 pt-0.5" aria-hidden="true">
          <div className="w-6 h-0.5 bg-[#D4AF37] rounded-full" />
          <div className="w-12 h-0.5 bg-[#0A2047] rounded-full" />
        </div>
        <p className="text-xs sm:text-sm text-[#64748B]">
          GD Goenka University &bull; AVISHKAR 2026 Innovation Fest
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Registration Reference Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0A2047]/5 border border-[#0A2047]/15">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
              Official Registration ID
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-[#0A2047]">
              {result.registrationNumber || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending Accounts Verification</span>
            </span>
          </div>
        </div>

        {/* Verification & Next Steps Notice */}
        <div className="p-3.5 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] text-xs text-[#172033] leading-relaxed space-y-1">
          <span className="font-semibold text-[#0A2047] block text-xs">
            What Happens Next?
          </span>
          <p className="text-[#64748B]">
            Your registration details and payment UTR will be reconciled against the official university festival accounts ledger. Keep your registration ID safe for event day check-in.
          </p>
        </div>

        {/* Submitted Data Summary Table */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0A2047] block border-b border-[#E2E8F0] pb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            Submission Summary
          </span>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-3.5 sm:gap-y-4 text-xs">
            <div className="min-w-0">
              <dt className="text-[#64748B] font-medium">Student Name</dt>
              <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
                {result.studentName || formData.studentName}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[#64748B] font-medium">Student ID / Enrolment No.</dt>
              <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm font-mono break-words [overflow-wrap:anywhere]">
                {result.studentId || formData.studentId}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[#64748B] font-medium">Department &amp; School</dt>
              <dd className="text-[#0A2047] font-semibold mt-0.5 break-words [overflow-wrap:anywhere]">
                {formData.program || formData.course} &bull; {formData.school || "GDGU"}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[#64748B] font-medium">Year of Joining</dt>
              <dd className="text-[#0A2047] font-semibold mt-0.5 break-words [overflow-wrap:anywhere]">
                {formData.yearOfJoining ? `Batch ${formData.yearOfJoining}` : (formData.academicYear || "—")}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[#64748B] font-medium">Transaction ID / UTR</dt>
              <dd className="text-[#0A2047] font-semibold mt-0.5 font-mono text-sm break-words [overflow-wrap:anywhere]">
                {result.transactionId || formData.transactionId}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[#64748B] font-medium">Payment Date</dt>
              <dd className="text-[#0A2047] font-semibold mt-0.5 break-words [overflow-wrap:anywhere]">
                {formData.paymentDate}
              </dd>
            </div>

            {formData.receiptFile && (
              <div className="sm:col-span-2 min-w-0">
                <dt className="text-[#64748B] font-medium">Uploaded Receipt Proof</dt>
                <dd className="text-[#0A2047] font-medium mt-0.5 flex items-center gap-1.5 break-words [overflow-wrap:anywhere]">
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span className="truncate">{formData.receiptFile.name}</span>
                  <span className="text-[#64748B] text-[11px] shrink-0">
                    ({(formData.receiptFile.size / 1024).toFixed(1)} KB)
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F5F7FA] text-[#0A2047] font-semibold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Print Confirmation</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F5F7FA] text-[#64748B] font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Registration</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>Return to Homepage</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
