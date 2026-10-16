-- ============================================================================
-- AVISHKAR 2026 — Migration 005: Role-Based Admin Portal, Events & RBAC
-- ============================================================================
-- Supports roles:
--  - President (Full operational oversight, event approval, member management, audit logs)
--  - Admin (Event management, dynamic form builder, resource approvals, registrations)
--  - AVISHKAR Member (Assigned events & tasks, proposal submissions, resource uploads)
--  - Student (Public access only, denied administrative access)

-- 1. Enum types for events, resources, and tasks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status_enum') THEN
        CREATE TYPE event_status_enum AS ENUM (
            'draft',
            'proposed',
            'approved',
            'published',
            'rejected'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_category_enum') THEN
        CREATE TYPE resource_category_enum AS ENUM (
            'rulebook',
            'document',
            'photo',
            'guide',
            'link'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
        CREATE TYPE task_status_enum AS ENUM (
            'todo',
            'in_progress',
            'completed'
        );
    END IF;
END$$;

-- 2. Admin Members Table
CREATE TABLE IF NOT EXISTS public.admin_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('President', 'Admin', 'AVISHKAR Member')),
    department VARCHAR(100) NOT NULL DEFAULT 'Organizing Council',
    assigned_event_ids UUID[] DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    status event_status_enum NOT NULL DEFAULT 'draft',
    proposed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    team_size_min INTEGER NOT NULL DEFAULT 1,
    team_size_max INTEGER NOT NULL DEFAULT 4,
    date_placeholder VARCHAR(100) NOT NULL DEFAULT 'Dates to be announced',
    venue_placeholder VARCHAR(150) NOT NULL DEFAULT 'GD Goenka University Campus',
    rulebook_url TEXT NULL,
    assigned_member_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Event Dynamic Registration Forms Table (Google Forms-style config)
CREATE TABLE IF NOT EXISTS public.event_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    form_title VARCHAR(200) NOT NULL,
    form_description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Event Resources Table
CREATE TABLE IF NOT EXISTS public.event_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category resource_category_enum NOT NULL DEFAULT 'document',
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL DEFAULT '0 KB',
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Member Tasks Table
CREATE TABLE IF NOT EXISTS public.member_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.admin_members(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status task_status_enum NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Administrative Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email VARCHAR(150) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);
CREATE INDEX IF NOT EXISTS idx_event_resources_event_id ON public.event_resources (event_id);
CREATE INDEX IF NOT EXISTS idx_member_tasks_member_id ON public.member_tasks (member_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);

-- 9. Row Level Security Policies (Strict Separation & Deny by Default)
ALTER TABLE public.admin_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper RLS condition for high-level administration (President, Admin, or service role)
-- Denies access to students or unauthenticated users.

-- Events Policies:
-- Public can ONLY view published events
CREATE POLICY "Public and students can view published events"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Admins and President can view all events (including drafts, proposals, rejected)
CREATE POLICY "Staff can view all events"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Admin', 'admin', 'AVISHKAR Member'))
    );

-- President and Admin can insert and update events
CREATE POLICY "President and Admin can manage events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Admin', 'admin'))
    );

-- AVISHKAR Members can propose new events
CREATE POLICY "Members can submit event proposals"
    ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'AVISHKAR Member') AND
        (status = 'proposed')
    );

-- Audit Logs Policies:
-- Only President and service_role can view audit logs
CREATE POLICY "President and service role can view audit logs"
    ON public.admin_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President'))
    );

-- Authorized operations can write audit log entries
CREATE POLICY "Authorized staff can insert audit logs"
    ON public.admin_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Admin', 'admin', 'AVISHKAR Member'))
    );

-- Members table policies:
-- Only President can manage member roles
CREATE POLICY "President can manage admin members"
    ON public.admin_members
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'President')
    );

-- Admins and Members can view the member directory
CREATE POLICY "Staff can view member roster"
    ON public.admin_members
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('President', 'Admin', 'admin', 'AVISHKAR Member'))
    );
