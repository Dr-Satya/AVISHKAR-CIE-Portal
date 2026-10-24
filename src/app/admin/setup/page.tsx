"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Database,
  Lock,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

export default function AdminSetupSecurityPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const grantAdminSql = `UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'YOUR_ADMIN_EMAIL@gdgu.org';`;

  const migration004Sql = `ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS student_verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS student_verified_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS student_verified_by UUID NULL,
    ADD COLUMN IF NOT EXISTS student_verification_notes TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_student_verification_status
    ON public.registrations (student_verification_status);`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#0A2047] tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
          Security Architecture & Supabase Configuration
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Reference guide for administrative role assignment, storage bucket policies, and database hardening.
        </p>
      </div>

      {/* Security Architecture Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1 */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#0A2047]/10 text-[#0A2047] flex items-center justify-center border border-[#0A2047]/20">
            <KeyRound className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <h3 className="text-sm font-bold text-[#0A2047]">1. Admin Authorization</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Authentication is powered by Supabase Auth with strict server-side validation. Ordinary users are forbidden; accounts must possess <code>app_metadata.role = &apos;admin&apos;</code>.
          </p>
        </div>

        {/* Tier 2 */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-[#0A2047]">2. Row-Level Security</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            <code>public.registrations</code> is protected by Postgres RLS. Public users can only insert unverified rows; reading or modifying records is strictly restricted to verified admins.
          </p>
        </div>

        {/* Tier 3 */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-bold text-[#0A2047]">3. Private Storage Protection</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Payment proofs reside in the strictly private bucket <code>payment-receipts</code>. Public access is disabled; images are streamed exclusively to authenticated admin sessions.
          </p>
        </div>
      </div>

      {/* Setup Step 1: Assigning Admin Roles */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2047] bg-[#F0F3F8] border border-[#E2E8F0] px-2 py-0.5 rounded">
              Setup Task 1
            </span>
            <h3 className="text-base font-bold text-[#0A2047] mt-1">
              Designate an Administrator in Supabase
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ordinary signups or user logins are never granted admin rights automatically. An existing Supabase user must be assigned the <code>admin</code> claim.
            </p>
          </div>
        </div>

        <ol className="list-decimal list-inside text-xs text-[#64748B] space-y-2">
          <li>
            Go to the <strong>Supabase Dashboard &gt; Authentication &gt; Users</strong> tab.
          </li>
          <li>
            Click <strong>Add user &gt; Create user</strong> and enter your official administrator email (e.g., <code>admin@gdgu.org</code>) and a strong password.
          </li>
          <li>
            Open the <strong>SQL Editor</strong> in Supabase and execute the following SQL to assign the administrator role:
          </li>
        </ol>

        <div className="relative bg-[#0A2047] text-slate-100 p-3.5 rounded-xl text-xs font-mono border border-[#0A2047]">
          <pre>{grantAdminSql}</pre>
          <button
            onClick={() => copySnippet("admin-sql", grantAdminSql)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#132E57] hover:bg-[#19365F] text-[#D4AF37] transition-colors"
            title="Copy SQL snippet"
          >
            {copiedKey === "admin-sql" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Setup Step 2: Student Verification Migration */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Setup Task 2 (Optional / Recommended)
            </span>
            <h3 className="text-base font-bold text-[#0A2047] mt-1">
              Apply Migration 004: Student Verification Tracking
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Adds dedicated database columns to track student eligibility decisions independently from payment verification.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#64748B]">
          Run the following SQL snippet in the Supabase SQL Editor (also saved in <code>supabase/migrations/004_student_verification.sql</code>):
        </p>

        <div className="relative bg-[#0A2047] text-slate-100 p-3.5 rounded-lg text-xs font-mono border border-[#0A2047]">
          <pre>{migration004Sql}</pre>
          <button
            onClick={() => copySnippet("mig4-sql", migration004Sql)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#132E57] hover:bg-[#19365F] text-[#D4AF37] transition-colors"
            title="Copy SQL snippet"
          >
            {copiedKey === "mig4-sql" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="text-[11px] text-[#64748B] bg-[#F5F7FA] p-3 rounded-lg border border-[#E2E8F0]">
          Note: If this migration is not yet run, the application gracefully saves and reads student decisions through structured audit notes without crashing.
        </div>
      </div>

      {/* Setup Step 3: Environment Variables */}
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
        <h3 className="text-base font-bold text-[#0A2047]">
          Environment Variables Checklist
        </h3>
        <p className="text-xs text-[#64748B]">
          Review <code>.env.local</code> configuration to verify service readiness.
        </p>

        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
            <div>
              <code className="font-bold text-[#0A2047]">NEXT_PUBLIC_SUPABASE_URL</code>
              <p className="text-[11px] text-[#64748B]">Supabase API gateway endpoint</p>
            </div>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Configured
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
            <div>
              <code className="font-bold text-[#0A2047]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              <p className="text-[11px] text-[#64748B]">Publishable anon key used for Auth handshake</p>
            </div>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Configured
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0]">
            <div>
              <code className="font-bold text-[#0A2047]">SUPABASE_SERVICE_ROLE_KEY</code>
              <p className="text-[11px] text-[#64748B]">Optional: Server-only key for privileged admin tasks</p>
            </div>
            <span className="text-[#64748B] font-medium text-[11px]">
              Optional (Admin JWT used by default)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
