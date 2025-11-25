import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Load a specific show
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = createServerSupabaseClient();
    
    const { data: show, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !show) {
      console.error("Show not found:", id);
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }
    
    // Transform from snake_case to camelCase for frontend
    const transformedShow = {
      id: show.id,
      title: show.title,
      createdAt: show.created_at,
      updatedAt: show.updated_at,
      blueprint: show.blueprint,
      rawJson: show.raw_json,
      usage: show.usage,
      model: show.model,
      characterSeeds: show.character_seeds,
      characterDocs: show.character_docs,
      characterPortraits: show.character_portraits,
      characterVideos: show.character_videos,
      posterUrl: show.poster_url,
      libraryPosterUrl: show.library_poster_url,
      portraitGridUrl: show.portrait_grid_url,
      trailerUrl: show.trailer_url,
      // NEW: Include prompts and preferences
      originalPrompt: show.original_prompt,
      customPortraitPrompts: show.custom_portrait_prompts,
      customVideoPrompts: show.custom_video_prompts,
      customPosterPrompt: show.custom_poster_prompt,
      customTrailerPrompt: show.custom_trailer_prompt,
      videoModelId: show.video_model_id,
      videoSeconds: show.video_seconds,
      videoAspectRatio: show.video_aspect_ratio,
      videoResolution: show.video_resolution,
      trailerModel: show.trailer_model,
      // Episode format and loglines
      showFormat: show.show_format,
      episodes: show.episodes,
    };
    
    return NextResponse.json({ show: transformedShow });
  } catch (error) {
    console.error("Failed to load show:", error);
    return NextResponse.json(
      { error: "Failed to load show" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a show
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = createServerSupabaseClient();
    
    // Delete from database
    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Supabase delete error:", error);
      throw error;
    }
    
    // Delete assets from storage (best effort - don't fail if this errors)
    try {
      const { data: files } = await supabase.storage
        .from('show-assets')
        .list(id);
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${id}/${file.name}`);
        await supabase.storage
          .from('show-assets')
          .remove(filePaths);
        
        console.log(`🗑️ Deleted ${filePaths.length} assets for show ${id}`);
      }
    } catch (storageError) {
      console.warn("Failed to delete storage assets:", storageError);
      // Continue anyway - database record is deleted
    }
    
    console.log(`✅ Show ${id} deleted from Supabase`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete show:", error);
    return NextResponse.json(
      { error: "Failed to delete show" },
      { status: 500 }
    );
  }
}

