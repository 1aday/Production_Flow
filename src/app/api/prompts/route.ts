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
    } = body;
    
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('prompt_templates')
      .update({
        show_generation_directive: showGenerationDirective,
        character_extraction_directive: characterExtractionDirective,
        character_build_directive: characterBuildDirective,
        portrait_base_prompt: portraitBasePrompt,
        video_base_prompt: videoBasePrompt,
        poster_base_prompt: posterBasePrompt,
        trailer_base_prompt: trailerBasePrompt,
        updated_at: new Date().toISOString(),
      })
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

