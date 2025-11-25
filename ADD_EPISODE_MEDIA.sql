-- =====================================================
-- EPISODE MEDIA SCHEMA - Run in Supabase SQL Editor
-- =====================================================

-- 1. Add columns to shows table
ALTER TABLE shows ADD COLUMN IF NOT EXISTS episode_stills JSONB DEFAULT '{}'::jsonb;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS episode_clips JSONB DEFAULT '{}'::jsonb;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS episode_videos JSONB DEFAULT '{}'::jsonb;

-- 2. Create storage bucket for episode media
INSERT INTO storage.buckets (id, name, public)
VALUES ('episode-media', 'episode-media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies (allow all for now)
DROP POLICY IF EXISTS "Public read episode media" ON storage.objects;
CREATE POLICY "Public read episode media"
ON storage.objects FOR SELECT
USING (bucket_id = 'episode-media');

DROP POLICY IF EXISTS "Allow upload episode media" ON storage.objects;
CREATE POLICY "Allow upload episode media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'episode-media');

DROP POLICY IF EXISTS "Allow update episode media" ON storage.objects;
CREATE POLICY "Allow update episode media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'episode-media');

DROP POLICY IF EXISTS "Allow delete episode media" ON storage.objects;
CREATE POLICY "Allow delete episode media"
ON storage.objects FOR DELETE
USING (bucket_id = 'episode-media');

-- Done! You can now generate and save episode stills.

