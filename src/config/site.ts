export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  university: string;
  edition: string;
  datesPlaceholder: string;
  venuePlaceholder: string;
  supportEmail: string | null;
  supportEmailNote: string;
  year: number;
  branding: {
    primaryNavy: string;
    secondaryBlue: string;
    accentTeal: string;
    logoAvishkar: string;
    logoUniversity: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "AVISHKAR",
  shortName: "AVISHKAR",
  tagline: "Center of Innovation and Entrepreneurship &bull; GD Goenka University",
  description:
    "Annual technical innovation fest of GD Goenka University showcasing student innovations, technical challenges, and engineering tracks.",
  university: "GD Goenka University",
  edition: "2026 Edition",
  datesPlaceholder: "Dates to be announced",
  venuePlaceholder: "GD Goenka University Campus, Gurugram, Delhi-NCR",
  supportEmail: null, // Provisional: unconfirmed until official notification
  supportEmailNote: "Official contact email and helpline will be announced upon confirmation.",
  year: 2026,
  branding: {
    primaryNavy: "#0B1F3A",
    secondaryBlue: "#2563EB",
    accentTeal: "#0D9488",
    logoAvishkar: "/images/avishkar-logo.png",
    logoUniversity: "/images/gd-goenka-logo.png",
  },
};

export interface NavItem {
  title: string;
  href: string;
}

export const mainNavItems: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "About", href: "/#about" },
  { title: "Events/Competitions", href: "/#competitions" },
  { title: "Gallery", href: "/gallery" },
  { title: "Guidelines", href: "/#guidelines" },
  { title: "Contact", href: "/#contact" },
];