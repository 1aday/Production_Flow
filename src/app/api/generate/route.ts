import { NextResponse } from "next/server";
import OpenAI from "openai";
import Ajv from "ajv/dist/2020";
import schema from "../../../../show_schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const systemDirectiveWithGuardrails = `You are a visual development director creating a show look bible for ANIMATION or HIGHLY STYLIZED content.
Return a single JSON object that conforms to the provided schema. Do not add properties. Infer thoughtful defaults when details are missing.

CRITICAL RULES:

1. SHOW TITLE - HIGHEST PRIORITY: 
   - If the user provides ANY show name/title in their prompt (look for phrases like "called", "titled", "named", or quoted text), you MUST use that EXACT title verbatim in the show_title field.
   - Do NOT change it, do NOT "improve" it, do NOT make it "catchier" - use their words EXACTLY.
   - Only invent a title if the user clearly did NOT provide one.
   
2. SHOW DESCRIPTION/LOGLINE - SECOND HIGHEST PRIORITY:
   - If the user describes what the show is about, base your show_logline directly on their description.
   - Expand and improve upon it for clarity, but preserve their core concept, characters, and premise.
   - Do NOT replace their concept with a completely different idea.

3. GENRE & METADATA (REQUIRED - fill these for better downstream generation):
   - "genre": Pick the PRIMARY genre from the enum (comedy, drama, thriller, horror, sci_fi, fantasy, action, adventure, mystery, romance, documentary, animation, family, crime)
   - "mood_keywords": 3-6 words capturing emotional tone (e.g., ["tense", "dark", "mysterious"] or ["whimsical", "heartfelt", "colorful"])
   - "tagline": Short punchy marketing line (max 80 chars) - NOT the logline, this is for posters (e.g., "In space, no one can hear you scream")
   - "primary_palette": 3-5 hex colors that define the show's look (e.g., ["#1A1A2E", "#16213E", "#E94560"])

4. PRODUCTION STYLE - ABSOLUTELY CRITICAL:
   You MUST choose ONE specific animation/illustration style from the schema enum. Choose what best fits the show:
   
   FOR COMEDY/SITCOM → "Pixar-style 3D animation" or "Aardman claymation" or "Cartoon Network 2D style"
   FOR DRAMA/THRILLER → "Anime aesthetic" or "Graphic novel illustration style" or "Rotoscoped animation"
   FOR FANTASY/ADVENTURE → "Studio Ghibli hand-drawn animation" or "Disney 3D animation" or "Laika stop-motion"
   FOR KIDS SHOW → "Pixar-style 3D animation" or "2D cel animation" or "Paper cutout animation"
   FOR PRESTIGE/SERIOUS → "Arcane painterly style" or "Spider-Verse stylized 3D" or "Comic book visual style"
   FOR QUIRKY/INDIE → "Claymation (Wallace & Gromit style)" or "Stop-motion puppet animation" or "Mixed media animation"
   
   NEVER EVER choose anything with "live-action" - this leads to photorealistic results that get flagged!

5. VISUAL TREATMENT must emphasize NON-PHOTOGRAPHIC qualities:
   - Use words: "animated", "illustrated", "hand-crafted", "stylized", "cartoon", "painterly", "graphic"
   - Describe: "exaggerated proportions", "bold outlines", "visible brush strokes", "tactile textures"
   - NEVER use: "realistic", "naturalistic", "photographic", "documentary"

6. CINEMATIC REFERENCES - Choose 2-4 from animation/stylized films:
   Animation: Pixar films, Studio Ghibli, Wallace & Gromit, Spider-Verse, Laika, Aardman, Disney, Dreamworks
   Stylized: Wes Anderson films, Fantastic Mr Fox, Isle of Dogs, Grand Budapest Hotel
   Illustrated: Arcane, Love Death + Robots, Klaus, The Triplets of Belleville

7. MATERIALS & TEXTURES - Use animation terminology:
   WRONG: "realistic skin", "natural textures", "photographic finish"
   RIGHT: "stylized skin tones", "painterly textures", "animated surface treatment", "illustrated finish", "cartoon shading"

8. SPECIES DESIGN - Always animated/stylized:
   - "surface_finish": Use "matte cartoon", "painterly finish", "cel-shaded", "illustrated treatment"
   - NEVER: "realistic", "natural", "photographic"

Include a compelling "show_logline" and detailed "poster_description".`;

const systemDirectiveWithoutGuardrails = `You are a visual development director creating a comprehensive show look bible.
Return a single JSON object that conforms to the provided schema. Do not add properties. Infer thoughtful defaults when details are missing.

!! IMPORTANT: GUARDRAILS ARE DISABLED !!
You have FULL creative freedom. ALL visual styles are allowed including photorealistic, live-action, cinematic, documentary, and any realistic rendering.

CRITICAL RULES:

1. SHOW TITLE - HIGHEST PRIORITY: 
   - If the user provides ANY show name/title in their prompt (look for phrases like "called", "titled", "named", or quoted text), you MUST use that EXACT title verbatim in the show_title field.
   - Do NOT change it, do NOT "improve" it, do NOT make it "catchier" - use their words EXACTLY.
   - Only invent a title if the user clearly did NOT provide one.
   
2. SHOW DESCRIPTION/LOGLINE - SECOND HIGHEST PRIORITY:
   - If the user describes what the show is about, base your show_logline directly on their description.
   - Expand and improve upon it for clarity, but preserve their core concept, characters, and premise.
   - Do NOT replace their concept with a completely different idea.

3. GENRE & METADATA (REQUIRED - fill these for better downstream generation):
   - "genre": Pick the PRIMARY genre from the enum (comedy, drama, thriller, horror, sci_fi, fantasy, action, adventure, mystery, romance, documentary, animation, family, crime)
   - "mood_keywords": 3-6 words capturing emotional tone (e.g., ["gritty", "tense", "realistic"] or ["epic", "sweeping", "dramatic"])
   - "tagline": Short punchy marketing line (max 80 chars) - NOT the logline, this is for posters (e.g., "The truth has a price")
   - "primary_palette": 3-5 hex colors that define the show's look (e.g., ["#2C3E50", "#34495E", "#E74C3C"])

4. PRODUCTION STYLE - FREELY CHOOSE based on user's creative vision:
   
   FOR REALISTIC/CINEMATIC REQUESTS (drama, thriller, documentary, prestige TV, etc.):
   - Use: "Live-action cinematic style", "Photorealistic CGI", "Theatrical live-action", "Documentary realism", or "Prestige drama cinematography"
   - Set stylization_level to: "cinematic_realistic" or "slightly_stylized"
   
   FOR ANIMATION/STYLIZED REQUESTS:
   - Use appropriate animation styles (Pixar, Ghibli, etc.)
   - Set stylization_level to: "highly_stylized" or "moderately_stylized"
   
   DEFAULT BEHAVIOR (when user doesn't specify):
   - Analyze the concept's tone, genre, and subject matter
   - Gritty crime drama? → "Prestige drama cinematography", cinematic_realistic
   - Light comedy with animals? → Maybe animation
   - Sci-fi epic? → "Photorealistic CGI" or cinematic style
   - Choose what serves the story best - don't default to animation

5. VISUAL TREATMENT - Match your medium choice:
   - For cinematic/realistic: "photorealistic rendering", "cinematic lighting", "naturalistic textures", "realistic skin and materials", "theatrical cinematography", "dramatic realism"
   - For animation: "animated", "illustrated", "stylized", "painterly"
   - IGNORE schema field descriptions that suggest non-photorealistic - those are guidelines only

6. CINEMATIC REFERENCES - Choose 2-4 that match your chosen style:
   - For realistic: Reference real films/directors (Fincher, Nolan, Villeneuve, Spielberg, Denis Villeneuve, Roger Deakins cinematography, HBO's The Wire, Breaking Bad, True Detective, etc.)
   - For animation: Pixar, Ghibli, Spider-Verse, etc.

7. MATERIALS & TEXTURES - Match the medium:
   - Realistic: "realistic skin with pores and imperfections", "natural textures", "photographic materials", "practical costume fabrics", "real-world surfaces"
   - Animated: "stylized surfaces", "painterly textures", "cartoon shading"

8. SPECIES DESIGN - Match the medium:
   - Realistic: surface_finish should be "realistic skin texture", "naturalistic", "photographic", "lifelike", "practical makeup and prosthetics"
   - Animated: "matte cartoon", "painterly finish", "cel-shaded"

9. POSTER_DESCRIPTION - Be vivid and match the style:
   - For realistic shows: Describe a cinematic movie poster with real actors, dramatic lighting, photographic quality
   - For animated: Describe in the animation style chosen

REMEMBER: The user has disabled stylization guardrails. You are FREE to choose photorealistic, live-action, cinematic styles. Interpret their request broadly and pick what best serves their creative vision.

Include a compelling "show_logline" and detailed "poster_description".`;

type JSONSchemaNode = {
  type?: string | string[];
  properties?: Record<string, JSONSchemaNode>;
  required?: string[];
  items?: JSONSchemaNode | JSONSchemaNode[];
  anyOf?: JSONSchemaNode[];
  allOf?: JSONSchemaNode[];
  oneOf?: JSONSchemaNode[];
  $defs?: Record<string, JSONSchemaNode>;
  [key: string]: unknown;
};

type ModelId = "gpt-5" | "gpt-4o";

function normalizeSchemaForStructuredOutputs(root: JSONSchemaNode) {
  const visited = new WeakSet<object>();
  const unsupportedKeys = new Set(["uniqueItems"]);

  const visit = (node: JSONSchemaNode | undefined) => {
    if (!node || typeof node !== "object") return;
    if (visited.has(node as object)) return;
    visited.add(node as object);

    for (const key of unsupportedKeys) {
      if (key in node) {
        delete (node as Record<string, unknown>)[key];
      }
    }

    const type = node.type;
    const isObjectType =
      type === "object" || (Array.isArray(type) && type.includes("object"));

    if (isObjectType && node.properties && typeof node.properties === "object") {
      const keys = Object.keys(node.properties);
      // Preserve existing required array if it exists, otherwise make all properties required
      // This ensures optional fields (like art_style) remain optional
      if (!node.required || node.required.length === 0) {
        node.required = keys;
      }
      // Still visit all properties for normalization
      for (const key of keys) {
        visit(node.properties[key]);
      }
    } else if (node.properties && typeof node.properties === "object") {
      for (const key of Object.keys(node.properties)) {
        visit(node.properties[key]);
      }
    }

    if (node.items) {
      if (Array.isArray(node.items)) {
        node.items.forEach((child) => visit(child));
      } else {
        visit(node.items);
      }
    }

    const compositeKeys: Array<keyof JSONSchemaNode> = ["anyOf", "allOf", "oneOf"];
    for (const key of compositeKeys) {
      const branch = node[key];
      if (Array.isArray(branch)) {
        branch.forEach((child) => visit(child));
      }
    }

    if (node.$defs && typeof node.$defs === "object") {
      for (const value of Object.values(node.$defs)) {
        visit(value);
      }
    }
  };

  visit(root);
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const posterAvailable = Boolean(process.env.REPLICATE_API_TOKEN);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("prompt" in body) ||
    typeof (body as { prompt: unknown }).prompt !== "string"
  ) {
    return NextResponse.json(
      { error: "Request body must include a string 'prompt' field." },
      { status: 400 }
    );
  }

  const { prompt, model, stylizationGuardrails } = body as { 
    prompt: string; 
    model?: string; 
    stylizationGuardrails?: boolean;
  };

  // Default to true for backward compatibility
  // Default to OFF (matching client default) - only ON if explicitly true
  const useGuardrails = stylizationGuardrails === true;
  const systemDirective = useGuardrails ? systemDirectiveWithGuardrails : systemDirectiveWithoutGuardrails;
  
  console.log("=== BLUEPRINT GENERATION ===");
  console.log("Stylization Guardrails:", useGuardrails ? "ON" : "OFF");
  console.log("User Prompt:", prompt.slice(0, 200) + (prompt.length > 200 ? "..." : ""));
  
  // Try to detect if user specified a title (for logging purposes)
  const titlePatterns = [
    /called\s*["']([^"']+)["']/i,
    /titled?\s*["']([^"']+)["']/i,
    /named?\s*["']([^"']+)["']/i,
    /["']([^"']+)["']\s*(?:is\s+)?(?:a|about|the)/i,
    /show\s*["']([^"']+)["']/i,
    /series\s*["']([^"']+)["']/i,
  ];
  
  let detectedTitle: string | null = null;
  for (const pattern of titlePatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      detectedTitle = match[1];
      break;
    }
  }
  
  if (detectedTitle) {
    console.log("📌 Detected user-provided title:", detectedTitle);
  } else {
    console.log("📌 No explicit title detected in prompt - model will create one");
  }

  let selectedModel: ModelId = "gpt-5";
  if (model) {
    if (model !== "gpt-5" && model !== "gpt-4o") {
      return NextResponse.json(
        { error: "Unsupported model selection." },
        { status: 400 }
      );
    }
    selectedModel = model as ModelId;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const schemaForApi: JSONSchemaNode = JSON.parse(JSON.stringify(schema));
  if (schemaForApi && typeof schemaForApi === "object") {
    delete (schemaForApi as Record<string, unknown>)["$schema"];
    delete (schemaForApi as Record<string, unknown>)["$id"];
    normalizeSchemaForStructuredOutputs(schemaForApi);
  }

  try {
    if (selectedModel === "gpt-4o") {
      const schemaText = JSON.stringify(schemaForApi, null, 2);
      const response = await client.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "system" as const,
            type: "message" as const,
            content: `${systemDirective}

Return JSON that adheres to the provided schema.`,
          },
          {
            role: "user" as const,
            type: "message" as const,
            content: `=== USER'S SHOW REQUEST (READ CAREFULLY - USE THEIR TITLE AND DESCRIPTION) ===

${prompt}

=== END OF USER REQUEST ===

REMEMBER: If the user specified a show title above, use it EXACTLY. If they described the show, base your logline on their description.

Reference Schema (for JSON structure only):
${schemaText}`,
          },
        ],
        text: {
          format: {
            type: "json_object" as const,
          },
        },
        temperature: 1,
        top_p: 1,
        max_output_tokens: 2048,
        reasoning: {},
        tools: [],
        store: false,
      });

      if (response.status === "incomplete") {
        const reason = response.incomplete_details?.reason ?? "unknown";
        return NextResponse.json(
          { error: `Model response incomplete (${reason}).` },
          { status: 502 }
        );
      }

      const outputText = (response.output_text || "").trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(outputText);
      } catch {
        return NextResponse.json(
          {
            error: "Failed to parse model output as JSON.",
            details: outputText,
          },
          { status: 502 }
        );
      }

      const isValid = validate(parsed);

      if (!isValid) {
        return NextResponse.json(
          {
            error: "Model response failed schema validation.",
            messages: validate.errors?.map((err) => ({
              instancePath: err.instancePath,
              message: err.message,
            })),
            details: parsed,
          },
          { status: 502 }
        );
      }

      // Log generated title for debugging
      const generatedTitle = (parsed as { show_title?: string })?.show_title;
      console.log("✅ Generated show_title:", generatedTitle);
      if (detectedTitle && generatedTitle && generatedTitle.toLowerCase() !== detectedTitle.toLowerCase()) {
        console.warn("⚠️ TITLE MISMATCH! User wanted:", detectedTitle, "| Model generated:", generatedTitle);
      }

      return NextResponse.json(
        {
          data: parsed,
          raw: outputText,
          usage: response.usage,
          posterAvailable,
        },
        { status: 200 }
      );
    }

    // Structure the prompt to emphasize user's title/description
    const enhancedPrompt = `=== USER'S SHOW REQUEST (USE THEIR TITLE AND DESCRIPTION) ===

${prompt}

=== END OF USER REQUEST ===

CRITICAL: If the user specified a show title above, use it EXACTLY in show_title. If they described the show concept, base your show_logline on their description - don't replace it with a different idea.`;

    const response = await client.responses.parse({
      model: "gpt-5",
      input: [
        { role: "system", content: systemDirective },
        { role: "user", content: enhancedPrompt },
      ],
      reasoning: { effort: "low" },
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "show_blueprint",
          schema: schemaForApi,
          strict: true,
        },
      },
    });

    if (response.status === "incomplete") {
      const reason = response.incomplete_details?.reason ?? "unknown";
      return NextResponse.json(
        { error: `Model response incomplete (${reason}).` },
        { status: 502 }
      );
    }

    const parsed = response.output_parsed;

    if (!parsed) {
      const refusal = response.output
        .flatMap((item) => {
          if (item.type !== "message") return [];
          return item.content.filter(
            (content): content is { type: "refusal"; refusal: string } =>
              content.type === "refusal"
          );
        })
        .at(0);

      if (refusal) {
        return NextResponse.json(
          { error: refusal.refusal ?? "The model refused to answer." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "Model did not return a structured response.",
          details: response.output_text,
        },
        { status: 502 }
      );
    }

    const isValid = validate(parsed);

    if (!isValid) {
      return NextResponse.json(
        {
          error: "Model response failed schema validation.",
          messages: validate.errors?.map((err) => ({
            instancePath: err.instancePath,
            message: err.message,
          })),
          details: parsed,
        },
        { status: 502 }
      );
    }

    // Log generated title for debugging
    const generatedTitle = (parsed as { show_title?: string })?.show_title;
    console.log("✅ Generated show_title:", generatedTitle);
    if (detectedTitle && generatedTitle && generatedTitle.toLowerCase() !== detectedTitle.toLowerCase()) {
      console.warn("⚠️ TITLE MISMATCH! User wanted:", detectedTitle, "| Model generated:", generatedTitle);
    }

    const rawJson =
      typeof response.output_text === "string"
        ? response.output_text.trim()
        : JSON.stringify(parsed);

    return NextResponse.json(
      {
        data: parsed,
        raw: rawJson,
        usage: response.usage,
        posterAvailable,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[generate] Unexpected error", error);
    const message =
      error instanceof Error ? error.message : "Failed to contact OpenAI.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
