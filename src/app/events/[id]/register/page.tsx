"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Send,
  HelpCircle,
} from "lucide-react";
import { EventFormRecord, FormField } from "@/types/admin";

interface EventData {
  id: string;
  title: string;
  category: string;
  teamSizeMin: number;
  teamSizeMax: number;
}

function EventRegisterContent() {
  const params = useParams();
  const eventId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventData | null>(null);
  const [form, setForm] = useState<EventFormRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Student details
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  // Dynamic responses
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    submissionId: string;
    submittedAt: string;
    studentName: string;
    studentId: string;
  } | null>(null);

  useEffect(() => {
    async function fetchForm() {
      if (!eventId) return;
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch(`/api/events/${eventId}/form`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setLoadError(errData.error || "Event registration questionnaire is not currently available.");
          return;
        }
        const data = await res.json();
        setEvent(data.event);
        setForm(data.form);
      } catch (err) {
        setLoadError("Failed to load registration questionnaire. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [eventId]);

  // Determine if this is a team event
  const isTeamEvent = Boolean(event && (event.teamSizeMax > 1 || event.teamSizeMin > 1));

  // Find team size question in form fields
  const teamSizeField = form?.fields.find(
    (f) =>
      f.label.toLowerCase().includes("team size") ||
      f.label.toLowerCase().includes("squad size") ||
      f.label.toLowerCase().includes("declared team") ||
      f.label.toLowerCase().includes("number of members")
  );

  // Compute the current selected team size
  const getSelectedTeamSize = (): number => {
    if (!isTeamEvent) return 1;
    if (teamSizeField && responses[teamSizeField.id]) {
      const match = String(responses[teamSizeField.id]).match(/\d+/);
      const parsed = match ? parseInt(match[0], 10) : NaN;
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
    if (responses["declared_team_size"] || responses["team_size"]) {
      const match = String(responses["declared_team_size"] || responses["team_size"]).match(/\d+/);
      const parsed = match ? parseInt(match[0], 10) : NaN;
      if (!isNaN(parsed) && parsed >= 1) return parsed;
    }
    return Math.max(1, event?.teamSizeMin || 2);
  };

  const selectedTeamSize = getSelectedTeamSize();

  const handleResponseChange = (fieldId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    const current = (responses[fieldId] as string[]) || [];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    handleResponseChange(fieldId, next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!studentName.trim()) newErrors.studentName = "Full Name is required.";
    if (!studentId.trim()) newErrors.studentId = "Student ID / Enrolment Number is required.";
    if (!studentEmail.trim()) {
      newErrors.studentEmail = "University Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      newErrors.studentEmail = "Please enter a valid email address.";
    }

    if (form) {
      for (const field of form.fields) {
        // Skip legacy textarea if per-member fields are used
        if (field.label.toLowerCase().includes("additional team member details")) continue;

        const val = responses[field.id];
        if (field.required) {
          if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
            newErrors[field.id] = `${field.label} is required.`;
          }
        }
        if (
          event &&
          (event.teamSizeMax > 1 || event.teamSizeMin > 1) &&
          (field.label.toLowerCase().includes("team size") || field.label.toLowerCase().includes("declared team"))
        ) {
          if (val !== undefined && val !== null && val !== "") {
            const match = String(val).match(/\d+/);
            const num = match ? parseInt(match[0], 10) : NaN;
            if (!isNaN(num) && (num < event.teamSizeMin || num > event.teamSizeMax)) {
              newErrors[field.id] = `Team size must be between ${event.teamSizeMin} and ${event.teamSizeMax} members.`;
            }
          }
        }
      }
    }

    // Dynamic Team Members Validation: When team size N is selected, validate all N members
    if (isTeamEvent && selectedTeamSize > 1) {
      for (let m = 1; m <= selectedTeamSize; m++) {
        const nameVal = responses[`member_${m}_name`] || (m === 1 ? studentName.trim() : "");
        const emailVal = responses[`member_${m}_email`] || (m === 1 ? studentEmail.trim() : "");
        const enrollVal = responses[`member_${m}_enrollment`] || (m === 1 ? studentId.trim() : "");

        if (!nameVal || !String(nameVal).trim()) {
          newErrors[`member_${m}_name`] = `Member ${m} Full Name is required.`;
        }
        if (!emailVal || !String(emailVal).trim()) {
          newErrors[`member_${m}_email`] = `Member ${m} Mail ID is required.`;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(emailVal).trim())) {
          newErrors[`member_${m}_email`] = `Please enter a valid email address for Member ${m}.`;
        }
        if (!enrollVal || !String(enrollVal).trim()) {
          newErrors[`member_${m}_enrollment`] = `Member ${m} Enrollment is required.`;
        }
      }
    }


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      const submissionResponses = { ...responses };
      if (isTeamEvent) {
        submissionResponses.declared_team_size = selectedTeamSize;
        if (teamSizeField && !submissionResponses[teamSizeField.id]) {
          submissionResponses[teamSizeField.id] = `${selectedTeamSize} Members`;
        }
        for (let m = 1; m <= selectedTeamSize; m++) {
          submissionResponses[`member_${m}_name`] =
            (responses[`member_${m}_name`] || (m === 1 ? studentName.trim() : "")).trim();
          submissionResponses[`member_${m}_email`] =
            (responses[`member_${m}_email`] || (m === 1 ? studentEmail.trim().toLowerCase() : "")).trim().toLowerCase();
          submissionResponses[`member_${m}_enrollment`] =
            (responses[`member_${m}_enrollment`] || (m === 1 ? studentId.trim() : "")).trim();
        }
      }

      const res = await fetch(`/api/events/${eventId}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          studentId: studentId.trim(),
          studentEmail: studentEmail.trim().toLowerCase(),
          responses: submissionResponses,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        if (resData.fieldErrors) {
          setErrors(resData.fieldErrors);
        } else {
          alert(resData.error || "Submission failed. Please check form fields.");
        }
        return;
      }

      setSubmittedReceipt({
        submissionId: resData.submissionId,
        submittedAt: resData.submittedAt || new Date().toISOString(),
        studentName: studentName.trim(),
        studentId: studentId.trim(),
      });
    } catch {
      alert("An unexpected error occurred while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading competition registration questionnaire...</p>
        </div>
      </div>
    );
  }

  if (loadError || !event || !form) {
    return (
      <div className="py-16">
        <Container size="default">
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Registration Not Available</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {loadError || "This competition does not currently have an active registration questionnaire."}
            </p>
            <div className="pt-4">
              <Link
                href="/#competitions"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Competition Tracks</span>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (submittedReceipt) {
    return (
      <div className="py-16">
        <Container size="default">
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-md text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#174789]">Registration Received!</h2>
              <p className="text-xs text-slate-500">
                Your questionnaire submission for <span className="font-semibold text-slate-700">{event.title}</span> has been securely recorded.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Submission Reference:</span>
                <span className="font-mono font-bold text-blue-700">{submittedReceipt.submissionId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-medium text-slate-800">{submittedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Student ID / Enrolment:</span>
                <span className="font-medium text-slate-800">{submittedReceipt.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted At:</span>
                <span className="text-slate-600">{new Date(submittedReceipt.submittedAt).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Please preserve this reference for team verification on the day of the event. If this track requires delegate credentials, complete your registration if not already done.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                Delegate Registration Portal
              </Link>
              <Link
                href="/#competitions"
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                View Other Competitions
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 bg-slate-50/60 min-h-[calc(100vh-80px)]">
      <Container size="default">
        {/* Back Link */}
        <div className="mb-6 max-w-2xl mx-auto">
          <Link
            href="/#competitions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#153D73] hover:text-[#2563EB] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Competition Tracks</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm border-t-8 border-t-[#2563EB] space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                {event.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {event.teamSizeMin === 1 && event.teamSizeMax === 1
                  ? "Individual Participation (1 Member)"
                  : `Team Size: ${event.teamSizeMin}–${event.teamSizeMax} Members`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#174789] tracking-tight">
              {form.formTitle || event.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {form.formDescription || "Please provide your participant and team information below."}
            </p>
            <div className="text-xs text-rose-600 pt-2 border-t border-slate-100">
              * Indicates required question
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Participant Identification Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Participant Identification
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (errors.studentName) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.studentName;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g., Aarav Sharma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.studentName && <p className="text-xs text-rose-500">{errors.studentName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Student ID / Enrolment <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      if (errors.studentId) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.studentId;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g., 22001015001"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {errors.studentId && <p className="text-xs text-rose-500">{errors.studentId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    University Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => {
                      setStudentEmail(e.target.value);
                      if (errors.studentEmail) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.studentEmail;
                          return next;
                        });
                      }
                    }}
                    placeholder="student@gdgoenka.ac.in"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {errors.studentEmail && <p className="text-xs text-rose-500">{errors.studentEmail}</p>}
                </div>
              </div>
            </div>

            {/* Dynamic Event Questions */}
            {form.fields.map((field) => {
              // Hide legacy free-form textarea in favor of structured per-member cards
              if (field.label.toLowerCase().includes("additional team member details")) return null;

              const isTeamSizeField =
                field.label.toLowerCase().includes("team size") ||
                field.label.toLowerCase().includes("declared team") ||
                field.label.toLowerCase().includes("squad size");

              return (
                <React.Fragment key={field.id}>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-slate-800">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      {field.helpText && <p className="text-xs text-slate-500">{field.helpText}</p>}
                    </div>

                    {/* Short Text */}
                    {field.type === "text" && (
                      <input
                        type="text"
                        value={responses[field.id] || ""}
                        onChange={(e) => handleResponseChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "Your answer"}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {/* Long Text */}
                    {field.type === "textarea" && (
                      <textarea
                        rows={3}
                        value={responses[field.id] || ""}
                        onChange={(e) => handleResponseChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "Your detailed answer"}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {/* Number */}
                    {field.type === "number" && (
                      <input
                        type="number"
                        value={responses[field.id] || ""}
                        onChange={(e) => handleResponseChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "0"}
                        className="w-48 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {/* Date */}
                    {field.type === "date" && (
                      <input
                        type="date"
                        value={responses[field.id] || ""}
                        onChange={(e) => handleResponseChange(field.id, e.target.value)}
                        className="w-full sm:w-64 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}

                    {/* Dropdown Select */}
                    {field.type === "select" && (
                      <select
                        value={responses[field.id] || ""}
                        onChange={(e) => handleResponseChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800"
                      >
                        <option value="">Select an option</option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Radio Options */}
                    {field.type === "radio" && (
                      <div className="space-y-2 pt-1">
                        {(field.options || []).map((opt, i) => (
                          <label key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={responses[field.id] === opt}
                              onChange={(e) => handleResponseChange(field.id, e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Checkbox Options */}
                    {field.type === "checkbox" && (
                      <div className="space-y-2 pt-1">
                        {(field.options || []).map((opt, i) => {
                          const selectedList = (responses[field.id] as string[]) || [];
                          const isChecked = selectedList.includes(opt);
                          return (
                            <label key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(field.id, opt)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {errors[field.id] && <p className="text-xs text-rose-500 mt-1">{errors[field.id]}</p>}
                  </div>

                  {/* Dynamic Member Cards Section: Triggered right when team size is answered */}
                  {isTeamSizeField && isTeamEvent && selectedTeamSize >= 1 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>Team Members Information ({selectedTeamSize} Members)</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Provide full legal name, university mail ID, and student enrollment number for each squad member.
                          </p>
                        </div>
                        <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                          {selectedTeamSize} Members Selected
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {Array.from({ length: selectedTeamSize }).map((_, idx) => {
                          const memberNum = idx + 1;
                          const isLeader = memberNum === 1;
                          return (
                            <div
                              key={memberNum}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 hover:border-blue-200 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-[#174789] text-white flex items-center justify-center text-[10px] font-bold">
                                    {memberNum}
                                  </span>
                                  <span>Member {memberNum} {isLeader ? "(Team Leader)" : ""}</span>
                                </span>
                                {isLeader ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Team Leader / Primary
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    Squad Participant
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Member Name */}
                                <div className="space-y-1">
                                  <label className="block text-xs font-semibold text-slate-700">
                                    Member {memberNum} Name <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      responses[`member_${memberNum}_name`] !== undefined
                                        ? responses[`member_${memberNum}_name`]
                                        : isLeader
                                        ? studentName
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleResponseChange(`member_${memberNum}_name`, val);
                                      if (isLeader) {
                                        setStudentName(val);
                                        if (errors.studentName) {
                                          setErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.studentName;
                                            return next;
                                          });
                                        }
                                      }
                                    }}
                                    placeholder={`Full Name of Member ${memberNum}`}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                  />
                                  {errors[`member_${memberNum}_name`] && (
                                    <p className="text-[11px] text-rose-500">{errors[`member_${memberNum}_name`]}</p>
                                  )}
                                </div>

                                {/* Member Email */}
                                <div className="space-y-1">
                                  <label className="block text-xs font-semibold text-slate-700">
                                    Member {memberNum} Mail ID <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="email"
                                    value={
                                      responses[`member_${memberNum}_email`] !== undefined
                                        ? responses[`member_${memberNum}_email`]
                                        : isLeader
                                        ? studentEmail
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleResponseChange(`member_${memberNum}_email`, val);
                                      if (isLeader) {
                                        setStudentEmail(val);
                                        if (errors.studentEmail) {
                                          setErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.studentEmail;
                                            return next;
                                          });
                                        }
                                      }
                                    }}
                                    placeholder={`member${memberNum}@gdgoenka.ac.in`}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                  />
                                  {errors[`member_${memberNum}_email`] && (
                                    <p className="text-[11px] text-rose-500">{errors[`member_${memberNum}_email`]}</p>
                                  )}
                                </div>

                                {/* Member Enrollment */}
                                <div className="space-y-1">
                                  <label className="block text-xs font-semibold text-slate-700">
                                    Member {memberNum} Enrollment <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      responses[`member_${memberNum}_enrollment`] !== undefined
                                        ? responses[`member_${memberNum}_enrollment`]
                                        : isLeader
                                        ? studentId
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleResponseChange(`member_${memberNum}_enrollment`, val);
                                      if (isLeader) {
                                        setStudentId(val);
                                        if (errors.studentId) {
                                          setErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.studentId;
                                            return next;
                                          });
                                        }
                                      }
                                    }}
                                    placeholder={`Enrollment of Member ${memberNum}`}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                  />
                                  {errors[`member_${memberNum}_enrollment`] && (
                                    <p className="text-[11px] text-rose-500">{errors[`member_${memberNum}_enrollment`]}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Fallback if team size question was not in questionnaire but event is team-based */}
            {!teamSizeField && isTeamEvent && selectedTeamSize >= 1 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Team Members Information ({selectedTeamSize} Members)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provide full legal name, university mail ID, and student enrollment number for each squad member.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {selectedTeamSize} Members Selected
                  </span>
                </div>

                <div className="space-y-3.5">
                  {Array.from({ length: selectedTeamSize }).map((_, idx) => {
                    const memberNum = idx + 1;
                    const isLeader = memberNum === 1;
                    return (
                      <div
                        key={memberNum}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#174789] text-white flex items-center justify-center text-[10px] font-bold">
                              {memberNum}
                            </span>
                            <span>Member {memberNum} {isLeader ? "(Team Leader)" : ""}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Member {memberNum} Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={
                                responses[`member_${memberNum}_name`] !== undefined
                                  ? responses[`member_${memberNum}_name`]
                                  : isLeader
                                  ? studentName
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                handleResponseChange(`member_${memberNum}_name`, val);
                                if (isLeader) setStudentName(val);
                              }}
                              placeholder={`Full Name of Member ${memberNum}`}
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                            {errors[`member_${memberNum}_name`] && (
                              <p className="text-[11px] text-rose-500">{errors[`member_${memberNum}_name`]}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Member {memberNum} Mail ID <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={
                                responses[`member_${memberNum}_email`] !== undefined
                                  ? responses[`member_${memberNum}_email`]
                                  : isLeader
                                  ? studentEmail
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                handleResponseChange(`member_${memberNum}_email`, val);
                                if (isLeader) setStudentEmail(val);
                              }}
                              placeholder={`member${memberNum}@gdgoenka.ac.in`}
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                            {errors[`member_${memberNum}_email`] && (
                              <p className="text-[11px] text-rose-500">{errors[`member_${memberNum}_email`]}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Member {memberNum} Enrollment <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={
                                responses[`member_${memberNum}_enrollment`] !== undefined
                                  ? responses[`member_${memberNum}_enrollment`]
                                  : isLeader
                                  ? studentId
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                handleResponseChange(`member_${memberNum}_enrollment`, val);
                                if (isLeader) setStudentId(val);
                              }}
                              placeholder={`Enrollment of Member ${memberNum}`}
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                            {errors[`member_${memberNum}_enrollment`] && (
                              <p className="text-[11px] text-rose-500">{errors[`member_${memberNum}_enrollment`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button Bar */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/#competitions"
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel and return
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Questionnaire...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Track Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}

export default function EventRegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-blue-600 font-medium">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading registration form...</span>
          </div>
        </div>
      }
    >
      <EventRegisterContent />
    </React.Suspense>
  );
}

