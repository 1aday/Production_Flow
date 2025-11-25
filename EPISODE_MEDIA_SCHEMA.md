# 🎬 Episode Media Schema - Supabase Setup

## Overview

This adds storage for:
- **Episode Stills** - Generated keyframe images for each act/section
- **Episode Clips** - Video clips generated from stills (image-to-video)
- **Full Episodes** - Stitched video combining all clips

---

## 📊 Database Migration

### Run this SQL in Supabase SQL Editor:

```sql
-- =====================================================
-- EPISODE MEDIA SCHEMA
-- =====================================================

-- Add episode media columns to shows table
ALTER TABLE shows ADD COLUMN IF NOT EXISTS episode_stills JSONB DEFAULT '{}'::jsonb;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS episode_clips JSONB DEFAULT '{}'::jsonb;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS episode_videos JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN shows.episode_stills IS 'Keyframe images per episode per section: { episodeNum: { sectionLabel: imageUrl } }';
COMMENT ON COLUMN shows.episode_clips IS 'Video clips per episode per section: { episodeNum: { sectionLabel: videoUrl } }';
COMMENT ON COLUMN shows.episode_videos IS 'Full stitched episode videos: { episodeNum: videoUrl }';

-- =====================================================
-- STORAGE BUCKET FOR EPISODE MEDIA
-- =====================================================
-- Run these in the SQL Editor:

-- Create bucket for episode media
INSERT INTO storage.buckets (id, name, public)
VALUES ('episode-media', 'episode-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for episode media"
ON storage.objects FOR SELECT
USING (bucket_id = 'episode-media');

-- Allow authenticated uploads (or use service role)
CREATE POLICY "Service role upload for episode media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'episode-media');

-- Allow updates and deletes
CREATE POLICY "Service role update for episode media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'episode-media');

CREATE POLICY "Service role delete for episode media"
ON storage.objects FOR DELETE
USING (bucket_id = 'episode-media');
```

---

## 📁 Data Structure

### episode_stills (JSONB)
```json
{
  "1": {
    "TEASER": "https://storage.supabase.co/episode-media/show-123/ep1-teaser.jpg",
    "ACT 1": "https://storage.supabase.co/episode-media/show-123/ep1-act1.jpg",
    "ACT 2": "https://storage.supabase.co/episode-media/show-123/ep1-act2.jpg",
    "ACT 3": "https://storage.supabase.co/episode-media/show-123/ep1-act3.jpg",
    "ACT 4": "https://storage.supabase.co/episode-media/show-123/ep1-act4.jpg",
    "TAG": "https://storage.supabase.co/episode-media/show-123/ep1-tag.jpg"
  },
  "2": {
    "TEASER": "https://...",
    ...
  }
}
```

### episode_clips (JSONB)
```json
{
  "1": {
    "TEASER": "https://storage.supabase.co/episode-media/show-123/ep1-teaser.mp4",
    "ACT 1": "https://storage.supabase.co/episode-media/show-123/ep1-act1.mp4",
    ...
  }
}
```

### episode_videos (JSONB)
```json
{
  "1": "https://storage.supabase.co/episode-media/show-123/ep1-full.mp4",
  "2": "https://storage.supabase.co/episode-media/show-123/ep2-full.mp4"
}
```

---

## 🔧 File Naming Convention

```
episode-media/
└── {showId}/
    ├── ep{N}-teaser.jpg      (still)
    ├── ep{N}-act1.jpg        (still)
    ├── ep{N}-act2.jpg        (still)
    ├── ep{N}-act3.jpg        (still)
    ├── ep{N}-act4.jpg        (still)
    ├── ep{N}-tag.jpg         (still)
    ├── ep{N}-teaser.mp4      (clip)
    ├── ep{N}-act1.mp4        (clip)
    ├── ep{N}-act2.mp4        (clip)
    ├── ep{N}-act3.mp4        (clip)
    ├── ep{N}-act4.mp4        (clip)
    ├── ep{N}-tag.mp4         (clip)
    └── ep{N}-full.mp4        (stitched)
```

---

## 🚀 API Endpoints Needed

### 1. Save Still
`POST /api/episodes/stills/save`
- Uploads image to Supabase Storage
- Updates `episode_stills` in shows table

### 2. Generate Clip from Still  
`POST /api/episodes/clips`
- Takes still image URL
- Generates video using Replicate (Kling, Runway, etc.)
- Saves to `episode_clips`

### 3. Stitch Episode
`POST /api/episodes/stitch`
- Takes all clips for an episode
- Combines into single video (using FFmpeg or cloud service)
- Saves to `episode_videos`

---

## ✅ Quick Setup Checklist

1. [ ] Run the SQL migration above
2. [ ] Create the `episode-media` storage bucket
3. [ ] Add storage policies
4. [ ] Update the stills API to save to Supabase
5. [ ] Create clips generation API
6. [ ] Create video stitching API

---

## 💡 Notes

- Stills are ~500KB-2MB each (JPEG)
- Clips are ~5-20MB each (5-10 second MP4)
- Full episodes are ~50-100MB (30-60 seconds combined)
- Consider using Supabase Edge Functions for video processing
- Or use external service like Creatomate/Shotstack for stitching

