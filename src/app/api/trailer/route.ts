import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 300; // 5 minutes for trailer generation

type TrailerBody = {
  title: string;
  logline: string;
  characterGridUrl: string;
  show: unknown;
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

  let body: TrailerBody;
  try {
    body = (await request.json()) as TrailerBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { title, logline, characterGridUrl, show } = body;

  if (!title || !logline || !characterGridUrl) {
    return NextResponse.json(
      { error: "Missing required fields: title, logline, and characterGridUrl" },
      { status: 400 }
    );
  }

  // Build a blockbuster-style trailer prompt
  const trailerPrompt = `Create a blockbuster-style teaser trailer for the series "${title}".

${logline}

Style: Cinematic trailer with dramatic pacing, quick cuts showcasing the characters, high-energy moments, 
and a sense of scale and adventure. Professional movie trailer aesthetic with dynamic camera movements,
impactful compositions, and a sense of intrigue that makes you want to watch the show.

The character grid reference image shows the main cast - ensure they appear throughout the trailer.
Capture the tone, visual style, and atmosphere described in the show's look bible.

Show data: ${JSON.stringify(show).slice(0, 2000)}`;

  console.log("=== TRAILER GENERATION ===");
  console.log("Title:", title);
  console.log("Logline:", logline.slice(0, 100));
  console.log("Character grid URL:", characterGridUrl);

  try {
    // Use Sora 2 Pro for high-quality 12-second trailer
    const input = {
      prompt: trailerPrompt,
      image: characterGridUrl,
      seconds: 12, // CORRECT PARAMETER IS "seconds" NOT "duration"
      aspect_ratio: "landscape",
      resolution: "high",
    };

    console.log("=== Sora 2 Pro Trailer Input ===");
    console.log("Seconds:", input.seconds, "(MUST BE 12)");
    console.log("Resolution:", input.resolution);
    console.log("Aspect:", input.aspect_ratio);
    console.log("Model: openai/sora-2-pro");
    console.log("\nFull input object:");
    console.log(JSON.stringify(input, null, 2));
    
    const requestBody = JSON.stringify({ input });
    console.log("\nRequest body being sent:");
    console.log(requestBody);

    // Use direct API call to ensure proper serialization
    const createResponse = await fetch("https://api.replicate.com/v1/models/openai/sora-2-pro/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.text();
      console.error("Replicate API error:", errorBody);
      throw new Error(`Failed to create prediction: ${createResponse.status} - ${errorBody}`);
    }

    const prediction = await createResponse.json() as { id: string; status: string; error?: string; output?: unknown; input?: unknown };

    console.log("Prediction created:", prediction.id);
    console.log("Initial status:", prediction.status);
    console.log("Confirmed input sent to Sora:", JSON.stringify(prediction.input, null, 2));

    // Wait for completion
    let result = prediction;
    while (result.status === "starting" || result.status === "processing") {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      result = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("Trailer status:", result.status);
    }

    if (result.status === "failed") {
      throw new Error(result.error || "Trailer generation failed");
    }

    if (result.status === "canceled") {
      throw new Error("Trailer generation was canceled");
    }

    // Extract URL from output
    let url: string | undefined;

    if (typeof result.output === "string") {
      url = result.output;
    } else if (Array.isArray(result.output) && result.output.length > 0) {
      url = result.output[0] as string;
    } else if (result.output && typeof result.output === "object") {
      const outputObj = result.output as Record<string, unknown>;
      if ("url" in outputObj && typeof outputObj.url === "string") {
        url = outputObj.url;
      }
    }

    if (!url) {
      return NextResponse.json(
        {
          error: "Unexpected trailer response format.",
          details: result.output,
        },
        { status: 502 }
      );
    }

    console.log("✅ Trailer generated successfully:", url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[trailer] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate trailer.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
