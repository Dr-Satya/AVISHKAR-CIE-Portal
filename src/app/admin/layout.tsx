"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
  }, [isLoginPage, pathname, router]);

  // Login page gets a clean standalone presentation without sidebar or public nav
  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  // Portal Selection landing page (/admin/dashboard): full width layout, no sidebar, compact header
  if (isDashboardPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
        {/* Simple, compact top header with no sidebar controls */}
        <header className="sticky top-0 z-20 w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/avishkar-lotus-logo.png"
              alt="AVISHKAR Lotus Logo"
              width={32}
              height={32}
              priority
              className="w-7 h-7 object-contain"
            />
            <h1 className="text-base sm:text-lg font-bold text-[#174789] tracking-tight">
              AVISHKAR 2026 — Portal Selection
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Admin</span>
            </span>
            <button
              onClick={async () => {
                await fetch("/api/admin/auth/logout", { method: "POST" });
                router.push("/admin/management/login");
                router.refresh();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
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
    if (pathname.startsWith("/admin/overview")) {
      return {
        title: "Administrative Overview",
        subtitle: "Operations hub, registration statistics, payment auditing, and live activity",
      };
    }
    if (pathname === "/admin") {
      return {
        title: "Admin Console",
        subtitle: "AVISHKAR 2026 • GD Goenka University",
      };
    }
    if (pathname === "/admin/president") {
      return {
        title: "Presidential Office",
        subtitle: "Executive Approvals & Committee Oversight",
      };
    }
    if (pathname === "/admin/vice-president") {
      return {
        title: "Operations Directorate",
        subtitle: "Event Coordination & Task Tracking",
      };
    }
    if (pathname === "/admin/dashboard") {
      return {
        title: "Portal Selection",
        subtitle: "AVISHKAR 2026 • Administrative Portals",
      };
    }
    if (pathname === "/admin/member") {
      return {
        title: "Council Workspace",
        subtitle: "Track Proposals & Assigned Activities",
      };
    }
    if (pathname.startsWith("/admin/events")) {
      return {
        title: "Event & Proposal Management",
        subtitle: "Review, approve, configure and publish event competitions",
      };
    }
    if (pathname.startsWith("/admin/forms")) {
      return {
        title: "Dynamic Form Builder",
        subtitle: "Google Forms-Style dynamic questionnaire editor for approved events",
      };
    }
    if (pathname.startsWith("/admin/resources")) {
      return {
        title: "Event Resources & Media",
        subtitle: "Rulebooks, documents, and media categorized by competition",
      };
    }
    if (pathname.startsWith("/admin/photos") || pathname.startsWith("/admin/gallery")) {
      return {
        title: "Event Photos & Gallery Management",
        subtitle: "Batch uploads, cover image selection, captions, and event photo administration",
      };
    }
    if (pathname.startsWith("/admin/registrations")) {
      return {
        title: "Registration Management",
        subtitle: "Student verification, academic credentials, and official submissions",
      };
    }
    if (pathname.startsWith("/admin/members")) {
      return {
        title: "Council & Member Management",
        subtitle: "Organizing committee roster, role permissions, and track leads",
      };
    }
    if (pathname.startsWith("/admin/settings")) {
      return {
        title: "System Settings & Audit Logs",
        subtitle: "Role-based access matrix, security parameters, and action logs",
      };
    }
    if (pathname.startsWith("/admin/payments")) {
      return {
        title: "Payment Verification Queue",
        subtitle: "UTR transaction auditing and receipt verification",
      };
    }
    if (pathname.startsWith("/admin/reports")) {
      return {
        title: "Reports & Analytics",
        subtitle: "Financial metrics, event participation, and academic trends",
      };
    }
    if (pathname.startsWith("/admin/audit-logs")) {
      return {
        title: "Security & Audit Logs",
        subtitle: "Append-only immutable trail of administrative actions and governance decisions",
      };
    }
    if (pathname.startsWith("/admin/setup")) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">
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
