// tests/test_api_register.mjs
// Node.js script to test /api/register endpoint validation and registration persistence

async function runTests() {
  const baseUrl = (process.env.TEST_BASE_URL || "http://localhost:3000") + "/api/register";
  console.log("Testing POST /api/register against", baseUrl, "...\n");

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

  // Test 1: Validation Failure Enforcement (Missing Required Fields)
  console.log("--- Test 1: Server-Side Validation Failure Enforcement ---");
  const badForm = new FormData();
  badForm.append("studentName", ""); // Invalid: empty
  badForm.append("email", "not-an-email"); // Invalid format
  badForm.append("contactNumber", "123"); // Invalid: not 10-digit Indian phone

  try {
    const res1 = await fetch(baseUrl, {
      method: "POST",
      body: badForm,
    });
    const data1 = await res1.json();
    assert(res1.status === 400, "Invalid submission returns HTTP 400 Bad Request");
    assert(data1.success === false, "Response returns success: false");
    assert(data1.errors && data1.errors.studentName, "Returns field validation error for studentName");
    assert(data1.errors && data1.errors.email, "Returns field validation error for email");
    assert(data1.errors && data1.errors.contactNumber, "Returns field validation error for contactNumber");
  } catch (err) {
    console.error("Test 1 error:", err.message);
    process.exitCode = 1;
  }

  // Test 2: Valid Registration Submission
  console.log("\n--- Test 2: Valid Registration Submission ---");
  const goodForm = new FormData();
  const testStudentId = "240160" + Math.floor(100000 + Math.random() * 900000);
  const testTxId = "TXN" + Math.floor(100000000000 + Math.random() * 900000000000);

  goodForm.append("studentName", "Priya Verma");
  goodForm.append("email", "priya.verma@gdgoenka.ac.in");
  goodForm.append("contactNumber", "9876543210");
  goodForm.append("gender", "Female");
  goodForm.append("studentId", testStudentId);
  goodForm.append("school", "SOES");
  goodForm.append("program", "Computer science and engineering AI&ML");
  goodForm.append("yearOfJoining", "2024");
  goodForm.append("reasonForJoining", "Passionate about autonomous systems and participating in the technical fest.");
  goodForm.append("leadershipInterest", "Yes");
  goodForm.append("transactionId", testTxId);
  goodForm.append("paymentDate", "2026-10-12");

  const mockBlob = new Blob(["mock receipt content image data"], { type: "image/png" });
  goodForm.append("receiptFile", mockBlob, "receipt.png");

  try {
    const res2 = await fetch(baseUrl, {
      method: "POST",
      body: goodForm,
    });
    const data2 = await res2.json();
    assert(res2.status === 200, "Valid submission returns HTTP 200 OK");
    assert(data2.success === true, "Response returns success: true");
    assert(typeof data2.registrationNumber === "string" && data2.registrationNumber.startsWith("AVISHKAR-"), "Assigns official AVISHKAR registration number");
    assert(data2.studentId === testStudentId, "Returns registered student ID");
    assert(data2.paymentStatus === "pending_verification", "Payment status is set to pending_verification");
  } catch (err) {
    console.error("Test 2 error:", err.message);
    process.exitCode = 1;
  }

  console.log(`\nResults: ${passed}/${total} checks passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
