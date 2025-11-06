import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60;

type RequestBody = {
  logline: string;
  characterImageUrl: string;
  showData?: {
    show_title?: string;
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
    const { logline, characterImageUrl, showData } = body;

    if (!logline || !characterImageUrl) {
      return NextResponse.json(
        { error: "Missing required fields: logline and characterImageUrl" },
        { status: 400 }
      );
    }

    const replicate = new Replicate({ auth: token });

    // Build visual direction from show data
    const visualAesthetics = showData?.visual_aesthetics;
    let visualDirection = "";
    
    if (visualAesthetics) {
      const parts: string[] = [];
      
      if (visualAesthetics.goal) {
        parts.push(`Visual goal: ${visualAesthetics.goal}`);
      }
      
      if (visualAesthetics.color) {
        if (visualAesthetics.color.palette_bias) {
          parts.push(`Color palette: ${visualAesthetics.color.palette_bias}`);
        }
        if (visualAesthetics.color.anchor_hex?.length) {
          parts.push(`Key colors: ${visualAesthetics.color.anchor_hex.join(", ")}`);
        }
      }
      
      if (visualAesthetics.lighting) {
        if (visualAesthetics.lighting.temperature_model) {
          parts.push(`Lighting: ${visualAesthetics.lighting.temperature_model}`);
        }
        if (visualAesthetics.lighting.key) {
          parts.push(`Key light: ${visualAesthetics.lighting.key}`);
        }
      }
      
      if (visualAesthetics.composition) {
        if (visualAesthetics.composition.symmetry_bias) {
          parts.push(`Composition: ${visualAesthetics.composition.symmetry_bias}`);
        }
        if (visualAesthetics.composition.color_blocking) {
          parts.push(`Color blocking: ${visualAesthetics.composition.color_blocking}`);
        }
      }
      
      if (parts.length > 0) {
        visualDirection = `\n\nShow Visual Style:\n${parts.join("\n")}`;
      }
    }

    const showTitle = showData?.show_title || "Untitled";
    
    // Create a Netflix-style movie poster prompt with 9:16 aspect ratio
    const posterPrompt = `Netflix-style movie poster, cinematic composition, dramatic lighting, professional design. 
Title: "${showTitle}"
${logline}${visualDirection}

Style: Modern streaming service poster with bold typography. The title "${showTitle}" should be prominently displayed in the upper third.
Character-focused composition, moody atmospheric background, premium quality, theatrical release aesthetic, portrait orientation 9:16 aspect ratio.
High contrast, rich colors, professional color grading, award-winning poster design.`;

    console.log("=== LIBRARY POSTER GENERATION ===");
    console.log("Logline:", logline.slice(0, 150));
    console.log("Character image:", characterImageUrl);
    console.log("\n--- FULL PROMPT ---");
    console.log(posterPrompt);
    console.log("--- END PROMPT ---\n");

    // Use FLUX with image-to-image for consistent character appearance
    const result = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input: {
        prompt: posterPrompt,
        image: characterImageUrl,
        prompt_strength: 0.85, // Strong adherence to prompt while keeping character
        aspect_ratio: "9:16",
        output_format: "webp",
        output_quality: 95,
        safety_tolerance: 2,
      },
    });

    const output = await resolveUrl(result);

    if (!output) {
      throw new Error("No output from image generation");
    }

    console.log("Library poster generated successfully");

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
