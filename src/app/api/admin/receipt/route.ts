import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest, getAdminSupabaseConfig, getAuthorizedSupabaseHeaders } from "@/lib/adminAuth";
import { getStoredDocument } from "@/lib/dataStore";
import { detectBufferMimeType } from "@/lib/fileValidation";

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

    // -------------------------------------------------------------------------
    // TIER 1: In-Memory / Persistent DataStore
    // -------------------------------------------------------------------------
    const storedDoc = getStoredDocument(receiptPath);
    if (storedDoc && storedDoc.dataBase64) {
      const buffer = Buffer.from(storedDoc.dataBase64, "base64");
      const detected = detectBufferMimeType(buffer, storedDoc.fileName);
      if (!detected.isCorruptedOrTruncated && detected.isValidSignature) {
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": detected.mimeType,
            "Content-Length": String(buffer.byteLength),
            "Cache-Control": "private, no-store, max-age=0",
            "Content-Disposition": `inline; filename="${storedDoc.fileName || "receipt"}"`,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    }

    // -------------------------------------------------------------------------
    // TIER 2: Local Disk Storage (.data/receipts)
    // -------------------------------------------------------------------------
    const cleanBasename = path.basename(
      receiptPath.replace(/^(local:(id_cards|receipts)\/|payment-receipts\/|\/)+/, "")
    );
    const localFilePath = path.join(process.cwd(), ".data", "receipts", cleanBasename);
    if (fs.existsSync(localFilePath)) {
      const fileBuffer = fs.readFileSync(localFilePath);
      const detected = detectBufferMimeType(fileBuffer, cleanBasename);
      if (!detected.isCorruptedOrTruncated && detected.isValidSignature) {
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": detected.mimeType,
            "Content-Length": String(fileBuffer.byteLength),
            "Cache-Control": "private, no-store, max-age=0",
            "Content-Disposition": `inline; filename="${cleanBasename}"`,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    }

    // -------------------------------------------------------------------------
    // TIER 3: Private Supabase Storage Bucket ('payment-receipts')
    // -------------------------------------------------------------------------
    const cleanObjectName = receiptPath.replace(
      /^(local:(id_cards|receipts)\/|payment-receipts\/|\/)+/,
      ""
    );
    const objectPath = `payment-receipts/${cleanObjectName}`;

    const config = getAdminSupabaseConfig();
    const headers = getAuthorizedSupabaseHeaders(session.token);

    if (config.isConfigured && cleanObjectName) {
      try {
        // Method A: Authenticated direct endpoint (official for private buckets)
        let storageRes = await fetch(`${config.url}/storage/v1/object/authenticated/${objectPath}`, {
          method: "GET",
          headers,
        });

        // Method B: Fallback to direct object endpoint (if service role or bucket permissions allow)
        if (!storageRes.ok) {
          storageRes = await fetch(`${config.url}/storage/v1/object/${objectPath}`, {
            method: "GET",
            headers,
          });
        }

        if (storageRes.ok) {
          const fileBuffer = await storageRes.arrayBuffer();
          const detected = detectBufferMimeType(fileBuffer, cleanObjectName);

          if (detected.isCorruptedOrTruncated || !detected.isValidSignature) {
            return NextResponse.json(
              {
                success: false,
                error: `Uploaded file in private storage is corrupted or truncated (${fileBuffer.byteLength} bytes). The student must provide a valid document.`,
                code: "FILE_CORRUPTED",
              },
              { status: 422 }
            );
          }

          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": detected.mimeType,
              "Content-Length": String(fileBuffer.byteLength),
              "Cache-Control": "private, no-store, max-age=0",
              "Content-Disposition": `inline; filename="${cleanObjectName}"`,
              "X-Content-Type-Options": "nosniff",
            },
          });
        }

        // Method C: Signed URL approach with short expiration
        const signUrl = `${config.url}/storage/v1/object/sign/${objectPath}`;
        const signRes = await fetch(signUrl, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expiresIn: 120 }),
        });

        if (signRes.ok) {
          const signData = await signRes.json();
          const signedPath = signData.signedURL || signData.signedUrl || "";
          const signedUrl = signedPath.startsWith("http")
            ? signedPath
            : signedPath.startsWith("/storage/v1")
            ? `${config.url}${signedPath}`
            : `${config.url}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;

          const signedFetch = await fetch(signedUrl);

          if (signedFetch.ok) {
            const buffer = await signedFetch.arrayBuffer();
            const detected = detectBufferMimeType(buffer, cleanObjectName);

            if (detected.isCorruptedOrTruncated || !detected.isValidSignature) {
              return NextResponse.json(
                {
                  success: false,
                  error: `Uploaded file in private storage is corrupted or truncated (${buffer.byteLength} bytes). The student must provide a valid document.`,
                  code: "FILE_CORRUPTED",
                },
                { status: 422 }
              );
            }

            return new NextResponse(buffer, {
              status: 200,
              headers: {
                "Content-Type": detected.mimeType,
                "Content-Length": String(buffer.byteLength),
                "Cache-Control": "private, no-store, max-age=0",
                "Content-Disposition": `inline; filename="${cleanObjectName}"`,
                "X-Content-Type-Options": "nosniff",
              },
            });
          }
        }
      } catch (storageErr) {
        console.warn("Supabase receipt storage fetch encountered error:", storageErr);
      }
    }

    // -------------------------------------------------------------------------
    // TIER 4: Official Sample/Demo SVG Fallback for Seeded/Demo Records
    // -------------------------------------------------------------------------
    const lowerPath = receiptPath.toLowerCase();
    if (
      lowerPath.includes("demo") ||
      lowerPath.includes("sample") ||
      cleanBasename.startsWith("demo_") ||
      cleanBasename.startsWith("sample_")
    ) {
      const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2" />
  <rect x="0" y="0" width="600" height="70" rx="16" fill="#0A2047" />
  <text x="300" y="42" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">AVISHKAR 2026 — OFFICIAL PAYMENT PROOF</text>
  <rect x="40" y="90" width="520" height="70" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1" />
  <text x="60" y="120" fill="#065F46" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">TRANSACTION AMOUNT</text>
  <text x="60" y="146" fill="#047857" font-family="system-ui, sans-serif" font-size="22" font-weight="bold">₹100.00 (Standard Registration)</text>
  <text x="500" y="132" fill="#059669" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="end">SUCCESSFUL</text>
  <text x="40" y="195" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" font-weight="bold">BENEFICIARY</text>
  <text x="40" y="215" fill="#0F172A" font-family="system-ui, sans-serif" font-size="13" font-weight="600">GD Goenka University (Avishkar 2026)</text>
  <text x="320" y="195" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" font-weight="bold">PAYMENT METHOD</text>
  <text x="320" y="215" fill="#0F172A" font-family="system-ui, sans-serif" font-size="13" font-weight="600">UPI / QR Code Transfer</text>
  <line x1="40" y1="240" x2="560" y2="240" stroke="#E2E8F0" stroke-width="1" />
  <text x="40" y="270" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" font-weight="bold">UPI TRANSACTION REFERENCE (UTR)</text>
  <text x="40" y="295" fill="#0A2047" font-family="monospace" font-size="14" font-weight="bold">UPI/REF/2026/OFFICIAL-PROOF</text>
  <rect x="40" y="325" width="520" height="45" rx="6" fill="#F1F5F9" />
  <text x="300" y="352" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">OFFICIAL FINANCE VERIFICATION SLIP • GD GOENKA UNIVERSITY</text>
</svg>`;

      return new NextResponse(demoSvg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, no-store, max-age=0",
          "Content-Disposition": "inline; filename=\"demo_payment_receipt.svg\"",
        },
      });
    }

    // -------------------------------------------------------------------------
    // FILE NOT FOUND / INACCESSIBLE
    // -------------------------------------------------------------------------
    return NextResponse.json(
      {
        success: false,
        error: "Payment receipt not found or inaccessible in private storage.",
      },
      { status: 404 }
    );
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
