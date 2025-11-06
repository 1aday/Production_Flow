import { NextResponse } from "next/server";
import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

import { CHARACTER_PAYLOAD_SCHEMA } from "@/lib/character-schema";

type ModelId = "gpt-5" | "gpt-4o";

type CharactersRequest = {
  prompt: string;
  show: unknown;
  model?: string;
};

const SYSTEM_DIRECTIVE = `You are the casting director for a show. Your job:
1. Read the user's prompt and the supplied show blueprint JSON.
2. Identify every unique character explicitly mentioned by name in the prompt. When no characters are mentioned, invent exactly six compelling characters aligned with the show's tone.
3. For each character, produce a detailed JSON object adhering to the supplied schema. Keep every field, even if you must infer tasteful, show-consistent values.
4. The "character" field must be a unique, kebab-case identifier (e.g., "lex-montgomery").
5. The "inherits" field MUST be the exact show blueprint string that is supplied to you—include it verbatim.
6. If you invent characters, keep the cast cohesive with the show's world-building.

Always respond with structured JSON that matches the provided schema. If you refuse, emit a refusal message instead of invalid JSON.`;

async function loadCharacterTemplate() {
  const templatePath = path.resolve(process.cwd(), "character.json");
  return fs.readFile(templatePath, "utf8");
}

type OutputFragment = {
  type: string;
  [key: string]: unknown;
};

const extractCharacters = (
  payload: unknown
): Array<Record<string, unknown>> => {
  if (Array.isArray(payload)) {
    return payload.map((entry) => {
      if (typeof entry === "string") {
        try {
          const parsed = JSON.parse(entry);
          if (parsed && typeof parsed === "object") {
            return parsed as Record<string, unknown>;
          }
        } catch {
          /* fall through */
        }
      }

      if (entry && typeof entry === "object") {
        return entry as Record<string, unknown>;
      }

      throw new Error("Character entry could not be parsed.");
    });
  }

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return extractCharacters(parsed);
    } catch {
      throw new Error("Characters payload returned as string but failed to parse.");
    }
  }

  if (payload && typeof payload === "object") {
    if ("characters" in payload) {
      // @ts-expect-error runtime narrowing
      return extractCharacters(payload.characters);
    }
  }

  throw new Error("Model response missing 'characters' array.");
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    const trimmed = text.trim();

    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      const fenced = fenceMatch[1].trim();
      if (fenced) {
        try {
          return JSON.parse(fenced);
        } catch {
          /* continue */
        }
      }
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        throw error;
      }
    }

    throw error;
  }
}

const collectTextFragments = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectTextFragments(entry));
  }
  if (typeof value === "object") {
    return Object.values(value).flatMap((entry) => collectTextFragments(entry));
  }
  return [];
};

const getOutputText = (response: unknown): string => {
  if (
    response &&
    typeof response === "object" &&
    "output_text" in response &&
    typeof (response as { output_text: unknown }).output_text === "string"
  ) {
    const text = ((response as { output_text: string }).output_text || "").trim();
    if (text.length) return text;
  }

  if (
    response &&
    typeof response === "object" &&
    "output" in response
  ) {
    const fragments = collectTextFragments(
      (response as { output: unknown }).output
    );
    const combined = fragments.join("").trim();
    if (combined.length) {
      return combined;
    }
  }

  return "";
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: CharactersRequest;
  try {
    body = (await request.json()) as CharactersRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body.prompt !== "string" ||
    !body.prompt.trim() ||
    typeof body.show !== "object" ||
    body.show === null
  ) {
    return NextResponse.json(
      {
        error:
          "Request must include 'prompt' (string) and 'show' (object) to generate characters.",
      },
      { status: 400 }
    );
  }

  if (!body.model) {
    return NextResponse.json(
      { error: "Character generation requires a model selection." },
      { status: 400 }
    );
  }

  if (body.model !== "gpt-5" && body.model !== "gpt-4o") {
    return NextResponse.json({ error: "Unsupported model selection." }, { status: 400 });
  }

  const selectedModel = body.model as ModelId;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const showBlueprintString = JSON.stringify(body.show, null, 2);
  const characterTemplateRaw = await loadCharacterTemplate();
  let characterTemplate = characterTemplateRaw;
  try {
    const parsed = JSON.parse(characterTemplateRaw);
    if (parsed && typeof parsed === "object" && "$schema" in parsed) {
      delete (parsed as Record<string, unknown> & { $schema?: string }).$schema;
    }
    characterTemplate = JSON.stringify(parsed);
  } catch {
    characterTemplate = characterTemplateRaw.replace(/\s+/g, " ");
  }

  const userInstruction = `User prompt:
${body.prompt}

Show blueprint JSON (use this string verbatim for the "inherits" field):
${showBlueprintString}

Character template (structure reference only):
${characterTemplate}

Remember:
- Return { "characters": [ ... ] } only.
- Extract all explicit characters from the user prompt. If none exist, invent exactly six.
- Each character JSON must include every field from the template.`;

  const basePayload = {
    input: [
      { role: "system" as const, content: SYSTEM_DIRECTIVE, type: "message" as const },
      { role: "user" as const, content: userInstruction, type: "message" as const },
    ],
    text: {
      format: {
        type: "json_schema" as const,
        name: "character_payload",
        schema: CHARACTER_PAYLOAD_SCHEMA,
        strict: true,
      },
    },
  };

  try {
    const response =
      selectedModel === "gpt-4o"
        ? await client.responses.create({
            ...basePayload,
            model: "gpt-4o",
            temperature: 1,
            top_p: 1,
            max_output_tokens: 2400,
            reasoning: {},
            tools: [],
            store: false,
          })
        : await client.responses.create({
            ...basePayload,
            model: "gpt-5",
            reasoning: { effort: "low" },
          });

    const fragments = Array.isArray(response.output)
      ? (response.output as Array<{ content?: OutputFragment[] }>)
          .flatMap((node) => node.content ?? [])
      : [];

    const schemaFragment = fragments.find(
      (fragment) => fragment?.type === "output_json_schema"
    ) as OutputFragment | undefined;

    let parsed: unknown;

    if (schemaFragment && "parsed" in schemaFragment) {
      parsed = (schemaFragment as { parsed: unknown }).parsed;
    } else {
      const outputText = getOutputText(response);
      if (!outputText) {
        return NextResponse.json(
          { error: "Character model returned no content." },
          { status: 502 }
        );
      }

      try {
        parsed = safeParseJson(outputText);
      } catch {
        return NextResponse.json(
          {
            error: "Failed to parse character model output as JSON.",
            details: outputText,
          },
          { status: 502 }
        );
      }
    }

    let characters: Array<Record<string, unknown>>;
    try {
      characters = extractCharacters(parsed);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Invalid character payload.",
          details: parsed,
        },
        { status: 502 }
      );
    }

    const normalized = characters.map((character) => ({
      ...character,
      inherits: showBlueprintString,
    }));

    return NextResponse.json(
      { characters: normalized, usage: response.usage },
      { status: 200 }
    );
  } catch (error) {
    console.error("[characters] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to contact OpenAI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
