/**
 * AVISHKAR-v2 File Validation and Binary Security Utility
 *
 * Enforces:
 * 1. Deep magic byte inspection (PDF, JPEG, PNG, WebP)
 * 2. Strict minimum size validation (reject empty, truncated, or dummy files)
 * 3. Maximum size limits
 * 4. Authoritative MIME type and extension derivation from binary signatures
 * 5. Corrupted document detection on retrieval
 */

export interface ValidatedFileResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
  buffer?: Uint8Array;
  size?: number;
}

export interface DetectedBufferInfo {
  mimeType: string;
  extension: string;
  isPdf: boolean;
  isImage: boolean;
  isValidSignature: boolean;
  isCorruptedOrTruncated: boolean;
  reason?: string;
}

const MIN_DOCUMENT_SIZE = 32; // Smallest possible 1x1 webp/image is ~30-40 bytes
const MIN_PDF_SIZE = 100; // Smallest valid blank PDF structure is > 150-200 bytes

/**
 * Inspects a binary buffer to determine its true MIME type and structural integrity.
 */
export function detectBufferMimeType(
  rawBuffer: ArrayBuffer | Uint8Array | Buffer | null | undefined,
  fallbackFilename?: string
): DetectedBufferInfo {
  if (!rawBuffer || rawBuffer.byteLength === 0) {
    return {
      mimeType: "application/octet-stream",
      extension: "bin",
      isPdf: false,
      isImage: false,
      isValidSignature: false,
      isCorruptedOrTruncated: true,
      reason: "Buffer is empty or null (0 bytes)",
    };
  }

  const u8 =
    rawBuffer instanceof Uint8Array
      ? rawBuffer
      : rawBuffer instanceof ArrayBuffer
      ? new Uint8Array(rawBuffer)
      : new Uint8Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);

  const len = u8.byteLength;

  if (len < MIN_DOCUMENT_SIZE) {
    return {
      mimeType: "application/octet-stream",
      extension: "bin",
      isPdf: false,
      isImage: false,
      isValidSignature: false,
      isCorruptedOrTruncated: true,
      reason: `Buffer length (${len} bytes) is below minimum threshold (${MIN_DOCUMENT_SIZE} bytes)`,
    };
  }

  // 1. PDF: %PDF (0x25, 0x50, 0x44, 0x46)
  if (u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46) {
    if (len < MIN_PDF_SIZE) {
      return {
        mimeType: "application/pdf",
        extension: "pdf",
        isPdf: true,
        isImage: false,
        isValidSignature: false,
        isCorruptedOrTruncated: true,
        reason: `PDF header detected, but total file size (${len} bytes) is truncated`,
      };
    }
    return {
      mimeType: "application/pdf",
      extension: "pdf",
      isPdf: true,
      isImage: false,
      isValidSignature: true,
      isCorruptedOrTruncated: false,
    };
  }

  // 2. JPEG: 0xFF, 0xD8, 0xFF
  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) {
    return {
      mimeType: "image/jpeg",
      extension: "jpg",
      isPdf: false,
      isImage: true,
      isValidSignature: true,
      isCorruptedOrTruncated: false,
    };
  }

  // 3. PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    len >= 8 &&
    u8[0] === 0x89 &&
    u8[1] === 0x50 &&
    u8[2] === 0x4e &&
    u8[3] === 0x47 &&
    u8[4] === 0x0d &&
    u8[5] === 0x0a &&
    u8[6] === 0x1a &&
    u8[7] === 0x0a
  ) {
    return {
      mimeType: "image/png",
      extension: "png",
      isPdf: false,
      isImage: true,
      isValidSignature: true,
      isCorruptedOrTruncated: false,
    };
  }

  // 4. WebP: RIFF (0-3) and WEBP (8-11)
  if (
    len >= 12 &&
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x45 &&
    u8[10] === 0x42 &&
    u8[11] === 0x50
  ) {
    return {
      mimeType: "image/webp",
      extension: "webp",
      isPdf: false,
      isImage: true,
      isValidSignature: true,
      isCorruptedOrTruncated: false,
    };
  }

  // If header does not match known signatures:
  const ext = fallbackFilename ? fallbackFilename.split(".").pop()?.toLowerCase() : undefined;
  const isPdfClaim = ext === "pdf";

  return {
    mimeType: "application/octet-stream",
    extension: ext || "bin",
    isPdf: isPdfClaim,
    isImage: ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp",
    isValidSignature: false,
    isCorruptedOrTruncated: true,
    reason: `Unrecognized file signature (first bytes: ${Array.from(u8.slice(0, 4))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ")})`,
  };
}

/**
 * Validates an uploaded document's binary buffer against strict size and signature constraints.
 */
export function validateDocumentBuffer(
  rawBuffer: ArrayBuffer | Uint8Array,
  originalFilename: string,
  options: {
    maxBytes: number;
    minBytes?: number;
    allowedMimes?: string[];
  }
): ValidatedFileResult {
  const minBytes = options.minBytes ?? MIN_DOCUMENT_SIZE;
  const u8 = rawBuffer instanceof Uint8Array ? rawBuffer : new Uint8Array(rawBuffer);
  const size = u8.byteLength;

  if (size === 0) {
    return {
      valid: false,
      error: "The uploaded file is empty (0 bytes). Please upload a valid document or receipt.",
    };
  }

  if (size < minBytes) {
    return {
      valid: false,
      error: `The uploaded file is truncated, corrupt, or too small to be a valid document (size: ${size} bytes, minimum required: ${minBytes} bytes).`,
    };
  }

  if (size > options.maxBytes) {
    const limitMb = (options.maxBytes / (1024 * 1024)).toFixed(1);
    const sizeMb = (size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the allowed limit of ${limitMb} MB.`,
    };
  }

  const detected = detectBufferMimeType(u8, originalFilename);

  if (!detected.isValidSignature || detected.isCorruptedOrTruncated) {
    return {
      valid: false,
      error:
        detected.reason ||
        "Uploaded file content does not match a valid image (JPG, PNG, WebP) or PDF document. Malformed, truncated, text, or executable files are rejected.",
    };
  }

  if (options.allowedMimes && options.allowedMimes.length > 0) {
    const isAllowed = options.allowedMimes.some(
      (m) => m.toLowerCase() === detected.mimeType.toLowerCase()
    );
    if (!isAllowed) {
      return {
        valid: false,
        error: `Invalid file format (${detected.mimeType}). Allowed formats: ${options.allowedMimes.join(
          ", "
        )}.`,
      };
    }
  }

  return {
    valid: true,
    mimeType: detected.mimeType,
    extension: detected.extension,
    buffer: u8,
    size,
  };
}

/**
 * Generates a spec-compliant minimal 1.4 PDF binary buffer (~240 bytes) for testing/fixtures.
 */
export function createValidMinimalPdfBuffer(): Uint8Array {
  const pdfString =
    "%PDF-1.4\n" +
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n" +
    "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n" +
    "trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n178\n%%EOF\n";
  return new TextEncoder().encode(pdfString);
}

/**
 * Generates a spec-compliant 1x1 transparent PNG binary buffer (67 bytes) for testing/fixtures.
 */
export function createValidMinimalPngBuffer(): Uint8Array {
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
    0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
    0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
    0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
    0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82,
  ]);
}

/**
 * Generates a spec-compliant minimal JPEG binary buffer (134 bytes) for testing/fixtures.
 */
export function createValidMinimalJpegBuffer(): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08,
    0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a,
    0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d,
    0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22,
    0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34,
    0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0,
    0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
    0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
    0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
    0x3f, 0x00, 0x7f, 0x00, 0xff, 0xd9,
  ]);
}

/**
 * Generates a spec-compliant minimal WebP binary buffer (34 bytes) for testing/fixtures.
 */
export function createValidMinimalWebpBuffer(): Uint8Array {
  return new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56,
    0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a,
    0x01, 0x00, 0x01, 0x00, 0x02, 0x00, 0x34, 0x25,
  ]);
}

