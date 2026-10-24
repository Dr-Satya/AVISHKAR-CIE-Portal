"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  FolderOpen,
  Users,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  BarChart3,
  ClipboardList,
  Images,
  X,
} from "lucide-react";
import { AdminNavItem, getNavItemsForRole } from "@/config/admin";
import { AdminRole, AdminUser } from "@/types/admin";

interface AdminSidebarProps {
  user?: AdminUser | null;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  user,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const userRole: AdminRole =
    user?.role === "admin"
      ? "Admin"
      : (user?.role as AdminRole) || "Admin";

  const getIcon = (iconName: AdminNavItem["iconName"]) => {
    switch (iconName) {
      case "LayoutDashboard":
        return <LayoutDashboard className="w-5 h-5 shrink-0" />;
      case "Calendar":
        return <Calendar className="w-5 h-5 shrink-0" />;
      case "FileText":
        return <FileText className="w-5 h-5 shrink-0" />;
      case "FolderOpen":
        return <FolderOpen className="w-5 h-5 shrink-0" />;
      case "Users":
        return <Users className="w-5 h-5 shrink-0" />;
      case "UserCheck":
        return <UserCheck className="w-5 h-5 shrink-0" />;
      case "Settings":
        return <Settings className="w-5 h-5 shrink-0" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 shrink-0" />;
      case "CreditCard":
        return <CreditCard className="w-5 h-5 shrink-0" />;
      case "BarChart3":
        return <BarChart3 className="w-5 h-5 shrink-0" />;
      case "ClipboardList":
        return <ClipboardList className="w-5 h-5 shrink-0" />;
      case "Images":
        return <Images className="w-5 h-5 shrink-0" />;
      default:
        return <LayoutDashboard className="w-5 h-5 shrink-0" />;
    }
  };

  const getRolePill = (role: AdminRole) => {
    switch (role) {
      case "President":
        return (
          <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            President
          </span>
        );
      case "Vice President":
        return (
          <span className="bg-white/10 text-white/90 border border-white/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Vice President
          </span>
        );
      case "AVISHKAR Member":
        return (
          <span className="bg-[#D4AF37]/10 text-white border border-[#D4AF37]/30 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Member
          </span>
        );
      case "Admin":
      default:
        return (
          <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Admin
          </span>
        );
    }
  };

  const roleHomeHref =
    userRole === "President"
      ? "/admin/president"
      : userRole === "Vice President"
      ? "/admin/vice-president"
      : userRole === "AVISHKAR Member"
      ? "/admin/member"
      : "/admin/overview";

  const navItems = getNavItemsForRole(userRole);

  const navContent = (
    <div className="flex flex-col h-full bg-[#0A2047] text-white border-r border-[#132E57] select-none">
      {/* Brand Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#132E57] flex items-center justify-between">
        <Link
          href={roleHomeHref}
          className="flex items-center gap-3 overflow-hidden group focus:outline-none"
        >
          <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-[#132E57] border border-[#D4AF37]/30 shadow-xs">
            <Image
              src="/images/avishkar-lotus-logo.png"
              alt="AVISHKAR Lotus Logo"
              width={36}
              height={36}
              priority
              className="w-7 h-7 object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col text-left leading-tight overflow-hidden">
              <span className="font-semibold text-white tracking-wider text-sm flex items-center gap-1.5 uppercase">
                AVISHKAR
                {getRolePill(userRole)}
              </span>
              <span className="text-[10px] text-slate-300 font-normal tracking-wide truncate">
                GD Goenka University
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List: Strictly relevant to authenticated role */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Admin Navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin/overview"
              ? pathname === "/admin/overview"
              : item.href === "/admin/dashboard"
              ? pathname === "/admin/dashboard"
              : item.href === "/admin/president"
              ? pathname === "/admin/president"
              : item.href === "/admin/vice-president"
              ? pathname === "/admin/vice-president"
              : item.href === "/admin/member"
              ? pathname === "/admin/member"
              : pathname?.startsWith(item.href) || false;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-[#132E57] text-white border-l-4 border-[#D4AF37] font-semibold shadow-xs"
                  : "text-white/80 hover:text-white hover:bg-[#132E57]/60"
              }`}
              title={collapsed ? `${item.title} (${item.description})` : item.description}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? "text-[#D4AF37]" : "text-white/70 group-hover:text-white"}>
                  {getIcon(item.iconName)}
                </span>
                {!collapsed && (
                  <span className="truncate text-white">{item.title}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Switch / Return to 4-Portal Selector */}
      <div className="p-3 border-t border-[#132E57] shrink-0">
        <Link
          href="/admin/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-[#D4AF37] hover:bg-[#132E57]/60 transition-colors"
          title="Return to Portal Selector"
        >
          <LayoutDashboard className="w-4 h-4 shrink-0 text-[#D4AF37]" />
          {!collapsed && <span>Portal Selector</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 z-30 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </div>
    </>
  );
}
