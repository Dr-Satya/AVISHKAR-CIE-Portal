# AVISHKAR 2026 — GD Goenka University
### Official Innovation Fest & Event Management Platform (v2)

AVISHKAR-v2 is an enterprise-grade university event management platform engineered specifically for **AVISHKAR 2026** at **GD Goenka University**. Built on **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and optimized for **Cloudflare Workers** with **Vinext**, it delivers role-based governance across four leadership portals, a multi-step student registration wizard with dual document verification, real-time live verification tracking, dynamic AI questionnaire builders, and automated transactional email notifications.

---

## 🏛️ 1. System Architecture

The platform uses a modular Next.js App Router architecture with strict boundary isolation between public visitor workflows and authorized administrative governance:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PUBLIC VISITORS                                 │
│  • Public Homepage (/)              • Event Discovery (/events)             │
│  • Student Registration (/register) • Live Verification Tracker (/status)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    PORTAL GATEWAY & AUTHENTICATION                          │
│  • Admin Gateway (/admin/login)    • Dedicated Role Logins:                 │
│  • Portal Selection (/admin/dashboard)  ├─ President: /admin/president/login│
│                                         ├─ Vice President: /admin/vp/login  │
│                                         └─ Member: /admin/member/login      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                     ROLE-BASED GOVERNANCE PORTALS                           │
│  ┌───────────────────────┬──────────────────────┬────────────────────────┐  │
│  │   PRESIDENTIAL DESK   │  VP LOGISTICS DESK   │    MEMBER WORKSPACE    │  │
│  │   /admin/president    │ /admin/vice-president│     /admin/member      │  │
│  │  Executive Approvals  │ Task Coordination    │ Proposal Submissions   │  │
│  │  Governance Audit Logs│ Committee Deadlines  │ Assigned Duties & Duty │  │
│  │  Mandatory Feedback   │ Readiness Tracking   │ Blocker Escalation     │  │
│  └───────────────────────┴──────────────────────┴────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ADMINISTRATIVE OPERATIONS                        │  │
│  │  • Event Publishing (/admin/events)     • Dynamic Forms (/admin/forms)│  │
│  │  • Registration Roster (/admin/registrations)                         │  │
│  │  • Payment & Identity Review Queue (/admin/payments)                  │  │
│  │  • Resource Repository (/admin/resources)                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    HYBRID PERSISTENCE & STORAGE ENGINE                      │
│  • Primary Database: Supabase PostgreSQL with Row Level Security (RLS)      │
│  • Private Storage: `student-id-cards` & `payment-receipts` Storage Buckets │
│  • Resilient Offline Fallback: Atomic Local Store (`.data/avishkar_store`)  │
│  • Edge Runtime: Cloudflare Workers with Vinext & KV Cache Integration       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 2. Role and Permission Matrix

| Feature / Action | AVISHKAR Member | Vice President | President | Admin | Public / Student |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Propose Event Track** | ✅ (Draft & Submit) | ❌ | ❌ | ✅ | ❌ |
| **Edit Draft Proposal** | ✅ (Own Only) | ❌ | ❌ | ✅ | ❌ |
| **Approve / Reject Proposals** | ❌ | ❌ | ✅ (Requires reason) | ❌ | ❌ |
| **Coordinate Approved Events** | ❌ | ✅ (Assign Team) | ❌ | ✅ | ❌ |
| **Assign Committee Tasks** | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Update Assigned Task Progress**| ✅ (Assigned Only) | ✅ | ❌ | ✅ | ❌ |
| **Publish Approved Event** | ❌ | ❌ | ❌ | ✅ (Approved Only) | ❌ |
| **Create Dynamic Form Fields** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Upload Official Resources** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **View Student Registrations** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Verify / Reject Student Payments**| ❌ | ❌ | ❌ | ✅ (Admin Exclusive)| ❌ |
| **Verify / Reject Student Identity**| ❌ | ❌ | ❌ | ✅ (Admin Exclusive)| ❌ |
| **Inspect System Audit Logs** | ❌ | ❌ | ✅ (Governance) | ✅ | ❌ |
| **Submit Public Registration** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Track Registration Status** | ❌ | ❌ | ❌ | ❌ | ✅ (By Reg ID/Roll)|

---

## 📋 3. Student Registration & Dual Document Verification

The student registration engine provides a comprehensive, multi-step intake process:

1. **Personal Information**: Full name, email, WhatsApp phone, gender, date of birth.
2. **Academic Information**: GD Goenka University School selection, degree program, graduation year, Roll Number, and optional **Admission Number** (with format validation).
3. **Student ID Card Verification**: Mandatory upload of official university ID card (JPEG, PNG, WEBP, or PDF; up to 5 MB). Uploads stream directly to a strictly private, authenticated Supabase Storage bucket (`student-id-cards`).
4. **Startup & Incubation Engagement**: Track-specific questions capturing venture stage, pitch summary, team composition, and incubation interest.
5. **Payment Verification**: Institutional UPI QR code integration, transaction reference (UTR) capture, payment date, and payment receipt upload (stored in private `payment-receipts` bucket).
6. **Dual-Gate Admin Verification**:
   - Authorized administrators can inspect both documents in high resolution via signed, temporary preview URLs (`/api/admin/id-card` and `/api/admin/receipt`).
   - Separate verification toggles for **Identity** and **Payment**.
   - Registration approval requires **both** identity and payment verification to pass.
   - Rejection requires an explicit administrative reason recorded in the immutable audit trail.

---

## 📧 4. Automated Transactional Email Notifications

The system includes automated email notifications powered by **Resend**:

- **Registration Submitted**: Dispatches confirmation with Registration Number and pending review guidelines immediately upon form submission.
- **Registration Approved**: Dispatches congratulations email with entry pass details and event access instructions when an admin approves both identity and payment.
- **Registration Rejected**: Dispatches formal notification including the specific administrative reason and instructions for re-submission or fee rectification.

### Testing Mode vs. Production Sending
- **Testing Mode (Default)**: Uses `EMAIL_FROM=onboarding@resend.dev`. Per Resend security policies, emails in sandbox mode can only be delivered to the verified email address associated with the Resend account (`RESEND_TEST_RECIPIENT_EMAIL`). Other addresses are safely simulated without breaking the registration flow.
- **Production Mode**: Once a custom sending domain (e.g., `cie@gdgoenka.ac.in`) is verified in the Resend dashboard, update `EMAIL_FROM` to send directly to any student email address.

---

## ⚡ 5. Local Setup & Development

### Prerequisites
- **Node.js**: v20.x or later (v20+ recommended)
- **npm**: v9.x or later
- **Operating System**: Windows, macOS, or Linux

### Installation & Execution Commands

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dr-Satya/AVISHKAR-CIE-Portal.git
   cd AVISHKAR-CIE-Portal
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode (Vinext / Cloudflare Worker simulation):**
   ```bash
   npm run dev:vinext
   ```
   *The server starts at `http://localhost:3001`.*

4. **Run static lint audit:**
   ```bash
   npm run lint
   ```

5. **Run comprehensive automated test suite:**
   ```bash
   npm test
   ```
   *Executes all 6 validation suites (document uploads, preview & approval, dashboard metrics, persistence regressions, API registration, and email notifications).*

6. **Build for production:**
   ```bash
   npm run build:vinext
   ```

7. **Deploy to Cloudflare Workers:**
   ```bash
   npx cf deploy --prebuilt
   ```

---

## 🔑 6. Environment Configuration

Copy `.env.example` to `.env.local` to configure environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Event & Branding Configuration
NEXT_PUBLIC_APP_NAME="AVISHKAR 2026"
NEXT_PUBLIC_INSTITUTION="GD Goenka University"
NEXT_PUBLIC_REGISTRATION_FEE=500

# Groq AI Form Builder (Server-side)
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b

# Resend Transactional Email Notifications (Server-side)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_PROVIDER=resend
EMAIL_FROM=onboarding@resend.dev
# RESEND_TEST_RECIPIENT_EMAIL=your_resend_account_email@domain.com
```

> **Security Note:** Service role keys and API keys must never be exposed to the client bundle. In Cloudflare Workers production, set encrypted secrets using `npx wrangler secret put <SECRET_NAME>`.

---

## 👥 7. Administrative Portals & Role Governance

The platform provides isolated workspaces for institutional leadership:

| Role | Portal Landing Route | Core Capabilities |
| :--- | :--- | :--- |
| **System Admin** | `/admin/dashboard` & `/admin/registrations` | System administration, student & payment verification, event publishing, forms & resource management |
| **President** | `/admin/president` | Executive event proposal approvals/rejections, governance oversight, immutable audit log inspection |
| **Vice President** | `/admin/vice-president` | Event operations, committee duty assignments, blocker escalation, logistics readiness tracking |
| **Member** | `/admin/member` | Track proposal submissions, draft edits, assigned duty checklists |

> 🔒 **Security Best Practice:** In production environments, administrative credentials are authenticated securely via Supabase Auth or configured institutional identity providers. Default development credentials in `.data/avishkar_store.json` should be replaced prior to public launch.

---

## 🗺️ 8. Key API Endpoints

### Student & Public Endpoints
- `POST /api/register` — Student registration submission with admission number, startup details, and dual document upload.
- `GET /api/register/status` — Live status lookup by Registration ID, Roll Number, or Admission Number.

### Administrative Verification & Management
- `GET /api/admin/registrations` — Searchable, filterable student roster with pagination and status filters.
- `GET /api/admin/registrations/[id]` — Detailed registration inspection.
- `GET /api/admin/id-card` — Authenticated, signed URL retrieval for private student ID card preview.
- `GET /api/admin/receipt` — Authenticated, signed URL retrieval for private payment receipt preview.
- `POST /api/admin/students/verify` — Student identity verification toggle.
- `POST /api/admin/payments/verify` — Student payment verification toggle.
- `POST /api/admin/registrations/approve` — Final registration approval (requires both identity and payment verified).
- `POST /api/admin/registrations/reject` — Registration rejection with mandatory audit reason.
- `GET /api/admin/stats` — Real-time registration, verification, and financial summary metrics.
- `GET /api/admin/audit-logs` — Immutable administrative audit log trail.
- `POST /api/admin/notifications/email` — Email notification trigger and delivery management.

---

## 💾 9. Database Migrations

Database schemas and security policies are maintained in `supabase/migrations/`:

| Migration File | Description |
| :--- | :--- |
| `008_operations_readiness_tasks_blockers.sql` | Operations readiness, task coordination, and blocker tables |
| `009_startup_and_incubation_details.sql` | Startup, incubation, and venture track columns |
| `010_add_admission_number.sql` | Admission number column with non-blocking indexing |
| `011_add_student_id_card.sql` | Student ID card metadata and private storage bucket policy |
| `012_student_email_notifications.sql` | Email notification ledger, delivery tracking, and RLS policies |

---

## 🧪 10. Verification and Quality Assurance

The codebase adheres to rigorous testing and build standards:

```bash
# 1. Run all test suites
npm test

# 2. Run ESLint code quality checks
npm run lint

# 3. Verify production compilation
npm run build:vinext
```
