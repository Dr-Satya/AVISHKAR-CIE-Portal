import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { siteConfig } from "@/config/site";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Student Registration | ${siteConfig.name} 2026`,
  description: "Official student registration portal for AVISHKAR 2026 at GD Goenka University.",
};

export default function RegisterPage() {
  return (
    <div className="py-8 sm:py-12 lg:py-16 bg-[#F8FAFC]/50 min-h-[calc(100vh-80px)]">
      <Container size="default">
        {/* Navigation Breadcrumb Back link */}
        <div className="mb-5 sm:mb-6 max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#153D73] hover:text-[#2563EB] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to AVISHKAR Homepage</span>
          </Link>
        </div>

        {/* Page Header Section */}
        <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-normal text-[#174789] tracking-normal leading-snug font-institutional">
            AVISHKAR Student Registration
          </h1>
        </div>

        {/* Multi-step Registration Form */}
        <RegistrationWizard />

        {/* Security & Academic Rule Footer Notice */}
        <div className="mt-8 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[#475569] bg-white border border-[#D9E4F2] px-4 py-2 rounded-lg shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            <span>
              Exclusively for GD Goenka University Students &bull; Fixed Registration Protocol
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
}
