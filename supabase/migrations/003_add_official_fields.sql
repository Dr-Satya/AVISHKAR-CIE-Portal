-- ============================================================================
-- AVISHKAR 2026 — Migration 003: Official Form Alignment & Backward Compatibility
-- ============================================================================

-- 1. Relax legacy NOT NULL constraints so historical records remain valid
-- and new registrations are not forced to write misleading academic_year values
ALTER TABLE public.registrations ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN dob DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN course DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN branch DROP NOT NULL;
ALTER TABLE public.registrations ALTER COLUMN academic_year DROP NOT NULL;

-- 2. Add new official fields as NULLABLE (preserves all existing records)
-- Note: form_version has NO default so existing historical rows remain NULL
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS school VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS program VARCHAR(150) NULL,
    ADD COLUMN IF NOT EXISTS year_of_joining VARCHAR(10) NULL,
    ADD COLUMN IF NOT EXISTS reason_for_joining TEXT NULL,
    ADD COLUMN IF NOT EXISTS leadership_interest TEXT NULL,
    ADD COLUMN IF NOT EXISTS form_version VARCHAR(20) NULL;

-- 3. Database defense: enforce nonblank student IDs (Safe NOT VALID pattern)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_registrations_student_id_not_blank'
    ) THEN
        ALTER TABLE public.registrations
            ADD CONSTRAINT chk_registrations_student_id_not_blank
            CHECK (LENGTH(TRIM(student_id)) > 0) NOT VALID;
    END IF;
END$$;

-- 4. Administrative Query Indexes (Non-unique)
CREATE INDEX IF NOT EXISTS idx_registrations_school
    ON public.registrations (school);

CREATE INDEX IF NOT EXISTS idx_registrations_program
    ON public.registrations (program);

CREATE INDEX IF NOT EXISTS idx_registrations_email
    ON public.registrations (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_registrations_form_version
    ON public.registrations (form_version);
