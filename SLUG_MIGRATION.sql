-- Add slug column to shows table
-- Run this in your Supabase SQL Editor

-- Add the slug column (nullable initially for backwards compatibility)
ALTER TABLE shows 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create an index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_shows_slug ON shows(slug);

-- Optional: Create a unique constraint on slug to prevent duplicates
-- Uncomment the line below if you want slugs to be unique
-- ALTER TABLE shows ADD CONSTRAINT shows_slug_unique UNIQUE (slug);

-- Optional: Generate slugs for existing shows
-- This function creates URL-friendly slugs from titles
-- Uncomment and run if you have existing shows without slugs

/*
UPDATE shows 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;
*/

