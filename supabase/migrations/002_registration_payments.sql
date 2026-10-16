-- ============================================================================
-- AVISHKAR 2026 — Migration 002: Student Registrations and Payment Proofs
-- ============================================================================

-- 1. Enum for payment verification lifecycle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_payment_status') THEN
        CREATE TYPE registration_payment_status AS ENUM (
            'pending_verification',
            'verified',
            'rejected'
        );
    END IF;
END$$;

-- 2. Main registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(32) UNIQUE NOT NULL,
    
    -- Personal Information (Step 1)
    student_name VARCHAR(120) NOT NULL,
    gender VARCHAR(30) NOT NULL,
    dob DATE NOT NULL,
    
    -- Academic Information (Step 2 - GD Goenka University, No College field)
    -- Student ID uniqueness is enforced via case-insensitive unique index below
    student_id VARCHAR(50) NOT NULL,
    course VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    
    -- Payment & Receipt Information (Step 4)
    -- Transaction ID uniqueness is enforced via case-insensitive unique index below
    transaction_id VARCHAR(64) NOT NULL,
    payment_date DATE NOT NULL,
    fee_amount NUMERIC(10, 2) DEFAULT NULL,
    receipt_file_path TEXT NOT NULL,
    receipt_file_name TEXT NOT NULL,
    receipt_file_size INTEGER NOT NULL,
    receipt_mime_type VARCHAR(64) NOT NULL,
    remarks TEXT,
    
    -- Administrative Review State
    payment_status registration_payment_status NOT NULL DEFAULT 'pending_verification',
    admin_review_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes & Uniqueness Constraints
-- Drop redundant non-unique indexes if previously created
DROP INDEX IF EXISTS public.idx_registrations_student_id;
DROP INDEX IF EXISTS public.idx_registrations_transaction_id;

-- Case-insensitive unique constraint on student roll number / ID
-- Prevents double registration for the same student regardless of input casing
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_student_id_unique 
    ON public.registrations (LOWER(TRIM(student_id)));

-- Case-insensitive unique constraint on transaction ID / UTR reference
-- Prevents reusing the same payment receipt or transaction ID across submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_transaction_id_unique 
    ON public.registrations (UPPER(TRIM(transaction_id)));

-- Query and review indexes
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations (payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations (created_at DESC);

-- 4. Row Level Security on registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Allow public/unauthenticated users to submit new registrations
-- They can only insert records with payment_status = 'pending_verification'
DROP POLICY IF EXISTS "Public students can submit registrations" ON public.registrations;
CREATE POLICY "Public students can submit registrations"
    ON public.registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (payment_status = 'pending_verification');

-- RLS Policy 2: Prevent public users from reading receipts and personal data
-- Security: Fails closed. Only the service role or authenticated accounts with an explicit
-- app_metadata->'role' = 'admin' claim can view registrations.
-- General email wildcards are strictly avoided to prevent unauthorized access.
DROP POLICY IF EXISTS "Admins and service role can view registrations" ON public.registrations;
CREATE POLICY "Admins and service role can view registrations"
    ON public.registrations
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    );

-- RLS Policy 3: Only authorized admins or service role can update verification status
DROP POLICY IF EXISTS "Admins can update verification status" ON public.registrations;
CREATE POLICY "Admins can update verification status"
    ON public.registrations
    FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    )
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    );

-- 5. Private Storage Bucket: payment-receipts
-- Must be configured as private in Supabase storage to protect student transaction receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-receipts',
    'payment-receipts',
    false, -- STRICTLY PRIVATE: receipts are confidential financial proofs
    10485760, -- 10 MB limit in bytes (10 * 1024 * 1024)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 6. Storage Row Level Security on storage.objects
-- Storage RLS: Public can upload their receipt during registration
DROP POLICY IF EXISTS "Public students can upload receipt proof" ON storage.objects;
CREATE POLICY "Public students can upload receipt proof"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'payment-receipts');

-- Storage RLS: Only admins or service role can view receipts
-- Fails closed: requires explicit app_metadata->'role' = 'admin' or service_role
DROP POLICY IF EXISTS "Admins can view payment receipts" ON storage.objects;
CREATE POLICY "Admins can view payment receipts"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'payment-receipts' AND (
            (auth.jwt() ->> 'role') = 'service_role' OR
            ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
        )
    );

-- Storage RLS: Only admins or service role can delete receipts (e.g. cleanup or administrative review)
DROP POLICY IF EXISTS "Admins and service role can delete payment receipts" ON storage.objects;
CREATE POLICY "Admins and service role can delete payment receipts"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'payment-receipts' AND (
            (auth.jwt() ->> 'role') = 'service_role' OR
            ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
        )
    );
