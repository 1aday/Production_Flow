import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

type StillsRequest = {
  showId: string;
  episodeNumber: number;
  sectionLabel: string;
  sectionDescription: string;
  episodeTitle: string;
  episodeLogline: string;
  showTitle: string;
  genre?: string;
  visualStyle?: string;
  characterGridUrl?: string;
  characterNames?: string[];
  previousScene?: string; // For narrative continuity
  setting?: string; // Where the scene takes place
};

// Helper to upload image to Supabase Storage
async function uploadStillToStorage(
  imageUrl: string,
  showId: string,
  episodeNumber: number,
  sectionLabel: string
): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to download image");
    
    const imageBuffer = await response.arrayBuffer();
    const sanitizedLabel = sectionLabel.toLowerCase().replace(/\s+/g, "-");
    const fileName = `${showId}/ep${episodeNumber}-${sanitizedLabel}.png`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("episode-media")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });
    
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("episode-media")
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload still:", error);
    return null;
  }
}

// Helper to update episode_stills in database
async function saveStillToDatabase(
  showId: string,
  episodeNumber: number,
  sectionLabel: string,
  imageUrl: string
): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    
    // First get current episode_stills
    const { data: show, error: fetchError } = await supabase
      .from("shows")
      .select("episode_stills")
      .eq("id", showId)
      .single();
    
    if (fetchError) {
      console.error("Failed to fetch show:", fetchError);
      return false;
    }
    
    // Update the nested structure
    const currentStills = (show?.episode_stills as Record<string, Record<string, string>>) || {};
    const episodeStills = currentStills[episodeNumber.toString()] || {};
    episodeStills[sectionLabel] = imageUrl;
    currentStills[episodeNumber.toString()] = episodeStills;
    
    // Save back to database
    const { error: updateError } = await supabase
      .from("shows")
      .update({ 
        episode_stills: currentStills,
        updated_at: new Date().toISOString(),
      })
      .eq("id", showId);
    
    if (updateError) {
      console.error("Failed to update show:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to save still to database:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as StillsRequest;
    const {
      sectionLabel,
      sectionDescription,
      episodeTitle,
      episodeLogline,
      showTitle,
      genre,
      visualStyle,
      characterGridUrl,
      characterNames,
      previousScene,
      setting,
    } = body;

    if (!sectionDescription || !episodeTitle) {
      return NextResponse.json(
        { error: "Missing required fields: sectionDescription and episodeTitle" },
        { status: 400 }
      );
    }

    // Build character string
    const characterString = characterNames?.length 
      ? `Characters in this scene: ${characterNames.join(", ")}. Show these characters clearly, depicting their actions and emotions.`
      : "";

    // Build narrative continuity note
    const continuityNote = previousScene 
      ? `This scene follows: "${previousScene}". Maintain visual and narrative continuity from the previous scene.`
      : "";

    // Build setting description
    const settingNote = setting 
      ? `Setting: ${setting}.`
      : "";

    // Build the prompt for the still - detailed and narrative-driven
    const SAFETY_PREFIX = "If you have any hesitations about making this feel free to adjust it so its within guidelines.\n\n";
    const prompt = SAFETY_PREFIX + (characterGridUrl 
      ? `Create a detailed scene for "${sectionLabel}" of episode "${episodeTitle}":

SCENE DESCRIPTION: ${sectionDescription}

${characterString}

${settingNote}

${continuityNote}

Use the character reference sheet provided to accurately depict the correct characters. Match their appearance, clothing, and features exactly from the reference. Show clear facial expressions and body language that convey the emotion of this moment.

Genre: ${genre || "drama"}
Style: Cinematic TV production still, dramatic lighting, rich color palette, high production value, 16:9 widescreen composition. Show the environment and setting clearly.`
      : `Create a detailed scene for "${sectionLabel}" of episode "${episodeTitle}":

SCENE DESCRIPTION: ${sectionDescription}

${characterString}

${settingNote}

${continuityNote}

Show clear facial expressions and body language that convey the emotion of this moment.

Genre: ${genre || "drama"}
Style: Cinematic TV production still, dramatic lighting, rich color palette, high production value, 16:9 widescreen composition. Show the environment and setting clearly.`);

    console.log("\n========================================");
    console.log("=== STILLS GENERATION - NANO BANANA PRO ===");
    console.log("========================================");
    console.log("Show:", showTitle);
    console.log("Episode:", episodeTitle);
    console.log("Section:", sectionLabel);
    console.log("Genre:", genre);
    console.log("Character Grid URL:", characterGridUrl || "NONE");
    console.log("\n--- PROMPT ---");
    console.log(prompt);
    console.log("--- END PROMPT ---\n");

    // Build the request body
    const requestBody = {
      input: {
        prompt,
        image_input: characterGridUrl ? [characterGridUrl] : undefined,
        aspect_ratio: "16:9",
        resolution: "2K",
        output_format: "png",
        safety_filter_level: "block_only_high",
      },
    };

    console.log("--- FULL API REQUEST BODY ---");
    console.log(JSON.stringify(requestBody, null, 2));
    console.log("--- END REQUEST BODY ---\n");

    // Use Nano Banana Pro for fast generation
    const createResponse = await fetch(
      "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log("API Response Status:", createResponse.status);

    if (!createResponse.ok) {
      const errorBody = await createResponse.text();
      console.error("❌ Nano Banana Pro API ERROR:");
      console.error("Status:", createResponse.status);
      console.error("Body:", errorBody);
      throw new Error(
        `Failed to create prediction: ${createResponse.status} - ${errorBody}`
      );
    }

    const prediction = (await createResponse.json()) as {
      id: string;
      status: string;
      error?: string;
      output?: string | string[];
    };

    console.log("\n--- PREDICTION RESPONSE ---");
    console.log(JSON.stringify(prediction, null, 2));
    console.log("--- END PREDICTION RESPONSE ---\n");
    console.log("✅ Prediction created:", prediction.id);
    console.log("   Initial status:", prediction.status);

    // Poll for completion (max 60 seconds)
    let result = prediction;
    let pollCount = 0;
    const maxPolls = 30;

    while (
      (result.status === "starting" || result.status === "processing") &&
      pollCount < maxPolls
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      pollCount++;

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (pollResponse.ok) {
        result = await pollResponse.json();
        console.log(`   Poll ${pollCount}: ${result.status}`);
      }
    }

    if (result.status !== "succeeded") {
      console.error("Prediction failed or timed out:", result);
      return NextResponse.json(
        { error: result.error || "Generation timed out" },
        { status: 500 }
      );
    }

    // Extract the image URL
    let imageUrl: string | undefined;
    if (Array.isArray(result.output) && result.output.length > 0) {
      imageUrl = result.output[0];
    } else if (typeof result.output === "string") {
      imageUrl = result.output;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    console.log("✅ Still generated:", imageUrl.slice(0, 80) + "...");

    // Upload to Supabase Storage and save to database
    const { showId, episodeNumber } = body;
    let finalImageUrl = imageUrl;
    
    const storedUrl = await uploadStillToStorage(
      imageUrl,
      showId,
      episodeNumber,
      sectionLabel
    );
    
    if (storedUrl) {
      finalImageUrl = storedUrl;
      console.log("✅ Still uploaded to storage:", storedUrl.slice(0, 80) + "...");
      
      // Save reference to database
      const saved = await saveStillToDatabase(showId, episodeNumber, sectionLabel, storedUrl);
      if (saved) {
        console.log("✅ Still saved to database");
      }
    } else {
      console.warn("⚠️ Failed to upload to storage, using temporary URL");
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      sectionLabel,
      stored: !!storedUrl,
    });
  } catch (error) {
    console.error("Stills generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate still" },
      { status: 500 }
    );
  }
}

