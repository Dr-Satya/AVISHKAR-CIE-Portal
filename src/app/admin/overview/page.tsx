"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Layers,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { AdminUser, EventRecord, DashboardStats, RegistrationRecord } from "@/types/admin";
import {
  getPresidentDecision,
  getVicePresidentDecision,
  getOverallApprovalStatus,
} from "@/components/admin/EventApprovalTracker";

export default function AdministrativeOverviewPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<RegistrationRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // 1. Session verification
      const userRes = await fetch("/api/admin/auth/me", { cache: "no-store" });
      if (!userRes.ok) {
        throw new Error("Unable to verify administrative session.");
      }
      const userData = await userRes.json();
      setUser(userData.user || null);

      // 2. Fetch live data concurrently from authentic API endpoints
      const timestamp = Date.now();
      const [statsRes, eventsRes] = await Promise.allSettled([
        fetch(`/api/admin/stats?t=${timestamp}`, { cache: "no-store" }),
        fetch(`/api/admin/events?t=${timestamp}`, { cache: "no-store" }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
        if (Array.isArray(statsData.recentRegistrations)) {
          setRecentRegistrations(statsData.recentRegistrations);
        }
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

  // Derived event statistics for pipeline
  const totalEvents = events.length;

  const approvalStats = useMemo(() => {
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

  // Format payment status badge
  const renderPaymentBadge = (status?: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Verified</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-2.5 h-2.5" />
            <span>Rejected</span>
          </span>
        );
      case "pending_verification":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Administrative Identity */}
      <div className="bg-[#0A2047] text-white rounded-xl py-6 px-4 sm:px-8 shadow-xs border border-[#D4AF37]/30 border-b-2 border-b-[#D4AF37] flex flex-col md:flex-row items-center justify-between text-center md:text-left relative overflow-hidden gap-4">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
            <span>GD Goenka University</span>
            <span>•</span>
            <span>Official Admin Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Administrative Management Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live operations monitor for student registrations, fee verification, and executive event approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {lastRefreshed && (
            <span className="text-xs text-slate-300 hidden sm:inline-block font-mono">
              Synced: {lastRefreshed}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#D4AF37]" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Sync Live Data"}</span>
          </button>
        </div>
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

      {/*
        ========================================================================
        1. TOP SUMMARY CARDS (6 Clickable Cards in a Responsive Grid)
        - Every card is fully clickable (entire card wrapped in a Link)
        - Connected to existing routes with proper query filters
        - Live authentic counts from /api/admin/stats
        ========================================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Registered Students */}
        <Link
          href="/admin/registrations"
          className="group block bg-white rounded-xl border border-[#E2E8F0] hover:border-[#0A2047]/60 p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          title="Click to view all registered students"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-[#0A2047] uppercase tracking-wider">
                Total Registered Students
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#0A2047]/5 border border-[#0A2047]/15 flex items-center justify-center text-[#0A2047] shrink-0 group-hover:bg-[#0A2047] group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2047] font-mono tracking-tight">
                {stats?.totalRegistrations ?? 0}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-1">
                All student registrations
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#64748B] font-medium">Show all</span>
            <span className="font-semibold text-[#0A2047] group-hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Card 2: Pending Registrations */}
        <Link
          href="/admin/registrations?status=pending"
          className="group block bg-white rounded-xl border border-[#E2E8F0] hover:border-amber-400 p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          title="Click to view pending registrations awaiting admin review"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#0A2047] uppercase tracking-wider">
                  Pending Registrations
                </span>
                {(stats?.pendingRegistrations ?? 0) > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Review
                  </span>
                )}
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D97706] shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2047] font-mono tracking-tight">
                {stats?.pendingRegistrations ?? 0}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-1">
                Awaiting admin review
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-amber-700/80 font-medium">Filtered review</span>
            <span className="font-semibold text-[#0A2047] group-hover:text-amber-700 flex items-center gap-1 transition-colors">
              <span>Inspect</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Card 3: Payments Approved */}
        <Link
          href="/admin/payments?status=verified"
          className="group block bg-white rounded-xl border border-[#E2E8F0] hover:border-emerald-400 p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          title="Click to view approved & verified payments"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#0A2047] uppercase tracking-wider">
                  Payments Approved
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16A34A] shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2047] font-mono tracking-tight">
                {stats?.paymentsApproved ?? 0}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-1">
                Admin-verified payments
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-emerald-700/80 font-medium">Verified list</span>
            <span className="font-semibold text-[#0A2047] group-hover:text-emerald-700 flex items-center gap-1 transition-colors">
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Card 4: Payments Rejected */}
        <Link
          href="/admin/payments?status=rejected"
          className="group block bg-white rounded-xl border border-[#E2E8F0] hover:border-rose-400 p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          title="Click to view rejected payments"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#0A2047] uppercase tracking-wider">
                  Payments Rejected
                </span>
                {(stats?.paymentsRejected ?? 0) > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Audit
                  </span>
                )}
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#DC2626] shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2047] font-mono tracking-tight">
                {stats?.paymentsRejected ?? 0}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-1">
                Declined or invalid slips
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-rose-700/80 font-medium">Rejected list</span>
            <span className="font-semibold text-[#0A2047] group-hover:text-rose-700 flex items-center gap-1 transition-colors">
              <span>Inspect</span>
              <ChevronRight className="w-3.5 h-3.5 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Card 5: Published Events */}
        <Link
          href="/admin/events?status=published"
          className="group block bg-white rounded-xl border border-[#E2E8F0] hover:border-blue-400 p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          title="Click to view published events visible to students"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#0A2047] uppercase tracking-wider">
                  Published Events
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Live
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2047] font-mono tracking-tight">
                {stats?.publishedEvents ?? 0}{" "}
                <span className="text-xs font-normal text-[#64748B]">
                  / {stats?.totalEvents ?? totalEvents}
                </span>
              </h2>
              <p className="text-[11px] text-[#64748B] mt-1">
                Visible to students
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-blue-700/80 font-medium">Published view</span>
            <span className="font-semibold text-[#0A2047] group-hover:text-blue-700 flex items-center gap-1 transition-colors">
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Card 6: Main / Events Management */}
        <Link
          href="/admin/events"
          className="group block bg-gradient-to-br from-white to-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#D4AF37] p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          title="Click to open the main Events Management page"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#0A2047] uppercase tracking-wider">
                  Events Management
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#D4AF37]/15 text-[#0A2047] border border-[#D4AF37]/40">
                  Main Hub
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#0A2047] shrink-0 group-hover:bg-[#0A2047] group-hover:text-[#D4AF37] transition-colors">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#0A2047] tracking-tight mt-1">
                Full Control
              </h2>
              <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                Create, edit, publish & manage all events
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#0A2047] font-semibold">Manage events</span>
            <span className="font-semibold text-[#0A2047] group-hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
              <span>Open</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/*
        ========================================================================
        2. EVENT APPROVAL PIPELINE TRACKER SECTION
        - Retains executive tracking for President and Vice President sign-offs
        ========================================================================
      */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F5F7FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0A2047]/10 text-[#0A2047] flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-[#0A2047] text-base">
                  Event Approval Pipeline
                </h2>
                {approvalStats.actionable.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    {approvalStats.actionable.length} Action Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Track Vice President and President sign-offs, identifying delays before public event launch.
              </p>
            </div>
          </div>

          <Link
            href="/admin/events?tab=tracker"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <span>Open Approval Tracker</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
          </Link>
        </div>

        {/* Pipeline Stage Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-[#E2E8F0] border-b border-[#E2E8F0] bg-white text-xs">
          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-[#0A2047] block tracking-wider">
              Total Proposals
            </span>
            <span className="text-xl font-black text-[#0A2047] mt-0.5 block font-mono">
              {totalEvents}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-amber-700 block tracking-wider">
              Pending Pres.
            </span>
            <span className="text-xl font-black text-amber-600 mt-0.5 block font-mono">
              {approvalStats.pendingPresident}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-[#132E57] block tracking-wider">
              Pending VP
            </span>
            <span className="text-xl font-black text-[#132E57] mt-0.5 block font-mono">
              {approvalStats.pendingVp}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-emerald-700 block tracking-wider">
              Ready to Publish
            </span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block font-mono">
              {approvalStats.readyForPublication}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-[#0A2047] block tracking-wider">
              Published Live
            </span>
            <span className="text-xl font-black text-[#0A2047] mt-0.5 block font-mono">
              {approvalStats.published}
            </span>
          </div>

          <div className="p-3.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase text-rose-700 block tracking-wider">
              Rejected
            </span>
            <span className="text-xl font-black text-rose-600 mt-0.5 block font-mono">
              {approvalStats.rejected}
            </span>
          </div>
        </div>

        {/* Actionable Proposals Queue */}
        <div className="divide-y divide-[#E2E8F0] text-xs">
          {approvalStats.actionable.length === 0 ? (
            <div className="p-5 text-center text-[#64748B] text-xs">
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
                  className="p-3.5 sm:px-5 hover:bg-[#F0F3F8]/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#172033] text-sm">
                        {evt.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F5F7FA] text-[#64748B] border border-[#E2E8F0] uppercase tracking-wide">
                        {evt.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${overall.badgeClass}`}>
                        {overall.label}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] mt-1 flex items-center gap-2 flex-wrap">
                      <span>Proposed by <strong className="text-[#172033] font-semibold">{evt.proposedBy}</strong></span>
                      <span>•</span>
                      <span>Target: {evt.datePlaceholder || evt.proposedDateTime || "TBA"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {/* VP Badge */}
                    <div className="flex items-center gap-1 text-[11px]" title={`VP Status: ${vpDec.label}`}>
                      <span className="text-[#64748B]">VP:</span>
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${vpDec.badgeClass}`}>
                        <VpIcon className="w-2.5 h-2.5" />
                        <span>{vpDec.label}</span>
                      </span>
                    </div>

                    {/* Pres Badge */}
                    <div className="flex items-center gap-1 text-[11px]" title={`President Status: ${presDec.label}`}>
                      <span className="text-[#64748B]">Pres:</span>
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${presDec.badgeClass}`}>
                        <PresIcon className="w-2.5 h-2.5" />
                        <span>{presDec.label}</span>
                      </span>
                    </div>

                    {/* Blocking Actor */}
                    <span className="text-[11px] font-bold text-[#0A2047] bg-[#0A2047]/10 px-2 py-1 rounded border border-[#0A2047]/20 whitespace-nowrap">
                      Next: {overall.nextActor}
                    </span>

                    <Link
                      href="/admin/events?tab=tracker"
                      className="text-xs font-semibold text-[#0A2047] hover:text-[#D4AF37] px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-[#F0F3F8] transition-colors"
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

      {/*
        ========================================================================
        3. LOWER SECTION: RECENT REGISTRATIONS & QUICK ACTIONS
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F5F7FA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0A2047]" />
                <h3 className="font-bold text-[#0A2047] text-sm sm:text-base">
                  Recent Student Registrations
                </h3>
              </div>
              <Link
                href="/admin/registrations"
                className="text-xs font-semibold text-[#0A2047] hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
              >
                <span>View All ({stats?.totalRegistrations ?? 0})</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-3">Roll / ID</th>
                    <th className="py-3 px-3">School</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Student Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {recentRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748B]">
                        No student registrations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentRegistrations.slice(0, 5).map((reg) => (
                      <tr key={reg.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#172033]">
                            {reg.student_name}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {reg.email}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#0A2047]">
                          {reg.student_id || "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2047]/5 text-[#0A2047] border border-[#0A2047]/10 uppercase">
                            {reg.school || "GDGU"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {renderPaymentBadge(reg.payment_status)}
                        </td>
                        <td className="py-3 px-3">
                          {reg.student_verification_status === "verified" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Verified</span>
                            </span>
                          ) : reg.student_verification_status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-2.5 h-2.5" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/admin/registrations"
                            className="font-semibold text-xs text-[#0A2047] hover:text-[#D4AF37] transition-colors"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-right">
            <Link
              href="/admin/registrations"
              className="text-xs font-semibold text-[#0A2047] hover:text-[#D4AF37] inline-flex items-center gap-1"
            >
              <span>Manage all student registrations</span>
              <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
            </Link>
          </div>
        </div>

        {/* Quick Administrative Shortcuts (1 Col) */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-bold text-[#0A2047] text-sm sm:text-base">
                Administrative Shortcuts
              </h3>
            </div>

            <div className="mt-4 space-y-2.5">
              <Link
                href="/admin/events"
                className="group p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0A2047] hover:bg-[#F8FAFC] transition-all flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#0A2047] group-hover:text-[#0A2047]">
                    Manage Events & Competitions
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Create, edit, and publish technical fests
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0A2047] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/payments?status=pending"
                className="group p-3 rounded-lg border border-[#E2E8F0] hover:border-amber-400 hover:bg-amber-50/30 transition-all flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#0A2047] group-hover:text-amber-800">
                    Verify Student Payments
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Process UTR numbers and receipt slips
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/registrations"
                className="group p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0A2047] hover:bg-[#F8FAFC] transition-all flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#0A2047]">
                    Student Registration Directory
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Search and filter enrolled participants
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0A2047] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/reports"
                className="group p-3 rounded-lg border border-[#E2E8F0] hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#0A2047] group-hover:text-emerald-800">
                    Export Reports & CSVs
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Download sanitized university audit sheets
                  </div>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>AVISHKAR 2026 Engine</span>
            <span className="font-semibold text-[#0A2047]">GD Goenka University</span>
          </div>
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
