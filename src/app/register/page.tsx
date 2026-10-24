import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { siteConfig } from "@/config/site";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: `Student Registration | ${siteConfig.name} 2026`,
  description: "Official student registration portal for AVISHKAR 2026 at GD Goenka University.",
};

export default function RegisterPage() {
  return (
    <div className="py-8 sm:py-12 lg:py-16 bg-[#F5F7FA] min-h-[calc(100vh-80px)]">
      <Container size="default">
        {/* Navigation Breadcrumb Back link */}
        <div className="mb-5 sm:mb-6 max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to AVISHKAR Homepage</span>
          </Link>
        </div>

        {/* Page Header Section */}
        <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0A2047] tracking-tight leading-snug">
            AVISHKAR Student Registration
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-2.5" aria-hidden="true">
            <div className="w-6 h-0.5 bg-[#D4AF37] rounded-full" />
            <div className="w-12 h-0.5 bg-[#0A2047] rounded-full" />
          </div>
        </div>

        {/* Multi-step Registration Form */}
        <RegistrationWizard />
      </Container>
    </div>
  );
}
