import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { eventStatPlaceholders } from "@/config/events";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative bg-white py-10 sm:py-14 lg:py-16 border-b border-[#D9E4F2]">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Institutional Header, Dual Accent Underline, Lead Description, CTAs */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Main Institutional Heading */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-normal text-[#174789] leading-[1.25] font-institutional">
                AVISHKAR
                <span className="block text-base sm:text-lg lg:text-[21px] font-normal text-[#174789] mt-2 tracking-normal font-institutional">
                  (AVISHKAR CENTER OF INNOVATION AND ENTREPRENEURSHIP)
                </span>
              </h1>

              {/* Official Two-Tone Underline Accent Bar (Amber Gold & Deep Navy) */}
              <div className="flex items-center gap-1.5 pt-1.5" aria-hidden="true">
                <div className="w-12 h-1 bg-[#D97706] rounded-sm" />
                <div className="w-24 h-1 bg-[#174789] rounded-sm" />
              </div>
            </div>

            {/* Primary Description */}
            <p className="text-[17px] sm:text-[18px] font-normal text-[#1E293B] leading-[1.6] pt-1">
              AVISHKAR provides a platform for students at GD Goenka University to explore innovative ideas, develop technical skills, and showcase their creativity through technology, and entrepreneurship.
            </p>

            {/* Secondary Description */}
            <p className="text-[#475569] text-[15px] sm:text-base leading-[1.65]">
              Through innovation-focused initiatives, AVISHKAR encourages students to apply their knowledge, explore new ideas, and develop practical solutions to real-world challenges.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-xs hover:shadow transition-all"
              >
                <span>Register as Student</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#competitions"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-white hover:bg-slate-50 border border-[#2563EB]/40 hover:border-[#2563EB] text-[#174789] font-medium text-sm shadow-2xs transition-all"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#guidelines"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-white hover:bg-slate-50 border border-[#D9E4F2] text-[#475569] hover:text-[#174789] font-medium text-sm transition-all"
              >
                <span>Guidelines &amp; Policies</span>
              </Link>
            </div>
          </div>

          {/* Right Column: High-Quality Official AVISHKAR CIE Logo */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg p-2 flex items-center justify-center">
              <Image
                src="/images/Avishkar CIE Logo 2026-New (1).png"
                alt="AVISHKAR — Center of Innovation and Entrepreneurship, GD Goenka University"
                width={1227}
                height={863}
                priority
                className="w-full h-auto max-h-[280px] sm:max-h-[320px] lg:max-h-[360px] object-contain transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* Verified Event Status / Highlight Placeholders Row */}
        <div className="mt-10 lg:mt-14 pt-6 border-t border-[#D9E4F2] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 text-center">
          {eventStatPlaceholders.map((stat, idx) => (
            <div key={idx} className="bg-[#EFF6FF]/60 border border-[#D9E4F2] rounded-lg p-3.5 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-[#475569] font-medium">
                {stat.label}
              </div>
              <div className="text-sm sm:text-base font-medium text-[#174789]">
                {stat.value}
              </div>
              {stat.subtext && (
                <div className="text-[11px] text-[#0D9488] font-normal">
                  {stat.subtext}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}


