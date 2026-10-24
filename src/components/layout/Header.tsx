"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { mainNavItems } from "@/config/site";
import { Menu, X, ArrowUpRight } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="public-header sticky top-0 z-50 w-full bg-[#0A2047] border-b border-[#D4AF37]/30 shadow-[0_4px_16px_rgba(10,32,71,0.25)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between h-16 sm:h-[68px] lg:h-[72px]">
        {/* Left: Official GD Goenka University + NAAC Grade A+ Lockup */}
        <div className="flex items-center shrink-0 py-1">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-md transition-opacity duration-200 hover:opacity-95"
            aria-label="GD Goenka University — NAAC Grade A+ Accredited Homepage"
          >
            <div className="relative flex items-center justify-start shrink-0">
              <Image
                src="/images/home-logo.svg"
                alt="GD Goenka University | NAAC Grade A+ Accredited"
                width={280}
                height={40}
                priority
                className="h-7 sm:h-8 md:h-9 lg:h-10 w-auto max-w-[180px] sm:max-w-[240px] md:max-w-[280px] object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden min-[1040px]:flex items-center gap-3.5 xl:gap-6 mx-2 xl:mx-4 font-navbar"
          aria-label="Main Navigation"
        >
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`relative text-[13.5px] xl:text-[14.5px] font-medium py-2 tracking-[0.015em] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded px-1.5 ${
                  isActive
                    ? "text-[#D4AF37] font-semibold after:absolute after:bottom-0 after:left-1.5 after:right-1.5 after:h-0.5 after:bg-[#D4AF37]"
                    : "text-white/90 hover:text-[#D4AF37]"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions CTA (Track Status + Student Registration) */}
        <div className="hidden sm:flex items-center gap-2.5 lg:gap-3 shrink-0 font-navbar">
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-md border border-white/50 hover:border-white bg-transparent hover:bg-white/10 text-white text-[13px] lg:text-[13.5px] font-medium tracking-[0.015em] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] whitespace-nowrap"
            title="Check Registration & Payment Status"
          >
            <span>Track Status</span>
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 lg:px-4 lg:py-2 rounded-md bg-[#D4AF37] hover:bg-[#B89125] text-[#0A2047] text-[13px] lg:text-[13.5px] font-semibold tracking-[0.015em] transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] whitespace-nowrap group"
          >
            <span>Student Registration</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#0A2047] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="min-[1040px]:hidden p-2 rounded-md text-white hover:text-[#D4AF37] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="min-[1040px]:hidden bg-[#0A2047] border-b border-[#D4AF37]/30 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-200 font-navbar">
          <div className="flex items-center justify-between pb-2 border-b border-white/15 px-2">
            <span className="text-xs font-semibold text-[#D4AF37] tracking-wider uppercase">
              Navigation Menu
            </span>
            <span className="text-xs font-medium text-white/80">
              GD Goenka University
            </span>
          </div>

          <div className="space-y-1 pt-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-[15px] tracking-[0.015em] transition-colors ${
                    isActive
                      ? "bg-[#132E57] text-[#D4AF37] font-semibold border-l-2 border-[#D4AF37]"
                      : "text-white/90 hover:bg-[#132E57] hover:text-[#D4AF37]"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/15 space-y-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-md bg-[#D4AF37] text-[#0A2047] hover:bg-[#B89125] font-semibold text-sm tracking-[0.015em] shadow-sm transition-all"
            >
              <span>Student Registration</span>
              <ArrowUpRight className="w-4 h-4 text-[#0A2047]" />
            </Link>

            <Link
              href="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-md border border-white/50 bg-transparent text-white hover:bg-white/10 font-medium text-sm tracking-[0.015em] transition-all"
            >
              <span>Track Status</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function HeaderFallback() {
  return (
    <header className="public-header sticky top-0 z-50 w-full bg-[#0A2047] border-b border-[#D4AF37]/30 shadow-[0_4px_16px_rgba(10,32,71,0.25)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between h-16 sm:h-[68px] lg:h-[72px]">
        <div className="flex items-center shrink-0 py-1">
          <Link
            href="/"
            className="flex items-center focus:outline-none"
            aria-label="GD Goenka University — NAAC Grade A+ Accredited Homepage"
          >
            <div className="relative flex items-center justify-start shrink-0">
              <Image
                src="/images/home-logo.svg"
                alt="GD Goenka University | NAAC Grade A+ Accredited"
                width={280}
                height={40}
                priority
                className="h-7 sm:h-8 md:h-9 w-auto max-w-[180px] sm:max-w-[240px] md:max-w-[280px] object-contain"
              />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
          <span className="text-xs font-bold text-[#D4AF37] tracking-wider">AVISHKAR 2026</span>
        </div>
      </div>
    </header>
  );
}
