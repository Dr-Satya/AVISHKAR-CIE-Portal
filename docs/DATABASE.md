# AVISHKAR-v2 — Database & Storage Architecture

This document details the PostgreSQL database schema, Supabase Storage buckets, Row Level Security (RLS) policies, and database migration history of the **AVISHKAR-v2** platform.

---

## 1. Database Architecture Overview

AVISHKAR-v2 uses **Supabase PostgreSQL** as its primary production relational database, complemented by an offline-resilient local fallback store (`.data/avishkar_store.json`).

- **Engine**: PostgreSQL 15+ (Hosted on Supabase)
- **Security**: Row Level Security (RLS) enabled on all tables
- **Storage**: S3-compatible private storage buckets for uploaded documents
- **Access Pattern**:
  - Public anonymous client (`anon` key) handles initial registration submission and public status read operations.
  - Server-side administrative client (`service_role` key) handles verification toggles, approvals, rejections, signed document URL generation, and transactional email ledger logging.

---

## 2. Supabase Storage Buckets & Policies

All student-uploaded documents are treated as confidential institutional records and stored in dedicated, non-public Supabase Storage buckets:

| Bucket Name | Access Level | Stored Content | Max File Size | Allowed MIME Types |
| :--- | :--- | :--- | :--- | :--- |
| `student-id-cards` | **Private** | Official GD Goenka University Student ID Cards | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| `payment-receipts` | **Private** | UPI payment transaction receipts / screenshots | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |

### Storage Security & Access Control
1. **Public Direct Access Prohibited**:
   - Both buckets have public listing and direct URL access strictly disabled (`public = false`).
2. **Authenticated Previews**:
   - Administrators preview documents through temporary, time-limited **Signed URLs** generated on demand by server-side endpoints:
     - `/api/admin/id-card?path=<filename>`
     - `/api/admin/receipt?path=<filename>`
   - Signed URLs expire after 15 minutes and cannot be reused by unauthorized third parties.
3. **Upload Policies**:
   - RLS storage policies permit insert operations for registration submissions while preventing unauthorized public deletion or listing.

---

## 3. Relational Schema & Key Tables

### 1. `registrations` Table
The primary repository for student applicant profiles, academic verification, and payment statuses:

| Column Name | Data Type | Constraints / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `TEXT` | `PRIMARY KEY` | Unique registration identifier (e.g., `AVISHKAR-2026-XXXXXX`) |
| `full_name` | `TEXT` | `NOT NULL` | Student's full legal name |
| `email` | `TEXT` | `NOT NULL` | Official or personal contact email address |
| `phone` | `TEXT` | `NOT NULL` | WhatsApp / mobile telephone number |
| `school` | `TEXT` | `NOT NULL` | GD Goenka University School (e.g., SOET, SOM, SOL) |
| `course` | `TEXT` | `NOT NULL` | Degree program (e.g., B.Tech CSE, MBA, BBA) |
| `year` | `TEXT` | `NOT NULL` | Current academic year (e.g., 1st Year, 2nd Year) |
| `roll_number` | `TEXT` | `NOT NULL` | Official university roll number |
| `admission_number`| `TEXT` | `NULLABLE` | University admission number (validated format) |
| `id_card_url` | `TEXT` | `NULLABLE` | Storage path to uploaded ID card in `student-id-cards` |
| `id_card_verified`| `BOOLEAN` | `DEFAULT FALSE` | Identity verification checkbox state |
| `id_card_verified_at`| `TIMESTAMPTZ`| `NULLABLE` | Timestamp of identity verification |
| `id_card_verified_by`| `TEXT` | `NULLABLE` | Administrator ID who verified student identity |
| `utr` | `TEXT` | `NOT NULL` | UPI transaction reference / UTR number |
| `payment_date` | `TEXT` | `NOT NULL` | Date when the registration fee was remitted |
| `payment_receipt_url`| `TEXT`| `NULLABLE` | Storage path to uploaded receipt in `payment-receipts` |
| `payment_verified`| `BOOLEAN` | `DEFAULT FALSE` | Payment verification checkbox state |
| `payment_verified_at`| `TIMESTAMPTZ`| `NULLABLE` | Timestamp of payment receipt verification |
| `payment_verified_by`| `TEXT`| `NULLABLE` | Administrator ID who verified payment |
| `verified` | `BOOLEAN` | `DEFAULT FALSE` | Overall registration verification status |
| `status` | `TEXT` | `DEFAULT 'pending'` | Workflow status (`pending_approval`, `approved`, `rejected`) |
| `rejection_reason`| `TEXT` | `NULLABLE` | Reason recorded if registration was rejected |
| `startup_details` | `JSONB` | `NULLABLE` | Venture stage, pitch summary, and team composition |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Last modification timestamp |

---

### 2. `student_email_notifications` Table
Immutable audit ledger tracking every transactional email event:

| Column Name | Data Type | Constraints / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique notification event ID |
| `registration_id` | `TEXT` | `REFERENCES registrations(id)` | Target student registration ID |
| `recipient_email` | `TEXT` | `NOT NULL` | Destination email address |
| `template_type` | `TEXT` | `NOT NULL` | `registration_received`, `registration_approved`, or `registration_rejected` |
| `status` | `TEXT` | `NOT NULL` | Delivery status (`sent`, `simulated`, `failed`) |
| `provider_id` | `TEXT` | `NULLABLE` | Message ID returned by Resend API |
| `error_message` | `TEXT` | `NULLABLE` | Detailed error description if delivery failed |
| `sent_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp of dispatch |

---

### 3. Governance, Proposals & Operations Tables

- **`event_proposals`**: Captures event tracks proposed by AVISHKAR members, including track name, target capacity, budget, and executive approval state (Presidential Desk).
- **`operations_tasks`**: Manages committee work assignments, logistics deadlines, and assigned personnel (VP Logistics Desk).
- **`blockers`**: Escalated operational bottlenecks requiring executive or administrative intervention.
- **`audit_logs`**: System-wide immutable record of administrative actions, status transitions, and credential logins.

---

## 4. Database Migration History

The database evolution is tracked in chronological SQL migration files in `supabase/migrations/`:

| Migration File | Key Features & Changes Introduced |
| :--- | :--- |
| `002_registration_payments.sql` | Initial registration schema, payment capture fields, transaction indexing. |
| `003_add_official_fields.sql` | Added institutional school, degree course, academic year, and phone validation. |
| `004_student_verification.sql` | Introduced `verified`, `verified_at`, and `verified_by` verification columns. |
| `005_admin_portal_rbac.sql` | Implemented Role-Based Access Control (President, VP, Member, Admin) and audit logs. |
| `006_ai_events_google_forms_sync.sql` | Dynamic questionnaire schema and Google Forms sync configuration. |
| `007_event_photo_gallery.sql` | Official event photo gallery metadata and public display ordering. |
| `008_operations_readiness_tasks_blockers.sql` | Operations readiness tasks, committee assignments, and blocker escalation. |
| `009_startup_and_incubation_details.sql` | Venture track fields: startup stage, pitch summary, co-founder details. |
| `010_add_admission_number.sql` | Added `admission_number` with non-blocking index for fast student lookups. |
| `011_add_student_id_card.sql` | Added `id_card_url`, `id_card_verified` flags and private `student-id-cards` bucket policies. |
| `012_student_email_notifications.sql` | Created `student_email_notifications` audit ledger table and delivery indexes. |

---

## 5. Applying Migrations

### Via Supabase CLI (Recommended)
```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Apply pending migrations
npx supabase db push
```

### Via Supabase Web Dashboard
1. Navigate to the **SQL Editor** in your Supabase dashboard.
2. Run the migration scripts in numerical sequence from `002` through `012`.
3. Verify table existence under **Table Editor** and bucket configuration under **Storage**.
