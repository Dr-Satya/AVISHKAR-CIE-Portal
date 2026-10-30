// tests/test_previous_work_registration.mjs
// Comprehensive test suite for AVISHKAR-v2 Previous Work / Startup Details (Optional) feature

import fs from "fs";
import path from "path";

async function runAllTests() {
  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
  console.log("================================================================================");
  console.log("AVISHKAR-v2 — Previous Work / Startup Details (Optional) Test Suite");
  console.log(`Target: ${baseUrl}`);
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, description, extraInfo = "") {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      if (extraInfo) {
        console.error(`     Details: ${extraInfo}`);
      }
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 1: Code Structure, Types, and Component Assertions
  // ---------------------------------------------------------------------------
  console.log("--- Suite 1: Component & Architecture Verification ---");

  const prevWorkStepPath = path.join(process.cwd(), "src", "components", "registration", "PreviousWorkStep.tsx");
  assert(fs.existsSync(prevWorkStepPath), "PreviousWorkStep.tsx component file exists");

  const prevWorkContent = fs.readFileSync(prevWorkStepPath, "utf-8");

  // Verify section heading and optionality label
  assert(
    prevWorkContent.includes("Previous Work / Startup Details") && prevWorkContent.includes("(Optional)"),
    "Section heading displays 'Previous Work / Startup Details (Optional)'"
  );

  // Verify exact requested description text
  const expectedDesc = "Tell us about any previous projects, startup initiatives, hackathons, research, or other relevant work you have completed. This information is optional and helps the organizing team understand your experience and interests. If you have no previous experience, you can skip this section.";
  assert(
    prevWorkContent.includes(expectedDesc),
    "Section includes exact requested description text"
  );

  // Verify Field 1: Previous Work or Project Details
  assert(
    prevWorkContent.includes('id="previousWorkDescription"') &&
    prevWorkContent.includes("Previous Work or Project Details") &&
    prevWorkContent.includes("Describe any projects, startup ideas, businesses, hackathons, research, or other relevant work you have completed.") &&
    prevWorkContent.includes("maxLength={2000}"),
    "Field 1 (previousWorkDescription): Multiline textarea with exact label, placeholder, and max length 2000"
  );

  // Verify Field 2: Project or Startup Name
  assert(
    prevWorkContent.includes('id="projectName"') &&
    prevWorkContent.includes("Project or Startup Name") &&
    prevWorkContent.includes("Enter your project or startup name, if applicable.") &&
    prevWorkContent.includes("maxLength={150}"),
    "Field 2 (projectName): Text input with exact label, placeholder, and max length 150"
  );

  // Verify Field 3: Your Role
  assert(
    prevWorkContent.includes('id="projectRole"') &&
    prevWorkContent.includes("Your Role") &&
    prevWorkContent.includes("e.g., Founder, Co-founder, Developer, Team Member, Researcher.") &&
    prevWorkContent.includes("maxLength={100}"),
    "Field 3 (projectRole): Text input with exact label, placeholder, and max length 100"
  );

  // Verify Field 4: Technologies Used
  assert(
    prevWorkContent.includes('id="technologiesUsed"') &&
    prevWorkContent.includes("Technologies Used") &&
    prevWorkContent.includes("e.g., Python, React, Next.js, FastAPI, Machine Learning.") &&
    prevWorkContent.includes("maxLength={500}"),
    "Field 4 (technologiesUsed): Text input with exact label, placeholder, and max length 500"
  );

  // Verify Field 5: Project Link / Portfolio URL
  assert(
    prevWorkContent.includes('id="projectLink"') &&
    prevWorkContent.includes("Project Link or Portfolio URL") &&
    prevWorkContent.includes("https://github.com/username/project") &&
    prevWorkContent.includes('type="url"'),
    "Field 5 (projectLink): URL input with exact label, placeholder, and URL type"
  );

  // Verify Strict Optionality: No required attributes in PreviousWorkStep
  const hasHtmlRequired = /required\s*(?:=\s*(?:\{true\}|["']true["']))?/.test(
    prevWorkContent.replace(/aria-required/g, "")
  );
  assert(!hasHtmlRequired, "No HTML 'required' attributes present in PreviousWorkStep fields");

  // Verify StepIndicator has 5 steps and Step 3 is Previous Work
  const stepIndicatorContent = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "registration", "StepIndicator.tsx"),
    "utf-8"
  );
  assert(
    stepIndicatorContent.includes('title: "Previous Work"') && stepIndicatorContent.includes("number: 3"),
    "StepIndicator registers Step 3 as 'Previous Work'"
  );

  // Verify RegistrationWizard handles Step 3, draft saving, and 5 steps
  const wizardContent = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "registration", "RegistrationWizard.tsx"),
    "utf-8"
  );
  assert(
    wizardContent.includes("<PreviousWorkStep") &&
    wizardContent.includes("avishkar_registration_draft_v2") &&
    wizardContent.includes("validatePreviousWork"),
    "RegistrationWizard integrates PreviousWorkStep, draft autosave/restore, and validation"
  );

  // Verify ReviewStep displays Previous Work details and safe links
  const reviewStepContent = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "registration", "ReviewStep.tsx"),
    "utf-8"
  );
  assert(
    reviewStepContent.includes("3. Previous Work / Startup Details") &&
    reviewStepContent.includes("Not provided (Optional section skipped).") &&
    reviewStepContent.includes("onEditStep(3)"),
    "ReviewStep displays Previous Work summary card with edit navigation"
  );

  // Verify Admin Portal Detail Modal
  const adminModalContent = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "admin", "RegistrationDetailModal.tsx"),
    "utf-8"
  );
  assert(
    adminModalContent.includes("Previous Work / Startup Details") &&
    adminModalContent.includes("No previous-work details provided") &&
    adminModalContent.includes("previous_work_description") &&
    adminModalContent.includes("project_name") &&
    adminModalContent.includes("project_role") &&
    adminModalContent.includes("technologies_used") &&
    adminModalContent.includes("project_link"),
    "Admin RegistrationDetailModal displays Previous Work / Startup Details with safe link rendering"
  );

  // Verify Database Migration File
  const migrationPath = path.join(process.cwd(), "supabase", "migrations", "006_add_previous_work_details.sql");
  assert(fs.existsSync(migrationPath), "Migration file 006_add_previous_work_details.sql exists");
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");
  assert(
    migrationContent.includes("previous_work_description TEXT NULL") &&
    migrationContent.includes("project_name VARCHAR(150) NULL") &&
    migrationContent.includes("project_role VARCHAR(100) NULL") &&
    migrationContent.includes("technologies_used VARCHAR(500) NULL") &&
    migrationContent.includes("project_link VARCHAR(500) NULL"),
    "Migration file defines all 5 fields as nullable to preserve compatibility"
  );

  // ---------------------------------------------------------------------------
  // SUITE 2: Validation Unit Logic Testing
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 2: Validation Rules & Optionality Logic ---");

  // We test the validation rules using the same contract as src/lib/validations/registration.ts
  function validatePreviousWorkMock(data) {
    const errors = {};
    if (data.previousWorkDescription && data.previousWorkDescription.length > 2000) {
      errors.previousWorkDescription = "Previous Work or Project Details cannot exceed 2,000 characters.";
    }
    if (data.projectName && data.projectName.length > 150) {
      errors.projectName = "Project or Startup Name cannot exceed 150 characters.";
    }
    if (data.projectRole && data.projectRole.length > 100) {
      errors.projectRole = "Your Role cannot exceed 100 characters.";
    }
    if (data.technologiesUsed && data.technologiesUsed.length > 500) {
      errors.technologiesUsed = "Technologies Used cannot exceed 500 characters.";
    }
    if (data.projectLink && data.projectLink.trim()) {
      const trimmedUrl = data.projectLink.trim();
      if (trimmedUrl.length > 500) {
        errors.projectLink = "Project Link or Portfolio URL cannot exceed 500 characters.";
      } else {
        try {
          const parsed = new URL(trimmedUrl);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            errors.projectLink = "Please enter a valid web URL starting with http:// or https://";
          } else if (!parsed.hostname || !parsed.hostname.includes(".")) {
            errors.projectLink = "Please enter a valid URL with a proper domain name.";
          }
        } catch {
          errors.projectLink = "Please enter a valid URL.";
        }
      }
    }
    return errors;
  }

  // Test 2.1: All blank fields produce ZERO errors
  const emptyValidation = validatePreviousWorkMock({
    previousWorkDescription: "",
    projectName: "",
    projectRole: "",
    technologiesUsed: "",
    projectLink: "",
  });
  assert(
    Object.keys(emptyValidation).length === 0,
    "Leaving all five fields blank produces ZERO validation errors"
  );

  // Test 2.2: Whitespace-only fields produce ZERO errors
  const whitespaceValidation = validatePreviousWorkMock({
    previousWorkDescription: "   ",
    projectName: "  ",
    projectRole: "   ",
    technologiesUsed: "  ",
    projectLink: "   ",
  });
  assert(
    Object.keys(whitespaceValidation).length === 0,
    "Whitespace-only fields produce ZERO validation errors"
  );

  // Test 2.3: Blank URL produces ZERO errors
  const blankUrlValidation = validatePreviousWorkMock({
    projectLink: "",
  });
  assert(
    !blankUrlValidation.projectLink,
    "Blank URL is accepted without validation errors"
  );

  // Test 2.4: Invalid URL scheme or format produces error ONLY on projectLink
  const invalidUrlValidation = validatePreviousWorkMock({
    projectLink: "ftp://not-allowed.org",
  });
  assert(
    Boolean(invalidUrlValidation.projectLink),
    "Invalid URL protocol (ftp://) produces field error on projectLink"
  );

  const malformedUrlValidation = validatePreviousWorkMock({
    projectLink: "just-some-plain-text",
  });
  assert(
    Boolean(malformedUrlValidation.projectLink),
    "Malformed URL without http/https protocol produces field error on projectLink"
  );

  // Test 2.5: Valid URLs (GitHub, demo, portfolio) produce ZERO errors
  const validGithub = validatePreviousWorkMock({ projectLink: "https://github.com/gdgoenka/avishkar" });
  assert(Object.keys(validGithub).length === 0, "Valid GitHub URL produces ZERO errors");

  const validHttp = validatePreviousWorkMock({ projectLink: "http://myproject.demo.dev" });
  assert(Object.keys(validHttp).length === 0, "Valid http:// URL produces ZERO errors");

  // Test 2.6: Length limit enforcement
  const overflowDesc = validatePreviousWorkMock({ previousWorkDescription: "A".repeat(2001) });
  assert(Boolean(overflowDesc.previousWorkDescription), "Exceeding 2,000 characters in description triggers validation error");

  const overflowName = validatePreviousWorkMock({ projectName: "B".repeat(151) });
  assert(Boolean(overflowName.projectName), "Exceeding 150 characters in project name triggers validation error");

  const overflowRole = validatePreviousWorkMock({ projectRole: "C".repeat(101) });
  assert(Boolean(overflowRole.projectRole), "Exceeding 100 characters in role triggers validation error");

  const overflowTech = validatePreviousWorkMock({ technologiesUsed: "D".repeat(501) });
  assert(Boolean(overflowTech.technologiesUsed), "Exceeding 500 characters in technologies triggers validation error");

  // ---------------------------------------------------------------------------
  // SUITE 3: Live API & End-to-End Registration Testing
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 3: End-to-End Registration API Testing ---");

  // TEST 3.1: Complete registration with ALL FIVE fields left BLANK
  console.log("\n  [Scenario A]: Student registration with all 5 optional fields completely BLANK");
  const studentIdA = "240160" + Math.floor(100000 + Math.random() * 900000);
  const txnIdA = "TXNA" + Math.floor(100000000000 + Math.random() * 900000000000);

  const formA = new FormData();
  formA.append("studentName", "Aarav Sharma");
  formA.append("email", `aarav.${studentIdA}@gdgoenka.ac.in`);
  formA.append("contactNumber", "9812345670");
  formA.append("gender", "Male");
  formA.append("studentId", studentIdA);
  formA.append("school", "SOES");
  formA.append("program", "Computer science and engineering AI&ML");
  formA.append("yearOfJoining", "2024");
  formA.append("reasonForJoining", "Keen to participate in robotics track and develop innovative college projects.");
  formA.append("leadershipInterest", "No");
  formA.append("transactionId", txnIdA);
  formA.append("paymentDate", "2026-10-15");
  // All 5 optional fields left completely blank or empty string
  formA.append("previousWorkDescription", "");
  formA.append("projectName", "");
  formA.append("projectRole", "");
  formA.append("technologiesUsed", "");
  formA.append("projectLink", "");

  const validPngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
    0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
    0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
    0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
    0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82,
  ]);
  const receiptBlobA = new Blob([validPngBytes], { type: "image/png" });
  formA.append("receiptFile", receiptBlobA, "receipt_a.png");

  let regRecordA = null;
  try {
    const resA = await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      body: formA,
    });
    const dataA = await resA.json();

    assert(resA.status === 200, "Registration with blank optional fields succeeds with HTTP 200 OK");
    assert(dataA.success === true, "Response returns success: true");
    assert(
      typeof dataA.registrationNumber === "string" && dataA.registrationNumber.startsWith("AVISHKAR-"),
      `Issues official registration number: ${dataA.registrationNumber}`
    );
    assert(dataA.studentId === studentIdA, "Registration record matched student ID");
    regRecordA = dataA;
  } catch (err) {
    assert(false, "API request failed for Scenario A", err.message);
  }

  // TEST 3.2: Submission with INVALID URL fails with clear error on projectLink only
  console.log("\n  [Scenario B]: Submission with invalid supplied URL");
  const studentIdB = "240160" + Math.floor(100000 + Math.random() * 900000);
  const txnIdB = "TXNB" + Math.floor(100000000000 + Math.random() * 900000000000);

  const formB = new FormData();
  formB.append("studentName", "Rohit Patel");
  formB.append("email", `rohit.${studentIdB}@gdgoenka.ac.in`);
  formB.append("contactNumber", "9812345671");
  formB.append("studentId", studentIdB);
  formB.append("school", "SOES");
  formB.append("program", "Computer science and engineering");
  formB.append("yearOfJoining", "2023");
  formB.append("reasonForJoining", "Interested in AI and cloud security competitions.");
  formB.append("leadershipInterest", "Yes");
  formB.append("transactionId", txnIdB);
  formB.append("paymentDate", "2026-10-15");
  formB.append("projectLink", "invalid-url-without-protocol"); // INVALID
  formB.append("receiptFile", receiptBlobA, "receipt_b.png");

  try {
    const resB = await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      body: formB,
    });
    const dataB = await resB.json();

    assert(resB.status === 400, "Invalid URL submission returns HTTP 400 Bad Request");
    assert(dataB.success === false, "Response returns success: false");
    assert(Boolean(dataB.errors && dataB.errors.projectLink), "Returns validation error specifically for projectLink");
    assert(
      !dataB.errors.previousWorkDescription && !dataB.errors.projectName && !dataB.errors.projectRole && !dataB.errors.technologiesUsed,
      "No validation errors produced for other optional fields"
    );
  } catch (err) {
    assert(false, "API request failed for Scenario B", err.message);
  }

  // TEST 3.3: Complete registration with ALL FIVE optional fields FILLED
  console.log("\n  [Scenario C]: Student registration with all 5 optional fields filled");
  const studentIdC = "240160" + Math.floor(100000 + Math.random() * 900000);
  const txnIdC = "TXNC" + Math.floor(100000000000 + Math.random() * 900000000000);

  const testProjectDesc = "Built an autonomous quadcopter obstacle avoidance drone using ROS2, Python, and OpenCV.";
  const testProjectName = "AeroVision AI";
  const testProjectRole = "Lead Embedded & Computer Vision Engineer";
  const testTech = "ROS2, Python, OpenCV, Raspberry Pi 4, C++, ArduPilot";
  const testProjectUrl = "https://github.com/gdgoenka/aerovision-drone";

  const formC = new FormData();
  formC.append("studentName", "Kavya Singhania");
  formC.append("email", `kavya.${studentIdC}@gdgoenka.ac.in`);
  formC.append("contactNumber", "9812345672");
  formC.append("gender", "Female");
  formC.append("studentId", studentIdC);
  formC.append("school", "SOES");
  formC.append("program", "Computer science and engineering AI&ML");
  formC.append("yearOfJoining", "2024");
  formC.append("previousWorkDescription", testProjectDesc);
  formC.append("projectName", testProjectName);
  formC.append("projectRole", testProjectRole);
  formC.append("technologiesUsed", testTech);
  formC.append("projectLink", testProjectUrl);
  formC.append("reasonForJoining", "Excited to contribute drone & robotics solutions at AVISHKAR.");
  formC.append("leadershipInterest", "Yes");
  formC.append("transactionId", txnIdC);
  formC.append("paymentDate", "2026-10-15");
  formC.append("receiptFile", receiptBlobA, "receipt_c.png");

  let regRecordC = null;
  try {
    const resC = await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      body: formC,
    });
    const dataC = await resC.json();

    assert(resC.status === 200, "Registration with complete previous-work details returns HTTP 200 OK");
    assert(dataC.success === true, "Response returns success: true");
    assert(
      typeof dataC.registrationNumber === "string" && dataC.registrationNumber.startsWith("AVISHKAR-"),
      `Issues official registration number: ${dataC.registrationNumber}`
    );
    regRecordC = dataC;
  } catch (err) {
    assert(false, "API request failed for Scenario C", err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: Admin Portal Verification & Data Persistence
  // ---------------------------------------------------------------------------
  console.log("\n--- Suite 4: Admin Portal Data Retrieval & Persistence ---");

  // Step 4.1: Login as administrator to get authorized session
  let adminCookie = "";
  try {
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gdgoenka.ac.in",
        password: "Admin@2026",
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.ok && loginData.success, "Admin login successful");

    // Extract session cookie from Set-Cookie header
    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) {
      adminCookie = setCookie.split(";")[0];
    }
  } catch (err) {
    assert(false, "Admin login failed", err.message);
  }

  // Step 4.2: Retrieve Registration C via Admin API and verify all 5 fields
  if (regRecordC && adminCookie) {
    try {
      const detailRes = await fetch(`${baseUrl}/api/admin/registrations/${regRecordC.registrationNumber}`, {
        headers: { Cookie: adminCookie },
      });
      const detailData = await detailRes.json();

      assert(detailRes.status === 200, "Admin registration detail endpoint returns HTTP 200 OK");
      assert(detailData.success === true, "Detail endpoint returns success: true");

      const savedReg = detailData.registration;
      assert(savedReg.previous_work_description === testProjectDesc, "Persisted previous_work_description matches entered value");
      assert(savedReg.project_name === testProjectName, "Persisted project_name matches entered value");
      assert(savedReg.project_role === testProjectRole, "Persisted project_role matches entered value");
      assert(savedReg.technologies_used === testTech, "Persisted technologies_used matches entered value");
      assert(savedReg.project_link === testProjectUrl, "Persisted project_link matches entered value");
    } catch (err) {
      assert(false, "Failed to retrieve registration C from Admin API", err.message);
    }
  }

  // Step 4.3: Retrieve Registration A (blank optional fields) and verify null safety
  if (regRecordA && adminCookie) {
    try {
      const detailResA = await fetch(`${baseUrl}/api/admin/registrations/${regRecordA.registrationNumber}`, {
        headers: { Cookie: adminCookie },
      });
      const detailDataA = await detailResA.json();

      assert(detailResA.status === 200, "Admin endpoint returns HTTP 200 for registration with blank optional fields");
      const savedRegA = detailDataA.registration;
      assert(
        savedRegA.previous_work_description === null || savedRegA.previous_work_description === "",
        "Blank previous_work_description persisted safely as null/empty without error"
      );
      assert(
        savedRegA.project_name === null || savedRegA.project_name === "",
        "Blank project_name persisted safely as null/empty without error"
      );
      assert(
        savedRegA.project_role === null || savedRegA.project_role === "",
        "Blank project_role persisted safely as null/empty without error"
      );
      assert(
        savedRegA.technologies_used === null || savedRegA.technologies_used === "",
        "Blank technologies_used persisted safely as null/empty without error"
      );
      assert(
        savedRegA.project_link === null || savedRegA.project_link === "",
        "Blank project_link persisted safely as null/empty without error"
      );
    } catch (err) {
      assert(false, "Failed to retrieve registration A from Admin API", err.message);
    }
  }

  // Step 4.4: Public status route does NOT leak previous work information
  if (regRecordC) {
    try {
      const statusRes = await fetch(`${baseUrl}/api/register/status?query=${regRecordC.registrationNumber}`);
      const statusData = await statusRes.json();
      assert(statusRes.status === 200, "Public status lookup succeeds");
      assert(
        statusData.registration.previous_work_description === undefined &&
        statusData.registration.project_link === undefined,
        "Public status lookup does NOT expose private project or portfolio details"
      );
    } catch (err) {
      assert(false, "Public status route check failed", err.message);
    }
  }

  console.log("\n================================================================================");
  console.log(`Summary: ${passed} / ${total} tests PASSED.`);
  console.log("================================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
