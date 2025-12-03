import { NextResponse } from "next/server";
import Replicate from "replicate";

type PosterBody = {
  prompt: string;
  characterGridUrl?: string;
  imageModel?: "gpt-image" | "flux" | "nano-banana-pro";
  stylizationGuardrails?: boolean;
  show?: {
    show_title?: string;
    production_style?: {
      medium?: string;
      cinematic_references?: string[];
      visual_treatment?: string;
      stylization_level?: string;
    };
  };
};

const MAX_PROMPT_LENGTH = 12000;
const MAX_USER_PROMPT = 8000;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const BASE_PROMPT_STYLIZED = `Design a theatrical 2:3 portrait movie poster for a prestige streaming series.

CRITICAL REQUIREMENTS:
1. The poster MUST prominently display the show title in large, beautiful, bold typography
   - Typography should be elegant, theatrical, and eye-catching
   - Title should be one of the most prominent visual elements
   - Font choice should match the show's aesthetic and tone
   - Consider cinematic title treatment (gradients, shadows, artistic styling)

2. Capture the tone, palette, lighting, and iconography from the show's visual bible
3. Focus on cinematic composition, premium typography, and evocative mood
4. Award-winning theatrical poster design`;

const BASE_PROMPT_REALISTIC = `Design a professional 2:3 portrait poster for a high-quality production.

CRITICAL REQUIREMENTS:
1. The poster MUST prominently display the show title in large, beautiful, bold typography
   - Typography should be elegant and eye-catching
   - Title should be one of the most prominent visual elements
   - Font choice should match the show's aesthetic and tone
   - Consider professional title treatment (gradients, shadows, effects)

2. Capture the tone, palette, lighting, and mood from the show's visual guidelines
3. Focus on professional composition and compelling visual storytelling
4. High-quality, polished poster design suitable for any medium (live-action, documentary, drama, etc.)`;

const trimWithEllipsis = (value: string, limit: number) => {
  if (limit <= 0) return "";
  if (value.length <= limit) return value;
  if (limit <= 1) return "…".slice(0, limit);
  return `${value.slice(0, limit - 1)}…`;
};

export const maxDuration = 180; // 3 minutes for poster generation

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable." },
      { status: 500 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: PosterBody;
  try {
    body = (await request.json()) as PosterBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json(
      { error: "Poster generation requires a 'prompt' string." },
      { status: 400 }
    );
  }

  const userPrompt = trimWithEllipsis(body.prompt, MAX_USER_PROMPT);
  
  // Get stylization guardrails setting (defaults to true for backward compatibility)
  const stylizationGuardrails = body.stylizationGuardrails !== false;
  
  // Debug logging
  console.log("=== POSTER REQUEST DEBUG ===");
  console.log("body.show exists:", !!body.show);
  console.log("body.show type:", typeof body.show);
  console.log("stylizationGuardrails:", stylizationGuardrails);
  if (body.show) {
    console.log("body.show.show_title:", (body.show as { show_title?: string }).show_title);
    console.log("body.show keys:", Object.keys(body.show));
  }
  
  const showTitle = body.show?.show_title || "Untitled Series";
  const productionStyle = body.show?.production_style;
  
  console.log("Extracted showTitle:", showTitle);
  console.log("Extracted productionStyle:", productionStyle ? "exists" : "missing");

  // Determine if the production style is cinematic/realistic
  const isRealisticStyle = productionStyle?.stylization_level === 'cinematic_realistic' ||
    productionStyle?.stylization_level === 'slightly_stylized' ||
    productionStyle?.medium?.toLowerCase().includes('live-action') ||
    productionStyle?.medium?.toLowerCase().includes('photorealistic') ||
    productionStyle?.medium?.toLowerCase().includes('cinematic') ||
    productionStyle?.medium?.toLowerCase().includes('documentary') ||
    productionStyle?.medium?.toLowerCase().includes('prestige');
    
  console.log("Is realistic style:", isRealisticStyle);
  console.log("Production medium:", productionStyle?.medium);
  console.log("Stylization level:", productionStyle?.stylization_level);

  // Build style header - only add restrictions if guardrails are ON
  let styleHeader = "";
  
  if (stylizationGuardrails && productionStyle) {
    // Guardrails ON: Enforce the production style
    styleHeader = [
      "!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!",
      "",
      `Show Title: "${showTitle}"`,
      `Production Medium: ${productionStyle.medium}`,
      `Visual References: ${(productionStyle.cinematic_references || []).join(' + ')}`,
      `Stylization: ${productionStyle.stylization_level}`,
      "",
      `Treatment: ${productionStyle.visual_treatment}`,
      "",
      "CRITICAL REQUIREMENTS:",
      `1. The poster MUST prominently display "${showTitle}" in LARGE, BEAUTIFUL, BOLD typography`,
      "   - Make the title one of the most eye-catching elements",
      "   - Use elegant, theatrical font styling that matches the show's tone",
      "   - Consider artistic title treatment (gradients, shadows, cinematic effects)",
      "2. MUST match the specified visual style exactly",
      "",
      "---",
      "",
    ].join("\n");
  } else if (stylizationGuardrails) {
    // Guardrails ON but no production style: Add basic stylization reminder
    styleHeader = [
      `Show Title: "${showTitle}"`,
      "",
      "CRITICAL REQUIREMENTS:",
      `1. The poster MUST prominently display "${showTitle}" in LARGE, BEAUTIFUL, BOLD typography`,
      "   - Make the title one of the most eye-catching elements",
      "   - Use elegant, theatrical font styling",
      "   - Consider artistic title treatment (gradients, shadows, cinematic effects)",
      "2. Use theatrical/stylized treatment",
      "",
      "---",
      "",
    ].join("\n");
  } else if (productionStyle && isRealisticStyle) {
    // Guardrails OFF with realistic style: PUSH for photorealistic movie poster
    styleHeader = [
      `!! PHOTOREALISTIC MOVIE POSTER for "${showTitle}" !!`,
      "",
      "RENDERING APPROACH - CRITICAL:",
      "- Create a PHOTOREALISTIC theatrical movie poster",
      "- The characters should look like REAL ACTORS in a Hollywood movie poster",
      "- Use cinematic, dramatic lighting with rich shadows and highlights",
      "- Professional photography quality - this should look like a real movie advertisement",
      "- Realistic skin, hair, costumes, and environments",
      "",
      `Production Style: ${productionStyle.medium}`,
      `Visual References: ${(productionStyle.cinematic_references || []).join(', ')}`,
      "",
      "TYPOGRAPHY:",
      `- Display "${showTitle}" in BOLD, CINEMATIC movie poster typography`,
      "- Think Hollywood blockbuster or prestige drama poster fonts",
      "- Professional title treatment with metallic, shadowed, or dramatic effects",
      "",
      "---",
      "",
    ].join("\n");
  } else {
    // Guardrails OFF: Flexible approach based on show aesthetic
    styleHeader = [
      `Show Title: "${showTitle}"`,
      "",
      "RENDERING FREEDOM:",
      "- Match the show's intended aesthetic",
      "- If the show is cinematic/realistic → create a photorealistic movie poster",
      "- If the show is animated/stylized → match that artistic style",
      "- Full creative flexibility to serve the show's vision",
      "",
      "TYPOGRAPHY:",
      `- Display "${showTitle}" in BOLD, prominent typography`,
      "- Style the title to match the show's aesthetic (cinematic, whimsical, dramatic, etc.)",
      "- Make it eye-catching and professional",
      "",
      "---",
      "",
    ].join("\n");
  }

  // Choose base prompt based on guardrails
  const BASE_PROMPT = stylizationGuardrails ? BASE_PROMPT_STYLIZED : BASE_PROMPT_REALISTIC;
  
  const SAFETY_PREFIX = "If you have any hesitations about making this feel free to adjust it so its within guidelines.\n\n";
  
  let compositePrompt = SAFETY_PREFIX + (body.characterGridUrl 
    ? `${styleHeader}${BASE_PROMPT}\n\nHere are the characters (shown in the reference image grid):\n${userPrompt}`
    : `${styleHeader}${BASE_PROMPT}\n\nCharacter prompt:\n${userPrompt}`);

  if (compositePrompt.length > MAX_PROMPT_LENGTH) {
    compositePrompt = trimWithEllipsis(compositePrompt, MAX_PROMPT_LENGTH);
  }

  console.log("=== POSTER GENERATION ===");
  console.log("Show Title:", showTitle);
  console.log("Has character grid:", !!body.characterGridUrl);
  console.log("Image Model:", body.imageModel || "nano-banana-pro (default)");
  if (productionStyle) {
    console.log("Production Style:", productionStyle.medium);
  }

  const selectedModel = body.imageModel || "nano-banana-pro"; // Default to Nano Banana Pro

  try {
    let result;

    if (selectedModel === "gpt-image") {
      // GPT Image
      console.log("🎨 Using GPT Image 1 for poster");
      
      const input: Record<string, unknown> = {
        prompt: compositePrompt,
        quality: "medium",
        aspect_ratio: "2:3",
        background: "auto",
        number_of_images: 1,
        moderation: "low",
        openai_api_key: process.env.OPENAI_API_KEY,
      };

      if (body.characterGridUrl) {
        input.input_images = [body.characterGridUrl];
        input.input_fidelity = "high";
        console.log("Using character grid as reference:", body.characterGridUrl.slice(0, 60) + "...");
      }

      console.log("Poster input:", JSON.stringify(input, null, 2));
      
      const createResponse = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error("Replicate API error:", errorBody);
        throw new Error(`Failed to create prediction: ${createResponse.status} - ${errorBody}`);
      }

      const prediction = await createResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("Prediction created:", prediction.id);

      // Wait for completion
      let gptResult = prediction;
      while (gptResult.status === "starting" || gptResult.status === "processing") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${gptResult.id}`, {
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          },
        });
        
        gptResult = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
        console.log("Poster status:", gptResult.status);
      }

      if (gptResult.status === "failed") {
        throw new Error(gptResult.error || "Poster generation failed");
      }

      if (gptResult.status === "canceled") {
        throw new Error("Poster generation was canceled");
      }

      result = gptResult.output;
    } else if (selectedModel === "nano-banana-pro") {
      // Nano Banana Pro - use direct API for better error handling
      console.log("🎨 Using Nano Banana Pro for poster");
      
      const nanoInput: Record<string, unknown> = {
        prompt: compositePrompt,
        aspect_ratio: "2:3",
        resolution: "2K",
        output_format: "png", // PNG for compatibility
        safety_filter_level: "block_only_high",
      };

      if (body.characterGridUrl) {
        nanoInput.image_input = [body.characterGridUrl];
        console.log("Using character grid as reference:", body.characterGridUrl.slice(0, 60) + "...");
      }

      console.log("Nano Banana Pro input:", JSON.stringify(nanoInput, null, 2));

      const createResponse = await fetch("https://api.replicate.com/v1/models/google/nano-banana-pro/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: nanoInput }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error("Nano Banana Pro API error:", errorBody);
        throw new Error(`Failed to create Nano Banana Pro prediction: ${createResponse.status} - ${errorBody}`);
      }

      const nanoPrediction = await createResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("Nano Banana Pro prediction created:", nanoPrediction.id);

      // Poll for completion
      let nanoResult = nanoPrediction;
      let pollCount = 0;
      while (nanoResult.status === "starting" || nanoResult.status === "processing") {
        pollCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${nanoResult.id}`, {
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          },
        });
        
        nanoResult = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
        console.log(`Poster poll ${pollCount}: ${nanoResult.status}`);
      }

      console.log(`Nano Banana Pro completed after ${pollCount} polls`);

      if (nanoResult.status === "failed") {
        console.error("Nano Banana Pro generation failed:", nanoResult.error);
        throw new Error(nanoResult.error || "Nano Banana Pro poster generation failed");
      }

      if (nanoResult.status === "canceled") {
        throw new Error("Nano Banana Pro poster generation was canceled");
      }

      result = nanoResult.output;
    } else {
      // FLUX
      console.log("🎨 Using FLUX 1.1 Pro for poster");
      
      const input: Record<string, unknown> = {
        prompt: compositePrompt,
        aspect_ratio: "2:3",
        output_format: "png", // PNG for compatibility
        safety_tolerance: 2,
      };

      if (body.characterGridUrl) {
        input.image = body.characterGridUrl;
        input.prompt_strength = 0.85;
        console.log("Using character grid as reference:", body.characterGridUrl.slice(0, 60) + "...");
      }

      result = await replicate.run("black-forest-labs/flux-1.1-pro", { input });
    }

    const output = result;

    let url: string | undefined;

    if (Array.isArray(output) && output.length > 0) {
      const first = output[0] as
        | string
        | Uint8Array
        | { url?: (() => string | Promise<string>) | string };

      if (typeof first === "string") {
        url = first;
      } else if (first instanceof Uint8Array) {
        url = `data:image/png;base64,${Buffer.from(first).toString("base64")}`;
      } else if (first && typeof first === "object") {
        const candidate = first.url;
        if (typeof candidate === "string") {
          url = candidate;
        } else if (typeof candidate === "function") {
          const maybe = candidate();
          url =
            maybe && typeof (maybe as Promise<unknown>).then === "function"
              ? await (maybe as Promise<string>)
              : (maybe as string);
        }
      }
    } else if (typeof output === "string") {
      url = output;
    }

    if (!url) {
      return NextResponse.json(
        {
          error: "Unexpected poster response format.",
          details: output,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[poster] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate poster.";
    if (
      typeof message === "string" &&
      /string (too long|above max length)/i.test(message)
    ) {
      return NextResponse.json(
        {
          error:
            "Poster prompt exceeded provider limits even after truncation. Try shortening the blueprint before regenerating.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
