import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import {
  getStoredEvents,
  getStoredPhotos,
  getStoredPhotoById,
  saveStoredPhotos,
  saveStoredPhoto,
  deleteStoredPhoto,
  setStoredEventCoverPhoto,
  updateStoredPhotoCaption,
} from "@/lib/dataStore";
import {
  validateImageBuffer,
  persistPhotoFile,
  deletePhotoFromStorage,
  MAX_BATCH_UPLOAD_COUNT,
} from "@/lib/photoStorage";
import { EventPhotoRecord } from "@/types/admin";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  const photos = getStoredPhotos(eventId || undefined);

  return NextResponse.json({
    success: true,
    photos,
    total: photos.length,
    userRole: auth.session.user.role,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const formData = await req.formData();
    const eventId = (formData.get("eventId") as string)?.trim();

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required to upload event photos." },
        { status: 400 }
      );
    }

    const events = getStoredEvents();
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) {
      return NextResponse.json(
        { success: false, error: `Event with ID '${eventId}' not found.` },
        { status: 404 }
      );
    }

    // Extract all uploaded files (accepts either 'photos' or 'files' field name)
    const fileEntries = [
      ...formData.getAll("photos"),
      ...formData.getAll("files"),
    ] as (File | string)[];
    const files: File[] = fileEntries.filter((f): f is File => typeof f !== "string" && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image files provided for upload.", code: "FILE_EMPTY" },
        { status: 400 }
      );
    }

    if (files.length > MAX_BATCH_UPLOAD_COUNT) {
      return NextResponse.json(
        {
          success: false,
          error: `Batch upload limit exceeded. You can upload up to ${MAX_BATCH_UPLOAD_COUNT} photos per batch.`,
          code: "BATCH_LIMIT_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // Extract captions (can be JSON array, multiple appended 'captions' keys, or individual fields: caption_0, caption_1, etc.)
    let captionsArray: string[] = [];
    const allCaptions = formData.getAll("captions") as string[];
    if (allCaptions.length > 1) {
      captionsArray = allCaptions.map((c) => String(c || "").trim());
    } else if (allCaptions.length === 1 && allCaptions[0]) {
      const raw = allCaptions[0];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          captionsArray = parsed.map((c) => String(c || "").trim());
        } else {
          captionsArray = [raw.trim()];
        }
      } catch {
        captionsArray = [raw.trim()];
      }
    }

    const coverIndexRaw = formData.get("isCoverIndex");
    const specifiedCoverIndex =
      coverIndexRaw !== null && coverIndexRaw !== undefined ? parseInt(String(coverIndexRaw), 10) : -1;

    // Phase 1: Validate ALL files before saving any file (Atomic validation)
    const validatedFilesData: Array<{
      file: File;
      buffer: Buffer;
      detectedMime: string;
      normalizedExt: string;
      caption?: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const validation = validateImageBuffer(buffer, file.name, file.type);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: `Validation error for '${file.name}': ${validation.error}`,
            failedFileName: file.name,
            code: validation.code || "INVALID_FILE",
          },
          { status: 400 }
        );
      }

      // Check caption
      const captionField = (formData.get(`caption_${i}`) as string)?.trim();
      const caption = captionField || (captionsArray[i] ? captionsArray[i].trim() : undefined);

      validatedFilesData.push({
        file,
        buffer,
        detectedMime: validation.detectedMime,
        normalizedExt: validation.normalizedExt,
        caption: caption || undefined,
      });
    }

    // Phase 2: Persist validated files to disk & create records
    const existingPhotos = getStoredPhotos(eventId);
    let currentMaxOrder =
      existingPhotos.length > 0 ? Math.max(...existingPhotos.map((p) => p.displayOrder || 0)) : 0;
    const hasExistingCover = existingPhotos.some((p) => p.isCover);

    const createdRecords: EventPhotoRecord[] = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < validatedFilesData.length; i++) {
      const item = validatedFilesData[i];
      const photoId = `photo-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;

      const saved = await persistPhotoFile({
        buffer: item.buffer,
        eventId,
        photoId,
        normalizedExt: item.normalizedExt,
        detectedMime: item.detectedMime,
      });

      // Cover photo logic:
      // If specifiedCoverIndex matches i, make cover
      // If no existing cover and i === 0, make cover
      const isCover =
        specifiedCoverIndex === i || (!hasExistingCover && i === 0 && specifiedCoverIndex < 0);

      currentMaxOrder++;

      const newRecord: EventPhotoRecord = {
        id: photoId,
        eventId,
        eventTitle: targetEvent.title,
        url: saved.url,
        storagePath: saved.storagePath,
        fileName: item.file.name,
        mimeType: item.detectedMime,
        fileSize: item.buffer.length,
        caption: item.caption,
        isCover,
        displayOrder: currentMaxOrder,
        uploadedBy: `${auth.session.user.fullName || auth.session.user.email} (${auth.session.user.role})`,
        uploadedAt: nowIso,
        updatedAt: nowIso,
      };

      createdRecords.push(newRecord);
    }

    // Atomically persist records to dataStore
    saveStoredPhotos(createdRecords);

    // Audit log
    await logAdminAction({
      action: "EVENT_PHOTO_UPLOADED",
      actor: auth.session.user,
      targetType: "event_photos",
      targetId: eventId,
      metadata: {
        eventId,
        eventTitle: targetEvent.title,
        uploadedCount: createdRecords.length,
        photoIds: createdRecords.map((p) => p.id),
      },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${createdRecords.length} photo${
        createdRecords.length > 1 ? "s" : ""
      } to '${targetEvent.title}'.`,
      photos: createdRecords,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error uploading event photos.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();
    const { photoId, action, caption } = body;

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: "photoId is required." },
        { status: 400 }
      );
    }

    const photo = getStoredPhotoById(photoId);
    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found." },
        { status: 404 }
      );
    }

    if (action === "set_cover" || body.isCover === true) {
      const updated = setStoredEventCoverPhoto(photo.eventId, photoId);

      await logAdminAction({
        action: "EVENT_COVER_PHOTO_SET",
        actor: auth.session.user,
        targetType: "event_photo",
        targetId: photoId,
        metadata: { eventId: photo.eventId, photoId },
        token: auth.session.token,
      });

      return NextResponse.json({
        success: true,
        message: "Cover photo updated successfully.",
        photo: updated,
      });
    }

    if (caption !== undefined) {
      const updated = updateStoredPhotoCaption(photoId, String(caption));

      await logAdminAction({
        action: "EVENT_PHOTO_CAPTION_UPDATED",
        actor: auth.session.user,
        targetType: "event_photo",
        targetId: photoId,
        metadata: { eventId: photo.eventId, photoId, caption },
        token: auth.session.token,
      });

      return NextResponse.json({
        success: true,
        message: "Photo caption updated successfully.",
        photo: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: "No recognized action or field provided." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating photo.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: "photoId parameter is required." },
        { status: 400 }
      );
    }

    const photo = getStoredPhotoById(photoId);
    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found." },
        { status: 404 }
      );
    }

    // 1. Delete file from storage
    if (photo.storagePath) {
      await deletePhotoFromStorage(photo.storagePath);
    }

    // 2. Delete metadata from data store
    const result = deleteStoredPhoto(photoId);

    // 3. Log audit action
    await logAdminAction({
      action: "EVENT_PHOTO_DELETED",
      actor: auth.session.user,
      targetType: "event_photo",
      targetId: photoId,
      metadata: {
        eventId: photo.eventId,
        photoId,
        fileName: photo.fileName,
        storagePath: photo.storagePath,
      },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      message: "Photo permanently deleted from gallery and storage.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting photo.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
