import React from "react";
import { StudentRegistrationInput, RegistrationValidationErrors } from "@/types/registration";
import {
  APPROVED_SCHOOLS,
  SchoolCode,
  PROGRAMS_BY_SCHOOL,
  YEAR_OF_JOINING_OPTIONS,
} from "@/config/academic";
import { IdCard, School as SchoolIcon, BookOpen, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AcademicInfoStepProps {
  formData: StudentRegistrationInput;
  errors: RegistrationValidationErrors;
  onChange: (field: keyof StudentRegistrationInput, value: string) => void;
}

export function AcademicInfoStep({ formData, errors, onChange }: AcademicInfoStepProps) {
  const selectedSchool = formData.school as SchoolCode | "";
  const programOptions = selectedSchool && PROGRAMS_BY_SCHOOL[selectedSchool]
    ? PROGRAMS_BY_SCHOOL[selectedSchool]
    : [];

  const handleSchoolChange = (newSchool: string) => {
    onChange("school", newSchool);
    // Reset program when school changes
    onChange("program", "");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#0A2047]">Academic Information</h3>
          <span className="text-[11px] font-semibold text-[#0A2047] bg-[#0A2047]/5 px-2.5 py-1 rounded-md border border-[#0A2047]/10 hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            GD Goenka University
          </span>
        </div>
        <p className="text-xs text-[#64748B] mt-0.5">
          Select your official school and degree program at GD Goenka University.
        </p>
      </div>

      {/* 1. Student ID / Enrolment Number */}
      <div className="space-y-1.5">
        <label
          htmlFor="studentId"
          className="block text-sm font-semibold text-[#0A2047]"
        >
          Enrolment / Student ID <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <IdCard className="w-4 h-4" />
          </div>
          <input
            id="studentId"
            name="studentId"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.studentId)}
            aria-describedby={errors.studentId ? "studentId-error" : undefined}
            placeholder="Enter your student ID"
            value={formData.studentId}
            onChange={(e) => onChange("studentId", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#172033] font-mono placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
              errors.studentId
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          />
        </div>
        {errors.studentId && (
          <p id="studentId-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.studentId}</span>
          </p>
        )}
      </div>

      {/* 2. School Dropdown */}
      <div className="space-y-1.5">
        <label
          htmlFor="school"
          className="block text-sm font-semibold text-[#0A2047]"
        >
          School <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <SchoolIcon className="w-4 h-4" />
          </div>
          <select
            id="school"
            name="school"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.school)}
            aria-describedby={errors.school ? "school-error" : undefined}
            value={formData.school || ""}
            onChange={(e) => handleSchoolChange(e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-8 py-2.5 rounded-lg border text-sm text-[#172033] bg-white transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer",
              errors.school
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          >
            <option value="">Select your School...</option>
            {APPROVED_SCHOOLS.map((school) => (
              <option key={school.code} value={school.code}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
        {errors.school && (
          <p id="school-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.school}</span>
          </p>
        )}
      </div>

      {/* 3. Program / Department (Dynamically filtered by School) */}
      <div className="space-y-1.5">
        <label
          htmlFor="program"
          className="block text-sm font-semibold text-[#0A2047]"
        >
          Department / Program <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <BookOpen className="w-4 h-4" />
          </div>
          <select
            id="program"
            name="program"
            required
            disabled={!selectedSchool}
            aria-required="true"
            aria-invalid={Boolean(errors.program)}
            aria-describedby={errors.program ? "program-error" : undefined}
            value={formData.program || ""}
            onChange={(e) => onChange("program", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-8 py-2.5 rounded-lg border text-sm text-[#172033] bg-white transition-all focus:outline-none focus:ring-2 appearance-none",
              !selectedSchool
                ? "bg-[#F5F7FA] text-[#64748B] cursor-not-allowed opacity-80"
                : "cursor-pointer",
              errors.program
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          >
            <option value="">
              {selectedSchool
                ? "Select your Department / Program..."
                : "Select a School first to view programs"}
            </option>
            {programOptions.map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>
        </div>
        {errors.program && (
          <p id="program-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.program}</span>
          </p>
        )}
      </div>

      {/* 4. Year of Joining University */}
      <div className="space-y-1.5">
        <label
          htmlFor="yearOfJoining"
          className="block text-sm font-semibold text-[#0A2047]"
        >
          Year of Joining University <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Calendar className="w-4 h-4" />
          </div>
          <select
            id="yearOfJoining"
            name="yearOfJoining"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.yearOfJoining)}
            aria-describedby={errors.yearOfJoining ? "yearOfJoining-error" : undefined}
            value={formData.yearOfJoining || ""}
            onChange={(e) => onChange("yearOfJoining", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-8 py-2.5 rounded-lg border text-sm text-[#172033] bg-white transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer",
              errors.yearOfJoining
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          >
            <option value="">Select Year of Joining...</option>
            {YEAR_OF_JOINING_OPTIONS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
        {errors.yearOfJoining && (
          <p id="yearOfJoining-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.yearOfJoining}</span>
          </p>
        )}
      </div>
    </div>
  );
}
