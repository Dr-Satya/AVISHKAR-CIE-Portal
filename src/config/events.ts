import { CompetitionTrack, StatHighlight } from "@/types/events";

/**
 * Placeholder tracks for competition categories.
 * All details, rules, and team limits are clearly labelled as placeholders
 * until official competition handbooks are approved by the organizing committee.
 */
export const dummyCompetitions: CompetitionTrack[] = [
  {
    id: "software-ai",
    title: "Software & AI Innovation Challenge",
    category: "Software & AI",
    shortDescription: "Provisional track for algorithmic problem solving, web development, and AI/ML prototypes.",
    fullDescription: "Students build solutions addressing practical challenges. Specific problem statements, evaluation rubrics, and submission protocols will be released in the official handbook.",
    teamSizePlaceholder: "Team size guidelines to be announced",
    rules: [
      "Official rulebook pending release",
      "Original student work requirement",
      "Live presentation & evaluation round",
    ],
    badge: "Provisional Track",
    status: "provisional_placeholder",
  },
  {
    id: "robotics-arena",
    title: "Robotics & Automation Arena",
    category: "Robotics",
    shortDescription: "Provisional arena for autonomous navigation, mechanical design, and robotics engineering.",
    fullDescription: "Engineering track focusing on hardware control, embedded systems, and robotics. Arena dimensions and technical specifications will be detailed in the official guide.",
    teamSizePlaceholder: "Team size guidelines to be announced",
    rules: [
      "Arena specifications to be released",
      "Safety and inspection compliance mandatory",
      "Standard university jury review",
    ],
    badge: "Provisional Track",
    status: "provisional_placeholder",
  },
  {
    id: "innovation-expo",
    title: "Project & Research Expo",
    category: "Innovation & Hardware",
    shortDescription: "Provisional platform for showcasing engineering hardware, IoT prototypes, and scientific models.",
    fullDescription: "Open exhibition track for presenting undergraduate research, engineering prototypes, and innovative technology demonstrations.",
    teamSizePlaceholder: "Team size guidelines to be announced",
    rules: [
      "Working prototype or poster demonstration",
      "Abstract submission requirements TBA",
      "Faculty jury evaluation session",
    ],
    badge: "Provisional Track",
    status: "provisional_placeholder",
  },
  {
    id: "esports-arena",
    title: "Digital & Tactical Gaming",
    category: "Gaming & Esports",
    shortDescription: "Provisional arena for competitive gaming, digital tactics, and collaborative strategy.",
    fullDescription: "Esports competition track. Selected gaming titles, hardware requirements, and tournament tournament brackets will be released in the official announcement.",
    teamSizePlaceholder: "Team size guidelines to be announced",
    rules: [
      "Official tournament title list TBA",
      "Fair play and conduct code enforced",
      "Standard LAN tournament regulations",
    ],
    badge: "Provisional Track",
    status: "provisional_placeholder",
  },
];

/**
 * Event overview highlights (placeholders without unverified statistical claims).
 */
export const eventStatPlaceholders: StatHighlight[] = [
  { label: "Host Institution", value: "GD Goenka University", subtext: "School of Engineering & Sciences" },
  { label: "Event Status", value: "Announcements Pending", subtext: "Official schedule to be published" },
  { label: "Campus Venue", value: "Gurugram, Delhi-NCR", subtext: "Sohna Education City Campus" },
  { label: "Participation", value: "Open Registration", subtext: "Detailed eligibility in rulebook" },
];

