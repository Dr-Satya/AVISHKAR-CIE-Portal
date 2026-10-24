"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both administrative email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Authentication failed.");
        return;
      }

      // Successful admin login: redirect each user directly to their own role-specific dashboard
      const userRole = data.user?.role;
      const targetDashboard =
        userRole === "President"
          ? "/admin/president"
          : userRole === "Vice President"
          ? "/admin/vice-president"
          : userRole === "AVISHKAR Member"
          ? "/admin/member"
          : "/admin/dashboard";

      router.push(targetDashboard);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error communicating with authentication service.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center">
          {/* Logo on transparent background without container box/tile */}
          <div className="relative flex items-center justify-center">
            <Image
              src="/images/avishkar-logo.png"
              alt="AVISHKAR — Center of Innovation and Entrepreneurship"
              width={180}
              height={120}
              priority
              className="h-16 sm:h-20 w-auto object-contain transition-transform duration-200"
            />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#0A2047] uppercase">
            AVISHKAR 2026
          </h1>
          <p className="text-xs font-semibold text-[#64748B] tracking-wider uppercase mt-0.5">
            GD Goenka University &bull; Administrative Portal
          </p>
        </div>

        {/* Card */}
        <div className="mt-7 bg-white py-8 px-6 shadow-md rounded-xl border border-[#E2E8F0] sm:px-8">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#0A2047]">
              Staff & Organizer Sign In
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Authorized university administrators, committee leads and council members only.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Access Denied</strong>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your official email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-md text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white placeholder:text-slate-400"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-md text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] focus:border-[#0A2047] bg-white placeholder:text-slate-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-bold text-white bg-[#0A2047] hover:bg-[#132E57] active:bg-[#19365F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A2047] shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-[#64748B] hover:text-[#0A2047] transition-colors inline-flex items-center gap-1"
          >
            &larr; Return to AVISHKAR public homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
