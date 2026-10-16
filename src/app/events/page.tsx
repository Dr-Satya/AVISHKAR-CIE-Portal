"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HighlightsSection } from "@/components/home/HighlightsSection";
import { ArrowLeft } from "lucide-react";

export default function PublicEventsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-6">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/" className="hover:text-[#174789] font-medium flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-semibold">Events &amp; Competitions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#174789] tracking-tight">
                Official Festival Competitions
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Browse verified technical competitions, hackathons, and symposium tracks for AVISHKAR 2026.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Reused Verified Dynamic Highlights Section */}
      <HighlightsSection />
    </main>
  );
}
