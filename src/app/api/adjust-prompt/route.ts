import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 30;

type AdjustPromptBody = {
  originalPrompt: string;
  generationType: "portrait" | "trailer" | "video" | "episode-still" | "episode-clip";
  errorMessage?: string;
  attemptNumber: number;
};

export async function POST(request: NextRequest) {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: AdjustPromptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { originalPrompt, generationType, errorMessage, attemptNumber } = body;

  if (!originalPrompt || !generationType) {
    return NextResponse.json(
      { error: "Missing required fields: originalPrompt, generationType" },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey: openaiKey });

  // Build context-aware system prompt based on generation type
  const contextByType: Record<string, string> = {
    portrait: "character portrait image generation (for a TV show character headshot/portrait)",
    trailer: "video trailer generation (for a TV show promotional trailer)",
    video: "character showcase video generation (short video clip of a TV show character)",
    "episode-still": "episode scene still image generation (a keyframe from a TV episode scene)",
    "episode-clip": "episode scene video clip generation (a short video clip of a TV episode scene)",
  };

  const context = contextByType[generationType] || "media generation";

  // Determine adjustment intensity based on attempt number
  const intensityGuidance = attemptNumber >= 6 
    ? `This is attempt #${attemptNumber}, so make MORE SIGNIFICANT changes while still preserving the core intent. The previous lighter adjustments haven't worked.`
    : attemptNumber >= 4
    ? `This is attempt #${attemptNumber}, so make moderate creative adjustments while keeping the essential character and scene intact.`
    : `This is attempt #${attemptNumber}, make only slight, surgical adjustments - change as little as possible.`;

  const systemPrompt = `You are an expert prompt engineer specializing in ${context}.

Your task is to SLIGHTLY and CREATIVELY adjust a prompt that has been flagged by content moderation systems, WITHOUT changing the fundamental goal or artistic intent.

${intensityGuidance}

ADJUSTMENT GUIDELINES:
1. Preserve the core narrative, characters, and visual style
2. Replace potentially triggering words with softer synonyms:
   - "violent" → "intense" or "dramatic"
   - "blood" → "scarlet" or remove if not essential
   - "fight" → "confrontation" or "clash"
   - "kill" → "defeat" or "overcome"
   - "weapon" → "tool" or describe the object abstractly
   - "dark" themes → "complex" or "nuanced"
   - Explicit descriptions → implied or suggested
3. Add framing that emphasizes artistic/theatrical context
4. Use industry-standard terms like "cinematic", "theatrical", "dramatic"
5. If there are character descriptions that might trigger, soften them while keeping recognizability
6. Consider adding phrases like "stylized depiction", "artistic representation", "theatrical production"

CRITICAL: The adjusted prompt should still produce nearly identical results artistically - you're just packaging it in more acceptable language.

${errorMessage ? `The original error was: "${errorMessage}"` : ""}

Return an adjusted prompt that maintains the creative vision while being more likely to pass content moderation.`;

  try {
    console.log("=== LLM PROMPT ADJUSTMENT ===");
    console.log("Generation type:", generationType);
    console.log("Attempt number:", attemptNumber);
    console.log("Original prompt length:", originalPrompt.length);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Please adjust this prompt for ${context}:\n\n---\n${originalPrompt}\n---\n\nProvide an adjusted version that will pass moderation while achieving the same artistic result. Respond with JSON in this exact format: {"adjustedPrompt": "...", "adjustmentReason": "...", "confidenceLevel": "high"|"medium"|"low"}` 
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("No content from OpenAI");
    }
    
    let result: { adjustedPrompt?: string; adjustmentReason?: string; confidenceLevel?: string };
    try {
      result = JSON.parse(content);
    } catch {
      throw new Error("Failed to parse OpenAI response as JSON");
    }

    if (!result.adjustedPrompt) {
      throw new Error("No adjusted prompt in response");
    }

    console.log("✅ Prompt adjusted successfully");
    console.log("   Confidence:", result.confidenceLevel);
    console.log("   Reason:", result.adjustmentReason);
    console.log("   Adjusted prompt length:", result.adjustedPrompt.length);

    return NextResponse.json({
      success: true,
      adjustedPrompt: result.adjustedPrompt,
      adjustmentReason: result.adjustmentReason,
      confidenceLevel: result.confidenceLevel,
    });

  } catch (error) {
    console.error("❌ LLM prompt adjustment error:", error);
    const message = error instanceof Error ? error.message : "Failed to adjust prompt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

