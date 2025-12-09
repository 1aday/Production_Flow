import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60;

type RequestBody = {
  prompt: string; // Full prompt with style guide
  characterImageUrl: string;
  imageModel?: "gpt-image" | "flux" | "nano-banana-pro" | "seedream"; // Selected image model
  stylizationGuardrails?: boolean; // Whether to enforce stylization
  showData?: {
    show_title?: string;
    production_style?: {
      medium?: string;
      cinematic_references?: string[];
      visual_treatment?: string;
      stylization_level?: string;
    };
    visual_aesthetics?: {
      goal?: string;
      color?: {
        palette_bias?: string;
        anchor_hex?: string[];
      };
      lighting?: {
        temperature_model?: string;
        key?: string;
      };
      composition?: {
        symmetry_bias?: string;
        color_blocking?: string;
      };
    };
  };
  // Legacy support
  logline?: string;
};

const resolveUrl = async (value: unknown): Promise<string | undefined> => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return undefined;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = await resolveUrl(entry);
      if (candidate) return candidate;
    }
    return undefined;
  }
  if (typeof value === "function") {
    const maybe = (value as () => unknown)();
    if (typeof maybe === "string") return maybe;
    if (maybe && typeof (maybe as Promise<unknown>).then === "function") {
      const awaited = await (maybe as Promise<unknown>);
      return resolveUrl(awaited);
    }
    return undefined;
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if ("url" in objectValue) {
      return resolveUrl(objectValue.url);
    }
    if ("output" in objectValue) {
      return resolveUrl(objectValue.output);
    }
  }
  return undefined;
};

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as RequestBody;
    const { prompt, logline, characterImageUrl, imageModel, stylizationGuardrails: guardrailsSetting, showData } = body;

    // Use prompt if provided, otherwise fall back to logline (legacy)
    const userPrompt = prompt || logline;
    
    // Get stylization guardrails setting (defaults to true for backward compatibility)
    const stylizationGuardrails = guardrailsSetting !== false;
    
    // Default to Nano Banana Pro (fast and good quality)
    const selectedModel = imageModel || "nano-banana-pro";

    if (!userPrompt || !characterImageUrl) {
      return NextResponse.json(
        { error: "Missing required fields: prompt and characterImageUrl" },
        { status: 400 }
      );
    }

    const replicate = new Replicate({ auth: token });

    console.log("=== LIBRARY POSTER DEBUG ===");
    console.log("Has prompt field:", !!prompt);
    console.log("Has logline field (legacy):", !!logline);
    console.log("Has characterImageUrl:", !!characterImageUrl);
    console.log("characterImageUrl value:", characterImageUrl?.slice(0, 100));
    console.log("Stylization Guardrails:", stylizationGuardrails);
    console.log("showData exists:", !!showData);
    console.log("showData type:", typeof showData);
    console.log("showData keys:", showData ? Object.keys(showData).slice(0, 20) : []);
    
    // Extract show title - handle different possible field names
    let showTitle = "Untitled Show";
    if (showData) {
      // Log what we're checking
      console.log("showData.show_title:", showData.show_title);
      console.log("showData[show_title] type:", typeof showData.show_title);
      
      // Try different field names
      showTitle = (showData.show_title || 
                   (showData as unknown as Record<string, string>).title || 
                   (showData as unknown as Record<string, string>).showTitle || 
                   "Untitled Show");
    }
    console.log("✅ Final extracted showTitle:", showTitle);
    
    // Extract production style
    const productionStyle = showData?.production_style;
    console.log("Production style exists:", !!productionStyle);
    
    if (!characterImageUrl) {
      return NextResponse.json(
        { error: "Missing characterImageUrl - portrait grid is required for library poster" },
        { status: 400 }
      );
    }
    
    // Determine if the production style is cinematic/realistic
    const isRealisticStyle = productionStyle?.stylization_level === 'cinematic_realistic' ||
      productionStyle?.stylization_level === 'slightly_stylized' ||
      productionStyle?.medium?.toLowerCase().includes('live-action') ||
      productionStyle?.medium?.toLowerCase().includes('photorealistic') ||
      productionStyle?.medium?.toLowerCase().includes('cinematic') ||
      productionStyle?.medium?.toLowerCase().includes('documentary') ||
      productionStyle?.medium?.toLowerCase().includes('prestige');
      
    console.log("Is realistic style:", isRealisticStyle);

    // Build style guidance - only add restrictions if guardrails are ON
    let styleGuidance = "";
    
    if (stylizationGuardrails && productionStyle) {
      // Guardrails ON: Enforce the production style
      styleGuidance = `

VISUAL STYLE (CRITICAL - Match exactly):
Medium: ${productionStyle.medium}
References: ${(productionStyle.cinematic_references || []).join(', ')}
Treatment: ${productionStyle.visual_treatment}
Stylization: ${productionStyle.stylization_level}

IMPORTANT: Match this exact visual style.`;
    } else if (!stylizationGuardrails && productionStyle && isRealisticStyle) {
      // Guardrails OFF with realistic style: PUSH for photorealistic
      styleGuidance = `

!! PHOTOREALISTIC RENDERING - CRITICAL !!
This is a LIVE-ACTION / CINEMATIC show. Create a photorealistic movie poster.

Visual Style: ${productionStyle.medium}
References: ${(productionStyle.cinematic_references || []).join(', ')}
Treatment: ${productionStyle.visual_treatment}

RENDERING REQUIREMENTS:
- Render as a PHOTOREALISTIC Hollywood movie poster
- Characters should look like REAL ACTORS
- Use cinematic, dramatic lighting (think movie poster photography)
- Professional photography quality - this should look like a real film advertisement
- Realistic skin textures, hair, costumes, and environments
- High production value, theatrical release quality`;
    } else if (!stylizationGuardrails) {
      // Guardrails OFF: Flexible approach based on show aesthetic
      styleGuidance = `

RENDERING FREEDOM:
- Match the show's intended aesthetic as described
- If show is cinematic/realistic → render photorealistically
- If show is animated/stylized → match that artistic style
- Full creative flexibility to serve the vision`;
    }
    
    // Build poster requirements based on guardrails
    let posterRequirements = "";
    
    if (stylizationGuardrails) {
      // Guardrails ON: Use theatrical language
      posterRequirements = `
CRITICAL POSTER REQUIREMENTS:

1. SHOW TITLE: The poster MUST prominently display "${showTitle}" in large, beautiful, bold typography
   - Typography should be elegant, theatrical, and eye-catching
   - Title should be one of the most prominent elements of the design
   - Font choice should match the show's aesthetic and tone
   - Consider cinematic title treatment (gradients, shadows, artistic styling)

2. PREMIUM POSTER DESIGN:
   - Modern cinematic aesthetic with premium typography
   - Character-focused composition using the provided character reference images
   - Moody atmospheric background that sets the tone
   - Premium quality, theatrical release aesthetic
   - Portrait orientation 2:3 aspect ratio
   - High contrast, rich colors, professional color grading
   - Award-winning poster design

3. COMPOSITION:
   - Characters from the reference image should be featured prominently
   - Create visual hierarchy with title and characters
   - Leave strategic space for the title typography
   - Balance between character focus and atmospheric mood

Remember: The show title "${showTitle}" MUST be clearly visible with beautiful typography!`;
    } else {
      // Guardrails OFF: Use neutral language
      posterRequirements = `
CRITICAL POSTER REQUIREMENTS:

1. SHOW TITLE: The poster MUST prominently display "${showTitle}" in large, beautiful, bold typography
   - Typography should be elegant and eye-catching
   - Title should be one of the most prominent elements of the design
   - Font choice should match the show's aesthetic and tone
   - Consider professional title treatment (gradients, shadows, effects)

2. PROFESSIONAL POSTER DESIGN:
   - High-quality production poster
   - Character-focused composition using the provided character reference images
   - Atmospheric background that sets the tone and mood
   - Portrait orientation 2:3 aspect ratio
   - Professional color grading and lighting
   - Polished, compelling poster design

3. COMPOSITION:
   - Characters from the reference image should be featured prominently
   - Create visual hierarchy with title and characters
   - Leave strategic space for the title typography
   - Balance between character focus and atmospheric mood

Remember: The show title "${showTitle}" MUST be clearly visible with beautiful typography!`;
    }
    
    // Build the final poster prompt
    const posterPrompt = `${userPrompt}${styleGuidance}${posterRequirements}`;

    console.log("\n=== LIBRARY POSTER GENERATION ===");
    console.log("✅ Show Title Being Used:", showTitle);
    console.log("✅ Character Grid URL:", characterImageUrl.slice(0, 100) + "...");
    console.log("✅ Selected Image Model:", selectedModel);
    console.log("✅ User Prompt Length:", userPrompt.length);
    console.log("✅ Final Poster Prompt Length:", posterPrompt.length);
    console.log("\n--- POSTER PROMPT PREVIEW (first 600 chars) ---");
    console.log(posterPrompt.slice(0, 600) + "...");
    console.log("--- END PROMPT PREVIEW ---");
    console.log("\n🎨 Sending request to GPT Image...");
    console.log("   aspect_ratio: 2:3");
    console.log("   input_images: [character grid URL]");
    console.log("   input_fidelity: high");
    console.log("   quality: high\n");

    let result;
    
    if (selectedModel === "gpt-image") {
      // Use GPT Image with reference image
      console.log("🎨 Using GPT Image 1 for library poster");
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY environment variable");
      }
      
      // Use direct API to ensure proper array handling
      const createResponse = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: posterPrompt,
            quality: "medium",
            aspect_ratio: "2:3", // Portrait - valid GPT Image aspect ratio
            input_images: [characterImageUrl], // Reference image array
            input_fidelity: "high", // Match character features closely
            number_of_images: 1,
            moderation: "low",
            openai_api_key: process.env.OPENAI_API_KEY,
          },
        }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error("GPT Image API error:", errorBody);
        throw new Error(`Failed to create GPT Image prediction: ${createResponse.status} - ${errorBody}`);
      }

      const prediction = await createResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("✅ GPT Image prediction created:", prediction.id);
      console.log("   Initial status:", prediction.status);

      // Poll for completion
      let gptResult = prediction;
      let pollCount = 0;
      while (gptResult.status === "starting" || gptResult.status === "processing") {
        pollCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${gptResult.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        // Check if response is OK and is JSON
        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error("Status poll error:", statusResponse.status, errorText.slice(0, 200));
          throw new Error(`Failed to check poster status: ${statusResponse.status}`);
        }
        
        const contentType = statusResponse.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const errorText = await statusResponse.text();
          console.error("Status poll returned non-JSON:", contentType, errorText.slice(0, 200));
          throw new Error("Poster status check returned invalid response. Please try again.");
        }
        
        gptResult = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
        console.log(`   Poll ${pollCount}: ${gptResult.status}`);
      }

      console.log(`✅ GPT Image completed after ${pollCount} polls`);
      console.log("   Final status:", gptResult.status);

      if (gptResult.status === "failed") {
        console.error("❌ GPT Image generation failed:", gptResult.error);
        throw new Error(gptResult.error || "GPT Image generation failed");
      }

      result = gptResult.output;
      console.log("   Output type:", typeof result);
      console.log("   Output preview:", JSON.stringify(result).slice(0, 200));
    } else if (selectedModel === "nano-banana-pro") {
      // Use Nano Banana Pro /edit endpoint via fal.ai for library poster (with character reference)
      console.log("🎨 Using Nano Banana Pro /edit (fal.ai) for library poster");
      
      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        throw new Error("Missing FAL_KEY environment variable for Nano Banana Pro");
      }
      
      console.log("   Using character grid as reference image:", characterImageUrl.slice(0, 60) + "...");

      const falResponse = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
        method: "POST",
        headers: {
          "Authorization": `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: posterPrompt,
          image_urls: [characterImageUrl], // Use character grid as reference
          aspect_ratio: "2:3",
          resolution: "2K",
          output_format: "png",
          num_images: 1,
        }),
      });

      if (!falResponse.ok) {
        const errorBody = await falResponse.text();
        console.error("Fal.ai Nano Banana Pro /edit API error:", errorBody);
        throw new Error(`Failed to generate library poster with Nano Banana Pro /edit: ${falResponse.status} - ${errorBody}`);
      }

      const falResult = await falResponse.json() as { images?: Array<{ url: string }> };
      console.log("✅ Nano Banana Pro /edit (fal.ai) completed");
      
      if (!falResult.images || falResult.images.length === 0) {
        throw new Error("No images returned from Nano Banana Pro /edit");
      }
      
      result = falResult.images[0].url;
      console.log("   Output URL:", (result as string).slice(0, 100) + "...");
    } else if (selectedModel === "seedream") {
      // Use Seedream 4.5 for library poster
      console.log("🎨 Using Seedream 4.5 for library poster");
      
      // Use direct API
      const createResponse = await fetch("https://api.replicate.com/v1/models/bytedance/seedream-4.5/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: posterPrompt,
            image_input: [characterImageUrl], // Reference image array
            aspect_ratio: "2:3",
            size: "2K",
          },
        }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error("Seedream 4.5 API error:", errorBody);
        throw new Error(`Failed to create Seedream 4.5 prediction: ${createResponse.status} - ${errorBody}`);
      }

      const prediction = await createResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("✅ Seedream 4.5 prediction created:", prediction.id);
      console.log("   Initial status:", prediction.status);

      // Poll for completion
      let seedreamResult = prediction;
      let pollCount = 0;
      while (seedreamResult.status === "starting" || seedreamResult.status === "processing") {
        pollCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${seedreamResult.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error("Status poll error:", statusResponse.status, errorText.slice(0, 200));
          throw new Error(`Failed to check poster status: ${statusResponse.status}`);
        }
        
        const contentType = statusResponse.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const errorText = await statusResponse.text();
          console.error("Status poll returned non-JSON:", contentType, errorText.slice(0, 200));
          throw new Error("Poster status check returned invalid response. Please try again.");
        }
        
        seedreamResult = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
        console.log(`   Poll ${pollCount}: ${seedreamResult.status}`);
      }

      console.log(`✅ Seedream 4.5 completed after ${pollCount} polls`);
      console.log("   Final status:", seedreamResult.status);

      if (seedreamResult.status === "failed") {
        console.error("❌ Seedream 4.5 generation failed:", seedreamResult.error);
        throw new Error(seedreamResult.error || "Seedream 4.5 generation failed");
      }

      result = seedreamResult.output;
      console.log("   Output type:", typeof result);
      console.log("   Output preview:", JSON.stringify(result).slice(0, 200));
    } else {
      // Use FLUX with image-to-image for consistent character appearance
      console.log("🎨 Using FLUX 1.1 Pro for library poster");
      result = await replicate.run("black-forest-labs/flux-1.1-pro", {
        input: {
          prompt: posterPrompt,
          image: characterImageUrl,
          prompt_strength: 0.85, // Strong adherence to prompt while keeping character
          aspect_ratio: "9:16",
          output_format: "png", // PNG for compatibility
          safety_tolerance: 2,
        },
      });
    }

    const output = await resolveUrl(result);

    if (!output) {
      console.error("❌ No output URL from image generation");
      console.error("   Result type:", typeof result);
      console.error("   Result:", JSON.stringify(result).slice(0, 300));
      throw new Error("No output from image generation");
    }

    console.log("=== LIBRARY POSTER SUCCESS ===");
    console.log("✅ Library poster generated successfully!");
    console.log("   Show Title:", showTitle);
    console.log("   Output URL:", output.slice(0, 100) + "...");
    console.log("   Used Character Grid: YES");
    console.log("   Image Model:", selectedModel);

    return NextResponse.json({ url: output });
  } catch (error) {
    console.error("Library poster generation error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to generate library poster",
        details: message,
      },
      { status: 500 }
    );
  }
}
