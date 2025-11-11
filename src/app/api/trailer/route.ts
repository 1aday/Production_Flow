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

  // Try Sora 2 first, fallback to VEO 3.1 on E005
  let finalUrl: string | undefined;
  let usedModel = "sora-2";

  try {
    // Attempt 1: Sora 2 (12 seconds, faster)
    console.log("🎬 Attempting trailer with Sora 2...");
    const soraInput = {
      prompt: trailerPrompt,
      input_reference: characterGridUrl,
      seconds: 12,
      aspect_ratio: "landscape",
    };

    console.log("Sora 2 input:", JSON.stringify(soraInput, null, 2));

    const soraResponse = await fetch("https://api.replicate.com/v1/models/openai/sora-2/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: soraInput }),
    });

    if (!soraResponse.ok) {
      const errorBody = await soraResponse.text();
      throw new Error(`Sora 2 request failed: ${soraResponse.status}`);
    }

    const soraPrediction = await soraResponse.json() as { id: string; status: string; error?: string; output?: unknown };
    console.log("Sora prediction created:", soraPrediction.id);

    // Poll for completion
    let result = soraPrediction;
    while (result.status === "starting" || result.status === "processing") {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
      });
      result = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("Sora status:", result.status);
    }

    if (result.status === "failed") {
      const error = result.error || "Sora failed";
      
      // Check if E005 - try VEO fallback
      if (error.includes("E005") || error.includes("flagged as sensitive")) {
        console.warn("⚠️ Sora flagged content, falling back to VEO 3.1...");
        throw new Error("E005_FALLBACK");
      }
      
      throw new Error(error);
    }

    if (result.status === "canceled") {
      throw new Error("Trailer generation was canceled");
    }

    // Extract URL from Sora output
    if (typeof result.output === "string") {
      finalUrl = result.output;
    } else if (Array.isArray(result.output) && result.output.length > 0) {
      finalUrl = result.output[0] as string;
    } else if (result.output && typeof result.output === "object") {
      const outputObj = result.output as Record<string, unknown>;
      if ("url" in outputObj && typeof outputObj.url === "string") {
        finalUrl = outputObj.url;
      }
    }

    if (finalUrl) {
      console.log("✅ Trailer generated with Sora 2:", finalUrl);
      return NextResponse.json({ url: finalUrl, model: "sora-2" });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    
    // Fallback to VEO 3.1 on E005
    if (errorMessage === "E005_FALLBACK") {
      console.log("🔄 Falling back to VEO 3.1...");
      
      try {
        const veoInput = {
          prompt: trailerPrompt,
          reference_images: [characterGridUrl],
          aspect_ratio: "16:9",
          duration: 8, // VEO max is 8 seconds
          resolution: "1080p",
          generate_audio: true,
        };

        console.log("VEO 3.1 input:", JSON.stringify(veoInput, null, 2));

        const veoResponse = await fetch("https://api.replicate.com/v1/models/google/veo-3.1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input: veoInput }),
        });

        if (!veoResponse.ok) {
          throw new Error(`VEO request failed: ${veoResponse.status}`);
        }

        const veoPrediction = await veoResponse.json() as { id: string; status: string; error?: string; output?: unknown };
        console.log("VEO prediction created:", veoPrediction.id);

        // Poll for VEO completion
        let veoResult = veoPrediction;
        while (veoResult.status === "starting" || veoResult.status === "processing") {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${veoResult.id}`, {
            headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
          });
          veoResult = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
          console.log("VEO status:", veoResult.status);
        }

        if (veoResult.status === "failed") {
          throw new Error(veoResult.error || "VEO generation also failed");
        }

        // Extract VEO URL
        if (typeof veoResult.output === "string") {
          finalUrl = veoResult.output;
        } else if (Array.isArray(veoResult.output) && veoResult.output.length > 0) {
          finalUrl = veoResult.output[0] as string;
        }

        if (finalUrl) {
          console.log("✅ Trailer generated with VEO 3.1 (fallback):", finalUrl);
          return NextResponse.json({ url: finalUrl, model: "veo-3.1" });
        }

      } catch (veoError) {
        console.error("VEO fallback also failed:", veoError);
        // Fall through to return error to client
      }
    }
    
    console.error("[trailer] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate trailer.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Should not reach here
  return NextResponse.json(
    { error: "Unexpected trailer response format." },
    { status: 502 }
  );
}
