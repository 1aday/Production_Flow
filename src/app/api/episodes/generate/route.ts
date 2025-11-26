import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

type EpisodesRequest = {
  blueprint: {
    show_title?: string;
    show_logline?: string;
    genre?: string;
    mood_keywords?: string[];
    target_audience?: string;
    tagline?: string;
  };
  characterSeeds?: Array<{
    id: string;
    name: string;
    role?: string;
    summary?: string;
    vibe?: string;
  }>;
  showFormat: {
    structure?: unknown;
    recurring_elements?: unknown;
    plot_guidelines?: unknown;
    tone_bible?: unknown;
    episode_types?: unknown;
  };
  episodeCount?: number;
};

const SYSTEM_PROMPT = `You are an expert TV series writer creating episode loglines for a new show's first season. You have the show's blueprint, characters, and episode format template.

Your job is to create compelling, interconnected episode loglines that:
1. Follow the show's established format and tone
2. Feature the main characters appropriately
3. Build a satisfying season arc while having standalone episode stories
4. Start with a strong PILOT that establishes the world and characters
5. End with a compelling season finale setup

Return a JSON object with this exact structure:
{
  "season_arc": "One paragraph describing the overarching season storyline",
  "episodes": [
    {
      "episode_number": 1,
      "title": "Episode Title",
      "logline": "When [inciting incident], [protagonist] must [goal] before [stakes]. A compelling 2-3 sentence episode summary.",
      "cold_open_hook": "Brief description of the teaser/cold open scene",
      "a_plot": "Main story of the episode - ACT 1 setup",
      "b_plot": "Secondary storyline - ACT 2 complications",
      "act_3_crisis": "The crisis point - highest tension moment where everything seems lost or the conflict peaks",
      "featured_characters": ["character-id-1", "character-id-2"],
      "themes": ["theme1", "theme2"],
      "episode_type": "pilot/case-of-week/character-focus/mythology/etc",
      "cliffhanger_or_button": "ACT 4 - How the main conflict resolves or cliffhanger",
      "tag_scene": "Final scene - comedic button, emotional beat, or tease for next episode"
    }
  ]
}

PILOT RULES:
- Episode 1 MUST be the pilot
- Pilot introduces the world, main characters, and central conflict
- Pilot ends with the protagonist committed to the journey
- Pilot should be slightly longer in scope to establish everything

SEASON STRUCTURE:
- Episodes 2-4: Establish the formula, introduce recurring elements
- Episode 5: Midseason twist or character deep-dive
- Episode 6: Season finale setup, major revelation or cliffhanger

Make each episode feel distinct while maintaining the show's DNA. Reference specific characters by their IDs for the featured_characters array.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable" },
      { status: 500 }
    );
  }

  let body: EpisodesRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.blueprint || !body.showFormat) {
    return NextResponse.json(
      { error: "Missing blueprint or showFormat in request body" },
      { status: 400 }
    );
  }

  const episodeCount = body.episodeCount || 6;
  const client = new OpenAI({ apiKey });

  const userPrompt = `Create ${episodeCount} episode loglines for Season 1 of this show:

SHOW DETAILS:
Title: "${body.blueprint.show_title || 'Untitled'}"
Logline: ${body.blueprint.show_logline || 'Not provided'}
Tagline: ${body.blueprint.tagline || 'Not provided'}
Genre: ${body.blueprint.genre || 'Drama'}
Mood: ${body.blueprint.mood_keywords?.join(', ') || 'Not specified'}
Target Audience: ${body.blueprint.target_audience || 'Adult'}

MAIN CHARACTERS (use these IDs in featured_characters):
${body.characterSeeds?.map(c => `- ID: "${c.id}" | Name: ${c.name} | Role: ${c.role || 'Unknown'} | Vibe: ${c.vibe || 'Unknown'} | Summary: ${c.summary || 'No description'}`).join('\n') || 'No characters provided'}

EPISODE FORMAT TEMPLATE:
${JSON.stringify(body.showFormat, null, 2)}

Create ${episodeCount} compelling, interconnected episodes that follow this format while building an exciting season arc. Episode 1 must be the PILOT.`;

  try {
    console.log("📺 Generating", episodeCount, "episodes for:", body.blueprint.show_title);
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);
    
    console.log("✅ Episodes generated successfully:", result.episodes?.length || 0, "episodes");
    
    return NextResponse.json({
      seasonArc: result.season_arc,
      episodes: result.episodes,
      usage: response.usage,
    });
  } catch (error) {
    console.error("❌ Failed to generate episodes:", error);
    const message = error instanceof Error ? error.message : "Failed to generate episodes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

