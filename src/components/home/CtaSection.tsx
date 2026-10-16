import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArrowRight, Sparkles } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-16 lg:py-20 bg-[#0B1F3A] text-white relative overflow-hidden border-t border-[#14345E]">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <Container className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Event Preparation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-[28px] font-normal tracking-normal text-white">
          Prepare for AVISHKAR 2026
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Review our competition tracks, familiarize your team with guidelines, and stay tuned for the official schedule release from GD Goenka University.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/#competitions"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-sm transition-all"
          >
            <span>Explore All Tracks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/#guidelines"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/20 hover:border-white text-white hover:bg-white/10 font-medium text-sm transition-all"
          >
            <span>Read Guidelines</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}

