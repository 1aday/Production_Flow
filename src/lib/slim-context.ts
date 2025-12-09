/**
 * Slim Context Helpers
 * 
 * Extract only the essential fields needed for prompt generation,
 * reducing payload sizes from ~50KB to ~2-5KB per request.
 * 
 * These helpers provide backwards compatibility - they gracefully
 * handle missing fields and provide sensible defaults.
 */

// Type definitions for slim contexts
export type SlimShowContext = {
  show_title: string;
  genre: string | null;
  mood_keywords: string[];
  tagline: string | null;
  primary_palette: string[];
  style: {
    medium: string;
    stylization_level: string;
    cinematic_references: string[];
    visual_treatment: string;
  };
  color: {
    palette_bias: string | null;
    anchor_hex: string[];
  };
  lighting: {
    key: string | null;
    fill: string | null;
  };
};

export type SlimCharacterContext = {
  id: string;
  name: string;
  species: string;
  gender: string | null;
  skin_tone: { hex: string; description: string } | null;
  eye_color: { hex: string; description: string } | null;
  hair: { color: string; style: string; length: string } | null;
  build: string | null;
  distinctive_features: string | null;
  wardrobe_summary: string | null;
  expression_default: string | null;
  pose_default: string | null;
  signature_colors: string[];
};

export type SlimCharacterSeed = {
  id: string;
  name: string;
  summary: string;
  role: string | null;
  vibe: string | null;
  gender: string | null;
  age_range: string | null;
  species_hint: string | null;
  key_visual_trait: string | null;
};

// Type for the full show blueprint (loose typing for flexibility)
type ShowBlueprint = {
  show_title?: string;
  show_logline?: string;
  genre?: string;
  mood_keywords?: string[];
  tagline?: string;
  primary_palette?: string[];
  production_style?: {
    medium?: string;
    stylization_level?: string;
    cinematic_references?: string[];
    visual_treatment?: string;
  };
  visual_aesthetics?: {
    color?: {
      palette_bias?: string;
      anchor_hex?: string[];
    };
    lighting?: {
      key?: string;
      fill?: string;
    };
  };
  [key: string]: unknown;
};

// Type for full character document (loose typing)
type CharacterDocument = {
  character?: string;
  metadata?: {
    role?: string;
  };
  character_details?: {
    species?: {
      type?: string;
      subtype?: string;
    };
    gender_identity?: string;
    skin_color?: { hex?: string; description?: string };
    eye_color?: { hex?: string; description?: string };
    hair?: {
      color_hex?: string;
      color_description?: string;
      style?: string;
      length?: string;
    };
    build?: { body_type?: string };
  };
  look?: {
    palette?: { anchors?: string[] };
    wardrobe?: { items?: string[]; silhouette_rules?: string };
    surface?: { materials?: string };
  };
  performance?: {
    pose_defaults?: string;
    expression_set?: string[];
  };
  [key: string]: unknown;
};

/**
 * Extract slim show context for prompt generation
 * Reduces full blueprint (~50KB) to essential fields (~2KB)
 */
export function extractSlimShowContext(show: ShowBlueprint | null | undefined): SlimShowContext {
  if (!show) {
    return {
      show_title: 'Untitled Show',
      genre: null,
      mood_keywords: [],
      tagline: null,
      primary_palette: [],
      style: {
        medium: 'Unknown',
        stylization_level: 'moderately_stylized',
        cinematic_references: [],
        visual_treatment: '',
      },
      color: {
        palette_bias: null,
        anchor_hex: [],
      },
      lighting: {
        key: null,
        fill: null,
      },
    };
  }

  const productionStyle = show.production_style || {};
  const visualAesthetics = show.visual_aesthetics || {};
  const color = visualAesthetics.color || {};
  const lighting = visualAesthetics.lighting || {};

  return {
    show_title: show.show_title || 'Untitled Show',
    genre: show.genre || null,
    mood_keywords: show.mood_keywords || [],
    tagline: show.tagline || null,
    primary_palette: show.primary_palette || color.anchor_hex || [],
    style: {
      medium: productionStyle.medium || 'Unknown',
      stylization_level: productionStyle.stylization_level || 'moderately_stylized',
      cinematic_references: productionStyle.cinematic_references || [],
      visual_treatment: productionStyle.visual_treatment || '',
    },
    color: {
      palette_bias: color.palette_bias || null,
      anchor_hex: color.anchor_hex || [],
    },
    lighting: {
      key: lighting.key || null,
      fill: lighting.fill || null,
    },
  };
}

/**
 * Extract slim character context for portrait/video generation
 * Reduces full character doc (~20KB) to essential fields (~1KB)
 */
export function extractSlimCharacterContext(
  character: CharacterDocument | null | undefined
): SlimCharacterContext {
  if (!character) {
    return {
      id: 'unknown',
      name: 'Unknown Character',
      species: 'human',
      gender: null,
      skin_tone: null,
      eye_color: null,
      hair: null,
      build: null,
      distinctive_features: null,
      wardrobe_summary: null,
      expression_default: null,
      pose_default: null,
      signature_colors: [],
    };
  }

  const characterDetails = character.character_details || {};
  const look = character.look || {};
  const performance = character.performance || {};

  // Extract hair info
  let hair: SlimCharacterContext['hair'] = null;
  if (characterDetails.hair) {
    hair = {
      color: characterDetails.hair.color_description || characterDetails.hair.color_hex || '',
      style: characterDetails.hair.style || '',
      length: characterDetails.hair.length || '',
    };
  }

  // Extract wardrobe summary
  let wardrobeSummary: string | null = null;
  if (look.wardrobe) {
    const items = look.wardrobe.items || [];
    const rules = look.wardrobe.silhouette_rules || '';
    wardrobeSummary = items.length > 0 ? items.join(', ') : rules || null;
  }

  // Extract expression default
  let expressionDefault: string | null = null;
  if (performance.expression_set && performance.expression_set.length > 0) {
    expressionDefault = performance.expression_set[0];
  }

  return {
    id: character.character || 'unknown',
    name: extractCharacterName(character),
    species: characterDetails.species?.type || 'human',
    gender: characterDetails.gender_identity || null,
    skin_tone: characterDetails.skin_color ? {
      hex: characterDetails.skin_color.hex || '',
      description: characterDetails.skin_color.description || '',
    } : null,
    eye_color: characterDetails.eye_color ? {
      hex: characterDetails.eye_color.hex || '',
      description: characterDetails.eye_color.description || '',
    } : null,
    hair,
    build: characterDetails.build?.body_type || null,
    distinctive_features: look.surface?.materials || null,
    wardrobe_summary: wardrobeSummary,
    expression_default: expressionDefault,
    pose_default: performance.pose_defaults || null,
    signature_colors: look.palette?.anchors || [],
  };
}

/**
 * Extract character name from document (handles various structures)
 */
function extractCharacterName(character: CharacterDocument): string {
  // Try metadata first
  if (character.metadata && typeof character.metadata === 'object') {
    const metadata = character.metadata as Record<string, unknown>;
    if (typeof metadata.name === 'string') return metadata.name;
  }
  
  // Try character field as name
  if (character.character && typeof character.character === 'string') {
    // Convert kebab-case to Title Case
    return character.character
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return 'Unknown Character';
}

/**
 * Normalize a character seed to ensure all fields have sensible defaults
 */
export function normalizeCharacterSeed(seed: Partial<SlimCharacterSeed>): SlimCharacterSeed {
  return {
    id: seed.id || 'unknown',
    name: seed.name || 'Unknown Character',
    summary: seed.summary || 'No description available.',
    role: seed.role || null,
    vibe: seed.vibe || null,
    gender: seed.gender || null,
    age_range: seed.age_range || null,
    species_hint: seed.species_hint || 'human',
    key_visual_trait: seed.key_visual_trait || null,
  };
}

/**
 * Build a concise portrait prompt from slim contexts
 */
export function buildSlimPortraitPrompt(
  showContext: SlimShowContext,
  characterContext: SlimCharacterContext
): string {
  const lines: string[] = [];

  // Style header - don't include show title as it can appear in generated images
  lines.push("Character Portrait");
  lines.push(`Style: ${showContext.style.medium} (${showContext.style.stylization_level})`);
  
  if (showContext.style.cinematic_references.length > 0) {
    lines.push(`References: ${showContext.style.cinematic_references.join(', ')}`);
  }
  
  lines.push('');
  
  // Character info
  lines.push(`Character: ${characterContext.name}`);
  
  if (characterContext.species !== 'human') {
    lines.push(`Species: ${characterContext.species}`);
  }
  
  if (characterContext.gender) {
    lines.push(`Gender: ${characterContext.gender}`);
  }
  
  if (characterContext.build) {
    lines.push(`Build: ${characterContext.build}`);
  }
  
  if (characterContext.skin_tone) {
    lines.push(`Skin: ${characterContext.skin_tone.description} (${characterContext.skin_tone.hex})`);
  }
  
  if (characterContext.eye_color) {
    lines.push(`Eyes: ${characterContext.eye_color.description}`);
  }
  
  if (characterContext.hair) {
    lines.push(`Hair: ${characterContext.hair.length} ${characterContext.hair.color} ${characterContext.hair.style}`.trim());
  }
  
  if (characterContext.distinctive_features) {
    lines.push(`Distinctive: ${characterContext.distinctive_features}`);
  }
  
  if (characterContext.wardrobe_summary) {
    lines.push(`Wardrobe: ${characterContext.wardrobe_summary}`);
  }
  
  lines.push('');
  
  // Pose and expression
  if (characterContext.expression_default) {
    lines.push(`Expression: ${characterContext.expression_default}`);
  }
  
  if (characterContext.pose_default) {
    lines.push(`Pose: ${characterContext.pose_default}`);
  }
  
  // Color guidance
  if (showContext.primary_palette.length > 0) {
    lines.push('');
    lines.push(`Color palette: ${showContext.primary_palette.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Build a concise trailer prompt header from slim show context
 */
export function buildSlimTrailerPromptHeader(showContext: SlimShowContext): string {
  const lines: string[] = [];
  
  lines.push(`"${showContext.show_title}"`);
  
  if (showContext.tagline) {
    lines.push(`Tagline: "${showContext.tagline}"`);
  }
  
  if (showContext.genre) {
    lines.push(`Genre: ${showContext.genre}`);
  }
  
  if (showContext.mood_keywords.length > 0) {
    lines.push(`Mood: ${showContext.mood_keywords.join(', ')}`);
  }
  
  lines.push('');
  lines.push(`Visual Style: ${showContext.style.medium}`);
  lines.push(`Stylization: ${showContext.style.stylization_level}`);
  
  if (showContext.style.cinematic_references.length > 0) {
    lines.push(`References: ${showContext.style.cinematic_references.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Check if a show is using realistic/cinematic style
 */
export function isRealisticStyle(showContext: SlimShowContext): boolean {
  const level = showContext.style.stylization_level?.toLowerCase() || '';
  const medium = showContext.style.medium?.toLowerCase() || '';
  
  return (
    level === 'cinematic_realistic' ||
    level === 'slightly_stylized' ||
    medium.includes('live-action') ||
    medium.includes('photorealistic') ||
    medium.includes('cinematic') ||
    medium.includes('documentary') ||
    medium.includes('prestige')
  );
}

/**
 * Get the payload size reduction stats
 */
export function getPayloadReduction(
  fullShow: unknown,
  fullCharacter: unknown,
  slimShow: SlimShowContext,
  slimCharacter: SlimCharacterContext
): { fullSize: number; slimSize: number; reduction: string } {
  const fullSize = JSON.stringify({ show: fullShow, character: fullCharacter }).length;
  const slimSize = JSON.stringify({ show: slimShow, character: slimCharacter }).length;
  const reduction = ((1 - slimSize / fullSize) * 100).toFixed(1);
  
  return {
    fullSize,
    slimSize,
    reduction: `${reduction}%`,
  };
}

