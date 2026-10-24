import React from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import { Mail, MapPin, Building2 } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" className="py-14 sm:py-16 lg:py-20 bg-[#F5F7FA] border-b border-[#E2E8F0]">
      <Container>
        {/* Centered Section Label (Minimal, No Container, Section-relative) */}
        <div className="w-full flex items-center justify-center mb-4 sm:mb-5">
          <div className="inline-flex items-center gap-2 text-[#0A2047] text-xs font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" aria-hidden="true" />
            <span>VENUE &amp; INQUIRIES</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0A2047] tracking-tight leading-snug font-institutional">
            Contact &amp; Campus Location
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Key institutional information and campus location details for GD Goenka University&apos;s AVISHKAR innovation fest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Support Desk */}
          <Card className="flex flex-col items-center text-center p-6 space-y-3 bg-white border border-[#E2E8F0] shadow-xs hover:shadow-sm hover:border-[#D4AF37]/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-[#0A2047]/5 flex items-center justify-center text-[#0A2047] border border-[#E2E8F0]">
              <Mail className="w-5 h-5 text-[#0A2047]" />
            </div>
            <h3 className="font-bold text-lg text-[#0A2047] font-institutional">Support Desk</h3>
            <p className="text-[13px] text-[#64748B]">Official event communications</p>
            {siteConfig.supportEmail ? (
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-xs font-medium text-[#0A2047] hover:text-[#B89125] underline transition-colors"
              >
                {siteConfig.supportEmail}
              </a>
            ) : (
              <span className="text-[12.5px] text-[#64748B] italic px-2">
                {siteConfig.supportEmailNote}
              </span>
            )}
          </Card>

          {/* Card 2: Host Institution */}
          <Card className="flex flex-col items-center text-center p-6 space-y-3 bg-white border border-[#E2E8F0] shadow-xs hover:shadow-sm hover:border-[#D4AF37]/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#B89125] border border-[#D4AF37]/30">
              <Building2 className="w-5 h-5 text-[#B89125]" />
            </div>
            <h3 className="font-bold text-lg text-[#0A2047] font-institutional">Host Institution</h3>
            <p className="text-[13px] text-[#64748B]">GD Goenka University</p>
            <span className="text-xs font-medium text-[#172033]">
              Gurugram, Delhi-NCR, India
            </span>
          </Card>

          {/* Card 3: Campus Location */}
          <Card className="flex flex-col items-center text-center p-6 space-y-3 bg-white border border-[#E2E8F0] shadow-xs hover:shadow-sm hover:border-[#D4AF37]/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-[#0A2047]/5 flex items-center justify-center text-[#0A2047] border border-[#E2E8F0]">
              <MapPin className="w-5 h-5 text-[#0A2047]" />
            </div>
            <h3 className="font-bold text-lg text-[#0A2047] font-institutional">Campus Address</h3>
            <p className="text-[13px] text-[#64748B] leading-relaxed">
              GD Goenka Education City, Sohna-Gurgaon Road, Sohna, Haryana 122103
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}
