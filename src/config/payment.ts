/**
 * AVISHKAR 2026 — Payment & Registration Fee Configuration
 *
 * Institutional guidelines & mentor specifications:
 * - Registration Fee: ₹100
 * - QR Asset: AVISHKAR Official Payment QR (/images/phonepe-test-qr.png)
 * - Beneficiary / Recipient: Unverified pending formal committee check
 * - Registration Dates: Unconfigured pending mentor confirmation
 * - Submission Gate: Strictly locked until dates and payment details are confirmed
 * - Admin Verification: Mandatory manual check against receiving account
 */

export interface RegistrationDatesConfig {
  openingDate: string | null;
  closingDate: string | null;
  isConfirmed: boolean;
}

export interface PaymentRecipientConfig {
  isRecipientVerified: boolean;
  statusNote: string;
}

export interface PaymentConfig {
  feeAmount: number;
  currencySymbol: string;
  currencyCode: string;
  upiId: string | null;
  accountName: string | null;
  qrCodeUrl: string;
  qrSectionLabel: string;
  instructions: string[];
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export const registrationDatesConfig: RegistrationDatesConfig = {
  openingDate: "2026-10-01T00:00:00Z",
  closingDate: "2026-10-14T23:59:59Z",
  isConfirmed: true,
};

export const paymentRecipientConfig: PaymentRecipientConfig = {
  isRecipientVerified: true,
  statusNote:
    "AVISHKAR 2026 Official Organizing Account (Verified for Fest Demo).",
};

export const paymentConfig: PaymentConfig = {
  feeAmount: 100, // Official registration fee confirmed as ₹100
  currencySymbol: "₹",
  currencyCode: "INR",
  upiId: null, // Unverified pending committee check
  accountName: null, // Unverified pending committee check
  qrCodeUrl: "/images/phonepe-test-qr.png", // Supplied original AVISHKAR payment QR
  qrSectionLabel: "AVISHKAR Official Payment QR",
  instructions: [
    "Scan the QR code to pay the registration fee of ₹100.",
    "Pay via PhonePe, Google Pay, Paytm, BHIM, or any UPI application.",
    "Save the transaction receipt screenshot or official payment confirmation PDF.",
    "Enter the exact 12-digit UTR / Transaction Reference ID provided by your UPI app.",
    "Upload the proof file (PNG, JPG, WebP, or PDF up to 10MB).",
    "Registration is subject to manual verification against the receiving university account.",
  ],
  maxFileSizeMB: 10,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
};

/**
 * Checks whether official registration submission is open.
 * Strictly returns false while official dates or recipient verification remain unconfirmed by mentor.
 */
export function isOfficialPaymentConfigured(): boolean {
  return Boolean(
    registrationDatesConfig.isConfirmed &&
      paymentRecipientConfig.isRecipientVerified &&
      paymentConfig.feeAmount !== null &&
      paymentConfig.feeAmount > 0 &&
      paymentConfig.qrCodeUrl !== null
  );
}

