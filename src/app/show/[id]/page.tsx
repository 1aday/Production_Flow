import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";
import ShowPageClient from "./ShowPageClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  try {
    // Fetch show data from Supabase
    const { data: show, error } = await supabase
      .from("shows")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !show) {
      return {
        title: "Show Not Found | As You Wish",
        description: "The requested show could not be found.",
      };
    }

    // Extract show information
    const title = show.blueprint?.show_title || show.title || "Untitled Show";
    const logline = show.blueprint?.show_logline || show.blueprint?.logline || "";
    const genre = show.blueprint?.genre || "";
    const setting = show.blueprint?.setting || "";
    const tone = show.blueprint?.tone || "";
    const characterCount = show.character_seeds?.length || 0;
    
    // Get poster URL - prioritize library poster, fallback to regular poster
    const posterUrl = show.library_poster_url || show.poster_url;
    
    // Debug logging
    console.log('Show OG Debug:', {
      title,
      logline: logline || '(empty)',
      hasGeneratedContent: !!show.generated_content,
      hasExpandedDesc: !!show.generated_content?.expanded_description,
      expandedDescLength: show.generated_content?.expanded_description?.length || 0,
      firstParagraph: show.generated_content?.expanded_description?.[0]?.substring(0, 50) || '(none)',
      premise: show.blueprint?.premise?.substring(0, 50) || '(none)',
    });
    
    // Create a compelling description from generated content
    let description = "";
    
    // Priority 1: Use logline from blueprint
    if (logline && logline.trim().length > 15) {
      description = logline.trim();
    }
    
    // Priority 2: Use expanded description from generated content (the show page description)
    if (!description && show.generated_content?.expanded_description && Array.isArray(show.generated_content.expanded_description) && show.generated_content.expanded_description.length > 0) {
      const firstParagraph = show.generated_content.expanded_description[0];
      if (firstParagraph && typeof firstParagraph === 'string' && firstParagraph.trim().length > 15) {
        description = firstParagraph.trim();
      }
    }
    
    // Priority 3: Use premise from blueprint
    if (!description && show.blueprint?.premise && show.blueprint.premise.trim().length > 15) {
      description = show.blueprint.premise.trim();
    }
    
    // Priority 4: ONLY as absolute last resort, use generic fallback (don't generate from components)
    if (!description) {
      description = `An AI-generated show featuring ${characterCount} unique characters with complete visual identity and production design.`;
    }

    // Clean up description - remove extra whitespace
    description = description.replace(/\s+/g, ' ').trim();

    // Ensure description is within optimal length (150-160 chars for OG, max 200)
    // OG description optimal: 150-160 chars, max 200 for full display
    if (description.length > 200) {
      description = description.substring(0, 197) + "...";
    }

    // Base URL for absolute URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://productionflow.vercel.app";
    
    // Use poster if available, otherwise generate dynamic OG image
    let absolutePosterUrl: string;
    if (posterUrl) {
      absolutePosterUrl = posterUrl.startsWith("http") 
        ? posterUrl 
        : `${baseUrl}${posterUrl}`;
    } else {
      // Generate dynamic OG image with show details
      const ogParams = new URLSearchParams({
        title: title,
        ...(genre && { genre }),
        ...(logline && { logline: logline.substring(0, 150) }),
      });
      absolutePosterUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
    }

    // Create keywords for better discoverability
    const keywords = [
      title,
      genre,
      tone,
      "AI show bible",
      "production bible",
      "character design",
      "show development",
      "production flow",
    ].filter(Boolean);

    return {
      title: `${title} | As You Wish`,
      description,
      keywords: keywords.join(", "),
      
      // Open Graph
      openGraph: {
        type: "website",
        url: `${baseUrl}/show/${id}`,
        title: title,
        description,
        siteName: "As You Wish",
        images: [
          {
            url: absolutePosterUrl,
            width: 1280,
            height: 1920,
            alt: `${title} - Show Poster`,
            type: "image/webp",
          },
        ],
        locale: "en_US",
      },

      // Twitter Card
      twitter: {
        card: "summary_large_image",
        title: title,
        description,
        images: [absolutePosterUrl],
        creator: "@asyouwish",
        site: "@asyouwish",
      },

      // Additional metadata
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

      // App-specific metadata
      other: {
        "og:image:width": "1280",
        "og:image:height": "1920",
        "og:image:alt": `${title} - Show Poster`,
        "twitter:image:alt": `${title} - Show Poster`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Production Flow",
      description: "AI-powered show bible generator",
    };
  }
}

export default async function ShowPage({ params }: Props) {
  const { id } = await params;
  return <ShowPageClient showId={id} />;
}
