-- ============================================================================
-- AVISHKAR 2026 — Migration 004: Student Verification Tracking & Audit
-- ============================================================================
-- Adds explicit student verification columns to decouple student eligibility
-- verification from payment verification on public.registrations.
-- Safe, non-destructive, and backward compatible (all existing rows default to 'pending').

-- 1. Add student verification tracking columns
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS student_verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS student_verified_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS student_verified_by UUID NULL,
    ADD COLUMN IF NOT EXISTS student_verification_notes TEXT NULL;

-- 2. Performance index for administrative filtering
CREATE INDEX IF NOT EXISTS idx_registrations_student_verification_status
    ON public.registrations (student_verification_status);

-- 3. Documented Setup Instruction:
-- To designate a Supabase user as an administrator:
-- In Supabase Dashboard -> SQL Editor, run:
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'YOUR_ADMIN_EMAIL@gdgu.org';
