"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  CreditCard,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Building,
  GraduationCap,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { EventRecord } from "@/types/admin";

interface ReportData {
  totalRecords: number;
  paymentCounts: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
  registrationsByEvent: Array<{
    eventId: string;
    eventTitle: string;
    category: string;
    status: string;
    count: number;
    verifiedCount: number;
    formSubmissionsCount: number;
  }>;
  registrationsByAcademicYear: Array<{
    year: string;
    count: number;
  }>;
  registrationsBySchool: Array<{
    school: string;
    count: number;
  }>;
  registrationsByProgram: Array<{
    program: string;
    count: number;
  }>;
  registrationTrends: Array<{
    date: string;
    count: number;
  }>;
  totalFormSubmissions: number;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters
  const [selectedEventId, setSelectedEventId] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      setRefreshing(true);
      setErrorMessage("");

      const params = new URLSearchParams();
      if (selectedEventId && selectedEventId !== "ALL") params.set("eventId", selectedEventId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to load reports and analytics.");
        return;
      }

      const reportJson = await res.json();
      setData(reportJson);
    } catch {
      setErrorMessage("Network error loading administrative reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEventId, dateFrom, dateTo]);

  useEffect(() => {
    async function init() {
      try {
        const evRes = await fetch("/api/admin/events");
        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData.events || []);
        }
      } catch {
        // ignore
      }
      await fetchReports();
    }
    init();
  }, [fetchReports]);

  const handleExportCsv = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      if (selectedEventId && selectedEventId !== "ALL") params.set("eventId", selectedEventId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("export", "csv");

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) {
        setErrorMessage("CSV Export failed. Insufficient privileges or server error.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `avishkar_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setErrorMessage("Error downloading CSV report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0A2047] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
            Reports & Operational Analytics
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Aggregated metrics from persisted registrations, financial reviews, and event tracks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchReports}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] bg-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#0A2047]" : ""}`} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={downloading || !data || data.totalRecords === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0A2047] hover:bg-[#132E57] border border-[#D4AF37]/30 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{downloading ? "Exporting..." : "Export CSV (Sanitized)"}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="font-bold">&times;</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-[#64748B] text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Filters:</span>
          </div>

          {/* Event Filter */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white font-medium text-[#172033]"
          >
            <option value="ALL">All Events & Passes</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          {/* Date Range From */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
            />
          </div>

          {/* Date Range To */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
            />
          </div>

          {(selectedEventId !== "ALL" || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSelectedEventId("ALL");
                setDateFrom("");
                setDateTo("");
              }}
              className="text-xs text-[#0A2047] hover:text-[#B89125] font-semibold underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs font-medium text-[#64748B] text-right">
          Filtered Records: <span className="font-bold text-[#172033]">{data?.totalRecords ?? 0}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#64748B] animate-pulse bg-white rounded-xl border border-[#E2E8F0]">
          Calculating statistical metrics from backend datastore...
        </div>
      ) : !data || data.totalRecords === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#F0F3F8] text-[#64748B] mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#172033]">No Registration Records</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1">
            No student registrations match the selected event and date range filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Payment Verification Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
                <span>Total Registrations</span>
                <Users className="w-4 h-4 text-[#0A2047]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-[#172033] font-mono">
                {data.paymentCounts.total}
              </div>
              <div className="text-[10px] text-[#64748B] mt-1">Official submissions received</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
                <span>Verified Payments</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">
                {data.paymentCounts.verified}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1 font-medium">
                {data.paymentCounts.total > 0
                  ? `${Math.round((data.paymentCounts.verified / data.paymentCounts.total) * 100)}% verified rate`
                  : "0%"}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
                <span>Pending Verification</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">
                {data.paymentCounts.pending}
              </div>
              <div className="text-[10px] text-amber-600 mt-1">Awaiting financial review</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
                <span>Rejected Submissions</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-700 font-mono">
                {data.paymentCounts.rejected}
              </div>
              <div className="text-[10px] text-rose-600 mt-1">Rejection reasons recorded</div>
            </div>
          </div>

          {/* 2. Registrations Per Event Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#172033] text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0A2047]" />
                  Registrations & Participation by Event Track
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Breakdown across event competitions and questionnaire submissions.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 font-bold">Event Competition Title</th>
                    <th className="py-2.5 px-3 font-bold">Category</th>
                    <th className="py-2.5 px-3 font-bold">Status</th>
                    <th className="py-2.5 px-3 font-bold text-center">Total Sign-ups</th>
                    <th className="py-2.5 px-3 font-bold text-center">Verified Paid</th>
                    <th className="py-2.5 px-3 font-bold text-center">Form Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {data.registrationsByEvent.map((item) => (
                    <tr key={item.eventId} className="hover:bg-[#F0F3F8] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#172033]">{item.eventTitle}</td>
                      <td className="py-2.5 px-3 text-[#64748B]">{item.category}</td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0F3F8] text-[#172033] border border-[#E2E8F0]">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-[#172033]">
                        {item.count}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                        {item.verifiedCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#0A2047] font-semibold">
                        {item.formSubmissionsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Academic Year & Branch Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic School / Year */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-3">
              <h3 className="font-bold text-[#172033] text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0A2047]" />
                Registrations by Year of Joining / Academic Year
              </h3>
              <div className="space-y-2 pt-1">
                {data.registrationsByAcademicYear.map((item, idx) => {
                  const pct =
                    data.totalRecords > 0
                      ? Math.round((item.count / data.totalRecords) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#172033]">
                        <span>Cohort: {item.year}</span>
                        <span className="font-mono">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#F0F3F8] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0A2047] h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* School / Program Breakdown */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-3">
              <h3 className="font-bold text-[#172033] text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0A2047]" />
                Registrations by Academic School
              </h3>
              <div className="space-y-2 pt-1">
                {data.registrationsBySchool.map((item, idx) => {
                  const pct =
                    data.totalRecords > 0
                      ? Math.round((item.count / data.totalRecords) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#172033]">
                        <span className="truncate max-w-[240px]">{item.school}</span>
                        <span className="font-mono">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#F0F3F8] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#D4AF37] h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Registration Trends Over Time */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-[#172033] text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0A2047]" />
              Submission Trends Over Time
            </h3>
            {data.registrationTrends.length === 0 ? (
              <p className="text-xs text-[#64748B] italic">No date trends recorded.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                {data.registrationTrends.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0] text-center"
                  >
                    <div className="text-[11px] font-semibold text-[#64748B]">{t.date}</div>
                    <div className="text-lg font-bold font-mono text-[#0A2047] mt-1">{t.count}</div>
                    <div className="text-[10px] text-[#64748B]">submissions</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
