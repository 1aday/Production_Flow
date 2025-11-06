import { readFileSync } from "fs";
import path from "path";

type JsonSchema =
  | {
      type: "string" | ["string", "null"];
    }
  | {
      type: "boolean" | ["boolean", "null"];
    }
  | {
      type: "number" | "integer" | ["number", "string"];
    }
  | {
      type: "null";
    }
  | {
      type: "array";
      items: JsonSchema;
      minItems?: number;
      maxItems?: number;
    }
  | {
      type: "object" | ["object", "null"];
      properties: Record<string, JsonSchema>;
      required: string[];
      additionalProperties: false;
    };

const templatePath = path.resolve(process.cwd(), "character.json");

const rawTemplate = (() => {
  try {
    const file = readFileSync(templatePath, "utf8");
    const parsed = JSON.parse(file) as Record<string, unknown>;
    if ("$schema" in parsed) {
      delete (parsed as Record<string, unknown> & { $schema?: unknown }).$schema;
    }
    return parsed;
  } catch (error) {
    console.error("[character-schema] Failed to read character.json", error);
    throw error;
  }
})();

const guessArrayItemsFromKey = (keyPath: string[]): JsonSchema => {
  const lastKey = keyPath.at(-1);

  if (
    lastKey &&
    (lastKey.includes("tags") ||
      lastKey.includes("items") ||
      lastKey.includes("notes") ||
      lastKey.includes("rules") ||
      lastKey.includes("behaviors") ||
      lastKey.includes("props") ||
      lastKey.includes("signage") ||
      lastKey.includes("accessories") ||
      lastKey.includes("fx") ||
      lastKey.includes("do") ||
      lastKey.includes("stills") ||
      lastKey.includes("exports") ||
      lastKey.includes("lenses") ||
      lastKey.includes("movement") ||
      lastKey.includes("surfaces"))
  ) {
    return { type: ["string", "null"] };
  }

  return { type: ["string", "null"] };
};

const guessPrimitiveSchema = (value: unknown, keyPath: string[]): JsonSchema => {
  if (typeof value === "boolean") {
    return { type: "boolean" };
  }
  if (typeof value === "number") {
    const lastKey = keyPath.at(-1);
    if (lastKey && /ratio|percentage|rate|fps|angle|value|count/i.test(lastKey)) {
      return { type: ["number", "string"] };
    }
    return { type: ["number", "string"] };
  }
  if (value === null) {
    return { type: "null" };
  }
  return { type: ["string", "null"] };
};

const buildSchema = (value: unknown, keyPath: string[] = []): JsonSchema => {
  if (Array.isArray(value)) {
    const firstNonNull = value.find((entry) => entry !== null && entry !== undefined);
    const itemSchema = firstNonNull
      ? buildSchema(firstNonNull, keyPath)
      : guessArrayItemsFromKey(keyPath);
    return {
      type: "array",
      items: itemSchema,
      minItems: 0,
    };
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [key, child] of entries) {
      const childSchema = buildSchema(child, [...keyPath, key]);
      properties[key] = childSchema;
      required.push(key);
    }

    if (keyPath.length === 0) {
      // Ensure root object cannot be null.
      return {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      };
    }

    return {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    };
  }

  return guessPrimitiveSchema(value, keyPath);
};

const CHARACTER_DOCUMENT_SCHEMA = buildSchema(rawTemplate);

const CHARACTER_PAYLOAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    characters: {
      type: "array",
      minItems: 1,
      items: CHARACTER_DOCUMENT_SCHEMA,
    },
  },
  required: ["characters"],
} as const;

export { CHARACTER_DOCUMENT_SCHEMA, CHARACTER_PAYLOAD_SCHEMA };
