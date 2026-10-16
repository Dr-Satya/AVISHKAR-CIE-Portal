"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  CheckCircle2,
} from "lucide-react";
import { ROLE_PERMISSIONS } from "@/config/admin";
import { AdminRole, AdminUser, AuditLogRecord } from "@/types/admin";

export default function AdminSettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<"roles" | "audit">("roles");

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
        <h2 className="text-xl font-bold text-[#174789]">Security & System Administration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-Based Access Control (RBAC) governance and immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === "roles"
              ? "bg-[#174789] text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Role Permissions Matrix
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === "audit"
              ? "bg-[#174789] text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Security Audit Trail
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: ROLE PERMISSIONS MATRIX */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "roles" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict capabilities enforced on both server API handlers and database Row-Level Security policies.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-2.5 px-3 font-bold">Operational Permission</th>
                  <th className="py-2.5 px-3 font-bold text-center text-purple-800 bg-purple-50/50">President</th>
                  <th className="py-2.5 px-3 font-bold text-center text-blue-800 bg-blue-50/50">Admin</th>
                  <th className="py-2.5 px-3 font-bold text-center text-teal-800 bg-teal-50/50">AVISHKAR Member</th>
                  <th className="py-2.5 px-3 font-bold text-center text-slate-700 bg-slate-100/50">Student (Public)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionKeys.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.label}</td>
                    <td className="py-2.5 px-3 text-center bg-purple-50/20">
                      {ROLE_PERMISSIONS.President[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-blue-50/20">
                      {ROLE_PERMISSIONS.Admin[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-teal-50/20">
                      {ROLE_PERMISSIONS["AVISHKAR Member"][item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-slate-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-slate-50/40">
                      {ROLE_PERMISSIONS.Student[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-rose-400 font-bold text-[11px]">Denied</span>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Immutable Administrative Audit Log</h3>
              <p className="text-xs text-slate-500">
                Audits all approvals, publishing decisions, role changes, and verification actions.
              </p>
            </div>

            {userRole === "President" && (
              <button
                onClick={fetchAuditLogs}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Refresh Log
              </button>
            )}
          </div>

          {userRole !== "President" ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Restricted to President Council</p>
              <p className="mt-1">
                Security policy: Audit trail viewing requires authenticated President permissions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono px-2 py-0.5 rounded bg-[#174789] text-white text-[10px]">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-800">
                        Target: {log.targetType} ({log.targetId})
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Actor: <span className="font-mono text-slate-700">{log.actorEmail}</span> ({log.actorRole})
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
