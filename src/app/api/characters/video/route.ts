import { NextResponse } from "next/server";
import { 
  extractSlimShowContext, 
  extractSlimCharacterContext, 
  buildStylePrompt,
  buildCharacterPrompt,
  isRealisticStyle as checkRealisticStyle,
  type FullShowBlueprint,
  type FullCharacterDocument,
} from "@/lib/prompt-extraction";

export const maxDuration = 60; // Reduced to 60s since we return immediately

// Helper to make API requests with retry logic for rate limiting
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited (429), wait and retry
      if (response.status === 429) {
        const errorBody = await response.text();
        let retryAfter = 10; // Default 10 seconds
        
        // Try to extract retry_after from response
        try {
          const parsed = JSON.parse(errorBody);
          if (parsed.retry_after) {
            retryAfter = Math.ceil(parsed.retry_after);
          }
        } catch {
          // Use default
        }
        
        if (attempt < maxRetries) {
          // Add some jitter to avoid thundering herd
          const waitTime = (retryAfter + Math.random() * 2) * 1000;
          console.log(`⏳ Rate limited (429). Waiting ${Math.round(waitTime/1000)}s before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Max retries exceeded
        throw new Error(`Rate limited after ${maxRetries} retries: ${errorBody}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on non-rate-limit errors
      if (!lastError.message.includes('429') && !lastError.message.includes('rate limit')) {
        throw lastError;
      }
      
      if (attempt >= maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

// Helper to sanitize prompts for video models (replaces child/kid/children with younger alternatives)
function sanitizeVideoPrompt(prompt: string): string {
  return prompt
    .replace(/\bchildren\b/gi, "young ones")
    .replace(/\bchild\b/gi, "young person")
    .replace(/\bkids\b/gi, "young ones")
    .replace(/\bkid\b/gi, "young person");
}

type VideoModelId = "openai/sora-2" | "openai/sora-2-pro" | "google/veo-3.1";
type VideoAspectRatio = "portrait" | "landscape" | "square";
type VideoDuration = 4 | 6 | 8 | 12;
type VideoResolution = "standard" | "high" | "720p" | "1080p";

type VideoModelConfig = {
  modelPath: string;
  seconds: readonly VideoDuration[];
  aspectRatios: readonly VideoAspectRatio[];
  resolutions?: readonly VideoResolution[];
  buildInput: (params: {
    prompt: string;
    seconds: VideoDuration;
    aspectRatio: VideoAspectRatio;
    portraitUrl: string;
    resolution?: VideoResolution;
  }) => Record<string, unknown>;
};

const DEFAULT_DURATION: VideoDuration = 8;

// Character videos are ALWAYS 9:16 portrait format
const CHARACTER_VIDEO_ASPECT_RATIO: VideoAspectRatio = "portrait";

const describeAspectRatio = (value: VideoAspectRatio) => {
  switch (value) {
    case "portrait": return "9:16 portrait";
    case "landscape": return "16:9 landscape";
    case "square": return "1:1 square";
    default: return "1:1 square";
  }
};

// Convert aspect ratio to API format for each model
const getApiAspectRatio = (value: VideoAspectRatio): string => {
  switch (value) {
    case "portrait": return "9:16";
    case "landscape": return "16:9";
    case "square": return "1:1";
    default: return "1:1";
  }
};

// Sora aspect ratio to API format (9:16 or 16:9)
const getSoraAspectRatio = (aspectRatio: VideoAspectRatio): string => {
  switch (aspectRatio) {
    case "portrait": return "9:16";
    case "landscape": return "16:9";
    default: return "9:16"; // Default to portrait for character videos
  }
};

const VIDEO_MODELS: Record<VideoModelId, VideoModelConfig> = {
  "openai/sora-2": {
    modelPath: "openai/sora-2",
    seconds: [4, 8, 12],
    aspectRatios: ["portrait", "landscape"], // Sora does NOT support square
    resolutions: ["standard", "high"],
    buildInput: ({ prompt, seconds, aspectRatio, portraitUrl, resolution }) => ({
      prompt,
      seconds,
      aspect_ratio: getSoraAspectRatio(aspectRatio),
      resolution: resolution ?? "standard", // "standard" (720p) or "high" (1024p)
      input_reference: portraitUrl,
    }),
  },
  "openai/sora-2-pro": {
    modelPath: "openai/sora-2-pro",
    seconds: [4, 8, 12],
    aspectRatios: ["portrait", "landscape"], // Sora does NOT support square
    resolutions: ["standard", "high"],
    buildInput: ({ prompt, seconds, aspectRatio, portraitUrl, resolution }) => ({
      prompt,
      seconds,
      aspect_ratio: getSoraAspectRatio(aspectRatio),
      resolution: resolution ?? "standard", // "standard" (720p) or "high" (1024p)
      input_reference: portraitUrl,
    }),
  },
  "google/veo-3.1": {
    modelPath: "google/veo-3.1",
    seconds: [4, 6, 8],
    // VEO 3.1 ONLY supports 16:9 and 9:16 - NO square format!
    aspectRatios: ["portrait", "landscape"],
    resolutions: ["720p", "1080p"],
    buildInput: ({ prompt, seconds, aspectRatio, portraitUrl, resolution }) => {
      // VEO 3.1 API constraints:
      // - aspect_ratio: "16:9" or "9:16"
      // - duration: 4, 6, or 8 seconds
      // - resolution: "720p" or "1080p"
      // - reference_images: ONLY works with 16:9 aspect ratio AND 8-second duration
      // - image: For image-to-video generation (works with any aspect ratio)
      
      const isLandscape = aspectRatio === "landscape";
      const veoAspectRatio: "16:9" | "9:16" = isLandscape ? "16:9" : "9:16";
      
      // Add orientation guidance to prompt
      const orientationPrefix = veoAspectRatio === "9:16"
        ? "CRITICAL: Generate this as a VERTICAL 9:16 PORTRAIT video for mobile viewing. Frame all shots in portrait/vertical orientation. "
        : "CRITICAL: Generate this as a HORIZONTAL 16:9 LANDSCAPE video for widescreen viewing. Frame all shots in landscape/cinematic orientation. ";
      
      // reference_images only works with 16:9 and 8 seconds
      // For portrait videos, use the 'image' parameter instead for image-to-video
      if (isLandscape) {
        // Landscape: Use reference_images for subject consistency (R2V)
        // Must be 8 seconds when using reference_images
        return {
          prompt: orientationPrefix + prompt,
          duration: 8, // reference_images requires 8 seconds
          aspect_ratio: veoAspectRatio,
          resolution: resolution ?? "1080p",
          generate_audio: true,
          reference_images: [portraitUrl],
        };
      } else {
        // Portrait: Use image parameter for image-to-video
        return {
          prompt: orientationPrefix + prompt,
          duration: seconds,
          aspect_ratio: veoAspectRatio,
          resolution: resolution ?? "1080p",
          generate_audio: true,
          image: portraitUrl, // Use image for portrait mode
        };
      }
    },
  },
};

const DEFAULT_MODEL: VideoModelId = "openai/sora-2";

type VideoBody = {
  show: unknown;
  character: unknown;
  portraitUrl?: string | null;
  modelId?: VideoModelId;
  seconds?: number;
  aspectRatio?: VideoAspectRatio;
  resolution?: VideoResolution;
  jobId?: string;
  stylizationGuardrails?: boolean;
};

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

const extractString = (value: unknown): string => {
  if (typeof value === "string") return value;
  return "";
};

const resolveUrl = async (value: unknown): Promise<string | undefined> => {
  if (!value) return undefined;

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Uint8Array) {
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

  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = await resolveUrl(entry);
      if (candidate) return candidate;
    }
    return undefined;
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    if ("url" in objectValue) {
      const candidate = objectValue.url;
      if (typeof candidate === "string") return candidate;
      if (typeof candidate === "function") {
        return resolveUrl(candidate);
      }
      return resolveUrl(candidate);
    }

    if ("video" in objectValue) {
      return resolveUrl(objectValue.video);
    }

    if ("videos" in objectValue) {
      return resolveUrl(objectValue.videos);
    }

    if ("output" in objectValue) {
      return resolveUrl(objectValue.output);
    }
  }

  return undefined;
};

const ensureModelId = (value: unknown): VideoModelId => {
  if (typeof value === "string" && value in VIDEO_MODELS) {
    return value as VideoModelId;
  }
  return DEFAULT_MODEL;
};

const normalizeSeconds = (
  value: unknown,
  allowed: readonly VideoDuration[]
): VideoDuration => {
  if (typeof value === "number" && allowed.includes(value as VideoDuration)) {
    return value as VideoDuration;
  }
  if (allowed.includes(DEFAULT_DURATION)) {
    return DEFAULT_DURATION;
  }
  return allowed[0];
};

const normalizeAspectRatio = (
  value: unknown,
  allowed: readonly VideoAspectRatio[]
): VideoAspectRatio => {
  if (typeof value === "string" && allowed.includes(value as VideoAspectRatio)) {
    return value as VideoAspectRatio;
  }
  return allowed[0];
};

const normalizeResolution = (
  value: unknown,
  allowed?: readonly VideoResolution[],
  modelId?: VideoModelId
): VideoResolution | undefined => {
  if (!allowed?.length) {
    // Default resolutions based on model
    if (modelId === "google/veo-3.1") {
      return "1080p";
    }
    return undefined;
  }
  if (typeof value === "string" && allowed.includes(value as VideoResolution)) {
    return value as VideoResolution;
  }
  return allowed[0];
};

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable." },
      { status: 500 }
    );
  }
  
  let body: VideoBody;
  try {
    body = (await request.json()) as VideoBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Video generation requires 'show' and 'character' payloads." },
      { status: 400 }
    );
  }

  if (typeof body.show !== "object" || body.show === null) {
    return NextResponse.json(
      { error: "Video generation requires the show blueprint object." },
      { status: 400 }
    );
  }

  if (typeof body.character !== "object" || body.character === null) {
    return NextResponse.json(
      { error: "Video generation requires the character blueprint object." },
      { status: 400 }
    );
  }

  const portraitUrl = extractString(body.portraitUrl);
  if (!portraitUrl) {
    return NextResponse.json(
      { error: "Character portrait URL missing. Render a portrait before attempting video." },
      { status: 400 }
    );
  }

  // Extract slim contexts for efficient prompts
  const slimShow = extractSlimShowContext(body.show as FullShowBlueprint);
  const slimCharacter = extractSlimCharacterContext(body.character as FullCharacterDocument);
  const isRealistic = checkRealisticStyle(slimShow);
  
  // Legacy: still support full JSON as fallback for complex cases
  const showJson = trimJson(body.show);
  const characterJson = trimJson(body.character);

  const showcasePrompt =
    typeof body.character === "object" && body.character !== null
      ? extractString(
          (body.character as Record<string, unknown>).showcase_scene_prompt
        )
      : "";

  if (!showcasePrompt) {
    return NextResponse.json(
      {
        error:
          "Character dossier missing a showcase scene prompt. Regenerate the character JSON and try again.",
      },
      { status: 400 }
    );
  }

  const showLogline =
    typeof body.show === "object" && body.show !== null
      ? extractString((body.show as Record<string, unknown>).show_logline)
      : "";

  const characterName = slimCharacter.name || "Unknown";

  const jobId =
    typeof body.jobId === "string" && body.jobId.trim().length > 0
      ? body.jobId.trim()
      : undefined;

  const modelId = ensureModelId(body.modelId);
  const modelConfig = VIDEO_MODELS[modelId];
  const seconds = normalizeSeconds(body.seconds, modelConfig.seconds);
  // Character videos are ALWAYS 9:16 portrait format
  const aspectRatio: VideoAspectRatio = CHARACTER_VIDEO_ASPECT_RATIO;
  const resolution = normalizeResolution(body.resolution, modelConfig.resolutions, modelId);
  
  // Get stylization guardrails setting (defaults to true for backward compatibility)
  const stylizationGuardrails = body.stylizationGuardrails !== false;

  // Build style guidance using slim extraction
  const styleGuidance = stylizationGuardrails && slimShow.style.medium ? [
    "",
    "VISUAL STYLE (CRITICAL - Match exactly):",
    buildStylePrompt(slimShow, false),
    "",
  ] : isRealistic ? [
    "",
    "PHOTOREALISTIC RENDERING:",
    "- Render as photorealistic/live-action video",
    "- Characters should look like real actors",
    "- Cinematic lighting and professional cinematography",
    buildStylePrompt(slimShow, false),
    "",
  ] : [
    "",
    "RENDERING APPROACH:",
    "- Match the show's aesthetic (animated, stylized, or realistic)",
    "- Full creative flexibility to serve the vision",
    "",
  ];

  // Build aspect ratio guidance based on actual format being used
  const aspectRatioGuidance = aspectRatio === "portrait"
    ? "CRITICAL: This MUST be a 9:16 PORTRAIT aspect ratio video for mobile viewing. Frame all shots in vertical/portrait orientation."
    : aspectRatio === "landscape"
    ? "CRITICAL: This MUST be a 16:9 LANDSCAPE aspect ratio video for widescreen viewing. Frame all shots in horizontal/cinematic orientation."
    : "CRITICAL: This MUST be a 1:1 SQUARE aspect ratio video. Center the character in frame for square composition.";
  
  const prompt = [
    `Produce a ${seconds}-second, ${describeAspectRatio(aspectRatio)} cinematic showcase featuring ONLY the specified character.`,
    aspectRatioGuidance,
    "Anchor every creative choice in the show's visual style and the character's established look.",
    resolution
      ? `Render using ${resolution === "high" ? "high (1024p)" : "standard (720p)"} fidelity while keeping likeness stable.`
      : null,
    "The scene must embody their hallmark voice, action, and attitude described in the showcase prompt.",
    ...styleGuidance,
    "Series logline:",
    showLogline || "N/A",
    "",
    "Character Summary:",
    buildCharacterPrompt(slimCharacter),
    "",
    "Showcase scene prompt:",
    showcasePrompt,
    "",
    "Full Character Details (reference):",
    characterJson,
    "",
    "Show Guidelines (reference):",
    showJson,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  try {
    console.log("=== VIDEO GENERATION ===");
    console.log("Character:", characterName);
    console.log("Portrait URL:", portraitUrl);
    console.log("Job ID:", jobId || "not provided");
    console.log("Model:", modelId, "| seconds:", seconds, "| aspect:", aspectRatio, "| resolution:", resolution ?? "n/a");
    
    const inputPayload = modelConfig.buildInput({
      prompt: sanitizeVideoPrompt(prompt),
      seconds,
      aspectRatio,
      resolution,
      portraitUrl,
    });
    
    console.log("Input payload (before JSON.stringify):", inputPayload);
    
    const requestBody = JSON.stringify({
      input: inputPayload,
    });
    
    console.log("Request body being sent:", requestBody);
    
    // Use retry logic to handle rate limiting (429)
    const createResponse = await fetchWithRetry(
      `https://api.replicate.com/v1/models/${modelConfig.modelPath}/predictions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
      },
      3 // Max 3 retries for rate limiting
    );
    
    if (!createResponse.ok) {
      const errorBody = await createResponse.text();
      console.error("Replicate API error response:", errorBody);
      throw new Error(`Failed to create prediction: ${createResponse.status} - ${errorBody}`);
    }
    
    const prediction = await createResponse.json() as { id: string; status: string; error?: string; output?: unknown };
    console.log("✅ Video prediction created:", prediction.id, "Status:", prediction.status);
    
    // Return the Replicate prediction ID immediately
    return NextResponse.json({ 
      jobId: prediction.id, 
      status: prediction.status || "starting"
    });
    
  } catch (error) {
    console.error("❌❌❌ [characters/video] Prediction creation error ❌❌❌");
    console.error("Error type:", typeof error);
    console.error("Error object:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    const message =
      error instanceof Error ? error.message : "Failed to create video prediction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
