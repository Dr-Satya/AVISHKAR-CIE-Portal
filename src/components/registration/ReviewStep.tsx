import React from "react";
import { StudentRegistrationInput, RegistrationValidationErrors } from "@/types/registration";
import { LEADERSHIP_INTEREST_OPTIONS } from "@/config/academic";
import { Edit2, Sparkles, AlertCircle, Briefcase, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
  formData: StudentRegistrationInput;
  errors?: RegistrationValidationErrors;
  onChange?: (field: keyof StudentRegistrationInput, value: any) => void;
  onEditStep: (step: 1 | 2 | 3) => void;
  onProceedToPayment: () => void;
}

export function ReviewStep({
  formData,
  errors = {},
  onChange,
  onEditStep,
}: ReviewStepProps) {
  // Check if student provided any previous work information
  const hasPreviousWork = Boolean(
    (formData.previousWorkDescription && formData.previousWorkDescription.trim()) ||
    (formData.projectName && formData.projectName.trim()) ||
    (formData.projectRole && formData.projectRole.trim()) ||
    (formData.technologiesUsed && formData.technologiesUsed.trim()) ||
    (formData.projectLink && formData.projectLink.trim())
  );

  const isSafeUrl = (url?: string) => {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E4F2] pb-3">
        <h3 className="text-[20px] font-normal text-[#174789]">Club Engagement &amp; Review</h3>
        <p className="text-xs text-[#475569] mt-0.5">
          Tell us about your interests in AVISHKAR and verify your registration details.
        </p>
      </div>

      {/* Club Engagement Questions */}
      <div className="rounded-xl border border-[#D9E4F2] bg-white p-5 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#D9E4F2]/70 pb-3">
          <Sparkles className="w-4 h-4 text-[#0D9488]" />
          <span className="text-xs font-medium uppercase tracking-wider text-[#0D9488]">
            Club Engagement Questions
          </span>
        </div>

        {/* 1. Motivation: "Why do you want to join AVISHKAR?" */}
        <div className="space-y-1.5">
          <label
            htmlFor="reasonForJoining"
            className="block text-sm font-medium text-[#174789]"
          >
            Why do you want to join AVISHKAR? <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <textarea
              id="reasonForJoining"
              name="reasonForJoining"
              rows={3}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.reasonForJoining)}
              aria-describedby={errors.reasonForJoining ? "reasonForJoining-error" : undefined}
              placeholder="Share what excites you about AVISHKAR, science, technology, or club projects (at least 10 characters)..."
              value={formData.reasonForJoining || ""}
              onChange={(e) => onChange && onChange("reasonForJoining", e.target.value)}
              className={cn(
                "w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#153D73] placeholder:text-slate-400 bg-white transition-all focus:outline-none focus:ring-2",
                errors.reasonForJoining
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-[#D9E4F2] hover:border-slate-300 focus:border-[#2563EB] focus:ring-blue-100"
              )}
            />
          </div>
          {errors.reasonForJoining && (
            <p id="reasonForJoining-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.reasonForJoining}</span>
            </p>
          )}
        </div>

        {/* 2. Leadership Interest: "Are you interested in leadership roles within AVISHKAR?" */}
        <div className="space-y-1.5">
          <label
            htmlFor="leadershipInterest"
            className="block text-sm font-medium text-[#174789]"
          >
            Are you interested in leadership roles within AVISHKAR? <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="flex items-center gap-3 pt-1">
            {LEADERSHIP_INTEREST_OPTIONS.map((option) => {
              const isSelected = formData.leadershipInterest === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChange && onChange("leadershipInterest", option)}
                  className={cn(
                    "flex-1 sm:flex-initial sm:px-6 py-2.5 rounded-lg text-sm font-medium border text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-100",
                    isSelected
                      ? "bg-[#2563EB] text-white border-[#2563EB] shadow-2xs"
                      : "bg-white text-[#334155] border-[#D9E4F2] hover:bg-[#EFF6FF] hover:border-blue-200"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {errors.leadershipInterest && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.leadershipInterest}</span>
            </p>
          )}
        </div>
      </div>

      {/* Summary Section 1: Personal Details */}
      <div className="rounded-xl border border-[#D9E4F2] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#D9E4F2]/70 pb-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-[#0D9488]">
            1. Personal Details
          </span>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-5 gap-y-3.5 sm:gap-y-4 text-xs">
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Full Name</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.studentName || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Email Address</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.email || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Contact Number</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.contactNumber || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Gender</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.gender || "Not specified"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Date of Birth</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.dob || "Not specified"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Summary Section 2: Academic Details */}
      <div className="rounded-xl border border-[#D9E4F2] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#D9E4F2]/70 pb-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-[#0D9488]">
            2. Academic Details (GD Goenka University)
          </span>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-3.5 sm:gap-y-4 text-xs">
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Enrolment / Student ID</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm font-mono break-words [overflow-wrap:anywhere]">
              {formData.studentId || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">School</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.school || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Department / Program</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.program || formData.course || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#475569] font-medium">Year of Joining</dt>
            <dd className="text-[#174789] font-medium mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.yearOfJoining || "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Summary Section 3: Previous Work / Startup Details (Optional) */}
      <div className="rounded-xl border border-[#D9E4F2] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#D9E4F2]/70 pb-2.5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#0D9488]">
              3. Previous Work / Startup Details <span className="text-[#64748B] font-normal lowercase">(optional)</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {hasPreviousWork ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-3.5 sm:gap-y-4 text-xs">
            {formData.projectName && (
              <div className="min-w-0">
                <dt className="text-[#475569] font-medium">Project or Startup Name</dt>
                <dd className="text-[#174789] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
                  {formData.projectName}
                </dd>
              </div>
            )}
            {formData.projectRole && (
              <div className="min-w-0">
                <dt className="text-[#475569] font-medium">Your Role</dt>
                <dd className="text-[#174789] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
                  {formData.projectRole}
                </dd>
              </div>
            )}
            {formData.technologiesUsed && (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-[#475569] font-medium">Technologies Used</dt>
                <dd className="text-[#174789] mt-0.5 text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200 break-words [overflow-wrap:anywhere]">
                  {formData.technologiesUsed}
                </dd>
              </div>
            )}
            {formData.previousWorkDescription && (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-[#475569] font-medium">Previous Work / Project Details</dt>
                <dd className="text-[#153D73] mt-0.5 text-xs whitespace-pre-wrap bg-slate-50/50 p-2.5 rounded border border-[#D9E4F2] leading-relaxed break-words [overflow-wrap:anywhere]">
                  {formData.previousWorkDescription}
                </dd>
              </div>
            )}
            {formData.projectLink && (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-[#475569] font-medium">Project Link / Portfolio URL</dt>
                <dd className="mt-0.5 text-xs break-words [overflow-wrap:anywhere]">
                  {isSafeUrl(formData.projectLink) ? (
                    <a
                      href={formData.projectLink.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1D4ED8] underline font-medium"
                    >
                      <span className="break-all">{formData.projectLink.trim()}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[#153D73] font-mono">{formData.projectLink.trim()}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-xs text-[#64748B] italic py-1">
            Not provided (Optional section skipped).
          </p>
        )}
      </div>
    </div>
  );
}
