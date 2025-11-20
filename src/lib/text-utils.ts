/**
 * Text utility functions for handling encoding and display issues
 */

/**
 * Sanitize text to handle encoding issues and replace problematic characters
 * Fixes the "squares" display issue caused by malformed Unicode or encoding problems
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text) return "";
  
  try {
    // Remove any null bytes
    let cleaned = text.replace(/\0/g, "");
    
    // Remove replacement characters (�) and other common encoding artifacts
    cleaned = cleaned.replace(/\uFFFD/g, "");
    
    // Remove zero-width characters and other invisible Unicode
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, "");
    
    // Remove control characters except newlines and tabs
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    // If the result is empty or contains only whitespace/special chars, return fallback
    if (!cleaned || /^[\s\u0000-\u001F\u007F-\u009F]*$/.test(cleaned)) {
      return "";
    }
    
    return cleaned;
  } catch (error) {
    console.error("Error sanitizing text:", error);
    return "";
  }
}

/**
 * Get display name with fallback
 */
export function getDisplayName(name: string | undefined | null, fallback: string = "Unnamed"): string {
  const sanitized = sanitizeText(name);
  return sanitized || fallback;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  const sanitized = sanitizeText(text);
  if (sanitized.length <= maxLength) return sanitized;
  return sanitized.substring(0, maxLength - 3) + "...";
}

/**
 * Check if text contains invalid characters that might render as squares
 */
export function hasInvalidCharacters(text: string): boolean {
  // Check for replacement character (�)
  if (text.includes("\uFFFD")) return true;
  
  // Check for null bytes
  if (text.includes("\0")) return true;
  
  // Check if it's mostly control characters
  const controlChars = text.match(/[\x00-\x1F\x7F-\x9F]/g);
  if (controlChars && controlChars.length > text.length * 0.3) return true;
  
  return false;
}

