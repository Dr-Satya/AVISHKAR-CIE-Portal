# AVISHKAR-v2 — System Architecture

This document details the architectural design, component topology, runtime environment, data persistence strategy, and security model of the **AVISHKAR-v2** Innovation Fest & Event Management Platform for **GD Goenka University**.

---

## 1. High-Level Architecture Overview

AVISHKAR-v2 is designed as an enterprise-grade university event management platform built on **Next.js 16 (App Router)** and **React 19**, compiled and deployed to the **Cloudflare Workers** edge network using **Vinext** (`@vinext/cloudflare`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PUBLIC CLIENTS                                  │
│  • Public Portal (/)                • Event Discovery (/events)             │
│  • Student Registration (/register) • Live Verification Tracker (/status)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / Web Standards
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                  CLOUDFLARE WORKERS EDGE RUNTIME (Vinext)                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Next.js 16 App Router                          │  │
│  │  • Server Components (SSR)       • Client Components (Interactive)    │  │
│  │  • Edge API Route Handlers       • Route Middlewares & Guards         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────┬─────────────────────────────────────────┐  │
│  │     Static Assets (CDN)     │            KV Cache Storage             │  │
│  │     Cloudflare Worker ASSETS│            VINEXT_KV_CACHE              │  │
│  └─────────────────────────────┴─────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Signed REST / Supabase Client
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    HYBRID PERSISTENCE & STORAGE ENGINE                      │
│  ┌─────────────────────────────────┬─────────────────────────────────────┐  │
│  │      Supabase PostgreSQL        │       Supabase Private Storage      │  │
│  │   • Registrations & Metadata    │   • `student-id-cards` (Private)    │  │
│  │   • Audit Logs & Approvals      │   • `payment-receipts` (Private)    │  │
│  │   • Email Notification Ledger   │   • Signed URL Tokenization         │  │
│  │   • Row-Level Security (RLS)    │                                     │  │
│  └─────────────────────────────────┴─────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                 Resilient Fallback Data Engine                        │  │
│  │   • In-Memory Cache & Atomic Store (`.data/avishkar_store.json`)     │  │
│  │   • Fallthrough Protection for Offline / Sandbox Scenarios            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS REST API
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                          EXTERNAL CLOUD SERVICES                            │
│  • Resend API (Transactional Email Notifications: Pending, Approved, Reject)│
│  • Groq AI API (Dynamic Form Generation & Schema Construction)              │
│  • University Identity Providers (Institutional Roll/Admission Verification) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Modular Separation

The codebase follows a strict separation of concerns across presentation, domain logic, storage, and testing:

```
AVISHKAR-v2/
├── .github/                       # GitHub collaboration, workflows & issue templates
│   ├── ISSUE_TEMPLATE/            # Bug report and feature request templates
│   ├── scripts/                   # Label management scripts (PowerShell / Bash)
│   ├── workflows/                 # GitHub Actions CI pipelines
│   ├── CODEOWNERS                 # Code ownership and review governance
│   └── PULL_REQUEST_TEMPLATE.md   # Standard pull request checklist
├── docs/                          # In-depth architectural & operational documentation
│   ├── API.md                     # Complete REST API specification
│   ├── ARCHITECTURE.md            # System architecture (this document)
│   ├── DATABASE.md                # PostgreSQL schemas, migrations & storage policies
│   ├── DEPLOYMENT.md              # Cloudflare Workers & Vinext production deployment
│   └── SETUP.md                   # Local setup, environment, and development guide
├── src/
│   ├── app/                       # Next.js 16 App Router (pages and API endpoints)
│   │   ├── (public)/              # Public visitor routes: /, /events, /register, /status
│   │   ├── admin/                 # Role-based governance portals
│   │   │   ├── dashboard/         # System Administrator overview
│   │   │   ├── registrations/     # Student roster, verification & approval modal
│   │   │   ├── payments/          # Payment verification queue
│   │   │   ├── president/         # Presidential approval desk & governance logs
│   │   │   ├── vice-president/    # VP logistics coordination & readiness tracking
│   │   │   ├── member/            # Member event proposals & assigned duty checklists
│   │   │   ├── events/            # Event publishing management
│   │   │   ├── forms/             # Dynamic form builder (Groq AI-assisted)
│   │   │   └── resources/         # University asset & resource repository
│   │   └── api/                   # Server-side API Route Handlers
│   │       ├── admin/             # Authenticated administrative endpoints
│   │       └── register/          # Public registration submission & status tracking
│   ├── components/                # Modular React 19 UI components
│   │   ├── admin/                 # Admin portal cards, tables, modals, and charts
│   │   ├── public/                # Public registration forms, wizard steps, hero
│   │   ├── shared/                # Barrel re-export module for cross-portal components
│   │   └── ui/                    # Base UI primitives (buttons, dialogs, inputs)
│   ├── hooks/                     # Custom React hooks (`useDebounce`, `useMediaQuery`)
│   ├── lib/                       # Domain, business logic, and infrastructure modules
│   │   ├── auth/                  # Administrative authentication & session tokens
│   │   ├── database/              # Supabase PostgreSQL client & dataStore sync
│   │   ├── email/                 # Resend transactional email notification service
│   │   ├── storage/               # Supabase Storage & photo upload helpers
│   │   ├── validation/            # Zod validation schemas & publish verifications
│   │   └── index.ts               # Unified root library barrel index
│   └── styles/                    # Global CSS and institutional design tokens
├── supabase/
│   └── migrations/                # Version-controlled PostgreSQL migrations (008–012)
├── tests/                         # Automated test suites
│   ├── unit/                      # Upload, persistence, and sync unit test runners
│   ├── integration/               # Preview, registration API, email & QR runners
│   └── e2e/                       # Full workflow rehearsal & dashboard tests
├── cloudflare.config.ts           # Cloudflare Workers environment bindings
├── package.json                   # NPM dependencies and project scripts
├── tsconfig.json                  # Strict TypeScript configuration
└── vinext.config.ts               # Vinext edge compilation configuration
```

---

## 3. Edge Runtime Execution Model

AVISHKAR-v2 targets the **Cloudflare Workers edge runtime** via **Vinext**. This imposes specific environmental constraints that the codebase natively satisfies:

1. **V8 Isolated Execution**:
   - The edge runtime executes in lightweight V8 isolates without a Node.js process runtime or writeable local filesystem.
   - All filesystem operations (`fs.existsSync`, `fs.writeFileSync`, `fs.mkdirSync`) are defensively encapsulated in `try...catch` blocks. If executed in an environment without writeable disk access, the system gracefully falls through to the Supabase Storage and PostgreSQL layers.

2. **Standard Web APIs**:
   - Route handlers leverage standard `Request`, `Response`, `Headers`, `FormData`, and `Blob` Web APIs.
   - File uploads stream directly as `ArrayBuffer` into Supabase Storage client instances, avoiding temporary disk persistence.

3. **Asset Delivery**:
   - Static assets (images, CSS, JS bundles) are routed through Cloudflare's global CDN via the `ASSETS` binding.
   - Dynamic API and Server-Side Rendered (SSR) routes are executed at edge locations nearest to the end user.

---

## 4. Role-Based Governance Model

The platform enforces four isolated administrative governance contexts:

| Role Context | Access Path | Core Authority |
| :--- | :--- | :--- |
| **Presidential Desk** | `/admin/president` | Executive approval/rejection of event proposals, formal governance reason requirements, immutable system audit log inspection. |
| **VP Logistics Desk** | `/admin/vice-president` | Logistics readiness tracking, committee task assignment, deadline tracking, blocker resolution. |
| **Member Workspace** | `/admin/member` | Event proposal submission (draft/submit), assigned operational task execution, blocker escalation. |
| **System Admin** | `/admin/dashboard`, `/admin/registrations` | System administration, student identity & payment verification, event publishing, dynamic form generation, resource repository management. |

---

## 5. Dual Document Verification & Registration Lifecycle

```
[ Student Form ]
      │ (Personal + Academic + Track + Documents)
      ▼
[ POST /api/register ] ──► Validate via Zod Schema
      │
      ├── Stream Student ID Card ──► Supabase Storage (`student-id-cards`)
      ├── Stream Payment Receipt ──► Supabase Storage (`payment-receipts`)
      │
      ├── Persist Registration Record (Status: `pending_approval`)
      └── Dispatch Transactional Email (Template: Registration Received)
            │
            ▼
[ Admin Verification Queue: /admin/registrations ]
      │
      ├── Admin previews ID Card (via `/api/admin/id-card` signed URL)
      ├── Admin previews Receipt (via `/api/admin/receipt` signed URL)
      │
      ├── Checkbox 1: Student Identity Verified (`POST /api/admin/students/verify`)
      ├── Checkbox 2: Payment Receipt Verified (`POST /api/admin/payments/verify`)
      │
      ├── IF Approved:
      │     └── `POST /api/admin/registrations/approve`
      │           ├── Status ──► `approved`
      │           ├── Persist Verification Timestamp & Admin ID
      │           └── Dispatch Transactional Email (Template: Registration Approved)
      │
      └── IF Rejected:
            └── `POST /api/admin/registrations/reject`
                  ├── Status ──► `rejected`
                  ├── Record Rejection Reason in Audit Log
                  └── Dispatch Transactional Email (Template: Registration Rejected)
```

---

## 6. Hybrid Data Persistence Strategy

The application employs a layered persistence strategy to guarantee maximum uptime and zero data loss:

1. **Primary Layer: Supabase PostgreSQL (Managed)**:
   - Houses the core relational tables (`registrations`, `student_email_notifications`, `events`, `operations_tasks`, `audit_logs`).
   - Protected by Row Level Security (RLS) policies allowing public submission but restricting document access and state transitions to authenticated administrative service roles.

2. **Binary Layer: Supabase Private Storage**:
   - Distinct, private storage buckets:
     - `student-id-cards`: Stores official university student identity cards.
     - `payment-receipts`: Stores institutional UPI transaction receipts.
   - Public access is disabled; documents are accessed strictly through short-lived signed URLs generated on-demand by authenticated administrative API endpoints.

3. **Fallback Layer: Atomic Local & In-Memory Store**:
   - Implemented in `src/lib/dataStore.ts`.
   - In environments where Supabase credentials are not yet configured or during offline testing, the system transparently utilizes an atomic JSON file store (`.data/avishkar_store.json`) or in-memory map.
   - Ensures CI test suites and developer workstations run cleanly without requiring live database connections.

---

## 7. Security & Compliance Architecture

- **Zero Client Credential Exposure**:
  - `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `GROQ_API_KEY` are strictly server-side environment variables or Cloudflare Worker encrypted secrets.
  - Client bundles only receive public variables prefixed with `NEXT_PUBLIC_`.
- **Student PII Protection**:
  - Student identity cards, roll numbers, admission numbers, phone numbers, and payment receipts are treated as sensitive institutional records.
  - Public status lookups (`/status`) require exact matching of registration identifiers and never disclose raw document URLs.
- **Auditability**:
  - Every administrative action (event proposal approval, student verification, registration rejection) generates an immutable entry in the `audit_logs` table recording timestamp, actor identity, action type, and reason.
