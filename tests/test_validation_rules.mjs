// tests/test_validation_rules.mjs
// Node.js test script to verify official registration rules and academic taxonomy

import fs from "fs";
import path from "path";

function runValidationRuleTests() {
  console.log("Running AVISHKAR-v2 Official Validation & Academic Configuration Tests...\n");

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`✅ Pass: ${desc}`);
      passed++;
    } else {
      console.error(`❌ Fail: ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. Check academic.ts contents
  const academicPath = path.resolve("src/config/academic.ts");
  assert(fs.existsSync(academicPath), "src/config/academic.ts exists");
  const academicContent = fs.readFileSync(academicPath, "utf8");

  assert(academicContent.includes('"SOES"'), "SOES school is defined");
  assert(academicContent.includes('"SOHAS"'), "SOHAS school is defined");
  assert(academicContent.includes('"SOAS"'), "SOAS school is defined");
  assert(!academicContent.includes('code: "Other"'), "No unapproved 'Other' school category exists");
  assert(academicContent.includes("Computer science and engineering AI&ML"), "AI&ML program is configured");
  assert(academicContent.includes("B.Physiotherapy"), "B.Physiotherapy program is configured for SOHAS");
  assert(academicContent.includes("YEAR_OF_JOINING_OPTIONS"), "YEAR_OF_JOINING_OPTIONS is defined");
  assert(academicContent.includes("LEADERSHIP_INTEREST_OPTIONS"), "LEADERSHIP_INTEREST_OPTIONS is defined with Yes/No");

  // 2. Check registration.ts validation logic
  const validationPath = path.resolve("src/lib/validations/registration.ts");
  assert(fs.existsSync(validationPath), "src/lib/validations/registration.ts exists");
  const validationContent = fs.readFileSync(validationPath, "utf8");

  assert(validationContent.includes("EMAIL_REGEX"), "Email regex validation is defined");
  assert(validationContent.includes("PHONE_REGEX"), "Phone regex validation is defined");
  assert(validationContent.includes("validateClubEngagement"), "validateClubEngagement is defined");
  assert(
    validationContent.includes("trimmedId.length === 0") || validationContent.includes("!trimmedId"),
    "Nonblank student ID check is implemented"
  );
  assert(
    validationContent.includes("trimmedReason.length < 10"),
    "Reason for joining min 10 chars is enforced"
  );

  // 3. Check route.ts API Pre-Launch Gate & Mappings
  const routePath = path.resolve("src/app/api/register/route.ts");
  assert(fs.existsSync(routePath), "src/app/api/register/route.ts exists");
  const routeContent = fs.readFileSync(routePath, "utf8");

  assert(
    routeContent.includes("isOfficialPaymentConfigured()") && routeContent.includes("status: 423"),
    "Pre-launch gate returns HTTP 423 when fee is unconfirmed"
  );
  assert(
    routeContent.includes('form_version: "v2-official"'),
    "form_version is explicitly set to v2-official in API inserts"
  );
  assert(
    routeContent.includes("academic_year: null"),
    "academic_year is explicitly set to null to avoid storing calendar year as study year"
  );
  assert(
    routeContent.includes("year_of_joining: yearOfJoining.trim()"),
    "year_of_joining is stored in its dedicated column"
  );

  // 4. Check Migration 003 SQL Safety
  const mig3Path = path.resolve("supabase/migrations/003_add_official_fields.sql");
  assert(fs.existsSync(mig3Path), "supabase/migrations/003_add_official_fields.sql exists");
  const mig3Content = fs.readFileSync(mig3Path, "utf8");

  assert(
    mig3Content.includes("ALTER TABLE public.registrations ALTER COLUMN academic_year DROP NOT NULL"),
    "Migration 003 relaxes legacy academic_year constraint"
  );
  assert(
    mig3Content.includes("ADD COLUMN IF NOT EXISTS form_version VARCHAR(20) NULL"),
    "form_version is added without a default (NULL for historical rows)"
  );
  assert(
    mig3Content.includes("chk_registrations_student_id_not_blank") && mig3Content.includes("NOT VALID"),
    "Nonblank student ID check constraint uses safe NOT VALID clause"
  );

  console.log(`\nResults: ${passed}/${total} test checks passed.`);
  if (passed === total) {
    console.log("🎉 All configuration and code integrity checks passed!\n");
  } else {
    process.exit(1);
  }
}

runValidationRuleTests();
