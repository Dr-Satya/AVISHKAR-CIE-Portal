"use client";

import React from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Inbox,
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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-12 bg-slate-100 rounded w-full" />
          <div className="h-12 bg-slate-100 rounded w-full" />
          <div className="h-12 bg-slate-100 rounded w-full" />
          <div className="h-12 bg-slate-100 rounded w-full" />
        </div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Inbox className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Registrations Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No authorized registration records match the current search or filters. If registrations have not been submitted yet, the database is currently empty.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 sm:px-6">Student Details</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Academic Program</th>
              <th className="py-3 px-4 text-center">Registration Status</th>
              <th className="py-3 px-4 text-center">Payment Status</th>
              <th className="py-3 px-4">Submitted</th>
              <th className="py-3 px-4 text-right min-w-[210px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((reg) => {
              const paymentMeta = PAYMENT_STATUS_LABELS[reg.payment_status] || {
                label: reg.payment_status,
                variant: "neutral",
              };

              const studentMeta = STUDENT_STATUS_LABELS[reg.student_verification_status] || {
                label: reg.student_verification_status,
                variant: "neutral",
              };

              return (
                <tr
                  key={reg.id}
                  onClick={() => onSelectRegistration(reg)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  {/* 1. Student Name and Student ID */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 text-sm transition-colors">
                        {reg.student_name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 mt-0.5">
                        ID: <strong className="text-slate-700">{reg.student_id}</strong>
                      </span>
                      {reg.registration_number && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {reg.registration_number}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Email and Contact Number */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col text-slate-700">
                      <span className="truncate max-w-[180px]" title={reg.email}>
                        {reg.email || "—"}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] mt-0.5">
                        {reg.contact_number || "—"}
                      </span>
                    </div>
                  </td>

                  {/* 3. School, Program, and Year of Joining */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col max-w-[220px]">
                      <span className="font-semibold text-slate-900 truncate" title={reg.school}>
                        {reg.school}
                      </span>
                      <span className="text-slate-600 truncate text-[11px]" title={reg.program || reg.course || ""}>
                        {reg.program || reg.course || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Joining Year: {reg.year_of_joining || "—"}
                      </span>
                    </div>
                  </td>

                  {/* 4. Student Verification Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        studentMeta.variant === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : studentMeta.variant === "danger"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {studentMeta.variant === "success" && <CheckCircle className="w-3 h-3" />}
                      {studentMeta.variant === "danger" && <XCircle className="w-3 h-3" />}
                      {studentMeta.variant === "warning" && <Clock className="w-3 h-3" />}
                      {studentMeta.label}
                    </span>
                  </td>

                  {/* 5. Payment Verification Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        paymentMeta.variant === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : paymentMeta.variant === "danger"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {paymentMeta.variant === "success" && <CheckCircle className="w-3 h-3" />}
                      {paymentMeta.variant === "danger" && <XCircle className="w-3 h-3" />}
                      {paymentMeta.variant === "warning" && <Clock className="w-3 h-3" />}
                      {paymentMeta.label}
                    </span>
                  </td>

                  {/* 6. Registration Submission Date */}
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    <div>{new Date(reg.created_at).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(reg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>

                  {/* 7. Action Column */}
                  <td className="py-3.5 px-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {reg.student_verification_status === "pending" ? (
                        <>
                          {/* Approve Registration Button */}
                          <button
                            onClick={() => onApproveRegistration(reg)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-2xs ${
                              reg.payment_status === "verified"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-300"
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors shadow-2xs"
                            title="Reject student registration with reason"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${
                            reg.student_verification_status === "verified"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {reg.student_verification_status === "verified" ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Approved</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </>
                          )}
                        </span>
                      )}

                      {/* Review details */}
                      <button
                        onClick={() => onSelectRegistration(reg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-blue-50 font-semibold text-xs transition-colors"
                        title="Open complete student registration file"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
