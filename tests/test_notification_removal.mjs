import fs from "fs";
import path from "path";

console.log("Running AVISHKAR-v2 Confirmation and Payment Page Cleanup Tests...\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// 1. Verify SubmissionSuccess.tsx cleanup
const successPath = path.resolve("src/components/registration/SubmissionSuccess.tsx");
const successContent = fs.readFileSync(successPath, "utf8");

assert(
  !successContent.includes("Your payment proof has been stored in private university storage"),
  "SubmissionSuccess cleanly removes the payment proof storage notification text"
);

assert(
  !successContent.includes("ShieldAlert"),
  "SubmissionSuccess removes ShieldAlert warning icon"
);

assert(
  !successContent.includes("bg-amber-50/70 border border-amber-200"),
  "SubmissionSuccess removes yellow notification box styling and borders"
);

assert(
  successContent.includes("Official Registration ID"),
  "SubmissionSuccess preserves Official Registration ID bar"
);

assert(
  successContent.includes("Pending Financial Verification"),
  "SubmissionSuccess preserves Pending Financial Verification badge"
);

assert(
  successContent.includes("Submission Summary"),
  "SubmissionSuccess preserves Submission Summary heading and table"
);

assert(
  successContent.includes("Student Name") &&
  successContent.includes("Student ID / Roll No.") &&
  successContent.includes("Department &amp; School") &&
  successContent.includes("Transaction ID / UTR") &&
  successContent.includes("Payment Date"),
  "SubmissionSuccess preserves all student details, UTR, and payment date"
);

assert(
  successContent.includes("Print Confirmation") &&
  successContent.includes("New Registration") &&
  successContent.includes("Return to Homepage"),
  "SubmissionSuccess preserves all action buttons"
);

// 2. Verify PaymentStep.tsx cleanup
const paymentStepPath = path.resolve("src/components/registration/PaymentStep.tsx");
const paymentStepContent = fs.readFileSync(paymentStepPath, "utf8");

assert(
  !paymentStepContent.includes("Beneficiary &amp; Recipient Verification Status") &&
  !paymentStepContent.includes("unverified pending formal check"),
  "PaymentStep cleanly removes Beneficiary & Recipient Verification Status panel"
);

assert(
  !paymentStepContent.includes("AlertTriangle"),
  "PaymentStep removes AlertTriangle icon"
);

assert(
  paymentStepContent.includes("Scan the QR code to pay the registration fee of ₹500."),
  "PaymentStep preserves exact instruction: 'Scan the QR code to pay the registration fee of ₹500.'"
);

assert(
  paymentStepContent.includes("AVISHKAR Official Payment QR"),
  "PaymentStep preserves 'AVISHKAR Official Payment QR' label"
);

assert(
  paymentStepContent.includes("₹{paymentConfig.feeAmount}"),
  "PaymentStep preserves ₹500 fee display"
);

assert(
  paymentStepContent.includes("Scan with PhonePe, GPay, Paytm, BHIM, or any UPI app"),
  "PaymentStep preserves UPI app guidance"
);

console.log(`\n============================================================`);
console.log(`Results: ${passed}/${total} Cleanup Verification tests passed.`);
console.log(`============================================================\n`);

if (passed !== total) {
  process.exit(1);
}
