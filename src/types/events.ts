export interface CompetitionTrack {
  id: string;
  title: string;
  category: "Robotics" | "Software & AI" | "Gaming & Esports" | "Design & Media" | "Innovation & Hardware";
  shortDescription: string;
  fullDescription: string;
  teamSizePlaceholder?: string;
  rules: string[];
  badge?: string;
  status: "provisional_placeholder" | "announced";
}

export interface EventScheduleItem {
  time: string;
  title: string;
  venue: string;
  category: string;
}

export interface StatHighlight {
  label: string;
  value: string;
  subtext?: string;
}

