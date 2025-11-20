import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { extractShowId } from "@/lib/slug";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/show/[id]/generate-content
 * Uses OpenAI to generate structured, beautiful content for the show page
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slugOrId } = await context.params;
    const showId = extractShowId(slugOrId);
    
    const supabase = createServerSupabaseClient();
    
    // Fetch show from Supabase
    const { data: show, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single();
    
    if (error || !show) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }
    
    const showData = show;
    
    // Generate structured content using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a creative content strategist for a TV show production company. 
Your job is to analyze comprehensive show data and create beautiful, engaging, shareable content for a show's public page.

Given the show's complete JSON data (including characters, visual aesthetics, production style, etc.), generate:
1. A compelling hero tagline (10-15 words max)
2. An expanded show description (2-3 paragraphs)
3. Character highlights (2-3 sentences per main character)
4. Visual identity summary (1 paragraph)
5. Unique show features/selling points (3-5 bullet points)
6. Behind-the-scenes insights (1 paragraph)
7. Episode highlights or story arcs (if applicable)

Make it engaging, professional, and shareable. Focus on what makes this show unique and compelling.`,
        },
        {
          role: "user",
          content: `Generate beautiful, structured content for this show:\n\n${JSON.stringify(showData, null, 2)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "show_page_content",
          strict: true,
          schema: {
            type: "object",
            required: [
              "hero_tagline",
              "expanded_description",
              "character_highlights",
              "visual_identity",
              "unique_features",
              "behind_the_scenes",
              "episode_concepts",
              "tone_keywords",
            ],
            properties: {
              hero_tagline: {
                type: "string",
                description: "Compelling 10-15 word tagline for the hero section",
              },
              expanded_description: {
                type: "array",
                description: "2-3 paragraphs expanding on the show concept",
                items: {
                  type: "string",
                },
              },
              character_highlights: {
                type: "object",
                description: "Character ID mapped to 2-3 sentence highlights",
                additionalProperties: {
                  type: "string",
                },
              },
              visual_identity: {
                type: "string",
                description: "1 paragraph summarizing the show's visual style and aesthetic",
              },
              unique_features: {
                type: "array",
                description: "3-5 bullet points of unique selling points",
                items: {
                  type: "string",
                },
              },
              behind_the_scenes: {
                type: "string",
                description: "1 paragraph of interesting production insights",
              },
              episode_concepts: {
                type: "array",
                description: "Optional: 3-5 potential episode ideas or story arcs",
                items: {
                  type: "object",
                  required: ["title", "description"],
                  properties: {
                    title: {
                      type: "string",
                    },
                    description: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              tone_keywords: {
                type: "array",
                description: "5-7 keywords that capture the show's tone",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
        },
      },
    });
    
    const content = JSON.parse(completion.choices[0].message.content || "{}");
    
    return NextResponse.json({
      content,
      tokens_used: completion.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

