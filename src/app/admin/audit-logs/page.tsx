"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Lock,
} from "lucide-react";
import { AuditLogRecord } from "@/types/admin";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedTargetType, setSelectedTargetType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Inspect Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedAction !== "ALL") params.set("action", selectedAction);
      if (selectedTargetType !== "ALL") params.set("targetType", selectedTargetType);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access restricted: You do not have permission to view audit logs.");
        }
        throw new Error(`Failed to load audit logs (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setLogs(data.auditLogs || []);
      } else {
        throw new Error(data.error || "Failed to load audit logs");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction, selectedTargetType, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedAction("ALL");
    setSelectedTargetType("ALL");
    setDateFrom("");
    setDateTo("");
  };

  // Unique actions and target types for filter dropdowns
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const availableTargetTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.targetType) set.add(l.targetType);
    });
    return Array.from(set).sort();
  }, [logs]);

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date: iso, time: "" };
    }
  };

  const getActionBadgeColor = (action: string) => {
    const upper = action.toUpperCase();
    if (upper.includes("APPROV") || upper.includes("VERIF") || upper.includes("PUBLISH")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (upper.includes("REJECT") || upper.includes("ARCHIV") || upper.includes("DEACTIVAT")) {
      return "bg-rose-50 text-rose-800 border-rose-200";
    }
    if (upper.includes("UNPUBLISH") || upper.includes("RESET") || upper.includes("CHANGE")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (upper.includes("TASK") || upper.includes("ASSIGN") || upper.includes("ROLE")) {
      return "bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Append-Only Notice */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-[#0A2047]">Security & System Audit Logs</h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Append-only administrative trail recording governance approvals, event publication, financial decisions, and credential changes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Append-Only • Immutable
            </span>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#172033] bg-[#F0F3F8] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0A2047]" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by actor, action, target record ID, or decision note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-lg text-[#172033] focus:outline-hidden focus:border-[#0A2047] focus:ring-1 focus:ring-[#0A2047]"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-2.5 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:outline-hidden focus:border-[#0A2047]"
            >
              <option value="ALL">All Actions</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            {/* Target Type Filter */}
            <select
              value={selectedTargetType}
              onChange={(e) => setSelectedTargetType(e.target.value)}
              className="px-2.5 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033] focus:outline-hidden focus:border-[#0A2047]"
            >
              <option value="ALL">All Record Types</option>
              {availableTargetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Date From */}
            <div className="flex items-center gap-1 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs bg-transparent text-[#172033] focus:outline-hidden"
              />
            </div>

            {/* Date To */}
            <div className="flex items-center gap-1 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs bg-transparent text-[#172033] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="px-3 py-2 text-xs font-semibold text-white bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 rounded-lg transition-colors cursor-pointer"
            >
              Apply
            </button>

            {(searchQuery || selectedAction !== "ALL" || selectedTargetType !== "ALL" || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0A2047] hover:bg-[#F0F3F8] rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
          <span>
            Showing <strong className="text-[#172033]">{logs.length}</strong> recorded audit entries
          </span>
          <span className="text-[11px] text-[#64748B]">
            Records are cryptographically traceable and preserved indefinitely
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to fetch audit logs</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#64748B] gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#0A2047]" />
            <p className="text-xs font-medium">Loading audit history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-[#64748B]">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#172033]">No audit records found</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              No audit logs matched your active filter criteria. Clear your filters or check back after administrative actions occur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Affected Record</th>
                  <th className="py-3 px-4">Decision Note / Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {logs.map((log) => {
                  const ts = formatTimestamp(log.timestamp);
                  const reasonOrNote =
                    (log.metadata?.reason as string) ||
                    (log.metadata?.notes as string) ||
                    (log.metadata?.admin_notes as string) ||
                    (log.metadata?.details as string) ||
                    (log.metadata?.rejectionReason as string) ||
                    "—";

                  return (
                    <tr key={log.id} className="hover:bg-[#F0F3F8] transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-[#172033]">{ts.date}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">{ts.time}</div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#172033]">{log.actorEmail}</div>
                        <div className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F0F3F8] text-[#172033] border border-[#E2E8F0] mt-0.5">
                          {log.actorRole}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-[11px] font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Target Record */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#172033] capitalize">{log.targetType}</div>
                        <div className="font-mono text-[10px] text-[#64748B] truncate max-w-[140px]" title={log.targetId}>
                          {log.targetId}
                        </div>
                      </td>

                      {/* Summary Note */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-[#64748B] truncate" title={String(reasonOrNote)}>
                          {String(reasonOrNote)}
                        </p>
                        {log.metadata?.before !== undefined && log.metadata?.after !== undefined && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                            <span className="font-mono bg-[#F0F3F8] px-1 rounded text-[#172033]">
                              {String(log.metadata.before)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[#64748B]" />
                            <span className="font-mono bg-emerald-50 text-emerald-700 px-1 rounded font-semibold">
                              {String(log.metadata.after)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Action / Inspect */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0A2047] bg-[#0A2047]/5 hover:bg-[#0A2047]/10 border border-[#0A2047]/20 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Audit Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2047]/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-bold text-[#0A2047]">Audit Log Entry Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F5F7FA] p-3 rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] font-medium block">Entry ID</span>
                  <span className="font-mono text-[#172033] font-semibold">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Timestamp</span>
                  <span className="text-[#172033] font-semibold">
                    {formatTimestamp(selectedLog.timestamp).date} {formatTimestamp(selectedLog.timestamp).time}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Actor</span>
                  <span className="text-[#172033] font-semibold">{selectedLog.actorEmail}</span>
                  <span className="text-[11px] text-[#64748B] block">Role: {selectedLog.actorRole}</span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Action Executed</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border mt-0.5 ${getActionBadgeColor(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Target Record Type</span>
                  <span className="text-[#172033] font-semibold capitalize">{selectedLog.targetType}</span>
                </div>
                <div>
                  <span className="text-[#64748B] font-medium block">Target Record ID</span>
                  <span className="font-mono text-[#172033] font-semibold break-all">{selectedLog.targetId}</span>
                </div>
              </div>

              {/* Before / After comparison if present */}
              {selectedLog.metadata?.before !== undefined && selectedLog.metadata?.after !== undefined && (
                <div className="bg-[#0A2047]/5 border border-[#0A2047]/20 rounded-lg p-3 space-y-1">
                  <span className="font-bold text-[#0A2047] block">State Transition</span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="bg-white px-2 py-1 rounded border border-[#E2E8F0] text-[#172033]">
                      Before: <strong>{String(selectedLog.metadata.before)}</strong>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#0A2047]" />
                    <div className="bg-emerald-100 px-2 py-1 rounded border border-emerald-300 text-emerald-900">
                      After: <strong>{String(selectedLog.metadata.after)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Metadata JSON */}
              <div>
                <span className="font-semibold text-[#172033] block mb-1">
                  Full Audit Metadata (Immutable Payload)
                </span>
                <pre className="bg-[#0A2047] text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed border border-[#D4AF37]/20">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  This log is immutable and protected by server-side policy. Modifying or deleting audit log entries is disallowed by application architecture.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold text-[#172033] bg-[#F0F3F8] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
