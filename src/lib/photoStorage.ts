import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAdminSupabaseConfig } from "./adminAuth";

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_BATCH_UPLOAD_COUNT = 20;
export const ALLOWED_PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PHOTOS_DATA_DIR = path.join(process.cwd(), ".data", "event-photos");

/**
 * Ensures the persistent event photos directory exists on disk.
 */
export function ensurePhotosDir(): string {
  if (!fs.existsSync(PHOTOS_DATA_DIR)) {
    fs.mkdirSync(PHOTOS_DATA_DIR, { recursive: true });
  }
  return PHOTOS_DATA_DIR;
}

/**
 * Validates file buffer magic bytes, extension, and size limits.
 * Protects against spoofed extensions, script injections, and oversized files.
 */
export function validateImageBuffer(
  buffer: Buffer,
  originalFilename: string,
  declaredMimeType?: string
): { valid: boolean; detectedMime: string; normalizedExt: string; error?: string; code?: "FILE_EMPTY" | "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "CORRUPTED_OR_SPOOFED_IMAGE" } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, detectedMime: "", normalizedExt: "", error: "File content is empty.", code: "FILE_EMPTY" };
  }

  if (declaredMimeType && !declaredMimeType.startsWith("image/") && declaredMimeType !== "application/octet-stream") {
    return {
      valid: false,
      detectedMime: "",
      normalizedExt: "",
      error: `Invalid MIME type '${declaredMimeType}'. Expected an image MIME type.`,
      code: "INVALID_FILE_TYPE",
    };
  }

  if (buffer.length > MAX_PHOTO_SIZE_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      detectedMime: "",
      normalizedExt: "",
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB.`,
      code: "FILE_TOO_LARGE",
    };
  }

  const ext = path.extname(originalFilename).toLowerCase().replace(/^\./, "");
  if (!ALLOWED_PHOTO_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      detectedMime: "",
      normalizedExt: "",
      error: `Unsupported file format '.${ext}'. Supported formats are JPG, JPEG, PNG, and WebP.`,
      code: "INVALID_FILE_TYPE",
    };
  }

  // Magic bytes inspection
  // JPEG: 0xFF, 0xD8, 0xFF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg", normalizedExt: "jpg" };
  }

  // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png", normalizedExt: "png" };
  }

  // WebP: RIFF ... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 && // 'RIFF'
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50 // 'WEBP'
  ) {
    return { valid: true, detectedMime: "image/webp", normalizedExt: "webp" };
  }

  return {
    valid: false,
    detectedMime: "",
    normalizedExt: "",
    error: "Invalid file content: The file signature does not match a valid JPG, PNG, or WebP image.",
    code: "CORRUPTED_OR_SPOOFED_IMAGE",
  };
}

/**
 * Persists an image buffer to object storage / local persistent disk with a cryptographically safe filename.
 */
export async function persistPhotoFile(params: {
  buffer: Buffer;
  eventId: string;
  photoId: string;
  normalizedExt: string;
  detectedMime: string;
}): Promise<{ storagePath: string; localPath: string; url: string }> {
  const { buffer, eventId, photoId, normalizedExt, detectedMime } = params;
  ensurePhotosDir();

  // Generate safe storage filename using eventId, photoId, and random hex salt
  const randomHex = crypto.randomBytes(4).toString("hex");
  const safeFilename = `${eventId}_${photoId}_${randomHex}.${normalizedExt}`;
  const localFilePath = path.join(PHOTOS_DATA_DIR, safeFilename);

  // Write synchronously to disk to guarantee persistence across restarts
  fs.writeFileSync(localFilePath, buffer);

  const storagePath = `local:photos/${safeFilename}`;
  const accessUrl = `/api/photos/${photoId}`;

  // Optional: If Supabase Storage is configured, attempt mirroring to bucket
  const supabaseConfig = getAdminSupabaseConfig();
  if (supabaseConfig.isConfigured) {
    try {
      const uploadUrl = `${supabaseConfig.url}/storage/v1/object/event-photos/${safeFilename}`;
      const bearerKey = supabaseConfig.serviceRoleKey || supabaseConfig.anonKey;
      await fetch(uploadUrl, {
        method: "POST",
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${bearerKey}`,
          "Content-Type": detectedMime,
        },
        body: new Uint8Array(buffer),
      });
    } catch {
      // Local copy is primary and guaranteed; continue smoothly
    }
  }

  return {
    storagePath,
    localPath: localFilePath,
    url: accessUrl,
  };
}

/**
 * Safely resolves the disk path for a stored photo.
 * Prevents path traversal attacks.
 */
export function resolvePhotoDiskPath(storagePath: string): string | null {
  if (!storagePath) return null;

  // Clean and prevent path traversal
  if (storagePath.includes("..") || storagePath.includes("/") && !storagePath.startsWith("local:photos/")) {
    return null;
  }

  const filename = path.basename(storagePath.replace(/^local:photos\//, ""));
  if (!filename) return null;

  const fullPath = path.join(PHOTOS_DATA_DIR, filename);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
}

/**
 * Deletes a stored photo from disk and remote storage.
 */
export async function deletePhotoFromStorage(storagePath: string): Promise<boolean> {
  let deleted = false;

  const diskPath = resolvePhotoDiskPath(storagePath);
  if (diskPath && fs.existsSync(diskPath)) {
    try {
      fs.unlinkSync(diskPath);
      deleted = true;
    } catch (err) {
      console.error("Error unlinking photo from disk:", err);
    }
  }

  // Attempt Supabase deletion if remote exists
  const supabaseConfig = getAdminSupabaseConfig();
  if (supabaseConfig.isConfigured && storagePath) {
    const filename = path.basename(storagePath.replace(/^local:photos\//, ""));
    try {
      const deleteUrl = `${supabaseConfig.url}/storage/v1/object/event-photos/${filename}`;
      const bearerKey = supabaseConfig.serviceRoleKey || supabaseConfig.anonKey;
      await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${bearerKey}`,
        },
      });
    } catch {
      // Ignored
    }
  }

  return deleted;
}
