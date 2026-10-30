"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  ShieldCheck,
  AlertCircle,
  User,
  Calendar,
  Layers,
  ChevronDown,
  Trash2,
  Check,
} from "lucide-react";
import { EventRecord, EventReadinessSummary, EventReadinessItem, ReadinessCategory, MemberRecord } from "@/types/admin";

interface EventReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord | null;
  summary: EventReadinessSummary | null;
  members: MemberRecord[];
  onItemStatusChange: (itemId: string, status: "completed" | "pending" | "blocked", notes?: string) => Promise<void>;
  onAddItem: (itemData: {
    eventId: string;
    category: ReadinessCategory;
    title: string;
    description: string;
    isMandatory: boolean;
    deadline: string;
    responsibleMemberId?: string;
    responsibleMemberName?: string;
  }) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

const CATEGORY_LABELS: Record<ReadinessCategory, { label: string; icon: string }> = {
  venue_seating: { label: "Venue & Seating", icon: "🏛️" },
  equipment_technical: { label: "Equipment & Technical", icon: "⚡" },
  committee_volunteers: { label: "Committee & Volunteers", icon: "👥" },
  logistics_materials: { label: "Logistics & Materials", icon: "📦" },
  scheduling_coordination: { label: "Scheduling & Coordination", icon: "⏱️" },
  other_mandatory: { label: "Other Mandatory", icon: "📋" },
};

export function EventReadinessModal({
  isOpen,
  onClose,
  event,
  summary,
  members,
  onItemStatusChange,
  onAddItem,
  onDeleteItem,
}: EventReadinessModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | ReadinessCategory>("ALL");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<ReadinessCategory>("venue_seating");
  const [newMandatory, setNewMandatory] = useState(true);
  const [newDeadline, setNewDeadline] = useState(() =>
    new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0]
  );
  const [newMemberId, setNewMemberId] = useState("");
  const [savingItem, setSavingItem] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const items = summary?.items || [];
  const filteredItems = items.filter((i) => selectedCategory === "ALL" || i.category === selectedCategory);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg("Checklist item title is required.");
      return;
    }
    try {
      setSavingItem(true);
      setErrorMsg(null);
      const chosenMember = members.find((m) => m.id === newMemberId);
      await onAddItem({
        eventId: event.id,
        category: newCat,
        title: newTitle.trim(),
        description: newDesc.trim(),
        isMandatory: newMandatory,
        deadline: newDeadline,
        responsibleMemberId: newMemberId || undefined,
        responsibleMemberName: chosenMember?.fullName || undefined,
      });
      setNewTitle("");
      setNewDesc("");
      setIsAdding(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add checklist item.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleBlock = async (item: EventReadinessItem) => {
    if (item.status === "blocked") {
      await onItemStatusChange(item.id, "pending");
    } else {
      const reason = window.prompt("Reason for blocking this readiness requirement:", item.notes || "");
      if (reason !== null) {
        await onItemStatusChange(item.id, "blocked", reason.trim() || undefined);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2047]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-[#0A2047] to-[#132E57] text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold border border-white/20">
                {event.category}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                Operations Readiness
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <span>{event.title} — Readiness Audit Checklist</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Inspection of operational parameters, safety criteria, logistics, and technical infrastructure.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Readiness Meter Bar & Stats */}
        <div className="p-4 sm:p-5 bg-[#F5F7FA] border-b border-[#E2E8F0] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-[#0A2047]">
                {summary?.readinessPercentage || 0}%
              </div>
              <div>
                <span className="text-xs font-bold text-[#172033] block">
                  {summary?.isOperationallyReady ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Operationally Ready
                    </span>
                  ) : summary?.mandatoryIncomplete && summary.mandatoryIncomplete > 0 ? (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {summary.mandatoryIncomplete} Mandatory Incomplete
                    </span>
                  ) : (
                    <span className="text-slate-700">In Progress</span>
                  )}
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {summary?.completedItems || 0} of {summary?.totalItems || 0} requirements fulfilled
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                ✓ {summary?.completedItems || 0} Completed
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                ⏳ {summary?.pendingItems || 0} Pending
              </span>
              {summary && summary.blockedItems > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                  ⚠️ {summary.blockedItems} Blocked
                </span>
              )}
              {summary && summary.overdueItems > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 font-semibold">
                  ⏰ {summary.overdueItems} Overdue
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                summary?.isOperationallyReady
                  ? "bg-emerald-500"
                  : summary && summary.blockedItems > 0
                  ? "bg-amber-500"
                  : "bg-[#0A2047]"
              }`}
              style={{ width: `${summary?.readinessPercentage || 0}%` }}
            />
          </div>

          {/* Mandatory Gating Callout */}
          {summary && summary.mandatoryIncomplete > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Operational Gate Active:</strong> This event cannot be marked operationally ready for publishing while {summary.mandatoryIncomplete} mandatory checklist item{summary.mandatoryIncomplete > 1 ? "s remain" : " remains"} incomplete.
              </span>
            </div>
          )}
        </div>

        {/* Toolbar: Category Filters + Add Item Button */}
        <div className="p-3 sm:p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5 bg-white">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-[#0A2047] text-white"
                  : "bg-[#F0F3F8] text-[#172033] hover:bg-[#E2E8F0]"
              }`}
            >
              All Categories ({items.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as ReadinessCategory[]).map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              const hasBlocked = items.some((i) => i.category === cat && i.status === "blocked");
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedCategory === cat
                      ? "bg-[#0A2047] text-white"
                      : "bg-[#F0F3F8] text-[#172033] hover:bg-[#E2E8F0]"
                  }`}
                >
                  <span>{CATEGORY_LABELS[cat].icon}</span>
                  <span>{CATEGORY_LABELS[cat].label}</span>
                  <span className={`text-[10px] px-1 rounded ${hasBlocked ? "bg-rose-500 text-white" : "bg-black/10"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isAdding ? "Cancel" : "Add Requirement"}</span>
          </button>
        </div>

        {/* Add Item Panel */}
        {isAdding && (
          <form onSubmit={handleCreateItem} className="p-4 bg-slate-50 border-b border-[#E2E8F0] space-y-3">
            <h4 className="text-xs font-bold text-[#0A2047] uppercase tracking-wider">
              Add Operational Requirement
            </h4>
            {errorMsg && (
              <div className="p-2 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Requirement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Audio Stage Monitor Calibration & Mics"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as ReadinessCategory)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                >
                  {(Object.keys(CATEGORY_LABELS) as ReadinessCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Description / Verification Criteria</label>
                <input
                  type="text"
                  placeholder="Specific instructions or verification test parameters..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:ring-2 focus:ring-[#0A2047] focus:outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.checked)}
                  className="w-4 h-4 text-[#0A2047] rounded border-slate-300"
                />
                <span>Mandatory requirement (Must complete before event can be marked ready)</span>
              </label>

              <button
                type="submit"
                disabled={savingItem}
                className="px-4 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingItem ? "Adding..." : "Save Requirement"}
              </button>
            </div>
          </form>
        )}

        {/* Checklist Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] p-2 sm:p-4 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No requirements configured under this category.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isDone = item.status === "completed";
              const isBlocked = item.status === "blocked";
              const isOverdue = item.status === "overdue";

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDone
                      ? "bg-emerald-50/40 border-emerald-200/60"
                      : isBlocked
                      ? "bg-rose-50/60 border-rose-300"
                      : isOverdue
                      ? "bg-red-50/40 border-red-200"
                      : "bg-white border-[#E2E8F0] hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onItemStatusChange(item.id, isDone ? "pending" : "completed")}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isDone
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-[#CBD5E1] hover:border-[#0A2047]"
                          }`}
                          title={isDone ? "Mark as pending" : "Mark as completed"}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isDone ? "text-emerald-950 line-through opacity-80" : "text-[#172033]"
                          }`}
                        >
                          {item.title}
                        </span>

                        {item.isMandatory ? (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            MANDATORY
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            OPTIONAL
                          </span>
                        )}

                        {isBlocked && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                            BLOCKED
                          </span>
                        )}
                        {isOverdue && !isDone && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600 text-white">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="pl-6 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Category: <strong>{CATEGORY_LABELS[item.category]?.label || item.category}</strong>
                        </span>
                        <span>
                          Responsible: <strong>{item.responsibleMemberName || "Unassigned"}</strong>
                        </span>
                        <span>
                          Deadline: <strong className={isOverdue ? "text-rose-600 font-bold" : "text-slate-800"}>{item.deadline}</strong>
                        </span>
                        {item.completedAt && (
                          <span className="text-emerald-700">
                            Verified by: <strong>{item.completedBy || "Operations Lead"}</strong>
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="ml-6 mt-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                          <strong>Note / Impediment:</strong> {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pl-6 sm:pl-0">
                      <button
                        onClick={() => handleToggleBlock(item)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          isBlocked
                            ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                            : "bg-white hover:bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                        title={isBlocked ? "Clear blocked state" : "Flag as blocked"}
                      >
                        {isBlocked ? "Unblock" : "Flag Blocker"}
                      </button>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete requirement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs text-[#64748B]">
            AVISHKAR Operations Directorate &bull; Official Event Readiness Protocol
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Audit Checklist
          </button>
        </div>
      </div>
    </div>
  );
}
