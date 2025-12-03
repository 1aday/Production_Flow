import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET - Load global prompt templates
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', 'default')
      .single();
    
    if (error || !data) {
      console.error("Failed to load templates:", error);
      return NextResponse.json(
        { error: "Templates not found. Run GLOBAL_TEMPLATES_SETUP.sql first." },
        { status: 404 }
      );
    }
    
    const templates = {
      id: data.id,
      version: data.version,
      showGenerationDirective: data.show_generation_directive,
      characterExtractionDirective: data.character_extraction_directive,
      characterBuildDirective: data.character_build_directive,
      portraitBasePrompt: data.portrait_base_prompt,
      videoBasePrompt: data.video_base_prompt,
      posterBasePrompt: data.poster_base_prompt,
      trailerBasePrompt: data.trailer_base_prompt,
      episodeStillsPrompt: data.episode_stills_prompt || '',
      episodeClipsPrompt: data.episode_clips_prompt || '',
      updatedAt: data.updated_at,
    };
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to load templates:", error);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}

// PATCH - Update global prompt templates
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      showGenerationDirective,
      characterExtractionDirective,
      characterBuildDirective,
      portraitBasePrompt,
      videoBasePrompt,
      posterBasePrompt,
      trailerBasePrompt,
      episodeStillsPrompt,
      episodeClipsPrompt,
    } = body;
    
    const supabase = createServerSupabaseClient();
    
    // Build update object, only including defined fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (showGenerationDirective !== undefined) updateData.show_generation_directive = showGenerationDirective;
    if (characterExtractionDirective !== undefined) updateData.character_extraction_directive = characterExtractionDirective;
    if (characterBuildDirective !== undefined) updateData.character_build_directive = characterBuildDirective;
    if (portraitBasePrompt !== undefined) updateData.portrait_base_prompt = portraitBasePrompt;
    if (videoBasePrompt !== undefined) updateData.video_base_prompt = videoBasePrompt;
    if (posterBasePrompt !== undefined) updateData.poster_base_prompt = posterBasePrompt;
    if (trailerBasePrompt !== undefined) updateData.trailer_base_prompt = trailerBasePrompt;
    if (episodeStillsPrompt !== undefined) updateData.episode_stills_prompt = episodeStillsPrompt;
    if (episodeClipsPrompt !== undefined) updateData.episode_clips_prompt = episodeClipsPrompt;
    
    const { error } = await supabase
      .from('prompt_templates')
      .update(updateData)
      .eq('id', 'default');
    
    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
    
    console.log("✅ Global prompt templates updated");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update templates:", error);
    return NextResponse.json(
      { error: "Failed to update templates" },
      { status: 500 }
    );
  }
}

