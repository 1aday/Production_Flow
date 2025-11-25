import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/episodes/shows
 * Fetches all shows that have episode loglines
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch shows that have episodes
    const { data: shows, error } = await supabase
      .from('shows')
      .select('id, title, blueprint, library_poster_url, poster_url, episodes')
      .not('episodes', 'is', null)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }
    
    // Filter shows that have at least one episode and transform data
    const showsWithEpisodes = (shows || [])
      .filter(show => {
        const episodes = show.episodes;
        return Array.isArray(episodes) && episodes.length > 0;
      })
      .map(show => ({
        id: show.id,
        title: show.title,
        showTitle: show.blueprint?.show_title,
        libraryPosterUrl: show.library_poster_url,
        posterUrl: show.poster_url,
        episodeCount: Array.isArray(show.episodes) ? show.episodes.length : 0,
        genre: show.blueprint?.genre,
        logline: show.blueprint?.show_logline,
      }));
    
    return NextResponse.json({ shows: showsWithEpisodes });
  } catch (error) {
    console.error("Failed to fetch shows with episodes:", error);
    return NextResponse.json(
      { error: "Failed to fetch shows" },
      { status: 500 }
    );
  }
}

