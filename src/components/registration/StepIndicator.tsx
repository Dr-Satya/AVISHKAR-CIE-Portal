import React from "react";
import { RegistrationStep } from "@/types/registration";
import { User, GraduationCap, Briefcase, CheckSquare, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: RegistrationStep;
  onStepClick?: (step: RegistrationStep) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const steps = [
    { number: 1, title: "Personal", fullTitle: "Personal Details", icon: User },
    { number: 2, title: "Academic", fullTitle: "Academic Info", icon: GraduationCap },
    { number: 3, title: "Previous Work", fullTitle: "Previous Work (Optional)", icon: Briefcase },
    { number: 4, title: "Review", fullTitle: "Club & Review", icon: CheckSquare },
    { number: 5, title: "Payment", fullTitle: "Payment & Submit", icon: CreditCard },
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = onStepClick && step.number < currentStep;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.number}>
              {/* Step item */}
              <div
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left transition-all",
                  isClickable && "cursor-pointer group"
                )}
                onClick={() => isClickable && onStepClick(step.number as RegistrationStep)}
              >
                <div
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-medium text-xs transition-all border",
                    isCurrent
                      ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs ring-4 ring-blue-100"
                      : isCompleted
                      ? "bg-[#0D9488] text-white border-[#0D9488]"
                      : "bg-[#EFF6FF] text-[#475569] border-[#D9E4F2]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-[#475569]">
                    Step {step.number}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs font-medium whitespace-nowrap",
                      isCurrent
                        ? "text-[#174789]"
                        : isCompleted
                        ? "text-[#0D9488]"
                        : "text-[#475569]"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1.5 sm:mx-3 transition-colors hidden sm:block",
                    currentStep > index + 1 ? "bg-[#0D9488]" : "bg-[#D9E4F2]"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
