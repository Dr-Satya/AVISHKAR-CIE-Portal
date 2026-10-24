"use client";

import React, { useRef, useState, useEffect } from "react";
import { StudentRegistrationInput, RegistrationValidationErrors } from "@/types/registration";
import {
  paymentConfig,
  isOfficialPaymentConfigured,
} from "@/config/payment";
import {
  CreditCard,
  QrCode,
  UploadCloud,
  FileCheck,
  X,
  AlertCircle,
  Calendar,
  Hash,
  FileText,
  Lock,
} from "lucide-react";

interface PaymentStepProps {
  formData: StudentRegistrationInput;
  errors: RegistrationValidationErrors;
  onChange: (field: keyof StudentRegistrationInput, value: any) => void;
  onFileSelect: (file: File | null) => void;
}

export function PaymentStep({
  formData,
  errors,
  onChange,
  onFileSelect,
}: PaymentStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const isConfigured = isOfficialPaymentConfigured();

  // Generate preview for image files
  useEffect(() => {
    if (formData.receiptFile && formData.receiptFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(formData.receiptFile);
      setFilePreview(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFilePreview(null);
    }
  }, [formData.receiptFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isConfigured) return;
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <h3 className="text-xl font-bold text-[#0A2047]">
          Registration Fee &amp; Payment Proof
        </h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          AVISHKAR 2026 official payment instructions, registration fee, and transaction proof submission.
        </p>
      </div>

      {/* Main Payment Section: AVISHKAR Official Payment QR */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Section Header with Official Label and Prominent Fee */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-[#0A2047] text-white font-bold text-xs tracking-wider uppercase shadow-xs flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{paymentConfig.qrSectionLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#0A2047]/5 border border-[#0A2047]/15 px-3.5 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#64748B]">Registration Fee:</span>
            <span className="text-xl font-bold text-[#0A2047]">
              ₹{paymentConfig.feeAmount}
            </span>
          </div>
        </div>

        {/* Payment Guidance & Instructions Banner */}
        <div className="p-3.5 bg-[#0A2047]/5 rounded-lg border border-[#0A2047]/15 text-[#0A2047] font-semibold text-sm flex items-center justify-center gap-2.5 shadow-xs text-center">
          <QrCode className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <span className="leading-snug">
            Scan the QR code to pay the registration fee of ₹500.
          </span>
        </div>

        {/* QR Display and UPI App Guidance Container */}
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="bg-[#F5F7FA] p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentConfig.qrCodeUrl}
              alt="AVISHKAR Official Payment QR Code"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg bg-white p-1 border border-[#E2E8F0]"
            />
            <span className="text-[11px] font-semibold text-[#172033] mt-3 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
              Scan with PhonePe, GPay, Paytm, BHIM, or any UPI app
            </span>
          </div>
        </div>
      </div>

      {/* Payment Proof Input Fields */}
      <div
        className={`rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-5 ${
          !isConfigured ? "opacity-60 pointer-events-none select-none" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0A2047]">
            Transaction Details &amp; Proof
          </span>
          {!isConfigured && (
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" /> Submissions Locked
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Transaction ID / UTR */}
          <div className="space-y-1.5">
            <label
              htmlFor="transactionId"
              className="text-xs font-semibold text-[#0A2047] flex items-center gap-1.5"
            >
              <Hash className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Transaction ID / UTR No. <span className="text-red-500">*</span></span>
            </label>
            <input
              id="transactionId"
              type="text"
              disabled={!isConfigured}
              value={formData.transactionId || ""}
              onChange={(e) => onChange("transactionId", e.target.value)}
              placeholder="Enter transaction ID / UTR number"
              className={`w-full h-11 px-3.5 py-2.5 text-sm rounded-lg border font-mono transition-all focus:outline-none focus:ring-2 focus:ring-[#0A2047]/15 text-[#172033] placeholder:text-[#94A3B8] bg-white ${
                errors.transactionId
                  ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500"
                  : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047]"
              }`}
            />
            {errors.transactionId ? (
              <p className="text-xs text-red-600 flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.transactionId}</span>
              </p>
            ) : (
              <p className="text-[11px] text-[#64748B]">
                12-digit reference number provided by your UPI application.
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="paymentDate"
              className="text-xs font-semibold text-[#0A2047] flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Payment Date <span className="text-red-500">*</span></span>
            </label>
            <input
              id="paymentDate"
              type="date"
              disabled={!isConfigured}
              max={todayStr}
              value={formData.paymentDate || ""}
              onChange={(e) => onChange("paymentDate", e.target.value)}
              className={`w-full h-11 px-3.5 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#0A2047]/15 text-[#172033] bg-white ${
                errors.paymentDate
                  ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500"
                  : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047]"
              }`}
            />
            {errors.paymentDate ? (
              <p className="text-xs text-red-600 flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.paymentDate}</span>
              </p>
            ) : (
              <p className="text-[11px] text-[#64748B]">
                Date of successful transaction.
              </p>
            )}
          </div>
        </div>

        {/* Receipt Upload Zone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#0A2047] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Upload Payment Receipt / Proof <span className="text-red-500">*</span></span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            disabled={!isConfigured}
            accept={paymentConfig.allowedExtensions.join(",")}
            onChange={handleFileChange}
            className="hidden"
            id="receipt-file-input"
          />

          {!formData.receiptFile ? (
            <div
              onClick={() => isConfigured && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isConfigured
                  ? "cursor-pointer hover:border-[#0A2047] hover:bg-[#F5F7FA]"
                  : "cursor-not-allowed bg-[#F5F7FA]"
              } ${
                errors.receiptFile
                  ? "border-red-400 bg-red-50/10"
                  : "border-[#E2E8F0] bg-[#F5F7FA]/60"
              }`}
            >
              <UploadCloud
                className={`w-10 h-10 mx-auto mb-2 ${
                  errors.receiptFile ? "text-red-500" : "text-[#0A2047]"
                }`}
              />
              <p className="text-sm font-semibold text-[#0A2047]">
                Click to browse or drag and drop your receipt file
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Accepted formats: JPG, PNG, WebP, PDF (Max {paymentConfig.maxFileSizeMB} MB)
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {filePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={filePreview}
                    alt="Receipt thumbnail"
                    className="w-12 h-12 object-cover rounded-lg border border-emerald-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <FileCheck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#172033] line-clamp-1">
                    {formData.receiptFile.name}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {(formData.receiptFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                    {formData.receiptFile.type || "Document"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errors.receiptFile && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.receiptFile}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
