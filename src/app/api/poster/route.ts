import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import Replicate from "replicate";

type PosterBody = {
  prompt: string;
  characterGridUrl?: string;
  show?: {
    show_title?: string;
    production_style?: {
      medium?: string;
      cinematic_references?: string[];
      visual_treatment?: string;
    };
  };
};

const MAX_PROMPT_LENGTH = 12000;
const MAX_USER_PROMPT = 8000;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const BASE_PROMPT = `Design a theatrical 2:3 portrait movie poster for a prestige streaming series. Capture the tone, palette, lighting, and iconography from the show's visual bible. Focus on cinematic composition, premium typography, and evocative mood.`;

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
  
  // Debug logging
  console.log("=== POSTER REQUEST DEBUG ===");
  console.log("body.show exists:", !!body.show);
  console.log("body.show type:", typeof body.show);
  if (body.show) {
    console.log("body.show.show_title:", (body.show as { show_title?: string }).show_title);
    console.log("body.show keys:", Object.keys(body.show));
  }
  
  const showTitle = body.show?.show_title || "Untitled Series";
  const productionStyle = body.show?.production_style;
  
  console.log("Extracted showTitle:", showTitle);
  console.log("Extracted productionStyle:", productionStyle ? "exists" : "missing");

  // Build prominent style header
  const styleHeader = productionStyle ? [
    "!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!",
    "",
    `Show Title: "${showTitle}"`,
    `Production Medium: ${productionStyle.medium || 'Stylized cinematic'}`,
    `Visual References: ${(productionStyle.cinematic_references || []).join(' + ')}`,
    `Stylization: ${productionStyle.stylization_level || 'moderately stylized'}`,
    "",
    `Treatment: ${productionStyle.visual_treatment || 'Cinematic theatrical style'}`,
    "",
    "CRITICAL REQUIREMENTS:",
    "1. The poster MUST prominently display the show title in bold theatrical typography",
    "2. DO NOT use photorealistic rendering",
    "3. DO NOT create a photo-like realistic image",
    "4. MUST match the specified visual style exactly",
    "5. Use artistic/stylized interpretation, NOT documentary realism",
    "",
    "---",
    "",
  ].join("\n") : [
    "!! CRITICAL - DO NOT CREATE PHOTOREALISTIC IMAGE !!",
    "",
    `Show Title: "${showTitle}" (MUST be displayed prominently on poster)`,
    "",
    "CRITICAL REQUIREMENTS:",
    "- Use theatrical/stylized treatment, NOT photorealistic rendering",
    "- Display the show title prominently with bold typography",
    "- Use artistic interpretation, NOT realistic photography",
    "",
    "---",
    "",
  ].join("\n");

  let compositePrompt = body.characterGridUrl 
    ? `${styleHeader}${BASE_PROMPT}\n\nHere are the characters (shown in the reference image grid):\n${userPrompt}`
    : `${styleHeader}${BASE_PROMPT}\n\nCharacter prompt:\n${userPrompt}`;

  if (compositePrompt.length > MAX_PROMPT_LENGTH) {
    compositePrompt = trimWithEllipsis(compositePrompt, MAX_PROMPT_LENGTH);
  }

  console.log("=== POSTER GENERATION ===");
  console.log("Show Title:", showTitle);
  console.log("Has character grid:", !!body.characterGridUrl);
  if (productionStyle) {
    console.log("Production Style:", productionStyle.medium);
  }

  // Build input ensuring array stays as array
  const input: Record<string, unknown> = {
    prompt: compositePrompt,
    quality: "high",
    aspect_ratio: "2:3",
    background: "auto",
    number_of_images: 1,
    moderation: "low",
    openai_api_key: process.env.OPENAI_API_KEY,
  };

  // Add character grid as reference if available
  if (body.characterGridUrl) {
    input.input_images = [body.characterGridUrl];
    input.input_fidelity = "high";
    console.log("Using character grid as reference:", body.characterGridUrl.slice(0, 60) + "...");
    console.log("input_images array:", input.input_images);
    console.log("Is array?", Array.isArray(input.input_images));
  }

  try {
    console.log("Poster input:", JSON.stringify(input, null, 2));
    
    // Use direct API to avoid SDK array conversion issues
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
    let result = prediction;
    while (result.status === "starting" || result.status === "processing") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      result = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("Poster status:", result.status);
    }

    if (result.status === "failed") {
      throw new Error(result.error || "Poster generation failed");
    }

    if (result.status === "canceled") {
      throw new Error("Poster generation was canceled");
    }

    const output = result.output;

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
