/**
 * Slim prompt extraction utilities
 * 
 * These functions extract only the necessary fields from large JSON structures
 * for use in AI prompts, reducing payload sizes from ~50KB to ~2KB.
 */

// ============================================================================
// TYPES
// ============================================================================

export type SlimShowContext = {
  show_title: string;
  genre?: string;
  mood_keywords?: string[];
  tagline?: string;
  target_audience?: string;
  style: {
    medium: string;
    stylization_level: string;
    cinematic_references: string[];
    visual_treatment: string;
  };
  palette: string[];
  lighting?: {
    key?: string;
    fill?: string;
  };
};

export type SlimCharacterContext = {
  id: string;
  name: string;
  gender?: string;
  age_range?: string;
  species_hint?: string;
  skin_tone?: { hex: string; description: string };
  eye_color?: { hex: string; description: string };
  hair?: { color: string; style: string; length?: string };
  build?: string;
  distinctive_features?: string;
  wardrobe_summary?: string;
  expression_default?: string;
  pose_default?: string;
  key_visual_trait?: string;
};

export type FullShowBlueprint = {
  show_title?: string;
  show_logline?: string;
  poster_description?: string;
  genre?: string;
  mood_keywords?: string[];
  tagline?: string;
  target_audience?: string;
  primary_palette?: string[];
  production_style?: {
    medium?: string;
    stylization_level?: string;
    cinematic_references?: string[];
    visual_treatment?: string;
    art_style?: unknown;
  };
  visual_aesthetics?: {
    goal?: string;
    color?: {
      palette_bias?: string;
      anchor_hex?: string[];
      skin_protection?: string;
    };
    lighting?: {
      key?: string;
      fill?: string;
      edge?: string;
      temperature_model?: string;
    };
    composition?: {
      symmetry_bias?: string;
      color_blocking?: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type FullCharacterDocument = {
  character?: string;
  metadata?: {
    role?: string;
    function?: string;
    tags?: string[];
  };
  biometrics?: {
    species?: {
      type?: string;
      subtype?: string;
      visual_markers?: string;
    };
    age_years?: { value?: number };
    gender_identity?: string;
    ethnicity?: string;
    skin_color?: { hex?: string; description?: string };
    eye_color?: { hex?: string; description?: string; patterning?: string };
    hair?: {
      style?: string;
      color_hex?: string;
      color_description?: string;
      length?: string;
      texture?: string;
    };
    build?: { body_type?: string; notes?: string };
    height?: { value?: number; unit?: string };
    voice?: { descriptors?: string[] };
    distinguishing_features?: string;
    attire_notes?: string;
    [key: string]: unknown;
  };
  look?: {
    silhouette?: string;
    palette?: { anchors?: string[]; notes?: string };
    wardrobe?: {
      silhouette_rules?: string;
      items?: string[];
      accessories?: string[];
    };
    [key: string]: unknown;
  };
  performance?: {
    pose_defaults?: string;
    expression_set?: string[];
  };
  showcase_scene_prompt?: string;
  [key: string]: unknown;
};

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract slim show context for prompts
 * Reduces ~50KB show blueprint to ~1KB essential style info
 */
export function extractSlimShowContext(show: FullShowBlueprint | unknown): SlimShowContext {
  const s = (show || {}) as FullShowBlueprint;
  const ps = s.production_style || {};
  const va = s.visual_aesthetics || {};
  
  return {
    show_title: s.show_title || "Untitled Show",
    genre: s.genre,
    mood_keywords: s.mood_keywords,
    tagline: s.tagline,
    target_audience: s.target_audience,
    style: {
      medium: ps.medium || "Unknown style",
      stylization_level: ps.stylization_level || "moderately_stylized",
      cinematic_references: ps.cinematic_references || [],
      visual_treatment: ps.visual_treatment || "",
    },
    palette: s.primary_palette || va.color?.anchor_hex || [],
    lighting: va.lighting ? {
      key: va.lighting.key,
      fill: va.lighting.fill,
    } : undefined,
  };
}

/**
 * Extract slim character context for portrait/video prompts
 * Reduces ~20KB character doc to ~1KB essential visual info
 */
export function extractSlimCharacterContext(
  character: FullCharacterDocument | unknown,
  seed?: { gender?: string; age_range?: string; species_hint?: string; key_visual_trait?: string }
): SlimCharacterContext {
  const c = (character || {}) as FullCharacterDocument;
  const bio = c.biometrics || {};
  const look = c.look || {};
  const perf = c.performance || {};
  
  // Build distinctive features from multiple sources
  const distinctiveFeatures = [
    bio.distinguishing_features,
    seed?.key_visual_trait,
  ].filter(Boolean).join(". ");
  
  // Build wardrobe summary
  const wardrobeParts = [
    look.wardrobe?.silhouette_rules,
    look.wardrobe?.items?.join(", "),
    look.wardrobe?.accessories?.join(", "),
  ].filter(Boolean);
  const wardrobeSummary = wardrobeParts.length > 0 ? wardrobeParts.join("; ") : undefined;
  
  return {
    id: c.character || "unknown",
    name: c.character || "Unknown Character",
    gender: bio.gender_identity || seed?.gender,
    age_range: bio.age_years?.value 
      ? inferAgeRange(bio.age_years.value) 
      : seed?.age_range,
    species_hint: bio.species?.type || seed?.species_hint,
    skin_tone: bio.skin_color?.hex ? {
      hex: bio.skin_color.hex,
      description: bio.skin_color.description || "",
    } : undefined,
    eye_color: bio.eye_color?.hex ? {
      hex: bio.eye_color.hex,
      description: bio.eye_color.description || "",
    } : undefined,
    hair: bio.hair?.color_hex ? {
      color: bio.hair.color_hex,
      style: bio.hair.style || "",
      length: bio.hair.length,
    } : undefined,
    build: bio.build?.body_type,
    distinctive_features: distinctiveFeatures || undefined,
    wardrobe_summary: wardrobeSummary,
    expression_default: perf.expression_set?.[0],
    pose_default: perf.pose_defaults,
    key_visual_trait: seed?.key_visual_trait,
  };
}

/**
 * Infer age range from numeric age
 */
function inferAgeRange(age: number): string {
  if (age < 13) return "child";
  if (age < 20) return "teen";
  if (age < 30) return "young_adult";
  if (age < 50) return "adult";
  if (age < 65) return "middle_aged";
  return "elderly";
}

/**
 * Build a compact style prompt from slim show context
 */
export function buildStylePrompt(show: SlimShowContext, includeDetails = true): string {
  const lines: string[] = [];
  
  lines.push(`Show: "${show.show_title}"`);
  lines.push(`Style: ${show.style.medium}`);
  lines.push(`Stylization: ${show.style.stylization_level}`);
  
  if (show.style.cinematic_references.length > 0) {
    lines.push(`References: ${show.style.cinematic_references.join(", ")}`);
  }
  
  if (includeDetails) {
    if (show.genre) lines.push(`Genre: ${show.genre}`);
    if (show.mood_keywords?.length) lines.push(`Mood: ${show.mood_keywords.join(", ")}`);
    if (show.palette.length > 0) lines.push(`Palette: ${show.palette.join(", ")}`);
    if (show.style.visual_treatment) lines.push(`Treatment: ${show.style.visual_treatment}`);
  }
  
  return lines.join("\n");
}

/**
 * Build a compact character prompt from slim character context
 */
export function buildCharacterPrompt(char: SlimCharacterContext): string {
  const lines: string[] = [];
  
  lines.push(`Character: ${char.name}`);
  
  const demographics: string[] = [];
  if (char.gender) demographics.push(char.gender);
  if (char.age_range) demographics.push(char.age_range);
  if (char.species_hint && char.species_hint !== "human") demographics.push(char.species_hint);
  if (demographics.length > 0) lines.push(`Demographics: ${demographics.join(", ")}`);
  
  if (char.build) lines.push(`Build: ${char.build}`);
  
  if (char.skin_tone) {
    lines.push(`Skin: ${char.skin_tone.description} (${char.skin_tone.hex})`);
  }
  if (char.eye_color) {
    lines.push(`Eyes: ${char.eye_color.description} (${char.eye_color.hex})`);
  }
  if (char.hair) {
    lines.push(`Hair: ${char.hair.style}, ${char.hair.length || ""} (${char.hair.color})`);
  }
  
  if (char.distinctive_features) {
    lines.push(`Distinctive: ${char.distinctive_features}`);
  }
  if (char.key_visual_trait) {
    lines.push(`Key trait: ${char.key_visual_trait}`);
  }
  if (char.wardrobe_summary) {
    lines.push(`Wardrobe: ${char.wardrobe_summary}`);
  }
  if (char.expression_default) {
    lines.push(`Expression: ${char.expression_default}`);
  }
  if (char.pose_default) {
    lines.push(`Pose: ${char.pose_default}`);
  }
  
  return lines.join("\n");
}

/**
 * Determine if a show is realistic/cinematic vs stylized/animated
 */
export function isRealisticStyle(show: SlimShowContext | FullShowBlueprint | unknown): boolean {
  const s = show as { style?: { stylization_level?: string; medium?: string }; production_style?: { stylization_level?: string; medium?: string } };
  const style = s.style || s.production_style || {};
  
  const level = style.stylization_level || "";
  const medium = (style.medium || "").toLowerCase();
  
  return (
    level === "cinematic_realistic" ||
    level === "slightly_stylized" ||
    medium.includes("live-action") ||
    medium.includes("photorealistic") ||
    medium.includes("cinematic") ||
    medium.includes("documentary") ||
    medium.includes("prestige")
  );
}

/**
 * Create a style snapshot for character documents (replaces bloated `inherits`)
 */
export function createStyleSnapshot(show: FullShowBlueprint | unknown): {
  show_id?: string;
  medium: string;
  stylization_level: string;
  key_references: string[];
  palette: string[];
} {
  const slim = extractSlimShowContext(show);
  return {
    medium: slim.style.medium,
    stylization_level: slim.style.stylization_level,
    key_references: slim.style.cinematic_references.slice(0, 3),
    palette: slim.palette.slice(0, 3),
  };
}

