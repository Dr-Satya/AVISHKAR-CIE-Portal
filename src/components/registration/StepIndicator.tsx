import React from "react";
import { RegistrationStep } from "@/types/registration";
import { User, GraduationCap, Rocket, CheckSquare, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: RegistrationStep;
  onStepClick?: (step: RegistrationStep) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const steps = [
    { number: 1, title: "Personal", fullTitle: "Personal Details", icon: User },
    { number: 2, title: "Academic", fullTitle: "Academic Info", icon: GraduationCap },
    { number: 3, title: "Startup & Innovation", fullTitle: "Startup & Innovation Details (Optional)", icon: Rocket },
    { number: 4, title: "Review", fullTitle: "Club & Review", icon: CheckSquare },
    { number: 5, title: "Payment", fullTitle: "Payment & Submit", icon: CreditCard },
  ];

  return (
    <nav aria-label="Registration Progress" className="w-full mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-1">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = Boolean(onStepClick && step.number < currentStep);
          const Icon = step.icon;

          return (
            <React.Fragment key={step.number}>
              {/* Step item */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.number as RegistrationStep)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.number}: ${step.fullTitle}${isCompleted ? " (Completed)" : isCurrent ? " (Current)" : ""}`}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 text-center sm:text-left transition-all p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2047]",
                  isClickable
                    ? "cursor-pointer group hover:opacity-90"
                    : "cursor-default select-none"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all border shrink-0",
                    isCurrent
                      ? "bg-[#0A2047] text-white border-[#0A2047] shadow-xs ring-4 ring-[#D4AF37]/35"
                      : isCompleted
                      ? "bg-[#0A2047] text-[#D4AF37] border-[#0A2047] shadow-2xs group-hover:bg-[#132E57]"
                      : "bg-[#F5F7FA] text-[#64748B] border-[#E2E8F0]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-[#D4AF37]" strokeWidth={2.5} />
                  ) : (
                    <Icon className={cn("w-3.5 h-3.5", isCurrent ? "text-white" : "text-[#64748B]")} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-[9px] sm:text-[10px] uppercase tracking-wider",
                      isCurrent
                        ? "font-bold text-[#B89125]"
                        : isCompleted
                        ? "font-semibold text-[#0A2047]"
                        : "font-medium text-[#64748B]"
                    )}
                  >
                    Step {step.number}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs whitespace-nowrap",
                      isCurrent
                        ? "font-bold text-[#0A2047]"
                        : isCompleted
                        ? "font-semibold text-[#0A2047]"
                        : "font-medium text-[#64748B]"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </button>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 sm:mx-3 transition-colors hidden sm:block rounded-full",
                    currentStep > index + 1 ? "bg-[#D4AF37]" : "bg-[#E2E8F0]"
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
