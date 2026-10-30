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
          error: "Unauthorized: Admin authorization required to access student ID card documents.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const idCardPath = searchParams.get("path")?.trim() || "";

    if (!idCardPath) {
      return NextResponse.json(
        {
          success: false,
          error: "ID card path parameter is required.",
        },
        { status: 400 }
      );
    }

    // 2. Security validation: prevent path traversal attacks
    if (idCardPath.includes("..") || idCardPath.includes("//")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid document path parameter.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // TIER 1: In-Memory / Persistent DataStore (Survives Ephemeral Serverless/Edge)
    // -------------------------------------------------------------------------
    const storedDoc = getStoredDocument(idCardPath);
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
            "Content-Disposition": `inline; filename="${storedDoc.fileName || "student_id_card"}"`,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    }

    const cleanBasename = path.basename(
      idCardPath.replace(/^(local:(id_cards|receipts)\/|student-id-cards\/|\/)+/, "")
    );

    // -------------------------------------------------------------------------
    // TIER 2: Local Disk Storage (.data/id_cards) - Optional Local Fallback
    // -------------------------------------------------------------------------
    try {
      const localFilePath = path.join(process.cwd(), ".data", "id_cards", cleanBasename);
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
    } catch {
      // Local disk unavailable on Cloudflare Workers / serverless edge runtime; fall through to Tier 3
    }

    // -------------------------------------------------------------------------
    // TIER 3: Private Supabase Storage Bucket ('student-id-cards')
    // -------------------------------------------------------------------------
    const cleanObjectName = idCardPath.replace(
      /^(local:(id_cards|receipts)\/|student-id-cards\/|\/)+/,
      ""
    );
    const objectPath = `student-id-cards/${cleanObjectName}`;

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
        console.warn("Supabase storage fetch attempt encountered error:", storageErr);
      }
    }

    // -------------------------------------------------------------------------
    // TIER 4: Official Sample/Demo SVG Fallback for Seeded/Demo Records
    // -------------------------------------------------------------------------
    const lowerPath = idCardPath.toLowerCase();
    if (
      lowerPath.includes("demo") ||
      lowerPath.includes("sample") ||
      cleanBasename.startsWith("demo_") ||
      cleanBasename.startsWith("sample_")
    ) {
      const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A2047" />
      <stop offset="100%" stop-color="#132E57" />
    </linearGradient>
  </defs>
  <rect width="600" height="380" rx="16" fill="url(#cardGrad)" />
  <rect x="12" y="12" width="576" height="356" rx="12" fill="none" stroke="#D4AF37" stroke-width="2" stroke-opacity="0.6" />
  <text x="300" y="48" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">GD GOENKA UNIVERSITY</text>
  <text x="300" y="72" fill="#D4AF37" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="2">OFFICIAL STUDENT IDENTITY CARD</text>
  <line x1="40" y1="88" x2="560" y2="88" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1" />
  <rect x="40" y="110" width="140" height="175" rx="8" fill="#FFFFFF" fill-opacity="0.1" stroke="#D4AF37" stroke-width="1.5" />
  <circle cx="110" cy="170" r="35" fill="#FFFFFF" fill-opacity="0.2" />
  <path d="M70,250 C70,210 150,210 150,250" fill="#FFFFFF" fill-opacity="0.2" />
  <text x="110" y="275" fill="#D4AF37" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="middle">STUDENT PHOTO</text>
  <text x="210" y="130" fill="#D4AF37" font-family="system-ui, sans-serif" font-size="11" font-weight="bold">STUDENT AFFILIATION</text>
  <text x="210" y="152" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">AVISHKAR 2026 DELEGATE</text>
  <text x="210" y="185" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11">INSTITUTION</text>
  <text x="210" y="205" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="600">GD Goenka University, Gurugram</text>
  <text x="210" y="238" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11">DOCUMENT VERIFICATION</text>
  <text x="210" y="258" fill="#10B981" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">✓ Active University Enrollment</text>
  <rect x="40" y="305" width="520" height="40" rx="6" fill="#000000" fill-opacity="0.3" stroke="#FFFFFF" stroke-opacity="0.1" />
  <text x="300" y="330" fill="#D4AF37" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">GDGU • AVISHKAR 2026 • OFFICIAL STUDENT ID</text>
</svg>`;

      return new NextResponse(demoSvg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, no-store, max-age=0",
          "Content-Disposition": "inline; filename=\"demo_student_id.svg\"",
        },
      });
    }

    // -------------------------------------------------------------------------
    // FILE NOT FOUND / INACCESSIBLE
    // -------------------------------------------------------------------------
    return NextResponse.json(
      {
        success: false,
        error: "Student ID card not found or inaccessible in private storage.",
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Secure ID card stream error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error retrieving student ID card document.",
      },
      { status: 500 }
    );
  }
}
