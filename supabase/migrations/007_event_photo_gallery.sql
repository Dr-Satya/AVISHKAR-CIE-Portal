-- ============================================================================
-- AVISHKAR 2026 — Migration 007: Event Photo Gallery Management
-- ============================================================================
-- Adds support for:
--  - Persistent event photos and gallery management
--  - Cover photo selection and display ordering
--  - RLS policies ensuring only authorized administrators can upload/edit/delete
--  - Public read access strictly for published event galleries
-- ============================================================================

-- 1. Create event_photos table
CREATE TABLE IF NOT EXISTS public.event_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(100) NOT NULL,
    caption TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    uploaded_by VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient lookup, ordering, and event joining
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_display_order ON public.event_photos(event_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_event_photos_is_cover ON public.event_photos(event_id, is_cover);

-- 3. Add cover_photo columns to events table if not existing
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cover_photo_id UUID NULL,
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT NULL,
ADD COLUMN IF NOT EXISTS photo_count INTEGER NOT NULL DEFAULT 0;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies:
-- Public can read photos only for published events
CREATE POLICY "Public can view photos of published events"
    ON public.event_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_photos.event_id
              AND events.status = 'published'
        )
    );

-- Council administrators (President, Admin) can manage all photos
CREATE POLICY "Authorized administrators can manage event photos"
    ON public.event_photos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_members
            WHERE admin_members.user_id = auth.uid()
              AND admin_members.role IN ('President', 'Admin')
              AND admin_members.status = 'active'
        )
    );
