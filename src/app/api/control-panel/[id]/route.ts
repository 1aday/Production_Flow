import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Load prompts for a show
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = createServerSupabaseClient();
    
    const { data: show, error } = await supabase
      .from('shows')
      .select('id, title, original_prompt, custom_portrait_prompts, custom_video_prompts, custom_poster_prompt, custom_trailer_prompt, character_seeds')
      .eq('id', id)
      .single();
    
    if (error || !show) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }
    
    const prompts = {
      id: show.id,
      title: show.title,
      originalPrompt: show.original_prompt,
      customPortraitPrompts: show.custom_portrait_prompts || {},
      customVideoPrompts: show.custom_video_prompts || {},
      customPosterPrompt: show.custom_poster_prompt,
      customTrailerPrompt: show.custom_trailer_prompt,
      characterSeeds: show.character_seeds || [],
    };
    
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Failed to load prompts:", error);
    return NextResponse.json(
      { error: "Failed to load prompts" },
      { status: 500 }
    );
  }
}

// PATCH - Update prompts for a show
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    const {
      originalPrompt,
      customPortraitPrompts,
      customVideoPrompts,
      customPosterPrompt,
      customTrailerPrompt,
    } = body;
    
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('shows')
      .update({
        original_prompt: originalPrompt,
        custom_portrait_prompts: customPortraitPrompts || {},
        custom_video_prompts: customVideoPrompts || {},
        custom_poster_prompt: customPosterPrompt,
        custom_trailer_prompt: customTrailerPrompt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
    
    console.log(`✅ Prompts updated for show ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update prompts:", error);
    return NextResponse.json(
      { error: "Failed to update prompts" },
      { status: 500 }
    );
  }
}

