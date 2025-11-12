import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import Replicate from "replicate";

type PortraitBody = {
  show: unknown;
  character: unknown;
  customPrompt?: string;
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_JSON_LENGTH = 20000;

// Sanitize JSON to remove photorealistic language
const sanitizeForPrompt = (text: string): string => {
  return text
    .replace(/\bphotorealistic\b/gi, 'animated')
    .replace(/\bphoto-realistic\b/gi, 'animated')
    .replace(/\bphoto-like\b/gi, 'illustrated')
    .replace(/\brealistic matte\b/gi, 'cartoon matte')
    .replace(/\brealistic\s+(?=skin|texture|finish|rendering|surface)/gi, 'stylized ')
    .replace(/\bnatural(?=istic)?\s+(?=skin|texture|photography|rendering)/gi, 'stylized ')
    .replace(/\bdocumentary style\b/gi, 'animated style')
    .replace(/\blive-action\b/gi, 'animated')
    .replace(/\bcinematic finish\b/gi, 'animated finish')
    .replace(/\bcinematic highlights\b/gi, 'animated highlights')
    .replace(/\breal-world\b/gi, 'animated')
    .replace(/\bflesh-and-blood\b/gi, 'animated character');
};

const trimJson = (value: unknown, limit = MAX_JSON_LENGTH) => {
  try {
    const text = JSON.stringify(value);
    const sanitized = sanitizeForPrompt(text);
    if (sanitized.length <= limit) return sanitized;
    return `${sanitized.slice(0, limit - 1)}…`;
  } catch {
    return "";
  }
};

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
    console.log("Prompt preview (first 300 chars):", prompt.slice(0, 300) + "...");
    if (body.customPrompt) {
      console.log("Using custom prompt:", body.customPrompt.slice(0, 150) + "...");
    }
    
    const result = (await replicate.run("openai/gpt-image-1", {
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
      return NextResponse.json(
        {
          error: "Unexpected portrait response format.",
          details: result,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[characters/portrait] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate portrait.";
    if (
      typeof message === "string" &&
      /string (too long|above max length)/i.test(message)
    ) {
      return NextResponse.json(
        {
          error:
            "Portrait prompt exceeded provider limits even after truncation. Try simplifying the character.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
