import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Server-side Supabase client with service role key (full access)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Client-side Supabase client (for future use)
export function createClientSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Upload file to Supabase Storage with retry logic
export async function uploadToSupabase(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType: string,
  maxRetries = 2
): Promise<string | null> {
  const fileSize = file instanceof Buffer ? file.length : (file as Blob).size;
  
  // Skip files larger than 50MB
  if (fileSize > 50 * 1024 * 1024) {
    console.warn(`File too large to upload (${Math.round(fileSize / 1024 / 1024)}MB):`, path);
    return null;
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`⬆️  Uploading ${path} (${Math.round(fileSize / 1024)}KB), attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error(`Supabase upload error (attempt ${attempt + 1}):`, error.message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log(`✅ Upload successful: ${path}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error(`Upload failed (attempt ${attempt + 1}):`, error instanceof Error ? error.message : String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  
  return null;
}

// Download file from URL as Buffer
export async function downloadAsBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Download failed:', error);
    return null;
  }
}

/**
 * Compress an image buffer to reduce file size for faster uploads
 * Converts to WebP format and resizes to max dimension
 * @param buffer - Original image buffer
 * @param maxDimension - Max width/height (default 1024 for portraits)
 * @param quality - WebP quality 1-100 (default 80)
 * @returns Compressed buffer and new content type
 */
export async function compressImage(
  buffer: Buffer,
  maxDimension = 1024,
  quality = 80
): Promise<{ buffer: Buffer; contentType: string; originalSize: number; compressedSize: number }> {
  const originalSize = buffer.length;
  
  try {
    const compressed = await sharp(buffer)
      .resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
    
    const compressedSize = compressed.length;
    const savings = Math.round((1 - compressedSize / originalSize) * 100);
    console.log(`🗜️  Compressed: ${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB (${savings}% smaller)`);
    
    return {
      buffer: compressed,
      contentType: 'image/webp',
      originalSize,
      compressedSize,
    };
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return {
      buffer,
      contentType: 'image/png',
      originalSize,
      compressedSize: originalSize,
    };
  }
}

/**
 * Download, compress, and return optimized image buffer
 */
export async function downloadAndCompressImage(
  url: string,
  maxDimension = 1024,
  quality = 80
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const original = await downloadAsBuffer(url);
  if (!original) return null;
  
  const { buffer, contentType } = await compressImage(original, maxDimension, quality);
  return { buffer, contentType };
}

