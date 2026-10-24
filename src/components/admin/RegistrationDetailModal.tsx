"use client";

import React, { useState } from "react";
import {
  X,
  User,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Phone,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  Rocket,
  Users,
} from "lucide-react";
import { RegistrationRecord } from "@/types/admin";
import { PAYMENT_STATUS_LABELS, STUDENT_STATUS_LABELS } from "@/config/admin";

interface DetailModalProps {
  registration: RegistrationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export function RegistrationDetailModal({
  registration,
  isOpen,
  onClose,
  onUpdateSuccess,
}: DetailModalProps) {
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "payment" | "student">("details");

  // Payment Verification Action State
  const [paymentAction, setPaymentAction] = useState<"approve" | "reject" | null>(null);
  const [paymentReason, setPaymentReason] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Student Verification Action State
  const [studentAction, setStudentAction] = useState<"approve" | "reject" | null>(null);
  const [studentReason, setStudentReason] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [studentError, setStudentError] = useState("");

  // Receipt image preview error state
  const [receiptImageError, setReceiptImageError] = useState(false);

  if (!isOpen || !registration) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const handlePaymentVerify = async () => {
    if (!paymentAction) return;

    if (paymentAction === "reject" && !paymentReason.trim()) {
      setPaymentError("A rejection reason is strictly required.");
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setPaymentError("");

      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action: paymentAction,
          rejectionReason: paymentReason.trim(),
          notes: paymentNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Failed to update payment status.");
        return;
      }

      setPaymentAction(null);
      setPaymentReason("");
      setPaymentNotes("");
      onUpdateSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error submitting payment decision.";
      setPaymentError(message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleStudentVerify = async () => {
    if (!studentAction) return;

    if (studentAction === "approve" && registration.payment_status !== "verified") {
      setStudentError(
        "Payment Verification Pending: Final registration approval requires a verified payment. Please verify the payment in the Payments module first."
      );
      return;
    }

    if (studentAction === "reject" && !studentReason.trim()) {
      setStudentError("A rejection reason is strictly required.");
      return;
    }

    try {
      setIsSubmittingStudent(true);
      setStudentError("");

      const res = await fetch("/api/admin/students/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action: studentAction,
          rejectionReason: studentReason.trim(),
          notes: studentNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStudentError(data.error || "Failed to update student verification status.");
        return;
      }

      setStudentAction(null);
      setStudentReason("");
      setStudentNotes("");
      onUpdateSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error submitting student decision.";
      setStudentError(message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const paymentMeta = PAYMENT_STATUS_LABELS[registration.payment_status] || {
    label: registration.payment_status,
    variant: "neutral",
  };

  const studentMeta = STUDENT_STATUS_LABELS[registration.student_verification_status] || {
    label: registration.student_verification_status,
    variant: "neutral",
  };

  // Secure receipt URL via authenticated proxy
  const secureReceiptUrl = `/api/admin/receipt?path=${encodeURIComponent(
    registration.receipt_file_path
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#0A2047]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 sm:px-6 bg-[#0A2047] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37] shrink-0">
              <User className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight">
                  {registration.student_name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/15 text-[#D4AF37] font-semibold border border-white/10">
                  {registration.student_id}
                </span>
              </div>
              <p className="text-xs text-white/80 font-mono mt-0.5">
                Ref: {registration.registration_number || registration.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 border-b border-[#E2E8F0] bg-[#F5F7FA] flex gap-4 shrink-0 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "details"
                ? "border-[#D4AF37] text-[#0A2047] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#0A2047]"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
            <span>Student & Academic Details</span>
          </button>

          <button
            onClick={() => setActiveTab("payment")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "payment"
                ? "border-[#D4AF37] text-[#0A2047] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#0A2047]"
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            <span>Payment Proof & Verification</span>
            {registration.payment_status === "pending_verification" && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("student")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "student"
                ? "border-[#D4AF37] text-[#0A2047] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#0A2047]"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Student Eligibility Decision</span>
            {registration.student_verification_status === "pending" && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: Complete Student & Academic Details */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Status Badges Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B]">Student Eligibility:</span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      studentMeta.variant === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : studentMeta.variant === "danger"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {studentMeta.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748B]">Payment Status:</span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      paymentMeta.variant === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : paymentMeta.variant === "danger"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {paymentMeta.label}
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0A2047]" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F5F7FA] p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="min-w-0">
                    <label className="text-[11px] text-[#64748B] font-semibold">Full Name</label>
                    <p className="text-sm font-bold text-[#172033] break-words [overflow-wrap:anywhere]">{registration.student_name}</p>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[11px] text-[#64748B] font-semibold">Student ID / Roll No</label>
                    <p className="text-sm font-mono font-bold text-[#0A2047] break-words [overflow-wrap:anywhere]">{registration.student_id}</p>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[11px] text-[#64748B] font-semibold">Email Address</label>
                    <p className="text-sm text-[#172033] font-medium flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="break-words [overflow-wrap:anywhere]">{registration.email || "Not specified"}</span>
                    </p>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[11px] text-[#64748B] font-semibold">Contact Number</label>
                    <p className="text-sm text-[#172033] font-medium flex items-center gap-1.5 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="break-words [overflow-wrap:anywhere]">{registration.contact_number || "Not specified"}</span>
                    </p>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[11px] text-[#64748B] font-semibold">Gender</label>
                    <p className="text-sm text-[#172033] font-medium break-words [overflow-wrap:anywhere]">{registration.gender || "Not specified"}</p>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[11px] text-[#64748B] font-semibold">Date of Birth</label>
                    <p className="text-sm text-[#172033] font-medium break-words [overflow-wrap:anywhere]">{registration.dob || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0A2047]" /> Official Academic Enrollment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F5F7FA] p-4 rounded-xl border border-[#E2E8F0]">
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Institution</label>
                    <p className="text-sm font-bold text-[#0A2047]">GD Goenka University</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">School</label>
                    <p className="text-sm font-bold text-[#172033]">{registration.school || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Program / Department</label>
                    <p className="text-sm font-semibold text-[#172033]">{registration.program || registration.course || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Year of Joining</label>
                    <p className="text-sm font-semibold text-[#172033]">Class of {registration.year_of_joining || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Form Version</label>
                    <p className="text-sm font-mono text-[#64748B]">{registration.form_version || "Standard Form"}</p>
                  </div>
                </div>
              </div>

              {/* Club Motivation & Engagement */}
              <div>
                <h3 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0A2047]" /> Motivation &amp; Engagement
                </h3>
                <div className="space-y-3 bg-[#F5F7FA] p-4 rounded-xl border border-[#E2E8F0]">
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Reason for Joining AVISHKAR</label>
                    <p className="text-sm text-[#172033] leading-relaxed whitespace-pre-wrap mt-0.5">
                      {registration.reason_for_joining || "No reason provided."}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Interested in Leadership Roles</label>
                    <p className="text-sm font-semibold text-[#0A2047] mt-0.5">
                      {registration.leadership_interest || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Startup & Incubation / Previous Work Details */}
              <div>
                <h3 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-[#0A2047]" /> Startup, Innovation &amp; Incubation
                </h3>
                {Boolean(
                  (registration.has_startup_or_project && registration.has_startup_or_project !== "No, not yet.") ||
                  (registration.startup_title && registration.startup_title.trim()) ||
                  (registration.project_name && registration.project_name.trim()) ||
                  (registration.previous_work_description && registration.previous_work_description.trim()) ||
                  (registration.project_role && registration.project_role.trim())
                ) ? (
                  <div className="space-y-4 bg-[#F5F7FA] p-4 rounded-xl border border-[#E2E8F0] text-xs">
                    {/* Status Badge */}
                    {registration.has_startup_or_project && (
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                        <span className="text-[11px] font-semibold text-[#64748B]">Startup Status:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
                          {registration.has_startup_or_project}
                        </span>
                      </div>
                    )}

                    {/* Title & Stage */}
                    {(registration.startup_title || registration.project_name) && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                          <label className="text-[11px] text-[#64748B] font-semibold">Project / Startup Title</label>
                          <p className="text-sm font-bold text-[#172033]">
                            {registration.startup_title || registration.project_name}
                          </p>
                        </div>
                        {registration.startup_stage && (
                          <div className="sm:text-right mt-1 sm:mt-0">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                              Stage: {registration.startup_stage}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Roles & Team Leader */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
                      <div>
                        <label className="text-[11px] text-[#64748B] font-semibold">Student's Role</label>
                        <p className="text-xs font-semibold text-[#0A2047]">
                          {registration.student_role || registration.project_role || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#64748B] font-semibold">Team Structure</label>
                        <p className="text-xs font-semibold text-[#172033]">
                          {registration.team_structure || "Individual Project"}
                        </p>
                      </div>
                    </div>

                    {/* Team Leader details if present */}
                    {(registration.team_leader_name || registration.team_leader_enrollment) && (
                      <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] space-y-1">
                        <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
                          Team Leader / Founder
                        </label>
                        <p className="text-xs font-bold text-[#172033]">
                          {registration.team_leader_name}{" "}
                          {registration.team_leader_enrollment && (
                            <span className="font-mono text-[11px] text-[#64748B]">
                              ({registration.team_leader_enrollment})
                            </span>
                          )}
                        </p>
                        {(registration.team_leader_email || registration.team_leader_contact) && (
                          <p className="text-[11px] text-[#64748B]">
                            {registration.team_leader_email} {registration.team_leader_contact ? `| ${registration.team_leader_contact}` : ""}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Team Members List */}
                    {Array.isArray(registration.team_members) && registration.team_members.length > 0 && (
                      <div>
                        <label className="text-[11px] text-[#64748B] font-semibold block mb-1.5">
                          Team Members ({registration.team_members.length})
                        </label>
                        <div className="space-y-1.5">
                          {registration.team_members.map((member, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#0A2047]/10 text-[#0A2047] font-bold flex items-center justify-center text-[10px]">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="font-bold text-[#172033]">{member.fullName}</span>
                                  {member.enrollmentNumber && (
                                    <span className="font-mono text-[#64748B] text-[11px] ml-1.5">
                                      ({member.enrollmentNumber})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] font-semibold text-[#0A2047]">
                                {member.roleInTeam}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details / Description */}
                    {(registration.startup_details || registration.previous_work_description) && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <label className="text-[11px] text-[#64748B] font-semibold">Project Details / Description</label>
                        <p className="text-xs text-[#172033] leading-relaxed whitespace-pre-wrap mt-0.5">
                          {registration.startup_details || registration.previous_work_description}
                        </p>
                      </div>
                    )}

                    {/* Technology Stack */}
                    {registration.technologies_used && (
                      <div>
                        <label className="text-[11px] text-[#64748B] font-semibold">Technology Stack</label>
                        <p className="text-xs font-medium text-[#172033] mt-0.5">
                          {registration.technologies_used}
                        </p>
                      </div>
                    )}

                    {/* Incubation Support Needed */}
                    {Array.isArray(registration.support_needed) && registration.support_needed.length > 0 && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <label className="text-[11px] text-[#64748B] font-semibold block mb-1.5">
                          Incubation Support Needed
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {registration.support_needed.map((sup, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-[#0A2047] border border-blue-200"
                            >
                              {sup}
                            </span>
                          ))}
                        </div>
                        {registration.other_support_details && (
                          <p className="text-[11px] text-[#64748B] mt-1.5 italic">
                            Other: {registration.other_support_details}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Project Link */}
                    {registration.project_link && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <label className="text-[11px] text-[#64748B] font-semibold">Portfolio / Repository Link</label>
                        <a
                          href={registration.project_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0A2047] hover:text-[#132E57] hover:underline font-semibold flex items-center gap-1 mt-0.5"
                        >
                          <span>{registration.project_link}</span>
                          <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B]">
                    No startup, innovation, or previous work specified in this submission.
                  </div>
                )}
              </div>

              {/* Submission Metadata */}
              <div className="text-[11px] text-[#64748B] flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
                <span>
                  Submitted: {new Date(registration.created_at).toLocaleString()}
                </span>
                {registration.updated_at && (
                  <span>
                    Last Updated: {new Date(registration.updated_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Payment Proof & Verification */}
          {activeTab === "payment" && (
            <div className="space-y-6">
              {/* CRITICAL CAUTION BANNER */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-950 block mb-0.5">
                    MANDATORY FINANCE VERIFICATION NOTICE
                  </strong>
                  A submitted screenshot must never automatically mark a payment as paid. The admin must verify the transaction against the receiving university bank/UPI account statement before approval.
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#F5F7FA] p-4 rounded-xl border border-[#E2E8F0]">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Submitted Fee</label>
                  <p className="text-base font-bold text-[#0A2047] font-mono">
                    ₹{registration.fee_amount !== null ? registration.fee_amount : "500 (Provisional)"}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Payment Date</label>
                  <p className="text-sm font-semibold text-[#172033]">
                    {registration.payment_date || "Not provided"}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#64748B]">Current Payment Status</label>
                  <div className="mt-1">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        paymentMeta.variant === "success"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : paymentMeta.variant === "danger"
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {paymentMeta.label}
                    </span>
                  </div>
                </div>

                {/* Transaction Reference ID with Copy Button */}
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-[11px] font-semibold text-[#64748B]">
                    UPI Transaction / UTR Reference ID
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-sm font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#0A2047] select-all shadow-2xs">
                      {registration.transaction_id || "NOT PROVIDED"}
                    </code>
                    {registration.transaction_id && (
                      <button
                        onClick={() => copyToClipboard(registration.transaction_id)}
                        className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] transition-colors cursor-pointer"
                        title="Copy Transaction ID to clipboard"
                      >
                        {copiedUtr ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#D4AF37]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {registration.remarks && (
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="text-[11px] font-semibold text-[#64748B]">Student Remarks</label>
                    <p className="text-xs text-[#172033] bg-white p-2.5 rounded-lg border border-[#E2E8F0] mt-1">
                      {registration.remarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Secure Payment Proof Image Viewer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#0A2047]" />
                    Secure Payment Receipt Proof
                  </h4>
                  <a
                    href={secureReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0A2047] hover:text-[#132E57] hover:underline font-semibold flex items-center gap-1"
                  >
                    Open in Full Window <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                  </a>
                </div>

                <div className="relative rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 flex flex-col items-center justify-center min-h-[260px] max-h-[460px] overflow-hidden">
                  {registration.receipt_file_path ? (
                    !receiptImageError ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={secureReceiptUrl}
                        alt="Payment Receipt Proof"
                        className="max-h-[420px] w-auto max-w-full rounded-lg object-contain shadow-xs bg-white"
                        onError={() => setReceiptImageError(true)}
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-[#64748B] mx-auto" />
                        <p className="text-sm font-semibold text-[#172033]">
                          Receipt preview unavailable in browser
                        </p>
                        <p className="text-xs text-[#64748B] max-w-md">
                          File may be a PDF document or requires direct download.
                        </p>
                        <a
                          href={secureReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0A2047] text-white hover:bg-[#132E57] mt-2 transition-colors shadow-2xs"
                        >
                          Download / View File <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-6 text-[#64748B] text-sm">
                      No receipt file uploaded for this registration.
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 font-mono">
                  Private bucket: <code>{registration.receipt_file_path || "None"}</code>
                </p>
              </div>

              {/* Review History / Audit */}
              {registration.verified_at && (
                <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] space-y-1">
                  <div className="font-bold text-[#0A2047]">Payment Audit Record:</div>
                  <div>Decision timestamp: {new Date(registration.verified_at).toLocaleString()}</div>
                  {registration.verified_by && <div>Reviewer ID: <span className="font-mono text-[#172033]">{registration.verified_by}</span></div>}
                  {registration.admin_review_notes && (
                    <div>Review Notes: <span className="font-mono text-[#172033]">{registration.admin_review_notes}</span></div>
                  )}
                </div>
              )}

              {/* Payment Action Buttons */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                {paymentError && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {paymentError}
                  </div>
                )}

                {!paymentAction ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setPaymentAction("approve")}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Payment
                    </button>

                    <button
                      onClick={() => setPaymentAction("reject")}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Payment
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0A2047]">
                        Confirm: {paymentAction === "approve" ? "Approve Payment" : "Reject Payment"}
                      </span>
                      <button
                        onClick={() => setPaymentAction(null)}
                        className="text-xs text-[#64748B] hover:text-[#172033] font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {paymentAction === "reject" && (
                      <div>
                        <label className="block text-xs font-bold text-rose-950 mb-1">
                          Rejection Reason <span className="text-rose-600">* (Mandatory)</span>
                        </label>
                        <select
                          value={paymentReason}
                          onChange={(e) => setPaymentReason(e.target.value)}
                          className="w-full p-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white mb-2 text-[#172033] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        >
                          <option value="">-- Select reason --</option>
                          <option value="UTR Reference ID not found on university bank statement">
                            UTR Reference ID not found on university bank statement
                          </option>
                          <option value="Amount paid does not match required fee">
                            Amount paid does not match required fee
                          </option>
                          <option value="Receipt screenshot is blurry or illegible">
                            Receipt screenshot is blurry or illegible
                          </option>
                          <option value="Duplicate transaction reference ID detected">
                            Duplicate transaction reference ID detected
                          </option>
                          <option value="Transaction timestamp predates registration period">
                            Transaction timestamp predates registration period
                          </option>
                          <option value="Other">Other (specify below)</option>
                        </select>
                        {paymentReason === "Other" && (
                          <input
                            type="text"
                            placeholder="Enter custom rejection reason..."
                            onChange={(e) => setPaymentReason(e.target.value)}
                            className="w-full p-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Internal Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Internal notes for audit log..."
                        className="w-full p-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handlePaymentVerify}
                        disabled={isSubmittingPayment}
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-2xs ${
                          paymentAction === "approve"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        }`}
                      >
                        {isSubmittingPayment
                          ? "Saving..."
                          : paymentAction === "approve"
                          ? "Confirm & Mark Verified"
                          : "Confirm & Mark Rejected"}
                      </button>
                      <button
                        onClick={() => setPaymentAction(null)}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:bg-[#E2E8F0] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Student Eligibility Decision (Separate from payment) */}
          {activeTab === "student" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0A2047]/5 border border-[#0A2047]/15 text-[#0A2047] text-xs">
                <strong className="font-bold block mb-1">
                  SEPARATE STUDENT ELIGIBILITY VERIFICATION
                </strong>
                Verifies that the student is an actively enrolled GD Goenka University student in the declared school and program. This is tracked independently from their payment proof.
              </div>

              {/* Student Summary */}
              <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-medium">Student Name:</span>
                  <span className="font-bold text-[#172033]">{registration.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-medium">Roll No / Student ID:</span>
                  <span className="font-mono font-bold text-[#0A2047]">{registration.student_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-medium">School:</span>
                  <span className="font-semibold text-[#172033]">{registration.school}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-medium">Program:</span>
                  <span className="font-semibold text-[#172033]">{registration.program}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-medium">Joining Year:</span>
                  <span className="font-semibold text-[#172033]">Class of {registration.year_of_joining}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#64748B] font-medium">Current Eligibility Status:</span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      studentMeta.variant === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : studentMeta.variant === "danger"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {studentMeta.label}
                  </span>
                </div>
              </div>

              {/* Audit Trail */}
              {registration.student_verified_at && (
                <div className="p-3.5 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] space-y-1">
                  <div className="font-bold text-[#0A2047]">Student Eligibility Audit Record:</div>
                  <div>Verified at: {new Date(registration.student_verified_at).toLocaleString()}</div>
                  {registration.student_verification_notes && (
                    <div>Notes: <span className="font-mono text-[#172033]">{registration.student_verification_notes}</span></div>
                  )}
                </div>
              )}

              {/* Payment Prerequisite Gate Notice */}
              {registration.payment_status !== "verified" ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Payment Verification Pending</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Final registration approval is blocked until payment verification is completed. Uploading a receipt
                    does not verify the payment. Please review and verify the payment proof in the Payments tab first.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Payment Verified: Registration is eligible for final administrative approval.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                {studentError && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {studentError}
                  </div>
                )}

                {!studentAction ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        if (registration.payment_status !== "verified") {
                          setStudentError(
                            "Payment Verification Pending: Final registration approval requires a verified payment. Please verify the payment in the Payments module first."
                          );
                        } else {
                          setStudentAction("approve");
                        }
                      }}
                      disabled={registration.payment_status !== "verified"}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-2xs transition-colors ${
                        registration.payment_status === "verified"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                      title={
                        registration.payment_status !== "verified"
                          ? "Payment Verification Pending: Final approval unavailable"
                          : "Approve Student Registration"
                      }
                    >
                      {registration.payment_status === "verified" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {registration.payment_status === "verified"
                          ? "Approve Registration"
                          : "Payment Pending (Approval Unavailable)"}
                      </span>
                    </button>

                    <button
                      onClick={() => setStudentAction("reject")}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Registration
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0A2047]">
                        Confirm: {studentAction === "approve" ? "Approve Student" : "Reject Student"}
                      </span>
                      <button
                        onClick={() => setStudentAction(null)}
                        className="text-xs text-[#64748B] hover:text-[#172033] font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {studentAction === "reject" && (
                      <div>
                        <label className="block text-xs font-bold text-rose-950 mb-1">
                          Rejection Reason <span className="text-rose-600">* (Mandatory)</span>
                        </label>
                        <select
                          value={studentReason}
                          onChange={(e) => setStudentReason(e.target.value)}
                          className="w-full p-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white mb-2 text-[#172033] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        >
                          <option value="">-- Select reason --</option>
                          <option value="Student ID not found in university ERP database">
                            Student ID not found in university ERP database
                          </option>
                          <option value="Mismatch between declared school/program and official records">
                            Mismatch between declared school/program and official records
                          </option>
                          <option value="Student is not currently in active academic standing">
                            Student is not currently in active academic standing
                          </option>
                          <option value="Other">Other (specify below)</option>
                        </select>
                        {studentReason === "Other" && (
                          <input
                            type="text"
                            placeholder="Enter custom rejection reason..."
                            onChange={(e) => setStudentReason(e.target.value)}
                            className="w-full p-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Internal Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        placeholder="Internal notes for audit log..."
                        className="w-full p-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleStudentVerify}
                        disabled={isSubmittingStudent}
                        className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-2xs ${
                          studentAction === "approve"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        }`}
                      >
                        {isSubmittingStudent
                          ? "Saving..."
                          : studentAction === "approve"
                          ? "Confirm & Verify Student"
                          : "Confirm & Reject Student"}
                      </button>
                      <button
                        onClick={() => setStudentAction(null)}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:bg-[#E2E8F0] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 sm:px-6 bg-[#F5F7FA] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <span>Registration ID: <code className="font-mono text-[#0A2047] font-semibold">{registration.id}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
