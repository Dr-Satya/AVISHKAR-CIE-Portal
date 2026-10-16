-- ============================================================================
-- AVISHKAR 2026 — Migration 006: Add Optional Previous Work / Startup Details
-- ============================================================================

-- 1. Add optional previous work columns as NULLABLE
-- Strictly preserves full backward compatibility with all historical registrations.
-- Existing rows will have NULL for these columns.
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS previous_work_description TEXT NULL,
    ADD COLUMN IF NOT EXISTS project_name VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS project_role VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS technologies_used VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS project_link VARCHAR(500) NULL;

-- 2. Partial index for searching registrations that have project details
CREATE INDEX IF NOT EXISTS idx_registrations_project_name
    ON public.registrations (project_name)
    WHERE project_name IS NOT NULL;
