import React from "react";
import { StudentRegistrationInput, RegistrationValidationErrors } from "@/types/registration";
import { LEADERSHIP_INTEREST_OPTIONS } from "@/config/academic";
import { Edit2, Sparkles, AlertCircle, Briefcase, ExternalLink, FileText } from "lucide-react";
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
  // Check if student provided any previous work or startup information
  const hasPreviousWork = Boolean(
    (formData.hasStartupOrProject && formData.hasStartupOrProject !== "No, not yet.") ||
    (formData.startupTitle && formData.startupTitle.trim()) ||
    (formData.projectName && formData.projectName.trim()) ||
    (formData.startupDetails && formData.startupDetails.trim()) ||
    (formData.previousWorkDescription && formData.previousWorkDescription.trim()) ||
    (formData.studentRole && formData.studentRole.trim()) ||
    (formData.projectRole && formData.projectRole.trim()) ||
    (formData.technologiesUsed && formData.technologiesUsed.trim()) ||
    (formData.supportNeeded && formData.supportNeeded.length > 0) ||
    (formData.teamLeaderName && formData.teamLeaderName.trim()) ||
    (formData.projectLink && formData.projectLink.trim())
  );

  const isSafeUrl = (url?: string) => {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-3">
        <h3 className="text-xl font-bold text-[#0A2047]">Engagement &amp; Review</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Tell us about your interests in AVISHKAR and verify your registration details.
        </p>
      </div>

      {/* Engagement Questions */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0A2047]">
            Engagement Questions
          </span>
        </div>

        {/* 1. Motivation: "Why do you want to join AVISHKAR?" */}
        <div className="space-y-1.5">
          <label
            htmlFor="reasonForJoining"
            className="block text-sm font-semibold text-[#0A2047]"
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
              placeholder="Describe why you want to join AVISHKAR"
              value={formData.reasonForJoining || ""}
              onChange={(e) => onChange && onChange("reasonForJoining", e.target.value)}
              className={cn(
                "w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#172033] placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
                errors.reasonForJoining
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
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
            className="block text-sm font-semibold text-[#0A2047]"
          >
            Are you interested in leadership roles within AVISHKAR? <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="flex items-center gap-3 pt-1" role="radiogroup" aria-label="Leadership interest">
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
                    "flex-1 sm:flex-initial sm:px-6 h-11 rounded-lg text-sm font-semibold border text-center transition-all focus:outline-none focus:ring-2 focus:ring-[#0A2047]/20 cursor-pointer flex items-center justify-center gap-2",
                    isSelected
                      ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs"
                      : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F5F7FA] hover:border-slate-300"
                  )}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                  <span>{option}</span>
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
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0A2047] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            1. Personal Details
          </span>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] transition-colors cursor-pointer py-1 px-2 rounded hover:bg-[#F5F7FA]"
          >
            <Edit2 className="w-3 h-3 text-[#D4AF37]" />
            <span>Edit</span>
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-5 gap-y-3.5 sm:gap-y-4 text-xs">
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Full Name</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.studentName || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Email Address</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.email || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Contact Number</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.contactNumber || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Gender</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.gender || "Not specified"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Date of Birth</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.dob || "Not specified"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Summary Section 2: Academic Details */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0A2047] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            2. Academic Details (GD Goenka University)
          </span>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] transition-colors cursor-pointer py-1 px-2 rounded hover:bg-[#F5F7FA]"
          >
            <Edit2 className="w-3 h-3 text-[#D4AF37]" />
            <span>Edit</span>
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-3.5 sm:gap-y-4 text-xs">
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Enrolment / Student ID</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm font-mono break-words [overflow-wrap:anywhere]">
              {formData.studentId || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Admission Number</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm font-mono break-words [overflow-wrap:anywhere]">
              {formData.admissionNumber || "—"}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-[#64748B] font-medium">Student ID Card</dt>
            <dd className="text-[#0A2047] font-medium mt-0.5 flex items-center gap-1.5 break-words [overflow-wrap:anywhere]">
              {formData.idCardFile ? (
                <>
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span className="font-semibold text-xs text-[#0A2047] truncate">{formData.idCardFile.name}</span>
                  <span className="text-[#64748B] text-[11px] shrink-0">
                    ({(formData.idCardFile.size / 1024).toFixed(1)} KB)
                  </span>
                </>
              ) : (
                <span className="text-[#64748B] italic">Not uploaded</span>
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">School</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.school || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Department / Program</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.program || formData.course || "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[#64748B] font-medium">Year of Joining</dt>
            <dd className="text-[#0A2047] font-semibold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
              {formData.yearOfJoining || "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Summary Section 3: Startup & Innovation Details (Optional) */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-[#B89125]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0A2047]">
              3. Startup &amp; Innovation Details <span className="text-[#64748B] font-normal lowercase">(optional)</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] transition-colors cursor-pointer py-1 px-2 rounded hover:bg-[#F5F7FA]"
          >
            <Edit2 className="w-3 h-3 text-[#D4AF37]" />
            <span>Edit</span>
          </button>
        </div>

        {hasPreviousWork ? (
          <div className="space-y-3.5 text-xs">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-3 sm:gap-y-3.5">
              {formData.hasStartupOrProject && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[#64748B] font-medium">Startup Status</dt>
                  <dd className="text-[#0A2047] font-semibold mt-0.5 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{formData.hasStartupOrProject}</span>
                  </dd>
                </div>
              )}

              {(formData.startupTitle || formData.projectName) && (
                <div className="min-w-0">
                  <dt className="text-[#64748B] font-medium">Project or Startup Title</dt>
                  <dd className="text-[#0A2047] font-bold mt-0.5 text-sm break-words [overflow-wrap:anywhere]">
                    {formData.startupTitle || formData.projectName}
                  </dd>
                </div>
              )}

              {formData.startupStage && (
                <div className="min-w-0">
                  <dt className="text-[#64748B] font-medium">Development Stage</dt>
                  <dd className="text-[#0A2047] font-semibold mt-0.5 text-xs">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#0A2047]/5 border border-[#0A2047]/10 text-[#0A2047] font-bold">
                      {formData.startupStage}
                    </span>
                  </dd>
                </div>
              )}

              {(formData.studentRole || formData.projectRole) && (
                <div className="min-w-0">
                  <dt className="text-[#64748B] font-medium">Your Role</dt>
                  <dd className="text-[#0A2047] font-semibold mt-0.5 text-xs">
                    {formData.studentRole || formData.projectRole}
                  </dd>
                </div>
              )}

              {formData.teamStructure && (
                <div className="min-w-0">
                  <dt className="text-[#64748B] font-medium">Team Structure</dt>
                  <dd className="text-[#0A2047] font-semibold mt-0.5 text-xs">
                    {formData.teamStructure}
                    {formData.teamStructure === "Team Project" && formData.teamMembers && formData.teamMembers.length > 0 && (
                      <span className="text-[#64748B] font-normal ml-1">
                        ({formData.teamMembers.length} co-member{formData.teamMembers.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </dd>
                </div>
              )}

              {/* Team Leader details if entered */}
              {formData.teamLeaderName && (
                <div className="min-w-0 sm:col-span-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <dt className="text-[#64748B] font-medium text-[11px]">Team Leader / Founder Contact</dt>
                  <dd className="text-[#172033] font-medium text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-bold text-[#0A2047]">{formData.teamLeaderName}</span>
                    {formData.teamLeaderEnrollment && (
                      <span className="font-mono text-[#64748B]">({formData.teamLeaderEnrollment})</span>
                    )}
                    {formData.teamLeaderEmail && (
                      <span className="text-[#64748B]">&bull; {formData.teamLeaderEmail}</span>
                    )}
                    {formData.teamLeaderContact && (
                      <span className="text-[#64748B]">&bull; {formData.teamLeaderContact}</span>
                    )}
                  </dd>
                </div>
              )}

              {/* Team Members List */}
              {formData.teamStructure === "Team Project" && formData.teamMembers && formData.teamMembers.length > 0 && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[#64748B] font-medium mb-1">Additional Team Members</dt>
                  <dd className="space-y-1.5">
                    {formData.teamMembers.map((m, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between text-[11px]"
                      >
                        <span className="font-semibold text-[#0A2047]">{m.fullName || "—"}</span>
                        <div className="flex items-center gap-2 text-[#64748B]">
                          {m.enrollmentNumber && <span className="font-mono">{m.enrollmentNumber}</span>}
                          {m.roleInTeam && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[#172033] text-[10px]">
                              {m.roleInTeam}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </dd>
                </div>
              )}

              {formData.technologiesUsed && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[#64748B] font-medium">Technology Stack</dt>
                  <dd className="text-[#0A2047] mt-0.5 text-xs font-mono bg-[#F5F7FA] p-2 rounded border border-[#E2E8F0] break-words [overflow-wrap:anywhere]">
                    {formData.technologiesUsed}
                  </dd>
                </div>
              )}

              {(formData.startupDetails || formData.previousWorkDescription) && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[#64748B] font-medium">Project / Startup Description</dt>
                  <dd className="text-[#172033] mt-0.5 text-xs whitespace-pre-wrap bg-[#F5F7FA] p-2.5 rounded border border-[#E2E8F0] leading-relaxed break-words [overflow-wrap:anywhere]">
                    {formData.startupDetails || formData.previousWorkDescription}
                  </dd>
                </div>
              )}

              {/* Support Needed Badges */}
              {formData.supportNeeded && formData.supportNeeded.length > 0 && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[#64748B] font-medium mb-1">Requested Incubation Support</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {formData.supportNeeded.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0A2047]/5 border border-[#0A2047]/15 text-[#0A2047] text-[11px] font-medium"
                      >
                        <span>{s}</span>
                      </span>
                    ))}
                  </dd>
                  {formData.otherSupportDetails && (
                    <p className="text-[11px] text-[#64748B] mt-1 italic">
                      Note: {formData.otherSupportDetails}
                    </p>
                  )}
                </div>
              )}

              {formData.projectLink && (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[#64748B] font-medium">Project Link / Portfolio / Pitch Deck</dt>
                  <dd className="mt-0.5 text-xs break-words [overflow-wrap:anywhere]">
                    {isSafeUrl(formData.projectLink) ? (
                      <a
                        href={formData.projectLink.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#0A2047] hover:text-[#B89125] underline font-medium"
                      >
                        <span className="break-all">{formData.projectLink.trim()}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-[#172033] font-mono">{formData.projectLink.trim()}</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <p className="text-xs text-[#64748B] italic py-1">
            Not provided (Optional section skipped).
          </p>
        )}
      </div>
    </div>
  );
}
