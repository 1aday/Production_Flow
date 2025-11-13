import { NextResponse } from "next/server";
import Replicate from "replicate";
import { setPortraitStatusRecord, prunePortraitStatusRecords } from "@/lib/portrait-status";

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

export const maxDuration = 180; // 3 minutes for portrait generation

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

  let body: PortraitBody;
  try {
    body = (await request.json()) as PortraitBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }
  
  prunePortraitStatusRecords();
  
  const jobId =
    typeof body.jobId === "string" && body.jobId.trim().length > 0
      ? body.jobId.trim()
      : undefined;
  
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
    console.log("🎨 Generating 1:1 character portrait...");
    console.log("Show title:", showTitle);
    console.log("Production style:", productionStyle?.medium || "not specified");
    console.log("Selected image model:", selectedModel);
    console.log("Job ID:", jobId || "not provided");
    console.log("Prompt preview (first 300 chars):", prompt.slice(0, 300) + "...");
    if (body.customPrompt) {
      console.log("Using custom prompt:", body.customPrompt.slice(0, 150) + "...");
    }
    
    setPortraitStatusRecord(jobId, "starting");
    
    // Start generation asynchronously - don't wait for completion
    const generateAsync = async () => {
      try {
        setPortraitStatusRecord(jobId, "processing");
        
        let result;
        
        if (selectedModel === "flux") {
          // Use FLUX for portrait
          console.log("🎨 Using FLUX 1.1 Pro for portrait");
          try {
            result = (await replicate.run("black-forest-labs/flux-1.1-pro", {
              input: {
                prompt,
                aspect_ratio: "1:1",
                output_format: "webp",
                output_quality: 95,
                safety_tolerance: 2,
              },
            })) as unknown;
            console.log("✅ FLUX API call successful");
          } catch (fluxError) {
            console.error("❌ FLUX API call failed:", fluxError);
            throw fluxError;
          }
        } else {
          // Use GPT Image for portrait
          console.log("🎨 Using GPT Image 1 for portrait");
          try {
            result = (await replicate.run("openai/gpt-image-1", {
              input: {
                prompt,
                quality: "high",
                aspect_ratio: "1:1",
                background: "auto",
                number_of_images: 1,
                moderation: "low",
                openai_api_key: process.env.OPENAI_API_KEY,
              },
            })) as unknown;
            console.log("✅ GPT Image API call successful");
          } catch (gptError) {
            console.error("❌ GPT Image API call failed:", gptError);
            throw gptError;
          }
        }

        let url: string | undefined;

        if (Array.isArray(result) && result.length > 0) {
          const first = result[0] as
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
        }

        if (!url) {
          setPortraitStatusRecord(jobId, "failed", "Unexpected portrait response format.");
          return;
        }

        console.log("✅ Portrait generated successfully:", url.slice(0, 80) + "...");
        setPortraitStatusRecord(jobId, "succeeded", undefined, url);
      } catch (error) {
        console.error("[characters/portrait] Generation error", error);
        const message =
          error instanceof Error ? error.message : "Failed to generate portrait.";
        setPortraitStatusRecord(jobId, "failed", message);
      }
    };
    
    // Start async generation (fire and forget)
    void generateAsync();
    
    // Return job ID immediately
    return NextResponse.json({ jobId, status: "starting" });
    
  } catch (error) {
    console.error("[characters/portrait] Setup error", error);
    const message =
      error instanceof Error ? error.message : "Failed to start portrait generation.";
    setPortraitStatusRecord(jobId, "failed", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
