import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  variant?: "primary" | "warning" | "purple" | "success" | "danger";
  href?: string;
  badgeText?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "primary",
  href,
  badgeText,
}: StatCardProps) {
  const getColors = () => {
    switch (variant) {
      case "primary":
        return {
          bg: "bg-[#0A2047]/5",
          border: "border-[#E2E8F0]",
          text: "text-[#0A2047]",
          iconBg: "bg-[#0A2047] text-white",
          badge: "bg-[#0A2047]/10 text-[#0A2047]",
        };
      case "warning":
        return {
          bg: "bg-amber-500/5",
          border: "border-amber-200",
          text: "text-amber-900",
          iconBg: "bg-[#D97706] text-white",
          badge: "bg-amber-100 text-amber-800",
        };
      case "purple":
        return {
          bg: "bg-[#132E57]/5",
          border: "border-[#132E57]/20",
          text: "text-[#132E57]",
          iconBg: "bg-[#132E57] text-white",
          badge: "bg-[#132E57]/10 text-[#132E57]",
        };
      case "success":
        return {
          bg: "bg-emerald-500/5",
          border: "border-emerald-200",
          text: "text-emerald-900",
          iconBg: "bg-[#16A34A] text-white",
          badge: "bg-emerald-100 text-emerald-800",
        };
      case "danger":
        return {
          bg: "bg-rose-500/5",
          border: "border-rose-200",
          text: "text-rose-900",
          iconBg: "bg-[#DC2626] text-white",
          badge: "bg-rose-100 text-rose-800",
        };
    }
  };

  const colors = getColors();

  const cardContent = (
    <div
      className={`relative p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-xs transition-all duration-200 ${
        href ? "hover:shadow-md hover:border-[#D4AF37]/60 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            {title}
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight mt-1 font-mono">
            {value.toLocaleString()}
          </span>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${colors.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
        <span>{subtitle}</span>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${colors.badge}`}>
            {badgeText}
          </span>
        )}
        {href && (
          <span className="flex items-center text-[#0A2047] font-semibold hover:text-[#D4AF37] text-[11px] transition-colors">
            View list <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
