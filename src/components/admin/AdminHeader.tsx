"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  RefreshCw,
  User,
  Bell,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  Check,
  Send,
  Globe,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { AdminUser, NotificationRecord } from "@/types/admin";

interface AdminHeaderProps {
  user?: AdminUser | null;
  onOpenMobile?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  user,
  onOpenMobile,
  onRefresh,
  isRefreshing = false,
  title = "Administrative Console",
  subtitle = "Official Operations & Management Portal",
}: AdminHeaderProps) {
  const pathname = usePathname();
  const role = user?.role || "Admin";
  const isAdminManagement =
    role === "Admin" ||
    role === "admin" ||
    (pathname &&
      !pathname.startsWith("/admin/president") &&
      !pathname.startsWith("/admin/vice-president") &&
      !pathname.startsWith("/admin/member"));

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.role]);

  // Handle click outside to close notification panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleItemClick = async (notif: NotificationRecord) => {
    if (!notif.read) {
      try {
        await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("Failed to mark item read:", err);
      }
    }
    setIsNotifOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case "rejection":
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case "proposal":
        return <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />;
      case "task":
        return <Send className="w-4 h-4 text-[#0A2047] shrink-0" />;
      case "publish":
        return <Globe className="w-4 h-4 text-[#0A2047] shrink-0" />;
      case "payment":
        return <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "President":
        return {
          bg: "bg-[#0A2047]/10 text-[#0A2047] border-[#D4AF37]/50",
          dot: "bg-[#D4AF37]",
          label: "President Council",
        };
      case "Vice President":
        return {
          bg: "bg-[#132E57]/10 text-[#132E57] border-[#132E57]/30",
          dot: "bg-[#132E57]",
          label: "Vice President Council",
        };
      case "AVISHKAR Member":
        return {
          bg: "bg-[#0A2047]/5 text-[#0A2047] border-[#E2E8F0]",
          dot: "bg-[#D4AF37]",
          label: "AVISHKAR Member",
        };
      case "Admin":
      default:
        return {
          bg: "bg-[#0A2047]/10 text-[#0A2047] border-[#0A2047]/30",
          dot: "bg-[#0A2047]",
          label: "Portal Administrator",
        };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-lg text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] focus:outline-none focus:ring-2 focus:ring-[#0A2047]"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <span className="text-base sm:text-lg font-bold text-[#0A2047] leading-tight truncate block">
            {title}
          </span>
          <p className="text-xs text-[#64748B] hidden sm:block truncate">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={() => {
              onRefresh();
              fetchNotifications();
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] transition-colors disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? "animate-spin text-[#0A2047]" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        )}

        {/* Notification Bell with Badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 rounded-lg text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A2047]/30"
            aria-label="Notifications"
            title="Council Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DC2626] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-3 bg-[#F5F7FA] border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0A2047]" />
                  <span className="text-xs sm:text-sm font-bold text-[#172033]">
                    Council Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#0A2047]/10 text-[#0A2047] text-[10px] font-bold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#0A2047] hover:text-[#D4AF37] font-bold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No recent notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`p-3.5 hover:bg-[#F0F3F8] transition-colors cursor-pointer flex items-start gap-3 ${
                        !notif.read ? "bg-[#0A2047]/5" : ""
                      }`}
                    >
                      <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#172033] truncate">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>
                            {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {notif.link && (
                            <Link
                              href={notif.link}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(notif);
                              }}
                              className="text-[#0A2047] hover:text-[#D4AF37] hover:underline flex items-center gap-0.5 font-medium transition-colors"
                            >
                              <span>View</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-[#F5F7FA] border-t border-[#E2E8F0] text-center">
                <span className="text-[11px] text-[#64748B]">
                  Notifications refresh on page actions
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Role Badge (President, Vice President, and Member portals only) */}
        {!isAdminManagement && badge && (
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${badge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
            <span>{badge.label}</span>
          </div>
        )}

        {/* User profile (President, Vice President, and Member portals only) */}
        {!isAdminManagement && user?.email && (
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#E2E8F0] text-xs text-[#64748B]">
            <div className="w-7 h-7 rounded-full bg-[#0A2047]/10 text-[#0A2047] font-bold flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span
              className="max-w-[140px] truncate font-semibold text-[#172033]"
              title={user.email}
            >
              {user.fullName || user.email.split("@")[0]}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
