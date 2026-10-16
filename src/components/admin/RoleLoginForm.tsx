"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, Crown, Award, Users, ShieldCheck } from "lucide-react";

interface RoleLoginFormProps {
  expectedRole: "President" | "Vice President" | "AVISHKAR Member" | "Admin";
  roleHeading: string;
  roleSubtitle: string;
  roleBadge: string;
  targetDashboard: string;
  accentColorClass: string;
}

export default function RoleLoginForm({
  expectedRole,
  roleHeading,
  roleSubtitle,
  roleBadge,
  targetDashboard,
  accentColorClass,
}: RoleLoginFormProps) {
  const router = useRouter();
  const PortalIcon =
    expectedRole === "President"
      ? Crown
      : expectedRole === "Vice President"
      ? Award
      : expectedRole === "Admin"
      ? ShieldCheck
      : Users;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your official email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          expectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Authentication failed. Please verify your credentials.");
        return;
      }

      // Successful role-verified login: navigate directly to role dashboard
      router.push(targetDashboard);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Network error communicating with authentication service.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* AVISHKAR 2026 Logo and Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center">
            <Image
              src="/images/avishkar-lotus-logo.png"
              alt="AVISHKAR Lotus Logo"
              width={160}
              height={100}
              priority
              className="h-20 sm:h-24 w-auto object-contain transition-transform duration-200"
            />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#174789] uppercase">
            AVISHKAR 2026
          </h1>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
            GD Goenka University &bull; Official Role Portal
          </p>
        </div>

        {/* Dedicated Role Login Card */}
        <div className="mt-7 bg-white py-8 px-6 shadow-xl rounded-xl border border-slate-200 sm:px-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${accentColorClass}`}
              >
                <PortalIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {roleBadge}
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {roleHeading}
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {roleSubtitle}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Access Restricted</strong>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    expectedRole === "Admin"
                      ? "Enter your official administrative email"
                      : `Enter your ${expectedRole.toLowerCase()} email`
                  }
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-md text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-md text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400"
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
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-bold text-white bg-[#193F88] hover:bg-[#14326D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Portal Selection */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-[#193F88] hover:text-[#14326D] hover:underline transition-colors inline-flex items-center gap-1.5"
            >
              &larr; Back to Portal Selection
            </Link>
            <Link
              href="/"
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Return to AVISHKAR public homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
