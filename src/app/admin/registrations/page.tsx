"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, RefreshCw, Users, AlertCircle, CheckCircle2, X } from "lucide-react";
import { RegistrationFilterBar } from "@/components/admin/RegistrationFilterBar";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { RegistrationDetailModal } from "@/components/admin/RegistrationDetailModal";
import { RegistrationDecisionModal } from "@/components/admin/RegistrationDecisionModal";
import { RegistrationRecord } from "@/types/admin";

function RegistrationsContent() {
  const searchParams = useSearchParams();

  // Filter States initialized directly from query params
  const [search, setSearch] = useState("");
  const [school, setSchool] = useState(() => searchParams.get("school") || "ALL");
  const [program, setProgram] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [studentStatus, setStudentStatus] = useState(
    () => searchParams.get("studentStatus") || "ALL"
  );
  const [paymentStatus, setPaymentStatus] = useState(
    () => searchParams.get("paymentStatus") || "ALL"
  );

  // Data State
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<RegistrationRecord | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    registration: RegistrationRecord | null;
    action: "approve" | "reject";
  }>({
    isOpen: false,
    registration: null,
    action: "approve",
  });

  const fetchRegistrations = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage("");

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (school && school !== "ALL") params.set("school", school);
      if (program && program !== "ALL") params.set("program", program);
      if (year && year !== "ALL") params.set("year", year);
      if (studentStatus && studentStatus !== "ALL") params.set("studentStatus", studentStatus);
      if (paymentStatus && paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus);

      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to load registrations.");
        return;
      }

      const data = await res.json();
      setRegistrations(data.registrations || []);
      setTotalCount(data.totalCount || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error loading registrations.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, school, program, year, studentStatus, paymentStatus]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ignore) {
        await fetchRegistrations();
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [fetchRegistrations]);

  const handleResetFilters = () => {
    setSearch("");
    setSchool("ALL");
    setProgram("ALL");
    setYear("ALL");
    setStudentStatus("ALL");
    setPaymentStatus("ALL");
  };

  const handleApproveRegistration = (reg: RegistrationRecord) => {
    setErrorMessage("");
    setDecisionModal({
      isOpen: true,
      registration: reg,
      action: "approve",
    });
  };

  const handleRejectRegistration = (reg: RegistrationRecord) => {
    setErrorMessage("");
    setDecisionModal({
      isOpen: true,
      registration: reg,
      action: "reject",
    });
  };

  const handleDecisionSuccess = (updatedRecord: RegistrationRecord) => {
    const isApproved = updatedRecord.student_verification_status === "verified";
    setSuccessMessage(
      `Registration for ${updatedRecord.student_name} (${updatedRecord.student_id}) successfully ${
        isApproved ? "approved" : "rejected"
      }.`
    );
    fetchRegistrations();
  };

  const exportCsv = () => {
    if (registrations.length === 0) return;

    const headers = [
      "Registration Number",
      "Student Name",
      "Student ID / Roll No",
      "Email",
      "Contact Number",
      "Gender",
      "DOB",
      "School",
      "Program",
      "Year of Joining",
      "Student Verification Status",
      "Payment Status",
      "Fee Amount",
      "Transaction ID / UTR",
      "Payment Date",
      "Remarks",
      "Submitted At",
    ];

    const rows = registrations.map((r) => [
      `"${r.registration_number || ""}"`,
      `"${r.student_name || ""}"`,
      `"${r.student_id || ""}"`,
      `"${r.email || ""}"`,
      `"${r.contact_number || ""}"`,
      `"${r.gender || ""}"`,
      `"${r.dob || ""}"`,
      `"${r.school || ""}"`,
      `"${r.program || ""}"`,
      `"${r.year_of_joining || ""}"`,
      `"${r.student_verification_status || ""}"`,
      `"${r.payment_status || ""}"`,
      `"${r.fee_amount || ""}"`,
      `"${r.transaction_id || ""}"`,
      `"${r.payment_date || ""}"`,
      `"${(r.remarks || "").replace(/"/g, '""')}"`,
      `"${r.created_at || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `avishkar_registrations_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0A2047] tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            Registration Directory
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Search, filter, and inspect student registrations across GD Goenka University schools.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRegistrations}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] bg-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0A2047]" : "text-[#64748B]"}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCsv}
            disabled={registrations.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#172033] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] bg-white shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex justify-between items-center gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2.5 items-start">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5">Error Loading Registrations</strong>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <RegistrationFilterBar
        search={search}
        onSearchChange={setSearch}
        school={school}
        onSchoolChange={setSchool}
        program={program}
        onProgramChange={setProgram}
        year={year}
        onYearChange={setYear}
        studentStatus={studentStatus}
        onStudentStatusChange={setStudentStatus}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={setPaymentStatus}
        onReset={handleResetFilters}
        totalFilteredCount={registrations.length}
        totalCount={totalCount}
      />

      {/* Table */}
      <RegistrationTable
        registrations={registrations}
        isLoading={isLoading}
        onSelectRegistration={(reg) => setSelectedRecord(reg)}
        onApproveRegistration={handleApproveRegistration}
        onRejectRegistration={handleRejectRegistration}
      />

      {/* Registration Decision Confirmation Modal */}
      <RegistrationDecisionModal
        isOpen={decisionModal.isOpen}
        registration={decisionModal.registration}
        action={decisionModal.action}
        onClose={() => setDecisionModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={handleDecisionSuccess}
      />

      {/* Detail Modal */}
      <RegistrationDetailModal
        registration={selectedRecord}
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        onUpdateSuccess={() => {
          setSelectedRecord(null);
          fetchRegistrations();
        }}
      />
    </div>
  );
}

export default function RegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-slate-400">Loading registrations...</div>
      }
    >
      <RegistrationsContent />
    </Suspense>
  );
}
