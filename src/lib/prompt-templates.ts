import { createServerSupabaseClient } from "./supabase";

type PromptTemplates = {
  showGenerationDirective: string;
  characterExtractionDirective: string;
  characterBuildDirective: string;
  portraitBasePrompt: string;
  videoBasePrompt: string;
  posterBasePrompt: string;
  trailerBasePrompt: string;
};

// Cache templates in memory for performance
let cachedTemplates: PromptTemplates | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getPromptTemplates(): Promise<PromptTemplates> {
  // Return cached if fresh
  if (cachedTemplates && Date.now() - cacheTime < CACHE_TTL) {
    return cachedTemplates;
  }

  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', 'default')
      .single();
    
    if (error || !data) {
      console.warn("Failed to load templates from DB, using hardcoded fallbacks");
      return getHardcodedTemplates();
    }
    
    cachedTemplates = {
      showGenerationDirective: data.show_generation_directive,
      characterExtractionDirective: data.character_extraction_directive,
      characterBuildDirective: data.character_build_directive,
      portraitBasePrompt: data.portrait_base_prompt,
      videoBasePrompt: data.video_base_prompt,
      posterBasePrompt: data.poster_base_prompt,
      trailerBasePrompt: data.trailer_base_prompt,
    };
    cacheTime = Date.now();
    
    return cachedTemplates;
  } catch (error) {
    console.warn("Error loading templates:", error);
    return getHardcodedTemplates();
  }
}

// Hardcoded fallbacks if database is not set up
function getHardcodedTemplates(): PromptTemplates {
  return {
    showGenerationDirective: `You are a visual development director creating a show look bible for ANIMATION or HIGHLY STYLIZED content.
Return a single JSON object that conforms to the provided schema. Do not add properties. Infer thoughtful defaults when details are missing.

CRITICAL RULES:

1. SHOW TITLE: If the user provides a show name/title, use it EXACTLY. Otherwise, create a catchy title.

2. PRODUCTION STYLE - ABSOLUTELY CRITICAL:
   You MUST choose ONE specific animation/illustration style from the schema enum. Choose what best fits the show:
   
   FOR COMEDY/SITCOM → "Pixar-style 3D animation" or "Aardman claymation" or "Cartoon Network 2D style"
   FOR DRAMA/THRILLER → "Anime aesthetic" or "Graphic novel illustration style" or "Rotoscoped animation"
   FOR FANTASY/ADVENTURE → "Studio Ghibli hand-drawn animation" or "Disney 3D animation" or "Laika stop-motion"
   FOR KIDS SHOW → "Pixar-style 3D animation" or "2D cel animation" or "Paper cutout animation"
   FOR PRESTIGE/SERIOUS → "Arcane painterly style" or "Spider-Verse stylized 3D" or "Comic book visual style"
   FOR QUIRKY/INDIE → "Claymation (Wallace & Gromit style)" or "Stop-motion puppet animation" or "Mixed media animation"
   
   NEVER EVER choose anything with "live-action" - this leads to photorealistic results that get flagged!

Include a compelling "show_logline" and detailed "poster_description".`,
    
    characterExtractionDirective: `You are the casting director for an ANIMATED or HIGHLY STYLIZED show.`,
    
    characterBuildDirective: `You are the casting director for an ANIMATED or HIGHLY STYLIZED show.`,
    
    portraitBasePrompt: `!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!

This is a character portrait for "{SHOW_TITLE}"
Production Medium: {PRODUCTION_MEDIUM}
Visual References: {CINEMATIC_REFERENCES}
Stylization Level: {STYLIZATION_LEVEL}

CRITICAL RULES:
- DO NOT use photorealistic rendering
- DO NOT create a photo-like realistic image`,
    
    videoBasePrompt: `Produce a {DURATION}-second, {ASPECT_RATIO} cinematic showcase featuring ONLY the specified character.`,
    
    posterBasePrompt: `!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!

Show Title: "{SHOW_TITLE}"
Production Medium: {PRODUCTION_MEDIUM}`,
    
    trailerBasePrompt: `Create an iconic teaser trailer for the series "{SHOW_TITLE}".`,
  };
}

