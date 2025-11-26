import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const maxDuration = 300; // 5 minutes for video generation

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
  } = body;

  if (!showId || !episodeNumber || !sectionLabel || !stillImageUrl) {
    return NextResponse.json(
      { error: "Missing required fields: showId, episodeNumber, sectionLabel, stillImageUrl" },
      { status: 400 }
    );
  }

  // Build the video prompt - similar to still prompt but for motion
  const characterList = characterNames?.length 
    ? `Characters in this scene: ${characterNames.join(", ")}.` 
    : "";
  
  const continuityNote = previousScene 
    ? `CONTINUITY: This follows from "${previousScene.slice(0, 100)}..."` 
    : "";

  const prompt = `Animate this scene from a ${genre || "dramatic"} TV series.

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

  console.log("=== CLIP GENERATION (VEO 3.1) ===");
  console.log("Show ID:", showId);
  console.log("Episode:", episodeNumber, "-", sectionLabel);
  console.log("Still Image:", stillImageUrl);
  console.log("Prompt:", prompt.slice(0, 200) + "...");

  try {
    // Call VEO 3.1 with the still image as reference
    const veoInput = {
      prompt,
      reference_images: [stillImageUrl],
      aspect_ratio: "16:9",
      duration: 8, // VEO max is 8 seconds
      resolution: "1080p",
      generate_audio: true,
    };

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
      throw new Error(`VEO 3.1 request failed: ${response.status}`);
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
      await new Promise(resolve => setTimeout(resolve, 3000));
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
      });
      result = await statusResponse.json() as typeof prediction;
      console.log("VEO status:", result.status);
    }

    if (result.status === "failed") {
      console.error("VEO generation failed:", result.error);
      throw new Error(result.error || "VEO generation failed");
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

    console.log("✅ Video generated:", videoUrl);

    // Upload to Supabase Storage
    const savedUrl = await uploadClipToStorage(
      showId,
      episodeNumber,
      sectionLabel,
      videoUrl
    );

    // Save to database
    await saveClipToDatabase(showId, episodeNumber, sectionLabel, savedUrl);

    // Return with cache busting
    return NextResponse.json({ 
      videoUrl: `${savedUrl}?t=${Date.now()}`,
      model: "veo-3.1"
    });

  } catch (error) {
    console.error("[clips] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate clip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

