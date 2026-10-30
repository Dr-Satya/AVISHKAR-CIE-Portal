# AVISHKAR-v2 — Local Setup & Development Guide

This guide provides step-by-step instructions for configuring and running the **AVISHKAR-v2** project on your local machine for development, testing, and contribution.

---

## 1. System Prerequisites

Ensure your development environment meets the following software requirements:

| Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.x` | `v20.18.0` LTS or later | `node --version` |
| **npm** | `v9.x` | `v10.x` | `npm --version` |
| **Git** | `v2.30+` | Latest | `git --version` |
| **Operating System** | Any | Windows 10/11, macOS 12+, or Ubuntu 22.04+ | — |

> **Note:** Node.js 20+ LTS is strictly required due to modern ES module support, Web Streams API, and compatibility with the Cloudflare Workers edge runtime simulator.

---

## 2. Cloning the Repository

Clone the official repository from the mentor's organization:

```bash
# Clone via HTTPS
git clone https://github.com/Dr-Satya/AVISHKAR-CIE-Portal.git

# Enter project root directory
cd AVISHKAR-CIE-Portal
```

---

## 3. Installing Dependencies

Install the project dependencies using `npm`:

```bash
npm install
```

This installs:
- **Next.js 16 (App Router)** and **React 19**
- **Vinext** (`@vinext/cloudflare` and `vinext`) for Cloudflare Workers edge bundling
- **Supabase Client** (`@supabase/supabase-js`) for PostgreSQL and Storage
- **Resend SDK** (`resend`) for transactional email delivery
- **Tailwind CSS v4** & **Lucide React** for UI styling and icons
- **Zod** for schema validation

---

## 4. Environment Configuration

Copy the template environment file to create your local `.env.local`:

```bash
# On Linux / macOS / Git Bash:
cp .env.example .env.local

# On Windows PowerShell:
Copy-Item .env.example .env.local
```

### Environment Variable Reference

Edit `.env.local` to match your local or sandbox credentials:

```env
# ==============================================================================
# 1. Supabase Database & Storage Configuration
# ==============================================================================
# Public project URL (Accessible in client bundle)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Public anonymous key (Read operations and public form submissions)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key

# Server-only Service Role Key (Elevated administrative updates & private bucket reads)
# NEVER commit this key or expose it to client code!
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ==============================================================================
# 2. Event & Branding Configuration
# ==============================================================================
NEXT_PUBLIC_APP_NAME="AVISHKAR 2026"
NEXT_PUBLIC_INSTITUTION="GD Goenka University"
NEXT_PUBLIC_REGISTRATION_FEE=500

# ==============================================================================
# 3. Dynamic Form Builder (Groq AI)
# ==============================================================================
# Server-only API key for automated questionnaire generation
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b

# ==============================================================================
# 4. Transactional Email Notifications (Resend)
# ==============================================================================
# Server-only API key from resend.com
RESEND_API_KEY=re_your_resend_api_key

# Active email provider (resend)
EMAIL_PROVIDER=resend

# Sender email address
# - In testing mode without custom domain: onboarding@resend.dev
# - In production with verified domain: cie@gdgoenka.ac.in
EMAIL_FROM=onboarding@resend.dev

# Sandbox recipient email (Your Resend account email)
# In testing mode, all notification emails are securely routed to this address
RESEND_TEST_RECIPIENT_EMAIL=your_resend_account_email@domain.com
```

> **Offline / Local Development:** If `NEXT_PUBLIC_SUPABASE_URL` is omitted or left as dummy values, AVISHKAR-v2 automatically activates its built-in in-memory / local fallback data store (`.data/avishkar_store.json`), allowing frontend and registration UI development without a cloud connection.

---

## 5. Running Development Servers

AVISHKAR-v2 provides two development modes:

### Recommended: Cloudflare Workers Simulation (`Vinext`)
Runs the application with Vite and Vinext simulating the Cloudflare Workers edge environment on **port 3001**:

```bash
npm run dev:vinext
```
- Open `http://localhost:3001` in your browser.
- This closely mirrors the production edge runtime and verifies edge compatibility during development.

### Standard: Next.js App Router Server
Runs standard Next.js development server on **port 3000**:

```bash
npm run dev
```
- Open `http://localhost:3000` in your browser.

---

## 6. Testing & Quality Assurance

AVISHKAR-v2 enforces strict testing standards before code changes can be merged:

### Run Default Test Suite (Unit & Integration)
```bash
npm test
```
*Runs all 73 automated checks covering document upload signatures, approval state machine persistence, preview URLs, registration API payloads, Resend email routing, and QR code generations.*

### Run Granular Test Suites
```bash
# Unit test runner (upload integrity, persistence regression, status sync)
npm run test:unit

# Integration test runner (API endpoints, Resend emails, preview signed URLs)
npm run test:integration

# End-to-end test runner (full registration rehearsal & admin dashboard)
npm run test:e2e

# Run all test runners consecutively
npm run test:all
```

### Static Code Analysis (ESLint)
```bash
npm run lint
```
*Ensures code adheres to Next.js and TypeScript style rules with zero warnings or errors.*

### Production Edge Compilation Check
```bash
npm run build:vinext
```
*Compiles the application with Vite and Vinext to `.cloudflare/output/` to confirm that edge bundling succeeds.*

---

## 7. Common Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `EADDRINUSE: port 3001 already in use` | A previous `dev:vinext` session is still running. | Terminate the existing process or use `npx kill-port 3001`. |
| `400: Could not persist approval to Supabase` | `SUPABASE_SERVICE_ROLE_KEY` is missing in server environment or database table schema mismatch. | Verify `.env.local` contains valid credentials or ensure migrations `008`–`012` have been applied to Supabase. |
| Resend email error: `testing domain cannot send to arbitrary address` | Resend test mode restriction. | Ensure `RESEND_TEST_RECIPIENT_EMAIL` is set in `.env.local` to match your registered Resend account email. |
| Node.js deprecation warning `DEP0190` | Running older test scripts with `shell: true`. | Ensure you are on the latest commit where `tests/unit/index.mjs` uses `stdio: "inherit"` with `shell: false`. |
