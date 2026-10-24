import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-16 lg:py-20 bg-[#0A2047] text-white relative overflow-hidden border-t border-[#132E57]">
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <Container className="relative z-10 text-center max-w-4xl mx-auto space-y-5 sm:space-y-6">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#D4AF37]">
            EVENT PREPARATION
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-white font-institutional">
            Prepare for AVISHKAR
          </h2>
        </div>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Review our competition tracks, familiarize your team with guidelines, and submit your student registration for GD Goenka University&apos;s annual festival of innovation.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3.5">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#D4AF37] hover:bg-[#B89125] text-[#0A2047] font-bold text-sm shadow-md transition-all group cursor-pointer"
          >
            <span>Register as Student</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <Link
            href="/#competitions"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            <span>Explore All Tracks</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
          </Link>

          <Link
            href="/#guidelines"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/10 hover:border-white/30 text-slate-300 hover:text-white text-sm transition-all cursor-pointer"
          >
            <span>Read Guidelines</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
