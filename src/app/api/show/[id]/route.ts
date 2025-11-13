import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/show/[id]
 * Fetches complete show data including all assets from Supabase
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showId } = await context.params;
    
    const supabase = createServerSupabaseClient();
    
    // Fetch show from Supabase
    const { data: show, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single();
    
    if (error || !show) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }
    
    // Transform to match expected format
    const showData = {
      id: show.id,
      title: show.title,
      showTitle: show.blueprint?.show_title || show.title,
      createdAt: show.created_at,
      updatedAt: show.updated_at,
      blueprint: show.blueprint,
      characterSeeds: show.character_seeds,
      characterDocs: show.character_docs,
      characterPortraits: show.character_portraits,
      characterVideos: show.character_videos,
      posterUrl: show.poster_url,
      libraryPosterUrl: show.library_poster_url,
      portraitGridUrl: show.portrait_grid_url,
      trailerUrl: show.trailer_url,
      model: show.model,
    };
    
    // Gather assets from the show data
    const assets: {
      portraits: string[];
      characterPortraits?: Record<string, string>;
      poster?: string;
      trailer?: string;
      libraryPoster?: string;
      portraitGrid?: string;
    } = {
      portraits: [],
    };
    
    // Character portraits - store both as array and as mapping
    if (show.character_portraits) {
      assets.characterPortraits = show.character_portraits;
      Object.values(show.character_portraits).forEach((url) => {
        if (url && typeof url === 'string') {
          assets.portraits.push(url);
        }
      });
    }
    
    // Posters and trailer
    if (show.poster_url) assets.poster = show.poster_url;
    if (show.library_poster_url) assets.libraryPoster = show.library_poster_url;
    if (show.trailer_url) assets.trailer = show.trailer_url;
    if (show.portrait_grid_url) assets.portraitGrid = show.portrait_grid_url;
    
    return NextResponse.json({
      show: showData,
      assets,
    });
  } catch (error) {
    console.error("Error fetching show:", error);
    return NextResponse.json(
      { error: "Failed to fetch show data" },
      { status: 500 }
    );
  }
}

