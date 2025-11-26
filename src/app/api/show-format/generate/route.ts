import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

type ShowFormatRequest = {
  blueprint: {
    show_title?: string;
    show_logline?: string;
    genre?: string;
    mood_keywords?: string[];
    target_audience?: string;
    production_style?: {
      medium?: string;
      cinematic_references?: string[];
    };
  };
  characterSeeds?: Array<{
    id: string;
    name: string;
    role?: string;
    summary?: string;
  }>;
};

const SYSTEM_PROMPT = `You are an expert TV series showrunner and format designer. Your job is to create the "episode formula" - the structural DNA that makes every episode feel consistent while allowing creative variation.

You will receive a show's blueprint (title, logline, genre, style) and its main characters. Create a comprehensive series format using the TEASER + 4 ACTS + TAG structure.

Return a JSON object with this exact structure:
{
  "structure": {
    "cold_open": {
      "duration_minutes": "2-5",
      "purpose": "One sentence describing what the cold open typically accomplishes",
      "signature_elements": ["Element 1", "Element 2", "Element 3"],
      "tone": "The emotional tone of cold opens"
    },
    "act_1": {
      "duration_minutes": "10-12",
      "purpose": "What Act 1 accomplishes",
      "typical_beats": ["Beat 1", "Beat 2", "Beat 3"],
      "ends_with": "How Act 1 typically ends"
    },
    "act_2": {
      "duration_minutes": "10-12", 
      "purpose": "What Act 2 accomplishes",
      "typical_beats": ["Beat 1", "Beat 2", "Beat 3"],
      "ends_with": "How Act 2 typically ends"
    },
    "act_3": {
      "duration_minutes": "10-12",
      "purpose": "What Act 3 accomplishes",
      "typical_beats": ["Beat 1", "Beat 2", "Beat 3"],
      "ends_with": "How Act 3 typically ends"
    },
    "act_4": {
      "duration_minutes": "8-10",
      "purpose": "What Act 4 accomplishes",
      "typical_beats": ["Beat 1", "Beat 2", "Beat 3"],
      "ends_with": "How episodes typically resolve"
    },
    "tag": {
      "duration_minutes": "1-2",
      "purpose": "What the tag accomplishes",
      "types": ["Type of tag 1", "Type of tag 2"]
    }
  },
  "recurring_elements": {
    "signature_scenes": [
      {
        "name": "Scene Name",
        "description": "What happens in this recurring scene",
        "typical_placement": "When this usually occurs"
      }
    ],
    "running_threads": ["Ongoing storyline or theme that weaves through episodes"],
    "character_moments": ["Types of character moments that recur"],
    "visual_motifs": ["Recurring visual elements"]
  },
  "plot_guidelines": {
    "a_plot_focus": "What the main episodic story typically involves",
    "b_plot_focus": "What secondary storylines typically explore",
    "c_plot_focus": "What minor storylines/comic relief typically covers",
    "serialized_elements": ["Elements that carry across episodes"]
  },
  "tone_bible": {
    "overall_tone": "The show's signature tone",
    "humor_style": "How comedy is used (if applicable)",
    "emotional_core": "The emotional truth at the heart of the show",
    "tension_style": "How tension and conflict are handled"
  },
  "episode_types": [
    {
      "type": "Type name (e.g., 'Case of the Week', 'Character Deep Dive')",
      "frequency": "How often this type appears",
      "description": "What distinguishes this episode type"
    }
  ]
}

Make every element SPECIFIC to this show - reference characters by name, reference the show's world and themes. Don't be generic.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable" },
      { status: 500 }
    );
  }

  let body: ShowFormatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.blueprint) {
    return NextResponse.json(
      { error: "Missing blueprint in request body" },
      { status: 400 }
    );
  }

  const client = new OpenAI({ apiKey });

  const userPrompt = `Create an episode format for this show:

SHOW DETAILS:
Title: "${body.blueprint.show_title || 'Untitled'}"
Logline: ${body.blueprint.show_logline || 'Not provided'}
Genre: ${body.blueprint.genre || 'Drama'}
Mood: ${body.blueprint.mood_keywords?.join(', ') || 'Not specified'}
Target Audience: ${body.blueprint.target_audience || 'Adult'}
Style: ${body.blueprint.production_style?.medium || 'Not specified'}
References: ${body.blueprint.production_style?.cinematic_references?.join(', ') || 'Not specified'}

MAIN CHARACTERS:
${body.characterSeeds?.map(c => `- ${c.name} (${c.role || 'Unknown role'}): ${c.summary || 'No description'}`).join('\n') || 'No characters provided'}

Create a detailed, show-specific episode format that will make every episode feel like it belongs to this series while allowing creative variety.`;

  try {
    console.log("🎬 Generating show format for:", body.blueprint.show_title);
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const format = JSON.parse(content);
    
    console.log("✅ Show format generated successfully");
    
    return NextResponse.json({
      format,
      usage: response.usage,
    });
  } catch (error) {
    console.error("❌ Failed to generate show format:", error);
    const message = error instanceof Error ? error.message : "Failed to generate show format";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


