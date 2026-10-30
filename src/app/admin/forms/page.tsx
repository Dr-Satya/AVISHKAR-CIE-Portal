"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  UploadCloud,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  History,
  CreditCard,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Users,
} from "lucide-react";
import {
  EventFormRecord,
  FormField,
  FormFieldType,
  FormVersionSnapshot,
} from "@/types/admin";
import { generateQrCodeDataUrl } from "@/lib/qrCode";

export default function AdminFormsPage() {
  // Event Name & Team Member Capacity Configuration (Manual entry, no existing event dropdown)
  const [eventName, setEventName] = useState<string>("");
  const [teamSizeMin, setTeamSizeMin] = useState<number | string>(2);
  const [teamSizeMax, setTeamSizeMax] = useState<number | string>(4);
  const [savedEventId, setSavedEventId] = useState<string>("");
  const [savedForms, setSavedForms] = useState<EventFormRecord[]>([]);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    eventName?: string;
    teamSizeMin?: string;
    teamSizeMax?: string;
    feeAmount?: string;
    dates?: string;
  }>({});

  // Step flow: 'config' -> 'review' -> 'publish'
  const [currentStep, setCurrentStep] = useState<"config" | "review" | "publish">("config");

  // Configuration Form State (Preserved)
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [feeAmount, setFeeAmount] = useState<string>("100");
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationEndDate, setRegistrationEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [versionHistory, setVersionHistory] = useState<FormVersionSnapshot[]>([]);

  // AI Generation State
  const [customPrompt, setCustomPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiProviderUsed, setAiProviderUsed] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Native Student Registration & QR Code State (Zero Google Forms)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState<string>("draft");
  const [isPublishingEvent, setIsPublishingEvent] = useState(false);

  // UI state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewTeamSize, setPreviewTeamSize] = useState<number>(3);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [confirmSaveModalOpen, setConfirmSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function for capacity badge display
  function getCapacityBadgeText(min: number, max: number): string {
    if (min === 1 && max === 1) {
      return "Individual participation (1 member)";
    }
    if (min === max) {
      return `Team size: ${min} members`;
    }
    return `Team size: ${min}–${max} members`;
  }

  function populateForm(match: EventFormRecord) {
    const title = match.eventTitle || "";
    setEventName(title);
    setSavedEventId(match.eventId || "");
    const minVal = match.teamSizeMin !== undefined ? match.teamSizeMin : 2;
    const maxVal = match.teamSizeMax !== undefined ? match.teamSizeMax : 4;
    setTeamSizeMin(minVal);
    setTeamSizeMax(maxVal);
    setPreviewTeamSize(Math.max(1, Number(minVal) || 2));
    setFormTitle(match.formTitle || `${title} — Registration Questionnaire`);
    setFormDescription(
      match.formDescription || "Official registration questionnaire. Please submit your verified details."
    );
    const cleanFields = (match.fields || []).filter(
      (f) => !f.label.toLowerCase().includes("additional team member details")
    );
    setFields(cleanFields);
    setIsActive(match.isActive);
    setIsPublished(match.isPublished ?? true);
    setFeeAmount(String(match.feeAmount ?? 100));
    setRegistrationStartDate(match.registrationStartDate || "");
    setRegistrationEndDate(match.registrationEndDate || "");
    setCurrentVersion(match.version || 1);
    setVersionHistory(match.history || []);
    setQrCodeDataUrl(match.qrCodeDataUrl || "");
    if (!match.qrCodeDataUrl && match.eventId) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      generateQrCodeDataUrl(`${origin}/events/${match.eventId}/register`)
        .then(setQrCodeDataUrl)
        .catch(() => {});
    }
    setFieldErrors({});
    if (cleanFields && cleanFields.length > 0) {
      setCurrentStep("config");
    }
  }

  // Load existing forms and user session on mount, restoring configuration upon refresh
  useEffect(() => {
    async function load() {
      try {
        const [formsRes, meRes, eventsRes] = await Promise.all([
          fetch("/api/admin/forms"),
          fetch("/api/admin/auth/me").catch(() => null),
          fetch("/api/admin/events").catch(() => null),
        ]);

        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          setUserRole(meData.user?.role || "Admin");
        }

        let eventsList: any[] = [];
        if (eventsRes && eventsRes.ok) {
          const eventsData = await eventsRes.json();
          eventsList = eventsData.events || [];
        }

        if (formsRes.ok) {
          const formsData = await formsRes.json();
          const formsList: EventFormRecord[] = formsData.forms || [];
          setSavedForms(formsList);

          if (formsList.length > 0) {
            // Restore from the most recently updated form configuration
            const sorted = [...formsList].sort((a, b) => {
              const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
              const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              return tB - tA;
            });
            const latest = sorted[0];
            populateForm(latest);

            if (latest.eventId && eventsList.length > 0) {
              const matchedEvt = eventsList.find((e) => e.id === latest.eventId);
              if (matchedEvt) {
                setEventStatus(matchedEvt.status || "draft");
              }
            }
          }
        }
      } catch (err) {
        console.error("Forms load error:", err);
        setErrorMessage("Failed to load questionnaire configurations.");
      }
    }
    load();
  }, []);

  const handleResetForm = () => {
    setEventName("");
    setSavedEventId("");
    setTeamSizeMin(2);
    setTeamSizeMax(4);
    setPreviewTeamSize(2);
    setFeeAmount("100");
    setRegistrationStartDate("");
    setRegistrationEndDate("");
    setIsActive(true);
    setIsPublished(true);
    setFormTitle("");
    setFormDescription("");
    setFields([]);
    setCustomPrompt("");
    setCurrentVersion(1);
    setVersionHistory([]);
    setQrCodeDataUrl("");
    setEventStatus("draft");
    setFieldErrors({});
    setCurrentStep("config");
    setMessage("Form builder reset. Enter an event name to begin.");
    setTimeout(() => setMessage(null), 3000);
  };

  // Form Configuration Validator
  function validateConfig(): boolean {
    const errors: typeof fieldErrors = {};

    const trimmed = eventName.trim();
    if (!trimmed) {
      errors.eventName = "Event name is required.";
    }

    const minNum = Number(teamSizeMin);
    if (isNaN(minNum) || minNum < 1 || !Number.isInteger(minNum)) {
      errors.teamSizeMin = "Minimum team members must be a whole number of at least 1.";
    }

    const maxNum = Number(teamSizeMax);
    if (isNaN(maxNum) || maxNum < 1 || !Number.isInteger(maxNum)) {
      errors.teamSizeMax = "Maximum team members must be a positive whole number.";
    } else if (!errors.teamSizeMin && maxNum < minNum) {
      errors.teamSizeMax = "Maximum team members must be greater than or equal to minimum team members.";
    }

    const numFee = Number(feeAmount);
    if (isNaN(numFee) || numFee < 0) {
      errors.feeAmount = "Registration fee must be a valid non-negative number (INR).";
    }

    if (registrationStartDate && registrationEndDate) {
      if (new Date(registrationStartDate) > new Date(registrationEndDate)) {
        errors.dates = "Registration opening date cannot be after closing date.";
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErr = Object.values(errors)[0];
      setErrorMessage(firstErr);
      return false;
    }

    setErrorMessage(null);
    return true;
  }

  // ---------------------------------------------------------------------------
  // STEP 1: CONTINUE WITH AI
  // ---------------------------------------------------------------------------
  const handleContinueWithAi = async () => {
    setErrorMessage(null);
    setAiError(null);

    // Validate configuration
    if (!validateConfig()) {
      return;
    }

    const trimmedEventName = eventName.trim();
    const minNum = Number(teamSizeMin);
    const maxNum = Number(teamSizeMax);
    const numFee = Number(feeAmount);

    try {
      setIsAiGenerating(true);
      const res = await fetch("/api/admin/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: trimmedEventName,
          eventTitle: trimmedEventName,
          feeAmount: numFee,
          isActive,
          registrationStartDate: registrationStartDate || undefined,
          registrationEndDate: registrationEndDate || undefined,
          teamSizeMin: minNum,
          teamSizeMax: maxNum,
          prompt: customPrompt.trim() || undefined,
          eventId: savedEventId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "AI Form generation failed.";
        setAiError(msg);
        setErrorMessage(msg);
        return;
      }

      if (data.form) {
        setFormTitle(data.form.formTitle);
        setFormDescription(data.form.formDescription);
        const cleanFields = (data.form.fields || []).filter(
          (f: FormField) => !f.label.toLowerCase().includes("additional team member details")
        );
        setFields(cleanFields);
        setPreviewTeamSize(Math.max(1, minNum || 2));
        setAiProviderUsed(data.providerUsed || "groq_oss_120b");
        setCurrentStep("review");
        setMessage(
          `AI successfully generated ${cleanFields.length} questions tailored for ${trimmedEventName}.`
        );
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error generating form with AI.";
      setAiError(msg);
      setErrorMessage(msg);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2: REVIEW ACTIONS (Regenerate, Back to Config, Approve & Continue)
  // ---------------------------------------------------------------------------
  const handleRegenerate = async () => {
    await handleContinueWithAi();
  };

  const handleBackToConfig = () => {
    setCurrentStep("config");
  };

  const handleApproveFormAndContinue = async () => {
    setErrorMessage(null);
    if (!eventName.trim()) {
      setErrorMessage("Event name is required.");
      return;
    }
    if (!formTitle.trim()) {
      setErrorMessage("Form title is required.");
      return;
    }
    if (fields.length === 0) {
      setErrorMessage("The questionnaire must contain at least one question.");
      return;
    }
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        setErrorMessage(`Question #${i + 1} requires a valid question label.`);
        return;
      }
    }

    // Save form to backend and advance to publication confirmation
    const saveSuccess = await executeSaveInternal();
    if (saveSuccess) {
      setCurrentStep("publish");
    }
  };

  // Manual Question Modification Handlers (Optional Edits)
  const handleAddField = () => {
    const newField: FormField = {
      id: `f-${Date.now()}`,
      label: "Untitled Question",
      type: "text",
      required: false,
      placeholder: "",
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const copy = [...fields];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setFields(copy);
  };

  const handleAddOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const currentOptions = field.options || ["Option 1"];
    const nextOption = `Option ${currentOptions.length + 1}`;
    handleUpdateField(fieldId, { options: [...currentOptions, nextOption] });
  };

  const handleUpdateOption = (fieldId: string, optIndex: number, value: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !field.options) return;
    const copy = [...field.options];
    copy[optIndex] = value;
    handleUpdateField(fieldId, { options: copy });
  };

  const handleRemoveOption = (fieldId: string, optIndex: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !field.options || field.options.length <= 1) return;
    const copy = field.options.filter((_, idx) => idx !== optIndex);
    handleUpdateField(fieldId, { options: copy });
  };

  // ---------------------------------------------------------------------------
  // SAVE & SNAPSHOT EXECUTION
  // ---------------------------------------------------------------------------
  const executeSaveInternal = async (): Promise<boolean> => {
    try {
      setSaving(true);
      setErrorMessage(null);

      const trimmedName = eventName.trim();
      const minNum = Number(teamSizeMin) || 2;
      const maxNum = Number(teamSizeMax) || 4;
      const numFee = Number(feeAmount) || 0;
      const cleanFields = fields.filter(
        (f) => !f.label.toLowerCase().includes("additional team member details")
      );

      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: savedEventId || undefined,
          eventName: trimmedName,
          eventTitle: trimmedName,
          formTitle,
          formDescription,
          fields: cleanFields,
          isActive,
          isPublished,
          feeAmount: numFee,
          teamSizeMin: minNum,
          teamSizeMax: maxNum,
          registrationStartDate: registrationStartDate || undefined,
          registrationEndDate: registrationEndDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save form configuration.");
        return false;
      }

      setMessage(data.message || "Form configuration saved successfully.");
      setTimeout(() => setMessage(null), 4000);
      if (data.form) {
        setSavedEventId(data.form.eventId);
        setCurrentVersion(data.form.version || currentVersion + 1);
        setVersionHistory(data.form.history || versionHistory);

        // Generate registration QR code for the internal student registration URL
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const regUrl = `${origin}/events/${data.form.eventId}/register`;
        try {
          const qr = await generateQrCodeDataUrl(regUrl);
          setQrCodeDataUrl(qr);
        } catch {
          // ignore
        }

        // Update saved forms cache
        setSavedForms((prev) => {
          const filtered = prev.filter((f) => f.eventId !== data.form.eventId);
          return [data.form, ...filtered];
        });
      }
      return true;
    } catch {
      setErrorMessage("Network error saving form configuration.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // NATIVE PUBLICATION & CATALOGUE DEPLOYMENT
  // ---------------------------------------------------------------------------
  const handlePublishEvent = async () => {
    if (!savedEventId) {
      setErrorMessage("No saved event ID found to publish.");
      return;
    }
    try {
      setIsPublishingEvent(true);
      setErrorMessage(null);
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: savedEventId, action: "publish" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to publish event.");
        return;
      }
      setEventStatus("published");
      setIsPublished(true);
      setMessage(data.message || "Event successfully published to the public AVISHKAR website!");
      setTimeout(() => setMessage(null), 5000);
    } catch {
      setErrorMessage("Network error publishing event.");
    } finally {
      setIsPublishingEvent(false);
    }
  };

  const handleUnpublishEvent = async () => {
    if (!savedEventId) return;
    try {
      setIsPublishingEvent(true);
      setErrorMessage(null);
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: savedEventId, action: "unpublish" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to unpublish event.");
        return;
      }
      setEventStatus("draft");
      setIsPublished(false);
      setMessage("Event unpublished and returned to draft.");
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setErrorMessage("Network error unpublishing event.");
    } finally {
      setIsPublishingEvent(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0A2047]">Dynamic Form Builder</h2>
        </div>

        {/* Workflow Step Tracker */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Start configuring a new form"
          >
            <Plus className="w-3.5 h-3.5 text-[#0A2047]" />
            <span>New Form</span>
          </button>

          {versionHistory.length > 0 && (
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#0A2047]" />
              <span>Version History ({versionHistory.length})</span>
            </button>
          )}

          {/* Quick jump between steps if form has fields */}
          <div className="inline-flex p-1 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0] text-xs font-semibold">
            <button
              onClick={() => setCurrentStep("config")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentStep === "config"
                  ? "bg-[#0A2047] text-white shadow-xs font-bold"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              1. Configuration
            </button>
            <button
              onClick={() => {
                if (fields.length > 0) setCurrentStep("review");
                else setErrorMessage("Please generate or configure questions first.");
              }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentStep === "review"
                  ? "bg-[#0A2047] text-white shadow-xs font-bold"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              2. Review ({fields.length})
            </button>
            <button
              onClick={() => {
                if (fields.length > 0) setCurrentStep("publish");
                else setErrorMessage("Please review and approve the form before publishing.");
              }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentStep === "publish"
                  ? "bg-[#0A2047] text-white shadow-xs font-bold"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              3. Publish & QR
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {message && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold cursor-pointer">&times;</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold cursor-pointer">&times;</button>
        </div>
      )}

      {aiError && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>AI Generation Notice: {aiError}</span>
          </div>
          <button onClick={() => setAiError(null)} className="font-bold cursor-pointer">&times;</button>
        </div>
      )}

      {/* =======================================================================
          STEP 1: CONFIGURATION & CONTINUE WITH AI
          ======================================================================= */}
      {currentStep === "config" && (
        <div className="space-y-6">
          {/* Event Registration Parameters Card */}
          <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Event Name * (Text Input) */}
              <div className="md:col-span-2 lg:col-span-2">
                <label className="h-5 text-xs font-bold text-[#172033] mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Event Name *</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (fieldErrors.eventName) {
                      setFieldErrors((prev) => ({ ...prev, eventName: undefined }));
                    }
                  }}
                  placeholder="Enter the event name"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-[#0A2047] bg-white text-[#172033] font-semibold placeholder:text-[#64748B]/50 transition-colors ${
                    fieldErrors.eventName
                      ? "border-rose-400 bg-rose-50/30 focus:ring-rose-400"
                      : "border-[#E2E8F0] focus:border-[#0A2047]"
                  }`}
                />
                {fieldErrors.eventName && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                    {fieldErrors.eventName}
                  </span>
                )}
              </div>

              {/* 2. Registration Fee (INR) */}
              <div className="md:col-span-1 lg:col-span-1">
                <label className="h-5 text-xs font-bold text-[#172033] mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Registration Fee (INR) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={feeAmount}
                    onChange={(e) => {
                      setFeeAmount(e.target.value);
                      if (fieldErrors.feeAmount) {
                        setFieldErrors((prev) => ({ ...prev, feeAmount: undefined }));
                      }
                    }}
                    placeholder="100"
                    className={`w-full pl-7 pr-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-[#0A2047] font-mono font-bold text-[#172033] ${
                      fieldErrors.feeAmount ? "border-rose-400 bg-rose-50/30" : "border-[#E2E8F0] bg-white"
                    }`}
                  />
                </div>
                {fieldErrors.feeAmount && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                    {fieldErrors.feeAmount}
                  </span>
                )}
              </div>

              {/* 3. Form Activation Status */}
              <div className="md:col-span-1 lg:col-span-1">
                <label className="h-5 text-xs font-bold text-[#172033] mb-1 flex items-center">
                  <span>Form Activation Status</span>
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-[#F0F3F8] text-[#64748B] border-[#E2E8F0]"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Deactivated</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 4. Minimum Team Members */}
              <div className="md:col-span-1 lg:col-span-1">
                <label className="h-5 text-xs font-bold text-[#172033] mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Minimum Team Members *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={teamSizeMin}
                  onChange={(e) => {
                    setTeamSizeMin(e.target.value);
                    if (fieldErrors.teamSizeMin || fieldErrors.teamSizeMax) {
                      setFieldErrors((prev) => ({ ...prev, teamSizeMin: undefined, teamSizeMax: undefined }));
                    }
                  }}
                  placeholder="2"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-[#0A2047] font-mono font-bold text-[#172033] ${
                    fieldErrors.teamSizeMin ? "border-rose-400 bg-rose-50/30" : "border-[#E2E8F0] bg-white"
                  }`}
                />
                {fieldErrors.teamSizeMin && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                    {fieldErrors.teamSizeMin}
                  </span>
                )}
              </div>

              {/* 5. Maximum Team Members */}
              <div className="md:col-span-1 lg:col-span-1">
                <label className="h-5 text-xs font-bold text-[#172033] mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Maximum Team Members *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={teamSizeMax}
                  onChange={(e) => {
                    setTeamSizeMax(e.target.value);
                    if (fieldErrors.teamSizeMax) {
                      setFieldErrors((prev) => ({ ...prev, teamSizeMax: undefined }));
                    }
                  }}
                  placeholder="4"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-[#0A2047] font-mono font-bold text-[#172033] ${
                    fieldErrors.teamSizeMax ? "border-rose-400 bg-rose-50/30" : "border-[#E2E8F0] bg-white"
                  }`}
                />
                {fieldErrors.teamSizeMax && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                    {fieldErrors.teamSizeMax}
                  </span>
                )}
              </div>

              {/* 6. Registration Schedule: Opening Date */}
              <div className="md:col-span-1 lg:col-span-1">
                <label className="h-5 text-xs font-bold text-[#172033] mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Opening Date</span>
                </label>
                <input
                  type="date"
                  placeholder="dd-mm-yyyy"
                  value={registrationStartDate}
                  onChange={(e) => {
                    setRegistrationStartDate(e.target.value);
                    if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-[#0A2047] bg-white font-medium text-[#172033] ${
                    fieldErrors.dates ? "border-rose-400 bg-rose-50/30" : "border-[#E2E8F0]"
                  }`}
                />
                {fieldErrors.dates && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                    {fieldErrors.dates}
                  </span>
                )}
              </div>

              {/* 7. Registration Schedule: Closing Date */}
              <div className="md:col-span-1 lg:col-span-1">
                <label className="h-5 text-xs font-bold text-[#172033] mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Closing Date</span>
                </label>
                <input
                  type="date"
                  placeholder="dd-mm-yyyy"
                  value={registrationEndDate}
                  onChange={(e) => {
                    setRegistrationEndDate(e.target.value);
                    if (fieldErrors.dates) setFieldErrors((prev) => ({ ...prev, dates: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-[#0A2047] bg-white font-medium text-[#172033] ${
                    fieldErrors.dates ? "border-rose-400 bg-rose-50/30" : "border-[#E2E8F0]"
                  }`}
                />
                {fieldErrors.dates && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                    {fieldErrors.dates}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Generator Integration Box */}
          <div className="bg-gradient-to-br from-[#0A2047]/5 via-[#D4AF37]/5 to-white p-5 rounded-xl border border-[#D4AF37]/30 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0A2047] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h3 className="text-sm font-bold text-[#0A2047]">AI Registration Form Generator</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Custom Requirements or Focus Areas (Optional)
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter any additional requirements (optional)..."
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047] bg-white placeholder:text-[#64748B]/50 text-[#172033]"
              />
            </div>

            {/* Continue with AI Action Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleContinueWithAi}
                disabled={isAiGenerating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#0A2047] to-[#132E57] hover:from-[#132E57] hover:to-[#19365F] text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer border border-[#D4AF37]/40"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Questionnaire with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Continue with AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          STEP 2: REVIEW AND CONFIRMATION (Google Forms-Style Preview)
          ======================================================================= */}
      {currentStep === "review" && (
        <div className="space-y-6">
          {/* Review Header with Required Actions */}
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToConfig}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Configuration</span>
              </button>
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Review Questionnaire</h3>
                <p className="text-[11px] text-[#64748B]">
                  {fields.length} AI-generated questions for <strong>{eventName.trim()}</strong> •{" "}
                  <span className="text-[#0A2047] font-medium">
                    {getCapacityBadgeText(Number(teamSizeMin) || 1, Number(teamSizeMax) || 1)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Action 1: Regenerate Form */}
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isAiGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isAiGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-[#0A2047]" />
                )}
                <span>Regenerate Form</span>
              </button>

              {/* Toggle Live Preview vs Editor */}
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  previewMode
                    ? "bg-[#0A2047] text-white border-[#0A2047]"
                    : "bg-white text-[#172033] border-[#E2E8F0] hover:bg-[#F0F3F8]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{previewMode ? "Interactive Preview (ON)" : "Live Student Preview"}</span>
              </button>

              {/* Action 3: Approve Form & Continue */}
              <button
                type="button"
                onClick={handleApproveFormAndContinue}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Approve Form & Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Google Forms-Style Questionnaire Display */}
          {previewMode ? (
            /* Student Mode Preview */
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E2E8F0] shadow-md space-y-6 max-w-2xl mx-auto">
              <div className="border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B89125] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    Student Portal Registration Preview
                  </span>
                  <span className="text-[10px] font-bold text-[#0A2047] bg-[#0A2047]/5 px-2 py-0.5 rounded border border-[#0A2047]/20">
                    {getCapacityBadgeText(Number(teamSizeMin) || 1, Number(teamSizeMax) || 1)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#172033] mt-2">{formTitle}</h3>
                {formDescription && (
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{formDescription}</p>
                )}
                <div className="mt-3 text-xs font-semibold text-[#172033] flex items-center gap-3 flex-wrap">
                  <span>Event: {eventName}</span>
                  <span>• Registration Fee: ₹{feeAmount}</span>
                  {registrationEndDate && (
                    <span className="text-[#64748B]">• Closes: {registrationEndDate}</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const isTeamEvent = (Number(teamSizeMax) || 1) > 1 || (Number(teamSizeMin) || 1) > 1;
                  const previewFields = fields.filter(
                    (f) => !f.label.toLowerCase().includes("additional team member details")
                  );
                  const hasTeamSizeQuestion = previewFields.some(
                    (f) =>
                      f.label.toLowerCase().includes("team size") ||
                      f.label.toLowerCase().includes("squad size") ||
                      f.label.toLowerCase().includes("declared team") ||
                      f.label.toLowerCase().includes("number of members") ||
                      f.id.includes("team_size")
                  );

                  return (
                    <>
                      {previewFields.map((f, idx) => {
                        const isTeamSizeField =
                          isTeamEvent &&
                          (f.label.toLowerCase().includes("team size") ||
                            f.label.toLowerCase().includes("squad size") ||
                            f.label.toLowerCase().includes("declared team") ||
                            f.label.toLowerCase().includes("number of members") ||
                            f.id.includes("team_size"));

                        return (
                          <div key={f.id} className="space-y-3">
                            <div className="space-y-1.5 p-3.5 rounded-lg bg-slate-50/80 border border-slate-200">
                              <label className="block text-xs font-bold text-slate-800">
                                {idx + 1}. {f.label} {f.required && <span className="text-rose-600">*</span>}
                              </label>

                              {f.type === "text" && (
                                <input
                                  type="text"
                                  disabled
                                  placeholder={f.placeholder || "Your answer"}
                                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                                />
                              )}

                              {f.type === "textarea" && (
                                <textarea
                                  rows={2}
                                  disabled
                                  placeholder={f.placeholder || "Detailed response..."}
                                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                                />
                              )}

                              {f.type === "select" && (
                                <select
                                  value={isTeamSizeField ? `${previewTeamSize} Members` : undefined}
                                  onChange={
                                    isTeamSizeField
                                      ? (e) => {
                                          const match = e.target.value.match(/\d+/);
                                          const parsed = match ? parseInt(match[0], 10) : previewTeamSize;
                                          if (!isNaN(parsed) && parsed >= 1) setPreviewTeamSize(parsed);
                                        }
                                      : undefined
                                  }
                                  disabled={!isTeamSizeField}
                                  className={`w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium ${
                                    isTeamSizeField
                                      ? "border-[#0A2047] text-[#0A2047] focus:ring-2 focus:ring-[#0A2047] cursor-pointer"
                                      : "border-[#E2E8F0] text-[#172033]"
                                  }`}
                                >
                                  {!isTeamSizeField && <option value="">Select an option...</option>}
                                  {f.options?.map((opt, i) => (
                                    <option key={i} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {(f.type === "radio" || f.type === "checkbox") && (
                                <div className="space-y-1 pt-1">
                                  {f.options?.map((opt, i) => {
                                    const match = opt.match(/\d+/);
                                    const parsed = match ? parseInt(match[0], 10) : NaN;
                                    const isSelectedRadio = isTeamSizeField && !isNaN(parsed) && previewTeamSize === parsed;
                                    return (
                                      <label
                                        key={i}
                                        className={`flex items-center gap-2 text-xs ${
                                          isTeamSizeField ? "cursor-pointer text-[#0A2047] font-medium" : "text-[#172033]"
                                        }`}
                                      >
                                        <input
                                          type={f.type}
                                          checked={isTeamSizeField && f.type === "radio" ? isSelectedRadio : undefined}
                                          onChange={
                                            isTeamSizeField && f.type === "radio" && !isNaN(parsed)
                                              ? () => setPreviewTeamSize(parsed)
                                              : undefined
                                          }
                                          disabled={!isTeamSizeField}
                                          className="rounded text-[#0A2047]"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}

                              {f.type === "date" && (
                                <input
                                  type="date"
                                  disabled
                                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg bg-white"
                                />
                              )}

                              {f.type === "number" && (
                                <input
                                  type="number"
                                  value={isTeamSizeField ? previewTeamSize : undefined}
                                  onChange={
                                    isTeamSizeField
                                      ? (e) => {
                                          const val = parseInt(e.target.value, 10);
                                          if (!isNaN(val) && val >= 1) setPreviewTeamSize(val);
                                        }
                                      : undefined
                                  }
                                  disabled={!isTeamSizeField}
                                  placeholder={f.placeholder || "0"}
                                  className={`w-full px-3 py-2 text-xs border rounded-lg bg-white ${
                                    isTeamSizeField
                                      ? "border-[#0A2047] text-[#0A2047] font-bold focus:ring-2 focus:ring-[#0A2047]"
                                      : "border-[#E2E8F0] text-[#172033]"
                                  }`}
                                />
                              )}
                            </div>

                            {/* Dynamic Member Cards in Preview Mode when Team Size is answered */}
                            {isTeamSizeField && previewTeamSize >= 1 && (
                              <div className="bg-white p-5 rounded-xl border border-[#0A2047]/20 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                                  <div>
                                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                                      <Users className="w-4 h-4 text-[#0A2047]" />
                                      <span>Team Members Information ({previewTeamSize} Members)</span>
                                    </h4>
                                    <p className="text-[11px] text-[#64748B] mt-0.5">
                                      Dynamic preview: Selecting {previewTeamSize} members automatically renders dedicated Member 1 to Member {previewTeamSize} inputs.
                                    </p>
                                  </div>
                                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-[#0A2047]/5 text-[#0A2047] text-[10px] font-bold border border-[#0A2047]/20">
                                    {previewTeamSize} Members Selected
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {Array.from({ length: previewTeamSize }).map((_, mIdx) => {
                                    const memberNum = mIdx + 1;
                                    const isLeader = memberNum === 1;
                                    return (
                                      <div
                                        key={memberNum}
                                        className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] space-y-2.5"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-[#172033] flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#0A2047] text-white flex items-center justify-center text-[10px] font-bold">
                                              {memberNum}
                                            </span>
                                            <span>Member {memberNum} {isLeader ? "(Team Leader / Primary)" : ""}</span>
                                          </span>
                                          {isLeader ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                              Team Leader / Primary Registrant
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-semibold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                                              Squad Participant
                                            </span>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-semibold text-[#172033]">
                                              Member {memberNum} Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={isLeader ? "e.g., Jane Doe (Syncs with Primary)" : `Member ${memberNum} Full Name`}
                                              disabled
                                              className="w-full px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-semibold text-[#172033]">
                                              Member {memberNum} Mail ID <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                              type="email"
                                              placeholder={isLeader ? "e.g., jane@gdgu.org (Syncs with Primary)" : `member${memberNum}@gdgu.org`}
                                              disabled
                                              className="w-full px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-semibold text-[#172033]">
                                              Member {memberNum} Enrollment <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={isLeader ? "e.g., 2026GDGU1001 (Syncs with Primary)" : `Roll / Enrolment No`}
                                              disabled
                                              className="w-full px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* If team event but no specific team size question was generated, show dynamic team members card */}
                      {isTeamEvent && !hasTeamSizeQuestion && (
                        <div className="bg-white p-5 rounded-xl border border-[#0A2047]/20 shadow-xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                            <div>
                              <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#0A2047]" />
                                <span>Team Members Information ({previewTeamSize} Members)</span>
                              </h4>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                Select team size to preview generated Member 1 to Member {previewTeamSize} input fields.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#64748B]">Simulate squad:</span>
                              <select
                                value={previewTeamSize}
                                onChange={(e) => setPreviewTeamSize(Number(e.target.value) || 2)}
                                className="px-2.5 py-1 text-xs border border-[#0A2047]/30 rounded-lg bg-white font-bold text-[#0A2047]"
                              >
                                {Array.from({
                                  length: Math.max(1, (Number(teamSizeMax) || 4) - (Number(teamSizeMin) || 1) + 1),
                                }).map((_, i) => {
                                  const count = (Number(teamSizeMin) || 1) + i;
                                  return (
                                    <option key={count} value={count}>
                                      {count} Members
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {Array.from({ length: previewTeamSize }).map((_, mIdx) => {
                              const memberNum = mIdx + 1;
                              const isLeader = memberNum === 1;
                              return (
                                <div
                                  key={memberNum}
                                  className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] space-y-2.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#172033] flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-[#0A2047] text-white flex items-center justify-center text-[10px] font-bold">
                                        {memberNum}
                                      </span>
                                      <span>Member {memberNum} {isLeader ? "(Team Leader / Primary)" : ""}</span>
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <input
                                      type="text"
                                      placeholder={`Member ${memberNum} Full Name`}
                                      disabled
                                      className="w-full px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
                                    />
                                    <input
                                      type="email"
                                      placeholder={`member${memberNum}@gdgu.org`}
                                      disabled
                                      className="w-full px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
                                    />
                                    <input
                                      type="text"
                                      placeholder={`Roll / Enrolment No`}
                                      disabled
                                      className="w-full px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#172033]"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* Editable Questionnaire Review (Google Forms-Style) */
            <div className="space-y-4">
              {/* Dynamic Per-Member Notice for Team Events */}
              {((Number(teamSizeMax) || 1) > 1 || (Number(teamSizeMin) || 1) > 1) && (
                <div className="bg-[#0A2047]/5 border border-[#0A2047]/20 p-4 rounded-xl flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#0A2047] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-[#172033]">
                    <div className="font-bold flex items-center gap-2">
                      <span>Dynamic Per-Member Input Fields Active</span>
                      <span className="px-2 py-0.5 rounded bg-[#0A2047]/10 text-[#0A2047] text-[10px] font-mono">
                        Auto-Managed
                      </span>
                    </div>
                    <p className="text-[#64748B] leading-relaxed">
                      When a student indicates their declared squad size (e.g. 3 members), the registration portal dynamically renders separate, dedicated input cards for <strong>Member 1</strong>, <strong>Member 2</strong>, and <strong>Member 3</strong> with Name, University Mail ID, and Student ID / Enrolment. Click <strong>Interactive Preview (ON)</strong> to test.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Form Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Hack-a-Sol 2026 — Team & Track Registration"
                    className="w-full px-3 py-2 text-sm font-bold border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047] text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Form Description & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide directions or eligibility criteria for applicants..."
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047] text-[#172033]"
                  />
                </div>
              </div>

              {/* Questions Cards */}
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-white p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3 hover:border-[#D4AF37]/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                          placeholder="Question prompt..."
                          className="w-full px-3 py-2 text-xs font-bold text-[#172033] border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0A2047]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={field.type}
                          onChange={(e) =>
                            handleUpdateField(field.id, {
                              type: e.target.value as FormFieldType,
                              options:
                                e.target.value === "select" ||
                                e.target.value === "radio" ||
                                e.target.value === "checkbox"
                                  ? field.options || ["Option 1", "Option 2"]
                                  : undefined,
                            })
                          }
                          className="px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white font-medium text-[#172033]"
                        >
                          <option value="text">Short Answer</option>
                          <option value="textarea">Paragraph</option>
                          <option value="select">Dropdown Menu</option>
                          <option value="radio">Multiple Choice (Radio)</option>
                          <option value="checkbox">Checkboxes</option>
                          <option value="date">Date Picker</option>
                          <option value="number">Numeric</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleMoveField(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveField(index, "down")}
                          disabled={index === fields.length - 1}
                          className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Choice Options Editor */}
                    {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
                      <div className="pl-3 border-l-2 border-[#D4AF37]/40 space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                          Choice Options
                        </span>
                        {field.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="text-[#64748B] text-xs font-mono">{optIdx + 1}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(field.id, optIdx, e.target.value)}
                              className="px-2.5 py-1 text-xs border border-[#E2E8F0] rounded-lg flex-1 text-[#172033]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(field.id, optIdx)}
                              className="text-[#64748B] hover:text-rose-600 text-sm px-1 cursor-pointer"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOption(field.id)}
                          className="text-xs text-[#0A2047] hover:text-[#132E57] font-semibold flex items-center gap-1 cursor-pointer pt-1"
                        >
                          <Plus className="w-3 h-3" /> Add Choice Option
                        </button>
                      </div>
                    )}

                    {/* Settings bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs">
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                        placeholder="Helper placeholder text..."
                        className="px-2.5 py-1 text-xs border border-[#E2E8F0] rounded-lg max-w-xs text-[#172033]"
                      />

                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#172033]">
                        <span>Required Question</span>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                          className="rounded text-[#0A2047] focus:ring-[#0A2047]"
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddField}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[#E2E8F0] hover:border-[#0A2047] hover:bg-[#F0F3F8] text-[#64748B] hover:text-[#0A2047] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Additional Question</span>
                </button>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackToConfig}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Configuration</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isAiGenerating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#0A2047]" />
                    <span>Regenerate Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveFormAndContinue}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Form & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          STEP 3: APPROVAL, PUBLICATION & QR CODE INTEGRATION
          ======================================================================= */}
      {currentStep === "publish" && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900">Registration Form Approved & Saved</h3>
                <p className="text-xs text-emerald-700">
                  Form configuration is connected to <strong>{eventName}</strong> and ready for student registrations.
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("review")}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-800 text-xs font-semibold hover:bg-emerald-50 cursor-pointer"
            >
              Modify Questionnaire
            </button>
          </div>

          {/* Form Overview & Registration Link & QR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Form Details & Student Registration Link */}
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-[#172033] border-b border-[#E2E8F0] pb-2">
                Active Student Registration Channel
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Event Name</span>
                  <span className="font-bold text-[#172033]">{eventName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Team Capacity</span>
                  <span className="font-bold text-[#0A2047]">
                    {getCapacityBadgeText(Number(teamSizeMin) || 1, Number(teamSizeMax) || 1)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Registration Fee</span>
                  <span className="font-bold text-[#172033]">₹{feeAmount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Schedule</span>
                  <span className="font-bold text-[#172033]">
                    {registrationStartDate || "Open immediately"} to {registrationEndDate || "Open throughout"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Configured Questions</span>
                  <span className="font-bold text-[#172033]">{fields.length} Questions</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Form Status</span>
                  <span className="font-bold text-emerald-600">Active (Accepting Submissions)</span>
                </div>
              </div>

              {/* Portal Registration URL */}
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Live Registration URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/events/${savedEventId}/register`}
                    className="flex-1 px-3 py-2 text-xs bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#172033] font-mono"
                  />
                  <button
                    onClick={() =>
                      handleCopyLink(
                        `${typeof window !== "undefined" ? window.location.origin : ""}/events/${savedEventId}/register`
                      )
                    }
                    className="px-3 py-2 bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                  <a
                    href={`/events/${savedEventId}/register`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-[#E2E8F0] hover:bg-[#F0F3F8] rounded-lg text-[#172033]"
                    title="Open Registration Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code Display & Download */}
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center text-center space-y-3">
              <h4 className="text-sm font-bold text-[#172033]">
                Official Registration QR Code
              </h4>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                Scan to open the participant registration questionnaire on mobile devices.
              </p>

              {qrCodeDataUrl ? (
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeDataUrl}
                    alt="Registration Form QR Code"
                    className="w-44 h-44 object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-xl border border-dashed border-[#E2E8F0] flex items-center justify-center text-[#64748B] text-xs">
                  Generating QR...
                </div>
              )}

              {qrCodeDataUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={qrCodeDataUrl}
                    download={`${eventName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "event"}-registration-qr.png`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold shadow-xs cursor-pointer border border-[#D4AF37]/30 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Download QR Code (PNG)</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Native AVISHKAR Website Publication */}
          <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <h4 className="text-sm font-bold text-[#172033]">Event Publication</h4>
              {eventStatus === "published" ? (
                <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live on Website
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Ready for Publication
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {eventStatus === "published" ? (
                <>
                  <a
                    href={`/events/${savedEventId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Public Page</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleUnpublishEvent}
                    disabled={isPublishingEvent}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isPublishingEvent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Unpublish Event</span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishEvent}
                  disabled={isPublishingEvent || !savedEventId}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 border border-[#D4AF37]/30 transition-colors"
                >
                  {isPublishingEvent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                      <span>Publish Event to Public Website</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal when saving active forms */}
      {confirmSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#172033] text-base">Confirm Form Modification</h3>
                <p className="text-xs text-[#64748B]">
                  This registration form is currently ACTIVE.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Saving updates will automatically snapshot previous question definitions into
              version history (advancing to <strong>v{currentVersion + 1}</strong>). Existing student
              submissions will retain their original question mappings without corruption.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setConfirmSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setConfirmSaveModalOpen(false);
                  await executeSaveInternal();
                }}
                className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs cursor-pointer border border-[#D4AF37]/30 transition-colors"
              >
                Confirm & Snapshot Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal (Preserved) */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A2047]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0A2047]" />
                <h3 className="font-bold text-[#172033] text-base">Configuration Snapshots</h3>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-[#64748B] hover:text-[#172033] font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto">
              {versionHistory.map((snap, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0A2047]">Version {snap.version}</span>
                    <span className="text-[10px] text-[#64748B]">
                      {new Date(snap.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[#172033] font-medium">{snap.formTitle}</div>
                  <div className="text-[#64748B] text-[11px] flex gap-3 flex-wrap">
                    {snap.eventTitle && <span>Event: {snap.eventTitle}</span>}
                    {snap.teamSizeMin !== undefined && snap.teamSizeMax !== undefined && (
                      <span>Capacity: {snap.teamSizeMin}–{snap.teamSizeMax} members</span>
                    )}
                    <span>Fee: ₹{snap.feeAmount ?? 100}</span>
                    <span>Questions: {snap.fields.length}</span>
                    {snap.updatedBy && <span>Auditor: {snap.updatedBy}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTitle(snap.formTitle);
                      if (snap.eventTitle) setEventName(snap.eventTitle);
                      if (snap.teamSizeMin !== undefined) setTeamSizeMin(snap.teamSizeMin);
                      if (snap.teamSizeMax !== undefined) setTeamSizeMax(snap.teamSizeMax);
                      if (snap.feeAmount !== undefined) setFeeAmount(String(snap.feeAmount));
                      if (snap.registrationStartDate !== undefined) setRegistrationStartDate(snap.registrationStartDate);
                      if (snap.registrationEndDate !== undefined) setRegistrationEndDate(snap.registrationEndDate);
                      setFields(snap.fields || []);
                      setHistoryModalOpen(false);
                      setMessage(`Restored configuration snapshot from Version ${snap.version}.`);
                      setTimeout(() => setMessage(null), 3000);
                    }}
                    className="mt-1 text-[11px] text-[#0A2047] hover:text-[#B89125] font-semibold cursor-pointer block underline"
                  >
                    Restore this version
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
