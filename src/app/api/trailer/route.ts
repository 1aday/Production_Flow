import { NextRequest, NextResponse } from "next/server";

import {
  pruneTrailerStatusRecords,
  setTrailerStatusRecord,
} from "@/lib/trailer-status";

export const maxDuration = 300; // 5 minutes for trailer generation

type TrailerBody = {
  title: string;
  logline: string;
  characterGridUrl: string;
  show: unknown;
  jobId?: string;
  model?: 'sora-2' | 'sora-2-pro' | 'veo-3.1' | 'auto';
  customPrompt?: string;
};

// Helper function to generate with Sora 2
async function generateWithSora(
  prompt: string,
  characterGridUrl: string,
  jobId?: string,
  isPro: boolean = false
): Promise<{ url: string; model: string } | null> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }

  const modelName = isPro ? "Sora 2 Pro" : "Sora 2";
  const modelId = isPro ? "sora-2-pro" : "sora-2";
  console.log(`🎬 Generating with ${modelName} (12s, landscape)...`);
  setTrailerStatusRecord(jobId, `${modelId}-starting`);

  const input: Record<string, unknown> = {
    prompt,
    input_reference: characterGridUrl,
    seconds: 12,
    aspect_ratio: "landscape",
  };
  
  // Add pro-tier options if using Sora 2 Pro
  if (isPro) {
    input.resolution = "1080p";
    input.quality = "high";
  }

  const response = await fetch("https://api.replicate.com/v1/models/openai/sora-2/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(`Sora 2 request failed: ${response.status}`);
  }

  const prediction = await response.json() as { id: string; status: string; error?: string; output?: unknown };
  console.log("Sora prediction created:", prediction.id);

  // Poll for completion
  let result = prediction;
  setTrailerStatusRecord(jobId, `${modelId}-${result.status}`);
  while (result.status === "starting" || result.status === "processing") {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
    });
    result = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
    console.log(`${modelName} status:`, result.status);
    setTrailerStatusRecord(jobId, `${modelId}-${result.status}`);
  }

  if (result.status === "failed") {
    throw new Error(result.error || `${modelName} failed`);
  }

  // Extract URL
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

  if (url) {
    console.log(`✅ Trailer generated with ${modelName}:`, url);
    setTrailerStatusRecord(jobId, "succeeded", undefined, url, modelId);
    return { url, model: modelId };
  }

  return null;
}

// Helper function to generate with VEO 3.1
async function generateWithVeo(
  prompt: string,
  characterGridUrl: string,
  jobId?: string
): Promise<{ url: string; model: string } | null> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("Missing REPLICATE_API_TOKEN");
  }

  console.log("🎬 Generating with VEO 3.1 (8s, 16:9)...");
  setTrailerStatusRecord(jobId, "veo-starting");

  const input = {
    prompt,
    reference_images: [characterGridUrl],
    aspect_ratio: "16:9",
    duration: 8,
    resolution: "1080p",
    generate_audio: true,
  };

  const response = await fetch("https://api.replicate.com/v1/models/google/veo-3.1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(`VEO request failed: ${response.status}`);
  }

  const prediction = await response.json() as { id: string; status: string; error?: string; output?: unknown };
  console.log("VEO prediction created:", prediction.id);

  // Poll for completion
  let result = prediction;
  setTrailerStatusRecord(jobId, `veo-${result.status}`);
  while (result.status === "starting" || result.status === "processing") {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
    });
    result = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
    console.log("VEO status:", result.status);
    setTrailerStatusRecord(jobId, `veo-${result.status}`);
  }

  if (result.status === "failed") {
    throw new Error(result.error || "VEO failed");
  }

  // Extract URL
  let url: string | undefined;
  if (typeof result.output === "string") {
    url = result.output;
  } else if (Array.isArray(result.output) && result.output.length > 0) {
    url = result.output[0] as string;
  }

  if (url) {
    console.log("✅ Trailer generated with VEO 3.1:", url);
    setTrailerStatusRecord(jobId, "succeeded", undefined, url, "veo-3.1");
    return { url, model: "veo-3.1" };
  }

  return null;
}


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

  pruneTrailerStatusRecords();

  const { title, logline, characterGridUrl, show, jobId: incomingJobId, model: requestedModel = 'auto', customPrompt } = body;
  const jobId =
    typeof incomingJobId === "string" && incomingJobId.trim().length > 0
      ? incomingJobId.trim()
      : undefined;

  if (!title || !logline || !characterGridUrl) {
    return NextResponse.json(
      { error: "Missing required fields: title, logline, and characterGridUrl" },
      { status: 400 }
    );
  }

  // Extract production style to avoid photorealistic language
  const productionStyle = (show as { production_style?: {
    medium?: string;
    cinematic_references?: string[];
    visual_treatment?: string;
    stylization_level?: string;
  } }).production_style;

  // Use custom prompt if provided, otherwise build default prompt
  const trailerPrompt = customPrompt || (() => {
    const styleGuidance = productionStyle ? `

VISUAL STYLE (CRITICAL - Follow exactly):
Medium: ${productionStyle.medium || 'Stylized cinematic'}
References: ${(productionStyle.cinematic_references || []).join(', ')}
Treatment: ${productionStyle.visual_treatment || 'Cinematic theatrical style'}
Stylization: ${productionStyle.stylization_level || 'cinematic'}

IMPORTANT: Match this exact visual style. Do NOT use photorealistic or realistic rendering.` : '';

    // Build a blockbuster-style trailer prompt
    return `Create an iconic teaser trailer for the series "${title}".

${logline}${styleGuidance}

TRAILER REQUIREMENTS:

1. OPENING TITLE CARD: Begin with a striking title card displaying "${title}" in beautiful, bold typography that matches the show's aesthetic. The title should be elegant, memorable, and set the tone for what follows. Hold for 2-3 seconds.

2. VOICEOVER NARRATION: Include a professional, CINEMATIC trailer voiceover that sounds like an ACTUAL movie trailer - NOT someone reading a script or explaining the show:
   
   CRITICAL: The voiceover must be ENGAGING, DRAMATIC, and ICONIC - like the voice actors in real Hollywood trailers.
   
   Genre-Specific Voice Direction:
   - For COMEDY: The "In a World" guy doing comedy - dry wit, impeccable timing, knowing irony. Think: casual cool meets sharp humor
   - For ACTION: Deep, gravelly, INTENSE voice (think: Hans Zimmer trailer narrator). Every word drips with stakes and danger
   - For HORROR: Whispered menace, bone-chilling calm before the storm. Not explaining - HAUNTING
   - For DRAMA: Emotional power, thoughtful gravitas, pulls at heartstrings. Raw and real
   - For ADVENTURE: Epic, wonder-struck, makes you FEEL the journey. Grand and inspiring
   
   VOICEOVER STYLE RULES:
   ✓ Short, punchy phrases that PUNCTUATE visuals
   ✓ Build tension and intrigue with each line
   ✓ Use trailer-speak: fragments, dramatic pauses, building rhythm
   ✓ Match the energy of what's on screen
   ✓ End lines on power words that hit hard
   ✓ Create mystery - DON'T explain everything
   
   ✗ NEVER sound like: "This is a show about..." or "Meet the characters who..."
   ✗ NEVER be explanatory or expository
   ✗ NEVER use boring, flat narration
   ✗ NEVER sound like a documentary narrator
   
   EXAMPLE GOOD TRAILER VOICEOVER STYLE:
   "Some secrets... [pause] ...refuse to stay buried."
   "In a world on the edge... one choice... will change everything."
   "They thought they knew the truth. They were wrong."
   
   The narrator should sound like a PROFESSIONAL TRAILER VOICE ACTOR - commanding, magnetic, impossible to ignore.

3. Study the character grid reference image to understand the cast, weaving them into the narrative
4. Create a well-paced, exciting montage that captures the show's core vibe and genre
5. Showcase the MOST INTERESTING and ICONIC moments that would make viewers want to watch
6. Build anticipation and intrigue through dynamic editing, compelling visuals, and punchy narration

PACING & STRUCTURE:
- Open with the title card (2-3 seconds) with impactful music
- Voiceover opens with a HOOK - short, powerful, mysterious (NOT "In a world where..." unless it's perfect for the tone)
- Quick cuts showcasing key characters and moments, each PUNCTUATED by sharp voiceover phrases
- Build energy and TENSION throughout - narration should ESCALATE, not plateau
- Include 2-3 memorable "money shots" with power-word voiceover hits
- Voiceover rhythm: SHORT bursts that let visuals breathe, then hit HARD on the next beat
- FINAL LINE must be a KILLER moment that leaves you wanting more - one perfect sentence that defines everything

TONE & GENRE GUIDANCE:
- If COMEDY: Visual humor, perfect timing, absurd situations. Voiceover: DRY, WITTY, self-aware - the voice is IN on the joke.
- If ACTION: Dynamic movement, EXPLOSIVE tension, life-or-death stakes. Voiceover: INTENSE, gravelly, every word is WAR.
- If HORROR: Creeping dread, shadows, the unseen. Voiceover: WHISPERED menace, bone-chilling calm, what's NOT said is scarier.
- If DRAMA: Raw emotion, character conflict, human stakes. Voiceover: POWERFUL vulnerability, real and heartfelt, tears or triumph.
- If ADVENTURE: Epic scope, wonder, impossible journeys. Voiceover: GRAND, awe-filled, makes you believe in magic.

VISUAL APPROACH:
- Use dynamic camera movements and impactful compositions
- Vary shot sizes: wide establishing shots, dramatic close-ups, mid-shots for action
- Match the show's visual style and production medium exactly (see above)
- Create a sense of scale and production value
- Every frame should feel intentional and exciting
- Sync visuals with voiceover for maximum impact

The character grid shows your cast - use them throughout but focus on MOMENTS and ATMOSPHERE matched with compelling narration.

Show data: ${JSON.stringify(show).slice(0, 2000)}`;
  })();

  console.log("=== TRAILER GENERATION ===");
  console.log("Title:", title);
  console.log("Logline:", logline.slice(0, 100));
  console.log("Character grid URL:", characterGridUrl);
  console.log("Requested model:", requestedModel);

  // Helper function to generate with specific model
  async function generateWithModel(modelName: string): Promise<{ url: string; model: string } | null> {
    switch (modelName) {
      case 'sora-2':
        return generateWithSora(trailerPrompt, characterGridUrl, jobId, false);
      case 'sora-2-pro':
        return generateWithSora(trailerPrompt, characterGridUrl, jobId, true);
      case 'veo-3.1':
        return generateWithVeo(trailerPrompt, characterGridUrl, jobId);
      default:
        return null;
    }
  }

  let finalUrl: string | undefined;
  let finalModel: string | undefined;

  try {
    setTrailerStatusRecord(jobId, "starting");
    
    // If specific model requested, use it directly
    if (requestedModel && requestedModel !== 'auto') {
      console.log(`🎬 Generating trailer with requested model: ${requestedModel}...`);
      const result = await generateWithModel(requestedModel);
      if (result) {
        console.log(`✅ Trailer generated with ${result.model}:`, result.url);
        return NextResponse.json({ url: result.url, model: result.model });
      }
      throw new Error(`Failed to generate trailer with ${requestedModel}`);
    }
    
    // Auto mode: Try Sora 2 first, fallback to VEO 3.1 on E005
    console.log("🎬 Auto mode: Attempting trailer with Sora 2...");
    
    try {
      const soraResult = await generateWithSora(trailerPrompt, characterGridUrl, jobId, false);
      if (soraResult) {
        console.log(`✅ Trailer generated with ${soraResult.model}:`, soraResult.url);
        return NextResponse.json({ url: soraResult.url, model: soraResult.model });
      }
    } catch (soraError) {
      const soraErrorMsg = soraError instanceof Error ? soraError.message : "";
      
      // Check if E005 - try VEO fallback
      if (soraErrorMsg.includes("E005") || soraErrorMsg.includes("flagged as sensitive")) {
        console.warn("⚠️ Sora flagged content, falling back to VEO 3.1...");
        throw new Error("E005_FALLBACK");
      }
      
      // Re-throw other errors
      throw soraError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    
    // Fallback to VEO 3.1 on E005
    if (errorMessage === "E005_FALLBACK") {
      console.log("🔄 Falling back to VEO 3.1...");
      console.log("Original Sora error was E005 (content moderation)");
      setTrailerStatusRecord(jobId, "veo-starting");
      
      try {
        console.log("🎬 Setting up VEO 3.1 prediction...");
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
        setTrailerStatusRecord(jobId, `veo-${veoResult.status}`);
        while (veoResult.status === "starting" || veoResult.status === "processing") {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${veoResult.id}`, {
            headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
          });
          veoResult = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
          console.log("VEO status:", veoResult.status);
          setTrailerStatusRecord(jobId, `veo-${veoResult.status}`);
        }

        if (veoResult.status === "failed") {
          throw new Error(veoResult.error || "VEO generation also failed");
        }

        if (veoResult.status === "succeeded") {
          console.log("✅ VEO succeeded, extracting output...");
          console.log("VEO output type:", typeof veoResult.output);
          console.log("VEO output:", veoResult.output);
        }

        // Extract VEO URL
        if (typeof veoResult.output === "string") {
          finalUrl = veoResult.output;
        } else if (Array.isArray(veoResult.output) && veoResult.output.length > 0) {
          finalUrl = veoResult.output[0] as string;
        }

        if (finalUrl) {
          console.log("✅ Trailer generated with VEO 3.1 (fallback):", finalUrl);
          setTrailerStatusRecord(jobId, "succeeded (veo)", undefined, finalUrl, "veo-3.1");
          return NextResponse.json({ url: finalUrl, model: "veo-3.1" });
        }
        
        // VEO fallback completed but produced no URL
        console.error("VEO fallback completed but produced no output URL");
        setTrailerStatusRecord(jobId, "failed", "Sora flagged content, VEO fallback produced no output");
        return NextResponse.json({ 
          error: "Both Sora and VEO 3.1 failed. Sora flagged content as sensitive, and VEO 3.1 did not produce a video output." 
        }, { status: 500 });

      } catch (veoError) {
        console.error("VEO fallback also failed:", veoError);
        const veoMessage = veoError instanceof Error ? veoError.message : "VEO generation failed";
        
        // Final fallback: Try Sora 2 again WITHOUT the character grid
        console.log("🔄 Final fallback: Trying Sora 2 without character grid...");
        setTrailerStatusRecord(jobId, "final-fallback-starting");
        
        try {
          const soraFallbackInput = {
            prompt: trailerPrompt,
            // No reference_images - just use the prompt
            aspect_ratio: "16:9",
            duration: 12,
            resolution: "1080p",
            generate_audio: true,
          };

          console.log("Sora 2 (no grid) input:", JSON.stringify(soraFallbackInput, null, 2));

          const soraFallbackResponse = await fetch("https://api.replicate.com/v1/models/openai/sora-2/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ input: soraFallbackInput }),
          });

          if (!soraFallbackResponse.ok) {
            throw new Error(`Sora fallback request failed: ${soraFallbackResponse.status}`);
          }

          const soraFallbackPrediction = await soraFallbackResponse.json() as { id: string; status: string; error?: string; output?: unknown };
          console.log("Sora 2 (no grid) prediction created:", soraFallbackPrediction.id);

          // Poll for completion
          let soraFallbackResult = soraFallbackPrediction;
          setTrailerStatusRecord(jobId, `final-fallback-${soraFallbackResult.status}`);
          while (soraFallbackResult.status === "starting" || soraFallbackResult.status === "processing") {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${soraFallbackResult.id}`, {
              headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
            });
            soraFallbackResult = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
            console.log("Sora 2 (no grid) status:", soraFallbackResult.status);
            setTrailerStatusRecord(jobId, `final-fallback-${soraFallbackResult.status}`);
          }

          if (soraFallbackResult.status === "failed") {
            throw new Error(soraFallbackResult.error || "Sora (no grid) also failed");
          }

          // Extract URL
          let fallbackUrl: string | undefined;
          if (typeof soraFallbackResult.output === "string") {
            fallbackUrl = soraFallbackResult.output;
          } else if (Array.isArray(soraFallbackResult.output) && soraFallbackResult.output.length > 0) {
            fallbackUrl = soraFallbackResult.output[0] as string;
          }

          if (fallbackUrl) {
            console.log("✅ Trailer generated with Sora 2 (final fallback, no grid):", fallbackUrl);
            setTrailerStatusRecord(jobId, "succeeded", undefined, fallbackUrl, "sora-2-fallback");
            return NextResponse.json({ url: fallbackUrl, model: "sora-2-fallback" });
          }

          throw new Error("Sora (no grid) produced no output");

        } catch (finalFallbackError) {
          console.error("All fallbacks failed:", finalFallbackError);
          const finalMessage = finalFallbackError instanceof Error ? finalFallbackError.message : "Final fallback failed";
          setTrailerStatusRecord(jobId, "failed", `All methods failed: Sora (with grid) was flagged, VEO failed (${veoMessage}), Sora (no grid) failed (${finalMessage})`);
          return NextResponse.json({ 
            error: `All trailer generation methods failed:\n1. Sora 2 (with character grid) was flagged as sensitive\n2. VEO 3.1 fallback: ${veoMessage}\n3. Sora 2 (without grid) fallback: ${finalMessage}\n\nPlease try adjusting your show description or character details.` 
          }, { status: 500 });
        }
      }
    }
    
    console.error("[trailer] Error:", error);
    let message = error instanceof Error ? error.message : "Failed to generate trailer.";
    
    // Don't expose internal fallback error code to client
    if (message === "E005_FALLBACK") {
      message = "Trailer generation failed - content was flagged by moderation. Please try adjusting your prompt or character descriptions.";
    }
    
    setTrailerStatusRecord(jobId, "failed", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Should not reach here
  return NextResponse.json(
    { error: "Unexpected trailer response format." },
    { status: 502 }
  );
}
