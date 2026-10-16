"use client";

import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  PlusCircle,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { AdminRole, AdminUser, EventRecord, EventResourceRecord, ResourceCategory } from "@/types/admin";

export default function AdminResourcesPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [resources, setResources] = useState<EventResourceRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Upload Form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadEventId, setUploadEventId] = useState("");
  const [uploadCategory, setUploadCategory] = useState<ResourceCategory>("rulebook");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileSize, setUploadFileSize] = useState("1.5 MB");
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/resources");
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
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
          const meData = await meRes.json();
          setUser(meData.user);
        }
        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData.events || []);
          if (evData.events?.length > 0) {
            setUploadEventId(evData.events[0].id);
          }
        }
        await fetchResources();
      } catch {
        // ignore
      }
    }
    init();
  }, []);

  const userRole: AdminRole =
    user?.role === "admin" ? "Admin" : (user?.role as AdminRole) || "President";

  const handleApprove = async (resourceId: string) => {
    try {
      const res = await fetch("/api/admin/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, action: "approve" }),
      });
      if (res.ok) {
        setMessage("Resource approved successfully.");
        setTimeout(() => setMessage(null), 4000);
        await fetchResources();
      }
    } catch {
      setMessage("Error approving resource.");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadEventId) return;

    try {
      setUploading(true);
      const ev = events.find((e) => e.id === uploadEventId);
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: uploadEventId,
          eventTitle: ev?.title || "Competition",
          title: uploadTitle,
          category: uploadCategory,
          fileUrl: `/docs/${uploadFileName || "document.pdf"}`,
          fileName: uploadFileName || `${uploadTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          fileSize: uploadFileSize || "1.2 MB",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setTimeout(() => setMessage(null), 4000);
        setModalOpen(false);
        setUploadTitle("");
        setUploadFileName("");
        await fetchResources();
      }
    } catch {
      setMessage("Error uploading resource.");
    } finally {
      setUploading(false);
    }
  };

  const filtered = resources.filter((r) => {
    if (selectedEventId !== "ALL" && r.eventId !== selectedEventId) return false;
    if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
    return true;
  });

  const getCategoryIcon = (cat: ResourceCategory) => {
    switch (cat) {
      case "rulebook":
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case "photo":
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case "guide":
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case "link":
        return <ExternalLink className="w-5 h-5 text-amber-600" />;
      case "document":
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#174789]">Competition Resources & Media</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rulebooks, technical regulations, schedules, and promotional graphics organized by event.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload Event Resource</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Filter Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Competitions</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="rulebook">Rulebooks</option>
              <option value="document">Documents</option>
              <option value="photo">Photos & Media</option>
              <option value="guide">Guides</option>
              <option value="link">Links</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400">
          Showing {filtered.length} of {resources.length} resources
        </span>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Resource / Asset</th>
                <th className="py-3 px-4 font-bold">Competition Track</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Uploaded By</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                        {getCategoryIcon(r.category)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{r.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.fileName} &bull; {r.fileSize}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{r.eventTitle}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {r.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{r.uploadedBy}</td>
                  <td className="py-3 px-4">
                    {r.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Review
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === "pending_review" && (userRole === "President" || userRole === "Admin") && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-2xs"
                        >
                          Approve
                        </button>
                      )}
                      <a
                        href={r.fileUrl}
                        download
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Upload Event Resource</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Competition *</label>
                <select
                  required
                  value={uploadEventId}
                  onChange={(e) => setUploadEventId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Official Arena Layout Diagram 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as ResourceCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="rulebook">Rulebook</option>
                    <option value="document">Document</option>
                    <option value="photo">Photo / Graphic</option>
                    <option value="guide">Guide</option>
                    <option value="link">Link</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Size</label>
                  <input
                    type="text"
                    value={uploadFileSize}
                    onChange={(e) => setUploadFileSize(e.target.value)}
                    placeholder="e.g., 2.1 MB"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="e.g., robowars-arena-specs.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Save Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
