"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import {
  MapPin,
  Mail,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Do not render the public footer inside administrative management pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="public-footer bg-[#0A2047] text-white border-t border-[#132E57] transition-colors mt-auto font-sans">
      {/* Upper Footer Grid */}
      <div className="py-12 sm:py-14 lg:py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Column 1: Institutional Identity (Span 4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Official Institutional Logo Container */}
              <div className="inline-flex items-center justify-center p-2 sm:p-2.5 bg-white rounded-xl shadow-sm border border-slate-200/80">
                <Link
                  href="/"
                  className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2047] rounded transition-transform duration-200 hover:scale-[1.02]"
                  aria-label="GD Goenka University Homepage"
                >
                  <Image
                    src="/images/gd-goenka-logo.png"
                    alt="GD Goenka University"
                    width={160}
                    height={56}
                    priority
                    className="h-11 sm:h-12 md:h-14 w-auto object-contain rounded"
                  />
                </Link>
              </div>

              {/* Dual Accent Bar */}
              <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
                <div className="w-10 h-0.5 bg-[#D4AF37] rounded-full" />
                <div className="w-20 h-0.5 bg-white/20 rounded-full" />
              </div>

              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-sm pt-1">
                AVISHKAR is the Center of Innovation and Entrepreneurship (CIE) at GD Goenka University, fostering student research, engineering prototypes, and creative problem-solving.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#132E57] border border-white/10 text-[11px] text-[#D4AF37] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>NAAC Grade A+ Accredited • Recognized by UGC</span>
              </div>
            </div>

            {/* Column 2: Navigation & Tracks (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Navigation
              </h3>
              <ul className="space-y-2 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#competitions" className="hover:text-white transition-colors">
                    Events &amp; Competitions
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" className="hover:text-white transition-colors">
                    Event Photo Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/#guidelines" className="hover:text-white transition-colors">
                    Guidelines &amp; Policies
                  </Link>
                </li>
                <li>
                  <Link href="/#about" className="hover:text-white transition-colors">
                    About AVISHKAR
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Student Services (Span 3) */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Student Services
              </h3>
              <ul className="space-y-2 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 text-white font-medium hover:text-[#D4AF37] transition-colors"
                  >
                    <span>Student Registration</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-white transition-colors">
                    Track Registration Status
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="hover:text-white transition-colors">
                    Campus Venue &amp; Directions
                  </Link>
                </li>
                <li>
                  {siteConfig.supportEmail ? (
                    <a
                      href={`mailto:${siteConfig.supportEmail}`}
                      className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3 h-3 text-[#D4AF37]" />
                      <span>Support Desk</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Support desk via campus portal</span>
                  )}
                </li>
              </ul>
            </div>

            {/* Column 4: Campus Location & Inquiries (Span 3) */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Campus &amp; Location
              </h3>
              <div className="space-y-2.5 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    GD Goenka Education City, Sohna-Gurgaon Road, Sohna, Gurugram, Delhi-NCR, Haryana 122103
                  </span>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <a
                    href="https://www.gdgoenkauniversity.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white underline transition-colors"
                  >
                    gdgoenkauniversity.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Sub-Footer Bar */}
      <div className="border-t border-[#132E57] py-5 bg-[#071733]">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p className="text-center sm:text-left">
              &copy; 2026 AVISHKAR CIE &bull; GD Goenka University. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <Link
                href="/status"
                className="hover:text-slate-200 transition-colors"
              >
                Track Status
              </Link>
              <span className="text-slate-600">&bull;</span>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:text-[#B89125] font-medium transition-colors"
                title="Staff & Administrative Access"
              >
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>Administrative Management Portal</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export function FooterFallback() {
  return (
    <footer className="public-footer bg-[#0A2047] text-white border-t border-[#132E57] transition-colors mt-auto font-sans">
      <div className="py-12 sm:py-14 lg:py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            <div className="lg:col-span-4 space-y-4">
              {/* Official Institutional Logo Container */}
              <div className="inline-flex items-center justify-center p-2 sm:p-2.5 bg-white rounded-xl shadow-sm border border-slate-200/80">
                <Link
                  href="/"
                  className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2047] rounded transition-transform duration-200 hover:scale-[1.02]"
                  aria-label="GD Goenka University Homepage"
                >
                  <Image
                    src="/images/gd-goenka-logo.png"
                    alt="GD Goenka University"
                    width={160}
                    height={56}
                    priority
                    className="h-11 sm:h-12 md:h-14 w-auto object-contain rounded"
                  />
                </Link>
              </div>
              <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
                <div className="w-10 h-0.5 bg-[#D4AF37] rounded-full" />
                <div className="w-20 h-0.5 bg-white/20 rounded-full" />
              </div>
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-sm pt-1">
                AVISHKAR is the Center of Innovation and Entrepreneurship (CIE) at GD Goenka University, fostering student research, engineering prototypes, and creative problem-solving.
              </p>
            </div>
          </div>
        </Container>
      </div>
      <div className="border-t border-white/10 bg-[#071630] py-6 text-xs text-slate-400 text-center">
        <Container>
          <p>© 2026 AVISHKAR CIE • GD Goenka University. All rights reserved.</p>
        </Container>
      </div>
    </footer>
  );
}
