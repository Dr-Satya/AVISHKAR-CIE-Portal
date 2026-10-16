"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  Award,
  Users,
  ArrowRight,
  Lock,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { AdminUser } from "@/types/admin";

interface PortalCardConfig {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const PORTAL_CARDS: PortalCardConfig[] = [
  {
    id: "president",
    name: "President Portal",
    description: "Executive event proposal approvals, council oversight, and institutional governance.",
    href: "/admin/president/login",
    icon: Crown,
    accentColor: "text-purple-600 bg-purple-50 border-purple-100",
  },
  {
    id: "vice-president",
    name: "Vice President Portal",
    description: "Operations coordination, proposal pipeline, and committee duties.",
    href: "/admin/vice-president/login",
    icon: Award,
    accentColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    id: "member",
    name: "Member Portal",
    description: "Submit new competition proposals and manage assigned duties.",
    href: "/admin/member/login",
    icon: Users,
    accentColor: "text-teal-600 bg-teal-50 border-teal-100",
  },
  {
    id: "admin-management",
    name: "Administrative Management Portal",
    description: "Manage event publishing, registrations, payment verification, council administration, reports, and audit logs.",
    href: "/admin/management/login",
    icon: ShieldCheck,
    accentColor: "text-blue-600 bg-blue-50 border-blue-100",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const meRes = await fetch("/api/admin/auth/me");
        if (!meRes.ok) {
          router.replace("/admin/management/login");
          return;
        }
        const meData = await meRes.json();
        if (meData.user) {
          setUser(meData.user);
          const isAdmin = meData.user.role === "Admin" || meData.user.role === "admin";
          if (!isAdmin) {
            setUnauthorized(true);
          }
        } else {
          router.replace("/admin/management/login");
        }
      } catch (err) {
        console.error("Session load error:", err);
        router.replace("/admin/management/login");
      }
    }

    loadSession();
  }, [router]);

  if (unauthorized) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-sm my-12">
        <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            This portal selection console is reserved for authorized AVISHKAR Administrators. Your current session role is{" "}
            <span className="font-semibold text-slate-800">{user?.role || "Guest"}</span>.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={
              user?.role === "President"
                ? "/admin/president"
                : user?.role === "Vice President"
                ? "/admin/vice-president"
                : user?.role === "AVISHKAR Member"
                ? "/admin/member"
                : "/admin/login"
            }
            className="px-4 py-2 rounded-lg bg-[#174789] hover:bg-[#123668] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Go to Your Authorized Dashboard ({user?.role || "Login"})
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col justify-center items-center py-4 sm:py-8">
      {/* Four Portal Cards Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PORTAL_CARDS.map((portal) => {
          const Icon = portal.icon;
          return (
            <div
              key={portal.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all p-6 sm:p-7 flex flex-col justify-between group h-full"
            >
              <div className="flex-1 flex flex-col">
                <div
                  className={`w-13 h-13 rounded-xl flex items-center justify-center border mb-5 group-hover:scale-105 transition-transform ${portal.accentColor}`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#0A2047] tracking-tight min-h-[3.5rem] flex items-start">
                  {portal.name}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-6 leading-relaxed flex-1">
                  {portal.description}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={portal.href}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#193F88] hover:bg-[#123668] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors group-hover:bg-[#2563EB]"
                >
                  <span>Open Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
