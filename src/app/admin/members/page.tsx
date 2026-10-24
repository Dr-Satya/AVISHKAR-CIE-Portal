"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  PlusCircle,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Building,
  Calendar,
  Layers,
  Edit2,
  KeyRound,
  UserX,
  UserCheck2,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { AdminRole, AdminUser, EventRecord, MemberRecord } from "@/types/admin";

export default function AdminMembersPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    open: boolean;
    member: MemberRecord;
    targetStatus: "active" | "suspended";
  } | null>(null);

  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [temporaryToken, setTemporaryToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // New Member form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("AVISHKAR Member");
  const [department, setDepartment] = useState("Organizing Committee");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, evRes] = await Promise.all([
          fetch("/api/admin/auth/me"),
          fetch("/api/admin/events"),
        ]);
        if (meRes.ok) {
          const data = await meRes.json();
          setUser(data.user);
        }
        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData.events || []);
        }
        await fetchMembers();
      } catch {
        // ignore
      }
    }
    init();
  }, []);

  const userRole: AdminRole =
    user?.role === "admin" ? "Admin" : (user?.role as AdminRole) || "Admin";

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          role,
          department,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to add member.");
        return;
      }

      setMessage(data.message);
      if (data.tempPassword) {
        setTemporaryToken(data.tempPassword);
      }
      setTimeout(() => setMessage(null), 5000);
      setModalOpen(false);
      setFullName("");
      setEmail("");
      await fetchMembers();
    } catch {
      setErrorMessage("Network error adding member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: AdminRole) => {
    try {
      setErrorMessage(null);
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update role.");
        return;
      }

      setMessage(data.message);
      setTimeout(() => setMessage(null), 4000);
      setRoleModalOpen(false);
      await fetchMembers();
    } catch {
      setErrorMessage("Error updating role.");
    }
  };

  const handleStatusChange = async (member: MemberRecord, targetStatus: "active" | "suspended") => {
    try {
      setErrorMessage(null);
      setConfirmStatusModal(null);

      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          status: targetStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to change account status.");
        return;
      }

      setMessage(
        `Account for ${member.fullName} marked as ${targetStatus === "active" ? "Activated" : "Deactivated"}.`
      );
      setTimeout(() => setMessage(null), 4000);
      await fetchMembers();
    } catch {
      setErrorMessage("Network error updating status.");
    }
  };

  const handleResetPassword = async (member: MemberRecord) => {
    try {
      setErrorMessage(null);
      setSubmitting(true);

      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          action: "reset-password",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to reset credentials.");
        return;
      }

      setTemporaryToken(data.tempPassword || null);
      setSelectedMember(member);
      setResetModalOpen(true);
    } catch {
      setErrorMessage("Network error resetting password.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.department && m.department.toLowerCase().includes(q))
    );
  });

  const getRoleBadge = (r: AdminRole) => {
    switch (r) {
      case "President":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#0A2047] text-[#D4AF37] border border-[#D4AF37]/40">
            President
          </span>
        );
      case "Vice President":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#132E57] text-[#D4AF37] border border-[#D4AF37]/30">
            Vice President
          </span>
        );
      case "Admin":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#0A2047] text-white border border-[#0A2047]">
            Admin
          </span>
        );
      case "AVISHKAR Member":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#F0F3F8] text-[#0A2047] border border-[#E2E8F0]">
            Council Member
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0A2047] tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#D4AF37]" />
            Organizing Council & Role Management
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage committee members, enforce server-side RBAC, and handle credential lifecycle.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A2047] hover:bg-[#132E57] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>Add Council Member</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer">&times;</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-700 hover:text-rose-900 cursor-pointer">&times;</button>
        </div>
      )}


      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by member name, email, or role..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#0A2047] bg-white placeholder:text-[#64748B] text-[#172033]"
          />
        </div>
      </div>

      {/* Members Roster Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-bold">Member Name & Email</th>
                <th className="py-3.5 px-4 font-bold">Assigned Role</th>
                <th className="py-3.5 px-4 font-bold">Department / Society</th>
                <th className="py-3.5 px-4 font-bold">Assigned Tracks</th>
                <th className="py-3.5 px-4 font-bold">Account Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredMembers.map((m) => {
                const assignedEvs = events.filter((e) => m.assignedEventIds?.includes(e.id));
                const isDeactivated = m.status === "suspended";

                return (
                  <tr key={m.id} className="hover:bg-[#F0F3F8] transition-colors">
                    {/* Name & Email */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-bold text-[#172033] text-sm">{m.fullName}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1 font-mono mt-0.5">
                        <Mail className="w-3 h-3 text-[#64748B]" />
                        <span>{m.email}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">{getRoleBadge(m.role)}</td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-[#172033]">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                        <span>{m.department}</span>
                      </div>
                    </td>

                    {/* Assigned Tracks */}
                    <td className="py-3.5 px-4">
                      {assignedEvs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedEvs.map((ev) => (
                            <span
                              key={ev.id}
                              className="px-2 py-0.5 rounded bg-[#F0F3F8] text-[#0A2047] border border-[#E2E8F0] text-[10px] font-medium"
                            >
                              {ev.title.split(":")[0]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#64748B] italic text-[11px]">No tracks assigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isDeactivated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Deactivated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Manage Role (President only) */}
                        {userRole === "President" && (
                          <button
                            onClick={() => {
                              setSelectedMember(m);
                              setRoleModalOpen(true);
                            }}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] transition-colors cursor-pointer"
                            title="Manage Member Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(m)}
                          className="p-1.5 rounded-md text-[#64748B] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0] transition-colors cursor-pointer"
                          title="Generate Temporary Credential / Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </button>

                        {/* Toggle Activation / Deactivation */}
                        {isDeactivated ? (
                          <button
                            onClick={() =>
                              setConfirmStatusModal({
                                open: true,
                                member: m,
                                targetStatus: "active",
                              })
                            }
                            className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                            title="Activate Account"
                          >
                            <UserCheck2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmStatusModal({
                                open: true,
                                member: m,
                                targetStatus: "suspended",
                              })
                            }
                            className="p-1.5 rounded-md text-[#64748B] hover:text-rose-600 hover:bg-rose-50 border border-[#E2E8F0] transition-colors cursor-pointer"
                            title="Deactivate Account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Status Confirmation Modal (Anti-Lockout Protected) */}
      {confirmStatusModal && confirmStatusModal.open && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#172033] text-base">
                  {confirmStatusModal.targetStatus === "suspended"
                    ? "Confirm Account Deactivation"
                    : "Confirm Account Reactivation"}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {confirmStatusModal.targetStatus === "suspended"
                    ? "Deactivating an account suspends login access while preserving historical assignments and proposals."
                    : "Reactivating will restore council login privileges."}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0] text-xs space-y-1">
              <div>Member: <span className="font-bold text-[#172033]">{confirmStatusModal.member.fullName}</span></div>
              <div>Email: <span className="font-mono text-[#172033]">{confirmStatusModal.member.email}</span></div>
              <div>Role: <span className="font-bold text-[#0A2047]">{confirmStatusModal.member.role}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setConfirmStatusModal(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleStatusChange(confirmStatusModal.member, confirmStatusModal.targetStatus)
                }
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-xs cursor-pointer ${
                  confirmStatusModal.targetStatus === "suspended"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Yes, {confirmStatusModal.targetStatus === "suspended" ? "Deactivate Account" : "Reactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Result Modal */}
      {resetModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-[#172033] text-base">Credential Reset Complete</h3>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="text-[#64748B] hover:text-[#0A2047] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              A temporary authentication credential has been securely provisioned for{" "}
              <strong className="text-[#172033]">{selectedMember.fullName}</strong>. Plaintext passwords are never stored.
            </p>

            {temporaryToken && (
              <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Temporary Access Token
                </span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#E2E8F0]">
                  <code className="text-xs font-mono font-bold text-[#0A2047] select-all">
                    {temporaryToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(temporaryToken)}
                    className="p-1 text-[#64748B] hover:text-[#0A2047] rounded transition-colors cursor-pointer"
                    title="Copy Temporary Password"
                  >
                    {copiedToken ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal (President Only) */}
      {roleModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#172033] text-base">Assign Council Role</h3>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="text-[#64748B] hover:text-[#0A2047] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0] space-y-1">
              <div>Member: <span className="font-bold text-[#172033]">{selectedMember.fullName}</span></div>
              <div>Current Role: <span className="font-bold text-[#0A2047]">{selectedMember.role}</span></div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-[#172033]">Select New Role</label>
              {(["President", "Vice President", "Admin", "AVISHKAR Member"] as AdminRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleUpdateRole(selectedMember.id, r)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    selectedMember.role === r
                      ? "border-[#0A2047] bg-[#F0F3F8] font-bold text-[#0A2047]"
                      : "border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033]"
                  }`}
                >
                  <span>{r}</span>
                  {selectedMember.role === r && <Check className="w-4 h-4 text-[#D4AF37]" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0] text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#172033] text-base">Add Organizing Member</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#64748B] hover:text-[#0A2047] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block font-bold text-[#172033] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Ananya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047] focus:outline-none text-[#172033]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Official University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@gdgoenka.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047] focus:outline-none text-[#172033]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Department / Society</label>
                <input
                  type="text"
                  placeholder="e.g., School of Engineering & Sciences (SOES)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047] focus:outline-none text-[#172033]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047] focus:outline-none bg-white font-medium text-[#172033]"
                >
                  <option value="AVISHKAR Member">Council Member (Technical Track Lead)</option>
                  {userRole === "President" && (
                    <>
                      <option value="Admin">Organizing Administrator</option>
                      <option value="Vice President">Vice President (Operations Co-Lead)</option>
                      <option value="President">President (Executive Lead)</option>
                    </>
                  )}
                </select>
                {userRole !== "President" && (
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Only President can grant executive council roles.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {submitting ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
