/**
 * Groq Cloud AI Integration Library — AVISHKAR-v2
 *
 * Provides strictly server-side utilities for communicating with Groq's high-speed API.
 * NEVER exposes the API key to client bundles or in responses.
 */

export const EXPECTED_GROQ_MODEL = "openai/gpt-oss-120b";
export const GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqConfigStatus {
  isConfigured: boolean;
  hasKey: boolean;
  model: string;
  isExpectedModel: boolean;
  serverOnly: boolean;
}

export interface GroqTestResult {
  success: boolean;
  model?: string;
  latencyMs?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  sampleOutput?: string;
  error?: string;
  errorCode?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/**
 * Returns safe metadata about the Groq configuration without exposing credentials.
 * Ensures the check runs exclusively in Node.js server context.
 */
export function getGroqConfigStatus(): GroqConfigStatus {
  const isServer = typeof window === "undefined";
  const apiKey = isServer ? process.env.GROQ_API_KEY?.trim() || "" : "";
  const model = isServer ? process.env.GROQ_MODEL?.trim() || "" : "";

  return {
    isConfigured: Boolean(apiKey && model),
    hasKey: Boolean(apiKey),
    model: model || "not_configured",
    isExpectedModel: model === EXPECTED_GROQ_MODEL,
    serverOnly: isServer,
  };
}

/**
 * Executes a minimal server-side test request to verify connectivity to Groq API.
 * Never prints, logs, or returns the API key.
 */
export async function testGroqConnection(options?: {
  modelOverride?: string;
  testPrompt?: string;
  maxTokens?: number;
}): Promise<GroqTestResult> {
  // 1. Guard server environment
  if (typeof window !== "undefined") {
    return {
      success: false,
      error: "Groq API requests must be executed strictly server-side.",
      errorCode: "CLIENT_EXECUTION_PROHIBITED",
      status: 403,
    };
  }

  // 2. Validate API Key presence
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: "GROQ_API_KEY is not configured in .env.local. Please ensure GROQ_API_KEY is set server-side.",
      errorCode: "GROQ_KEY_MISSING",
      status: 400,
    };
  }

  // 3. Validate Model
  const configuredModel = process.env.GROQ_MODEL?.trim();
  const targetModel = options?.modelOverride?.trim() || configuredModel;

  if (!targetModel) {
    return {
      success: false,
      error: "GROQ_MODEL is not configured in .env.local. Expected model ID 'openai/gpt-oss-120b'.",
      errorCode: "GROQ_MODEL_MISSING",
      status: 400,
    };
  }

  const prompt = options?.testPrompt || "Respond with the single word 'OK' to verify connectivity.";
  const maxTokens = options?.maxTokens || 15;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(GROQ_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // Handle non-200 responses safely with clear categorization
    if (!res.ok) {
      let errorBody: { error?: { message?: string; type?: string } } | null = null;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = { error: { message: res.statusText } };
      }

      const rawMsg: string = errorBody?.error?.message || res.statusText || "Unknown Groq API error";
      const errorType: string = errorBody?.error?.type || "";


      // 401 Unauthorized / Invalid Key
      if (res.status === 401) {
        return {
          success: false,
          error: "Groq API authentication failed. The provided GROQ_API_KEY is invalid or has been revoked.",
          errorCode: "INVALID_API_KEY",
          status: 401,
          latencyMs,
        };
      }

      // 404 Model Not Found / Invalid Model ID
      if (res.status === 404 || rawMsg.toLowerCase().includes("model") || errorType === "invalid_request_error") {
        return {
          success: false,
          error: `Groq model '${targetModel}' was not found or is invalid: ${rawMsg}`,
          errorCode: "INVALID_MODEL_ID",
          status: res.status,
          latencyMs,
        };
      }

      // 429 Rate Limit Exceeded
      if (res.status === 429) {
        return {
          success: false,
          error: `Groq API rate limit exceeded: ${rawMsg}. Please wait before retrying.`,
          errorCode: "RATE_LIMIT_EXCEEDED",
          status: 429,
          latencyMs,
        };
      }

      // 5xx Upstream Server Errors
      if (res.status >= 500) {
        return {
          success: false,
          error: `Groq upstream service error (HTTP ${res.status}): ${rawMsg}`,
          errorCode: "GROQ_UPSTREAM_ERROR",
          status: res.status,
          latencyMs,
        };
      }

      return {
        success: false,
        error: `Groq API returned HTTP ${res.status}: ${rawMsg}`,
        errorCode: "GROQ_API_ERROR",
        status: res.status,
        latencyMs,
      };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning || "";

    return {
      success: true,
      model: data?.model || targetModel,
      latencyMs,
      usage: {
        promptTokens: data?.usage?.prompt_tokens || 0,
        completionTokens: data?.usage?.completion_tokens || 0,
        totalTokens: data?.usage?.total_tokens || 0,
      },
      sampleOutput: content.trim(),
      details: {
        id: data?.id,
        created: data?.created,
        systemFingerprint: data?.system_fingerprint,
      },
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    if (err instanceof Error && err.name === "AbortError") {
      return {
        success: false,
        error: "Groq API request timed out after 15 seconds.",
        errorCode: "TIMEOUT",
        status: 504,
        latencyMs,
      };
    }

    const msg = err instanceof Error ? err.message : "Network error contacting Groq API";
    return {
      success: false,
      error: `Network error connecting to Groq API: ${msg}`,
      errorCode: "NETWORK_ERROR",
      status: 503,
      latencyMs,
    };
  }
}
