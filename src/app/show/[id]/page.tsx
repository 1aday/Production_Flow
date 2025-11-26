import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";
import { extractShowId } from "@/lib/slug";
import ShowPageClient from "./ShowPageClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slugOrId } = await params;
  const id = extractShowId(slugOrId);
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
    const tone = show.blueprint?.tone || "";
    const characterCount = show.character_seeds?.length || 0;
    
    // Get poster URL - prioritize library poster, fallback to regular poster
    const posterUrl = show.library_poster_url || show.poster_url;
    
    // Debug logging
    console.log('Show OG Debug:', {
      id,
      title,
      hasPoster: !!posterUrl,
      posterUrl: posterUrl ? posterUrl.substring(0, 60) + '...' : '(none)',
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
    
    // WhatsApp ONLY supports these aspect ratios: 1.91:1, 1:1, or 16:9
    // Our poster is 9:16 (portrait) which WhatsApp will IGNORE
    // So we MUST use the /api/og endpoint to composite the poster into a 1200x630 landscape image
    const ogParams = new URLSearchParams({
      title: title,
      ...(genre && { genre }),
      ...(logline && { logline: logline.substring(0, 120) }),
    });
    
    // Pass the poster URL to be composited into the landscape OG image
    if (posterUrl) {
      const absolutePoster = posterUrl.startsWith("http") 
        ? posterUrl 
        : `${baseUrl}${posterUrl}`;
      ogParams.set('poster', absolutePoster);
    }
    
    const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
    
    // WhatsApp-compatible dimensions (1.91:1 aspect ratio)
    const imageWidth = 1200;
    const imageHeight = 630;
    const imageType = "image/png";

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
      
      // Open Graph - 1200x630 landscape with poster composited (WhatsApp requires 1.91:1 ratio)
      openGraph: {
        type: "website",
        url: `${baseUrl}/show/${id}`,
        title: title,
        description,
        siteName: "As You Wish",
        images: [
          {
            url: ogImageUrl,
            width: imageWidth,
            height: imageHeight,
            alt: `${title} - Show Poster`,
            type: imageType,
          },
        ],
        locale: "en_US",
      },

      // Twitter Card
      twitter: {
        card: "summary_large_image",
        title: title,
        description,
        images: [ogImageUrl],
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
        "og:image:width": String(imageWidth),
        "og:image:height": String(imageHeight),
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
  const { id: slugOrId } = await params;
  const id = extractShowId(slugOrId);
  return <ShowPageClient showId={id} />;
}
