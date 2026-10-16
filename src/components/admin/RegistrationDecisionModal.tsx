"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CreditCard,
  User,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { RegistrationRecord } from "@/types/admin";
import { PAYMENT_STATUS_LABELS } from "@/config/admin";

interface RegistrationDecisionModalProps {
  isOpen: boolean;
  registration: RegistrationRecord | null;
  action: "approve" | "reject";
  onClose: () => void;
  onSuccess: (updatedRecord: RegistrationRecord) => void;
}

export function RegistrationDecisionModal({
  isOpen,
  registration,
  action,
  onClose,
  onSuccess,
}: RegistrationDecisionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedPresetReason, setSelectedPresetReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const handleClose = () => {
    setRejectionReason("");
    setSelectedPresetReason("");
    setCustomReason("");
    setNotes("");
    setErrorMessage("");
    onClose();
  };

  if (!isOpen || !registration) return null;

  const isPaymentVerified = registration.payment_status === "verified";
  const paymentMeta = PAYMENT_STATUS_LABELS[registration.payment_status] || {
    label: registration.payment_status || "Pending",
    variant: "warning",
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPresetReason(preset);
    if (preset === "Other") {
      setRejectionReason(customReason);
    } else {
      setRejectionReason(preset);
    }
  };

  const handleCustomReasonChange = (val: string) => {
    setCustomReason(val);
    if (selectedPresetReason === "Other" || !selectedPresetReason) {
      setRejectionReason(val);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    // Approval rule: payment must be verified
    if (action === "approve" && !isPaymentVerified) {
      setErrorMessage(
        "Payment Verification Pending. Final registration approval requires a verified payment. Please verify the payment in the Payments module first."
      );
      return;
    }

    // Rejection rule: reason strictly required
    const finalReason = selectedPresetReason === "Other" ? customReason.trim() : rejectionReason.trim();
    if (action === "reject" && !finalReason) {
      setErrorMessage("A rejection reason is strictly required when rejecting a registration.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/admin/students/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action,
          rejectionReason: action === "reject" ? finalReason : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update registration status.");
        return;
      }

      onSuccess(data.registration || {
        ...registration,
        student_verification_status: action === "approve" ? "verified" : "rejected",
      });
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error processing decision.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4.5 border-b flex items-center justify-between ${
            action === "approve"
              ? "bg-emerald-50/70 border-emerald-100"
              : "bg-rose-50/70 border-rose-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                action === "approve"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {action === "approve" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {action === "approve" ? "Approve Student Registration" : "Reject Student Registration"}
              </h3>
              <p className="text-xs text-slate-500">
                {action === "approve"
                  ? "Confirm participant eligibility for AVISHKAR 2026"
                  : "Decline registration with recorded justification"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2 items-start animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Action Blocked</strong>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Student Identity Card (Required before approving) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
              <User className="w-3.5 h-3.5 text-[#153D73]" />
              <span>Student Registration Summary</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Student Name</span>
                <span className="font-bold text-slate-900 text-sm">{registration.student_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Student ID / Roll No</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {registration.student_id}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Registration Reference</span>
                <span className="font-mono text-slate-700">
                  {registration.registration_number || registration.id}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Academic School</span>
                <span className="font-medium text-slate-800 truncate block" title={registration.school}>
                  {registration.school}
                </span>
              </div>
            </div>

            {/* Payment Verification Status Display */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>Payment Verification Status:</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  paymentMeta.variant === "success"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : paymentMeta.variant === "danger"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {paymentMeta.variant === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                {paymentMeta.variant === "danger" && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
                {paymentMeta.variant === "warning" && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                <span>{paymentMeta.label}</span>
              </span>
            </div>
          </div>

          {/* Action-Specific Content */}
          {action === "approve" ? (
            <div className="space-y-4">
              {/* Payment Verification Prerequisite Gate */}
              {!isPaymentVerified ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="font-bold text-amber-950 block text-sm">
                        Payment Verification Pending
                      </strong>
                      <p className="text-amber-800 leading-relaxed">
                        Final registration approval is blocked because mandatory payment verification is incomplete.
                        Uploading a receipt is not proof that the payment is valid.
                      </p>
                      <p className="text-amber-800 leading-relaxed font-medium">
                        To approve this registration, please first review and verify the student&apos;s payment receipt in
                        the <strong>Payments module</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <Link
                      href={`/admin/payments?search=${encodeURIComponent(
                        registration.registration_number || registration.student_id
                      )}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                      target="_blank"
                    >
                      <span>Review in Payments Module</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Payment Verified — Ready for Registration Approval</span>
                  </div>
                  <p className="text-emerald-800">
                    Payment proof has been verified by the accounts administration. Approving this registration will
                    mark the student as officially accepted for AVISHKAR 2026.
                  </p>
                </div>
              )}

              {/* Administrative Notes (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrative Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Eligibility verified against ERP student roster. All prerequisites met."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                <strong className="block font-bold text-rose-950 mb-0.5">
                  Confirm Registration Rejection
                </strong>
                <span>
                  Please select or provide an explicit reason. This will be recorded in the audit trail and displayed on
                  the student status tracking page.
                </span>
              </div>

              {/* Rejection Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-rose-950 mb-1.5">
                  Rejection Reason <span className="text-rose-600">* (Mandatory)</span>
                </label>
                <select
                  value={selectedPresetReason}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-colors mb-2"
                >
                  <option value="">-- Select standard rejection reason --</option>
                  <option value="Student ID not found in university ERP database">
                    Student ID not found in university ERP database
                  </option>
                  <option value="Mismatch between declared school/program and official university records">
                    Mismatch between declared school/program and official university records
                  </option>
                  <option value="Student is not currently in active academic standing">
                    Student is not currently in active academic standing
                  </option>
                  <option value="Payment verification rejected or fraudulent receipt">
                    Payment verification rejected or fraudulent receipt
                  </option>
                  <option value="Duplicate registration submission">
                    Duplicate registration submission
                  </option>
                  <option value="Incomplete or unverifiable participant documentation">
                    Incomplete or unverifiable participant documentation
                  </option>
                  <option value="Other">Other (enter custom justification below)</option>
                </select>

                {(selectedPresetReason === "Other" || !selectedPresetReason) && (
                  <textarea
                    value={customReason}
                    onChange={(e) => handleCustomReasonChange(e.target.value)}
                    placeholder="Enter specific justification for registration rejection..."
                    rows={2}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-colors"
                  />
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Internal Council Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for internal administrative audit..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {action === "approve" ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isPaymentVerified}
              title={
                !isPaymentVerified
                  ? "Approval unavailable: Payment Verification Pending"
                  : "Confirm and approve registration"
              }
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-xs transition-all ${
                !isPaymentVerified
                  ? "bg-slate-400 cursor-not-allowed opacity-60"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-98"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : !isPaymentVerified ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Payment Pending (Approval Blocked)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Approval</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!rejectionReason.trim() && !customReason.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
