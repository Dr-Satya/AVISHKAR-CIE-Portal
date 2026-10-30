import { siteConfig } from "@/config/site";
import { dummyCompetitions, eventStatPlaceholders } from "@/config/events";
import {
  validatePersonalInfo,
  validateAcademicInfo,
  validateClubEngagement,
  validateAllRegistration,
  GENDER_OPTIONS,
} from "@/lib/validations/registration";
import { StudentRegistrationInput } from "@/types/registration";

/**
 * Sanity and validation test suite for AVISHKAR-v2 Phase 2 Official Form Alignment
 */
export function testProjectSanity(): {
  status: "ok";
  version: string;
  checks: {
    siteConfigValid: boolean;
    competitionsHavePlaceholders: boolean;
    supportEmailUnconfirmed: boolean;
    statsArePlaceholders: boolean;
    requiredFieldsEnforced: boolean;
    genderAndDobOptional: boolean;
    futureDobRejected: boolean;
    whitespaceIdRejected: boolean;
    approvedSchoolsEnforced: boolean;
    validStudentPasses: boolean;
  };
} {
  const siteConfigValid = Boolean(
    siteConfig.name === "AVISHKAR" &&
    siteConfig.university.includes("GD Goenka") &&
    siteConfig.year === 2026
  );

  const competitionsHavePlaceholders = dummyCompetitions.every(
    (c) => c.status === "provisional_placeholder" && c.teamSizePlaceholder !== undefined
  );

  const supportEmailUnconfirmed = siteConfig.supportEmail === null;
  const statsArePlaceholders = eventStatPlaceholders.length > 0;

  // Test 1: Required fields enforced on empty input
  const emptyPersonalErrors = validatePersonalInfo({
    studentName: "",
    email: "",
    contactNumber: "",
  });
  const emptyAcademicErrors = validateAcademicInfo({
    studentId: "",
    school: "",
    program: "",
    yearOfJoining: "",
  });
  const emptyClubErrors = validateClubEngagement({
    reasonForJoining: "",
    leadershipInterest: "" as any,
  });

  const requiredFieldsEnforced = Boolean(
    emptyPersonalErrors.studentName &&
    emptyPersonalErrors.email &&
    emptyPersonalErrors.contactNumber &&
    emptyAcademicErrors.studentId &&
    emptyAcademicErrors.school &&
    emptyAcademicErrors.program &&
    emptyAcademicErrors.yearOfJoining &&
    emptyClubErrors.reasonForJoining &&
    emptyClubErrors.leadershipInterest
  );

  // Test 2: Gender and DOB are optional (no errors when omitted)
  const optionalPersonalErrors = validatePersonalInfo({
    studentName: "Rahul Sharma",
    email: "rahul@gdgu.org",
    contactNumber: "9876543210",
    gender: "",
    dob: "",
  });
  const genderAndDobOptional = Object.keys(optionalPersonalErrors).length === 0;

  // Test 3: Future DOB rejection if supplied
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureDobString = tomorrow.toISOString().split("T")[0];
  const futureDobErrors = validatePersonalInfo({
    studentName: "Rahul",
    email: "rahul@gdgu.org",
    contactNumber: "9876543210",
    dob: futureDobString,
  });
  const futureDobRejected = Boolean(futureDobErrors.dob);

  // Test 4: Whitespace-only student ID is rejected
  const whitespaceIdErrors = validateAcademicInfo({
    studentId: "   ",
    school: "SOES",
    program: "Computer science and engineering AI&ML",
    yearOfJoining: "2024",
  });
  const whitespaceIdRejected = Boolean(whitespaceIdErrors.studentId);

  // Test 5: School must be an approved school code
  const invalidSchoolErrors = validateAcademicInfo({
    studentId: "240160226299",
    school: "INVALID_SCHOOL",
    program: "Computer science and engineering AI&ML",
    yearOfJoining: "2024",
  });
  const approvedSchoolsEnforced = Boolean(invalidSchoolErrors.school);

  // Test 6: Valid student passes validation
  const sampleValidStudent: StudentRegistrationInput = {
    studentName: "Kartik Verma",
    email: "kartik@gdgu.org",
    contactNumber: "9145372100",
    gender: "Male",
    dob: "2004-06-15",
    admissionNumber: "240160226299",
    studentId: "240160226299",
    school: "SOES",
    program: "Computer science and engineering AI&ML",
    yearOfJoining: "2024",
    reasonForJoining: "Passionate about artificial intelligence and eager to participate in fest hackathons.",
    leadershipInterest: "Yes",
  };
  const validErrors = validateAllRegistration(sampleValidStudent, false);
  const validStudentPasses = Object.keys(validErrors).length === 0;

  return {
    status: "ok",
    version: "2.1.0",
    checks: {
      siteConfigValid,
      competitionsHavePlaceholders,
      supportEmailUnconfirmed,
      statsArePlaceholders,
      requiredFieldsEnforced,
      genderAndDobOptional,
      futureDobRejected,
      whitespaceIdRejected,
      approvedSchoolsEnforced,
      validStudentPasses,
    },
  };
}
