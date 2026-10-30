"use client";

import React from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Inbox,
  User,
  GraduationCap,
  CreditCard,
  FileText,
} from "lucide-react";
import { RegistrationRecord } from "@/types/admin";
import { PAYMENT_STATUS_LABELS, STUDENT_STATUS_LABELS } from "@/config/admin";

interface RegistrationTableProps {
  registrations: RegistrationRecord[];
  isLoading: boolean;
  onSelectRegistration: (reg: RegistrationRecord) => void;
  onApproveRegistration: (reg: RegistrationRecord) => void;
  onRejectRegistration: (reg: RegistrationRecord) => void;
}

export function RegistrationTable({
  registrations,
  isLoading,
  onSelectRegistration,
  onApproveRegistration,
  onRejectRegistration,
}: RegistrationTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs p-6 space-y-4">
        <div className="animate-pulse space-y-3.5">
          <div className="h-6 bg-[#F0F3F8] rounded-md w-1/4" />
          <div className="h-12 bg-[#F5F7FA] rounded-lg w-full" />
          <div className="h-12 bg-[#F5F7FA] rounded-lg w-full" />
          <div className="h-12 bg-[#F5F7FA] rounded-lg w-full" />
          <div className="h-12 bg-[#F5F7FA] rounded-lg w-full" />
        </div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#0A2047]/5 text-[#0A2047] mx-auto flex items-center justify-center mb-3.5 border border-[#0A2047]/10">
          <Inbox className="w-7 h-7 text-[#D4AF37]" />
        </div>
        <h3 className="text-base font-bold text-[#0A2047]">No Registrations Found</h3>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 leading-relaxed">
          No authorized registration records match the current search or filters. If registrations have not been submitted yet, the database is currently empty.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 sm:px-6">Student Details</th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th className="py-3.5 px-4">Academic Program</th>
              <th className="py-3.5 px-4 text-center">Registration Status</th>
              <th className="py-3.5 px-4 text-center">Payment Status</th>
              <th className="py-3.5 px-4 text-center">Overall Status</th>
              <th className="py-3.5 px-4">Submitted</th>
              <th className="py-3.5 px-4 text-right min-w-[210px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {registrations.map((reg) => {
              const paymentMeta = PAYMENT_STATUS_LABELS[reg.payment_status] || {
                label: reg.payment_status,
                variant: "neutral",
              };

              const studentMeta = STUDENT_STATUS_LABELS[reg.student_verification_status] || {
                label: reg.student_verification_status,
                variant: "neutral",
              };

              const isOverallApproved =
                reg.payment_status === "verified" &&
                reg.student_verification_status === "verified";
              const isOverallRejected =
                reg.payment_status === "rejected" ||
                reg.student_verification_status === "rejected";

              return (
                <tr
                  key={reg.id}
                  onClick={() => onSelectRegistration(reg)}
                  className="hover:bg-[#F0F3F8] cursor-pointer transition-colors group"
                >
                  {/* 1. Student Name and Student ID */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#172033] group-hover:text-[#0A2047] text-sm transition-colors">
                        {reg.student_name}
                      </span>
                      <span className="font-mono text-[11px] text-[#64748B] mt-0.5">
                        ID: <strong className="text-[#0A2047] font-bold">{reg.student_id}</strong>
                      </span>
                      {reg.admission_number && (
                        <span className="font-mono text-[10px] text-[#64748B]">
                          Adm: {reg.admission_number}
                        </span>
                      )}
                      {reg.registration_number && (
                        <span className="text-[10px] text-[#64748B]/80 font-mono">
                          {reg.registration_number}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Email and Contact Number */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col text-[#172033]">
                      <span className="truncate max-w-[180px] font-medium" title={reg.email}>
                        {reg.email || "—"}
                      </span>
                      <span className="text-[#64748B] font-mono text-[11px] mt-0.5">
                        {reg.contact_number || "—"}
                      </span>
                    </div>
                  </td>

                  {/* 3. School, Program, and Year of Joining */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col max-w-[220px]">
                      <span className="font-bold text-[#0A2047] truncate" title={reg.school}>
                        {reg.school}
                      </span>
                      <span className="text-[#172033] truncate text-[11px] font-medium" title={reg.program || reg.course || ""}>
                        {reg.program || reg.course || "—"}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        Joining Year: {reg.year_of_joining || "—"}
                      </span>
                    </div>
                  </td>

                  {/* 4. Student Verification Status & ID Card Indicator */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          studentMeta.variant === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : studentMeta.variant === "danger"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {studentMeta.variant === "success" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        {studentMeta.variant === "danger" && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {studentMeta.variant === "warning" && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{studentMeta.label}</span>
                      </span>
                      {reg.id_card_file_path && (
                        <span className="text-[10px] text-[#0A2047] flex items-center gap-1 font-semibold">
                          <FileText className="w-3 h-3 text-[#D4AF37]" />
                          <span>ID Card Uploaded</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Payment Verification Status & Fee */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                          paymentMeta.variant === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : paymentMeta.variant === "danger"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {paymentMeta.variant === "success" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        {paymentMeta.variant === "danger" && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {paymentMeta.variant === "warning" && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{paymentMeta.label}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#64748B]">
                        Fee: <strong className="text-[#0A2047]">₹{reg.fee_amount ?? 100}</strong>
                        {reg.transaction_id ? ` • UTR: ${reg.transaction_id.slice(0, 10)}${reg.transaction_id.length > 10 ? "…" : ""}` : ""}
                      </span>
                      {reg.receipt_file_path && (
                        <span className="text-[10px] text-[#0A2047] flex items-center gap-1 font-semibold">
                          <FileText className="w-3 h-3 text-[#D4AF37]" />
                          <span>Receipt Uploaded</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. Overall Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {isOverallApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Approved</span>
                      </span>
                    ) : isOverallRejected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rejected</span>
                      </span>
                    ) : reg.payment_status === "verified" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pending Student</span>
                      </span>
                    ) : reg.student_verification_status === "verified" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pending Payment</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pending Verification</span>
                      </span>
                    )}
                  </td>

                  {/* 7. Registration Submission Date */}
                  <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                    <div className="font-medium text-[#172033]">{new Date(reg.created_at).toLocaleDateString()}</div>
                    <div className="text-[10px] text-[#64748B]/70 font-mono">
                      {new Date(reg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>

                  {/* 8. Action Column */}
                  <td className="py-3.5 px-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isOverallApproved && !isOverallRejected ? (
                        <>
                          {/* Approve Registration Button */}
                          <button
                            onClick={() => onApproveRegistration(reg)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer ${
                              reg.payment_status === "verified"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-[#E2E8F0] hover:border-amber-300"
                            }`}
                            title={
                              reg.payment_status === "verified"
                                ? "Approve student registration"
                                : "Payment Verification Pending: Payment must be verified before approval"
                            }
                          >
                            {reg.payment_status === "verified" ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>Approve</span>
                          </button>

                          {/* Reject Registration Button */}
                          <button
                            onClick={() => onRejectRegistration(reg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                            title="Reject student registration with reason"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                            isOverallApproved
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-rose-50 text-rose-800 border-rose-300"
                          }`}
                        >
                          {isOverallApproved ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Approved</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </>
                          )}
                        </span>
                      )}

                      {/* Review details */}
                      <button
                        onClick={() => onSelectRegistration(reg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] font-semibold text-xs transition-colors cursor-pointer"
                        title="Open complete student registration file"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="hidden sm:inline">Review</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
