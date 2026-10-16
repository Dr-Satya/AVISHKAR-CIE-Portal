"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { AdminUser, EventRecord } from "@/types/admin";
import {
  getPresidentDecision,
  getVicePresidentDecision,
  getOverallApprovalStatus,
} from "@/components/admin/EventApprovalTracker";

interface ReportsData {
  totalRegistrations: number;
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
  }>;
}

export default function AdministrativeOverviewPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // 1. Session verification
      const userRes = await fetch("/api/admin/auth/me");
      if (!userRes.ok) {
        throw new Error("Unable to verify administrative session.");
      }
      const userData = await userRes.json();
      setUser(userData.user || null);

      // 2. Fetch live data concurrently from existing endpoints
      const [reportsRes, eventsRes] = await Promise.allSettled([
        fetch("/api/admin/reports"),
        fetch("/api/admin/events"),
      ]);

      if (reportsRes.status === "fulfilled" && reportsRes.value.ok) {
        const repData = await reportsRes.value.json();
        setReportsData({
          totalRegistrations: repData.totalRegistrations || 0,
          paymentCounts: repData.paymentCounts || {
            pending: 0,
            verified: 0,
            rejected: 0,
            total: 0,
          },
          registrationsByEvent: repData.registrationsByEvent || [],
        });
      }

      if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
        const evData = await eventsRes.value.json();
        setEvents(evData.events || []);
      }

      setLastRefreshed(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load administrative overview data";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived event statistics
  const totalEvents = events.length;
  const publishedEventsCount = events.filter((e) => e.status === "published").length;
  const approvedEventsCount = events.filter((e) => e.status === "approved").length;
  const proposedEventsCount = events.filter((e) => e.status === "proposed").length;

  const approvalStats = React.useMemo(() => {
    let pendingPresident = 0;
    let pendingVp = 0;
    let readyForPublication = 0;
    let published = 0;
    let rejected = 0;

    for (const e of events) {
      const overall = getOverallApprovalStatus(e);
      if (overall.stage === "published") published++;
      else if (overall.stage === "rejected") rejected++;
      else if (overall.stage === "ready_for_publication") readyForPublication++;
      else if (overall.stage === "awaiting_next_approval") pendingVp++;
      else if (overall.stage === "pending_approval") pendingPresident++;
    }

    const actionable = events.filter((e) => {
      const overall = getOverallApprovalStatus(e);
      return (
        overall.stage === "pending_approval" ||
        overall.stage === "awaiting_next_approval" ||
        overall.stage === "ready_for_publication"
      );
    });

    return {
      pendingPresident,
      pendingVp,
      readyForPublication,
      published,
      rejected,
      actionable,
    };
  }, [events]);

  const totalRegistrations = reportsData?.paymentCounts?.total ?? 0;
  const pendingPayments = reportsData?.paymentCounts?.pending ?? 0;
  const verifiedPayments = reportsData?.paymentCounts?.verified ?? 0;
  const rejectedPayments = reportsData?.paymentCounts?.rejected ?? 0;


  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0E2A5C] via-[#143A7B] to-[#1E4D9F] text-white rounded-xl py-6 px-4 sm:px-8 shadow-sm border border-[#1B3F7E] flex items-center justify-center text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white text-center">
          Administrative Management Overview
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs sm:text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchData()}
            className="font-bold underline hover:text-red-900 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registrations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Registrations
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
                {totalRegistrations}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">All submissions</span>
            <Link
              href="/admin/reports"
              className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Reports <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Pending Payment Verifications */}
        <div className="bg-white rounded-xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-xs hover:border-amber-400 transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Pending Payments
                </p>
                {pendingPayments > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1.5">
                {pendingPayments}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
            <span className="text-amber-700/80 font-medium">Awaiting review</span>
            <Link
              href="/admin/payments"
              className="font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              Verify <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Approved Payments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-400 transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Approved Payments
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
                {verifiedPayments}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Confirmed seats</span>
            <Link
              href="/admin/payments"
              className="font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              Queue <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Rejected Payments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-rose-400 transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Rejected Payments
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
                {rejectedPayments}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Invalid UTR / slips</span>
            <Link
              href="/admin/payments"
              className="font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              Audits <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Events Publication */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-purple-400 transition-colors flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                Published Events
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
                {publishedEventsCount}{" "}
                <span className="text-sm font-semibold text-slate-400">/ {totalEvents}</span>
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{approvedEventsCount} approved</span>
            <Link
              href="/admin/events"
              className="font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Events <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>



      {/* Event Approval Pipeline Tracker Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#174789]/10 text-[#174789] flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">
                  Event Approval Pipeline
                </h2>
                {approvalStats.actionable.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    {approvalStats.actionable.length} Action Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track Vice President and President sign-offs, identifying delays before public event launch.
              </p>
            </div>
          </div>

          <Link
            href="/admin/events?tab=tracker"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#174789] hover:bg-[#0E2A5C] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <span>Open Approval Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pipeline Stage Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-white text-xs">
          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
              Total Proposals
            </span>
            <span className="text-xl font-black text-slate-800 mt-0.5 block">
              {totalEvents}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-amber-700 block tracking-wider">
              Pending Pres.
            </span>
            <span className="text-xl font-black text-amber-600 mt-0.5 block">
              {approvalStats.pendingPresident}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-indigo-700 block tracking-wider">
              Pending VP
            </span>
            <span className="text-xl font-black text-indigo-600 mt-0.5 block">
              {approvalStats.pendingVp}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-emerald-700 block tracking-wider">
              Ready to Publish
            </span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">
              {approvalStats.readyForPublication}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-teal-700 block tracking-wider">
              Published Live
            </span>
            <span className="text-xl font-black text-teal-600 mt-0.5 block">
              {approvalStats.published}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-rose-700 block tracking-wider">
              Rejected
            </span>
            <span className="text-xl font-black text-rose-600 mt-0.5 block">
              {approvalStats.rejected}
            </span>
          </div>
        </div>

        {/* Actionable Proposals Queue */}
        <div className="divide-y divide-slate-100 text-xs">
          {approvalStats.actionable.length === 0 ? (
            <div className="p-5 text-center text-slate-400 text-xs">
              No event proposals currently awaiting executive decision. All tracks are processed.
            </div>
          ) : (
            approvalStats.actionable.slice(0, 4).map((evt) => {
              const overall = getOverallApprovalStatus(evt);
              const presDec = getPresidentDecision(evt);
              const vpDec = getVicePresidentDecision(evt);
              const PresIcon = presDec.icon;
              const VpIcon = vpDec.icon;

              return (
                <div
                  key={evt.id}
                  className="p-3.5 sm:px-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {evt.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wide">
                        {evt.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${overall.badgeClass}`}>
                        {overall.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Proposed by <strong className="text-slate-700 font-medium">{evt.proposedBy}</strong></span>
                      <span>•</span>
                      <span>Target: {evt.datePlaceholder || evt.proposedDateTime || "TBA"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {/* VP Badge */}
                    <div className="flex items-center gap-1 text-[11px]" title={`VP Status: ${vpDec.label}`}>
                      <span className="text-slate-400">VP:</span>
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${vpDec.badgeClass}`}>
                        <VpIcon className="w-2.5 h-2.5" />
                        <span>{vpDec.label}</span>
                      </span>
                    </div>

                    {/* Pres Badge */}
                    <div className="flex items-center gap-1 text-[11px]" title={`President Status: ${presDec.label}`}>
                      <span className="text-slate-400">Pres:</span>
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${presDec.badgeClass}`}>
                        <PresIcon className="w-2.5 h-2.5" />
                        <span>{presDec.label}</span>
                      </span>
                    </div>

                    {/* Blocking Actor */}
                    <span className="text-[11px] font-bold text-[#174789] bg-blue-50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap">
                      Next: {overall.nextActor}
                    </span>

                    <Link
                      href="/admin/events?tab=tracker"
                      className="text-xs font-semibold text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      Track
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>



      {/* Footer Timestamp */}
      {lastRefreshed && (
        <div className="text-right text-[11px] text-slate-400 font-mono">
          Overview synchronized: {lastRefreshed}
        </div>
      )}
    </div>
  );
}
