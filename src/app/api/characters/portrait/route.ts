import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import Replicate from "replicate";

type PortraitBody = {
  show: unknown;
  character: unknown;
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

  let body: PortraitBody;
  try {
    body = (await request.json()) as PortraitBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Portrait generation requires 'show' and 'character' payloads." },
      { status: 400 }
    );
  }

  if (typeof body.show !== "object" || body.show === null) {
    return NextResponse.json(
      { error: "Portrait generation requires the show blueprint object." },
      { status: 400 }
    );
  }

  if (typeof body.character !== "object" || body.character === null) {
    return NextResponse.json(
      { error: "Portrait generation requires the character blueprint object." },
      { status: 400 }
    );
  }

  const showJson = trimJson(body.show);
  const characterJson = trimJson(body.character);

  const prompt = [
    "Create a highly art-directed 2:3 character portrait.",
    "Focus on cinematic lighting, intentional wardrobe, and expressive posture.",
    "Respect the show's aesthetic while capturing the essence of the character.",
    "Every choice must adhere to the aesthetic, palette, lighting, and creative rules specified in the show blueprint JSON.",
    "",
    "Show blueprint JSON:",
    showJson,
    "",
    "Character blueprint JSON:",
    characterJson,
  ].join("\n");

  try {
    const result = (await replicate.run("openai/gpt-image-1", {
      input: {
        prompt,
        quality: "high",
        aspect_ratio: "2:3",
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
          error: "Unexpected portrait response format.",
          details: result,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[characters/portrait] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate portrait.";
    if (
      typeof message === "string" &&
      /string (too long|above max length)/i.test(message)
    ) {
      return NextResponse.json(
        {
          error:
            "Portrait prompt exceeded provider limits even after truncation. Try simplifying the character.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
