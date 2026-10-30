import fs from "fs";
import path from "path";

console.log("Running AVISHKAR-v2 Official Payment Section Tests...\n");

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

// 1. Verify QR image exists at expected path without modification
const qrImagePath = path.resolve("public/images/phonepe-test-qr.png");
assert(fs.existsSync(qrImagePath), "public/images/phonepe-test-qr.png exists");

const qrBuf = fs.readFileSync(qrImagePath);
assert(qrBuf.length === 101131, "QR image matches exact provided byte size (101,131 bytes)");
assert(qrBuf.readUInt32BE(16) === 461 && qrBuf.readUInt32BE(20) === 445, "QR image retains original dimensions (461x445)");

// 2. Verify payment.ts configuration
const paymentConfigPath = path.resolve("src/config/payment.ts");
const paymentConfigContent = fs.readFileSync(paymentConfigPath, "utf8");

assert(
  paymentConfigContent.includes("feeAmount: 100"),
  "paymentConfig defines registration fee prominently as 100"
);
assert(
  paymentConfigContent.includes('qrSectionLabel: "AVISHKAR Official Payment QR"'),
  "paymentConfig labels QR section as 'AVISHKAR Official Payment QR'"
);
assert(
  paymentConfigContent.includes('qrCodeUrl: "/images/phonepe-test-qr.png"'),
  "paymentConfig sets qrCodeUrl to the supplied original AVISHKAR payment QR"
);
assert(
  paymentConfigContent.includes("Scan the QR code to pay the registration fee of ₹100."),
  "paymentConfig includes instruction: 'Scan the QR code to pay the registration fee of ₹100.'"
);
assert(
  paymentConfigContent.includes("feeAmount: 100"),
  "Registration fee is configured as ₹100"
);
assert(
  paymentConfigContent.includes("openingDate:") &&
  paymentConfigContent.includes("closingDate:"),
  "Registration opening and closing dates are configured for event schedule"
);
assert(
  !paymentConfigContent.includes("testPaymentQrConfig") &&
  !paymentConfigContent.includes("isTestPaymentQrAllowed"),
  "Removed test QR configuration and test bypass allowances"
);

// 3. Verify PaymentStep.tsx implementation
const paymentStepPath = path.resolve("src/components/registration/PaymentStep.tsx");
const paymentStepContent = fs.readFileSync(paymentStepPath, "utf8");

assert(
  paymentStepContent.includes("paymentConfig.qrSectionLabel"),
  "PaymentStep renders the official QR label: 'AVISHKAR Official Payment QR'"
);
assert(
  paymentStepContent.includes("paymentConfig.feeAmount") &&
  paymentStepContent.includes("₹{paymentConfig.feeAmount}"),
  "PaymentStep displays the registration fee of ₹100 prominently"
);
assert(
  paymentStepContent.includes("Scan the QR code to pay the registration fee of ₹100."),
  "PaymentStep displays the exact instruction: 'Scan the QR code to pay the registration fee of ₹100.'"
);
assert(
  !paymentStepContent.includes("Beneficiary &amp; Recipient Verification Status") &&
  !paymentStepContent.includes("unverified pending formal check"),
  "PaymentStep cleanly removes Beneficiary & Recipient Verification Status panel"
);
assert(
  !paymentStepContent.includes("Official Registration Schedule"),
  "PaymentStep cleanly removes unnecessary Official Registration Schedule card"
);
assert(
  !paymentStepContent.includes("Registration Submissions Currently Locked"),
  "PaymentStep cleanly removes yellow Registration Submissions Currently Locked warning banner"
);
assert(
  !paymentStepContent.includes("Mandatory Admin Verification Protocol"),
  "PaymentStep cleanly removes unnecessary Mandatory Admin Verification Protocol card"
);
assert(
  !paymentStepContent.includes("TEST QR — PERSONAL ACCOUNT") &&
  !paymentStepContent.includes("Temporary Test QR Notice"),
  "PaymentStep has removed test QR banners, test personal account notices, and ₹1 test references"
);

// 4. Verify API pre-launch gate and submission lock in route.ts
const routePath = path.resolve("src/app/api/register/route.ts");
const routeContent = fs.readFileSync(routePath, "utf8");

assert(
  routeContent.includes("!isOfficialPaymentConfigured()") && routeContent.includes("status: 423"),
  "API gate strictly blocks submissions with HTTP 423 while official configuration is pending"
);
assert(
  !routeContent.includes("allowTestSubmission"),
  "API route does not contain any test-submission bypass flags"
);
assert(
  routeContent.includes('payment_status: "pending_verification"'),
  "API strictly inserts payment_status as 'pending_verification' without auto-approval"
);
assert(
  routeContent.includes("payment-receipts/"),
  "Preserves private receipt storage bucket 'payment-receipts'"
);

// 5. Verify RegistrationWizard submit lock
const wizardPath = path.resolve("src/components/registration/RegistrationWizard.tsx");
const wizardContent = fs.readFileSync(wizardPath, "utf8");

assert(
  wizardContent.includes("const isPaymentOpen = isOfficialPaymentConfigured();"),
  "RegistrationWizard strictly relies on isOfficialPaymentConfigured() without test flags"
);
assert(
  !wizardContent.includes("NEXT_PUBLIC_ALLOW_TEST_SUBMISSION"),
  "RegistrationWizard does not contain NEXT_PUBLIC_ALLOW_TEST_SUBMISSION test bypass"
);

console.log(`\n============================================================`);
console.log(`Results: ${passed}/${total} Official Payment Section tests passed.`);
console.log(`============================================================\n`);

if (passed !== total) {
  process.exit(1);
}
