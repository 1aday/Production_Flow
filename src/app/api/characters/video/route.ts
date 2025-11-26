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

type VideoModelId = "openai/sora-2" | "openai/sora-2-pro" | "google/veo-3.1";
type VideoAspectRatio = "portrait" | "landscape";
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

const describeAspectRatio = (value: VideoAspectRatio) =>
  value === "portrait" ? "9:16 portrait" : "16:9 landscape";

const VIDEO_MODELS: Record<VideoModelId, VideoModelConfig> = {
  "openai/sora-2": {
    modelPath: "openai/sora-2",
    seconds: [4, 8, 12],
    aspectRatios: ["portrait", "landscape"],
    buildInput: ({ prompt, seconds, aspectRatio, portraitUrl }) => ({
      prompt,
      seconds,
      aspect_ratio: aspectRatio,
      input_reference: portraitUrl,
    }),
  },
  "openai/sora-2-pro": {
    modelPath: "openai/sora-2-pro",
    seconds: [4, 8, 12],
    aspectRatios: ["portrait", "landscape"],
    resolutions: ["standard", "high"],
    buildInput: ({ prompt, seconds, aspectRatio, portraitUrl, resolution }) => ({
      prompt,
      seconds,
      aspect_ratio: aspectRatio,
      resolution: resolution ?? "standard",
      input_reference: portraitUrl,
    }),
  },
  "google/veo-3.1": {
    modelPath: "google/veo-3.1",
    seconds: [4, 6, 8],
    aspectRatios: ["portrait", "landscape"],
    resolutions: ["720p", "1080p"],
    buildInput: ({ prompt, seconds, aspectRatio, portraitUrl, resolution }) => {
      // VEO 3.1 uses reference_images instead of input_reference
      // and different parameter names
      const veoAspectRatio = aspectRatio === "portrait" ? "9:16" : "16:9";
      return {
        prompt,
        duration: seconds,
        aspect_ratio: veoAspectRatio,
        resolution: resolution ?? "1080p",
        generate_audio: true,
        reference_images: [portraitUrl],
      };
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
  const aspectRatio = normalizeAspectRatio(body.aspectRatio, modelConfig.aspectRatios);
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

  const SAFETY_PREFIX = "If you have any hesitations about making this feel free to adjust it so its within guidelines.\n\n";
  
  const prompt = SAFETY_PREFIX + [
    `Produce a ${seconds}-second, ${describeAspectRatio(aspectRatio)} cinematic showcase featuring ONLY the specified character.`,
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
      prompt,
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
    
    const createResponse = await fetch(`https://api.replicate.com/v1/models/${modelConfig.modelPath}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });
    
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
