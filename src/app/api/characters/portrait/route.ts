import { NextResponse } from "next/server";
import Replicate from "replicate";

type PortraitBody = {
  show: unknown;
  character: unknown;
  customPrompt?: string;
  jobId?: string;
  imageModel?: "gpt-image" | "flux";
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_JSON_LENGTH = 20000;

const trimJson = (value: unknown, limit = MAX_JSON_LENGTH) => {
  try {
    const text = JSON.stringify(value);
    if (text.length <= limit) return text;
    return `${text.slice(0, limit - 1)}…`;
  } catch {
    return "";
  }
};

export const maxDuration = 60; // Reduced to 60s since we return immediately

export async function POST(request: Request) {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  console.log("🔑 Environment check:");
  console.log("   REPLICATE_API_TOKEN:", replicateToken ? `${replicateToken.slice(0, 8)}...` : "❌ MISSING");
  console.log("   OPENAI_API_KEY:", openaiKey ? `${openaiKey.slice(0, 8)}...` : "❌ MISSING");
  
  if (!replicateToken) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable." },
      { status: 500 }
    );
  }

  if (!openaiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: PortraitBody;
  try {
    body = (await request.json()) as PortraitBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }
  
  const selectedModel = body.imageModel || "gpt-image"; // Default to GPT Image

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Portrait generation requires 'show' and 'character' payloads." },
      { status: 400 }
    );
  }

  if (typeof body.show !== "object" || body.show === null) {
    return NextResponse.json(
      { error: "Portrait generation requires the show blueprint object." },
      { status: 400 }
    );
  }

  if (typeof body.character !== "object" || body.character === null) {
    return NextResponse.json(
      { error: "Portrait generation requires the character blueprint object." },
      { status: 400 }
    );
  }

  const showJson = trimJson(body.show);
  const characterJson = trimJson(body.character);
  
  // Extract production style for style guidance
  const productionStyle = (body.show as { production_style?: {
    medium?: string;
    cinematic_references?: string[];
    visual_treatment?: string;
    stylization_level?: string;
  } }).production_style;

  console.log("=== PORTRAIT REQUEST DEBUG ===");
  console.log("body.show exists:", !!body.show);
  if (body.show) {
    console.log("body.show.show_title:", (body.show as { show_title?: string }).show_title);
  }
  
  const showTitle = (body.show as { show_title?: string }).show_title || "the show";
  console.log("Extracted showTitle for portrait:", showTitle);

  const prompt = body.customPrompt || (() => {
    // Build prominent style header
    const styleHeader = productionStyle ? [
      "!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!",
      "",
      `This is a character portrait for "${showTitle}"`,
      `Production Medium: ${productionStyle.medium || 'Stylized cinematic'}`,
      `Visual References: ${(productionStyle.cinematic_references || []).join(' + ')}`,
      `Stylization Level: ${productionStyle.stylization_level || 'moderately stylized'}`,
      "",
      `Style Treatment: ${productionStyle.visual_treatment || 'Cinematic theatrical style'}`,
      "",
      "CRITICAL RULES:",
      "- DO NOT use photorealistic rendering",
      "- DO NOT create a photo-like realistic image", 
      "- MUST match the specified visual style (animation style OR cinematic/theatrical treatment)",
      "- Use artistic interpretation, NOT documentary realism",
      "",
      "---",
      "",
    ] : [
      "!! CRITICAL - DO NOT CREATE PHOTOREALISTIC IMAGE !!",
      "",
      `Create a stylized character portrait for "${showTitle}"`,
      "Use cinematic/theatrical treatment, NOT photorealistic rendering.",
      "",
      "---",
      "",
    ];

    return [
      ...styleHeader,
      "Character Details:",
      characterJson,
      "",
      "Show Aesthetic Guidelines:",
      showJson,
      "",
      "Portrait Requirements:",
      "- Match the show's visual style exactly as specified above",
      "- Focus on expressive posture, intentional wardrobe, and theatrical lighting",
      "- Every creative choice must adhere to the show's aesthetic rules",
    ].join("\n");
  })();

  try {
    console.log("🎨 Creating portrait prediction...");
    console.log("Show title:", showTitle);
    console.log("Production style:", productionStyle?.medium || "not specified");
    console.log("Selected image model:", selectedModel);
    console.log("Prompt preview (first 300 chars):", prompt.slice(0, 300) + "...");
    if (body.customPrompt) {
      console.log("Using custom prompt:", body.customPrompt.slice(0, 150) + "...");
    }
    
    let prediction;
    
    if (selectedModel === "flux") {
      // Use FLUX for portrait
      console.log("🎨 Using FLUX 1.1 Pro for portrait");
      prediction = await replicate.predictions.create({
        model: "black-forest-labs/flux-1.1-pro",
        input: {
          prompt,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 95,
          safety_tolerance: 2,
        },
      });
    } else {
      // Use GPT Image for portrait
      console.log("🎨 Using GPT Image 1 for portrait");
      
      // Use direct API to avoid version lookup issues
      console.log("🌐 Creating GPT Image prediction with token:", `${replicateToken.slice(0, 8)}...`);
      const createResponse = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt,
            quality: "medium",
            aspect_ratio: "1:1",
            background: "auto",
            number_of_images: 1,
            moderation: "low",
            openai_api_key: openaiKey,
          },
        }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error("GPT Image API error:", errorBody);
        throw new Error(`Failed to create GPT Image prediction: ${createResponse.status} - ${errorBody}`);
      }

      prediction = await createResponse.json() as { id: string; status: string; error?: string; output?: unknown; urls?: Record<string, string> };
      
      console.log("📦 Full GPT Image prediction response:");
      console.log("   ID:", prediction.id);
      console.log("   Status:", prediction.status);
      console.log("   URLs:", prediction.urls);
      console.log("   Full response:", JSON.stringify(prediction).slice(0, 500));
      
      // IMMEDIATE TEST: Try to query this prediction right after creation
      console.log("🔍 Testing immediate queryability with SAME token:", `${replicateToken.slice(0, 8)}...`);
      const testResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Bearer ${replicateToken}`,
        },
      });
      console.log("   Immediate query status:", testResponse.status);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log("   ✅ Prediction IS queryable! Status:", testData.status);
      } else {
        const errorText = await testResponse.text();
        console.log("   ❌ Prediction NOT queryable! Error:", errorText);
        console.log("   Token used for query:", `${replicateToken.slice(0, 8)}...`);
      }
    }

    console.log("✅ Portrait prediction created:", prediction.id);
    console.log("   Status:", prediction.status);
    
    // Return the Replicate prediction ID as the jobId
    return NextResponse.json({ 
      jobId: prediction.id, 
      status: prediction.status || "starting"
    });
    
  } catch (error) {
    console.error("❌❌❌ [characters/portrait] Prediction creation error ❌❌❌");
    console.error("Error type:", typeof error);
    console.error("Error object:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    const message =
      error instanceof Error ? error.message : "Failed to create portrait prediction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
