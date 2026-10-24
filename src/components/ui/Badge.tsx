import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "navy" | "blue" | "teal" | "outline" | "neutral" | "subtle" | "provisional" | "success";
}

export function Badge({
  className,
  variant = "navy",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    navy: "bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20",
    blue: "bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20",
    teal: "bg-[#D4AF37]/15 text-[#967417] border border-[#D4AF37]/30",
    outline: "border border-[#E2E8F0] text-[#172033] bg-transparent",
    neutral: "bg-[#F5F7FA] text-[#64748B] border border-[#E2E8F0]",
    subtle: "bg-[#F5F7FA] text-[#64748B] border border-[#E2E8F0]/80",
    provisional: "bg-[#D4AF37]/15 text-[#967417] border border-[#D4AF37]/30",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}


