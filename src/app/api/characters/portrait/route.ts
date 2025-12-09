import { NextResponse } from "next/server";
import Replicate from "replicate";
import { 
  extractSlimShowContext, 
  extractSlimCharacterContext, 
  buildStylePrompt, 
  buildCharacterPrompt,
  isRealisticStyle as checkRealisticStyle,
  type FullShowBlueprint,
  type FullCharacterDocument,
} from "@/lib/prompt-extraction";

// Helper to make API requests with retry logic for rate limiting
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited (429), wait and retry
      if (response.status === 429) {
        const errorBody = await response.text();
        let retryAfter = 10; // Default 10 seconds
        
        // Try to extract retry_after from response
        try {
          const parsed = JSON.parse(errorBody);
          if (parsed.retry_after) {
            retryAfter = Math.ceil(parsed.retry_after);
          }
        } catch {
          // Use default
        }
        
        if (attempt < maxRetries) {
          // Add some jitter to avoid thundering herd
          const waitTime = (retryAfter + Math.random() * 2) * 1000;
          console.log(`⏳ Rate limited (429). Waiting ${Math.round(waitTime/1000)}s before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Max retries exceeded
        throw new Error(`Rate limited after ${maxRetries} retries: ${errorBody}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on non-rate-limit errors
      if (!lastError.message.includes('429') && !lastError.message.includes('rate limit')) {
        throw lastError;
      }
      
      if (attempt >= maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

// Helper to retry Replicate SDK calls with rate limit handling
async function replicateWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a rate limit error (429)
      const is429 = lastError.message.includes('429') || 
                    lastError.message.includes('rate limit') ||
                    lastError.message.includes('throttled');
      
      if (is429 && attempt < maxRetries) {
        // Extract retry_after if present, default to 10s
        let retryAfter = 10;
        const match = lastError.message.match(/(\d+)s/);
        if (match) {
          retryAfter = parseInt(match[1], 10);
        }
        
        const waitTime = (retryAfter + Math.random() * 2) * 1000;
        console.log(`⏳ Rate limited (429). Waiting ${Math.round(waitTime/1000)}s before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

type PortraitBody = {
  show: unknown;
  character: unknown;
  customPrompt?: string;
  jobId?: string;
  imageModel?: "gpt-image" | "flux" | "nano-banana-pro" | "seedream";
  stylizationGuardrails?: boolean;
  // Optional seed data for extra context
  seed?: {
    gender?: string;
    age_range?: string;
    species_hint?: string;
    key_visual_trait?: string;
  };
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

// Recursively remove show title keys from an object to prevent them appearing in generated images
const removeShowTitleRecursive = (obj: unknown, showTitle?: string): unknown => {
  if (obj === null || obj === undefined) return obj;
  
  // Handle strings - check if it's a JSON string that needs parsing
  if (typeof obj === 'string') {
    // If it looks like JSON containing show_title, parse and clean it
    if (obj.includes('show_title') || obj.includes('showTitle')) {
      try {
        const parsed = JSON.parse(obj);
        const cleaned = removeShowTitleRecursive(parsed, showTitle);
        return JSON.stringify(cleaned);
      } catch {
        // Not valid JSON, return as-is but remove show title text if present
        if (showTitle) {
          return obj.replace(new RegExp(showTitle, 'gi'), '[SHOW]');
        }
        return obj;
      }
    }
    return obj;
  }
  
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => removeShowTitleRecursive(item, showTitle));
  }
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Skip any key that contains "title" or "show_id" when it looks like a title
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'show_title' || lowerKey === 'showtitle' || lowerKey === 'title') {
      continue;
    }
    // Skip show_id if it contains the show title (it should be an ID, not title)
    if (lowerKey === 'show_id' && typeof value === 'string' && value.includes(' ')) {
      continue;
    }
    // Clean the inherits field specially
    if (lowerKey === 'inherits' && typeof value === 'string') {
      result[key] = removeShowTitleRecursive(value, showTitle);
    } else {
      result[key] = removeShowTitleRecursive(value, showTitle);
    }
  }
  return result;
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
  
  const selectedModel = body.imageModel || "nano-banana-pro"; // Default to Nano Banana Pro

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

  // Get stylization guardrails setting (defaults to true for backward compatibility)
  const stylizationGuardrails = body.stylizationGuardrails !== false;
  
  // Extract slim contexts for efficient prompts
  const slimShow = extractSlimShowContext(body.show as FullShowBlueprint);
  const slimCharacter = extractSlimCharacterContext(body.character as FullCharacterDocument, body.seed);
  const isRealistic = checkRealisticStyle(slimShow);
  
  // Legacy: still support full JSON as fallback for complex cases
  // Recursively remove show_title from all nested objects to prevent it appearing in generated images
  const showTitle = slimShow.show_title;
  const showForJson = removeShowTitleRecursive(body.show, showTitle);
  const characterForJson = removeShowTitleRecursive(body.character, showTitle);
  const showJson = trimJson(showForJson);
  const characterJson = trimJson(characterForJson);

  console.log("=== PORTRAIT REQUEST DEBUG ===");
  console.log("Show title (for logging only):", slimShow.show_title);
  console.log("Style:", slimShow.style.medium);
  console.log("Is realistic:", isRealistic);
  console.log("Character:", slimCharacter.name);
  
  // Debug: Check if show title still appears in the cleaned JSONs
  if (showJson.toLowerCase().includes(slimShow.show_title.toLowerCase())) {
    console.log("⚠️ WARNING: Show title still in showJson!");
    console.log("showJson sample:", showJson.slice(0, 500));
  } else {
    console.log("✅ Show title successfully removed from showJson");
  }
  
  if (characterJson.toLowerCase().includes(slimShow.show_title.toLowerCase())) {
    console.log("⚠️ WARNING: Show title found in characterJson!");
    console.log("characterJson sample:", characterJson.slice(0, 500));
  } else {
    console.log("✅ Show title NOT in characterJson");
  }

  const prompt = (body.customPrompt || (() => {
    // Build style header using slim extraction
    let styleHeader: string[] = [];
    
    if (stylizationGuardrails && slimShow.style.medium) {
      // Guardrails ON: Enforce the production style
      styleHeader = [
        "!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!",
        "",
        buildStylePrompt(slimShow, true),
        "",
        "CRITICAL: Match the specified visual style exactly.",
        "",
        "---",
        "",
      ];
    } else if (stylizationGuardrails) {
      // Guardrails ON but no production style: Add basic stylization reminder
      styleHeader = [
        "Character portrait",
        "Use theatrical/stylized treatment.",
        "",
        "---",
        "",
      ];
    } else if (isRealistic) {
      // Guardrails OFF with realistic style: PUSH for photorealistic
      styleHeader = [
        "!! PHOTOREALISTIC CHARACTER PORTRAIT !!",
        "",
        "RENDERING APPROACH - MUST FOLLOW:",
        "- Render as a PHOTOREALISTIC portrait like a professional headshot or movie still",
        "- Use realistic human skin with natural imperfections, pores, and subtle variations",
        "- Realistic lighting: soft key light, natural fill, cinematic quality",
        "- This should look like a photograph of a real actor/person",
        "- Professional costume design with real fabric textures",
        "- Natural hair with realistic strands and movement",
        "",
        buildStylePrompt(slimShow, false),
        "",
        "---",
        "",
      ];
    } else {
      // Guardrails OFF: Flexible approach based on show aesthetic
      styleHeader = [
        "Character portrait",
        "",
        "RENDERING FREEDOM:",
        "- Match the show's intended aesthetic as described in the guidelines",
        "- If show is cinematic/realistic → render photorealistically",
        "- If show is animated/stylized → match that style",
        "- Full creative flexibility to serve the vision",
        "",
      ];
    }

    // Build requirements - conditional based on guardrails and style
    const requirements = stylizationGuardrails ? [
      "",
      "Portrait Requirements:",
      "- Match the show's visual style exactly as specified above",
      "- Focus on expressive posture, intentional wardrobe, and theatrical lighting",
      "- Every creative choice must adhere to the show's aesthetic rules",
    ] : isRealistic ? [
      "",
      "Portrait Requirements:",
      "- PHOTOREALISTIC rendering - this should look like a real person",
      "- Professional headshot or movie poster quality",
      "- Dramatic, cinematic lighting",
      "- Realistic costume and styling that matches character description",
      "- Natural skin texture, realistic eyes, authentic expression",
    ] : [
      "",
      "Portrait Requirements:",
      "- Create a character portrait that matches the show's aesthetic",
      "- Focus on expressive posture, intentional wardrobe, and professional lighting",
      "- Serve the creative vision established in the show guidelines",
    ];

    // Use slim character prompt + full JSON as detailed reference
    return [
      ...styleHeader,
      "Character Summary:",
      buildCharacterPrompt(slimCharacter),
      "",
      "Full Character Details (reference):",
      characterJson,
      "",
      "Show Aesthetic Guidelines:",
      showJson,
      ...requirements,
      "",
      "IMPORTANT: Do not add any text from the prompt or color codes to the image, unless its a text part of the character. This is supposed to be a character portrait.",
    ].join("\n");
  })());

  try {
    console.log("\n========================================");
    console.log("🎨 PORTRAIT GENERATION - FULL DEBUG");
    console.log("========================================");
    console.log("Selected image model:", selectedModel);
    console.log("Production style:", slimShow.style.medium || "not specified");
    console.log("\n--- FULL PROMPT START ---");
    console.log(prompt);
    console.log("--- FULL PROMPT END ---\n");
    
    // Check if show title appears in prompt
    if (prompt.toLowerCase().includes(slimShow.show_title.toLowerCase())) {
      console.log("⚠️ WARNING: Show title found in prompt!");
    } else {
      console.log("✅ Show title NOT found in prompt");
    }
    
    if (body.customPrompt) {
      console.log("Using custom prompt:", body.customPrompt.slice(0, 150) + "...");
    }
    
    let prediction;
    
    if (selectedModel === "flux") {
      // Use FLUX for portrait
      console.log("🎨 Using FLUX 1.1 Pro for portrait");
      prediction = await replicateWithRetry(() => 
        replicate.predictions.create({
          model: "black-forest-labs/flux-1.1-pro",
          input: {
            prompt,
            aspect_ratio: "1:1",
            output_format: "png", // PNG required for video generation input
            safety_tolerance: 2,
          },
        })
      );
    } else if (selectedModel === "nano-banana-pro") {
      // Use Nano Banana Pro via fal.ai for portrait
      console.log("🎨 Using Nano Banana Pro (fal.ai) for portrait");
      
      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        throw new Error("Missing FAL_KEY environment variable for Nano Banana Pro");
      }
      
      const falResponse = await fetchWithRetry(
        "https://fal.run/fal-ai/nano-banana-pro",
        {
          method: "POST",
          headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            aspect_ratio: "1:1",
            resolution: "2K",
            output_format: "png",
            num_images: 1,
          }),
        },
        3
      );
      
      if (!falResponse.ok) {
        const errorBody = await falResponse.text();
        console.error("Fal.ai Nano Banana Pro API error:", errorBody);
        throw new Error(`Failed to generate portrait with Nano Banana Pro: ${falResponse.status} - ${errorBody}`);
      }
      
      const falResult = await falResponse.json() as { images?: Array<{ url: string }> };
      
      if (!falResult.images || falResult.images.length === 0) {
        throw new Error("No images returned from Nano Banana Pro");
      }
      
      // Return immediately with the image URL (no polling needed - fal.ai is synchronous)
      return NextResponse.json({ 
        jobId: `fal-complete-${Date.now()}`,
        status: "succeeded",
        imageUrl: falResult.images[0].url,
      });
    } else if (selectedModel === "seedream") {
      // Use ByteDance Seedream 4.5 for portrait
      console.log("🎨 Using Seedream 4.5 for portrait");
      prediction = await replicateWithRetry(() =>
        replicate.predictions.create({
          model: "bytedance/seedream-4.5",
          input: {
            prompt,
            aspect_ratio: "1:1",
            size: "2K", // 2K resolution for video generation compatibility
          },
        })
      );
    } else {
      // Use GPT Image for portrait
      console.log("🎨 Using GPT Image 1 for portrait");
      
      // Use direct API to avoid version lookup issues (with retry for rate limiting)
      console.log("🌐 Creating GPT Image prediction with token:", `${replicateToken.slice(0, 8)}...`);
      const createResponse = await fetchWithRetry(
        "https://api.replicate.com/v1/models/openai/gpt-image-1/predictions",
        {
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
        },
        3 // Max 3 retries
      );

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
