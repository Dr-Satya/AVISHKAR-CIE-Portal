"use client";

import React, { useState, useEffect } from "react";
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
  Rocket,
  Download,
  Eye,
  RefreshCw,
  Loader2,
  Send,
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
  const [activeTab, setActiveTab] = useState<"preview" | "academic" | "startup" | "audit">("preview");

  // Document Preview Loading & Verification State
  const [previewIdCard, setPreviewIdCard] = useState(true);
  const [idCardLoading, setIdCardLoading] = useState(false);
  const [idCardLoaded, setIdCardLoaded] = useState(false);
  const [idCardError, setIdCardError] = useState<string | null>(null);

  const [previewReceipt, setPreviewReceipt] = useState(true);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptLoaded, setReceiptLoaded] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Mandatory Dual Confirmation Checkboxes
  const [idCardConfirmed, setIdCardConfirmed] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  // Approval Submission State
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Rejection State
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Email Notification Audit Logs State
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);
  const [emailActionNotice, setEmailActionNotice] = useState<string | null>(null);

  const fetchEmailLogs = async (regTarget?: RegistrationRecord | null) => {
    const target = regTarget || registration;
    if (!target) return;
    setEmailLogsLoading(true);
    try {
      const regId = target.registration_number || target.id;
      const res = await fetch(`/api/admin/notifications/email?registrationNumber=${encodeURIComponent(regId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setEmailLogs(data.notifications);
        }
      }
    } catch {
      // ignore
    } finally {
      setEmailLogsLoading(false);
    }
  };

  const handleRetryEmail = async (notificationId: string) => {
    setRetryingEmailId(notificationId);
    setEmailActionNotice(null);
    try {
      const res = await fetch("/api/admin/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailActionNotice(data.message || "Email re-dispatched successfully.");
        fetchEmailLogs();
      } else {
        setEmailActionNotice(data.error || "Failed to retry email dispatch.");
      }
    } catch (err: any) {
      setEmailActionNotice(err.message || "Failed to retry email dispatch.");
    } finally {
      setRetryingEmailId(null);
    }
  };

  // Reset or initialize state when a registration is opened
  useEffect(() => {
    if (registration) {
      const isAlreadyVerified =
        registration.student_verification_status === "verified" &&
        registration.payment_status === "verified";

      setPreviewIdCard(true);
      setIdCardLoading(Boolean(registration.id_card_file_path));
      setIdCardLoaded(false);
      setIdCardError(
        registration.id_card_file_path ? null : "No Student ID card document was uploaded for this registration."
      );

      setPreviewReceipt(true);
      setReceiptLoading(Boolean(registration.receipt_file_path));
      setReceiptLoaded(false);
      setReceiptError(
        registration.receipt_file_path ? null : "No payment receipt document was uploaded for this registration."
      );

      setIdCardConfirmed(isAlreadyVerified);
      setPaymentConfirmed(isAlreadyVerified);
      setApprovalNotes("");
      setApprovalSuccess(false);
      setApprovalError(null);

      setShowRejectForm(false);
      setRejectionReason("");
      setCustomRejectionReason("");
      setRejectionNotes("");
      setIsRejecting(false);
      setRejectionError(null);
      setEmailActionNotice(null);
      setActiveTab("preview");
      fetchEmailLogs(registration);
    }
  }, [registration]);

  // Active server-side document verification to detect corrupted, truncated, or missing files
  useEffect(() => {
    if (!registration || !isOpen) return;

    if (registration.receipt_file_path) {
      setReceiptLoading(true);
      fetch(`/api/admin/receipt?path=${encodeURIComponent(registration.receipt_file_path)}`, {
        method: "GET",
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setReceiptError(data?.error || "Payment receipt not found or inaccessible in private storage.");
            setReceiptLoaded(false);
          } else {
            setReceiptLoaded(true);
            setReceiptError(null);
          }
        })
        .catch(() => {
          setReceiptError("Payment receipt not found or inaccessible in private storage.");
          setReceiptLoaded(false);
        })
        .finally(() => {
          setReceiptLoading(false);
        });
    }

    if (registration.id_card_file_path) {
      setIdCardLoading(true);
      fetch(`/api/admin/id-card?path=${encodeURIComponent(registration.id_card_file_path)}`, {
        method: "GET",
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setIdCardError(data?.error || "Student ID card not found or inaccessible in private storage.");
            setIdCardLoaded(false);
          } else {
            setIdCardLoaded(true);
            setIdCardError(null);
          }
        })
        .catch(() => {
          setIdCardError("Student ID card not found or inaccessible in private storage.");
          setIdCardLoaded(false);
        })
        .finally(() => {
          setIdCardLoading(false);
        });
    }
  }, [registration?.id, registration?.receipt_file_path, registration?.id_card_file_path, isOpen]);

  if (!isOpen || !registration) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const paymentMeta = PAYMENT_STATUS_LABELS[registration.payment_status] || {
    label: registration.payment_status,
    variant: "neutral",
  };

  const studentMeta = STUDENT_STATUS_LABELS[registration.student_verification_status] || {
    label: registration.student_verification_status,
    variant: "neutral",
  };

  const secureReceiptUrl = registration.receipt_file_path
    ? `/api/admin/receipt?path=${encodeURIComponent(registration.receipt_file_path)}`
    : "";

  const secureIdCardUrl = registration.id_card_file_path
    ? `/api/admin/id-card?path=${encodeURIComponent(registration.id_card_file_path)}`
    : "";

  const isOverallApproved =
    registration.payment_status === "verified" &&
    registration.student_verification_status === "verified";
  const isOverallRejected =
    registration.payment_status === "rejected" ||
    registration.student_verification_status === "rejected";

  const isApprovalReady =
    idCardLoaded &&
    receiptLoaded &&
    idCardConfirmed &&
    paymentConfirmed &&
    !idCardError &&
    !receiptError &&
    !isApproving;

  // Handle Dual Approval
  const handleApproveStudent = async () => {
    if (!isApprovalReady) return;

    try {
      setIsApproving(true);
      setApprovalError(null);

      const res = await fetch("/api/admin/registrations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          idCardConfirmed: true,
          paymentConfirmed: true,
          notes: approvalNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApprovalError(data.error || "Failed to approve registration.");
        return;
      }

      setApprovalSuccess(true);
      setTimeout(() => {
        onUpdateSuccess();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during student approval.";
      setApprovalError(msg);
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Rejection
  const handleRejectStudent = async () => {
    const finalReason =
      rejectionReason === "Other" ? customRejectionReason.trim() : rejectionReason.trim();

    if (!finalReason) {
      setRejectionError("A rejection reason is strictly required.");
      return;
    }

    try {
      setIsRejecting(true);
      setRejectionError(null);

      const res = await fetch("/api/admin/registrations/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          rejectionReason: finalReason,
          notes: rejectionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRejectionError(data.error || "Failed to reject registration.");
        return;
      }

      onUpdateSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during student rejection.";
      setRejectionError(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  const isIdCardPdf =
    registration.id_card_mime_type === "application/pdf" ||
    registration.id_card_file_path?.toLowerCase().endsWith(".pdf");

  const isReceiptPdf =
    registration.receipt_mime_type === "application/pdf" ||
    registration.receipt_file_path?.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#0A2047]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[94vh]">
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

          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-block px-2.5 py-1 rounded text-xs font-bold border ${
                isOverallApproved
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                  : isOverallRejected
                  ? "bg-rose-500/20 text-rose-200 border-rose-400/40"
                  : "bg-amber-500/20 text-amber-200 border-amber-400/40"
              }`}
            >
              {isOverallApproved
                ? "APPROVED"
                : isOverallRejected
                ? "REJECTED"
                : "PENDING VERIFICATION"}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 border-b border-[#E2E8F0] bg-[#F8FAFC] flex gap-4 shrink-0 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("preview")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "preview"
                ? "border-[#D4AF37] text-[#0A2047] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#0A2047]"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Document Preview &amp; Approval</span>
            {(!isOverallApproved && !isOverallRejected) && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("academic")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "academic"
                ? "border-[#D4AF37] text-[#0A2047] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#0A2047]"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
            <span>Academic &amp; Student Info</span>
          </button>

          <button
            onClick={() => setActiveTab("startup")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "startup"
                ? "border-[#D4AF37] text-[#0A2047] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#0A2047]"
            }`}
          >
            <Rocket className="w-4 h-4 text-[#D4AF37]" />
            <span>Startup &amp; Innovation</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "audit"
                ? "border-[#D4AF37] text-[#0A2047] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#0A2047]"
            }`}
          >
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            <span>Audit History</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: Document Preview & Approval Workflow (MAIN FOCUS) */}
          {activeTab === "preview" && (
            <div className="space-y-6">
              {/* Student Overview Strip */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#64748B] font-semibold block">University</span>
                    <strong className="text-[#0A2047]">GD Goenka University</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] font-semibold block">Admission No</span>
                    <strong className="font-mono text-[#172033]">{registration.admission_number || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] font-semibold block">School &amp; Program</span>
                    <span className="text-[#172033] font-medium truncate block" title={`${registration.school || ""} - ${registration.program || ""}`}>
                      {registration.program || registration.school || "Standard"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] font-semibold block">Class Year</span>
                    <span className="text-[#172033] font-medium">Class of {registration.year_of_joining || "2026"}</span>
                  </div>
                </div>
              </div>

              {/* TWO DOCUMENT PREVIEW SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. STUDENT ID CARD PREVIEW CARD */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="px-4 py-3 bg-[#0A2047] text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Student ID Card
                      </h3>
                    </div>
                    {idCardLoaded ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Loaded for Review
                      </span>
                    ) : idCardError ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        Inaccessible
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-300 font-medium">
                        Pending Preview
                      </span>
                    )}
                  </div>

                  {/* Card Action & Details Bar */}
                  <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="text-[#64748B] font-mono truncate max-w-[180px]" title={registration.id_card_file_name || "id_card"}>
                      {registration.id_card_file_name || "College ID Card"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewIdCard(true);
                          setIdCardLoading(true);
                          setIdCardError(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0A2047] text-white hover:bg-[#132E57] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Preview Student ID Card</span>
                      </button>
                      {registration.id_card_file_path && (
                        <a
                          href={secureIdCardUrl}
                          download={registration.id_card_file_name || "student_id_card"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#0A2047] transition-colors cursor-pointer"
                          title="Download Student ID Card"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* ID Card Viewer Area */}
                  <div className="relative flex-1 min-h-[260px] max-h-[360px] bg-[#0A2047]/5 p-4 flex flex-col items-center justify-center overflow-hidden">
                    {!registration.id_card_file_path ? (
                      <div className="text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-rose-800">
                          Student ID card not found or inaccessible in private storage.
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          No college ID card was uploaded for this registration record.
                        </p>
                      </div>
                    ) : idCardError ? (
                      <div className="text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-rose-800">
                          Student ID card not found or inaccessible in private storage.
                        </p>
                        <p className="text-[11px] text-rose-700 font-medium max-w-sm mx-auto">
                          {idCardError}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Approval is blocked until a valid document is provided.
                        </p>
                        <button
                          onClick={() => {
                            setIdCardError(null);
                            setIdCardLoading(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Loading</span>
                        </button>
                      </div>
                    ) : previewIdCard ? (
                      <div className="w-full h-full flex items-center justify-center relative">
                        {idCardLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-2xs z-10">
                            <Loader2 className="w-6 h-6 text-[#0A2047] animate-spin" />
                          </div>
                        )}

                        {isIdCardPdf ? (
                          <iframe
                            src={secureIdCardUrl}
                            title="Student ID Card PDF"
                            className="w-full h-[320px] rounded-lg border border-[#E2E8F0] bg-white"
                            onLoad={() => {
                              setIdCardLoaded(true);
                              setIdCardLoading(false);
                              setIdCardError(null);
                            }}
                            onError={() => {
                              setIdCardError("Student ID card not found or inaccessible in private storage.");
                              setIdCardLoaded(false);
                              setIdCardLoading(false);
                            }}
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={secureIdCardUrl}
                            alt="Student College ID Card"
                            className="max-h-[320px] w-auto max-w-full rounded-lg object-contain bg-white shadow-2xs border border-[#E2E8F0]"
                            onLoad={() => {
                              setIdCardLoaded(true);
                              setIdCardLoading(false);
                              setIdCardError(null);
                            }}
                            onError={() => {
                              setIdCardError("Student ID card not found or inaccessible in private storage.");
                              setIdCardLoaded(false);
                              setIdCardLoading(false);
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <FileText className="w-10 h-10 text-[#0A2047] mx-auto opacity-60" />
                        <p className="text-xs font-semibold text-[#172033]">
                          Click &quot;Preview Student ID Card&quot; to inspect document
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ID Card Footer Controls */}
                  <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">
                      File: {registration.id_card_mime_type || "Image / PDF"}
                    </span>
                    {registration.id_card_file_path && (
                      <a
                        href={secureIdCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0A2047] hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 2. PAYMENT RECEIPT PREVIEW CARD */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="px-4 py-3 bg-[#0A2047] text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Payment Receipt
                      </h3>
                    </div>
                    {receiptLoaded ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Loaded for Review
                      </span>
                    ) : receiptError ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        Inaccessible
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-300 font-medium">
                        Pending Preview
                      </span>
                    )}
                  </div>

                  {/* Card Amount & UTR Details */}
                  <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#64748B]">Amount:</span>
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ₹{registration.fee_amount ?? 100}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#64748B]">UTR:</span>
                      <code className="bg-white px-2 py-0.5 rounded border border-[#E2E8F0] font-mono text-[11px] font-bold text-[#0A2047]">
                        {registration.transaction_id || "NOT PROVIDED"}
                      </code>
                      {registration.transaction_id && (
                        <button
                          onClick={() => copyToClipboard(registration.transaction_id)}
                          className="p-1 rounded bg-white hover:bg-[#F0F3F8] border border-[#E2E8F0] text-[#0A2047] transition-colors cursor-pointer"
                          title="Copy UTR ID"
                        >
                          {copiedUtr ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Action Bar */}
                  <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="text-[#64748B] text-[11px]">
                      Date: {registration.payment_date || "Not specified"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewReceipt(true);
                          setReceiptLoading(true);
                          setReceiptError(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0A2047] text-white hover:bg-[#132E57] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Preview Payment Receipt</span>
                      </button>
                      {registration.receipt_file_path && (
                        <a
                          href={secureReceiptUrl}
                          download={registration.receipt_file_name || "payment_receipt"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#0A2047] transition-colors cursor-pointer"
                          title="Download Payment Receipt"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Receipt Viewer Area */}
                  <div className="relative flex-1 min-h-[260px] max-h-[360px] bg-[#0A2047]/5 p-4 flex flex-col items-center justify-center overflow-hidden">
                    {!registration.receipt_file_path ? (
                      <div className="text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-rose-800">
                          Payment receipt not found or inaccessible in private storage.
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          No receipt was uploaded for this registration record.
                        </p>
                      </div>
                    ) : receiptError ? (
                      <div className="text-center p-6 space-y-2">
                        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-rose-800">
                          Payment receipt not found or inaccessible in private storage.
                        </p>
                        <p className="text-[11px] text-rose-700 font-medium max-w-sm mx-auto">
                          {receiptError}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Approval is blocked until a valid document is provided.
                        </p>
                        <button
                          onClick={() => {
                            setReceiptError(null);
                            setReceiptLoading(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Loading</span>
                        </button>
                      </div>
                    ) : previewReceipt ? (
                      <div className="w-full h-full flex items-center justify-center relative">
                        {receiptLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-2xs z-10">
                            <Loader2 className="w-6 h-6 text-[#0A2047] animate-spin" />
                          </div>
                        )}

                        {isReceiptPdf ? (
                          <iframe
                            src={secureReceiptUrl}
                            title="Payment Receipt PDF"
                            className="w-full h-[320px] rounded-lg border border-[#E2E8F0] bg-white"
                            onLoad={() => {
                              setReceiptLoaded(true);
                              setReceiptLoading(false);
                              setReceiptError(null);
                            }}
                            onError={() => {
                              setReceiptError("Payment receipt not found or inaccessible in private storage.");
                              setReceiptLoaded(false);
                              setReceiptLoading(false);
                            }}
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={secureReceiptUrl}
                            alt="Payment Receipt Proof"
                            className="max-h-[320px] w-auto max-w-full rounded-lg object-contain bg-white shadow-2xs border border-[#E2E8F0]"
                            onLoad={() => {
                              setReceiptLoaded(true);
                              setReceiptLoading(false);
                              setReceiptError(null);
                            }}
                            onError={() => {
                              setReceiptError("Payment receipt not found or inaccessible in private storage.");
                              setReceiptLoaded(false);
                              setReceiptLoading(false);
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <CreditCard className="w-10 h-10 text-[#0A2047] mx-auto opacity-60" />
                        <p className="text-xs font-semibold text-[#172033]">
                          Click &quot;Preview Payment Receipt&quot; to inspect document
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Receipt Footer Controls */}
                  <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">
                      File: {registration.receipt_mime_type || "Image / PDF"}
                    </span>
                    {registration.receipt_file_path && (
                      <a
                        href={secureReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0A2047] hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: FINAL APPROVAL & REJECTION ACTION CONSOLE */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#0A2047] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      Verification Confirmation &amp; Final Decision
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Both required verification checks must be completed and confirmed before issuing final approval.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        idCardLoaded && receiptLoaded
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {idCardLoaded && receiptLoaded
                        ? "Both Documents Loaded"
                        : "Documents Required"}
                    </span>
                  </div>
                </div>

                {/* MANDATORY CONFIRMATION CHECKBOXES */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E2E8F0]">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={idCardConfirmed}
                      disabled={!idCardLoaded || isApproving || isRejecting}
                      onChange={(e) => setIdCardConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#0A2047] focus:ring-[#0A2047] border-[#CBD5E1] cursor-pointer disabled:opacity-40"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[#172033]">
                        I have reviewed the student ID card and confirmed the student&apos;s college affiliation.
                      </span>
                      <p className="text-[#64748B] text-[11px] mt-0.5">
                        Confirms active enrollment at GD Goenka University in {registration.school || "declared school"}.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-[#F1F5F9]">
                    <input
                      type="checkbox"
                      checked={paymentConfirmed}
                      disabled={!receiptLoaded || isApproving || isRejecting}
                      onChange={(e) => setPaymentConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#0A2047] focus:ring-[#0A2047] border-[#CBD5E1] cursor-pointer disabled:opacity-40"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[#172033]">
                        I have reviewed the payment receipt and confirmed the payment.
                      </span>
                      <p className="text-[#64748B] text-[11px] mt-0.5">
                        Confirms receipt of ₹{registration.fee_amount ?? 100} matching transaction reference {registration.transaction_id || "UTR"}.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Feedback & Error Banners */}
                {approvalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{approvalError}</span>
                  </div>
                )}

                {approvalSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      Student registration and payment successfully approved! Refreshing table...
                    </span>
                  </div>
                )}

                {/* Verification Guidance Note */}
                {!isApprovalReady && !approvalSuccess && (
                  <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {!idCardLoaded || !receiptLoaded
                        ? "Both documents must be previewed and loaded successfully before approval."
                        : !idCardConfirmed || !paymentConfirmed
                        ? "Both confirmation checkboxes must be verified to enable 'Approve Student'."
                        : ""}
                    </span>
                  </div>
                )}

                {/* ACTION BUTTONS ROW */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleApproveStudent}
                    disabled={!isApprovalReady || isApproving || approvalSuccess}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Student</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    disabled={isApproving || approvalSuccess}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Student</span>
                  </button>

                  {isOverallApproved && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      ✓ This student is currently marked as Approved &amp; Verified
                    </span>
                  )}
                </div>

                {/* EXPANDABLE REJECTION FORM */}
                {showRejectForm && (
                  <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                        Reject Student Registration
                      </span>
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="text-xs text-[#64748B] hover:text-[#172033] font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {rejectionError && (
                      <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-lg text-xs">
                        {rejectionError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-rose-950 mb-1">
                        Rejection Reason <span className="text-rose-600">* (Mandatory)</span>
                      </label>
                      <select
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full p-2.5 text-xs border border-rose-200 rounded-xl bg-white text-[#172033] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      >
                        <option value="">-- Select mandatory rejection reason --</option>
                        <option value="Student ID card not found or inaccessible in private storage">
                          Student ID card not found or inaccessible in private storage
                        </option>
                        <option value="Student ID card is illegible or does not match applicant">
                          Student ID card is illegible or does not match applicant
                        </option>
                        <option value="Payment receipt not found or inaccessible in private storage">
                          Payment receipt not found or inaccessible in private storage
                        </option>
                        <option value="UTR Reference ID not found on university bank statement">
                          UTR Reference ID not found on university bank statement
                        </option>
                        <option value="Amount paid does not match required ₹100 registration fee">
                          Amount paid does not match required ₹100 registration fee
                        </option>
                        <option value="Receipt screenshot is blurry, incomplete, or altered">
                          Receipt screenshot is blurry, incomplete, or altered
                        </option>
                        <option value="Applicant does not have active enrollment in GD Goenka University">
                          Applicant does not have active enrollment in GD Goenka University
                        </option>
                        <option value="Duplicate registration or transaction reference detected">
                          Duplicate registration or transaction reference detected
                        </option>
                        <option value="Other">Other (specify custom reason below)</option>
                      </select>

                      {rejectionReason === "Other" && (
                        <input
                          type="text"
                          placeholder="Enter specific rejection reason..."
                          value={customRejectionReason}
                          onChange={(e) => setCustomRejectionReason(e.target.value)}
                          className="w-full mt-2 p-2.5 text-xs border border-rose-200 rounded-xl bg-white text-[#172033] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Internal Review Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Internal audit notes..."
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                        className="w-full p-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleRejectStudent}
                        disabled={isRejecting}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isRejecting ? "Rejecting..." : "Confirm & Mark Rejected"}
                      </button>
                      <button
                        onClick={() => setShowRejectForm(false)}
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

          {/* TAB 2: Complete Academic & Personal Information */}
          {activeTab === "academic" && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0A2047]" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Full Name</label>
                    <p className="text-sm font-bold text-[#172033]">{registration.student_name}</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Student ID / Roll No</label>
                    <p className="text-sm font-mono font-bold text-[#0A2047]">{registration.student_id}</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Email Address</label>
                    <p className="text-sm text-[#172033] font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span>{registration.email || "Not specified"}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Contact Number</label>
                    <p className="text-sm text-[#172033] font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span>{registration.contact_number || "Not specified"}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Gender</label>
                    <p className="text-sm text-[#172033] font-medium">{registration.gender || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Date of Birth</label>
                    <p className="text-sm text-[#172033] font-medium">{registration.dob || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Enrollment */}
              <div>
                <h3 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0A2047]" /> Official Academic Enrollment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Institution</label>
                    <p className="text-sm font-bold text-[#0A2047]">GD Goenka University</p>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B] font-semibold">Admission Number</label>
                    <p className="text-sm font-mono font-bold text-[#0A2047]">{registration.admission_number || "—"}</p>
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
                <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
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
            </div>
          )}

          {/* TAB 3: Startup & Incubation Details */}
          {activeTab === "startup" && (
            <div className="space-y-4">
              {Boolean(
                (registration.has_startup_or_project && registration.has_startup_or_project !== "No, not yet.") ||
                (registration.startup_title && registration.startup_title.trim()) ||
                (registration.project_name && registration.project_name.trim()) ||
                (registration.previous_work_description && registration.previous_work_description.trim()) ||
                (registration.project_role && registration.project_role.trim())
              ) ? (
                <div className="space-y-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-xs">
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
                      <label className="text-[11px] text-[#64748B] font-semibold">Student&apos;s Role</label>
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
                            <span className="font-bold text-[#172033]">{member.fullName}</span>
                            <span className="text-[11px] font-semibold text-[#0A2047]">{member.roleInTeam}</span>
                          </div>
                        ))}
                      </div>
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
                <div className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] text-center">
                  No startup, incubation, or previous work specified in this submission.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Audit History */}
          {activeTab === "audit" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                <h4 className="font-bold text-[#0A2047] text-xs uppercase tracking-wider">
                  Registration Lifecycle Timestamps
                </h4>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Submitted Timestamp:</span>
                  <span className="font-mono text-[#172033]">
                    {new Date(registration.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Last Modified:</span>
                  <span className="font-mono text-[#172033]">
                    {registration.updated_at
                      ? new Date(registration.updated_at).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Payment Verified At:</span>
                  <span className="font-mono text-[#172033]">
                    {registration.verified_at
                      ? new Date(registration.verified_at).toLocaleString()
                      : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Student Identity Verified At:</span>
                  <span className="font-mono text-[#172033]">
                    {registration.student_verified_at
                      ? new Date(registration.student_verified_at).toLocaleString()
                      : "Pending"}
                  </span>
                </div>
              </div>

              {registration.admin_review_notes && (
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#0A2047] text-xs block mb-1">
                    Administrative Review Notes:
                  </span>
                  <pre className="text-[11px] font-mono text-[#172033] bg-white p-3 rounded-lg border border-[#E2E8F0] whitespace-pre-wrap">
                    {registration.admin_review_notes}
                  </pre>
                </div>
              )}

              {/* Automated Student Email Notifications Section */}
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#0A2047] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#0A2047]" />
                    <span>Automated Email Notifications</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => fetchEmailLogs()}
                    disabled={emailLogsLoading}
                    className="inline-flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#0A2047] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${emailLogsLoading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {emailActionNotice && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                    <span>{emailActionNotice}</span>
                    <button
                      type="button"
                      onClick={() => setEmailActionNotice(null)}
                      className="text-blue-600 hover:text-blue-900 font-bold ml-2 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {emailLogsLoading && emailLogs.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-xs text-[#64748B] gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A2047]" />
                    <span>Loading notification records...</span>
                  </div>
                ) : emailLogs.length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] text-center text-[#64748B] text-xs">
                    No email notification records recorded yet. Submissions and approval/rejection decisions automatically log delivery records here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {emailLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-3 bg-white rounded-lg border border-[#E2E8F0] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-[#0A2047] text-xs block">
                              {log.subject}
                            </span>
                            <span className="text-[11px] text-[#64748B] block mt-0.5">
                              To: <span className="font-mono">{log.recipientEmail}</span> &bull; {new Date(log.lastAttemptAt || log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            {log.status === "sent" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Sent (Resend)
                              </span>
                            ) : log.status === "simulated" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                Simulated (Sandbox)
                              </span>
                            ) : log.status === "failed" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-800 border border-red-200">
                                Delivery Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                {log.status}
                              </span>
                            )}
                          </div>
                        </div>

                        {log.errorMessage && (
                          <div className="text-[10px] text-red-700 bg-red-50/70 p-2 rounded border border-red-100 font-mono">
                            {log.errorMessage}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9] text-[10px] text-[#64748B]">
                          <span>Attempts: {log.attempts || 1} &bull; Provider: {log.provider}</span>
                          <button
                            type="button"
                            onClick={() => handleRetryEmail(log.id)}
                            disabled={retryingEmailId === log.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A2047]/5 hover:bg-[#0A2047]/10 text-[#0A2047] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {retryingEmailId === log.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Retrying...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Retry Dispatch</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 sm:px-6 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <span>
            Registration ID: <code className="font-mono text-[#0A2047] font-semibold">{registration.id}</code>
          </span>
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
