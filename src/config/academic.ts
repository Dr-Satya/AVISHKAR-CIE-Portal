/**
 * AVISHKAR 2026 — Official Academic Taxonomy Configuration
 *
 * Official GD Goenka University Schools & Programs
 * - Ordered and verified school options
 * - Canonical values mapped with backward-compatibility for historical codes (SOES, SOHAS, SOAS)
 * - Zero student PII is contained in this configuration.
 */

export const APPROVED_SCHOOLS = [
  {
    code: "School of Agricultural Sciences",
    name: "School of Agricultural Sciences",
  },
  {
    code: "School of Engineering & Sciences",
    name: "School of Engineering & Sciences",
  },
  {
    code: "School of Liberal Arts",
    name: "School of Liberal Arts",
  },
  {
    code: "School of Hospitality & Tourism",
    name: "School of Hospitality & Tourism",
  },
  {
    code: "School of Law",
    name: "School of Law",
  },
  {
    code: "School of Management",
    name: "School of Management",
  },
  {
    code: "School of Healthcare and Allied Sciences",
    name: "School of Healthcare and Allied Sciences",
  },
  {
    code: "UID-School of Design",
    name: "UID-School of Design (Unitedworld Institute of Design)",
  },
] as const;

export type SchoolCode = (typeof APPROVED_SCHOOLS)[number]["code"] | "SOES" | "SOHAS" | "SOAS";

export const PROGRAMS_BY_SCHOOL: Record<string, readonly string[]> = {
  "School of Agricultural Sciences": [
    "B.Sc. (Hons.) Agriculture",
    "M.Sc. Agriculture (Agronomy)",
    "M.Sc. Agriculture (Horticulture)",
    "Others",
  ],
  "School of Engineering & Sciences": [
    "Computer science and engineering AI&ML",
    "Computer science and engineering CORE",
    "Computer science and engineering Cyber security",
    "Computer science and engineering Data science",
    "Bachelor of Computer Applications",
    "Machine learning (BCA) program",
    "Masters of Computer Applications",
    "Biotechnology B.Sc. (Hons.) and M.Sc. program",
    "Microbiology B.Sc. (Hons.) and M.Sc. program",
    "Forensic science B.Sc. (Hons.) and M.Sc. program",
    "Electronics and communication engineering",
    "Mechanical engineering",
    "Civil engineering",
    "Others",
  ],
  "School of Liberal Arts": [
    "B.A. (Hons.) Psychology",
    "B.A. (Hons.) English",
    "B.A. (Hons.) Economics",
    "B.A. (Hons.) Political Science",
    "B.A. Journalism and Mass Communication",
    "M.A. Psychology",
    "M.A. English",
    "M.A. Economics",
    "Others",
  ],
  "School of Hospitality & Tourism": [
    "B.Sc. Hospitality and Hotel Administration",
    "Bachelor of Hotel Management and Catering Technology",
    "B.A. (Hons.) Culinary Arts",
    "Diploma in Culinary Arts",
    "Others",
  ],
  "School of Law": [
    "B.A. LL.B. (Hons.)",
    "BBA LL.B. (Hons.)",
    "LL.B. (3 Years)",
    "LL.M.",
    "Others",
  ],
  "School of Management": [
    "Bachelor of Business Administration (BBA)",
    "BBA (Hons.)",
    "B.Com (Hons.)",
    "Master of Business Administration (MBA)",
    "Executive MBA",
    "Others",
  ],
  "School of Healthcare and Allied Sciences": [
    "B.Physiotherapy",
    "B.Optometry",
    "BMLS",
    "B.Pharmacy",
    "M.Pharmacy",
    "M.Physiotherapy",
    "Public Health",
    "Others",
  ],
  "UID-School of Design": [
    "B.Des. Visual Communication",
    "B.Des. Product Design",
    "B.Des. Fashion Design",
    "B.Des. Interior Design",
    "M.Des.",
    "Others",
  ],
  // Legacy alias mappings for existing historical records
  SOES: [
    "Computer science and engineering AI&ML",
    "Computer science and engineering CORE",
    "Computer science and engineering Cyber security",
    "Computer science and engineering Data science",
    "Bachelor of Computer Applications",
    "Machine learning (BCA) program",
    "Masters of Computer Applications",
    "Biotechnology B.Sc. (Hons.) and M.Sc. program",
    "Microbiology B.Sc. (Hons.) and M.Sc. program",
    "Forensic science B.Sc. (Hons.) and M.Sc. program",
    "Electronics and communication engineering",
    "Mechanical engineering",
    "Civil engineering",
    "Others",
  ],
  SOHAS: [
    "B.Physiotherapy",
    "B.Optometry",
    "BMLS",
    "B.Pharmacy",
    "Others",
  ],
  SOAS: [
    "B.Sc. (Hons.) Agriculture",
    "Others",
  ],
};

export const YEAR_OF_JOINING_OPTIONS = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
] as const;

export type YearOfJoining = (typeof YEAR_OF_JOINING_OPTIONS)[number];

export const LEADERSHIP_INTEREST_OPTIONS = ["Yes", "No"] as const;
export type LeadershipInterestOption = (typeof LEADERSHIP_INTEREST_OPTIONS)[number];
