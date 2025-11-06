import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const LIBRARY_DIR = join(process.cwd(), "library");

// Ensure library directory exists
async function ensureLibraryDir() {
  if (!existsSync(LIBRARY_DIR)) {
    await mkdir(LIBRARY_DIR, { recursive: true });
  }
}

type ShowMetadata = {
  id: string;
  title: string;
  showTitle?: string;
  createdAt: string;
  updatedAt: string;
  model: string;
  posterUrl?: string;
  libraryPosterUrl?: string;
};

// GET - List all shows
export async function GET() {
  try {
    console.time("Library GET - total");
    await ensureLibraryDir();
    
    console.time("Read directory");
    const files = await readdir(LIBRARY_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    console.timeEnd("Read directory");
    
    console.log(`Found ${jsonFiles.length} show files`);
    
    const shows: ShowMetadata[] = [];
    
    console.time("Parse all files");
    for (const file of jsonFiles) {
      try {
        const filePath = join(LIBRARY_DIR, file);
        const content = await readFile(filePath, "utf-8");
        
        // Only parse the fields we need for listing
        const data = JSON.parse(content);
        
        shows.push({
          id: data.id,
          title: data.title || data.blueprint?.show_logline?.slice(0, 100) || "Untitled Show",
          showTitle: data.blueprint?.show_title,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          model: data.model,
          posterUrl: data.posterUrl,
          libraryPosterUrl: data.libraryPosterUrl,
        });
      } catch (err) {
        console.error(`Failed to read ${file}:`, err);
      }
    }
    console.timeEnd("Parse all files");
    
    // Sort by updated date, newest first
    console.time("Sort shows");
    shows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    console.timeEnd("Sort shows");
    
    console.timeEnd("Library GET - total");
    
    return NextResponse.json({ shows });
  } catch (error) {
    console.error("Failed to list shows:", error);
    return NextResponse.json(
      { error: "Failed to list shows" },
      { status: 500 }
    );
  }
}

// POST - Save a show
export async function POST(request: NextRequest) {
  try {
    await ensureLibraryDir();
    
    const body = await request.json();
    const { id, blueprint, rawJson, usage, model, characterSeeds, characterDocs, characterPortraits, characterVideos, posterUrl, libraryPosterUrl } = body;
    
    if (!id || !blueprint) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const title = blueprint.show_title || blueprint.show_logline?.slice(0, 100) || "Untitled Show";
    
    const videosData = (characterVideos || {}) as Record<string, string[]>;
    
    const showData = {
      id,
      title,
      createdAt: body.createdAt || now,
      updatedAt: now,
      blueprint,
      rawJson,
      usage,
      model,
      characterSeeds: characterSeeds || [],
      characterDocs: characterDocs || {},
      characterPortraits: characterPortraits || {},
      characterVideos: videosData,
      posterUrl: posterUrl || null,
      libraryPosterUrl: libraryPosterUrl || null,
    };
    
    const filePath = join(LIBRARY_DIR, `${id}.json`);
    await writeFile(filePath, JSON.stringify(showData, null, 2), "utf-8");
    
    const totalVideos = Object.values(videosData).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    
    console.log("💾 Show saved to library:", {
      id,
      title,
      path: filePath,
      characterSeeds: showData.characterSeeds.length,
      characterDocs: Object.keys(showData.characterDocs).length,
      portraits: Object.keys(showData.characterPortraits).filter(k => showData.characterPortraits[k]).length,
      videos: totalVideos,
      hasPoster: !!showData.posterUrl,
      hasLibraryPoster: !!showData.libraryPosterUrl,
    });
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to save show:", error);
    return NextResponse.json(
      { error: "Failed to save show" },
      { status: 500 }
    );
  }
}

