/**
 * Generate a URL-friendly slug from a show title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, '')
    // Remove multiple consecutive hyphens
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a string looks like a UUID or random ID
 */
export function isId(str: string): boolean {
  // Check if it looks like a timestamp-based ID or UUID
  return /^[0-9]{13,}-[a-z0-9]+$/.test(str) || 
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) ||
         /^[a-z0-9]{20,}$/i.test(str);
}

