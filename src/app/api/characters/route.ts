import { NextResponse } from "next/server";
import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

type ModelId = "gpt-5" | "gpt-4o";

type CharactersResponseBody = {
  prompt: string;
  show: unknown;
  model?: string;
};

const systemDirective = `You are the casting director for a show. Your job:
1. Read the user's prompt and the supplied show blueprint.
2. Identify every unique character explicitly mentioned by name in the prompt. When no characters are mentioned at all, invent exactly six compelling characters that fit the show's tone.
3. For each character, produce a JSON object that mirrors the provided character template. Keep every field, even if you must infer or invent tasteful, show-consistent values.
4. The "character" field should be a unique, kebab-case identifier (e.g., "lex-montgomery").
5. The "inherits" field MUST be the exact show blueprint string that is supplied to you—include it verbatim.
6. If you invent characters, keep the cast diverse and aligned with the show's world-building.

Return your work as a JSON object with a single key "characters" whose value is an array of character documents. Do not add extra top-level keys.`;

async function loadCharacterTemplate() {
  const templatePath = path.resolve(process.cwd(), "character.json");
  return fs.readFile(templatePath, "utf8");
}

function ensureCharactersArray(payload: unknown): Array<Record<string, unknown>> {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("characters" in payload) ||
    !Array.isArray((payload as { characters: unknown }).characters)
  ) {
    throw new Error("Model response missing 'characters' array.");
  }
  return (payload as { characters: Array<Record<string, unknown>> }).characters;
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
          // fall through to next strategy
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

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: CharactersResponseBody;
  try {
    body = (await request.json()) as CharactersResponseBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
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
  const characterTemplate = await loadCharacterTemplate();

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

  try {
    const basePayload = {
      input: [
        { role: "system" as const, content: systemDirective, type: "message" as const },
        { role: "user" as const, content: userInstruction, type: "message" as const },
      ],
      text: {
        format: {
          type: "json_object" as const,
        },
      },
    };

    if (selectedModel === "gpt-4o") {
      const response = await client.responses.create({
        ...basePayload,
        model: "gpt-4o",
        temperature: 1,
        top_p: 1,
        max_output_tokens: 2048,
        reasoning: {},
        tools: [],
        store: false,
      });

      const outputText = (response.output_text || "").trim();
      let parsed: unknown;
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

      let characters: Array<Record<string, unknown>>;
      try {
        characters = ensureCharactersArray(parsed);
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
    }

    const response = await client.responses.create({
      ...basePayload,
      model: "gpt-5",
      reasoning: { effort: "low" },
    });

    const outputText = (response.output_text || "").trim();
    let parsed: unknown;
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

    let characters: Array<Record<string, unknown>>;
    try {
      characters = ensureCharactersArray(parsed);
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
