"use client";

import React from "react";
import {
  StudentRegistrationInput,
  RegistrationValidationErrors,
  STARTUP_STATUS_OPTIONS,
  STUDENT_PROJECT_ROLE_OPTIONS,
  TEAM_STRUCTURE_OPTIONS,
  STARTUP_STAGE_OPTIONS,
  INCUBATION_SUPPORT_OPTIONS,
  TeamMemberEntry,
} from "@/types/registration";
import {
  Rocket,
  Users,
  User,
  Mail,
  Phone,
  Briefcase,
  Code,
  Link2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StartupInnovationStepProps {
  formData: StudentRegistrationInput;
  errors: RegistrationValidationErrors;
  onChange: (field: keyof StudentRegistrationInput, value: any) => void;
  onSkip?: () => void;
}

export function StartupInnovationStep({
  formData,
  errors,
  onChange,
  onSkip,
}: StartupInnovationStepProps) {
  const startupStatus = formData.hasStartupOrProject || "";
  const isStartupActive =
    startupStatus === "Yes, I have started a startup." ||
    startupStatus === "I am currently developing a startup or project.";
  const isSkippedStatus = startupStatus === "No, not yet.";

  // Character lengths
  const detailsLength = (formData.startupDetails || formData.previousWorkDescription || "").length;
  const titleLength = (formData.startupTitle || formData.projectName || "").length;
  const techLength = (formData.technologiesUsed || "").length;

  // Auto-fill team leader details with the student's own Step 1 & Step 2 info
  const handleAutoFillWithStudent = () => {
    onChange("teamLeaderName", formData.studentName || "");
    onChange("teamLeaderEnrollment", formData.studentId || "");
    onChange("teamLeaderEmail", formData.email || "");
    onChange("teamLeaderContact", formData.contactNumber || "");
  };

  // Team members handlers
  const teamMembers: TeamMemberEntry[] = formData.teamMembers || [];

  const handleAddTeamMember = () => {
    const nextIndex = teamMembers.length + 1;
    const studentSuffix = (formData.studentId || "st").replace(/[^a-zA-Z0-9]/g, "");
    const updated = [
      ...teamMembers,
      {
        id: `member-${nextIndex}-${studentSuffix}`,
        fullName: "",
        enrollmentNumber: "",
        roleInTeam: "",
      },
    ];
    onChange("teamMembers", updated);
  };

  const handleUpdateTeamMember = (
    index: number,
    field: keyof TeamMemberEntry,
    val: string
  ) => {
    const updated = teamMembers.map((m, i) =>
      i === index ? { ...m, [field]: val } : m
    );
    onChange("teamMembers", updated);
  };

  const handleRemoveTeamMember = (index: number) => {
    const updated = teamMembers.filter((_, i) => i !== index);
    onChange("teamMembers", updated);
  };

  // Support needed toggle handler
  const currentSupport: string[] = formData.supportNeeded || [];

  const handleToggleSupport = (option: string) => {
    if (currentSupport.includes(option)) {
      const updated = currentSupport.filter((s) => s !== option);
      onChange("supportNeeded", updated);
      if (option === "Other") {
        onChange("otherSupportDetails", "");
      }
    } else {
      const updated = [...currentSupport, option];
      onChange("supportNeeded", updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A2047]/5 border border-[#0A2047]/10 flex items-center justify-center text-[#0A2047]">
              <Rocket className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0A2047] leading-tight">
                Startup &amp; Innovation Details{" "}
                <span className="text-sm font-normal text-[#64748B]">
                  (Optional)
                </span>
              </h3>
            </div>
          </div>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] bg-white border border-[#E2E8F0] hover:bg-[#F5F7FA] rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>Skip for Now</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          )}
        </div>

        {/* Short explanation per prompt */}
        <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
          This section is optional. Tell us about your startup, product, or
          innovative project if you have one. If you haven&apos;t started one
          yet, you can skip this section and continue with registration.
        </p>
      </div>

      {/* Main Question 1: Startup Status */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-[#0A2047]">
          Have you already started a startup or are you developing an innovative
          project?{" "}
          <span className="text-xs text-[#64748B] font-normal">
            (Select one)
          </span>
        </label>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="Startup or innovative project status"
        >
          {STARTUP_STATUS_OPTIONS.map((option) => {
            const isSelected = startupStatus === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  onChange("hasStartupOrProject", option);
                }}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#0A2047]/20 cursor-pointer flex flex-col justify-between min-h-[92px]",
                  isSelected
                    ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs ring-2 ring-[#D4AF37]/40"
                    : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F5F7FA] hover:border-slate-300"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold leading-snug",
                      isSelected ? "text-white" : "text-[#0A2047]"
                    )}
                  >
                    {option}
                  </span>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                      isSelected
                        ? "border-[#D4AF37] bg-[#D4AF37] text-[#0A2047]"
                        : "border-[#CBD5E1] bg-white"
                    )}
                  >
                    {isSelected && (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    )}
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[10px] mt-2 block",
                    isSelected ? "text-slate-300" : "text-[#64748B]"
                  )}
                >
                  {option === "Yes, I have started a startup." &&
                    "Active enterprise or registered entity"}
                  {option ===
                    "I am currently developing a startup or project." &&
                    "Idea, prototype, MVP, or testing phase"}
                  {option === "No, not yet." &&
                    "Skip questions & proceed directly"}
                </span>
              </button>
            );
          })}
        </div>

        {errors.hasStartupOrProject && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.hasStartupOrProject}</span>
          </p>
        )}
      </div>

      {/* Conditional Notice for "No, not yet." */}
      {isSkippedStatus && (
        <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] text-xs text-[#0A2047] flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-[#0A2047]">
              No startup details required
            </span>
            <p className="text-[#64748B] leading-relaxed">
              You selected &quot;No, not yet.&quot; You can click{" "}
              <strong className="text-[#0A2047]">
                &quot;Continue to Club &amp; Review&quot;
              </strong>{" "}
              below to proceed with your AVISHKAR registration. Any details you
              previously entered are safely preserved in case you change your mind.
            </p>
          </div>
        </div>
      )}

      {/* EXPANDED SECTION: Shown when student has started or is developing a project */}
      {isStartupActive && (
        <div className="space-y-6 pt-2 animate-in fade-in duration-200">
          {/* ============================================================== */}
          {/* A. Student and Team Information */}
          {/* ============================================================== */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2047]">
                  A. Student &amp; Founder Role
                </h4>
              </div>

              {/* Student Role Quick Select */}
              <button
                type="button"
                onClick={handleAutoFillWithStudent}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] py-1 px-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer self-start sm:self-auto"
                title="Populate Team Leader information with your own personal and academic registration details"
              >
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>Auto-fill with my details</span>
              </button>
            </div>

            {/* Student's Role in Startup */}
            <div className="space-y-1.5">
              <label
                htmlFor="studentRole"
                className="block text-sm font-semibold text-[#0A2047]"
              >
                Your Role in the Startup / Project{" "}
                <span className="text-xs text-[#64748B] font-normal">
                  (Optional)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STUDENT_PROJECT_ROLE_OPTIONS.map((role) => {
                  const isSelected = formData.studentRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        onChange("studentRole", role);
                        onChange("projectRole", role);
                        if (
                          (role === "Team Leader / Founder" ||
                            role === "Individual Innovator") &&
                          !formData.teamLeaderName
                        ) {
                          handleAutoFillWithStudent();
                        }
                      }}
                      className={cn(
                        "p-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs"
                          : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F5F7FA]"
                      )}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
              {errors.studentRole && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.studentRole}</span>
                </p>
              )}
            </div>

            {/* Team Leader / Founder Information */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748B]">
                  Team Leader / Primary Founder Details
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {formData.studentRole === "Team Leader / Founder" ||
                  formData.studentRole === "Individual Innovator"
                    ? "Populated with your details"
                    : "Enter team leader details if you are a team member"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Team Leader Name */}
                <div className="space-y-1">
                  <label
                    htmlFor="teamLeaderName"
                    className="block text-xs font-semibold text-[#0A2047]"
                  >
                    Team Leader / Founder Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="teamLeaderName"
                      name="teamLeaderName"
                      type="text"
                      maxLength={150}
                      placeholder="Enter team leader's full name"
                      value={formData.teamLeaderName || ""}
                      onChange={(e) => onChange("teamLeaderName", e.target.value)}
                      className={cn(
                        "w-full h-10 pl-9 pr-3 text-xs bg-white border rounded-lg text-[#172033] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2",
                        errors.teamLeaderName
                          ? "border-red-400 focus:ring-red-100"
                          : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                      )}
                    />
                  </div>
                  {errors.teamLeaderName && (
                    <p className="text-[11px] text-red-600">
                      {errors.teamLeaderName}
                    </p>
                  )}
                </div>

                {/* Team Leader Enrollment */}
                <div className="space-y-1">
                  <label
                    htmlFor="teamLeaderEnrollment"
                    className="block text-xs font-semibold text-[#0A2047]"
                  >
                    Team Leader Enrollment Number / Student ID
                  </label>
                  <input
                    id="teamLeaderEnrollment"
                    name="teamLeaderEnrollment"
                    type="text"
                    maxLength={50}
                    placeholder="Enter team leader's student ID"
                    value={formData.teamLeaderEnrollment || ""}
                    onChange={(e) =>
                      onChange("teamLeaderEnrollment", e.target.value)
                    }
                    className={cn(
                      "w-full h-10 px-3 text-xs bg-white border rounded-lg font-mono text-[#172033] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2",
                      errors.teamLeaderEnrollment
                        ? "border-red-400 focus:ring-red-100"
                        : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                    )}
                  />
                  {errors.teamLeaderEnrollment && (
                    <p className="text-[11px] text-red-600">
                      {errors.teamLeaderEnrollment}
                    </p>
                  )}
                </div>

                {/* Team Leader Email */}
                <div className="space-y-1">
                  <label
                    htmlFor="teamLeaderEmail"
                    className="block text-xs font-semibold text-[#0A2047]"
                  >
                    Team Leader Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="teamLeaderEmail"
                      name="teamLeaderEmail"
                      type="email"
                      maxLength={150}
                      placeholder="Enter team leader's email address"
                      value={formData.teamLeaderEmail || ""}
                      onChange={(e) =>
                        onChange("teamLeaderEmail", e.target.value)
                      }
                      className={cn(
                        "w-full h-10 pl-9 pr-3 text-xs bg-white border rounded-lg text-[#172033] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2",
                        errors.teamLeaderEmail
                          ? "border-red-400 focus:ring-red-100"
                          : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                      )}
                    />
                  </div>
                  {errors.teamLeaderEmail && (
                    <p className="text-[11px] text-red-600">
                      {errors.teamLeaderEmail}
                    </p>
                  )}
                </div>

                {/* Team Leader Contact */}
                <div className="space-y-1">
                  <label
                    htmlFor="teamLeaderContact"
                    className="block text-xs font-semibold text-[#0A2047]"
                  >
                    Team Leader Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="teamLeaderContact"
                      name="teamLeaderContact"
                      type="tel"
                      maxLength={15}
                      placeholder="Enter team leader's contact number"
                      value={formData.teamLeaderContact || ""}
                      onChange={(e) =>
                        onChange("teamLeaderContact", e.target.value)
                      }
                      className={cn(
                        "w-full h-10 pl-9 pr-3 text-xs bg-white border rounded-lg text-[#172033] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2",
                        errors.teamLeaderContact
                          ? "border-red-400 focus:ring-red-100"
                          : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                      )}
                    />
                  </div>
                  {errors.teamLeaderContact && (
                    <p className="text-[11px] text-red-600">
                      {errors.teamLeaderContact}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* B. Team Structure */}
          {/* ============================================================== */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2047]">
                B. Team Structure
              </h4>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#0A2047]">
                Is this project being developed individually or by a team?
              </label>

              <div className="grid grid-cols-2 gap-3" role="radiogroup">
                {TEAM_STRUCTURE_OPTIONS.map((struct) => {
                  const isSelected = formData.teamStructure === struct;
                  return (
                    <button
                      key={struct}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        onChange("teamStructure", struct);
                        if (
                          struct === "Team Project" &&
                          (!teamMembers || teamMembers.length === 0)
                        ) {
                          handleAddTeamMember();
                        }
                      }}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all cursor-pointer font-semibold text-xs flex items-center justify-center gap-2",
                        isSelected
                          ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs"
                          : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F5F7FA]"
                      )}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      )}
                      <span>{struct}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Team Members Section (for Team Project) */}
            {formData.teamStructure === "Team Project" && (
              <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-[#0A2047] uppercase tracking-wider">
                      Team Members
                    </label>
                    <p className="text-[11px] text-[#64748B]">
                      Add other students or co-founders working on this project.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] py-1.5 px-3 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] hover:bg-[#EEF2F6] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Add Member</span>
                  </button>
                </div>

                {errors.teamMembers && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.teamMembers}</span>
                  </p>
                )}

                {teamMembers.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-[#CBD5E1] text-center text-xs text-[#64748B]">
                    No additional team members listed. Click{" "}
                    <strong>&quot;Add Member&quot;</strong> to include team
                    members.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                          <span className="text-[11px] font-bold text-[#0A2047] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#0A2047] text-white flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            Member #{idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveTeamMember(idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                            title="Remove team member"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              maxLength={100}
                              placeholder="Enter team member's full name"
                              value={member.fullName}
                              onChange={(e) =>
                                handleUpdateTeamMember(
                                  idx,
                                  "fullName",
                                  e.target.value
                                )
                              }
                              className="w-full h-9 px-2.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172033] focus:border-[#0A2047] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                              Enrollment Number
                            </label>
                            <input
                              type="text"
                              maxLength={50}
                              placeholder="Enter team member's student ID"
                              value={member.enrollmentNumber}
                              onChange={(e) =>
                                handleUpdateTeamMember(
                                  idx,
                                  "enrollmentNumber",
                                  e.target.value
                                )
                              }
                              className="w-full h-9 px-2.5 text-xs bg-white border border-[#E2E8F0] rounded-lg font-mono text-[#172033] focus:border-[#0A2047] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                              Role in the Team
                            </label>
                            <input
                              type="text"
                              maxLength={100}
                              placeholder="Enter team member's role"
                              value={member.roleInTeam}
                              onChange={(e) =>
                                handleUpdateTeamMember(
                                  idx,
                                  "roleInTeam",
                                  e.target.value
                                )
                              }
                              className="w-full h-9 px-2.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172033] focus:border-[#0A2047] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* C. Startup / Project / Product Information */}
          {/* ============================================================== */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Briefcase className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2047]">
                C. Project &amp; Product Details
              </h4>
            </div>

            {/* Field 1: Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="startupTitle"
                  className="block text-sm font-semibold text-[#0A2047]"
                >
                  Project / Product / Startup Title{" "}
                  <span className="text-xs text-[#64748B] font-normal">
                    (Optional)
                  </span>
                </label>
                <span
                  className={cn(
                    "text-[11px] font-mono",
                    titleLength > 200 ? "text-red-600 font-semibold" : "text-[#64748B]"
                  )}
                >
                  {titleLength} / 200
                </span>
              </div>
              <div className="relative">
                <Rocket className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="startupTitle"
                  name="startupTitle"
                  type="text"
                  maxLength={200}
                  placeholder="Enter your project or startup title"
                  value={formData.startupTitle || formData.projectName || ""}
                  onChange={(e) => {
                    onChange("startupTitle", e.target.value);
                    onChange("projectName", e.target.value);
                  }}
                  className={cn(
                    "w-full h-11 pl-10 pr-4 py-2 text-sm bg-white border rounded-lg text-[#172033] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2",
                    errors.startupTitle
                      ? "border-red-400 focus:ring-red-100"
                      : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                  )}
                />
              </div>
              {errors.startupTitle && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.startupTitle}</span>
                </p>
              )}
            </div>

            {/* Field 2: Details */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="startupDetails"
                  className="block text-sm font-semibold text-[#0A2047]"
                >
                  Project / Product / Startup Details{" "}
                  <span className="text-xs text-[#64748B] font-normal">
                    (Optional)
                  </span>
                </label>
                <span
                  className={cn(
                    "text-[11px] font-mono",
                    detailsLength > 3000
                      ? "text-red-600 font-semibold"
                      : "text-[#64748B]"
                  )}
                >
                  {detailsLength.toLocaleString()} / 3,000
                </span>
              </div>
              <textarea
                id="startupDetails"
                name="startupDetails"
                rows={4}
                maxLength={3000}
                placeholder="Describe your project or startup"
                value={formData.startupDetails || formData.previousWorkDescription || ""}
                onChange={(e) => {
                  onChange("startupDetails", e.target.value);
                  onChange("previousWorkDescription", e.target.value);
                }}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#172033] placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
                  errors.startupDetails
                    ? "border-red-400 focus:ring-red-100"
                    : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                )}
              />
              {errors.startupDetails && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.startupDetails}</span>
                </p>
              )}
            </div>

            {/* Field 3: Startup Stage */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#0A2047]">
                Project / Product / Startup Stage{" "}
                <span className="text-xs text-[#64748B] font-normal">
                  (Select current phase)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {STARTUP_STAGE_OPTIONS.map((stage) => {
                  const isSelected = formData.startupStage === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => onChange("startupStage", stage)}
                      className={cn(
                        "p-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[52px]",
                        isSelected
                          ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs"
                          : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F5F7FA]"
                      )}
                    >
                      <span>{stage}</span>
                    </button>
                  );
                })}
              </div>
              {errors.startupStage && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.startupStage}</span>
                </p>
              )}
            </div>

            {/* Field 4: Technology Stack */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="technologiesUsed"
                  className="block text-sm font-semibold text-[#0A2047]"
                >
                  Technology Stack{" "}
                  <span className="text-xs text-[#64748B] font-normal">
                    (Optional)
                  </span>
                </label>
                <span
                  className={cn(
                    "text-[11px] font-mono",
                    techLength > 1000
                      ? "text-red-600 font-semibold"
                      : "text-[#64748B]"
                  )}
                >
                  {techLength} / 1,000
                </span>
              </div>
              <div className="relative">
                <Code className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="technologiesUsed"
                  name="technologiesUsed"
                  type="text"
                  maxLength={1000}
                  placeholder="Enter the technologies used"
                  value={formData.technologiesUsed || ""}
                  onChange={(e) => onChange("technologiesUsed", e.target.value)}
                  className={cn(
                    "w-full h-11 pl-10 pr-4 py-2 text-sm bg-white border rounded-lg text-[#172033] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2",
                    errors.technologiesUsed
                      ? "border-red-400 focus:ring-red-100"
                      : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                  )}
                />
              </div>
              {errors.technologiesUsed && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.technologiesUsed}</span>
                </p>
              )}
            </div>

            {/* Field 5: Incubation Support Requirements */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-sm font-semibold text-[#0A2047]">
                What kind of support do you need?{" "}
                <span className="text-xs text-[#64748B] font-normal">
                  (Select all that apply)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {INCUBATION_SUPPORT_OPTIONS.map((supportOption) => {
                  const isChecked = currentSupport.includes(supportOption);
                  return (
                    <button
                      key={supportOption}
                      type="button"
                      onClick={() => handleToggleSupport(supportOption)}
                      className={cn(
                        "p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-2",
                        isChecked
                          ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs"
                          : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F5F7FA]"
                      )}
                    >
                      <span className="leading-snug">{supportOption}</span>
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          isChecked
                            ? "bg-[#D4AF37] border-[#D4AF37] text-[#0A2047]"
                            : "bg-white border-[#CBD5E1]"
                        )}
                      >
                        {isChecked && (
                          <Check className="w-3 h-3 stroke-[3]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* If "Other" is selected in Incubation Support, show additional text field */}
              {currentSupport.includes("Other") && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <label
                    htmlFor="otherSupportDetails"
                    className="block text-xs font-semibold text-[#0A2047] mb-1"
                  >
                    Please specify the support you need:
                  </label>
                  <input
                    id="otherSupportDetails"
                    name="otherSupportDetails"
                    type="text"
                    maxLength={500}
                    placeholder="Describe the support you need"
                    value={formData.otherSupportDetails || ""}
                    onChange={(e) =>
                      onChange("otherSupportDetails", e.target.value)
                    }
                    className="w-full h-10 px-3.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172033] placeholder:text-[#94A3B8] focus:border-[#0A2047] focus:ring-2 focus:ring-[#0A2047]/15 focus:outline-none"
                  />
                  {errors.otherSupportDetails && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {errors.otherSupportDetails}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Field 6: Project Link / Portfolio URL */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="projectLink"
                  className="block text-sm font-semibold text-[#0A2047]"
                >
                  Project Link, Pitch Deck, or Demo URL{" "}
                  <span className="text-xs text-[#64748B] font-normal">
                    (Optional)
                  </span>
                </label>
                <span className="text-[11px] text-[#64748B]">
                  GitHub, pitch deck, website, or drive link
                </span>
              </div>
              <div className="relative">
                <Link2 className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="projectLink"
                  name="projectLink"
                  type="url"
                  maxLength={500}
                  placeholder="Enter project link, pitch deck, or demo URL"
                  value={formData.projectLink || ""}
                  onChange={(e) => onChange("projectLink", e.target.value)}
                  className={cn(
                    "w-full h-11 pl-10 pr-4 py-2 text-sm bg-white border rounded-lg text-[#172033] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2",
                    errors.projectLink
                      ? "border-red-400 focus:ring-red-100"
                      : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
                  )}
                />
              </div>
              {errors.projectLink && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.projectLink}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
