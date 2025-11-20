/**
 * Generate a URL-friendly slug from a show title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if a string is a valid show ID (UUID-like format)
 * versus a slug
 */
export function isShowId(idOrSlug: string): boolean {
  // Show IDs are typically like: show-1762898469654-qsq3fudte
  // or UUIDs: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return /^show-\d+-[a-z0-9]+$/i.test(idOrSlug) || 
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
}

/**
 * Generate a show URL with slug
 */
export function getShowUrl(show: { id: string; title?: string; showTitle?: string; blueprint?: { show_title?: string } }): string {
  const title = show.blueprint?.show_title || show.showTitle || show.title;
  if (title) {
    const slug = generateSlug(title);
    return `/show/${slug}-${show.id}`;
  }
  return `/show/${show.id}`;
}

/**
 * Extract show ID from a slug URL
 * e.g., "the-detective-chronicles-show-1762898469654-qsq3fudte" -> "show-1762898469654-qsq3fudte"
 */
export function extractShowId(slugOrId: string): string {
  // If it's already an ID, return it
  if (isShowId(slugOrId)) {
    return slugOrId;
  }
  
  // Extract ID from slug-id format
  // Pattern: anything-show-TIMESTAMP-RANDOMCHARS
  const match = slugOrId.match(/(show-\d+-[a-z0-9]+)$/i);
  if (match) {
    return match[1];
  }
  
  // Try UUID format
  const uuidMatch = slugOrId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  
  // Fallback: return as-is (might be old ID format)
  return slugOrId;
}

