"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { mainNavItems } from "@/config/site";
import { Menu, X, ArrowUpRight, Shield } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#123985] border-b border-[#1C489C]/40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between h-16 sm:h-[68px] lg:h-[72px]">
        {/* Left: Official GD Goenka University + NAAC Grade A+ Branding Lockup */}
        <Link
          href="/"
          className="flex items-center group shrink-0 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-md"
          aria-label="GD Goenka University — NAAC Grade A+ Accredited Homepage"
        >
          <div className="relative flex items-center justify-start shrink-0">
            <Image
              src="/images/home-logo.svg"
              alt="GD Goenka University | NAAC Grade A+ Accredited"
              width={300}
              height={43}
              priority
              className="h-8 sm:h-9 md:h-10 lg:h-[42px] w-auto max-w-[230px] sm:max-w-none object-contain transition-opacity duration-200 group-hover:opacity-95"
            />
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden min-[1000px]:flex items-center gap-4 xl:gap-7 mx-2 xl:mx-4 font-navbar"
          aria-label="Main Navigation"
        >
          {mainNavItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="text-[14px] xl:text-[15.5px] font-medium text-white/95 hover:text-[#2DD4BF] py-1 tracking-[0.015em] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-1.5"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Right: Actions CTA (Track Status + Student Registration) - Rectangular Buttons */}
        <div className="hidden sm:flex items-center gap-2.5 lg:gap-3 shrink-0 font-navbar">
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-md border border-white/60 hover:border-white hover:bg-white/10 text-white text-[13px] lg:text-[13.5px] font-medium tracking-[0.015em] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
            title="Check Registration & Payment Status"
          >
            <span>Track Status</span>
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 lg:px-4 lg:py-2 rounded-md border border-white/80 bg-white/10 hover:bg-white hover:text-[#123985] text-white text-[13px] lg:text-[13.5px] font-medium tracking-[0.015em] transition-all duration-200 shadow-2xs hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
          >
            <span>Student Registration</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="min-[1000px]:hidden p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="min-[1000px]:hidden bg-[#123985] border-b border-[#1C489C]/40 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200 font-navbar">
          <div className="flex items-center justify-between pb-2 border-b border-white/15 px-2">
            <span className="text-xs font-semibold text-white/75 tracking-wider uppercase">
              Navigation Menu
            </span>
            <span className="text-xs font-medium text-white/90">
              GD Goenka University
            </span>
          </div>

          <div className="space-y-1 pt-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-md text-[15px] font-medium tracking-[0.015em] text-white hover:bg-white/10 hover:text-[#2DD4BF] transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-white/15 space-y-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-md bg-white text-[#123985] hover:bg-teal-50 font-medium text-sm tracking-[0.015em] shadow-sm transition-all"
            >
              <span>Student Registration</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-md border border-white/40 text-white hover:bg-white/10 font-medium text-sm tracking-[0.015em] transition-all"
            >
              <span>Track Status</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}



