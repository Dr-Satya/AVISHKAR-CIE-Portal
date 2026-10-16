/**
 * AVISHKAR 2026 — Official Academic Taxonomy Configuration
 *
 * Grounded directly in official university records:
 * - Schools: SOES, SOHAS, SOAS (No synthetic "Other" category)
 * - Programs: Verbatim department/program options from reference records
 * - Zero student PII is contained in this configuration.
 */

export const APPROVED_SCHOOLS = [
  {
    code: "SOES",
    name: "SOES (School of Engineering and Sciences)",
  },
  {
    code: "SOHAS",
    name: "SOHAS (School of Healthcare and Allied Sciences)",
  },
  {
    code: "SOAS",
    name: "SOAS (School of Agricultural Sciences)",
  },
] as const;

export type SchoolCode = (typeof APPROVED_SCHOOLS)[number]["code"];

export const PROGRAMS_BY_SCHOOL: Record<SchoolCode, readonly string[]> = {
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
  ],
  SOAS: [
    "Others",
  ],
} as const;

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
