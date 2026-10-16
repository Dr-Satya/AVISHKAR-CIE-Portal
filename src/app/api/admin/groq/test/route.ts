import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import { getGroqConfigStatus, testGroqConnection, EXPECTED_GROQ_MODEL } from "@/lib/groq";

/**
 * GET /api/admin/groq/test
 *
 * Verifies the Groq API server configuration and performs a minimal test completion.
 * Never exposes or returns the API key.
 */
export async function GET(req: NextRequest) {
  // Enforce admin authorization in production, allow development test verification
  if (process.env.NODE_ENV === "production") {
    const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
    }
  }

  const config = getGroqConfigStatus();

  // 1. Missing Key Check
  if (!config.hasKey) {
    return NextResponse.json(
      {
        success: false,
        error: "GROQ_API_KEY is not configured in .env.local. Please ensure GROQ_API_KEY is set server-side.",
        code: "GROQ_KEY_MISSING",
        config: {
          model: config.model,
          isConfigured: false,
          serverOnly: true,
        },
      },
      { status: 400 }
    );
  }

  // 2. Missing Model Check
  if (!config.model || config.model === "not_configured") {
    return NextResponse.json(
      {
        success: false,
        error: `GROQ_MODEL is not configured in .env.local. Expected model ID '${EXPECTED_GROQ_MODEL}'.`,
        code: "GROQ_MODEL_MISSING",
        config: {
          hasKey: true,
          isConfigured: false,
          serverOnly: true,
        },
      },
      { status: 400 }
    );
  }

  // 3. Execute minimal test request to Groq API
  const testResult = await testGroqConnection();

  if (!testResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: testResult.error,
        code: testResult.errorCode || "GROQ_TEST_FAILED",
        model: config.model,
        isExpectedModel: config.isExpectedModel,
        latencyMs: testResult.latencyMs,
      },
      { status: testResult.status || 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Groq API connection verified successfully.",
    model: testResult.model,
    expectedModel: EXPECTED_GROQ_MODEL,
    isExpectedModel: config.isExpectedModel,
    latencyMs: testResult.latencyMs,
    usage: testResult.usage,
    serverOnly: true,
  });
}

/**
 * POST /api/admin/groq/test
 *
 * Allows testing with custom prompts or model overrides for validation testing.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { modelOverride, prompt, maxTokens } = body;

    const testResult = await testGroqConnection({
      modelOverride: typeof modelOverride === "string" ? modelOverride : undefined,
      testPrompt: typeof prompt === "string" ? prompt : undefined,
      maxTokens: typeof maxTokens === "number" ? maxTokens : undefined,
    });

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error,
          code: testResult.errorCode || "GROQ_TEST_FAILED",
          status: testResult.status,
          latencyMs: testResult.latencyMs,
        },
        { status: testResult.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Groq API test request succeeded.",
      model: testResult.model,
      sampleOutput: testResult.sampleOutput,
      latencyMs: testResult.latencyMs,
      usage: testResult.usage,
      serverOnly: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing Groq test request";
    return NextResponse.json({ success: false, error: msg, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
