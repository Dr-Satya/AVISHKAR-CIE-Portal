"use client";

import React, { useMemo } from "react";
import { Search, X, RotateCcw, Filter } from "lucide-react";
import { APPROVED_SCHOOLS, PROGRAMS_BY_SCHOOL, YEAR_OF_JOINING_OPTIONS, SchoolCode } from "@/config/academic";

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  school: string;
  onSchoolChange: (val: string) => void;
  program: string;
  onProgramChange: (val: string) => void;
  year: string;
  onYearChange: (val: string) => void;
  overallStatus: string;
  onOverallStatusChange: (val: string) => void;
  studentStatus: string;
  onStudentStatusChange: (val: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (val: string) => void;
  onReset: () => void;
  totalFilteredCount: number;
  totalCount: number;
}

export function RegistrationFilterBar({
  search,
  onSearchChange,
  school,
  onSchoolChange,
  program,
  onProgramChange,
  year,
  onYearChange,
  overallStatus,
  onOverallStatusChange,
  studentStatus,
  onStudentStatusChange,
  paymentStatus,
  onPaymentStatusChange,
  onReset,
  totalFilteredCount,
  totalCount,
}: FilterBarProps) {
  // Programs options based on selected school or all programs
  const availablePrograms = useMemo(() => {
    if (school && school !== "ALL" && PROGRAMS_BY_SCHOOL[school as SchoolCode]) {
      return PROGRAMS_BY_SCHOOL[school as SchoolCode];
    }
    // Collect unique programs across all schools
    const all = new Set<string>();
    Object.values(PROGRAMS_BY_SCHOOL).forEach((list) => {
      list.forEach((p) => all.add(p));
    });
    return Array.from(all);
  }, [school]);

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(school && school !== "ALL") ||
    Boolean(program && program !== "ALL") ||
    Boolean(year && year !== "ALL") ||
    Boolean(overallStatus && overallStatus !== "ALL") ||
    Boolean(studentStatus && studentStatus !== "ALL") ||
    Boolean(paymentStatus && paymentStatus !== "ALL");

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3.5">
      {/* Top Row: Search Input & Reset Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by student name, roll no / student ID, email, UTR transaction ID..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] focus:border-[#0A2047] placeholder:text-[#64748B] text-[#172033] bg-[#F5F7FA]/50 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0A2047] p-1 rounded-md transition-colors cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Filter Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* School Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            School
          </label>
          <select
            value={school}
            onChange={(e) => {
              onSchoolChange(e.target.value);
              onProgramChange("ALL");
            }}
            className={`w-full py-2 px-2.5 rounded-lg text-xs border bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2047] text-[#172033] transition-colors ${
              school !== "ALL"
                ? "border-[#0A2047] font-semibold bg-[#0A2047]/5 text-[#0A2047]"
                : "border-[#E2E8F0]"
            }`}
          >
            <option value="ALL">All Schools</option>
            {APPROVED_SCHOOLS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Program Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Program
          </label>
          <select
            value={program}
            onChange={(e) => onProgramChange(e.target.value)}
            className={`w-full py-2 px-2.5 rounded-lg text-xs border bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2047] text-[#172033] truncate transition-colors ${
              program !== "ALL"
                ? "border-[#0A2047] font-semibold bg-[#0A2047]/5 text-[#0A2047]"
                : "border-[#E2E8F0]"
            }`}
          >
            <option value="ALL">All Programs</option>
            {availablePrograms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Year of Joining Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Joining Year
          </label>
          <select
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className={`w-full py-2 px-2.5 rounded-lg text-xs border bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2047] text-[#172033] transition-colors ${
              year !== "ALL"
                ? "border-[#0A2047] font-semibold bg-[#0A2047]/5 text-[#0A2047]"
                : "border-[#E2E8F0]"
            }`}
          >
            <option value="ALL">All Years</option>
            {YEAR_OF_JOINING_OPTIONS.map((y) => (
              <option key={y} value={y}>
                Class of {y}
              </option>
            ))}
          </select>
        </div>

        {/* Overall Status */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Overall Status
          </label>
          <select
            value={overallStatus}
            onChange={(e) => onOverallStatusChange(e.target.value)}
            className={`w-full py-2 px-2.5 rounded-lg text-xs border bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2047] text-[#172033] transition-colors ${
              overallStatus !== "ALL"
                ? "border-[#0A2047] font-semibold bg-[#0A2047]/5 text-[#0A2047]"
                : "border-[#E2E8F0]"
            }`}
          >
            <option value="ALL">All Registrations</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Student Verification Status */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Student Identity
          </label>
          <select
            value={studentStatus}
            onChange={(e) => onStudentStatusChange(e.target.value)}
            className={`w-full py-2 px-2.5 rounded-lg text-xs border bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2047] text-[#172033] transition-colors ${
              studentStatus !== "ALL"
                ? "border-[#0A2047] font-semibold bg-[#0A2047]/5 text-[#0A2047]"
                : "border-[#E2E8F0]"
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Payment Verification Status */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => onPaymentStatusChange(e.target.value)}
            className={`w-full py-2 px-2.5 rounded-lg text-xs border bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2047] text-[#172033] transition-colors ${
              paymentStatus !== "ALL"
                ? "border-[#0A2047] font-semibold bg-[#0A2047]/5 text-[#0A2047]"
                : "border-[#E2E8F0]"
            }`}
          >
            <option value="ALL">All Payments</option>
            <option value="pending_verification">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Results Counter & Active Filter Badge */}
      <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]/70">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-[#0A2047] font-bold">{totalFilteredCount}</strong> of{" "}
            <strong className="text-[#172033] font-bold">{totalCount}</strong> registration
            {totalCount === 1 ? "" : "s"}
          </span>
        </div>
        {hasActiveFilters && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#0A2047] font-semibold bg-[#0A2047]/5 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>Filters Active</span>
          </span>
        )}
      </div>
    </div>
  );
}
