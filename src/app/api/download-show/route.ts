import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createServerSupabaseClient } from "@/lib/supabase";

export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Helper to fetch file as buffer
async function fetchFileAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const showId = searchParams.get('showId');

  if (!showId) {
    return NextResponse.json(
      { error: "Missing showId parameter" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch show data
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

    console.log(`📦 Creating download package for show: ${show.id}`);
    
    const showTitle = show.blueprint?.show_title || "Untitled Show";
    const folderName = sanitizeFilename(showTitle);
    const showPrefix = sanitizeFilename(showTitle);
    
    const zip = new JSZip();
    const showFolder = zip.folder(folderName);
    
    if (!showFolder) {
      throw new Error("Failed to create zip folder");
    }

    let fileCount = 0;

    // 1. Add Blueprint JSON
    if (show.blueprint) {
      showFolder.file(
        `${showPrefix}_01-blueprint.json`,
        JSON.stringify(show.blueprint, null, 2)
      );
      fileCount++;
      console.log("  ✓ Added blueprint.json");
    }

    // 2. Add Character Dossiers
    if (show.character_docs && Object.keys(show.character_docs).length > 0) {
      const dossiersFolder = showFolder.folder("02-character-dossiers");
      Object.entries(show.character_docs).forEach(([charId, doc]) => {
        const character = show.character_seeds?.find((s: any) => s.id === charId);
        const charName = character?.name || charId;
        const fileName = `${showPrefix}_${sanitizeFilename(charName)}_dossier.json`;
        dossiersFolder?.file(fileName, JSON.stringify(doc, null, 2));
        fileCount++;
      });
      console.log(`  ✓ Added ${Object.keys(show.character_docs).length} character dossiers`);
    }

    // 3. Add Character Portraits
    if (show.character_portraits && Object.keys(show.character_portraits).length > 0) {
      const portraitsFolder = showFolder.folder("03-portraits");
      const portraitPromises = Object.entries(show.character_portraits).map(async ([charId, url]) => {
        if (url && typeof url === 'string') {
          try {
            const character = show.character_seeds?.find((s: any) => s.id === charId);
            const charName = character?.name || charId;
            const ext = url.includes('.webp') ? 'webp' : (url.includes('.png') ? 'png' : 'jpg');
            const fileName = `${showPrefix}_${sanitizeFilename(charName)}_portrait.${ext}`;
            const buffer = await fetchFileAsBuffer(url);
            portraitsFolder?.file(fileName, buffer);
            fileCount++;
          } catch (error) {
            console.warn(`  ⚠️ Failed to download portrait for ${charId}:`, error);
          }
        }
      });
      await Promise.all(portraitPromises);
      console.log(`  ✓ Added character portraits`);
    }

    // 4. Add Character Videos
    if (show.character_videos && Object.keys(show.character_videos).length > 0) {
      const videosFolder = showFolder.folder("04-character-videos");
      const videoPromises = Object.entries(show.character_videos).map(async ([charId, videos]) => {
        if (Array.isArray(videos) && videos.length > 0) {
          try {
            const character = show.character_seeds?.find((s: any) => s.id === charId);
            const charName = character?.name || charId;
            
            // Download each video for this character
            for (let i = 0; i < videos.length; i++) {
              const videoUrl = videos[i];
              if (videoUrl && typeof videoUrl === 'string') {
                const ext = videoUrl.includes('.webm') ? 'webm' : 'mp4';
                const fileName = videos.length > 1 
                  ? `${showPrefix}_${sanitizeFilename(charName)}_video-${i + 1}.${ext}`
                  : `${showPrefix}_${sanitizeFilename(charName)}_video.${ext}`;
                const buffer = await fetchFileAsBuffer(videoUrl);
                videosFolder?.file(fileName, buffer);
                fileCount++;
              }
            }
          } catch (error) {
            console.warn(`  ⚠️ Failed to download video for ${charId}:`, error);
          }
        }
      });
      await Promise.all(videoPromises);
      console.log(`  ✓ Added character videos`);
    }

    // 5. Add Portrait Grid
    if (show.portrait_grid_url) {
      try {
        const buffer = await fetchFileAsBuffer(show.portrait_grid_url);
        const ext = show.portrait_grid_url.includes('.webp') ? 'webp' : (show.portrait_grid_url.includes('.png') ? 'png' : 'jpg');
        showFolder.file(`${showPrefix}_05-portrait-grid.${ext}`, buffer);
        fileCount++;
        console.log("  ✓ Added portrait grid");
      } catch (error) {
        console.warn("  ⚠️ Failed to download portrait grid:", error);
      }
    }

    // 6. Add Show Poster (Library Poster)
    if (show.library_poster_url) {
      try {
        const buffer = await fetchFileAsBuffer(show.library_poster_url);
        const ext = show.library_poster_url.includes('.webp') ? 'webp' : (show.library_poster_url.includes('.png') ? 'png' : 'jpg');
        showFolder.file(`${showPrefix}_06-show-poster.${ext}`, buffer);
        fileCount++;
        console.log("  ✓ Added show poster");
      } catch (error) {
        console.warn("  ⚠️ Failed to download show poster:", error);
      }
    }

    // 7. Add Hero Poster (if different)
    if (show.poster_url && show.poster_url !== show.library_poster_url) {
      try {
        const buffer = await fetchFileAsBuffer(show.poster_url);
        const ext = show.poster_url.includes('.webp') ? 'webp' : (show.poster_url.includes('.png') ? 'png' : 'jpg');
        showFolder.file(`${showPrefix}_07-hero-poster.${ext}`, buffer);
        fileCount++;
        console.log("  ✓ Added hero poster");
      } catch (error) {
        console.warn("  ⚠️ Failed to download hero poster:", error);
      }
    }

    // 8. Add Trailer
    if (show.trailer_url) {
      try {
        const buffer = await fetchFileAsBuffer(show.trailer_url);
        const ext = show.trailer_url.includes('.webm') ? 'webm' : 'mp4';
        showFolder.file(`${showPrefix}_08-trailer.${ext}`, buffer);
        fileCount++;
        console.log("  ✓ Added trailer");
      } catch (error) {
        console.warn("  ⚠️ Failed to download trailer:", error);
      }
    }

    // 9. Add README
    const readme = `# ${showTitle}

## Show Description
${show.blueprint?.show_logline || 'No description available'}

## Production Details
- Created: ${new Date(show.created_at).toLocaleDateString()}
- Model: ${show.model || 'Unknown'}
- Characters: ${show.character_seeds?.length || 0}

## Contents
This package contains:
- Blueprint JSON (show specification)
- Character dossiers (${Object.keys(show.character_docs || {}).length} files)
- Character portraits (${Object.keys(show.character_portraits || {}).length} images)
- Character videos (${Object.keys(show.character_videos || {}).length} videos)
${show.portrait_grid_url ? '- Portrait grid (composite image)\n' : ''}${show.library_poster_url ? '- Show poster (key art)\n' : ''}${show.poster_url && show.poster_url !== show.library_poster_url ? '- Hero poster (alternative key art)\n' : ''}${show.trailer_url ? '- Series trailer video\n' : ''}
## File Organization
All files are prefixed with the show name for easy identification.

Files are organized and numbered in production order:
- 01 - Blueprint (show specification)
- 02 - Character Dossiers folder (individual JSON files per character)
- 03 - Portraits folder (character portrait images)
- 04 - Character Videos folder (showcase scene videos)
- 05 - Portrait Grid (composite image of all characters)
- 06 - Show Poster (key art for library)
- 07 - Hero Poster (alternative key art, if different)
- 08 - Trailer (final promotional video)

Naming Convention:
- Top-level files: \`${showPrefix}_##-description.ext\`
- Character files: \`${showPrefix}_CharacterName_type.ext\`

This naming system allows you to extract multiple shows into the same directory 
while keeping all files clearly identified and organized.

---
Generated with Production Flow
`;

    showFolder.file(`${showPrefix}_README.md`, readme);
    fileCount++;

    console.log(`✅ Package complete: ${fileCount} files`);

    // Generate zip
    const zipBuffer = await zip.generateAsync({ 
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    // Return as download
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${folderName}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Failed to create download package:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create download package", details: message },
      { status: 500 }
    );
  }
}

