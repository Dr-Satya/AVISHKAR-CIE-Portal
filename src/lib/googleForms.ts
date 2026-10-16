import crypto from "crypto";
import { FormField, GoogleFormResponseRecord, GoogleFormsConfigStatus } from "@/types/admin";

export interface CreateGoogleFormOptions {
  title: string;
  description: string;
  fields: FormField[];
}

export interface CreateGoogleFormResult {
  success: boolean;
  formId?: string;
  responderUrl?: string;
  editUrl?: string;
  verified?: boolean;
  error?: string;
  code?: string;
  unsupportedFields?: string[];
}

export interface VerifyGoogleFormResult {
  verified: boolean;
  formId?: string;
  responderUrl?: string;
  editUrl?: string;
  title?: string;
  status?: number;
  error?: string;
  code?: string;
}

export interface SyncResponsesResult {
  success: boolean;
  responses?: GoogleFormResponseRecord[];
  totalSynced?: number;
  newRecordsCount?: number;
  lastSyncAt?: string;
  error?: string;
  code?: string;
}

/**
 * Extracts the form identifier from various Google Forms URL patterns.
 */
export function extractGoogleFormId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();

  // Pattern 1: Encrypted responder URL: /forms/d/e/1FAIpQLS.../viewform
  const encryptedMatch = clean.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (encryptedMatch) return encryptedMatch[1];

  // Pattern 2: Standard form ID: /forms/d/1a2b3c.../(viewform|edit)
  const standardMatch = clean.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  if (standardMatch) return standardMatch[1];

  // Pattern 3: Short link: forms.gle/abcXYZ
  const shortMatch = clean.match(/forms\.gle\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

/**
 * Checks if Google Forms credentials are configured in environment variables.
 * Returns actionable setup instructions if unconfigured.
 */
export function getGoogleFormsConfigStatus(): GoogleFormsConfigStatus {
  // Service Account credentials
  const saEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL;
  const saKey =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY;

  // OAuth2 Refresh Token credentials
  const oauthClientId = process.env.GOOGLE_CLIENT_ID;
  const oauthSecret = process.env.GOOGLE_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const setupInstructions = {
    serviceAccount: [
      "1. Open Google Cloud Console (https://console.cloud.google.com).",
      "2. Enable Google Forms API and Google Drive API.",
      "3. In IAM & Admin > Service Accounts, create a Service Account.",
      "4. Create a JSON key for the Service Account and download it.",
      "5. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local.",
    ],
    oauth2: [
      "1. Create an OAuth 2.0 Client ID (Web Application) in Google Cloud Console.",
      "2. Authorize redirect URIs and obtain a Refresh Token with scopes: forms.body, forms.responses.readonly, drive.file.",
      "3. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env.local.",
    ],
  };

  if (saEmail && saKey) {
    return {
      isConfigured: true,
      authType: "service_account",
      missingFields: [],
      clientEmail: saEmail,
      setupInstructions,
    };
  }

  if (oauthClientId && oauthSecret && oauthRefreshToken) {
    return {
      isConfigured: true,
      authType: "oauth2",
      missingFields: [],
      setupInstructions,
    };
  }

  const missing: string[] = [];
  if (!saEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!saKey) missing.push("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

  return {
    isConfigured: false,
    authType: "none",
    missingFields: missing,
    error:
      "Google Cloud credentials are not configured in .env.local. To create and sync forms automatically, configure a Google Cloud Service Account or OAuth2 credentials with Google Forms API enabled.",
    setupInstructions,
  };
}

/**
 * Obtains an OAuth2 Access Token for Google APIs using Service Account JWT or Refresh Token.
 */
async function getGoogleAccessToken(): Promise<string> {
  const saEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL;
  let saKey =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY;

  // 1. Service Account Flow
  if (saEmail && saKey) {
    saKey = saKey.replace(/\\n/g, "\n");
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: saEmail,
      scope:
        "https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/forms.responses.readonly https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const b64UrlHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64UrlPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signatureInput = `${b64UrlHeader}.${b64UrlPayload}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(signatureInput);
    const signature = signer.sign(saKey, "base64url");
    const jwtAssertion = `${signatureInput}.${signature}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtAssertion,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Google Service Account token exchange failed (HTTP ${tokenRes.status}): ${errText}`);
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  }

  // 2. OAuth2 Refresh Token Flow
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Google OAuth2 refresh token exchange failed (HTTP ${tokenRes.status}): ${errText}`);
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  }

  throw new Error("No Google authorization credentials available.");
}

/**
 * Live verification of a Google Form URL using a real HTTP request.
 * Confirms whether the responder URL is accessible or returns Google's "does not exist" 404 error.
 */
export async function verifyGoogleFormUrl(url: string): Promise<VerifyGoogleFormResult> {
  if (!url || typeof url !== "string") {
    return {
      verified: false,
      error: "No Google Form URL provided.",
      code: "EMPTY_URL",
    };
  }

  const cleanUrl = url.trim();

  // Validate scheme and domain
  const isGoogleFormsDomain =
    cleanUrl.startsWith("https://docs.google.com/forms/") ||
    cleanUrl.startsWith("https://forms.gle/") ||
    cleanUrl.startsWith("https://forms.google.com/");

  if (!isGoogleFormsDomain) {
    return {
      verified: false,
      error:
        "Invalid Google Form URL format. The URL must start with 'https://docs.google.com/forms/' or 'https://forms.gle/'.",
      code: "INVALID_URL_FORMAT",
    };
  }

  const extractedId = extractGoogleFormId(cleanUrl);
  if (!extractedId) {
    return {
      verified: false,
      error: "Could not extract a valid Google Form ID or shortcode from the provided URL.",
      code: "INVALID_FORM_ID",
    };
  }

  try {
    const res = await fetch(cleanUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const status = res.status;
    const finalUrl = res.url || cleanUrl;

    if (status === 404) {
      return {
        verified: false,
        status: 404,
        error:
          "Google Drive returned 'Sorry, the file you have requested does not exist' (HTTP 404). The form does not exist or was deleted.",
        code: "FORM_NOT_FOUND",
      };
    }

    if (status === 401 || status === 403) {
      return {
        verified: false,
        status,
        error: `Google Form requires organization sign-in or has restricted permissions (HTTP ${status}). Set form sharing to allow public responses.`,
        code: "PERMISSION_DENIED",
      };
    }

    if (status >= 400) {
      return {
        verified: false,
        status,
        error: `Google returned HTTP ${status} when accessing the responder URL.`,
        code: "HTTP_ERROR",
      };
    }

    const html = await res.text();

    // Check Google Drive error indicators in page content
    const isErrorPage =
      html.includes("Sorry, the file you have requested does not exist") ||
      html.includes("Page not found") ||
      html.includes("<title>Google Drive - Page not found</title>");

    if (isErrorPage) {
      return {
        verified: false,
        status: 404,
        error:
          "Google Drive returned 'Sorry, the file you have requested does not exist'. The form ID could not be resolved on Google Drive.",
        code: "FILE_DOES_NOT_EXIST",
      };
    }

    // Extract form title from HTML meta tags or title
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
    let pageTitle = ogTitleMatch ? ogTitleMatch[1] : titleTagMatch ? titleTagMatch[1] : "Google Form";
    pageTitle = pageTitle.replace(/ - Google Forms$/i, "").trim();

    const resolvedFormId = extractGoogleFormId(finalUrl) || extractedId;

    return {
      verified: true,
      formId: resolvedFormId,
      responderUrl: finalUrl,
      editUrl: finalUrl.includes("/viewform") ? finalUrl.replace("/viewform", "/edit") : undefined,
      title: pageTitle,
      status: 200,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error verifying Google Form URL";
    return {
      verified: false,
      error: `Failed to connect to Google to verify responder URL: ${msg}`,
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Retrieves and verifies a form through the authorized Google Forms API.
 */
export async function verifyGoogleFormViaApi(formId: string): Promise<VerifyGoogleFormResult> {
  const configStatus = getGoogleFormsConfigStatus();
  if (!configStatus.isConfigured) {
    return {
      verified: false,
      error:
        "Google Cloud API credentials are not configured. To verify via Google Forms API, configure credentials in .env.local.",
      code: "GOOGLE_NOT_CONFIGURED",
    };
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        verified: false,
        status: res.status,
        error: `Google Forms API returned HTTP ${res.status}: ${errText}`,
        code: "API_LOOKUP_FAILED",
      };
    }

    const metadata = await res.json();
    const responderUrl =
      metadata.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
    const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;

    // Also run live HTTP verification on responder URL
    const liveCheck = await verifyGoogleFormUrl(responderUrl);

    return {
      verified: liveCheck.verified,
      formId: metadata.formId,
      responderUrl,
      editUrl,
      title: metadata.info?.title || "Google Form",
      status: 200,
      error: liveCheck.verified ? undefined : liveCheck.error,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error contacting Google Forms API";
    return {
      verified: false,
      error: msg,
      code: "API_ERROR",
    };
  }
}

/**
 * Creates an actual Google Form via Google Forms API (v1).
 * Never mocks or fabricates IDs. Returns explicit failure if unconfigured.
 */
export async function createRealGoogleForm(
  options: CreateGoogleFormOptions
): Promise<CreateGoogleFormResult> {
  const status = getGoogleFormsConfigStatus();
  if (!status.isConfigured) {
    return {
      success: false,
      error:
        "Google Cloud credentials are not configured in .env.local. Provide GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (or OAuth2 credentials) to create official Google Forms via API.",
      code: "GOOGLE_NOT_CONFIGURED",
    };
  }

  try {
    const accessToken = await getGoogleAccessToken();

    // 1. Initial Form Creation via Google Forms API
    const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        info: {
          title: options.title.trim(),
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return {
        success: false,
        error: `Google Forms API creation failed (HTTP ${createRes.status}): ${err}`,
        code: "FORM_CREATE_FAILED",
      };
    }

    const formMetadata = await createRes.json();
    const formId = formMetadata.formId;
    const responderUrl =
      formMetadata.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
    const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;

    // 2. Prepare batchUpdate requests for questions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requests: any[] = [];
    const unsupportedFields: string[] = [];

    // Form Description update
    if (options.description) {
      requests.push({
        updateFormInfo: {
          info: {
            description: options.description.trim(),
          },
          updateMask: "description",
        },
      });
    }

    // Add each question item
    options.fields.forEach((field, index) => {
      if (field.type === "file") {
        unsupportedFields.push(
          `${field.label} (Google Forms file upload requires Google Workspace domain delegation)`
        );
        requests.push({
          createItem: {
            item: {
              title: `${field.label} (Provide Cloud / Drive URL)`,
              description: field.helpText || "Please paste a shareable Google Drive or Dropbox link.",
              questionItem: {
                question: {
                  required: field.required,
                  textQuestion: {
                    paragraph: false,
                  },
                },
              },
            },
            location: { index },
          },
        });
        return;
      }

      if (field.type === "textarea") {
        requests.push({
          createItem: {
            item: {
              title: field.label,
              description: field.helpText || "",
              questionItem: {
                question: {
                  required: field.required,
                  textQuestion: {
                    paragraph: true,
                  },
                },
              },
            },
            location: { index },
          },
        });
      } else if (field.type === "radio" || field.type === "select") {
        const type = field.type === "select" ? "DROP_DOWN" : "RADIO";
        const optionsList =
          Array.isArray(field.options) && field.options.length > 0
            ? field.options.map((opt) => ({ value: opt }))
            : [{ value: "Yes" }, { value: "No" }];

        requests.push({
          createItem: {
            item: {
              title: field.label,
              description: field.helpText || "",
              questionItem: {
                question: {
                  required: field.required,
                  choiceQuestion: {
                    type,
                    options: optionsList,
                  },
                },
              },
            },
            location: { index },
          },
        });
      } else if (field.type === "checkbox") {
        const optionsList =
          Array.isArray(field.options) && field.options.length > 0
            ? field.options.map((opt) => ({ value: opt }))
            : [{ value: "I agree and acknowledge" }];

        requests.push({
          createItem: {
            item: {
              title: field.label,
              description: field.helpText || "",
              questionItem: {
                question: {
                  required: field.required,
                  choiceQuestion: {
                    type: "CHECKBOX",
                    options: optionsList,
                  },
                },
              },
            },
            location: { index },
          },
        });
      } else if (field.type === "date") {
        requests.push({
          createItem: {
            item: {
              title: field.label,
              description: field.helpText || "",
              questionItem: {
                question: {
                  required: field.required,
                  dateQuestion: {
                    includeTime: false,
                    includeYear: true,
                  },
                },
              },
            },
            location: { index },
          },
        });
      } else {
        // Standard text or number
        requests.push({
          createItem: {
            item: {
              title: field.label,
              description: field.helpText || "",
              questionItem: {
                question: {
                  required: field.required,
                  textQuestion: {
                    paragraph: false,
                  },
                },
              },
            },
            location: { index },
          },
        });
      }
    });

    if (requests.length > 0) {
      const batchRes = await fetch(
        `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            includeFormInResponse: false,
            requests,
          }),
        }
      );

      if (!batchRes.ok) {
        const batchErr = await batchRes.text();
        return {
          success: false,
          formId,
          responderUrl,
          editUrl,
          error: `Google Form container was created, but batchUpdate for questions failed (HTTP ${batchRes.status}): ${batchErr}`,
          code: "BATCH_UPDATE_FAILED",
          unsupportedFields,
        };
      }
    }

    // 3. Best-effort permission update via Drive API to ensure form is accessible to public responders
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${formId}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      });
    } catch {
      // Non-fatal if Drive API permissions endpoint is not enabled
    }

    // 4. Verify responder URL accessibility
    const verification = await verifyGoogleFormUrl(responderUrl);

    return {
      success: true,
      formId,
      responderUrl,
      editUrl,
      verified: verification.verified,
      unsupportedFields: unsupportedFields.length > 0 ? unsupportedFields : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error contacting Google Forms API";
    return {
      success: false,
      error: msg,
      code: "GOOGLE_API_ERROR",
    };
  }
}

/**
 * Synchronizes submitted responses from Google Forms API.
 * Never returns mock responses.
 */
export async function syncGoogleFormResponses(
  formId: string,
  eventId: string,
  eventTitle: string
): Promise<SyncResponsesResult> {
  const status = getGoogleFormsConfigStatus();
  if (!status.isConfigured) {
    return {
      success: false,
      error:
        "Google Forms API credentials are not configured. Configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local to sync responses.",
      code: "GOOGLE_NOT_CONFIGURED",
    };
  }

  try {
    const accessToken = await getGoogleAccessToken();

    // 1. Fetch Form Schema to map questionId -> Question Title
    const schemaRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const questionTitleMap: Record<string, string> = {};
    if (schemaRes.ok) {
      const schemaData = await schemaRes.json();
      if (Array.isArray(schemaData.items)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schemaData.items.forEach((item: any) => {
          if (item.questionItem && item.questionItem.question) {
            const qId = item.questionItem.question.questionId;
            questionTitleMap[qId] = item.title || `Question ${qId}`;
          }
        });
      }
    }

    // 2. Fetch actual submitted responses
    const responsesRes = await fetch(
      `https://forms.googleapis.com/v1/forms/${formId}/responses`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!responsesRes.ok) {
      const err = await responsesRes.text();
      return {
        success: false,
        error: `Failed to fetch responses from Google Forms (HTTP ${responsesRes.status}): ${err}`,
        code: "FETCH_RESPONSES_FAILED",
      };
    }

    const data = await responsesRes.json();
    const rawResponses = Array.isArray(data.responses) ? data.responses : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedResponses: GoogleFormResponseRecord[] = rawResponses.map((r: any) => {
      const respId = r.responseId;
      const submittedAt = r.lastSubmittedTime || r.createTime || new Date().toISOString();
      const answers: Record<string, unknown> = {};
      const rawAnswers: Record<string, unknown> = r.answers || {};

      let studentName = "";
      let studentEmail = "";
      let studentId = "";
      let contactNumber = "";

      if (r.answers) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(r.answers).forEach(([qId, answerObj]: [string, any]) => {
          const qTitle = questionTitleMap[qId] || qId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const textValues = answerObj.textAnswers?.answers?.map((a: any) => a.value) || [];
          const val = textValues.length > 1 ? textValues : textValues[0] || "";

          answers[qTitle] = val;

          const lowerTitle = qTitle.toLowerCase();
          const strVal = String(val).trim();

          if (!studentName && (lowerTitle.includes("name") || lowerTitle.includes("candidate"))) {
            studentName = strVal;
          } else if (!studentEmail && (lowerTitle.includes("email") || lowerTitle.includes("mail"))) {
            studentEmail = strVal;
          } else if (
            !studentId &&
            (lowerTitle.includes("roll") || lowerTitle.includes("enroll") || lowerTitle.includes("student id"))
          ) {
            studentId = strVal;
          } else if (
            !contactNumber &&
            (lowerTitle.includes("phone") || lowerTitle.includes("contact") || lowerTitle.includes("whatsapp"))
          ) {
            contactNumber = strVal;
          }
        });
      }

      return {
        id: `gfr-${eventId}-${respId}`,
        eventId,
        eventTitle,
        googleFormId: formId,
        googleResponseId: respId,
        studentName: studentName || "Participant",
        studentEmail: studentEmail || "N/A",
        studentId: studentId || "N/A",
        contactNumber: contactNumber || "N/A",
        answers,
        rawAnswers,
        submittedAt,
        synchronizedAt: new Date().toISOString(),
      };
    });

    return {
      success: true,
      responses: parsedResponses,
      totalSynced: parsedResponses.length,
      lastSyncAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error contacting Google Forms API";
    return {
      success: false,
      error: msg,
      code: "GOOGLE_API_ERROR",
    };
  }
}
