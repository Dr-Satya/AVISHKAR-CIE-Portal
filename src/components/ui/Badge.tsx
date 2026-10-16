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
    navy: "bg-[#EFF6FF] text-[#174789] border border-[#D9E4F2]",
    blue: "bg-[#EFF6FF] text-[#2563EB] border border-blue-200",
    teal: "bg-[#F0FDFA] text-[#0D9488] border border-teal-200",
    outline: "border border-[#D9E4F2] text-[#1E293B] bg-transparent",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    subtle: "bg-slate-50 text-slate-600 border border-slate-200/80",
    provisional: "bg-[#EFF6FF] text-[#174789] border border-[#D9E4F2]",
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


