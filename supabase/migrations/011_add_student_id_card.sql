-- ============================================================================
-- AVISHKAR 2026 — Migration 011: Add Student ID Card Verification and Storage
-- ============================================================================

-- 1. Add student ID card metadata columns to public.registrations
-- Set as NULLABLE to strictly maintain backward compatibility with historical records.
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS id_card_file_path TEXT NULL,
    ADD COLUMN IF NOT EXISTS id_card_file_name TEXT NULL,
    ADD COLUMN IF NOT EXISTS id_card_file_size INTEGER NULL,
    ADD COLUMN IF NOT EXISTS id_card_mime_type VARCHAR(64) NULL;

-- 2. Create strictly private storage bucket 'student-id-cards'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-id-cards',
    'student-id-cards',
    false, -- STRICTLY PRIVATE: student identity documents are confidential
    5242880, -- 5 MB limit in bytes (5 * 1024 * 1024)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 3. Storage Row Level Security on storage.objects for student-id-cards
-- Anonymous and authenticated students can upload their ID card document during registration
DROP POLICY IF EXISTS "Public students can upload student id card" ON storage.objects;
CREATE POLICY "Public students can upload student id card"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'student-id-cards');

-- Only authenticated administrators or service role can read/view student ID cards
DROP POLICY IF EXISTS "Admins can view student id cards" ON storage.objects;
CREATE POLICY "Admins can view student id cards"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'student-id-cards' AND (
            (auth.jwt() ->> 'role') = 'service_role' OR
            ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
        )
    );

-- Only administrators or service role can delete student ID cards
DROP POLICY IF EXISTS "Admins and service role can delete student id cards" ON storage.objects;
CREATE POLICY "Admins and service role can delete student id cards"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'student-id-cards' AND (
            (auth.jwt() ->> 'role') = 'service_role' OR
            ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
        )
    );
