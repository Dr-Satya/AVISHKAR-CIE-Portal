"use client";

import React, { useState, useEffect } from "react";
import {
  StudentRegistrationInput,
  RegistrationValidationErrors,
  RegistrationStep,
  RegistrationSubmissionResult,
} from "@/types/registration";
import {
  validatePersonalInfo,
  validateAcademicInfo,
  validatePreviousWork,
  validateClubEngagement,
  validatePaymentInfo,
} from "@/lib/validations/registration";
import { isOfficialPaymentConfigured } from "@/config/payment";
import { StepIndicator } from "./StepIndicator";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { AcademicInfoStep } from "./AcademicInfoStep";
import { PreviousWorkStep } from "./PreviousWorkStep";
import { ReviewStep } from "./ReviewStep";
import { PaymentStep } from "./PaymentStep";
import { SubmissionSuccess } from "./SubmissionSuccess";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Send,
  Loader2,
  AlertCircle,
  Lock,
  Clock,
} from "lucide-react";

const DRAFT_STORAGE_KEY = "avishkar_registration_draft_v2";

export function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [formData, setFormData] = useState<StudentRegistrationInput>({
    studentName: "",
    email: "",
    contactNumber: "",
    gender: "",
    dob: "",
    studentId: "",
    school: "",
    program: "",
    yearOfJoining: "",
    course: "",
    branch: "",
    academicYear: "",
    previousWorkDescription: "",
    projectName: "",
    projectRole: "",
    technologiesUsed: "",
    projectLink: "",
    reasonForJoining: "",
    leadershipInterest: "",
    transactionId: "",
    paymentDate: "",
    receiptFile: null,
    remarks: "",
  });
  const [errors, setErrors] = useState<RegistrationValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] =
    useState<RegistrationSubmissionResult | null>(null);

  const isPaymentOpen = isOfficialPaymentConfigured();

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === "object") {
            setFormData((prev) => ({
              ...prev,
              studentName: parsed.studentName || "",
              email: parsed.email || "",
              contactNumber: parsed.contactNumber || "",
              gender: parsed.gender || "",
              dob: parsed.dob || "",
              studentId: parsed.studentId || "",
              school: parsed.school || "",
              program: parsed.program || "",
              yearOfJoining: parsed.yearOfJoining || "",
              course: parsed.course || "",
              branch: parsed.branch || "",
              academicYear: parsed.academicYear || "",
              previousWorkDescription: parsed.previousWorkDescription || "",
              projectName: parsed.projectName || "",
              projectRole: parsed.projectRole || "",
              technologiesUsed: parsed.technologiesUsed || "",
              projectLink: parsed.projectLink || "",
              reasonForJoining: parsed.reasonForJoining || "",
              leadershipInterest: parsed.leadershipInterest || "",
              transactionId: parsed.transactionId || "",
              paymentDate: parsed.paymentDate || "",
              remarks: parsed.remarks || "",
            }));
          }
        }
      }
    } catch {
      // Ignore localStorage errors (e.g., privacy mode or restricted environments)
    }
  }, []);

  // Save draft helper
  const saveDraft = (data: StudentRegistrationInput) => {
    try {
      if (typeof window !== "undefined") {
        const { receiptFile, ...serializable } = data;
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(serializable));
      }
    } catch {
      // Storage quota or restricted environment
    }
  };

  // Field change handler
  const handleFieldChange = (
    field: keyof StudentRegistrationInput,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      saveDraft(updated);
      return updated;
    });

    // Clear field-specific error upon editing
    const errKey = field as keyof RegistrationValidationErrors;
    if (errors[errKey]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[errKey];
        return updated;
      });
    }
    if (submissionError) {
      setSubmissionError(null);
    }
  };

  // File selection handler
  const handleFileSelect = (file: File | null) => {
    setFormData((prev) => ({ ...prev, receiptFile: file }));
    if (errors.receiptFile) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.receiptFile;
        return updated;
      });
    }
    if (submissionError) {
      setSubmissionError(null);
    }
  };

  // Form submission handler (Step 5 -> Server API)
  const handleSubmit = async () => {
    if (!isPaymentOpen) {
      setSubmissionError(
        "Registration opening soon. Submissions are currently locked pending official announcement of registration fees and schedule."
      );
      return;
    }

    const personalErrors = validatePersonalInfo(formData);
    const academicErrors = validateAcademicInfo(formData);
    const previousWorkErrors = validatePreviousWork(formData);
    const clubErrors = validateClubEngagement(formData);
    const paymentErrors = validatePaymentInfo(formData);

    const allErrors = {
      ...personalErrors,
      ...academicErrors,
      ...previousWorkErrors,
      ...clubErrors,
      ...paymentErrors,
    };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Route user back to the earliest step with errors
      if (allErrors.studentName || allErrors.email || allErrors.contactNumber || allErrors.gender || allErrors.dob) {
        setCurrentStep(1);
      } else if (allErrors.studentId || allErrors.school || allErrors.program || allErrors.yearOfJoining) {
        setCurrentStep(2);
      } else if (allErrors.previousWorkDescription || allErrors.projectName || allErrors.projectRole || allErrors.technologiesUsed || allErrors.projectLink) {
        setCurrentStep(3);
      } else if (allErrors.reasonForJoining || allErrors.leadershipInterest) {
        setCurrentStep(4);
      }
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = new FormData();
      payload.append("studentName", formData.studentName);
      payload.append("email", formData.email);
      payload.append("contactNumber", formData.contactNumber);
      payload.append("gender", formData.gender || "");
      payload.append("dob", formData.dob || "");
      payload.append("studentId", formData.studentId);
      payload.append("school", formData.school);
      payload.append("program", formData.program);
      payload.append("yearOfJoining", formData.yearOfJoining);

      // Previous Work / Startup Details (Optional)
      payload.append("previousWorkDescription", (formData.previousWorkDescription || "").trim());
      payload.append("projectName", (formData.projectName || "").trim());
      payload.append("projectRole", (formData.projectRole || "").trim());
      payload.append("technologiesUsed", (formData.technologiesUsed || "").trim());
      payload.append("projectLink", (formData.projectLink || "").trim());

      payload.append("reasonForJoining", formData.reasonForJoining);
      payload.append("leadershipInterest", formData.leadershipInterest);

      payload.append("transactionId", formData.transactionId || "");
      payload.append("paymentDate", formData.paymentDate || "");
      payload.append("remarks", formData.remarks || "");

      if (formData.receiptFile) {
        payload.append("receiptFile", formData.receiptFile);
      }

      const response = await fetch("/api/register", {
        method: "POST",
        body: payload,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setSubmissionError(
          data.error || data.message || "Failed to submit registration. Please verify details."
        );
        return;
      }

      // Success: Clear saved draft from localStorage
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch {
        // Ignore
      }

      setSubmissionResult(data as RegistrationSubmissionResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission network error:", err);
      setSubmissionError(
        "Network connection error. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step advancement handler
  const handleContinue = () => {
    if (currentStep === 1) {
      const stepErrors = validatePersonalInfo(formData);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      setErrors({});
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 2) {
      const stepErrors = validateAcademicInfo(formData);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      setErrors({});
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 3) {
      // Step 3 is optional: validate bounds and URL format only if provided
      const stepErrors = validatePreviousWork(formData);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      setErrors({});
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 4) {
      const clubErrors = validateClubEngagement(formData);
      const personalErrors = validatePersonalInfo(formData);
      const academicErrors = validateAcademicInfo(formData);
      const previousWorkErrors = validatePreviousWork(formData);

      const combinedErrors = {
        ...personalErrors,
        ...academicErrors,
        ...previousWorkErrors,
        ...clubErrors,
      };

      if (Object.keys(combinedErrors).length > 0) {
        setErrors(combinedErrors);
        if (combinedErrors.studentName || combinedErrors.email || combinedErrors.contactNumber) {
          setCurrentStep(1);
        } else if (combinedErrors.studentId || combinedErrors.school || combinedErrors.program || combinedErrors.yearOfJoining) {
          setCurrentStep(2);
        } else if (combinedErrors.previousWorkDescription || combinedErrors.projectName || combinedErrors.projectRole || combinedErrors.technologiesUsed || combinedErrors.projectLink) {
          setCurrentStep(3);
        }
        return;
      }
      setErrors({});
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 5) {
      handleSubmit();
    }
  };

  // Back step handler
  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 3) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 4) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 5) {
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Reset form handler
  const handleReset = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }

    setFormData({
      studentName: "",
      email: "",
      contactNumber: "",
      gender: "",
      dob: "",
      studentId: "",
      school: "",
      program: "",
      yearOfJoining: "",
      course: "",
      branch: "",
      academicYear: "",
      previousWorkDescription: "",
      projectName: "",
      projectRole: "",
      technologiesUsed: "",
      projectLink: "",
      reasonForJoining: "",
      leadershipInterest: "",
      transactionId: "",
      paymentDate: "",
      receiptFile: null,
      remarks: "",
    });
    setErrors({});
    setSubmissionError(null);
    setSubmissionResult(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Check if student has entered any previous work details
  const hasPreviousWorkDetails = Boolean(
    (formData.previousWorkDescription && formData.previousWorkDescription.trim()) ||
    (formData.projectName && formData.projectName.trim()) ||
    (formData.projectRole && formData.projectRole.trim()) ||
    (formData.technologiesUsed && formData.technologiesUsed.trim()) ||
    (formData.projectLink && formData.projectLink.trim())
  );

  // Render completed success screen
  if (submissionResult) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <SubmissionSuccess
          result={submissionResult}
          formData={formData}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Stepper */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={(step) => {
          // Allow navigating back to completed steps
          if (step < currentStep) {
            setCurrentStep(step);
          }
        }}
      />

      {/* Pre-launch holding status banner when payment/registration is not yet opened */}
      {!isPaymentOpen && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-900 block text-sm">
              Registration opening soon
            </span>
            <p className="text-amber-800 leading-relaxed">
              Official registration schedule, fees, and payment channels are awaiting formal committee ratification. Please preview the form requirements below; registration will open soon.
            </p>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-xl border border-[#D9E4F2] p-6 sm:p-8 shadow-xs">
        {/* Top Server Error Alert */}
        {submissionError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-red-900 block">Submission Error</span>
              <p>{submissionError}</p>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <PersonalInfoStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 2 && (
          <AcademicInfoStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 3 && (
          <PreviousWorkStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 4 && (
          <ReviewStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onEditStep={(step) => setCurrentStep(step as RegistrationStep)}
            onProceedToPayment={handleContinue}
          />
        )}

        {currentStep === 5 && (
          <PaymentStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onFileSelect={handleFileSelect}
          />
        )}

        {/* Action Controls Bar */}
        <div className="mt-8 pt-6 border-t border-[#D9E4F2] flex items-center justify-between gap-4">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D9E4F2] hover:bg-slate-50 text-[#174789] font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-xs hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                <span>Continue to Academic Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-xs hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                <span>Continue to Previous Work</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-xs hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                <span>
                  {hasPreviousWorkDetails
                    ? "Continue to Club & Review"
                    : "Skip or Continue to Club & Review"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-xs hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Payment Status</span>
              </button>
            )}

            {currentStep === 5 && (
              <button
                type="button"
                disabled={isSubmitting || !isPaymentOpen}
                onClick={handleSubmit}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isPaymentOpen
                    ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs hover:shadow focus:ring-[#2563EB] disabled:opacity-50"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                }`}
                title={!isPaymentOpen ? "Registration opening soon" : undefined}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : !isPaymentOpen ? (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Registration Opening Soon</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Registration &amp; Proof</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
