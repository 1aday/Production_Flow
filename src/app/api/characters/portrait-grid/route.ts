import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 120;

type PortraitGridBody = {
  portraits: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  columns?: number;
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
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

  let body: PortraitGridBody;
  try {
    body = (await request.json()) as PortraitGridBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.portraits || body.portraits.length === 0) {
    return NextResponse.json(
      { error: "At least one portrait required." },
      { status: 400 }
    );
  }

  const columns = body.columns ?? 3;
  const portraitCount = body.portraits.length;

  console.log("🎨 Generating character grid:", {
    characters: portraitCount,
    columns,
    portraits: body.portraits.map(p => p.name),
  });

  // Create a prompt to composite all portraits into a grid
  const gridPrompt = `Create a professional character lineup grid showing all ${portraitCount} characters from this series.
Arrange them in a ${columns}-column grid layout with consistent spacing and presentation.
Each character should be clearly visible in their portrait.
Clean, professional presentation suitable for a show bible or press kit.
High-quality composite image, studio lighting, premium production value.

Characters:
${body.portraits.map((p, i) => `${i + 1}. ${p.name}`).join("\n")}

Style: Professional character lineup grid, Netflix-style presentation, clean background, 
consistent framing for each portrait, premium quality.`;

  try {
    // Use DALL-E 3 for compositing since we need precise control
    const result = (await replicate.run("openai/gpt-image-1", {
      input: {
        prompt: gridPrompt,
        quality: "high",
        aspect_ratio: "16:9",
        background: "auto",
        number_of_images: 1,
        openai_api_key: process.env.OPENAI_API_KEY,
      },
    })) as unknown;

    let url: string | undefined;

    if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      if (typeof first === "string") {
        url = first;
      } else if (first && typeof first === "object" && "url" in first) {
        const candidate = (first as { url?: unknown }).url;
        if (typeof candidate === "string") {
          url = candidate;
        }
      }
    }

    if (!url) {
      return NextResponse.json(
        {
          error: "Unexpected grid response format.",
          details: result,
        },
        { status: 502 }
      );
    }

    console.log("✅ Character grid generated successfully");
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[portrait-grid] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate portrait grid.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
