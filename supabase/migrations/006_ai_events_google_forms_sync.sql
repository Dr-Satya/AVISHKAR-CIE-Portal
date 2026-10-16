-- ============================================================================
-- AVISHKAR 2026 — Migration 006: AI Event Creation, Google Forms & Student Sync
-- ============================================================================
-- Adds:
--  - Two event workflows support (creation_source: 'admin' vs 'council')
--  - Google Forms integration fields (google_form_id, google_form_url, etc.)
--  - QR code metadata and synchronization telemetry
--  - google_form_responses table with deduplication and RLS security
- ============================================================================

-- 1. Extend events table with Google Forms & Creation Source columns
-ALTER TABLE IF EXISTS public.events
+ADD COLUMN IF NOT EXISTS creation_source VARCHAR(20) NOT NULL DEFAULT 'council' CHECK (creation_source IN ('admin', 'council')),
+ADD COLUMN IF NOT EXISTS google_form_id VARCHAR(255) NULL,
+ADD COLUMN IF NOT EXISTS google_form_url TEXT NULL,
+ADD COLUMN IF NOT EXISTS google_form_edit_url TEXT NULL,
+ADD COLUMN IF NOT EXISTS qr_code_url TEXT NULL,
+ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ NULL,
+ADD COLUMN IF NOT EXISTS last_sync_status VARCHAR(30) NULL DEFAULT 'unconfigured',
+ADD COLUMN IF NOT EXISTS last_sync_error TEXT NULL,
+ADD COLUMN IF NOT EXISTS form_response_count INTEGER NOT NULL DEFAULT 0;

-- 2. Extend event_forms table with Google Forms metadata
-ALTER TABLE IF EXISTS public.event_forms
+ADD COLUMN IF NOT EXISTS google_form_id VARCHAR(255) NULL,
+ADD COLUMN IF NOT EXISTS google_form_url TEXT NULL,
+ADD COLUMN IF NOT EXISTS google_form_edit_url TEXT NULL,
+ADD COLUMN IF NOT EXISTS qr_code_url TEXT NULL;

-- 3. Google Form Synchronized Responses Table
-CREATE TABLE IF NOT EXISTS public.google_form_responses (
+    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
+    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
+    google_form_id VARCHAR(255) NOT NULL,
+    google_response_id VARCHAR(255) NOT NULL,
+    student_name VARCHAR(150),
+    student_email VARCHAR(150),
+    student_id VARCHAR(100),
+    contact_number VARCHAR(50),
+    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
+    raw_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
+    submitted_at TIMESTAMPTZ NOT NULL,
+    synchronized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
+    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
+    CONSTRAINT uq_google_form_event_response UNIQUE (event_id, google_response_id)
+);

-- 4. Indexes for response search, event filtering, and deduplication
-CREATE INDEX IF NOT EXISTS idx_google_form_responses_event_id ON public.google_form_responses(event_id);
-CREATE INDEX IF NOT EXISTS idx_google_form_responses_student_email ON public.google_form_responses(student_email);
-CREATE INDEX IF NOT EXISTS idx_google_form_responses_student_id ON public.google_form_responses(student_id);
-CREATE INDEX IF NOT EXISTS idx_google_form_responses_submitted_at ON public.google_form_responses(submitted_at DESC);

-- 5. Row Level Security Policies
-ALTER TABLE public.google_form_responses ENABLE ROW LEVEL SECURITY;

-- Deny public / student read/write on synchronized responses
-DROP POLICY IF EXISTS "Deny public direct access to google responses" ON public.google_form_responses;
-CREATE POLICY "Deny public direct access to google responses"
+    ON public.google_form_responses
+    FOR ALL
+    TO anon, authenticated
+    USING (
+        EXISTS (
+            SELECT 1 FROM public.admin_members m
+            WHERE m.user_id = auth.uid()
+              AND m.status = 'active'
+              AND m.role IN ('President', 'Admin')
+        )
+    )
+    WITH CHECK (
+        EXISTS (
+            SELECT 1 FROM public.admin_members m
+            WHERE m.user_id = auth.uid()
+              AND m.status = 'active'
+              AND m.role IN ('President', 'Admin')
+        )
+    );

-- 6. Comment on tables
-COMMENT ON TABLE public.google_form_responses IS 'Synchronized student submissions from authorized Google Forms for AVISHKAR events.';
-COMMENT ON COLUMN public.events.creation_source IS 'Differentiates administrator-created events (which bypass council proposals) from council-submitted proposals.';
