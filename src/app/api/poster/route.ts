import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import Replicate from "replicate";

type PosterBody = {
  prompt: string;
  show: unknown;
};

const MAX_PROMPT_LENGTH = 22000;
const MAX_USER_PROMPT = 6000;
const MAX_SHOW_JSON = 12000;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const BASE_PROMPT = `Design a theatrical 3:2 movie poster for a prestige streaming series. Capture the tone, palette, lighting, and iconography from the show's visual bible. Focus on cinematic composition, premium typography, and evocative mood.`;

const trimWithEllipsis = (value: string, limit: number) => {
  if (limit <= 0) return "";
  if (value.length <= limit) return value;
  if (limit <= 1) return "…".slice(0, limit);
  return `${value.slice(0, limit - 1)}…`;
};

export async function POST(request: Request) {
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

  let body: PosterBody;
  try {
    body = (await request.json()) as PosterBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json(
      { error: "Poster generation requires a 'prompt' string." },
      { status: 400 }
    );
  }

  if (typeof body.show !== "object" || body.show === null) {
    return NextResponse.json(
      { error: "Poster generation requires the show blueprint object." },
      { status: 400 }
    );
  }

  let userPrompt = trimWithEllipsis(body.prompt, MAX_USER_PROMPT);
  let showJson = trimWithEllipsis(JSON.stringify(body.show), MAX_SHOW_JSON);

  const sections = [
    BASE_PROMPT,
    `User concept prompt: ${userPrompt}`,
    `Show look bible JSON (truncated):\n${showJson}`,
  ];

  let compositePrompt = sections.join("\n\n");

  if (compositePrompt.length > MAX_PROMPT_LENGTH) {
    const overflow = compositePrompt.length - MAX_PROMPT_LENGTH;
    const reducedShow = Math.max(2000, showJson.length - overflow - 1);
    showJson = trimWithEllipsis(showJson, reducedShow);
    sections[2] = `Show look bible JSON (truncated):\n${showJson}`;
    compositePrompt = sections.join("\n\n");
  }

  if (compositePrompt.length > MAX_PROMPT_LENGTH) {
    const overflow = compositePrompt.length - MAX_PROMPT_LENGTH;
    const reducedPrompt = Math.max(1000, userPrompt.length - overflow - 1);
    userPrompt = trimWithEllipsis(userPrompt, reducedPrompt);
    sections[1] = `User concept prompt: ${userPrompt}`;
    compositePrompt = sections.join("\n\n");
  }

  if (compositePrompt.length > MAX_PROMPT_LENGTH) {
    compositePrompt = trimWithEllipsis(compositePrompt, MAX_PROMPT_LENGTH);
  }
  const promptLength = compositePrompt.length;
  if (promptLength > MAX_PROMPT_LENGTH) {
    compositePrompt = compositePrompt.slice(0, MAX_PROMPT_LENGTH);
  }

  try {
    const result = (await replicate.run("openai/gpt-image-1", {
      input: {
        prompt: compositePrompt,
        quality: "high",
        aspect_ratio: "3:2",
        background: "auto",
        number_of_images: 1,
        openai_api_key: process.env.OPENAI_API_KEY,
      },
    })) as unknown;

    let url: string | undefined;

    if (Array.isArray(result) && result.length > 0) {
      const first = result[0] as
        | string
        | Uint8Array
        | { url?: (() => string | Promise<string>) | string };

      if (typeof first === "string") {
        url = first;
      } else if (first instanceof Uint8Array) {
        url = `data:image/png;base64,${Buffer.from(first).toString("base64")}`;
      } else if (first && typeof first === "object") {
        const candidate = first.url;
        if (typeof candidate === "string") {
          url = candidate;
        } else if (typeof candidate === "function") {
          const maybe = candidate();
          url =
            maybe && typeof (maybe as Promise<unknown>).then === "function"
              ? await (maybe as Promise<string>)
              : (maybe as string);
        }
      }
    }

    if (!url) {
      return NextResponse.json(
        {
          error: "Unexpected poster response format.",
          details: result,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[poster] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate poster.";
    if (
      typeof message === "string" &&
      /string (too long|above max length)/i.test(message)
    ) {
      return NextResponse.json(
        {
          error:
            "Poster prompt exceeded provider limits even after truncation. Try shortening the blueprint before regenerating.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
