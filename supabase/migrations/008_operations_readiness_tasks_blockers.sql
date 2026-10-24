-- ============================================================================
-- AVISHKAR 2026 — Migration 008: Operations Readiness, Advanced Tasks & Blockers
-- ============================================================================

-- 1. Create Enums for Readiness and Blockers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'readiness_category_enum') THEN
        CREATE TYPE readiness_category_enum AS ENUM (
            'venue_seating',
            'equipment_technical',
            'committee_volunteers',
            'logistics_materials',
            'scheduling_coordination',
            'other_mandatory'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'readiness_status_enum') THEN
        CREATE TYPE readiness_status_enum AS ENUM (
            'completed',
            'pending',
            'blocked',
            'overdue'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blocker_severity_enum') THEN
        CREATE TYPE blocker_severity_enum AS ENUM (
            'low',
            'medium',
            'high',
            'critical'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blocker_status_enum') THEN
        CREATE TYPE blocker_status_enum AS ENUM (
            'open',
            'in_progress',
            'escalated',
            'resolved'
        );
    END IF;
END$$;

-- 2. Extend member_tasks table with subtasks, dependencies, and activity tracking
ALTER TABLE public.member_tasks
    ADD COLUMN IF NOT EXISTS due_time VARCHAR(10) DEFAULT '17:00',
    ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completion_criteria TEXT,
    ADD COLUMN IF NOT EXISTS depends_on_task_ids UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS reassignment_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completion_notes TEXT,
    ADD COLUMN IF NOT EXISTS completion_evidence_url TEXT,
    ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update priority check on member_tasks to support 'critical'
ALTER TABLE public.member_tasks DROP CONSTRAINT IF EXISTS member_tasks_priority_check;
ALTER TABLE public.member_tasks ADD CONSTRAINT member_tasks_priority_check
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- 3. Create Event Readiness Checklist Table
CREATE TABLE IF NOT EXISTS public.event_readiness_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category readiness_category_enum NOT NULL DEFAULT 'other_mandatory',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    status readiness_status_enum NOT NULL DEFAULT 'pending',
    responsible_member_id UUID REFERENCES public.admin_members(id) ON DELETE SET NULL,
    responsible_member_name VARCHAR(150),
    deadline DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    completed_by VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Operational Blockers & Risks Table
CREATE TABLE IF NOT EXISTS public.operational_blockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    task_id UUID REFERENCES public.member_tasks(id) ON DELETE SET NULL,
    task_title VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity blocker_severity_enum NOT NULL DEFAULT 'medium',
    operational_impact TEXT NOT NULL,
    evidence_url TEXT,
    reported_by VARCHAR(150) NOT NULL,
    reported_by_email VARCHAR(150) NOT NULL,
    reported_by_role VARCHAR(50) NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_to_id UUID REFERENCES public.admin_members(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(150),
    assigned_to_email VARCHAR(150),
    resolution_deadline DATE,
    status blocker_status_enum NOT NULL DEFAULT 'open',
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(150),
    escalated_to VARCHAR(50),
    escalated_at TIMESTAMPTZ,
    escalated_by VARCHAR(150),
    escalation_reason TEXT,
    history JSONB DEFAULT '[]'::jsonb
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_readiness_event_id ON public.event_readiness_items(event_id);
CREATE INDEX IF NOT EXISTS idx_readiness_status ON public.event_readiness_items(status);
CREATE INDEX IF NOT EXISTS idx_blockers_event_id ON public.operational_blockers(event_id);
CREATE INDEX IF NOT EXISTS idx_blockers_status ON public.operational_blockers(status);
CREATE INDEX IF NOT EXISTS idx_blockers_severity ON public.operational_blockers(severity);

-- 6. Row Level Security Policies
ALTER TABLE public.event_readiness_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_blockers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Council and Admins can view readiness items"
    ON public.event_readiness_items
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Vice President', 'Admin', 'admin', 'AVISHKAR Member'))
    );

CREATE POLICY "VP, President and Admin can manage readiness items"
    ON public.event_readiness_items
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Vice President', 'Admin', 'admin'))
    );

CREATE POLICY "Council members can report and view blockers"
    ON public.operational_blockers
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Vice President', 'Admin', 'admin', 'AVISHKAR Member'))
    );

CREATE POLICY "Council members can insert blockers"
    ON public.operational_blockers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Vice President', 'Admin', 'admin', 'AVISHKAR Member'))
    );

CREATE POLICY "VP, President and Admin can update blockers"
    ON public.operational_blockers
    FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Vice President', 'Admin', 'admin'))
    );
