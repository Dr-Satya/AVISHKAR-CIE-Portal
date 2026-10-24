import React from "react";
import { StudentRegistrationInput, RegistrationValidationErrors } from "@/types/registration";
import { Briefcase, Code, Link2, UserCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviousWorkStepProps {
  formData: StudentRegistrationInput;
  errors: RegistrationValidationErrors;
  onChange: (field: keyof StudentRegistrationInput, value: string) => void;
}

export function PreviousWorkStep({ formData, errors, onChange }: PreviousWorkStepProps) {
  const descLength = (formData.previousWorkDescription || "").length;
  const nameLength = (formData.projectName || "").length;
  const roleLength = (formData.projectRole || "").length;
  const techLength = (formData.technologiesUsed || "").length;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#0A2047]">
            Previous Work / Startup Details <span className="text-sm font-normal text-[#64748B]">(Optional)</span>
          </h3>
        </div>
        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
          Tell us about any previous projects, startup initiatives, hackathons, research, or other relevant work you have completed. This information is optional and helps the organizing team understand your experience and interests. If you have no previous experience, you can skip this section.
        </p>
      </div>

      {/* Field 1: Previous Work / Project Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="previousWorkDescription"
            className="block text-sm font-semibold text-[#0A2047]"
          >
            Previous Work or Project Details <span className="text-xs text-[#64748B] font-normal">(Optional)</span>
          </label>
          <span className={cn("text-[11px] font-mono", descLength > 2000 ? "text-red-600 font-semibold" : "text-[#64748B]")}>
            {descLength.toLocaleString()} / 2,000
          </span>
        </div>
        <div className="relative">
          <textarea
            id="previousWorkDescription"
            name="previousWorkDescription"
            rows={4}
            maxLength={2000}
            aria-invalid={Boolean(errors.previousWorkDescription)}
            aria-describedby={errors.previousWorkDescription ? "previousWorkDescription-error" : undefined}
            placeholder="Describe your previous projects or work"
            value={formData.previousWorkDescription || ""}
            onChange={(e) => onChange("previousWorkDescription", e.target.value)}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#172033] placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
              errors.previousWorkDescription
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          />
        </div>
        {errors.previousWorkDescription && (
          <p id="previousWorkDescription-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.previousWorkDescription}</span>
          </p>
        )}
      </div>

      {/* Field 2 & Field 3: Project Name & Role (Two-column on tablet/desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Field 2: Project or Startup Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="projectName"
              className="block text-sm font-semibold text-[#0A2047]"
            >
              Project or Startup Name <span className="text-xs text-[#64748B] font-normal">(Optional)</span>
            </label>
            <span className={cn("text-[11px] font-mono", nameLength > 150 ? "text-red-600 font-semibold" : "text-[#64748B]")}>
              {nameLength} / 150
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
              <Briefcase className="w-4 h-4" />
            </div>
            <input
              id="projectName"
              name="projectName"
              type="text"
              maxLength={150}
              aria-invalid={Boolean(errors.projectName)}
              aria-describedby={errors.projectName ? "projectName-error" : undefined}
              placeholder="Enter your project or startup title"
              value={formData.projectName || ""}
              onChange={(e) => onChange("projectName", e.target.value)}
              className={cn(
                "w-full h-11 pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#172033] placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
                errors.projectName
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
              )}
            />
          </div>
          {errors.projectName && (
            <p id="projectName-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.projectName}</span>
            </p>
          )}
        </div>

        {/* Field 3: Your Role */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="projectRole"
              className="block text-sm font-semibold text-[#0A2047]"
            >
              Your Role <span className="text-xs text-[#64748B] font-normal">(Optional)</span>
            </label>
            <span className={cn("text-[11px] font-mono", roleLength > 100 ? "text-red-600 font-semibold" : "text-[#64748B]")}>
              {roleLength} / 100
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
              <UserCheck className="w-4 h-4" />
            </div>
            <input
              id="projectRole"
              name="projectRole"
              type="text"
              maxLength={100}
              aria-invalid={Boolean(errors.projectRole)}
              aria-describedby={errors.projectRole ? "projectRole-error" : undefined}
              placeholder="Enter your role in the project"
              value={formData.projectRole || ""}
              onChange={(e) => onChange("projectRole", e.target.value)}
              className={cn(
                "w-full h-11 pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#172033] placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
                errors.projectRole
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
              )}
            />
          </div>
          {errors.projectRole && (
            <p id="projectRole-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.projectRole}</span>
            </p>
          )}
        </div>
      </div>

      {/* Field 4: Technologies Used */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="technologiesUsed"
            className="block text-sm font-semibold text-[#0A2047]"
          >
            Technologies Used <span className="text-xs text-[#64748B] font-normal">(Optional)</span>
          </label>
          <span className={cn("text-[11px] font-mono", techLength > 500 ? "text-red-600 font-semibold" : "text-[#64748B]")}>
            {techLength} / 500
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Code className="w-4 h-4" />
          </div>
          <input
            id="technologiesUsed"
            name="technologiesUsed"
            type="text"
            maxLength={500}
            aria-invalid={Boolean(errors.technologiesUsed)}
            aria-describedby={errors.technologiesUsed ? "technologiesUsed-error" : undefined}
            placeholder="Enter the technologies used"
            value={formData.technologiesUsed || ""}
            onChange={(e) => onChange("technologiesUsed", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#172033] placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
              errors.technologiesUsed
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          />
        </div>
        {errors.technologiesUsed && (
          <p id="technologiesUsed-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.technologiesUsed}</span>
          </p>
        )}
      </div>

      {/* Field 5: Project Link / Portfolio URL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="projectLink"
            className="block text-sm font-semibold text-[#0A2047]"
          >
            Project Link or Portfolio URL <span className="text-xs text-[#64748B] font-normal">(Optional)</span>
          </label>
          <span className="text-[11px] text-[#64748B]">
            GitHub repo, demo site, or portfolio link
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Link2 className="w-4 h-4" />
          </div>
          <input
            id="projectLink"
            name="projectLink"
            type="url"
            maxLength={500}
            aria-invalid={Boolean(errors.projectLink)}
            aria-describedby={errors.projectLink ? "projectLink-error" : undefined}
            placeholder="Enter project link or demo URL"
            value={formData.projectLink || ""}
            onChange={(e) => onChange("projectLink", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#172033] placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
              errors.projectLink
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          />
        </div>
        {errors.projectLink && (
          <p id="projectLink-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.projectLink}</span>
          </p>
        )}
        <p className="text-[11px] text-[#64748B] leading-normal">
          Leave blank if you do not have a project repository, online portfolio, or live demo URL.
        </p>
      </div>
    </div>
  );
}
