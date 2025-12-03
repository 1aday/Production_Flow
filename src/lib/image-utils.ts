/**
 * Utility to optimize image URLs using Supabase Image Transformations
 * 
 * Supabase Storage supports on-the-fly image transformations that are cached at CDN level.
 * This is much faster than Next.js on-the-fly optimization.
 * 
 * Original PNG is preserved for video generation, but display uses optimized version.
 * 
 * NOTE: Supabase Image Transformations require Pro plan. 
 * Set NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS=true to enable.
 */

type ImageSize = 'thumbnail' | 'card' | 'poster' | 'full';

const SIZE_PRESETS: Record<ImageSize, { width: number; height?: number; quality: number }> = {
  thumbnail: { width: 100, height: 150, quality: 60 },
  card: { width: 280, height: 420, quality: 75 },
  poster: { width: 400, height: 600, quality: 80 },
  full: { width: 800, height: 1200, quality: 85 },
};

// Supabase image transforms are enabled (Pro plan feature)
// Transforms are cached at CDN level - very fast after first request
const TRANSFORMS_ENABLED = true;

/**
 * Add Supabase image transform parameters to a URL
 * Only transforms Supabase Storage URLs - passes through other URLs unchanged
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  size: ImageSize = 'card'
): string {
  if (!url) return '';
  
  // If transforms not enabled, return original URL
  if (!TRANSFORMS_ENABLED) {
    return url;
  }
  
  // Only transform Supabase Storage URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  const preset = SIZE_PRESETS[size];
  
  // Supabase transform URL format:
  // /storage/v1/object/public/bucket/path → /storage/v1/render/image/public/bucket/path?width=X&height=Y
  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  
  // Add transform parameters
  const separator = transformedUrl.includes('?') ? '&' : '?';
  const params = new URLSearchParams();
  params.set('width', preset.width.toString());
  if (preset.height) {
    params.set('height', preset.height.toString());
  }
  params.set('quality', preset.quality.toString());
  
  return `${transformedUrl}${separator}${params.toString()}`;
}

/**
 * Get optimized URL for show poster display
 */
export function getPosterDisplayUrl(url: string | null | undefined): string {
  return optimizeImageUrl(url, 'card');
}

/**
 * Get optimized URL for thumbnail display
 */
export function getThumbnailUrl(url: string | null | undefined): string {
  return optimizeImageUrl(url, 'thumbnail');
}

/**
 * Get optimized URL for full poster display (lightbox, detail view)
 */
export function getFullPosterUrl(url: string | null | undefined): string {
  return optimizeImageUrl(url, 'full');
}

