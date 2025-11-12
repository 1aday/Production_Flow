import { NextResponse } from "next/server";
export const maxDuration = 300; // 5 minutes for video generation

type VideoModelId = "openai/sora-2" | "openai/sora-2-pro";
type VideoAspectRatio = "portrait" | "landscape";
type VideoDuration = 4 | 8 | 12;
type VideoResolution = "standard" | "high";

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
  allowed?: readonly VideoResolution[]
): VideoResolution | undefined => {
  if (!allowed?.length) {
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

  const characterName =
    typeof body.character === "object" && body.character !== null
      ? extractString((body.character as Record<string, unknown>).character)
      : "";

  const modelId = ensureModelId(body.modelId);
  const modelConfig = VIDEO_MODELS[modelId];
  const seconds = normalizeSeconds(body.seconds, modelConfig.seconds);
  const aspectRatio = normalizeAspectRatio(body.aspectRatio, modelConfig.aspectRatios);
  const resolution = normalizeResolution(body.resolution, modelConfig.resolutions);

  // Extract production style
  const productionStyle = (body.show as { production_style?: {
    medium?: string;
    cinematic_references?: string[];
    visual_treatment?: string;
  } }).production_style;

  const styleGuidance = productionStyle ? [
    "",
    "VISUAL STYLE (CRITICAL - Match exactly):",
    `Medium: ${productionStyle.medium || 'Stylized cinematic'}`,
    `References: ${(productionStyle.cinematic_references || []).join(', ')}`,
    `Treatment: ${productionStyle.visual_treatment || 'Cinematic theatrical style'}`,
    "Do NOT use photorealistic rendering if the style specifies animation or stylization.",
    "",
  ] : [];

  const prompt = [
    `Produce a ${seconds}-second, ${describeAspectRatio(aspectRatio)} cinematic showcase featuring ONLY the specified character.`,
    "Anchor every creative choice in the show blueprint's visual rules and the character dossier.",
    resolution
      ? `Render using ${resolution === "high" ? "high (1024p)" : "standard (720p)"} fidelity while keeping likeness stable.`
      : null,
    "The scene must embody their hallmark voice, action, and attitude described in the showcase prompt.",
    ...styleGuidance,
    "Series logline:",
    showLogline || "N/A",
    "",
    "Character identifier:",
    characterName || "Unknown",
    "",
    "Showcase scene prompt:",
    showcasePrompt,
    "",
    "Character dossier JSON:",
    characterJson,
    "",
    "Show blueprint JSON:",
    showJson,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  try {
    console.log("=== VIDEO GENERATION ===");
    console.log("Character:", characterName);
    console.log("Portrait URL:", portraitUrl);
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
    console.log("Prediction created:", prediction.id, "Status:", prediction.status);
    
    // Wait for completion
    let result = prediction;
    while (result.status === "starting" || result.status === "processing") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      result = await statusResponse.json() as { id: string; status: string; error?: string; output?: unknown };
      console.log("Status:", result.status);
    }
    
    if (result.status === "failed") {
      throw new Error(result.error || "Video generation failed");
    }
    
    if (result.status === "canceled") {
      throw new Error("Video generation was canceled");
    }

    const url = await resolveUrl(result.output);

    if (!url) {
      return NextResponse.json(
        {
          error: "Unexpected video response format.",
          details: result.output,
        },
        { status: 502 }
      );
    }

    console.log("✅ Video generated successfully:", url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[characters/video] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate video.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
