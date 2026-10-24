import React from "react";
import Link from "next/link";
import {
  Landmark,
  ShieldCheck,
  CalendarCheck2,
  Users,
  ArrowRight,
} from "lucide-react";

interface PortalCardConfig {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  image?: string;
  imageAlt?: string;
}

const PORTAL_CARDS: PortalCardConfig[] = [
  {
    id: "admin-management",
    name: "Administrative Management Portal",
    description: "Manage event publishing, registrations, payment verification, council administration, reports, and audit logs.",
    href: "/admin/management/login",
    icon: Landmark,
  },
  {
    id: "president",
    name: "President Portal",
    description: "Executive event proposal approvals, council oversight, and institutional governance.",
    href: "/admin/president/login",
    icon: ShieldCheck,
  },
  {
    id: "vice-president",
    name: "Vice President Portal",
    description: "Operations coordination, proposal pipeline, and committee duties.",
    href: "/admin/vice-president/login",
    icon: CalendarCheck2,
  },
  {
    id: "member",
    name: "Member Portal",
    description: "Submit new competition proposals and manage assigned duties.",
    href: "/admin/member/login",
    icon: Users,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col justify-center items-center py-4 sm:py-8 font-sans">
      {/* Page Header matching main website typography */}
      <div className="text-center mb-6 sm:mb-8 max-w-2xl font-sans">
        <h1 className="font-sans text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0A2047] tracking-tight leading-snug">
          AVISHKAR Portal Selection
        </h1>
      </div>

      {/* Exactly Four Portal Cards Grid - Centered Alignment & Uniform Displays */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PORTAL_CARDS.map((portal) => {
          const Icon = portal.icon;
          return (
            <div
              key={portal.id}
              className="bg-white rounded-xl border border-[#E2E8F0] hover:border-[#D4AF37]/70 shadow-xs hover:shadow-md transition-all p-6 sm:p-7 flex flex-col justify-between group h-full"
            >
              <div className="flex-1 flex flex-col items-center text-center">
                {/* Visual Identity Emblem / Icon Container - Centered Horizontally (64-80px Display Area) */}
                <div className="w-full flex items-center justify-center mb-5 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0A2047] to-[#132E57] border border-[#D4AF37]/35 shadow-xs flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37] group-hover:shadow-md group-hover:scale-105 transition-all duration-200 shrink-0 p-3 sm:p-4">
                    {portal.image ? (
                      <img
                        src={portal.image}
                        alt={portal.imageAlt || portal.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" strokeWidth={1.75} />
                    )}
                  </div>
                </div>

                {/* Portal Card Title - Matching Website Font & Centered */}
                <h2 className="font-sans text-lg sm:text-xl font-bold text-[#0A2047] tracking-tight min-h-[3.25rem] sm:min-h-[3.5rem] flex items-center justify-center text-center group-hover:text-[#132E57] transition-colors leading-snug">
                  {portal.name}
                </h2>

                {/* Portal Description - Matching Website Font & Centered */}
                <p className="font-sans text-xs sm:text-sm text-[#64748B] mt-2 mb-6 leading-relaxed flex-1 text-center">
                  {portal.description}
                </p>
              </div>

              {/* Open Portal Action Button - Matching Website Font */}
              <div className="w-full pt-2">
                <Link
                  href={portal.href}
                  className="font-sans w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
                >
                  <span>Open Portal</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
