import React from "react";
import { StudentRegistrationInput, RegistrationValidationErrors } from "@/types/registration";
import { GENDER_OPTIONS } from "@/lib/validations/registration";
import { User, Mail, Phone, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonalInfoStepProps {
  formData: StudentRegistrationInput;
  errors: RegistrationValidationErrors;
  onChange: (field: keyof StudentRegistrationInput, value: string) => void;
}

export function PersonalInfoStep({ formData, errors, onChange }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#D9E4F2] pb-3">
        <h3 className="text-[20px] font-normal text-[#174789]">Personal Information</h3>
        <p className="text-xs text-[#475569] mt-0.5">
          Enter your official contact and identity details as recorded in university records.
        </p>
      </div>

      {/* 1. Student Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="studentName"
          className="block text-sm font-medium text-[#174789]"
        >
          Full Name <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
            <User className="w-4 h-4" />
          </div>
          <input
            id="studentName"
            name="studentName"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.studentName)}
            aria-describedby={errors.studentName ? "studentName-error" : undefined}
            placeholder="Enter your full name"
            value={formData.studentName}
            onChange={(e) => onChange("studentName", e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#153D73] placeholder:text-slate-400 bg-white transition-all focus:outline-none focus:ring-2",
              errors.studentName
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#D9E4F2] hover:border-slate-300 focus:border-[#2563EB] focus:ring-blue-100"
            )}
          />
        </div>
        {errors.studentName && (
          <p id="studentName-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.studentName}</span>
          </p>
        )}
      </div>

      {/* 2. Email Address */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#174789]"
        >
          Email Address <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#153D73] placeholder:text-slate-400 bg-white transition-all focus:outline-none focus:ring-2",
              errors.email
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#D9E4F2] hover:border-slate-300 focus:border-[#2563EB] focus:ring-blue-100"
            )}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.email}</span>
          </p>
        )}
      </div>

      {/* 3. Contact Number */}
      <div className="space-y-1.5">
        <label
          htmlFor="contactNumber"
          className="block text-sm font-medium text-[#174789]"
        >
          Contact Number <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
            <Phone className="w-4 h-4" />
          </div>
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.contactNumber)}
            aria-describedby={errors.contactNumber ? "contactNumber-error" : undefined}
            placeholder="Enter your mobile number"
            value={formData.contactNumber}
            onChange={(e) => onChange("contactNumber", e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#153D73] placeholder:text-slate-400 bg-white transition-all focus:outline-none focus:ring-2",
              errors.contactNumber
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#D9E4F2] hover:border-slate-300 focus:border-[#2563EB] focus:ring-blue-100"
            )}
          />
        </div>
        {errors.contactNumber && (
          <p id="contactNumber-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.contactNumber}</span>
          </p>
        )}
      </div>

      {/* 4. Gender Selection (Optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-[#174789]"
          >
            Gender
          </label>
          <span className="text-xs text-slate-400">Optional</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GENDER_OPTIONS.map((option) => {
            const isSelected = formData.gender === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange("gender", isSelected ? "" : option)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-100",
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
        {errors.gender && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.gender}</span>
          </p>
        )}
      </div>

      {/* 5. Date of Birth (Optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="dob"
            className="block text-sm font-medium text-[#174789]"
          >
            Date of Birth
          </label>
          <span className="text-xs text-slate-400">Optional</span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            id="dob"
            name="dob"
            type="date"
            aria-invalid={Boolean(errors.dob)}
            aria-describedby={errors.dob ? "dob-error" : undefined}
            value={formData.dob || ""}
            onChange={(e) => onChange("dob", e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#153D73] bg-white transition-all focus:outline-none focus:ring-2",
              errors.dob
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#D9E4F2] hover:border-slate-300 focus:border-[#2563EB] focus:ring-blue-100"
            )}
          />
        </div>
        {errors.dob && (
          <p id="dob-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.dob}</span>
          </p>
        )}
      </div>
    </div>
  );
}
