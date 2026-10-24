"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminUser } from "@/types/admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  const isLoginPage =
    pathname === "/admin/login" ||
    pathname === "/admin/president/login" ||
    pathname === "/admin/vice-president/login" ||
    pathname === "/admin/member/login" ||
    pathname === "/admin/management/login" ||
    pathname?.endsWith("/login");
  const isDashboardPage = pathname === "/admin/dashboard";

  useEffect(() => {
    if (isLoginPage) return;

    let mounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (!res.ok) {
          if (mounted) {
            // Portal selection page (/admin/dashboard) must remain accessible without active session
            if (isDashboardPage) return;

            if (pathname?.startsWith("/admin/president")) {
              router.push("/admin/president/login");
            } else if (pathname?.startsWith("/admin/vice-president")) {
              router.push("/admin/vice-president/login");
            } else if (pathname?.startsWith("/admin/member")) {
              router.push("/admin/member/login");
            } else {
              router.push("/admin/management/login");
            }
          }
          return;
        }
        const data = await res.json();
        if (mounted && data.user) {
          setUser(data.user);
        }
      } catch {
        if (mounted) {
          if (isDashboardPage) return;

          if (pathname?.startsWith("/admin/president")) {
            router.push("/admin/president/login");
          } else if (pathname?.startsWith("/admin/vice-president")) {
            router.push("/admin/vice-president/login");
          } else if (pathname?.startsWith("/admin/member")) {
            router.push("/admin/member/login");
          } else {
            router.push("/admin/management/login");
          }
        }
      }
    }

    checkSession();
    return () => {
      mounted = false;
    };
  }, [isLoginPage, isDashboardPage, pathname, router]);

  // Login page gets a clean standalone presentation without sidebar or public nav
  if (isLoginPage) {
    return <div className="min-h-screen bg-[#F5F7FA]" data-admin-portal="true">{children}</div>;
  }

  // Portal Selection landing page (/admin/dashboard): full width layout, no sidebar, compact header
  if (isDashboardPage) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col text-[#172033]" data-admin-portal="true">
        {/* Institutional Deep Navy Blue Portal Selection Header matching main AVISHKAR portal */}
        <header className="sticky top-0 z-30 w-full bg-[#0A2047] border-b border-[#D4AF37]/30 shadow-[0_4px_16px_rgba(10,32,71,0.25)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between h-16 sm:h-[68px] lg:h-[72px]">
            {/* Left: Official GD Goenka University + NAAC Grade A+ Logo Lockup */}
            <div className="flex items-center shrink-0 py-1">
              {/* Official GD Goenka University Logo Lockup */}
              <Link
                href="/"
                className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-md transition-opacity duration-200 hover:opacity-95 shrink-0"
                aria-label="GD Goenka University Homepage"
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

            {/* Right: Return to Website navigation action */}
            <div className="flex items-center font-navbar">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md border border-white/40 hover:border-white bg-transparent hover:bg-white/10 text-white text-xs sm:text-[13px] font-medium tracking-[0.015em] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] whitespace-nowrap"
                title="Return to AVISHKAR Main Website"
              >
                <span>&larr; Return to Website</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content occupies full browser width */}
        <main className="flex-1 w-full flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
          {children}
        </main>
      </div>
    );
  }

  const getPageHeader = () => {
    const p = pathname || "";
    if (pathname.startsWith("/admin/overview")) {
      return {
        title: "Administrative Overview",
        subtitle: "Operations hub, registration statistics, payment auditing, and live activity",
      };
    }
    if (p === "/admin") {
      return {
        title: "Admin Console",
        subtitle: "AVISHKAR 2026 • GD Goenka University",
      };
    }
    if (p === "/admin/president") {
      return {
        title: "Presidential Office",
        subtitle: "Executive Approvals & Committee Oversight",
      };
    }
    if (p === "/admin/vice-president") {
      return {
        title: "Operations Directorate",
        subtitle: "Event Coordination & Task Tracking",
      };
    }
    if (p === "/admin/dashboard") {
      return {
        title: "Portal Selection",
        subtitle: "AVISHKAR 2026 • Administrative Portals",
      };
    }
    if (p === "/admin/member") {
      return {
        title: "Council Workspace",
        subtitle: "Track Proposals & Assigned Activities",
      };
    }
    if (p.startsWith("/admin/events")) {
      return {
        title: "Event & Proposal Management",
        subtitle: "Review, approve, configure and publish event competitions",
      };
    }
    if (p.startsWith("/admin/forms")) {
      return {
        title: "Dynamic Form Builder",
        subtitle: "Google Forms-Style dynamic questionnaire editor for approved events",
      };
    }
    if (p.startsWith("/admin/resources")) {
      return {
        title: "Event Resources & Media",
        subtitle: "Rulebooks, documents, and media categorized by competition",
      };
    }
    if (p.startsWith("/admin/photos") || p.startsWith("/admin/gallery")) {
      return {
        title: "Event Photos & Gallery Management",
        subtitle: "Batch uploads, cover image selection, captions, and event photo administration",
      };
    }
    if (p.startsWith("/admin/registrations")) {
      return {
        title: "Registration Management",
        subtitle: "Student verification, academic credentials, and official submissions",
      };
    }
    if (p.startsWith("/admin/members")) {
      return {
        title: "Council & Member Management",
        subtitle: "Organizing committee roster, role permissions, and track leads",
      };
    }
    if (p.startsWith("/admin/settings")) {
      return {
        title: "System Settings & Audit Logs",
        subtitle: "Role-based access matrix, security parameters, and action logs",
      };
    }
    if (p.startsWith("/admin/payments")) {
      return {
        title: "Payment Verification Queue",
        subtitle: "UTR transaction auditing and receipt verification",
      };
    }
    if (p.startsWith("/admin/reports")) {
      return {
        title: "Reports & Analytics",
        subtitle: "Financial metrics, event participation, and academic trends",
      };
    }
    if (p.startsWith("/admin/audit-logs")) {
      return {
        title: "Security & Audit Logs",
        subtitle: "Append-only immutable trail of administrative actions and governance decisions",
      };
    }
    if (p.startsWith("/admin/setup")) {
      return {
        title: "Security & System Setup",
        subtitle: "Supabase connection and PostgreSQL RLS configuration",
      };
    }
    return {
      title: "Administrative Console",
      subtitle: "AVISHKAR 2026 • GD Goenka University",
    };
  };

  const headerMeta = getPageHeader();

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col lg:flex-row text-[#172033]" data-admin-portal="true">
      {/* Sidebar (Desktop persistent, Mobile off-canvas) */}
      <AdminSidebar
        user={user}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Administrative Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={user}
          onOpenMobile={() => setMobileOpen(true)}
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
