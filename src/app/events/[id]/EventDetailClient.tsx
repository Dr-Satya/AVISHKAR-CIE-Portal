"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  QrCode,
  Share2,
  Copy,
  Check,
  Loader2,
  Images,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { EventRecord, EventPhotoRecord } from "@/types/admin";

export default function EventDetailClient({
  initialEvent,
  initialEventId,
}: {
  initialEvent?: EventRecord | null;
  initialEventId?: string;
}) {
  const params = useParams();
  const eventId = initialEventId || (params?.id as string);

  const [event, setEvent] = useState<EventRecord | null>(initialEvent || null);
  const [loading, setLoading] = useState(!initialEvent);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Photo Gallery state
  const [photos, setPhotos] = useState<EventPhotoRecord[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : photos.length - 1
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < photos.length - 1 ? prev + 1 : 0
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, photos.length]);

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) return;
      try {
        if (!initialEvent) {
          setLoading(true);
        }
        // Query public events API to enforce that ONLY published events are accessible
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          const match = (data.events || []).find(
            (e: EventRecord) => e.id === eventId || e.slug === eventId
          );
          if (match && match.status === "published") {
            setEvent(match);
            setNotFound(false);

            // Fetch public gallery photos for this verified published event
            try {
              setLoadingPhotos(true);
              const photoRes = await fetch(`/api/events/${match.id}/photos`);
              if (photoRes.ok) {
                const photoData = await photoRes.json();
                setPhotos(photoData.photos || []);
              }
            } catch {
              // Gracefully handle photo fetch error
            } finally {
              setLoadingPhotos(false);
            }
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error loading event:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId, initialEvent]);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Derive registration status
  const getRegStatus = () => {
    if (!event) return { isOpen: false, label: "Unavailable", color: "bg-slate-100 text-slate-600" };
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (event.registrationEndDate) {
      const end = new Date(event.registrationEndDate).getTime();
      const endTimestamp =
        event.registrationEndDate.length === 10
          ? new Date(`${event.registrationEndDate}T23:59:59.999Z`).getTime()
          : end;
      if (now > endTimestamp) {
        return {
          isOpen: false,
          label: "Registration Closed",
          color: "bg-slate-100 text-slate-700 border-slate-300",
        };
      }
    }
    if (event.registrationStartDate) {
      const start = new Date(event.registrationStartDate).getTime();
      if (now < start) {
        return {
          isOpen: false,
          label: `Opens ${new Date(event.registrationStartDate).toLocaleDateString()}`,
          color: "bg-[#0A2047]/10 text-[#0A2047] border-[#0A2047]/20",
        };
      }
    }
    return {
      isOpen: true,
      label: "Registration Open",
      color: "bg-emerald-50 text-emerald-800 border-emerald-300",
    };
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] py-16">
        <Container>
          <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-[#0A2047] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#64748B] font-medium">Loading official event details...</p>
          </div>
        </Container>
      </main>
    );
  }

  if (notFound || !event) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] py-16">
        <Container>
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm text-center space-y-4 my-12">
            <div className="w-14 h-14 rounded-full bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#64748B]">
              <AlertTriangle className="w-7 h-7 text-[#D97706]" />
            </div>
            <h1 className="text-xl font-bold text-[#0A2047]">
              Event Not Found or Unpublished
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              This event track is currently unpublished, pending administrative verification, or does not exist.
              Only verified events that have received explicit presidential and administrative approval appear in the public AVISHKAR festival catalogue.
            </p>
            <div className="pt-3">
              <Link
                href="/#competitions"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Official Competitions</span>
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const regStatus = getRegStatus();

  return (
    <main className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Top Banner / Breadcrumbs */}
      <section className="bg-white border-b border-[#E2E8F0] py-6">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <Link href="/" className="hover:text-[#0A2047] font-semibold flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Home</span>
                </Link>
                <span>/</span>
                <Link href="/#competitions" className="hover:text-[#0A2047] font-medium transition-colors">Events</Link>
                <span>/</span>
                <span className="text-[#172033] font-semibold truncate max-w-xs">{event.title}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2047] tracking-tight font-institutional">
                {event.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F0F3F8] text-[#172033] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied" : "Share Event"}</span>
              </button>

              {regStatus.isOpen ? (
                <Link
                  href={`/events/${event.id}/register`}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className={`px-4 py-2 rounded-lg text-xs font-semibold border ${regStatus.color}`}>
                  {regStatus.label}
                </span>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Main Details Grid */}
      <section className="py-10">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Description, Objectives & Rules */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Overview Card */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-4">
                  <span className="px-3 py-1 rounded-md bg-[#0A2047]/5 text-[#0A2047] text-xs font-semibold border border-[#0A2047]/15 uppercase tracking-wide">
                    {event.category}
                  </span>
                  <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${regStatus.color}`}>
                    {regStatus.label}
                  </span>
                  {event.deliveryMode && (
                    <span className="px-3 py-1 rounded-md bg-[#F0F3F8] text-[#172033] text-xs font-medium border border-[#E2E8F0]">
                      {event.deliveryMode}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <h2 className="font-semibold text-[#0A2047] uppercase tracking-wider text-xs">
                    About this Competition Track
                  </h2>
                  <p className="text-sm text-[#172033] leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>

                {event.objectives && (
                  <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
                    <h2 className="font-semibold text-[#0A2047] uppercase tracking-wider text-xs">
                      Key Objectives &amp; Focus Areas
                    </h2>
                    <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-line">
                      {event.objectives}
                    </p>
                  </div>
                )}

                {/* Team Specifications Banner */}
                <div className="p-4 rounded-xl bg-[#0A2047]/5 border border-[#0A2047]/15 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#0A2047]/20 flex items-center justify-center text-[#0A2047] shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0A2047]">
                        {event.teamSizeMin === event.teamSizeMax && event.teamSizeMin === 1
                          ? "Individual Participation Track"
                          : `Team Capacity: ${event.teamSizeMin} to ${event.teamSizeMax} Members`}
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        {event.teamSizeMin === 1 && event.teamSizeMax === 1
                          ? "Solo participant entry. Multi-member submissions are restricted."
                          : `Every registered team must include between ${event.teamSizeMin} and ${event.teamSizeMax} validated members.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Photo Gallery Section */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#0A2047]/5 text-[#0A2047] border border-[#0A2047]/10">
                        <Images className="w-5 h-5 text-[#0A2047]" />
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-[#0A2047] tracking-tight">
                        Event Photo Gallery
                      </h2>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Live competition moments, prototypes, arena challenges, and stage highlights.
                    </p>
                  </div>
                  {photos.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/15 text-[#0A2047] border border-[#D4AF37]/30">
                      {photos.length} Photo{photos.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {loadingPhotos ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="aspect-4/3 bg-[#F0F3F8] rounded-xl border border-[#E2E8F0]" />
                    ))}
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-[#F5F7FA] border border-dashed border-[#E2E8F0] rounded-xl space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#0A2047]/5 text-[#0A2047] flex items-center justify-center mx-auto">
                      <Images className="w-5 h-5 text-[#0A2047]" />
                    </div>
                    <p className="text-xs font-semibold text-[#172033]">
                      No event photos published yet
                    </p>
                    <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                      Official captures, award ceremonies, and competition pictures will be published here as the track unfolds.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden bg-[#F0F3F8] border border-[#E2E8F0] cursor-pointer shadow-xs hover:shadow-md hover:border-[#D4AF37]/60 transition-all duration-200"
                        title={photo.caption || `${event.title} - Photo ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.caption || `${event.title} - Photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />

                        {/* Caption Overlay */}
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-6 text-white text-[11px] font-medium leading-tight line-clamp-1 group-hover:line-clamp-2 transition-all">
                            {photo.caption}
                          </div>
                        )}

                        {/* Cover Image Tag */}
                        {photo.isCover && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2047]/95 text-white shadow-xs backdrop-blur-xs border border-[#D4AF37]/40">
                            <Star className="w-2.5 h-2.5 fill-[#D4AF37] text-[#D4AF37]" />
                            Cover
                          </span>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-[#0A2047]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-1.5 rounded-full bg-black/60 text-white shadow-xs">
                            <Images className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Parameters & Quick Actions */}
            <div className="space-y-6">
              {/* Event Parameters Card */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
                {/* Administrator-Selected Cover Image Banner */}
                {event.coverPhotoUrl && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F0F3F8] border border-[#E2E8F0] shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.coverPhotoUrl}
                      alt={`${event.title} Official Cover`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2047]/95 text-white shadow-xs backdrop-blur-xs border border-[#D4AF37]/40">
                      <Star className="w-2.5 h-2.5 fill-[#D4AF37] text-[#D4AF37]" />
                      Official Cover Photo
                    </span>
                  </div>
                )}

                <h3 className="text-sm font-bold text-[#0A2047] border-b border-[#E2E8F0] pb-3">
                  Event Parameters
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 py-1">
                    <Calendar className="w-4 h-4 text-[#0A2047] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#64748B] block text-[11px]">Event Date &amp; Time</span>
                      <span className="font-semibold text-[#172033]">
                        {event.proposedDateTime || event.datePlaceholder || "To be announced"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-1">
                    <MapPin className="w-4 h-4 text-[#0A2047] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#64748B] block text-[11px]">Campus Venue</span>
                      <span className="font-semibold text-[#172033]">
                        {event.venuePlaceholder || "GD Goenka University Campus"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-1">
                    <CreditCard className="w-4 h-4 text-[#0A2047] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#64748B] block text-[11px]">Registration Fee</span>
                      <span className="font-bold text-[#0A2047] text-sm">
                        {event.feeAmount && event.feeAmount > 0
                          ? `₹${event.feeAmount}`
                          : "Free Entry / University Sponsored"}
                      </span>
                    </div>
                  </div>

                  {event.registrationStartDate && (
                    <div className="flex items-start gap-3 py-1">
                      <Clock className="w-4 h-4 text-[#0A2047] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#64748B] block text-[11px]">Registration Schedule</span>
                        <span className="font-semibold text-[#172033]">
                          {new Date(event.registrationStartDate).toLocaleDateString()} to{" "}
                          {event.registrationEndDate
                            ? new Date(event.registrationEndDate).toLocaleDateString()
                            : "Open"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  {regStatus.isOpen ? (
                    <Link
                      href={`/events/${event.id}/register`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      <span>Proceed to Student Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="text-center p-3 rounded-lg bg-[#F0F3F8] text-[#64748B] text-xs font-medium">
                      {regStatus.label}
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Quick Scan Card */}
              {event.qrCodeDataUrl && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm text-center space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0A2047]">
                    <QrCode className="w-4 h-4 text-[#0A2047]" />
                    <span>Scan on Mobile</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Scan to open the participant registration questionnaire on mobile devices.
                  </p>
                  <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl inline-block shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.qrCodeDataUrl}
                      alt={`${event.title} Registration QR`}
                      className="w-36 h-36 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Interactive Lightbox Modal */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Event Photo Lightbox"
        >
          <div
            className="relative max-w-5xl w-full max-h-[94vh] flex flex-col items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <div className="min-w-0 pr-4">
                <span className="text-xs font-semibold text-white/70 block">
                  {event.title} • Photo {lightboxIndex + 1} of {photos.length}
                </span>
                {photos[lightboxIndex].caption && (
                  <h4 className="text-sm font-bold text-white truncate mt-0.5">
                    {photos[lightboxIndex].caption}
                  </h4>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div className="relative w-full flex items-center justify-center overflow-hidden my-auto">
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : photos.length - 1
                    )
                  }
                  className="absolute left-2 sm:left-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[lightboxIndex].url}
                alt={
                  photos[lightboxIndex].caption ||
                  `${event.title} - Photo ${lightboxIndex + 1}`
                }
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />

              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev < photos.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Caption footer */}
            {photos[lightboxIndex].caption && (
              <div className="w-full text-center text-xs text-white/90 pt-3 px-4">
                <p className="bg-black/50 py-1.5 px-4 rounded-full inline-block backdrop-blur-xs max-w-2xl">
                  {photos[lightboxIndex].caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
