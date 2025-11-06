import { NextResponse } from "next/server";
import OpenAI from "openai";

type ModelId = "gpt-5" | "gpt-4o";

type ExtractRequest = {
  prompt: string;
  show?: unknown;
  model?: string;
};

type CharacterSeed = {
  id: string;
  name: string;
  summary: string;
  role?: string;
  vibe?: string;
};

const MAX_SEEDS = 10;
const MAX_SHOW_CONTEXT = 10000;

const structuredSchema = {
  type: "object",
  additionalProperties: false,
  required: ["characters"],
  properties: {
    characters: {
      type: "array",
      minItems: 1,
      maxItems: MAX_SEEDS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "summary", "role", "vibe"],
        properties: {
          id: { type: "string", description: "kebab-case identifier" },
          name: { type: "string" },
          summary: { type: "string" },
          role: { type: ["string", "null"] },
          vibe: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

const systemPrompt = `You are a casting researcher and story analyst.
Given a show concept, list up to ten distinct characters that appear or should appear.
If no explicit characters are provided, invent ten that would anchor the story.
For each character provide:
- an "id" in kebab-case,
- the "name",
- a short "summary" (<= 280 characters),
- a "role" (use null if unknown) and a "vibe" descriptor (use null if unknown).
Use concise language and ensure identifiers are unique.`;

const trimJSON = (input: unknown): string | undefined => {
  if (!input) return undefined;
  try {
    const json = JSON.stringify(input);
    if (json.length <= MAX_SHOW_CONTEXT) return json;
    return `${json.slice(0, MAX_SHOW_CONTEXT - 1)}…`;
  } catch {
    return undefined;
  }
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "character";

const normalizeSeeds = (items: unknown): CharacterSeed[] => {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();

  return items.slice(0, MAX_SEEDS).map((item, index) => {
    const record = (typeof item === "object" && item !== null
      ? item
      : {}) as Record<string, unknown>;
    const name =
      typeof record.name === "string" && record.name.trim()
        ? record.name
        : `Character ${index + 1}`;
    const summary =
      typeof record.summary === "string" && record.summary.trim()
        ? record.summary
        : "No summary provided.";
    const role = typeof record.role === "string" ? record.role : undefined;
    const vibe = typeof record.vibe === "string" ? record.vibe : undefined;
    const providedId =
      typeof record.id === "string" && record.id.trim() ? record.id : undefined;

    const baseId = slugify(providedId || name);
    let uniqueId = baseId || `character-${index + 1}`;
    if (!uniqueId) {
      uniqueId = `character-${index + 1}`;
    }
    let counter = 2;
    while (seen.has(uniqueId)) {
      uniqueId = `${baseId || `character-${index + 1}`}-${counter++}`;
    }
    seen.add(uniqueId);

    return { id: uniqueId, name, summary, role, vibe };
  });
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: ExtractRequest;
  try {
    body = (await request.json()) as ExtractRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "Extraction requires a 'prompt' field." },
      { status: 400 }
    );
  }

  let model: ModelId = "gpt-5";
  if (body.model) {
    if (body.model !== "gpt-5" && body.model !== "gpt-4o") {
      return NextResponse.json(
        { error: "Unsupported model selection." },
        { status: 400 }
      );
    }
    model = body.model;
  }

  const showContext = trimJSON(body.show);
  const context = [
    `Source prompt:\n${body.prompt.trim()}`,
    showContext ? `Show blueprint JSON:\n${showContext}` : null,
    "Respond with up to ten characters in JSON.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const runWithGpt5 = async () => {
    const response = await client.responses.parse({
      model: "gpt-5",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      reasoning: { effort: "low" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "character_seeds",
          strict: true,
          schema: structuredSchema,
        },
      },
    });

    if (response.status === "incomplete") {
      const reason = response.incomplete_details?.reason ?? "unknown";
      throw new Error(`gpt-5 request incomplete (${reason})`);
    }

    const parsed = response.output_parsed as { characters?: unknown[] } | null;
    if (!parsed || !Array.isArray(parsed.characters) || parsed.characters.length === 0) {
      throw new Error("gpt-5 returned no characters");
    }

    return normalizeSeeds(parsed.characters);
  };

  const runWithGpt4o = async () => {
    const response = await client.responses.create({
      model: "gpt-4o",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
      temperature: 0.6,
      top_p: 1,
      reasoning: {},
      tools: [],
      store: false,
    });

    const outputText = (response.output_text || "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      console.error("[characters/extract] gpt-4o JSON parse failed:", outputText);
      throw new Error("Failed to parse character extraction output.");
    }

    const characters = Array.isArray((parsed as { characters?: unknown[] }).characters)
      ? (parsed as { characters: unknown[] }).characters
      : [];
    if (!characters.length) {
      throw new Error("No characters returned by the backup model.");
    }

    return normalizeSeeds(characters);
  };

  try {
    if (model === "gpt-5") {
      try {
        const seeds = await runWithGpt5();
        return NextResponse.json({ characters: seeds }, { status: 200 });
      } catch (error) {
        console.warn(
          "[characters/extract] gpt-5 parse failed, falling back to gpt-4o",
          error
        );
        // Attempt fallback below.
      }
    }

    const seeds = await runWithGpt4o();
    return NextResponse.json({ characters: seeds }, { status: 200 });
  } catch (error) {
    console.error("[characters/extract] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to contact OpenAI.";
    const status =
      typeof message === "string" &&
      (/parse character extraction output/i.test(message) ||
        /no characters returned/i.test(message) ||
        /gpt-5 request incomplete/i.test(message))
        ? 502
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
