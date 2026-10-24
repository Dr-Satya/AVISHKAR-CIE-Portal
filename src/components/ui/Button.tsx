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
        "bg-[#0A2047] hover:bg-[#132E57] active:bg-[#19365F] text-white font-medium focus:ring-[#0A2047] shadow-xs hover:shadow",
      secondary:
        "bg-white hover:bg-[#F0F3F8] text-[#0A2047] border border-[#E2E8F0] hover:border-[#D4AF37] focus:ring-[#0A2047] shadow-2xs",
      outline:
        "border border-[#0A2047] text-[#0A2047] bg-transparent hover:bg-[#0A2047]/5 focus:ring-[#0A2047]",
      teal:
        "bg-[#D4AF37] hover:bg-[#B89125] text-[#0A2047] font-semibold focus:ring-[#D4AF37] shadow-xs hover:shadow",
      ghost:
        "text-[#0A2047] hover:text-[#D4AF37] hover:bg-[#F0F3F8] focus:ring-[#E2E8F0]",
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


