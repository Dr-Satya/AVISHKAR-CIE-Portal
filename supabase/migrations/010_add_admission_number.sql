-- ============================================================================
-- AVISHKAR 2026 — Migration 010: Add Admission Number to Student Registrations
-- ============================================================================

-- 1. Add optional admission_number column as NULLABLE
-- Strictly preserves full backward compatibility with all historical registrations.
-- Existing registrations without an admission number will safely contain NULL.
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS admission_number VARCHAR(100) NULL;

-- 2. Index for searching registrations by admission number
CREATE INDEX IF NOT EXISTS idx_registrations_admission_number
    ON public.registrations (admission_number)
    WHERE admission_number IS NOT NULL;
