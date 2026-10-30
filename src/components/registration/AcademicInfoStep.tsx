import React, { useRef, useState, useEffect } from "react";
import { StudentRegistrationInput, RegistrationValidationErrors } from "@/types/registration";
import {
  APPROVED_SCHOOLS,
  SchoolCode,
  PROGRAMS_BY_SCHOOL,
  YEAR_OF_JOINING_OPTIONS,
} from "@/config/academic";
import {
  IdCard,
  ContactRound,
  School as SchoolIcon,
  BookOpen,
  Calendar,
  AlertCircle,
  UploadCloud,
  FileUp,
  FileText,
  FileCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AcademicInfoStepProps {
  formData: StudentRegistrationInput;
  errors: RegistrationValidationErrors;
  onChange: (field: keyof StudentRegistrationInput, value: any) => void;
  onIdCardSelect?: (file: File | null) => void;
}

export function AcademicInfoStep({
  formData,
  errors,
  onChange,
  onIdCardSelect,
}: AcademicInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Generate thumbnail preview for image uploads
  useEffect(() => {
    if (
      formData.idCardFile &&
      (formData.idCardFile.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp)$/i.test(formData.idCardFile.name))
    ) {
      const url = URL.createObjectURL(formData.idCardFile);
      setFilePreview(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFilePreview(null);
    }
  }, [formData.idCardFile]);

  const handleSelectedFile = (file: File | null) => {
    if (!file) {
      if (onIdCardSelect) onIdCardSelect(null);
      else onChange("idCardFile", null);
      return;
    }

    if (onIdCardSelect) {
      onIdCardSelect(file);
    } else {
      onChange("idCardFile", file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleSelectedFile(file);
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedSchool = formData.school || "";
  const programOptions =
    selectedSchool && PROGRAMS_BY_SCHOOL[selectedSchool]
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

      {/* 1b. Admission Number (Compulsory, immediately after Enrolment Number) */}
      <div className="space-y-1.5">
        <label
          htmlFor="admissionNumber"
          className="block text-sm font-semibold text-[#0A2047]"
        >
          Admission Number <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <ContactRound className="w-4 h-4" />
          </div>
          <input
            id="admissionNumber"
            name="admissionNumber"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.admissionNumber)}
            aria-describedby={errors.admissionNumber ? "admissionNumber-error" : undefined}
            placeholder="Enter your admission number"
            value={formData.admissionNumber || ""}
            onChange={(e) => onChange("admissionNumber", e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-4 py-2.5 rounded-lg border text-sm text-[#172033] font-mono placeholder:text-[#94A3B8] bg-white transition-all focus:outline-none focus:ring-2",
              errors.admissionNumber
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-[#E2E8F0] hover:border-slate-300 focus:border-[#0A2047] focus:ring-[#0A2047]/15"
            )}
          />
        </div>
        {errors.admissionNumber && (
          <p id="admissionNumber-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.admissionNumber}</span>
          </p>
        )}
      </div>

      {/* 1c. Student ID Card Upload (Compulsory, immediately after Admission Number and before School) */}
      <div className="space-y-2 pt-1">
        <div>
          <label className="block text-sm font-semibold text-[#0A2047]">
            Student ID Card <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <p className="text-xs text-[#64748B] mt-0.5">
            Upload a clear image or PDF of your university student ID card.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          id="id-card-file-input"
          name="idCardFile"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-describedby={errors.idCardFile ? "idCardFile-error" : undefined}
        />

        {!formData.idCardFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleSelectedFile(dropped);
            }}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-[#0A2047] hover:bg-[#F5F7FA]",
              errors.idCardFile
                ? "border-red-400 bg-red-50/15"
                : "border-[#E2E8F0] bg-[#F5F7FA]/60"
            )}
          >
            <UploadCloud
              className={cn(
                "w-9 h-9 mx-auto mb-2.5",
                errors.idCardFile ? "text-red-500" : "text-[#0A2047]"
              )}
            />
            <p className="text-sm font-semibold text-[#0A2047]">
              Click to choose file or drag and drop
            </p>
            <div className="mt-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Choose File</span>
              </button>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Accepted formats: JPG, JPEG, PNG, WebP, PDF (Max 5 MB)
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {filePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={filePreview}
                  alt="Student ID Preview"
                  className="w-14 h-14 object-cover rounded-lg border border-emerald-200 shrink-0 bg-white shadow-2xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-emerald-100 flex flex-col items-center justify-center text-emerald-800 shrink-0 border border-emerald-200">
                  <FileText className="w-6 h-6 text-emerald-700" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">PDF</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#172033] truncate">
                  {formData.idCardFile.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#64748B]">
                    {(formData.idCardFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="text-[#CBD5E1]">•</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-800">
                    {formData.idCardFile.type === "application/pdf" ||
                    formData.idCardFile.name.toLowerCase().endsWith(".pdf") ? (
                      <>
                        <FileText className="w-3 h-3 text-emerald-600" />
                        <span>PDF Document</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        <span>Image Document</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errors.idCardFile && (
          <p id="idCardFile-error" className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.idCardFile}</span>
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
