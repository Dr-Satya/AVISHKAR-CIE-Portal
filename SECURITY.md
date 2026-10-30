# Security Policy — AVISHKAR-v2

GD Goenka University and the AVISHKAR Engineering Team are committed to protecting the integrity, confidentiality, and availability of student records, institutional data, and operational services.

This document outlines our security governance, vulnerability disclosure process, and data protection practices.

---

## 1. Supported Versions

Security updates and patches are actively maintained for the following versions:

| Version | Status | Edge Deployment Target | Supported |
| :--- | :--- | :--- | :--- |
| **v2.x** (`main`) | **Active Production** | Cloudflare Worker: `avishkar-v2` | ✅ Yes |
| **v1.x** | Deprecated | Legacy local server | ❌ No |

---

## 2. Reporting Security Vulnerabilities

If you discover a security vulnerability, weakness, or credential exposure in this repository or the live portal, **please do not create a public GitHub issue**.

### Responsible Disclosure Process

1. **Confidential Notification**:
   - Send a confidential email to the project lead and repository owner:
     **Dr. Satya** (`satya@gdgoenka.ac.in` / via institutional GitHub contact).
   - Prefix the email subject with: `[SECURITY AUDIT] AVISHKAR-v2: <Brief Description>`.

2. **Required Report Details**:
   - Detailed description of the vulnerability and attack vector.
   - Exact steps, payloads, or cURL commands to reproduce the issue.
   - Potential impact on student Personally Identifiable Information (PII) or institutional systems.
   - Any suggested mitigations or patches (if identified).

3. **Response Timeline**:
   - **Acknowledgment**: Within 48 hours of initial report receipt.
   - **Triage & Assessment**: Within 3 to 5 business days.
   - **Remediation & Patch Deployment**: Deployed immediately to the production Cloudflare Worker upon verification.
   - **Public Disclosure**: Coordinated after the fix has been fully deployed and verified in production.

---

## 3. Core Security & Privacy Protections

AVISHKAR-v2 enforces multi-layered defense-in-depth principles:

### A. Student Personally Identifiable Information (PII) Protection
- **Document Storage Isolation**: Student identity cards and payment receipts are stored in strictly **private** Supabase Storage buckets (`student-id-cards` and `payment-receipts`). Direct public URL access is permanently disabled.
- **Signed URL Tokenization**: Authorized administrative previews use short-lived (15-minute expiration) signed HMAC tokens that cannot be enumerated by third parties.
- **Sanitized Logging**: Server-side error logs and test runners must never output student names, phone numbers, email addresses, or document binary data.

### B. Secret & Credential Hygiene
- **Zero Client Bundling**: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `GROQ_API_KEY` are strictly server-side variables. Next.js bundling rules prevent client-side exposure.
- **Encrypted Worker Secrets**: In Cloudflare Workers production, secrets are managed exclusively through encrypted Cloudflare Worker secret bindings (`npx wrangler secret put`).
- **Git Shielding**: `.env`, `.env.local`, `.data/`, and database backup files are strictly excluded from source control via `.gitignore`.

### C. Edge Runtime Sandbox Boundaries
- **Isolated V8 Execution**: Code runs in ephemeral, isolated V8 execution contexts without writeable filesystem access, minimizing host-level compromise risks.
- **Input Validation**: Every public and administrative request body is strictly validated against explicit Zod schemas with regex constraints on roll numbers, admission numbers, phone numbers, and payment UTRs.

### D. Immutable Governance Audit Trails
- Every administrative action (student verification, payment confirmation, registration rejection, proposal approval) records an immutable log entry in PostgreSQL containing the administrator identity, action code, timestamp, and justification reason.
