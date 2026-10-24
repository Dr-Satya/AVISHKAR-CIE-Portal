"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { dummyCompetitions } from "@/config/events";
import {
  Users,
  ArrowRight,
  MapPin,
  Calendar,
  Search,
  X,
  SlidersHorizontal,
  Info,
  Images,
} from "lucide-react";
import { EventRecord } from "@/types/admin";

export type EventCategoryFilter =
  | "All Events"
  | "Hackathons"
  | "Workshops"
  | "Technical Competitions"
  | "Seminars & Talks"
  | "Other Events";

export const EVENT_CATEGORIES: EventCategoryFilter[] = [
  "All Events",
  "Hackathons",
  "Workshops",
  "Technical Competitions",
  "Seminars & Talks",
  "Other Events",
];

/**
 * Maps an event's explicit category, title, or description to one of the standardized filter categories.
 */
export function mapEventToCategory(event: {
  category?: string;
  title: string;
  description?: string;
}): EventCategoryFilter {
  const cat = (event.category || "").trim().toLowerCase();
  const title = (event.title || "").toLowerCase();
  const desc = (event.description || "").toLowerCase();

  // 1. Hackathons
  if (
    cat === "hackathon" ||
    title.includes("hackathon") ||
    desc.includes("hackathon") ||
    title.includes("sprint")
  ) {
    return "Hackathons";
  }

  // 2. Workshops
  if (
    cat === "workshop" ||
    title.includes("workshop") ||
    desc.includes("workshop") ||
    title.includes("bootcamp") ||
    title.includes("hands-on")
  ) {
    return "Workshops";
  }

  // 3. Seminars & Talks
  if (
    cat === "seminar" ||
    cat === "talk" ||
    title.includes("seminar") ||
    title.includes("talk") ||
    title.includes("keynote") ||
    title.includes("guest lecture") ||
    title.includes("symposium") ||
    desc.includes("keynote")
  ) {
    return "Seminars & Talks";
  }

  // 4. Technical Competitions
  if (
    cat === "robotics" ||
    cat === "coding" ||
    cat === "gaming" ||
    cat === "software & ai" ||
    cat === "gaming & esports" ||
    cat === "technical competitions" ||
    cat === "competition" ||
    title.includes("challenge") ||
    title.includes("competition") ||
    title.includes("arena") ||
    title.includes("wars") ||
    title.includes("racing") ||
    title.includes("contest") ||
    title.includes("drone")
  ) {
    return "Technical Competitions";
  }

  // 5. Fallback for General / Other events
  return "Other Events";
}

/**
 * Formats a valid event date, discarding empty or raw placeholder strings.
 */
function getValidEventDate(evt: EventRecord): string | null {
  if (evt.registrationStartDate && evt.registrationEndDate) {
    try {
      const s = new Date(evt.registrationStartDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const e = new Date(evt.registrationEndDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (s !== "Invalid Date" && e !== "Invalid Date") {
        return s === e ? s : `${s} – ${e}`;
      }
    } catch {
      // Fall through
    }
  } else if (evt.registrationStartDate) {
    try {
      const s = new Date(evt.registrationStartDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (s !== "Invalid Date") return s;
    } catch {
      // Fall through
    }
  }

  if (evt.datePlaceholder) {
    const raw = evt.datePlaceholder.trim();
    const lower = raw.toLowerCase();
    if (
      !lower.includes("to be announced") &&
      !lower.includes("tba") &&
      !lower.includes("pending") &&
      raw !== ""
    ) {
      return raw;
    }
  }

  return null;
}

/**
 * Formats a valid venue, discarding placeholder strings.
 */
function getValidVenue(evt: EventRecord): string | null {
  if (!evt.venuePlaceholder) return null;
  const v = evt.venuePlaceholder.trim();
  const lower = v.toLowerCase();
  if (
    lower.includes("to be announced") ||
    lower.includes("tba") ||
    lower.includes("pending") ||
    v === ""
  ) {
    return null;
  }
  return v;
}

/**
 * Derives registration status badge.
 */
function getRegistrationStatus(evt: EventRecord): {
  label: string;
  isOpen: boolean;
  colorClass: string;
} {
  const now = new Date().getTime();

  if (evt.registrationEndDate) {
    const end = new Date(evt.registrationEndDate).getTime();
    if (now > end) {
      return {
        label: "Registration Closed",
        isOpen: false,
        colorClass: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3 && daysLeft >= 0) {
      return {
        label: `Closing in ${daysLeft}d`,
        isOpen: true,
        colorClass: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
  }

  if (evt.registrationStartDate) {
    const start = new Date(evt.registrationStartDate).getTime();
    if (now < start) {
      return {
        label: "Opening Soon",
        isOpen: false,
        colorClass: "bg-[#0A2047]/10 text-[#0A2047] border border-[#0A2047]/20",
      };
    }
  }

  return {
    label: "Registration Open",
    isOpen: true,
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

export function HighlightsSection() {
  const [publishedEvents, setPublishedEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryFilter>("All Events");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "date_asc" | "date_desc" | "title_asc">("default");
  const [activeModalEvent, setActiveModalEvent] = useState<EventRecord | null>(null);

  useEffect(() => {
    async function loadPublished() {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.events) && data.events.length > 0) {
            setPublishedEvents(data.events);
          }
        }
      } catch (err) {
        console.error("Failed to load published events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPublished();
  }, []);

  // Compute category counts based on existing events
  const categoryCounts = useMemo(() => {
    const counts: Record<EventCategoryFilter, number> = {
      "All Events": publishedEvents.length,
      Hackathons: 0,
      Workshops: 0,
      "Technical Competitions": 0,
      "Seminars & Talks": 0,
      "Other Events": 0,
    };

    for (const evt of publishedEvents) {
      const cat = mapEventToCategory(evt);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    }

    return counts;
  }, [publishedEvents]);

  // Filter and sort events based on category, search query, and sort order
  const filteredEvents = useMemo(() => {
    let list = [...publishedEvents];

    // 1. Filter by Category
    if (selectedCategory !== "All Events") {
      list = list.filter((evt) => mapEventToCategory(evt) === selectedCategory);
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (evt) =>
          evt.title.toLowerCase().includes(q) ||
          (evt.description && evt.description.toLowerCase().includes(q)) ||
          (evt.category && evt.category.toLowerCase().includes(q))
      );
    }

    // 3. Sort Events
    if (sortBy === "title_asc") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "date_asc") {
      list.sort((a, b) => {
        const dA = a.registrationStartDate ? new Date(a.registrationStartDate).getTime() : 0;
        const dB = b.registrationStartDate ? new Date(b.registrationStartDate).getTime() : 0;
        return dA - dB;
      });
    } else if (sortBy === "date_desc") {
      list.sort((a, b) => {
        const dA = a.registrationStartDate ? new Date(a.registrationStartDate).getTime() : 0;
        const dB = b.registrationStartDate ? new Date(b.registrationStartDate).getTime() : 0;
        return dB - dA;
      });
    }

    return list;
  }, [publishedEvents, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="competitions" className="py-14 sm:py-16 lg:py-20 bg-white border-b border-[#E2E8F0]">
      <Container>
        {/* Centered Section Label (Minimal, No Container) */}
        <div className="w-full flex items-center justify-center mb-4 sm:mb-5">
          <div className="inline-flex items-center gap-2 text-[#0A2047] text-xs font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" aria-hidden="true" />
            <span>OFFICIAL EVENTS &amp; COMPETITIONS</span>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0A2047] tracking-tight leading-snug font-institutional">
              Official Events &amp; Competitions
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#64748B] max-w-2xl leading-relaxed">
              Explore university hackathons, workshops, technical competitions, and academic seminars. Select a category or search below to discover tracks and register.
            </p>
          </div>
          <div>
            <span className="inline-flex items-center text-xs font-medium text-[#0A2047] bg-[#F0F3F8] px-3.5 py-1.5 rounded-md border border-[#E2E8F0] shadow-2xs whitespace-nowrap">
              {publishedEvents.length > 0
                ? `${publishedEvents.length} Official Tracks Available`
                : "Official Handbooks Pending Release"}
            </span>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title or keywords..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2047]/20 focus:border-[#0A2047] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "default" | "date_asc" | "date_desc" | "title_asc")}
              className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#0A2047] cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="title_asc">Title (A–Z)</option>
              <option value="date_asc">Event Date (Earliest)</option>
              <option value="date_desc">Event Date (Latest)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Navigation Bar */}
        <div className="mb-8 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {EVENT_CATEGORIES.map((cat, idx) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat];

              return (
                <React.Fragment key={cat}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-[#0A2047] text-white shadow-xs font-bold ring-1 ring-[#0A2047]"
                        : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0A2047] hover:bg-[#F0F3F8] border border-[#E2E8F0]"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10.5px] font-mono leading-none ${
                        isSelected
                          ? "bg-[#D4AF37] text-[#0A2047] font-bold"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>

                  {idx < EVENT_CATEGORIES.length - 1 && (
                    <span className="hidden sm:inline-block text-slate-300 select-none">|</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Filter Summary & Quick Reset */}
        {(selectedCategory !== "All Events" || searchQuery) && (
          <div className="flex items-center justify-between mb-6 text-xs text-slate-600 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg px-3.5 py-2">
            <div>
              Showing <span className="font-bold text-[#0A2047]">{filteredEvents.length}</span> event
              {filteredEvents.length === 1 ? "" : "s"}
              {selectedCategory !== "All Events" && (
                <span> in <span className="font-semibold text-slate-800">{selectedCategory}</span></span>
              )}
              {searchQuery && (
                <span> matching &ldquo;<span className="font-semibold text-slate-800">{searchQuery}</span>&rdquo;</span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedCategory("All Events");
                setSearchQuery("");
              }}
              className="text-[#0A2047] hover:text-[#B89125] hover:underline font-semibold cursor-pointer text-xs"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const filterCat = mapEventToCategory(evt);
              const eventDate = getValidEventDate(evt);
              const venue = getValidVenue(evt);
              const status = getRegistrationStatus(evt);
              const hasTeamLimits = evt.teamSizeMin !== undefined && evt.teamSizeMax !== undefined;

              return (
                <div
                  key={evt.id}
                  className="flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs hover:shadow-md hover:border-[#D4AF37]/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Top Area */}
                  <div>
                    {/* Event Cover Photo Thumbnail */}
                    {evt.coverPhotoUrl && (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-100 mb-3.5 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evt.coverPhotoUrl}
                          alt={`${evt.title} Cover`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide bg-[#F0F3F8] text-[#0A2047] border border-[#E2E8F0]">
                        {filterCat}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium border ${status.colorClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {status.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-[19px] font-bold text-[#0A2047] leading-snug line-clamp-2 mb-2 font-institutional">
                      {evt.title}
                    </h3>

                    {/* Description */}
                    {evt.description && (
                      <p className="text-[13px] text-[#64748B] leading-relaxed line-clamp-3 mb-4">
                        {evt.description}
                      </p>
                    )}

                    {/* Relevant Configured Metadata (omits empty/placeholder fields) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-[#172033]">
                      {/* Team Capacity */}
                      {hasTeamLimits && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-[#B89125] shrink-0" />
                          <span className="font-medium">
                            {evt.teamSizeMin === evt.teamSizeMax && evt.teamSizeMin === 1
                              ? "Individual Participation (1 member)"
                              : evt.teamSizeMin === evt.teamSizeMax
                              ? `Team Size: ${evt.teamSizeMin} members`
                              : `Team Size: ${evt.teamSizeMin}–${evt.teamSizeMax} members`}
                          </span>
                        </div>
                      )}

                      {/* Event Date (if configured) */}
                      {eventDate && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-[#B89125] shrink-0" />
                          <span>{eventDate}</span>
                        </div>
                      )}

                      {/* Venue (if configured) */}
                      {venue && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-[#B89125] shrink-0" />
                          <span className="truncate">{venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalEvent(evt)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A2047] hover:text-[#B89125] hover:underline cursor-pointer py-1"
                    >
                      <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>View Details</span>
                    </button>

                    <Link
                      href={`/events/${evt.id}/register`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Register</span>
                      <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : publishedEvents.length === 0 && !loading ? (
          /* Fallback when no published events in DB */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyCompetitions.map((comp) => (
              <div
                key={comp.id}
                className="flex flex-col justify-between bg-white border border-[#E2E8F0] hover:border-[#D4AF37]/50 rounded-xl p-5 shadow-2xs transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="navy">{comp.category}</Badge>
                    <Badge variant="provisional">Provisional Track</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-[#0A2047] leading-snug mb-2">
                    {comp.title}
                  </h3>
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">
                    {comp.shortDescription}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
                  Registration opening soon
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State for category or search with 0 matches */
          <div className="text-center py-16 px-4 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-2xl max-w-xl mx-auto my-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0A2047]/5 border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#0A2047]">
              <Calendar className="w-6 h-6 text-[#0A2047]" />
            </div>
            <h3 className="text-base font-bold text-[#0A2047] font-institutional">
              No events available in this category right now.
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? `No events matched your search for "${searchQuery}". Try selecting another category or resetting filters.`
                : `There are currently no published events filed under "${selectedCategory}". Check back soon for new announcements.`}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All Events");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Return to All Events</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {activeModalEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2047]/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setActiveModalEvent(null)}
          >
            <div
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide bg-[#F0F3F8] text-[#0A2047] border border-[#E2E8F0]">
                      {mapEventToCategory(activeModalEvent)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-medium border ${
                        getRegistrationStatus(activeModalEvent).colorClass
                      }`}
                    >
                      {getRegistrationStatus(activeModalEvent).label}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2047] leading-snug font-institutional">
                    {activeModalEvent.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalEvent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-[#0A2047] hover:bg-[#F0F3F8] transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover Photo Banner in Modal */}
              {activeModalEvent.coverPhotoUrl && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-[#E2E8F0] shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeModalEvent.coverPhotoUrl}
                    alt={`${activeModalEvent.title} Cover`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Full Description */}
              <div className="space-y-2 text-sm text-[#64748B] leading-relaxed">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2047]">
                  About this Event
                </h4>
                <p>{activeModalEvent.description || "Details for this official competition track."}</p>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs">
                {activeModalEvent.teamSizeMin !== undefined && activeModalEvent.teamSizeMax !== undefined && (
                  <div>
                    <span className="font-semibold text-[#64748B] block">Team Requirement</span>
                    <span className="text-[#0A2047] font-medium">
                      {activeModalEvent.teamSizeMin === activeModalEvent.teamSizeMax && activeModalEvent.teamSizeMin === 1
                        ? "Individual (1 member)"
                        : `${activeModalEvent.teamSizeMin}–${activeModalEvent.teamSizeMax} Members`}
                    </span>
                  </div>
                )}

                {getValidEventDate(activeModalEvent) && (
                  <div>
                    <span className="font-semibold text-[#64748B] block">Schedule</span>
                    <span className="text-[#0A2047] font-medium">
                      {getValidEventDate(activeModalEvent)}
                    </span>
                  </div>
                )}

                {getValidVenue(activeModalEvent) && (
                  <div>
                    <span className="font-semibold text-[#64748B] block">Campus Venue</span>
                    <span className="text-[#0A2047] font-medium truncate block">
                      {getValidVenue(activeModalEvent)}
                    </span>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-[#64748B] block">Event Track</span>
                  <span className="text-[#0A2047] font-medium">
                    {activeModalEvent.category || "Official Competition"}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
                <Link
                  href={`/events/${activeModalEvent.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A2047] hover:text-[#B89125] hover:underline cursor-pointer"
                >
                  <Images className="w-3.5 h-3.5 text-[#B89125]" />
                  <span>View Full Event &amp; Photo Gallery</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalEvent(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#0A2047] hover:bg-[#F0F3F8] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    href={`/events/${activeModalEvent.id}/register`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A2047] hover:bg-[#132E57] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Proceed to Register</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
