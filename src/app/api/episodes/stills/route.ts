import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

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
    } = body;

    if (!sectionDescription || !episodeTitle) {
      return NextResponse.json(
        { error: "Missing required fields: sectionDescription and episodeTitle" },
        { status: 400 }
      );
    }

    const replicate = new Replicate({ auth: token });

    // Build the prompt for the still
    const prompt = `Cinematic still from "${showTitle}" - ${genre || "Drama"} TV series.

Episode: "${episodeTitle}"
Scene: ${sectionLabel}

${sectionDescription}

Episode context: ${episodeLogline}

${visualStyle ? `Visual Style: ${visualStyle}` : ""}

Photorealistic, cinematic lighting, 16:9 aspect ratio, high production value, professional TV production still, dramatic composition.`;

    console.log("=== STILLS GENERATION ===");
    console.log("Show:", showTitle);
    console.log("Episode:", episodeTitle);
    console.log("Section:", sectionLabel);
    console.log("Has character grid:", !!characterGridUrl);
    console.log("Prompt:", prompt.slice(0, 200) + "...");

    // Use Nano Banana Pro for fast generation
    const createResponse = await fetch(
      "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt,
            image_input: characterGridUrl ? [characterGridUrl] : undefined,
            aspect_ratio: "16:9",
            resolution: "2K",
            output_format: "jpg",
            safety_filter_level: "block_only_high",
          },
        }),
      }
    );

    if (!createResponse.ok) {
      const errorBody = await createResponse.text();
      console.error("Nano Banana Pro API error:", errorBody);
      throw new Error(
        `Failed to create prediction: ${createResponse.status} - ${errorBody}`
      );
    }

    const prediction = (await createResponse.json()) as {
      id: string;
      status: string;
      error?: string;
      output?: string | string[];
    };

    console.log("✅ Prediction created:", prediction.id);
    console.log("   Initial status:", prediction.status);

    // Poll for completion (max 60 seconds)
    let result = prediction;
    let pollCount = 0;
    const maxPolls = 30;

    while (
      (result.status === "starting" || result.status === "processing") &&
      pollCount < maxPolls
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      pollCount++;

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (pollResponse.ok) {
        result = await pollResponse.json();
        console.log(`   Poll ${pollCount}: ${result.status}`);
      }
    }

    if (result.status !== "succeeded") {
      console.error("Prediction failed or timed out:", result);
      return NextResponse.json(
        { error: result.error || "Generation timed out" },
        { status: 500 }
      );
    }

    // Extract the image URL
    let imageUrl: string | undefined;
    if (Array.isArray(result.output) && result.output.length > 0) {
      imageUrl = result.output[0];
    } else if (typeof result.output === "string") {
      imageUrl = result.output;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    console.log("✅ Still generated:", imageUrl.slice(0, 80) + "...");

    return NextResponse.json({
      success: true,
      imageUrl,
      sectionLabel,
    });
  } catch (error) {
    console.error("Stills generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate still" },
      { status: 500 }
    );
  }
}

