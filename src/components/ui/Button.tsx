import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "teal";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md";

    const variantStyles = {
      primary:
        "bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium focus:ring-[#2563EB] shadow-xs hover:shadow",
      secondary:
        "bg-white hover:bg-slate-50 text-[#174789] border border-[#174789]/30 hover:border-[#174789] focus:ring-[#174789] shadow-2xs",
      outline:
        "border border-[#174789] text-[#174789] bg-transparent hover:bg-[#174789]/5 focus:ring-[#174789]",
      teal:
        "bg-[#0D9488] hover:bg-[#0F766E] text-white font-medium focus:ring-[#0D9488] shadow-xs hover:shadow",
      ghost:
        "text-[#174789] hover:text-[#2563EB] hover:bg-[#EFF6FF] focus:ring-slate-300",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";


