"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  CheckCircle2,
  Mail,
  Send,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";
import { ROLE_PERMISSIONS } from "@/config/admin";
import { AdminRole, AdminUser, AuditLogRecord } from "@/types/admin";

export default function AdminSettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<"roles" | "audit" | "email">("roles");

  // Email Notification Testing State
  const [testRecipient, setTestRecipient] = useState("");
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    messageId?: string;
  } | null>(null);
  const [testingConfig, setTestingConfig] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/admin/auth/me");
        if (meRes.ok) {
          const data = await meRes.json();
          setUser(data.user);
        }
      } catch {
        // ignore
      }
    }
    init();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch("/api/admin/notifications/email/test");
      if (res.ok) {
        const data = await res.json();
        setTestingConfig(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === "email") {
      fetchEmailConfig();
    }
  }, [activeTab]);

  const handleTriggerTest = async (template: string) => {
    setTestingTemplate(template);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/notifications/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          recipientEmail: testRecipient || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          messageId: data.result?.providerMessageId || data.providerMessageId,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || "Test dispatch failed",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network error",
      });
    } finally {
      setTestingTemplate(null);
    }
  };

  const userRole: AdminRole =
    user?.role === "admin" ? "Admin" : (user?.role as AdminRole) || "President";

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit" && userRole === "President") {
      fetchAuditLogs();
    }
  }, [activeTab, userRole]);

  const permissionKeys: { key: keyof typeof ROLE_PERMISSIONS["President"]; label: string }[] = [
    { key: "canViewOperationsOverview", label: "Executive Operations Overview" },
    { key: "canApproveEvents", label: "Approve / Ratify Proposed Events" },
    { key: "canCreateEvents", label: "Create & Draft Events" },
    { key: "canProposeEvents", label: "Submit Event Proposals" },
    { key: "canPublishEvents", label: "Publish Events to Public Site" },
    { key: "canManageForms", label: "Dynamic Form Builder (Config & Edit)" },
    { key: "canManageResources", label: "Manage & Approve Event Resources" },
    { key: "canSubmitResources", label: "Submit Event Rulebooks & Documents" },
    { key: "canManageRegistrations", label: "Access Student Registration Data" },
    { key: "canManageMemberRoles", label: "Promote / Assign Member Roles" },
    { key: "canAssignTasks", label: "Assign Tasks & Operational Deadlines" },
    { key: "canViewAuditLogs", label: "Access Sensitive Security Audit Logs" },
    { key: "canAccessSettings", label: "Configure Portal Parameters" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0A2047]">Security & System Administration</h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Role-Based Access Control (RBAC) governance and immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1 text-xs">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === "roles"
              ? "bg-[#0A2047] text-white shadow-xs border border-[#D4AF37]/30"
              : "text-[#64748B] hover:text-[#172033] hover:bg-[#F0F3F8]"
          }`}
        >
          Role Permissions Matrix
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#0A2047] text-white shadow-xs border border-[#D4AF37]/30"
              : "text-[#64748B] hover:text-[#172033] hover:bg-[#F0F3F8]"
          }`}
        >
          Security Audit Trail
        </button>

        <button
          onClick={() => setActiveTab("email")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "email"
              ? "bg-[#0A2047] text-white shadow-xs border border-[#D4AF37]/30"
              : "text-[#64748B] hover:text-[#172033] hover:bg-[#F0F3F8]"
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Email Notifications (Resend Test Mode)</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: ROLE PERMISSIONS MATRIX */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "roles" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="font-bold text-[#172033] text-sm">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Strict capabilities enforced on both server API handlers and database Row-Level Security policies.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#172033]">
                  <th className="py-2.5 px-3 font-bold">Operational Permission</th>
                  <th className="py-2.5 px-3 font-bold text-center text-[#B89125] bg-[#D4AF37]/10">President</th>
                  <th className="py-2.5 px-3 font-bold text-center text-[#0A2047] bg-[#0A2047]/5">Admin</th>
                  <th className="py-2.5 px-3 font-bold text-center text-[#172033] bg-[#F0F3F8]">AVISHKAR Member</th>
                  <th className="py-2.5 px-3 font-bold text-center text-[#64748B] bg-[#F5F7FA]">Student (Public)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {permissionKeys.map((item) => (
                  <tr key={item.key} className="hover:bg-[#F0F3F8]">
                    <td className="py-2.5 px-3 font-medium text-[#172033]">{item.label}</td>
                    <td className="py-2.5 px-3 text-center bg-[#D4AF37]/5">
                      {ROLE_PERMISSIONS.President[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#0A2047]/5">
                      {ROLE_PERMISSIONS.Admin[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#F0F3F8]/50">
                      {ROLE_PERMISSIONS["AVISHKAR Member"][item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#F5F7FA]">
                      {ROLE_PERMISSIONS.Student[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-rose-500 font-bold text-[11px]">Denied</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: AUDIT LOG TRAIL */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-[#172033] text-sm">Immutable Administrative Audit Log</h3>
              <p className="text-xs text-[#64748B]">
                Audits all approvals, publishing decisions, role changes, and verification actions.
              </p>
            </div>

            {userRole === "President" && (
              <button
                onClick={fetchAuditLogs}
                className="text-xs text-[#0A2047] hover:text-[#B89125] font-semibold cursor-pointer"
              >
                Refresh Log
              </button>
            )}
          </div>

          {userRole !== "President" ? (
            <div className="p-8 text-center text-[#64748B] text-xs">
              <Lock className="w-8 h-8 text-[#64748B]/50 mx-auto mb-2" />
              <p className="font-bold text-[#172033]">Restricted to President Council</p>
              <p className="mt-1">
                Security policy: Audit trail viewing requires authenticated President permissions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono px-2 py-0.5 rounded bg-[#0A2047] text-white text-[10px] border border-[#D4AF37]/30">
                        {log.action}
                      </span>
                      <span className="font-semibold text-[#172033]">
                        Target: {log.targetType} ({log.targetId})
                      </span>
                    </div>
                    <div className="text-[#64748B] text-[11px]">
                      Actor: <span className="font-mono text-[#172033]">{log.actorEmail}</span> ({log.actorRole})
                    </div>
                  </div>

                  <div className="text-[11px] text-[#64748B] font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: RESEND TESTING MODE & EMAIL TEMPLATE PREVIEW TRIGGER */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "email" && (
        <div className="space-y-5">
          {/* Status & Warning Card */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Resend Testing Mode Active (onboarding@resend.dev)</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              No custom university sending domain is currently verified. In this temporary testing mode, Resend permits outbound email delivery <strong>strictly to the email address associated with your Resend account</strong>. Messages will not be dispatched to arbitrary student addresses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-amber-900">
              <div className="bg-white/80 p-2 rounded border border-amber-200">
                <span className="text-[#64748B] block font-sans text-[10px]">Configured Sender</span>
                <strong>{testingConfig?.sender || "onboarding@resend.dev"}</strong>
              </div>
              <div className="bg-white/80 p-2 rounded border border-amber-200">
                <span className="text-[#64748B] block font-sans text-[10px]">Email Provider</span>
                <strong>{testingConfig?.provider || "resend"}</strong>
              </div>
              <div className="bg-white/80 p-2 rounded border border-amber-200">
                <span className="text-[#64748B] block font-sans text-[10px]">Encrypted Secret</span>
                <strong className={testingConfig?.hasApiKey ? "text-emerald-700" : "text-amber-700"}>
                  {testingConfig?.hasApiKey ? "RESEND_API_KEY Configured" : "Simulated Mode"}
                </strong>
              </div>
            </div>
          </div>

          {/* Test Recipient Input */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-[#0A2047] text-sm">Resend Account Test Recipient</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enter the email address registered with your Resend account. Test emails will be delivered here for end-to-end inbox verification.
              </p>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Resend Account Email Address
              </label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="e.g. your_account_email@gmail.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0A2047] focus:border-transparent font-mono"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                {testingConfig?.configuredTestRecipient ? (
                  <span>Default from environment: <code className="font-mono text-[#0A2047]">{testingConfig.configuredTestRecipient}</code></span>
                ) : (
                  <span>Tip: You can also set <code className="font-mono text-[#0A2047]">RESEND_TEST_RECIPIENT_EMAIL</code> in Worker secrets.</span>
                )}
              </p>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-red-50 text-red-900 border-red-200"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">{testResult.message}</span>
                  {testResult.messageId && (
                    <span className="text-[11px] font-mono block mt-0.5">
                      Resend Confirmation ID: {testResult.messageId}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Test Trigger Cards for the 3 Preserved Templates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Template 1: Registration Submitted / Pending */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Pending Approval
                  </span>
                </div>
                <h4 className="font-bold text-[#0A2047] text-xs mt-2">
                  1. Registration Received
                </h4>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                  Subject: <code className="text-[#0A2047] block text-[10px] mt-0.5">AVISHKAR Registration Received — Awaiting Approval</code>
                </p>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Sends mock registration summary, enrollment number, and 24-48 hr verification notice.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerTest("registration_submitted")}
                disabled={Boolean(testingTemplate)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {testingTemplate === "registration_submitted" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending to Resend...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Template 2: Registration Approved */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Approved
                  </span>
                </div>
                <h4 className="font-bold text-[#0A2047] text-xs mt-2">
                  2. Registration Approved
                </h4>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                  Subject: <code className="text-[#0A2047] block text-[10px] mt-0.5">AVISHKAR Registration Approved — GD Goenka University</code>
                </p>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Sends confirmed delegate credential pass, check-in instructions, and festival venue info.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerTest("registration_approved")}
                disabled={Boolean(testingTemplate)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {testingTemplate === "registration_approved" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending to Resend...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Template 3: Registration Rejected */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-800 border border-red-200">
                    Rejected
                  </span>
                </div>
                <h4 className="font-bold text-[#0A2047] text-xs mt-2">
                  3. Registration Rejected
                </h4>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                  Subject: <code className="text-[#0A2047] block text-[10px] mt-0.5">AVISHKAR Registration Update — GD Goenka University</code>
                </p>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Sends administrative rejection notice, reason with neutral fallback, and rectification helpdesk instructions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerTest("registration_rejected")}
                disabled={Boolean(testingTemplate)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {testingTemplate === "registration_rejected" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending to Resend...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Safe Isolation Guarantee Notice */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs text-[#64748B] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Safe Isolation Guarantee:</strong> Triggering test emails dispatches template previews to your Resend account without creating mock rows in the Supabase registrations table or altering any student payment ledgers.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
