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
          bg: "bg-blue-50/70",
          border: "border-blue-200",
          text: "text-blue-900",
          iconBg: "bg-blue-600 text-white",
          badge: "bg-blue-100 text-blue-800",
        };
      case "warning":
        return {
          bg: "bg-amber-50/70",
          border: "border-amber-200",
          text: "text-amber-900",
          iconBg: "bg-amber-500 text-white",
          badge: "bg-amber-100 text-amber-800",
        };
      case "purple":
        return {
          bg: "bg-indigo-50/70",
          border: "border-indigo-200",
          text: "text-indigo-900",
          iconBg: "bg-indigo-600 text-white",
          badge: "bg-indigo-100 text-indigo-800",
        };
      case "success":
        return {
          bg: "bg-emerald-50/70",
          border: "border-emerald-200",
          text: "text-emerald-900",
          iconBg: "bg-emerald-600 text-white",
          badge: "bg-emerald-100 text-emerald-800",
        };
      case "danger":
        return {
          bg: "bg-rose-50/70",
          border: "border-rose-200",
          text: "text-rose-900",
          iconBg: "bg-rose-600 text-white",
          badge: "bg-rose-100 text-rose-800",
        };
    }
  };

  const colors = getColors();

  const cardContent = (
    <div
      className={`relative p-5 rounded-xl border bg-white shadow-xs transition-all duration-200 ${
        href ? "hover:shadow-md hover:border-slate-300 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1 font-mono">
            {value.toLocaleString()}
          </span>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${colors.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{subtitle}</span>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${colors.badge}`}>
            {badgeText}
          </span>
        )}
        {href && (
          <span className="flex items-center text-blue-600 font-medium hover:underline text-[11px]">
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
