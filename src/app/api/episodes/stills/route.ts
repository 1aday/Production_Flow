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
  customPrompt?: string; // User-provided custom prompt
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
      customPrompt,
    } = body;

    if (!sectionDescription || !episodeTitle) {
      return NextResponse.json(
        { error: "Missing required fields: sectionDescription and episodeTitle" },
        { status: 400 }
      );
    }

    // Build the prompt - use custom prompt if provided, otherwise use template/default
    // Fetch the global template from database
    const supabase = createServerSupabaseClient();
    const { data: templateData } = await supabase
      .from('prompt_templates')
      .select('episode_stills_prompt')
      .eq('id', 'default')
      .single();
    
    let prompt: string;
    
    if (customPrompt) {
      // Use custom prompt directly
      prompt = customPrompt;
      console.log("📝 Using CUSTOM PROMPT");
    } else if (templateData?.episode_stills_prompt) {
      // Use the global template with variable substitution
      const characterString = characterNames?.length 
        ? `Characters in this scene: ${characterNames.join(", ")}. Show these characters clearly, depicting their actions and emotions.`
        : "";

      const continuityNote = previousScene 
        ? `This scene follows: "${previousScene}". Maintain visual and narrative continuity from the previous scene.`
        : "";

      const settingNote = setting 
        ? `Setting: ${setting}.`
        : genre 
          ? `Setting: A ${genre.toLowerCase()} TV series.`
          : "";

      prompt = templateData.episode_stills_prompt
        .replace(/{SECTION_LABEL}/g, sectionLabel)
        .replace(/{EPISODE_TITLE}/g, episodeTitle)
        .replace(/{SCENE_DESCRIPTION}/g, sectionDescription)
        .replace(/{CHARACTER_LIST}/g, characterString)
        .replace(/{SETTING_NOTE}/g, settingNote)
        .replace(/{CONTINUITY_NOTE}/g, continuityNote)
        .replace(/{GENRE}/g, genre || "drama")
        .replace(/{PRODUCTION_MEDIUM}/g, "")
        .replace(/{CINEMATIC_REFERENCES}/g, "")
        .replace(/{VISUAL_TREATMENT}/g, "");
      
      console.log("📝 Using GLOBAL TEMPLATE for stills prompt");
    } else {
      // Fallback to hardcoded default
      const characterString = characterNames?.length 
        ? `Characters in this scene: ${characterNames.join(", ")}. Show these characters clearly, depicting their actions and emotions.`
        : "";

      const continuityNote = previousScene 
        ? `This scene follows: "${previousScene}". Maintain visual and narrative continuity from the previous scene.`
        : "";

      const settingNote = setting 
        ? `Setting: ${setting}.`
        : "";

      prompt = (characterGridUrl 
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
    }

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

    // Use fal.ai for Nano Banana Pro
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: "Missing FAL_KEY environment variable for Nano Banana Pro" },
        { status: 500 }
      );
    }

    // Note: fal.ai Nano Banana Pro doesn't support image input for reference
    if (characterGridUrl) {
      console.log("Note: fal.ai Nano Banana Pro doesn't support image reference, using prompt only");
    }

    const falRequestBody = {
      prompt,
      aspect_ratio: "16:9",
      resolution: "2K",
      output_format: "png",
      num_images: 1,
    };

    console.log("--- FULL API REQUEST BODY (fal.ai) ---");
    console.log(JSON.stringify(falRequestBody, null, 2));
    console.log("--- END REQUEST BODY ---\n");

    // Use Nano Banana Pro via fal.ai for fast generation
    const falResponse = await fetch(
      "https://fal.run/fal-ai/nano-banana-pro",
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(falRequestBody),
      }
    );

    console.log("API Response Status:", falResponse.status);

    if (!falResponse.ok) {
      const errorBody = await falResponse.text();
      console.error("❌ Fal.ai Nano Banana Pro API ERROR:");
      console.error("Status:", falResponse.status);
      console.error("Body:", errorBody);
      throw new Error(
        `Failed to generate still: ${falResponse.status} - ${errorBody}`
      );
    }

    const falResult = (await falResponse.json()) as {
      images?: Array<{ url: string }>;
      description?: string;
    };

    console.log("\n--- FAL.AI RESPONSE ---");
    console.log("Images count:", falResult.images?.length || 0);
    console.log("--- END RESPONSE ---\n");
    console.log("✅ Nano Banana Pro (fal.ai) completed");

    // Extract the image URL
    let imageUrl: string | undefined;
    if (falResult.images && falResult.images.length > 0) {
      imageUrl = falResult.images[0].url;
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

