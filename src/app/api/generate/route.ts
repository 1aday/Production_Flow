import { NextResponse } from "next/server";
import OpenAI from "openai";
import Ajv from "ajv/dist/2020";
import schema from "../../../../show_schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const systemDirective = `You are a visual development director creating a show look bible.
Return a single JSON object that conforms to the provided schema. Do not add properties. Infer thoughtful defaults when details are missing.`;

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
      node.required = keys;
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

  const { prompt, model } = body as { prompt: string; model?: string };

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
            content: `Schema:
${schemaText}

Briefing:
${prompt}`,
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

    const response = await client.responses.parse({
      model: "gpt-5",
      input: [
        { role: "system", content: systemDirective },
        { role: "user", content: prompt },
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
