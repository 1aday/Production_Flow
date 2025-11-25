import { NextResponse } from "next/server";
import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

import { CHARACTER_DOCUMENT_SCHEMA } from "@/lib/character-schema";
import { createStyleSnapshot, type FullShowBlueprint } from "@/lib/prompt-extraction";

type ModelId = "gpt-5" | "gpt-4o";

type CharacterSeed = {
  id: string;
  name: string;
  summary: string;
  role?: string;
  vibe?: string;
};

type BuildRequest = {
  prompt: string;
  show: unknown;
  seed: CharacterSeed;
  model?: string;
};

type OutputFragment = {
  type: string;
  [key: string]: unknown;
};

async function loadCharacterTemplate() {
  const templatePath = path.resolve(process.cwd(), "character.json");
  return fs.readFile(templatePath, "utf8");
}

const SYSTEM_DIRECTIVE = `You are the casting director for an ANIMATED or HIGHLY STYLIZED show.
Generate a complete character bible entry that mirrors the provided template.
Respect the show blueprint and the supplied character seed.
Always respond with a JSON object adhering to the provided schema.

!! CRITICAL - ANIMATION/STYLIZATION REQUIREMENTS !!

The show has a specific animation/illustration style (check production_style.medium). You MUST use terminology that matches:

ABSOLUTELY FORBIDDEN WORDS (cause moderation failures):
- "photorealistic", "realistic", "photo-like", "documentary", "naturalistic", "live-action", "flesh-and-blood", "real-world"

REQUIRED TERMINOLOGY based on production_style.medium:

IF ANIMATION (Pixar, Ghibli, claymation, etc.):
- Materials: "animated textures", "cartoon surfaces", "stylized materials", "illustrated finishes"
- Skin: "stylized skin tones", "animated skin treatment", "cartoon shading"
- Finish: "matte cartoon", "cel-shaded", "painterly finish", "illustrated treatment"
- Features: "animated proportions", "cartoon expressions", "stylized anatomy"

IF GRAPHIC/ILLUSTRATED:
- Materials: "illustrated textures", "graphic surfaces", "painterly materials"
- Skin: "illustrated skin tones", "graphic rendering", "painterly complexion"
- Finish: "graphic matte", "illustrated finish", "comic book treatment"

EXAMPLES:
✗ WRONG: "realistic matte", "natural human skin", "flesh-and-blood performer", "live-action subtype"
✓ RIGHT: "cartoon matte", "stylized human features", "animated character", "animated subtype"

Always describe characters as if they exist in the show's animation/illustration style, NOT as photographed real people.`;

const trimJson = (value: unknown, limit = 18000) => {
  try {
    const text = JSON.stringify(value);
    if (text.length <= limit) return text;
    return `${text.slice(0, limit - 1)}…`;
  } catch {
    return "";
  }
};

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

const parseStructuredPayload = (response: unknown): unknown => {
  if (!response || typeof response !== "object") return undefined;
  const outputs = Array.isArray((response as { output?: unknown }).output)
    ? ((response as { output: Array<{ content?: OutputFragment[] }> }).output)
    : [];

  for (const node of outputs) {
    if (!Array.isArray(node.content)) continue;
    for (const fragment of node.content) {
      if (fragment?.type === "output_json_schema" && "parsed" in fragment) {
        return fragment["parsed"];
      }
    }
  }

  if ("output_parsed" in response) {
    return (response as { output_parsed?: unknown }).output_parsed;
  }

  const text = getOutputText(response);
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  return undefined;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  let body: BuildRequest;
  try {
    body = (await request.json()) as BuildRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body.prompt !== "string" ||
    !body.prompt.trim() ||
    typeof body.show !== "object" ||
    body.show === null ||
    !body.seed ||
    typeof body.seed !== "object"
  ) {
    return NextResponse.json(
      {
        error:
          "Request must include 'prompt' (string), 'show' (object), and a 'seed' object.",
      },
      { status: 400 }
    );
  }

  if (!body.seed.name || !body.seed.id) {
    return NextResponse.json(
      { error: "Seed must include 'id' and 'name'." },
      { status: 400 }
    );
  }

  if (body.model && body.model !== "gpt-5" && body.model !== "gpt-4o") {
    return NextResponse.json(
      { error: "Unsupported model selection." },
      { status: 400 }
    );
  }

  const model: ModelId = body.model === "gpt-4o" ? "gpt-4o" : "gpt-5";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const showBlueprintString = trimJson(body.show);
  const characterTemplateRaw = await loadCharacterTemplate();
  let characterTemplate = characterTemplateRaw;
  try {
    const parsedTemplate = JSON.parse(characterTemplateRaw);
    if (parsedTemplate && typeof parsedTemplate === "object" && "$schema" in parsedTemplate) {
      delete (parsedTemplate as Record<string, unknown> & { $schema?: string }).$schema;
    }
    characterTemplate = JSON.stringify(parsedTemplate);
  } catch {
    characterTemplate = characterTemplateRaw.replace(/\s+/g, " ");
  }

  const seedBlock = JSON.stringify(body.seed, null, 2);

  const userInstruction = `User prompt:
${body.prompt}

Show blueprint JSON (use this verbatim for the "inherits" field):
${showBlueprintString}

Character seed details:
${seedBlock}

Character template (structure reference only):
${characterTemplate}

Instructions:
- Return exactly one JSON object adhering to the template.
- Populate every field, inventing details that align with the show and seed.
- Always fill the biometrics.species block; when the character is non-human, spell out visual markers, materiality, and physiology so fabrication is unambiguous.
- Inside biometrics, ALWAYS include: species.type + subtype, gender_identity, ethnicity and racial/complexion context, skin_color with hex + prose, eye_color with hex + patterning, a distinguishing_features string (scars, augmentations, jewelry), and attire_notes summarizing signature garments/accessories. Use multi-sentence descriptions instead of single words if needed so fabrication, casting, and VFX teams have zero ambiguity.
- Set the "character" field to "${body.seed.id}".
- Copy the show blueprint string verbatim into "inherits".`;

  const basePayload = {
    input: [
      { role: "system" as const, content: SYSTEM_DIRECTIVE, type: "message" as const },
      { role: "user" as const, content: userInstruction, type: "message" as const },
    ],
    text: {
      format: {
        type: "json_schema" as const,
        name: "character_document",
        strict: true,
        schema: CHARACTER_DOCUMENT_SCHEMA,
      },
    },
  };

  try {
    const response =
      model === "gpt-4o"
        ? await client.responses.create({
            ...basePayload,
            model: "gpt-4o",
            temperature: 0.8,
            top_p: 1,
            reasoning: {},
            tools: [],
            store: false,
          })
        : await client.responses.create({
            ...basePayload,
            model: "gpt-5",
            reasoning: { effort: "low" },
          });

    const parsed = parseStructuredPayload(response);
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        {
          error: "Model response was not a JSON object.",
          details: parsed ?? null,
        },
        { status: 502 }
      );
    }

    // Create style snapshot (slim version) for quick reference
    const styleSnapshot = createStyleSnapshot(body.show as FullShowBlueprint);
    
    const characterDoc = {
      ...(parsed as Record<string, unknown>),
      character: body.seed.id,
      // New: slim style snapshot for quick reference
      style_snapshot: styleSnapshot,
      // Legacy: keep inherits for backwards compatibility, but limit size
      inherits: showBlueprintString.length > 5000 
        ? showBlueprintString.slice(0, 5000) + "..."
        : showBlueprintString,
    };

    return NextResponse.json({ character: characterDoc }, { status: 200 });
  } catch (error) {
    console.error("[characters/build] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to contact OpenAI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
