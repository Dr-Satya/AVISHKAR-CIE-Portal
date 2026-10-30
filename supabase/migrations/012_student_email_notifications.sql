-- ============================================================================
-- AVISHKAR 2026 — Migration 012: Student Registration Email Notifications
-- ============================================================================

-- 1. Create table for tracking email notifications outbox and delivery status
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id TEXT PRIMARY KEY,
    registration_id TEXT NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(64) NOT NULL, -- registration_submitted, registration_approved, registration_rejected
    subject TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, sent, failed, simulated
    provider VARCHAR(32) NOT NULL DEFAULT 'sandbox', -- resend, sandbox
    provider_message_id TEXT NULL,
    error_message TEXT NULL,
    attempts INTEGER NOT NULL DEFAULT 1,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient lookup by registration, recipient, and status
CREATE INDEX IF NOT EXISTS idx_email_notifications_reg_num 
    ON public.email_notifications (registration_number);

CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient 
    ON public.email_notifications (recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status 
    ON public.email_notifications (status);

CREATE INDEX IF NOT EXISTS idx_email_notifications_idempotency 
    ON public.email_notifications (idempotency_key);

-- 3. Row Level Security: email history is sensitive internal ledger
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Service role has full permissions for backend insert/update/select
DROP POLICY IF EXISTS "Service role has full access to email notifications" ON public.email_notifications;
CREATE POLICY "Service role has full access to email notifications"
    ON public.email_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated admins can view email notification logs
DROP POLICY IF EXISTS "Admins can view email notification logs" ON public.email_notifications;
CREATE POLICY "Admins can view email notification logs"
    ON public.email_notifications
    FOR SELECT
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'service_role' OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    );
