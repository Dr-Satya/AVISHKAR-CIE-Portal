import React from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import { Mail, MapPin, Building2 } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" className="py-16 lg:py-20 bg-white border-b border-[#D9E4F2]">
      <Container>
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EFF6FF] text-[#174789] text-xs font-medium uppercase tracking-wider border border-[#D9E4F2]">
            Venue &amp; Inquiries
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[28px] font-normal text-[#174789] tracking-normal leading-snug">
            Contact &amp; Campus Location
          </h2>
          <p className="text-[15px] text-[#475569] leading-relaxed">
            Key institutional information and campus location details for GD Goenka University&apos;s AVISHKAR innovation fest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Support Desk / Email status */}
          <Card className="flex flex-col items-center text-center p-6 space-y-3 bg-white border border-[#D9E4F2] shadow-2xs">
            <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] border border-[#D9E4F2]">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-normal text-[20px] text-[#174789]">Support Desk</h3>
            <p className="text-[13.5px] text-[#475569]">Official event communications</p>
            {siteConfig.supportEmail ? (
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] underline"
              >
                {siteConfig.supportEmail}
              </a>
            ) : (
              <span className="text-[13px] text-[#475569] italic px-2">
                {siteConfig.supportEmailNote}
              </span>
            )}
          </Card>

          {/* Card 2: Institution */}
          <Card className="flex flex-col items-center text-center p-6 space-y-3 bg-white border border-[#D9E4F2] shadow-2xs">
            <div className="w-12 h-12 rounded-lg bg-[#F0FDFA] flex items-center justify-center text-[#0D9488] border border-teal-100">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-normal text-[20px] text-[#174789]">Host Institution</h3>
            <p className="text-[13.5px] text-[#475569]">GD Goenka University</p>
            <span className="text-xs font-medium text-[#1E293B]">
              Gurugram, Delhi-NCR, India
            </span>
          </Card>

          {/* Card 3: Campus Location */}
          <Card className="flex flex-col items-center text-center p-6 space-y-3 bg-white border border-[#D9E4F2] shadow-2xs">
            <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#174789] border border-[#D9E4F2]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-normal text-[20px] text-[#174789]">Campus Address</h3>
            <p className="text-[13.5px] text-[#475569] leading-relaxed">
              GD Goenka Education City, Sohna-Gurgaon Road, Sohna, Haryana 122103
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}


