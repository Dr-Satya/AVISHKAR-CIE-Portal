-- ============================================================================
-- AVISHKAR 2026 — Migration 009: Add Optional Startup & Innovation Details
-- ============================================================================

-- 1. Add optional startup and incubation columns as NULLABLE
-- Strictly preserves full backward compatibility with all historical registrations.
-- Existing rows will safely contain NULL for these columns.
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS has_startup_or_project VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS team_leader_name VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS team_leader_enrollment VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS team_leader_email VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS team_leader_contact VARCHAR(30) NULL,
    ADD COLUMN IF NOT EXISTS student_role VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS team_structure VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS team_members JSONB NULL,
    ADD COLUMN IF NOT EXISTS startup_title VARCHAR(200) NULL,
    ADD COLUMN IF NOT EXISTS startup_details TEXT NULL,
    ADD COLUMN IF NOT EXISTS startup_stage VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS support_needed JSONB NULL,
    ADD COLUMN IF NOT EXISTS other_support_details TEXT NULL;

-- 2. Partial index for searching registrations that have startup details
CREATE INDEX IF NOT EXISTS idx_registrations_startup_title
    ON public.registrations (startup_title)
    WHERE startup_title IS NOT NULL;
