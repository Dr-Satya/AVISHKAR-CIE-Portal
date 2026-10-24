"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Images,
  UploadCloud,
  X,
  Star,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  Eye,
  Info,
} from "lucide-react";
import { AdminUser, EventRecord, EventPhotoRecord } from "@/types/admin";
import { Badge } from "@/components/ui/Badge";

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  isCover: boolean;
  sizeFormatted: string;
}

export default function AdminPhotosPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [eventNameInput, setEventNameInput] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<EventPhotoRecord[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered events matching input
  const filteredEvents = useMemo(() => {
    const q = eventNameInput.trim().toLowerCase();
    if (!q) return events.slice(0, 8);
    return events.filter((e) => e.title.toLowerCase().includes(q));
  }, [events, eventNameInput]);

  const handleEventNameChange = (val: string) => {
    setEventNameInput(val);
    setShowSuggestions(true);
    const trimmed = val.trim();
    if (!trimmed) {
      setSelectedEventId("");
      return;
    }
    const exactMatch = events.find(
      (e) => e.title.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exactMatch) {
      setSelectedEventId(exactMatch.id);
    } else {
      setSelectedEventId("");
    }
  };

  const handleSelectSuggestion = (evt: EventRecord) => {
    setEventNameInput(evt.title);
    setSelectedEventId(evt.id);
    setShowSuggestions(false);
  };

  // Staging state
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit caption state
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>("");
  const [savingCaption, setSavingCaption] = useState(false);

  // Delete modal state
  const [photoToDelete, setPhotoToDelete] = useState<EventPhotoRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lightbox preview for full photo
  const [previewPhoto, setPreviewPhoto] = useState<EventPhotoRecord | null>(null);

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // 1. Initial Load: user and events
  useEffect(() => {
    async function loadInitial() {
      try {
        setLoadingEvents(true);
        const [meRes, eventsRes] = await Promise.all([
          fetch("/api/admin/auth/me"),
          fetch("/api/admin/events"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const evts: EventRecord[] = eventsData.events || [];
          setEvents(evts);
        }
      } catch (err) {
        console.error("Error loading events:", err);
        setErrorMessage("Failed to load events list.");
      } finally {
        setLoadingEvents(false);
      }
    }
    loadInitial();
  }, []);

  // 2. Load photos whenever selectedEventId changes
  const fetchPhotos = async (eventId: string) => {
    if (!eventId) {
      setPhotos([]);
      return;
    }
    try {
      setLoadingPhotos(true);
      const res = await fetch(`/api/admin/photos?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      console.error("Error fetching photos:", err);
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchPhotos(selectedEventId);
      // Clean up previous staged files previews
      stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setStagedFiles([]);
    } else {
      setPhotos([]);
      stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setStagedFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // File staging handler
  const handleFilesSelected = (selectedList: FileList | null) => {
    if (!selectedList || selectedList.length === 0) return;
    if (!selectedEventId) {
      setErrorMessage("Please enter a valid event name before uploading photos.");
      return;
    }
    setErrorMessage(null);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    const newStaged: StagedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < selectedList.length; i++) {
      const file = selectedList[i];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowed.includes(file.type) && !allowedExts.includes(ext)) {
        errors.push(`'${file.name}' is not an allowed format (JPG, PNG, WebP only).`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        errors.push(`'${file.name}' exceeds the 10 MB file size limit.`);
        continue;
      }

      if (stagedFiles.length + newStaged.length >= 20) {
        errors.push("Maximum 20 photos can be staged in a single batch.");
        break;
      }

      const previewUrl = URL.createObjectURL(file);
      const isFirst = stagedFiles.length === 0 && newStaged.length === 0 && photos.length === 0;

      newStaged.push({
        id: `staged-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        caption: "",
        isCover: isFirst,
        sizeFormatted: formatBytes(file.size),
      });
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(" "));
    }

    if (newStaged.length > 0) {
      setStagedFiles((prev) => [...prev, ...newStaged]);
    }

    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const updateStagedCaption = (id: string, caption: string) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, caption } : f))
    );
  };

  const setStagedCover = (id: string) => {
    setStagedFiles((prev) =>
      prev.map((f) => ({ ...f, isCover: f.id === id }))
    );
  };

  // Upload Batch
  const handleBatchUpload = async () => {
    if (!selectedEventId) {
      setErrorMessage("Please select an event before uploading.");
      return;
    }

    if (stagedFiles.length === 0) {
      setErrorMessage("Please select at least one photo to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(15);
      setErrorMessage(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append("eventId", selectedEventId);

      const coverIndex = stagedFiles.findIndex((f) => f.isCover);
      if (coverIndex >= 0) {
        formData.append("isCoverIndex", String(coverIndex));
      }

      stagedFiles.forEach((sf, index) => {
        formData.append("photos", sf.file);
        if (sf.caption.trim()) {
          formData.append(`caption_${index}`, sf.caption.trim());
        }
      });

      setUploadProgress(45);

      const res = await fetch("/api/admin/photos", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed on the server.");
      }

      setUploadProgress(100);
      setSuccessMessage(
        data.message || `Successfully uploaded ${stagedFiles.length} photos.`
      );

      // Clean up previews
      stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setStagedFiles([]);

      // Refresh photo gallery and events list
      await fetchPhotos(selectedEventId);

      // Refresh events to get updated photoCount and coverPhotoUrl
      const evRes = await fetch("/api/admin/events");
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData.events || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading photos.";
      setErrorMessage(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Reorder Photos: Shift photo position
  const handleShiftOrder = async (index: number, direction: "left" | "right") => {
    if (!selectedEventId || photos.length <= 1) return;
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const newPhotos = [...photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;

    // Optimistic UI update
    setPhotos(newPhotos);

    try {
      const res = await fetch("/api/admin/photos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          photoIds: newPhotos.map((p) => p.id),
        }),
      });

      if (!res.ok) {
        // Rollback
        await fetchPhotos(selectedEventId);
      }
    } catch (err) {
      console.error("Error saving photo order:", err);
      await fetchPhotos(selectedEventId);
    }
  };

  // Set as Cover Photo
  const handleSetCover = async (photoId: string) => {
    try {
      const res = await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, action: "set_cover" }),
      });

      if (res.ok) {
        setSuccessMessage("Event cover photo updated successfully.");
        await fetchPhotos(selectedEventId);

        // Refresh events to update cover thumbnail in selector
        const evRes = await fetch("/api/admin/events");
        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData.events || []);
        }
      } else {
        const d = await res.json();
        setErrorMessage(d.error || "Failed to set cover photo.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error setting cover photo.";
      setErrorMessage(msg);
    }
  };

  // Save Caption Edit
  const handleSaveCaption = async (photoId: string) => {
    try {
      setSavingCaption(true);
      const res = await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, caption: editingCaption.trim() }),
      });

      if (res.ok) {
        setEditingPhotoId(null);
        setEditingCaption("");
        await fetchPhotos(selectedEventId);
      } else {
        const d = await res.json();
        setErrorMessage(d.error || "Failed to update caption.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating caption.";
      setErrorMessage(msg);
    } finally {
      setSavingCaption(false);
    }
  };

  // Delete Photo
  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/photos?photoId=${photoToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage("Photo permanently deleted from gallery.");
        setPhotoToDelete(null);
        await fetchPhotos(selectedEventId);

        // Refresh events
        const evRes = await fetch("/api/admin/events");
        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData.events || []);
        }
      } else {
        const d = await res.json();
        setErrorMessage(d.error || "Failed to delete photo.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting photo.";
      setErrorMessage(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert Messages */}
      {successMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 text-emerald-700 hover:text-emerald-900 rounded-md hover:bg-emerald-100/60 cursor-pointer"
            aria-label="Dismiss success message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-700 hover:text-rose-900 rounded-md hover:bg-rose-100/60 cursor-pointer"
            aria-label="Dismiss error message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Event Selection & Context Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20">
                <Images className="w-5 h-5 text-[#0A2047]" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#0A2047] tracking-tight">
                Event Photos / Gallery Management
              </h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Upload multiple photos, designate the official event cover photo, edit captions, and reorder photos for public exhibition.
            </p>
          </div>

          {/* Quick link to public event detail page if published */}
          {selectedEvent && selectedEvent.status === "published" && (
            <Link
              href={`/events/${selectedEvent.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#0A2047] text-xs font-semibold hover:bg-[#D4AF37]/25 transition-colors shrink-0"
              title="View on Public Website"
            >
              <span>View Public Gallery</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Event Search Input and Event Summary Strip */}
        <div className={`grid grid-cols-1 ${selectedEvent ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-4 items-start`}>
          <div className={`${selectedEvent ? "lg:col-span-2" : "lg:col-span-1"} space-y-1.5 relative`} ref={searchContainerRef}>
            <label
              htmlFor="event-name-input"
              className="block text-xs font-bold text-[#172033]"
            >
              Event Name
            </label>
            <div className="relative">
              <input
                id="event-name-input"
                type="text"
                value={eventNameInput}
                onChange={(e) => handleEventNameChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                disabled={loadingEvents}
                placeholder="Enter event name..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm font-medium text-[#172033] placeholder:text-[#64748B]/50 focus:outline-none focus:ring-2 focus:ring-[#0A2047] focus:border-transparent transition-all shadow-2xs"
                autoComplete="off"
              />
              {selectedEvent && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Matched</span>
                </span>
              )}
            </div>

            {/* Validation message if text typed but no matching event exists */}
            {eventNameInput.trim().length > 0 && !selectedEvent && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                No matching event found. Please enter a valid event name.
              </p>
            )}

            {/* Suggestions Dropdown Popup */}
            {showSuggestions && !selectedEvent && filteredEvents.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-30 py-1 divide-y divide-[#E2E8F0]/60">
                {filteredEvents.map((evt) => (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(evt)}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#F0F3F8] transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="font-semibold text-[#172033] truncate mr-2">{evt.title}</span>
                    <span className="text-[10px] text-[#64748B] flex items-center gap-1.5 shrink-0">
                      <span>{evt.category}</span>
                      <span>•</span>
                      <span className="uppercase font-bold text-[#0A2047]">{evt.status}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Event Context Pill Card (Hidden until a valid event is identified) */}
          {selectedEvent && (
            <div className="lg:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Selected Event Status
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant={
                      selectedEvent.status === "published"
                        ? "teal"
                        : selectedEvent.status === "approved"
                        ? "navy"
                        : "neutral"
                    }
                  >
                    {selectedEvent.status}
                  </Badge>
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {photos.length} photo{photos.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Cover thumbnail preview */}
              {selectedEvent.coverPhotoUrl ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedEvent.coverPhotoUrl}
                    alt={`${selectedEvent.title} Cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0 bg-white">
                  <Images className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Photo Upload & Staging Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#0A2047]" />
            <h3 className="text-base font-bold text-[#0A2047]">
              Upload Photos
            </h3>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!selectedEventId) {
              setErrorMessage("Please enter a valid event name before uploading photos.");
              return;
            }
            handleFilesSelected(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-[#D4AF37] bg-[#D4AF37]/5 scale-[1.005]"
              : "border-[#E2E8F0] hover:border-[#D4AF37] hover:bg-[#F0F3F8]"
          }`}
          onClick={() => {
            if (!selectedEventId) {
              setErrorMessage("Please enter a valid event name before uploading photos.");
              return;
            }
            fileInputRef.current?.click();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0A2047]/10 text-[#0A2047] flex items-center justify-center mx-auto shadow-2xs">
              <UploadCloud className="w-6 h-6 text-[#0A2047]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#172033]">
                Click to browse or drag and drop photos here
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>Select Photos from Computer</span>
            </button>
          </div>
        </div>

        {/* Upload Staging Preview Area (before saving) */}
        {stagedFiles.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Selected Photos Preview ({stagedFiles.length})
                </span>
                <span className="text-xs text-slate-500">
                  Add optional captions before uploading.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                  setStagedFiles([]);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Clear Selected
              </button>
            </div>

            {/* Grid of staged files */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stagedFiles.map((sf, idx) => (
                <div
                  key={sf.id}
                  className={`bg-[#F5F7FA] border rounded-xl p-3 flex flex-col justify-between space-y-2 relative transition-all ${
                    sf.isCover
                      ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#D4AF37]/5"
                      : "border-[#E2E8F0]"
                  }`}
                >
                  {/* Remove staged file button */}
                  <button
                    type="button"
                    onClick={() => removeStagedFile(sf.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-sm cursor-pointer z-10"
                    title="Remove from batch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Thumbnail Preview */}
                  <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-200 border border-[#E2E8F0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sf.previewUrl}
                      alt={sf.file.name}
                      className="w-full h-full object-cover"
                    />
                    {sf.isCover && (
                      <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2047] text-white shadow-xs">
                        <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                        Cover Image
                      </span>
                    )}
                  </div>

                  {/* File Metadata */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#172033] truncate" title={sf.file.name}>
                      {sf.file.name}
                    </p>
                    <p className="text-[11px] text-[#64748B] font-medium">
                      {sf.sizeFormatted} • Photo #{idx + 1}
                    </p>
                  </div>

                  {/* Caption Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">
                      Caption (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="Add photo caption..."
                      value={sf.caption}
                      onChange={(e) => updateStagedCaption(sf.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs bg-white text-[#172033] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A2047]"
                    />
                  </div>

                  {/* Mark as Cover Toggle */}
                  <button
                    type="button"
                    onClick={() => setStagedCover(sf.id)}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      sf.isCover
                        ? "bg-[#0A2047] text-white"
                        : "bg-white border border-[#E2E8F0] text-[#172033] hover:bg-[#F0F3F8]"
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        sf.isCover ? "fill-[#D4AF37] text-[#D4AF37]" : "text-slate-400"
                      }`}
                    />
                    <span>{sf.isCover ? "Selected as Cover" : "Make Cover Image"}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Action Bar & Progress */}
            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[#64748B] font-medium">
                Ready to upload {stagedFiles.length} photo{stagedFiles.length !== 1 ? "s" : ""} to &apos;
                {selectedEvent?.title}&apos;
              </span>

              <button
                type="button"
                onClick={handleBatchUpload}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A2047] hover:bg-[#132E57] text-white text-sm font-bold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Batch ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                    <span>Upload All ({stagedFiles.length} Photos)</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar when uploading */}
            {uploading && (
              <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing Event Gallery Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0A2047]">
              Gallery Photos ({photos.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchPhotos(selectedEventId)}
              disabled={loadingPhotos || !selectedEventId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] text-xs font-semibold hover:bg-[#F0F3F8] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Loader2 className={`w-3.5 h-3.5 ${loadingPhotos ? "animate-spin text-[#0A2047]" : ""}`} />
              <span>Refresh Gallery</span>
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {loadingPhotos ? (
          <div className="py-16 text-center text-[#64748B] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0A2047]" />
            <p className="text-xs font-semibold">Loading event photos...</p>
          </div>
        ) : !selectedEventId ? (
          <div className="text-center py-12 px-4 bg-[#F5F7FA] border border-dashed border-[#E2E8F0] rounded-2xl max-w-lg mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#0A2047]/10 text-[#0A2047] flex items-center justify-center mx-auto">
              <Images className="w-6 h-6 text-[#0A2047]" />
            </div>
            <h4 className="text-sm font-bold text-[#172033]">
              No event selected
            </h4>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Enter an event name above to view or upload photos for that event.
            </p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#F5F7FA] border border-dashed border-[#E2E8F0] rounded-2xl max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0A2047]/10 text-[#0A2047] flex items-center justify-center mx-auto">
              <Images className="w-6 h-6 text-[#0A2047]" />
            </div>
            <h4 className="text-sm font-bold text-[#172033]">
              No photos uploaded for this event yet
            </h4>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Use the upload area above to select and upload photos. Once uploaded, they will be displayed in the public gallery when this event is published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`bg-white rounded-xl border flex flex-col justify-between overflow-hidden shadow-2xs transition-all hover:shadow-sm ${
                  photo.isCover
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30"
                    : "border-[#E2E8F0]"
                }`}
              >
                {/* Photo Thumbnail Container */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || `${selectedEvent?.title} photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback icon placeholder if image fails to render
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />

                  {/* Order Tag */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0A2047]/80 text-white backdrop-blur-xs">
                    #{index + 1}
                  </span>

                  {/* Cover Tag */}
                  {photo.isCover && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0A2047] text-white shadow-xs">
                      <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                      <span>Cover Photo</span>
                    </span>
                  )}

                  {/* Hover Overlay Button to view full photo in Lightbox */}
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(photo)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity gap-1 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#D4AF37]" />
                    <span>View Large</span>
                  </button>
                </div>

                {/* Photo Details & Caption */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    {editingPhotoId === photo.id ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#172033] uppercase">
                          Edit Caption:
                        </label>
                        <input
                          type="text"
                          value={editingCaption}
                          onChange={(e) => setEditingCaption(e.target.value)}
                          placeholder="Enter caption..."
                          className="w-full px-2 py-1 rounded border border-[#E2E8F0] text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#0A2047]"
                        />
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveCaption(photo.id)}
                            disabled={savingCaption}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A2047] text-white text-[11px] font-bold hover:bg-[#132E57] cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPhotoId(null)}
                            className="px-2 py-1 rounded border border-[#E2E8F0] text-[#64748B] text-[11px] font-medium hover:bg-[#F0F3F8] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group/caption flex items-start justify-between gap-1">
                        <p
                          className={`text-xs leading-relaxed line-clamp-2 ${
                            photo.caption
                              ? "text-[#172033] font-medium"
                              : "text-slate-400 italic"
                          }`}
                        >
                          {photo.caption || "No caption added"}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPhotoId(photo.id);
                            setEditingCaption(photo.caption || "");
                          }}
                          className="text-slate-400 hover:text-[#0A2047] p-0.5 rounded cursor-pointer shrink-0"
                          title="Edit Caption"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>{formatBytes(photo.fileSize)}</span>
                      <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Bar (Set Cover, Reorder, Delete) */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {/* Cover Photo Button */}
                    {!photo.isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(photo.id)}
                        className="w-full py-1 px-2 rounded-lg border border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Star className="w-3 h-3 text-amber-500" />
                        <span>Set as Cover Photo</span>
                      </button>
                    )}

                    {/* Reorder and Delete Row */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleShiftOrder(index, "left")}
                          disabled={index === 0}
                          className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShiftOrder(index, "right")}
                          disabled={index === photos.length - 1}
                          className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(photo)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Photo Permanently?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoToDelete.url}
                  alt={photoToDelete.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-800 truncate">
                  {photoToDelete.fileName}
                </p>
                {photoToDelete.caption && (
                  <p className="text-slate-500 italic mt-0.5 line-clamp-1">
                    &quot;{photoToDelete.caption}&quot;
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  File size: {formatBytes(photoToDelete.fileSize)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete this photo from the event gallery? The image file will be purged from persistent storage and will no longer appear on public exhibition pages.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Image View */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-slate-950/80 text-white border-b border-white/10">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold truncate">
                  {previewPhoto.caption || previewPhoto.fileName}
                </h4>
                <p className="text-[11px] text-white/60">
                  {selectedEvent?.title} • {formatBytes(previewPhoto.fileSize)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption || previewPhoto.fileName}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>

            {previewPhoto.caption && (
              <div className="p-3 bg-slate-950 text-white/90 text-xs border-t border-white/10 text-center">
                {previewPhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
