"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HighlightsSection } from "@/components/home/HighlightsSection";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function PublicEventsPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#E2E8F0] py-6 sm:py-8">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <Link
                  href="/"
                  className="hover:text-[#0A2047] font-semibold flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>AVISHKAR Home</span>
                </Link>
                <span>/</span>
                <span className="text-[#172033] font-semibold">Events &amp; Competitions</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#0A2047]/5 text-[#0A2047] border border-[#0A2047]/10">
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  Official Festival Catalog
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2047] tracking-tight font-institutional">
                Competitions, Hackathons &amp; Workshops
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
                Explore all approved technical events organized under AVISHKAR CIE at GD Goenka University. Filter by discipline, search tracks, and proceed to register.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Dynamic Filterable Highlights Section */}
      <HighlightsSection />
    </main>
  );
}
