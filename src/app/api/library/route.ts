import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, uploadToSupabase, downloadAsBuffer } from "@/lib/supabase";
import { generateSlug } from "@/lib/slug";

type ShowMetadata = {
  id: string;
  slug?: string;
  title: string;
  showTitle?: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  posterUrl?: string;
  libraryPosterUrl?: string;
  portraitGridUrl?: string;
  trailerUrl?: string;
};

// GET - List all shows
export async function GET() {
  try {
    console.time("Library GET - total");
    const supabase = createServerSupabaseClient();
    
    const { data: shows, error } = await supabase
      .from('shows')
      .select('id, slug, title, created_at, updated_at, model, poster_url, library_poster_url, portrait_grid_url, trailer_url, blueprint, character_seeds, character_docs, character_portraits, character_videos')
      .order('updated_at', { ascending: false })
      .limit(50); // Limit for performance
    
    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }
    
    console.log(`Found ${shows?.length || 0} shows in Supabase`);
    
    // Transform to expected format with trailerUrl included
    const showMetadata: ShowMetadata[] = (shows || []).map(show => ({
      id: show.id,
      slug: show.slug,
      title: show.title,
      showTitle: (show.blueprint as { show_title?: string })?.show_title,
      createdAt: show.created_at,
      updatedAt: show.updated_at,
      model: show.model,
      posterUrl: show.poster_url,
      libraryPosterUrl: show.library_poster_url,
      portraitGridUrl: show.portrait_grid_url,
      trailerUrl: show.trailer_url, // Include trailer URL for landing page
      // For completion calculation
      characterSeeds: show.character_seeds as Array<{ id: string }> | undefined,
      characterDocs: show.character_docs as Record<string, unknown> | undefined,
      characterPortraits: show.character_portraits as Record<string, string | null> | undefined,
      characterVideos: show.character_videos as Record<string, string[]> | undefined,
    }));
    
    console.timeEnd("Library GET - total");
    
    return NextResponse.json({ shows: showMetadata });
  } catch (error) {
    console.error("Failed to list shows:", error);
    return NextResponse.json(
      { error: "Failed to list shows" },
      { status: 500 }
    );
  }
}

// POST - Save a show
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      blueprint, 
      rawJson, 
      usage, 
      model, 
      characterSeeds, 
      characterDocs, 
      characterPortraits, 
      characterVideos, 
      posterUrl, 
      libraryPosterUrl, 
      portraitGridUrl, 
      trailerUrl,
      // NEW: Essential missing data
      originalPrompt,
      customPortraitPrompts,
      customVideoPrompts,
      customPosterPrompt,
      customTrailerPrompt,
      videoModelId,
      videoSeconds,
      videoAspectRatio,
      videoResolution,
      trailerModel,
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();
    
    // Handle partial updates (e.g., just trailer URL)
    // If blueprint is missing, this is a partial update - fetch existing data and merge
    if (!blueprint) {
      console.log("📝 Partial update detected for show:", id);
      
      const { data: existingShow, error: fetchError } = await supabase
        .from('shows')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingShow) {
        return NextResponse.json(
          { error: "Show not found for partial update" },
          { status: 404 }
        );
      }
      
      // Merge the partial update with existing data
      const partialUpdate: Record<string, unknown> = {
        id,
        updated_at: now,
      };
      
      if (trailerUrl !== undefined) partialUpdate.trailer_url = trailerUrl;
      if (trailerModel !== undefined) partialUpdate.trailer_model = trailerModel;
      
      const { error: updateError } = await supabase
        .from('shows')
        .update(partialUpdate)
        .eq('id', id);
      
      if (updateError) {
        console.error("Supabase partial update error:", updateError);
        throw updateError;
      }
      
      console.log("✅ Partial update saved:", partialUpdate);
      return NextResponse.json({ success: true, id });
    }
    
    const title = blueprint.show_title || blueprint.show_logline?.slice(0, 100) || "Untitled Show";
    
    // Generate URL-friendly slug from title
    const slug = generateSlug(title);
    
    // Upload assets to Supabase Storage if they're data URLs
    const uploadedAssets = await uploadAssetsToStorage(supabase, id, {
      characterPortraits: characterPortraits || {},
      characterVideos: characterVideos || {},
      posterUrl,
      libraryPosterUrl,
      portraitGridUrl,
      trailerUrl,
    });
    
    const showData = {
      id,
      slug,
      title,
      created_at: body.createdAt || now,
      updated_at: now,
      
      // Core data
      model,
      original_prompt: originalPrompt || null,
      blueprint,
      raw_json: rawJson || null,
      usage: usage || null,
      
      // Character data
      character_seeds: characterSeeds || [],
      character_docs: characterDocs || {},
      character_portraits: uploadedAssets.characterPortraits,
      character_videos: uploadedAssets.characterVideos,
      
      // Custom prompts
      custom_portrait_prompts: customPortraitPrompts || {},
      custom_video_prompts: customVideoPrompts || {},
      custom_poster_prompt: customPosterPrompt || null,
      custom_trailer_prompt: customTrailerPrompt || null,
      
      // Asset URLs
      poster_url: uploadedAssets.posterUrl,
      library_poster_url: uploadedAssets.libraryPosterUrl,
      portrait_grid_url: uploadedAssets.portraitGridUrl,
      trailer_url: uploadedAssets.trailerUrl,
      
      // Generation metadata
      trailer_model: trailerModel || null,
      
      // User preferences
      video_model_id: videoModelId || 'openai/sora-2',
      video_seconds: videoSeconds || 8,
      video_aspect_ratio: videoAspectRatio || 'landscape',
      video_resolution: videoResolution || 'standard',
    };
    
    // Upsert to Supabase
    const { error } = await supabase
      .from('shows')
      .upsert(showData, { onConflict: 'id' });
    
    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }
    
    const videosData = (characterVideos || {}) as Record<string, string[]>;
    const portraitsData = (characterPortraits || {}) as Record<string, string | null>;
    const totalVideos = Object.values(videosData).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    const portraitCount = Object.keys(portraitsData).filter(k => portraitsData[k]).length;
    
    console.log("💾 Show saved to Supabase:", {
      id,
      title,
      characterSeeds: (characterSeeds || []).length,
      characterDocs: Object.keys(characterDocs || {}).length,
      portraits: portraitCount,
      videos: totalVideos,
      hasPoster: !!uploadedAssets.posterUrl,
      hasLibraryPoster: !!uploadedAssets.libraryPosterUrl,
      hasPortraitGrid: !!uploadedAssets.portraitGridUrl,
      hasTrailer: !!uploadedAssets.trailerUrl,
    });
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to save show:", error);
    return NextResponse.json(
      { error: "Failed to save show" },
      { status: 500 }
    );
  }
}

// Helper function to upload assets to Supabase Storage
async function uploadAssetsToStorage(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  showId: string,
  assets: {
    characterPortraits: Record<string, string | null>;
    characterVideos: Record<string, string[]>;
    posterUrl?: string | null;
    libraryPosterUrl?: string | null;
    portraitGridUrl?: string | null;
    trailerUrl?: string | null;
  }
) {
  const result = {
    characterPortraits: {} as Record<string, string | null>,
    characterVideos: {} as Record<string, string[]>,
    posterUrl: assets.posterUrl || null,
    libraryPosterUrl: assets.libraryPosterUrl || null,
    portraitGridUrl: assets.portraitGridUrl || null,
    trailerUrl: assets.trailerUrl || null,
  };

  try {
    // Upload character portraits
    for (const [charId, url] of Object.entries(assets.characterPortraits)) {
      if (!url) continue;
      
      let buffer: Buffer | null = null;
      
      if (url.startsWith('data:')) {
        buffer = dataUrlToBuffer(url);
      } else if (url.startsWith('http')) {
        // Download from Replicate
        buffer = await downloadAsBuffer(url);
        console.log(`⬇️ Downloaded portrait for ${charId}`);
      } else if (url.startsWith('/')) {
        // Local file path
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const filePath = path.join(process.cwd(), 'public', url);
          buffer = await fs.readFile(filePath);
          console.log(`📁 Read local portrait for ${charId}`);
        } catch (fsError) {
          console.warn(`Failed to read local file ${url}:`, fsError);
        }
      }
      
      if (buffer) {
        const storagePath = `${showId}/portraits/${charId}.webp`;
        const uploaded = await uploadToSupabase(supabase, 'show-assets', storagePath, buffer, 'image/webp');
        result.characterPortraits[charId] = uploaded || url;
        console.log(`✅ Uploaded portrait for ${charId} to Supabase`);
      } else {
        result.characterPortraits[charId] = url;
      }
    }

    // Upload character videos
    for (const [charId, urls] of Object.entries(assets.characterVideos)) {
      result.characterVideos[charId] = [];
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        let buffer: Buffer | null = null;
        
        if (url.startsWith('data:')) {
          buffer = dataUrlToBuffer(url);
        } else if (url.startsWith('http')) {
          // Download from Replicate
          buffer = await downloadAsBuffer(url);
          console.log(`⬇️ Downloaded video ${i} for ${charId}`);
        } else if (url.startsWith('/')) {
          // Local file path
          try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'public', url);
            buffer = await fs.readFile(filePath);
            console.log(`📁 Read local video ${i} for ${charId}`);
          } catch (fsError) {
            console.warn(`Failed to read local file ${url}:`, fsError);
          }
        }
        
        if (buffer) {
          const storagePath = `${showId}/videos/${charId}-${i}.mp4`;
          const uploaded = await uploadToSupabase(supabase, 'show-assets', storagePath, buffer, 'video/mp4');
          result.characterVideos[charId].push(uploaded || url);
          console.log(`✅ Uploaded video ${i} for ${charId} to Supabase`);
        } else {
          result.characterVideos[charId].push(url);
        }
      }
    }

    // Upload poster
    if (assets.posterUrl) {
      result.posterUrl = await uploadAsset(supabase, showId, assets.posterUrl, 'poster.webp', 'image/webp');
    }

    // Upload library poster
    if (assets.libraryPosterUrl && assets.libraryPosterUrl.trim()) {
      console.log("📤 Uploading library poster:", assets.libraryPosterUrl.slice(0, 80) + "...");
      result.libraryPosterUrl = await uploadAsset(supabase, showId, assets.libraryPosterUrl, 'library-poster.webp', 'image/webp');
      console.log("✅ Library poster upload result:", result.libraryPosterUrl ? "Success" : "Failed");
    } else {
      console.log("⏭️ No library poster URL provided (libraryPosterUrl is:", assets.libraryPosterUrl || "null/undefined", ")");
      // Keep it as null
      result.libraryPosterUrl = null;
    }

    // Upload portrait grid
    if (assets.portraitGridUrl) {
      result.portraitGridUrl = await uploadAsset(supabase, showId, assets.portraitGridUrl, 'portrait-grid.webp', 'image/webp');
    }

    // Upload trailer
    if (assets.trailerUrl) {
      result.trailerUrl = await uploadAsset(supabase, showId, assets.trailerUrl, 'trailer.mp4', 'video/mp4');
    }

  } catch (error) {
    console.warn("Some assets failed to upload:", error);
  }

  return result;
}

// Helper to upload a single asset
async function uploadAsset(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  showId: string,
  url: string | null,
  filename: string,
  contentType: string
): Promise<string | null> {
  if (!url) return null;
  
  try {
    let buffer: Buffer | null = null;
    
    if (url.startsWith('data:')) {
      buffer = dataUrlToBuffer(url);
    } else if (url.startsWith('http')) {
      buffer = await downloadAsBuffer(url);
    } else if (url.startsWith('/')) {
      // Local file path - read from public directory
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'public', url);
        buffer = await fs.readFile(filePath);
        console.log(`📁 Read local file: ${url}`);
      } catch (fsError) {
        console.warn(`Failed to read local file ${url}:`, fsError);
        return url;
      }
    }
    
    if (!buffer) return url; // Keep original if can't convert
    
    const storagePath = `${showId}/${filename}`;
    const uploaded = await uploadToSupabase(supabase, 'show-assets', storagePath, buffer, contentType);
    
    if (uploaded) {
      console.log(`✅ Uploaded ${filename} to Supabase Storage`);
    }
    
    return uploaded || url;
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error);
    return url; // Fallback to original URL
  }
}

// Convert data URL to Buffer
function dataUrlToBuffer(dataUrl: string): Buffer | null {
  try {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;
    return Buffer.from(matches[2], 'base64');
  } catch {
    return null;
  }
}
