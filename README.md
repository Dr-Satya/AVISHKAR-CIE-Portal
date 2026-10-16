# AVISHKAR 2026 — GD Goenka University
### Official Innovation Fest & Event Management Platform (v2)

AVISHKAR-v2 is a full-stack, enterprise-grade university event management platform engineered specifically for **AVISHKAR 2026** at **GD Goenka University**. Built on Next.js 16 (App Router), TypeScript, and Tailwind CSS, it implements role-based governance across four distinct leadership portals, a student-facing registration and tracking system, dynamic questionnaire builders, resource management, and administrative payment verification.

---

## 🏛️ 1. System Architecture

The application adopts a modular App Router architecture with strict boundary isolation between public visitor workflows and authorized administrative governance:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PUBLIC VISITORS                                 │
│  • Public Homepage (/)             • Event Discovery (/events)              │
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
│  │  • Payment Verification (/admin/payments)                             │  │
│  │  • Resource Repository (/admin/resources)                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    DUAL STORAGE & PERSISTENCE ENGINE                        │
│  Primary Local Store: `.data/avishkar_store.json` (Atomic JSON DB)          │
│  Cloud Fallback: Supabase PostgreSQL & Encrypted Storage Buckets             │
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
| **Inspect System Audit Logs** | ❌ | ❌ | ✅ (Governance) | ✅ | ❌ |
| **Submit Public Registration** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Track Registration Status** | ❌ | ❌ | ❌ | ❌ | ✅ (By Reg ID/Roll)|

---

## ⚡ 3. Local Setup Instructions

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **npm**: v9.x or later
- **Operating System**: Windows, macOS, or Linux

### Quick Start
1. Clone or extract the project:
   ```bash
   cd "C:\Users\tinku\OneDrive\Desktop\AVISHKAR-v2"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the production application:
   ```bash
   npm run build
   ```

4. Start the server (Port 3001 recommended for demonstrations):
   ```bash
   npx next start -p 3001
   ```
   Or in development mode:
   ```bash
   npm run dev -- -p 3001
   ```

5. Access the platform:
   - **Public Portal:** [http://localhost:3001](http://localhost:3001)
   - **Student Registration:** [http://localhost:3001/register](http://localhost:3001/register)
   - **Status Lookup:** [http://localhost:3001/status](http://localhost:3001/status)
   - **Portal Gateway (Admin Login):** [http://localhost:3001/admin/login](http://localhost:3001/admin/login)

---

## 🔑 4. Environment Variables

Create or configure `.env.local` in the project root:

```env
# Optional Supabase Integration (Local JSON store is active as primary)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-service-role-key

# Event Configuration
NEXT_PUBLIC_APP_NAME="AVISHKAR 2026"
NEXT_PUBLIC_INSTITUTION="GD Goenka University"
NEXT_PUBLIC_REGISTRATION_FEE=500
```
> **Security Note:** Service role keys are restricted strictly to server-side route handlers and are never exposed to browser client bundles.

---

## 👥 5. Demo Accounts

The local persistent store includes pre-configured university credentials for live mentor evaluation:

| Role | Official Email | Demo Password | Default Landing Route |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gdgoenka.ac.in` | `Admin@2026` | `/admin/dashboard` |
| **President** | `president@gdgoenka.ac.in` | `President@2026` | `/admin/president` |
| **Vice President** | `vp@gdgoenka.ac.in` | `VP@2026` | `/admin/vice-president` |
| **AVISHKAR Member** | `member@gdgoenka.ac.in` | `Member@2026` | `/admin/member` |

---

## 🗺️ 6. API and Route Overview

### Page Routes
- `/` — Institutional homepage with hero, event tracks, rules, and guidelines.
- `/register` — Multi-step student registration wizard (GD Goenka University specific).
- `/status` — Live student credential & payment verification tracker.
- `/admin/login` — Administrative authentication gateway.
- `/admin/dashboard` — Portal Selection landing hub (President, VP, Member cards).
- `/admin/president/login` — Dedicated Presidential login screen.
- `/admin/president` — Presidential executive approval dashboard with lifecycle stepper.
- `/admin/vice-president/login` — Dedicated Vice Presidential login screen.
- `/admin/vice-president` — Vice Presidential task coordination & blocker tracking board.
- `/admin/member/login` — Dedicated Member login screen.
- `/admin/member` — Member proposal creator, draft editor, and duty checklist.
- `/admin/events` — Admin event publishing and management center.
- `/admin/forms` — Dynamic form builder for published events.
- `/admin/resources` — University media & rulebook download repository.
- `/admin/registrations` — Searchable, filterable student registration roster.
- `/admin/payments` — Admin financial review queue for UPI/PhonePe receipts.

### Server API Endpoints
- `POST /api/admin/auth/login` — Authenticates user, verifies credentials and role match.
- `GET /api/admin/auth/me` — Returns current authenticated session.
- `POST /api/admin/auth/logout` — Revokes session cookies.
- `GET/POST/PATCH /api/admin/events` — Handles proposal drafts, review decisions, and publishing.
- `GET/POST/PATCH /api/admin/tasks` — Vice President task assignment and member progress updates.
- `GET/PATCH /api/admin/notifications` — Notification bell stream and read-state management.
- `GET/POST /api/admin/forms` — Dynamic questionnaire schema editor.
- `GET/POST /api/admin/resources` — Resource uploading and cataloging.
- `GET /api/admin/registrations` — Admin student roster with multi-field search and filters.
- `POST /api/admin/payments/verify` — Admin-only payment approval/rejection.
- `GET /api/admin/audit-logs` — Immutable audit log trail (President & Admin exclusive).
- `POST /api/register` — Student registration submission with automatic ID generation.
- `GET /api/register/status` — Public verification lookup by registration number or student ID.

---

## 💾 7. Storage Architecture

The platform features a **Zero-Dependency Resilient Dual Storage Engine**:

1. **Local Persistent JSON Store (`.data/avishkar_store.json`):**
   - Stores council credentials, event proposals, dynamic forms, tasks, resources, registrations, audit logs, and notifications.
   - Synchronous atomic writes ensure immediate consistency.
   - State survives application restarts and server reboots.
   - Zero external cloud configuration required for local offline demonstrations.

2. **Supabase Cloud Layer (Optional Fallback):**
   - Configured with PostgreSQL schema migrations (`supabase/migrations/`).
   - Private storage bucket `payment-receipts` for secure receipt proofs.
   - Transparently enabled when valid Supabase environment credentials are supplied.

---

## 🧪 8. Test Commands

Run the comprehensive automated test suites using the following PowerShell commands:

```powershell
# Set target server port
$env:TEST_BASE_URL="http://localhost:3001"

# 1. Separate Role Login Portals & RBAC
node tests/test_role_login_portals.mjs

# 2. Mentor Demo 16-Step End-to-End Suite
node tests/test_mentor_demo_e2e.mjs

# 3. Portals Workflow & Cross-Role Security
node tests/test_portals_workflow_rbac.mjs

# 4. Strict Route Separation & RLS Policies
node tests/test_separate_admin_portal_rbac.mjs

# 5. Academic Options & Validation Rules
node tests/test_validation_rules.mjs

# 6. Official Payment QR & PhonePe Integration
node tests/test_phonepe_qr_integration.mjs

# 7. Student Registration API
node tests/test_api_register.mjs

# 8. Full Next.js TypeScript Production Build
npm run build
```

---

## ⚠️ 9. Known Limitations

- **Email Delivery:** Notification alerts and audit entries are generated in-memory and in `.data/avishkar_store.json`. SMTP transmission requires setting up institutional mail exchange credentials.
- **File Upload Storage:** In local demo mode, receipt uploads are stored as secure data URIs and metadata records. In cloud mode, they stream to Supabase private storage.
- **Real-Time WebSockets:** Real-time push updates are polled upon user interactions or route navigation. WebSocket streaming is not enabled to maintain offline resilience.

---

## 📋 10. Repeatable 9-Step Mentor Demonstration Checklist

Follow this exact sequence during a live mentor demonstration:

### Step 1: Admin Login & Portal Selection
1. Navigate to `http://localhost:3001/admin/login`.
2. Enter `admin@gdgoenka.ac.in` / `Admin@2026` and click **Sign In**.
3. Confirm you land on `/admin/dashboard`:
   - No sidebar is present.
   - Compact header reads `AVISHKAR 2026 — Portal Selection`.
   - Exactly three cards are displayed: **President Portal**, **Vice President Portal**, and **Member Portal**.
4. Click **Open Portal** on the **Member Portal** card (navigates to `/admin/member/login`).

### Step 2: Member Submits an Event Proposal
1. Sign in with `member@gdgoenka.ac.in` / `Member@2026`.
2. Confirm arrival at `/admin/member`.
3. Click **+ New Event Proposal**.
4. Enter fictional event details:
   - **Title:** `AI Prompt Engineering Arena`
   - **Category:** `Technical`
   - **Expected Participants:** `60`
   - **Venue:** `Audi A, Block B`
   - **Objectives:** `Test rapid problem-solving with generative AI models.`
5. Click **Submit for President Review**.
6. Observe that the proposal status updates to `Under Review` and displays the shared Event Lifecycle Timeline.
7. Click **Sign Out**.

### Step 3: President Reviews and Approves Proposal
1. Navigate to `/admin/president/login`.
2. Sign in with `president@gdgoenka.ac.in` / `President@2026`.
3. Notice the top banner: **Executive Action Required** highlighting pending proposals.
4. Click **Inspect & Decide** on `AI Prompt Engineering Arena`.
5. Review the proposal details and lifecycle stepper.
6. Click **Approve Proposal**.
7. Confirm status changes to `Approved` (with notification dispatched to VP & Member).
8. Click **Sign Out**.

### Step 4: Vice President Assigns Coordination Task
1. Navigate to `/admin/vice-president/login`.
2. Sign in with `vp@gdgoenka.ac.in` / `VP@2026`.
3. Observe the newly approved event listed under **Active Event Readiness**.
4. In the **Committee Duties & Tasks** section, click **+ Assign Duty**.
5. Create a coordination task:
   - **Duty Title:** `Procure High-Speed WiFi Routers`
   - **Event:** Select `AI Prompt Engineering Arena`
   - **Assignee:** `Aarav Sharma (Member)`
   - **Priority:** `High`
   - **Due Date:** Select tomorrow's date
6. Click **Assign Committee Duty**. Observe task added under `Pending`.
7. Click **Sign Out**.

### Step 5: Member Updates Task Progress
1. Navigate to `/admin/member/login`.
2. Sign in with `member@gdgoenka.ac.in` / `Member@2026`.
3. Check the **Assigned Committee Duties** section.
4. Locate `Procure High-Speed WiFi Routers`.
5. Change status dropdown to **In Progress**, then mark as **Completed**.
6. Verify the task shows green checkmark and completed badge.
7. Click **Sign Out**.

### Step 6: Admin Publishes the Approved Event
1. Navigate to `http://localhost:3001/admin/login` and sign in with `admin@gdgoenka.ac.in` / `Admin@2026`.
2. In the top-right corner, click **Administrative Management Console** or navigate to `/admin/events`.
3. Locate `AI Prompt Engineering Arena` in the events table (Status: `Approved`).
4. Click **Publish Event Track**.
5. Confirm status updates to `Published`.

### Step 7: Student Registers Using Fictional Details
1. Open a new incognito window or tab at `http://localhost:3001/register`.
2. Notice the institutional GD Goenka University banner (no college selector).
3. Fill out the multi-step form:
   - **Step 1 (Personal Info):** Name: `Rohan Gupta`, Email: `rohan.gupta@gdgoenka.ac.in`, Phone: `9876543210`, Gender: `Male`, DOB: `2004-05-15`.
   - **Step 2 (Academic Info):** Roll No: `2023SOES101099`, School: `SOES`, Program: `B.Tech CSE`, Year: `2023`.
   - **Step 3 (Club Engagement):** Reason: `Passionate about AI competitions`, Leadership: `Yes`.
   - **Step 4 (Payment):** UTR: `UPI998877665544`, Payment Date: Today.
4. Click **Submit Registration**.
5. Note the generated Registration ID (e.g., `AVISHKAR-2026-XXXXXX`) and the amber notice: `Pending Financial Verification`.

### Step 8: Admin Verifies Test Payment
1. Return to the Admin portal at `/admin/payments`.
2. Locate `Rohan Gupta` with UTR `UPI998877665544` under **Pending Verification**.
3. Click **Review & Verify**.
4. Inspect student details and click **Approve Payment**.
5. Navigate to the student tracker at `http://localhost:3001/status`.
6. Enter `2023SOES101099` or the Registration ID and click **Check Status**.
7. Observe that the status immediately reflects:
   - **Payment Status:** `Verified` (Green Badge)
   - **Student Status:** `Verified`

### Step 9: Verify Persistence After Server Restart
1. Stop the Next.js server (`Ctrl+C` or kill process).
2. Start the server again: `npx next start -p 3001`.
3. Open `http://localhost:3001/status` and query `2023SOES101099`.
4. Confirm all data, statuses, event tracks, and task progress remain 100% intact from `.data/avishkar_store.json`.
