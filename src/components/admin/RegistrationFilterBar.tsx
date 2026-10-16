"use client";

import { useMemo } from "react";
import { Search, X, RotateCcw } from "lucide-react";
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
    Boolean(studentStatus && studentStatus !== "ALL") ||
    Boolean(paymentStatus && paymentStatus !== "ALL");

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
      {/* Top Row: Search Input */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by student name, roll no / student ID, email, UTR transaction ID..."
            className="w-full pl-10 pr-9 py-2 rounded-lg text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Bottom Row: Filter Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {/* School Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            School
          </label>
          <select
            value={school}
            onChange={(e) => {
              onSchoolChange(e.target.value);
              // Reset program if switching schools and program is incompatible
              onProgramChange("ALL");
            }}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="ALL">All Schools</option>
            {APPROVED_SCHOOLS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}
              </option>
            ))}
          </select>
        </div>

        {/* Program Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Program
          </label>
          <select
            value={program}
            onChange={(e) => onProgramChange(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 truncate"
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
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Joining Year
          </label>
          <select
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="ALL">All Years</option>
            {YEAR_OF_JOINING_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Student Verification Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Student Status
          </label>
          <select
            value={studentStatus}
            onChange={(e) => onStudentStatusChange(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Payment Verification Status */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => onPaymentStatusChange(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg text-xs border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="ALL">All Payments</option>
            <option value="pending_verification">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing <strong className="text-slate-800">{totalFilteredCount}</strong> of{" "}
          <strong className="text-slate-800">{totalCount}</strong> registration
          {totalCount === 1 ? "" : "s"}
        </span>
        {hasActiveFilters && (
          <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
            Filters Active
          </span>
        )}
      </div>
    </div>
  );
}
