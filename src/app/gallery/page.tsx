"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  Images,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  ExternalLink,
  Calendar,
  Filter,
  Loader2,
  Sparkles,
} from "lucide-react";
import { EventPhotoRecord } from "@/types/admin";

interface PublicGalleryPhoto extends EventPhotoRecord {
  eventCategory?: string;
  eventSlug?: string;
}

interface PublicEventMeta {
  id: string;
  title: string;
  slug: string;
  category: string;
  coverPhotoUrl?: string;
}

export default function PublicGalleryPage() {
  const [photos, setPhotos] = useState<PublicGalleryPhoto[]>([]);
  const [events, setEvents] = useState<PublicEventMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true);
        const res = await fetch("/api/photos/public");
        if (res.ok) {
          const data = await res.json();
          setPhotos(data.photos || []);
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error("Error loading public gallery:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  // Filter photos by selected event
  const filteredPhotos = useMemo(() => {
    if (selectedEventFilter === "ALL") return photos;
    return photos.filter((p) => p.eventId === selectedEventFilter);
  }, [photos, selectedEventFilter]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredPhotos.length]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-10">
        <Container>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-[#174789] font-medium flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Event Photo Gallery</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#174789] tracking-tight">
                  AVISHKAR 2026 — Photo Gallery
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Moments of innovation, hardware prototypes, algorithmic combat, and stage achievements across all approved festival competitions.
                </p>
              </div>

              {photos.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#174789] text-xs font-bold self-start sm:self-auto shrink-0 shadow-2xs">
                  <Images className="w-4 h-4 text-[#2563EB]" />
                  <span>{photos.length} Published Photo{photos.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content & Gallery */}
      <section className="py-8">
        <Container>
          {/* Event Filter Pills */}
          {events.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200 scrollbar-thin">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedEventFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedEventFilter === "ALL"
                    ? "bg-[#174789] text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                All Events ({photos.length})
              </button>

              {events.map((evt) => {
                const count = photos.filter((p) => p.eventId === evt.id).length;
                if (count === 0) return null;

                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setSelectedEventFilter(evt.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      selectedEventFilter === evt.id
                        ? "bg-[#174789] text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {evt.title} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Photos Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-4/3 bg-slate-200 rounded-2xl border border-slate-200" />
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-20 px-4 bg-white border border-dashed border-[#D9E4F2] rounded-2xl max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#174789] flex items-center justify-center mx-auto">
                <Images className="w-6 h-6 text-[#174789]" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No photos available in this gallery
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedEventFilter !== "ALL"
                  ? "No photos have been uploaded for the selected event yet. Switch back to view all events."
                  : "Official festival photographs will be published here by the organizing committee as the competitions take place."}
              </p>
              {selectedEventFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedEventFilter("ALL")}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#174789] hover:bg-[#0E2A5C] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Show All Photos</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                >
                  {/* Image Container with Consistent Proportions */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption || `${photo.eventTitle} Photo`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />

                    {/* Cover Photo Badge */}
                    {photo.isCover && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#174789]/90 text-white shadow-xs backdrop-blur-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>Cover</span>
                      </span>
                    )}

                    {/* Hover Overlay Hint */}
                    <div className="absolute inset-0 bg-[#174789]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-full bg-black/60 text-white shadow-md">
                        <Images className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Caption & Event Info */}
                  <div className="p-3.5 space-y-2">
                    <span className="inline-block text-[11px] font-bold text-[#174789] truncate max-w-full">
                      {photo.eventTitle}
                    </span>

                    <p className={`text-xs leading-relaxed line-clamp-2 ${photo.caption ? "text-slate-700" : "text-slate-400 italic"}`}>
                      {photo.caption || "Official event photograph"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Interactive Lightbox View */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Festival Photo Lightbox"
        >
          <div
            className="relative max-w-5xl w-full max-h-[94vh] flex flex-col items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <div className="min-w-0 pr-4">
                <span className="text-xs font-semibold text-white/70 block">
                  {filteredPhotos[lightboxIndex].eventTitle} • Photo {lightboxIndex + 1} of{" "}
                  {filteredPhotos.length}
                </span>
                {filteredPhotos[lightboxIndex].caption && (
                  <h4 className="text-sm font-bold text-white truncate mt-0.5">
                    {filteredPhotos[lightboxIndex].caption}
                  </h4>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/events/${filteredPhotos[lightboxIndex].eventId}`}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  title="View Event Details"
                >
                  <span>Event Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div className="relative w-full flex items-center justify-center overflow-hidden my-auto">
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1
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
                src={filteredPhotos[lightboxIndex].url}
                alt={
                  filteredPhotos[lightboxIndex].caption ||
                  `${filteredPhotos[lightboxIndex].eventTitle} photo`
                }
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />

              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Caption & Navigation Footer */}
            <div className="w-full text-center text-xs text-white/90 pt-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[11px] text-white/60">
                Use Left / Right arrow keys to navigate, ESC to close.
              </span>
              {filteredPhotos[lightboxIndex].caption && (
                <p className="bg-black/50 py-1.5 px-4 rounded-full inline-block backdrop-blur-xs max-w-xl truncate">
                  {filteredPhotos[lightboxIndex].caption}
                </p>
              )}
              <Link
                href={`/events/${filteredPhotos[lightboxIndex].eventId}`}
                className="text-xs text-teal-300 hover:text-teal-200 font-semibold underline sm:no-underline"
              >
                Go to Competition Track &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
