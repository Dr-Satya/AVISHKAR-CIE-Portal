# AVISHKAR-v2 — Production Deployment Guide

This document describes the production deployment pipeline, Cloudflare Workers edge environment configuration, secret management, and verification procedures for **AVISHKAR-v2**.

---

## 1. Hosting Architecture Overview

AVISHKAR-v2 is deployed as a serverless edge application on **Cloudflare Workers** using **Vinext** (`@vinext/cloudflare`):

- **Cloudflare Worker Identifier**: `avishkar-v2`
- **Edge Framework**: Next.js 16 App Router on Vite / Vinext runtime
- **Static Assets Delivery**: Cloudflare Workers `ASSETS` binding with global edge caching
- **Key-Value Cache**: `VINEXT_KV_CACHE` KV namespace binding for fast page and API response caching
- **Database & Storage**: Managed Supabase PostgreSQL instance + private S3-compatible storage buckets

---

## 2. Configuration Files

The deployment pipeline is governed by two central configuration files:

1. **`cloudflare.config.ts`**:
   - Declares the Worker name (`avishkar-v2`), entrypoint, asset manifest, and environment bindings.
   - Configures non-secret environment variables (`EMAIL_PROVIDER="resend"`, `EMAIL_FROM="onboarding@resend.dev"`).
   - Configures KV namespace binding `VINEXT_KV_CACHE`.

2. **`vinext.config.ts`**:
   - Configures the Vinext edge build pipeline, App Router output transformations, and server/client bundle splitting.

---

## 3. Secret Management & Cloudflare Worker Bindings

Sensitive API keys and credentials **must never** be included in configuration files or committed to Git. Instead, they are encrypted and injected into the Cloudflare Worker runtime via Wrangler secrets.

### Required Production Secrets

| Secret Name | Purpose | Setting Command |
| :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative database updates, student verification persistence, and private document bucket access. | `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY` |
| `RESEND_API_KEY` | Transactional email dispatch for registration submissions, approvals, and rejections. | `npx wrangler secret put RESEND_API_KEY` |
| `GROQ_API_KEY` | Groq AI dynamic form generation for administrative questionnaire creation. | `npx wrangler secret put GROQ_API_KEY` |

### Verifying Configured Secrets
To audit which secret names are active in Cloudflare without printing or exposing their values:

```bash
npx wrangler secret list
```

*Expected output lists `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `GROQ_API_KEY` as active encrypted bindings.*

---

## 4. Pre-Deployment Verification Checklist

Before deploying any changes to the production Worker, complete the following mandatory verification steps:

```bash
# Step 1: Execute all unit and integration test suites
npm test

# Step 2: Validate code quality and static typing
npm run lint

# Step 3: Compile production bundle via Vinext
npm run build:vinext

# Step 4: Perform a non-destructive dry-run deployment check
npx cf deploy --prebuilt --dry-run
```

> **IMPORTANT**:
> - If any test fails or `build:vinext` exits with an error, **do not proceed with deployment**.
> - Always use the `--prebuilt` workflow. Do not run generic `wrangler deploy`, as it does not recognize the Vinext asset output directory structure (`.cloudflare/output/`).

---

## 5. Live Production Deployment

Once the pre-deployment checks pass with code 0:

```bash
# Deploy prebuilt bundle to Cloudflare Workers
npx cf deploy --prebuilt
```

### Deployment Execution Output
A successful deployment performs the following:
1. Validates the 140+ static assets in `.cloudflare/output/assets`.
2. Packages the edge worker script (`_worker.js`).
3. Uploads changed static assets to Cloudflare Global CDN.
4. Binds `VINEXT_KV_CACHE`, `ASSETS`, and encrypted secrets.
5. Deploys a new version to the `avishkar-v2` Worker.
6. Emits a deployment confirmation URL and Cloudflare Deployment ID.

---

## 6. Post-Deployment Smoke Testing

Immediately after deployment, perform non-destructive functional smoke tests on the production endpoint:

1. **Public Availability**:
   - Access `https://avishkar.gdgoenka.ac.in` (or the configured Cloudflare Worker URL) and verify homepage rendering.
   - Navigate to `/events` and `/status` to confirm client-side hydration.

2. **Document Upload & Storage**:
   - Access `/register` and verify file upload size guards and client-side mime-type checks.

3. **Admin Verification & Dual Approvals**:
   - Log into `/admin/login` using administrative credentials.
   - Open a pending student registration in the verification modal.
   - Verify that ID card and receipt preview links generate signed URLs without HTTP 500 errors.
   - Confirm identity and payment checkboxes toggle correctly.

4. **Audit Log & Email Service**:
   - Verify that administrative actions appear in `/admin/president` and `/admin/dashboard`.
   - Confirm transactional emails dispatch or simulate according to active testing mode settings.

---

## 7. Rollback & Version Recovery

If an issue is detected in production:

1. **Via Cloudflare Dashboard**:
   - Navigate to **Workers & Pages** > **avishkar-v2** > **Deployments**.
   - Locate the previous stable deployment and click **Rollback to this version**.

2. **Via Wrangler CLI**:
   ```bash
   npx wrangler rollback --message "Reverting to previous stable build"
   ```
