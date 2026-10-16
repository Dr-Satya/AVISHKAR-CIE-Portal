"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";

interface LogoImageProps {
  type: "university" | "avishkar";
  variant?: "light" | "dark";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function LogoImage({
  type,
  variant = "dark",
  className,
  width,
  height,
  priority = false,
}: LogoImageProps) {
  const [hasError, setHasError] = useState(false);

  const isUniversity = type === "university";
  const defaultSrc = isUniversity
    ? "/images/gd-goenka-logo.png"
    : "/images/avishkar-logo.png";
  const altText = isUniversity
    ? "GD Goenka University Logo"
    : "AVISHKAR Tech Fest Logo";

  const defaultWidth = width || (isUniversity ? 220 : 320);
  const defaultHeight = height || (isUniversity ? 60 : 120);

  // If the official image is missing or fails to load, display a neutral empty placeholder without drawing a fake substitute logo
  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-md border border-dashed text-center select-none transition-colors",
          variant === "light"
            ? "border-white/20 bg-white/5 text-slate-300"
            : "border-slate-300 bg-slate-100/70 text-slate-500",
          isUniversity ? "h-12 px-4 min-w-[180px]" : "h-28 w-56 px-4",
          className
        )}
        aria-label={`${altText} (Placeholder)`}
      >
        <ImageIcon className="w-4 h-4 opacity-60 shrink-0" />
        <span className="text-xs font-medium tracking-wide">
          {isUniversity ? "University Logo" : "AVISHKAR Crest"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Image
        src={defaultSrc}
        alt={altText}
        width={defaultWidth}
        height={defaultHeight}
        priority={priority}
        className="object-contain w-auto h-full max-h-full"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

