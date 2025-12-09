import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const maxDuration = 300; // 5 minutes for video generation

const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds

// Check if error is a content safety/moderation error that should be retried
function isRetryableError(error: string | undefined): boolean {
  if (!error) return false;
  const retryablePatterns = [
    "flagged as sensitive",
    "E005",
    "content policy",
    "safety",
    "moderation",
    "inappropriate",
    "violates",
  ];
  const lowerError = error.toLowerCase();
  return retryablePatterns.some(pattern => lowerError.includes(pattern.toLowerCase()));
}

// Sleep helper with jitter for rate limiting
function sleep(ms: number): Promise<void> {
  // Add some random jitter (±20%) to avoid thundering herd
  const jitter = ms * 0.2 * (Math.random() - 0.5);
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

// Helper to sanitize prompts for video models (replaces child/kid/children with younger alternatives)
function sanitizeVideoPrompt(prompt: string): string {
  return prompt
    .replace(/\bchildren\b/gi, "young ones")
    .replace(/\bchild\b/gi, "young person")
    .replace(/\bkids\b/gi, "young ones")
    .replace(/\bkid\b/gi, "young person");
}

type ClipRequest = {
  showId: string;
  episodeNumber: number;
  sectionLabel: string;
  sectionDescription: string;
  episodeTitle: string;
  episodeLogline: string;
  genre?: string;
  stillImageUrl: string; // The still image to animate
  characterNames?: string[];
  previousScene?: string;
  customPrompt?: string; // User-provided custom prompt
};

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable." },
      { status: 500 }
    );
  }

  let body: ClipRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const {
    showId,
    episodeNumber,
    sectionLabel,
    sectionDescription,
    episodeTitle,
    episodeLogline,
    genre,
    stillImageUrl,
    characterNames,
    previousScene,
    customPrompt,
  } = body;

  if (!showId || !episodeNumber || !sectionLabel || !stillImageUrl) {
    return NextResponse.json(
      { error: "Missing required fields: showId, episodeNumber, sectionLabel, stillImageUrl" },
      { status: 400 }
    );
  }

  // Fetch the global template from database
  const supabase = createServerSupabaseClient();
  const { data: templateData } = await supabase
    .from('prompt_templates')
    .select('episode_clips_prompt')
    .eq('id', 'default')
    .single();

  // Build the video prompt - use custom if provided
  let prompt: string;
  
  if (customPrompt) {
    // Use custom prompt directly
    prompt = customPrompt;
    console.log("📝 Using CUSTOM VIDEO PROMPT");
  } else if (templateData?.episode_clips_prompt) {
    // Use the global template with variable substitution
    const characterList = characterNames?.length 
      ? `Characters in this scene: ${characterNames.join(", ")}.` 
      : "";
    
    const continuityNote = previousScene 
      ? `CONTINUITY: This follows from "${previousScene.slice(0, 100)}..."` 
      : "";
    
    prompt = templateData.episode_clips_prompt
      .replace(/{GENRE}/g, genre || "dramatic")
      .replace(/{SECTION_LABEL}/g, sectionLabel)
      .replace(/{SCENE_DESCRIPTION}/g, sectionDescription)
      .replace(/{EPISODE_TITLE}/g, episodeTitle)
      .replace(/{EPISODE_LOGLINE}/g, episodeLogline)
      .replace(/{CHARACTER_LIST}/g, characterList)
      .replace(/{CONTINUITY_NOTE}/g, continuityNote)
      .replace(/{PRODUCTION_MEDIUM}/g, "")
      .replace(/{CINEMATIC_REFERENCES}/g, "")
      .replace(/{VISUAL_TREATMENT}/g, "");
    
    console.log("📝 Using GLOBAL TEMPLATE for video prompt");
  } else {
    // Fallback to hardcoded default
    const characterList = characterNames?.length 
      ? `Characters in this scene: ${characterNames.join(", ")}.` 
      : "";
    
    const continuityNote = previousScene 
      ? `CONTINUITY: This follows from "${previousScene.slice(0, 100)}..."` 
      : "";
    
    prompt = `Animate this scene from a ${genre || "dramatic"} TV series.

SCENE: ${sectionLabel} - ${sectionDescription}

Episode: "${episodeTitle}"
Context: ${episodeLogline}

${characterList}
${continuityNote}

ANIMATION DIRECTION:
- Bring this still frame to life with subtle, cinematic motion
- Characters should have natural, expressive movements
- Camera may include slight push-ins, pans, or subtle dolly moves
- Maintain the exact visual style and composition of the source image
- Add ambient motion: breathing, blinking, environmental details
- Keep movements grounded and realistic - no exaggerated motions
- Match the emotional tone of the scene

This is a single scene clip that will be part of a larger episode. Make it feel like a premium streaming series.`;
  }

  console.log("=== CLIP GENERATION (VEO 3.1) ===");
  console.log("Show ID:", showId);
  console.log("Episode:", episodeNumber, "-", sectionLabel);
  console.log("Still Image:", stillImageUrl);
  console.log("Prompt:", prompt.slice(0, 200) + "...");

  // VEO input configuration
  const veoInput = {
    prompt: sanitizeVideoPrompt(prompt),
    reference_images: [stillImageUrl],
    aspect_ratio: "16:9",
    duration: 8, // VEO max is 8 seconds
    resolution: "1080p",
    generate_audio: true,
  };

  let lastError: string = "Unknown error";
  let attempt = 0;

  // Retry loop for content moderation errors
  while (attempt < MAX_RETRIES) {
    attempt++;
    console.log(`\n🎬 Attempt ${attempt}/${MAX_RETRIES} for ${sectionLabel}...`);

    try {
      console.log("VEO 3.1 input:", JSON.stringify(veoInput, null, 2));

      const response = await fetch("https://api.replicate.com/v1/models/google/veo-3.1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: veoInput }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("VEO 3.1 request failed:", response.status, errorText);
        lastError = `VEO 3.1 request failed: ${response.status}`;
        
        // Check if this is a rate limit error - wait longer
        if (response.status === 429) {
          console.log("⏳ Rate limited, waiting 30 seconds...");
          await sleep(30000);
          continue;
        }
        
        throw new Error(lastError);
      }

      const prediction = await response.json() as { 
        id: string; 
        status: string; 
        error?: string; 
        output?: unknown 
      };
      console.log("VEO prediction created:", prediction.id);

      // Poll for completion
      let result = prediction;
      while (result.status === "starting" || result.status === "processing") {
        await sleep(3000);
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
        });
        
        // Check if response is OK and is JSON
        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error("VEO status poll error:", statusResponse.status, errorText.slice(0, 200));
          throw new Error(`Failed to check VEO status: ${statusResponse.status}`);
        }
        
        const contentType = statusResponse.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const errorText = await statusResponse.text();
          console.error("VEO status poll returned non-JSON:", contentType, errorText.slice(0, 200));
          throw new Error("VEO status check returned invalid response. Please try again.");
        }
        
        result = await statusResponse.json() as typeof prediction;
        console.log("VEO status:", result.status);
      }

      if (result.status === "failed") {
        lastError = result.error || "VEO generation failed";
        console.error(`❌ VEO generation failed (attempt ${attempt}):`, lastError);
        
        // Check if this is a retryable content moderation error
        if (isRetryableError(result.error) && attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(1.5, attempt - 1); // Exponential backoff
          console.log(`🔄 Content flagged, retrying in ${Math.round(delay / 1000)}s... (attempt ${attempt}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }
        
        throw new Error(lastError);
      }

      // Extract video URL
      let videoUrl: string | undefined;
      if (typeof result.output === "string") {
        videoUrl = result.output;
      } else if (Array.isArray(result.output) && result.output.length > 0) {
        videoUrl = result.output[0] as string;
      }

      if (!videoUrl) {
        throw new Error("VEO returned no video output");
      }

      console.log(`✅ Video generated on attempt ${attempt}:`, videoUrl);

      // Upload to Supabase Storage
      const savedUrl = await uploadClipToStorage(
        showId,
        episodeNumber,
        sectionLabel,
        videoUrl
      );

      // Save to database
      await saveClipToDatabase(showId, episodeNumber, sectionLabel, savedUrl);

      // Return with cache busting and attempt info
      return NextResponse.json({ 
        videoUrl: `${savedUrl}?t=${Date.now()}`,
        model: "veo-3.1",
        attempts: attempt
      });

    } catch (error) {
      lastError = error instanceof Error ? error.message : "Failed to generate clip";
      console.error(`[clips] Error on attempt ${attempt}:`, lastError);
      
      // If it's a retryable error and we have attempts left, continue
      if (isRetryableError(lastError) && attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(1.5, attempt - 1);
        console.log(`🔄 Retrying in ${Math.round(delay / 1000)}s... (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }
      
      // Non-retryable error or out of attempts
      break;
    }
  }

  // All attempts exhausted
  console.error(`❌ All ${MAX_RETRIES} attempts failed for ${sectionLabel}`);
  return NextResponse.json({ 
    error: `Failed after ${attempt} attempts: ${lastError}`,
    attempts: attempt
  }, { status: 500 });
}

async function uploadClipToStorage(
  showId: string,
  episodeNumber: number,
  sectionLabel: string,
  videoUrl: string
): Promise<string> {
  const supabase = await createServerSupabaseClient();
  
  // Download the video from Replicate
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error("Failed to download generated video");
  }
  
  const videoBuffer = await response.arrayBuffer();
  const fileName = `${showId}/ep${episodeNumber}-${sectionLabel.toLowerCase().replace(/\s+/g, '')}.mp4`;
  
  // Upload to Supabase Storage (upsert to overwrite if exists)
  const { error: uploadError } = await supabase.storage
    .from('episode-media')
    .upload(fileName, videoBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error(`Failed to upload video: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('episode-media')
    .getPublicUrl(fileName);

  return publicUrl;
}

async function saveClipToDatabase(
  showId: string,
  episodeNumber: number,
  sectionLabel: string,
  videoUrl: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  // Get current episode_clips
  const { data: show, error: fetchError } = await supabase
    .from('shows')
    .select('episode_clips')
    .eq('id', showId)
    .single();

  if (fetchError) {
    console.error("Failed to fetch show:", fetchError);
    throw new Error("Failed to fetch show data");
  }

  // Build updated clips structure
  const currentClips = (show?.episode_clips as Record<string, Record<string, string>>) || {};
  const episodeClips = currentClips[episodeNumber.toString()] || {};
  
  const updatedClips = {
    ...currentClips,
    [episodeNumber.toString()]: {
      ...episodeClips,
      [sectionLabel]: videoUrl,
    },
  };

  // Save back to database
  const { error: updateError } = await supabase
    .from('shows')
    .update({ episode_clips: updatedClips })
    .eq('id', showId);

  if (updateError) {
    console.error("Failed to update database:", updateError);
    throw new Error("Failed to save clip to database");
  }

  console.log("✅ Clip saved to database:", showId, episodeNumber, sectionLabel);
}

