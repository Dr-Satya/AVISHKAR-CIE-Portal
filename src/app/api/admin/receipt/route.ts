import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, getAdminSupabaseConfig, getAuthorizedSupabaseHeaders } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Server-Side Admin Authentication Check
    const session = await getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Admin authorization required to access payment receipts.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const receiptPath = searchParams.get("path")?.trim() || "";

    if (!receiptPath) {
      return NextResponse.json(
        {
          success: false,
          error: "Receipt path parameter is required.",
        },
        { status: 400 }
      );
    }

    // 2. Security validation: prevent path traversal
    if (receiptPath.includes("..") || receiptPath.includes("//")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid receipt path.",
        },
        { status: 400 }
      );
    }

    // Check local disk storage first (for local fallbacks)
    const localFilename = path.basename(receiptPath.replace(/^local:receipts\//, ""));
    const localFilePath = path.join(process.cwd(), ".data", "receipts", localFilename);
    if (fs.existsSync(localFilePath)) {
      const fileBuffer = fs.readFileSync(localFilePath);
      const ext = path.extname(localFilename).toLowerCase();
      const contentType =
        ext === ".pdf"
          ? "application/pdf"
          : ext === ".png"
          ? "image/png"
          : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, no-store, max-age=0",
          "Content-Disposition": "inline",
        },
      });
    }

    // Standardize path to bucket object path
    let objectPath = receiptPath;
    if (!objectPath.startsWith("payment-receipts/")) {
      objectPath = `payment-receipts/${objectPath}`;
    }

    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    // 3. Fetch object from private Supabase Storage bucket
    const storageUrl = `${config.url}/storage/v1/object/${objectPath}`;

    const storageRes = await fetch(storageUrl, {
      method: "GET",
      headers,
    });

    if (!storageRes.ok) {
      // If direct fetch returns 404/403, try signed URL approach
      const signUrl = `${config.url}/storage/v1/object/sign/${objectPath}`;
      const signRes = await fetch(signUrl, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 120 }), // 2 minute short-lived token
      });

      if (signRes.ok) {
        const signData = await signRes.json();
        const signedUrl = `${config.url}/storage/v1${signData.signedURL}`;
        const signedFetch = await fetch(signedUrl);

        if (signedFetch.ok) {
          const contentType = signedFetch.headers.get("content-type") || "image/jpeg";
          const buffer = await signedFetch.arrayBuffer();

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "private, no-store, max-age=0",
              "Content-Disposition": "inline",
            },
          });
        }
      }

      console.error("Storage fetch failed for receipt:", storageRes.status, await storageRes.text());
      return NextResponse.json(
        {
          success: false,
          error: "Receipt not found or inaccessible in private storage.",
        },
        { status: 404 }
      );
    }

    const contentType = storageRes.headers.get("content-type") || "image/jpeg";
    const fileBuffer = await storageRes.arrayBuffer();

    // 4. Return protected receipt strictly to the authenticated admin
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("Secure receipt API error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error retrieving protected payment proof.",
      },
      { status: 500 }
    );
  }
}
