import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const maxDuration = 300;

const LIBRARY_DIR = join(process.cwd(), "library");
const PUBLIC_ASSETS_DIR = join(process.cwd(), "public", "library-assets");

type SaveAssetsRequest = {
  showId: string;
  assets: {
    characterPortraits?: Record<string, string>;
    characterVideos?: Record<string, string[]>;
    posterUrl?: string;
    libraryPosterUrl?: string;
    portraitGridUrl?: string;
    trailerUrl?: string;
  };
};

async function downloadAsset(url: string, showId: string, filename: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const showAssetDir = join(PUBLIC_ASSETS_DIR, showId);

    if (!existsSync(showAssetDir)) {
      await mkdir(showAssetDir, { recursive: true });
    }

    const filePath = join(showAssetDir, filename);
    await writeFile(filePath, Buffer.from(buffer));

    // Return path relative to public folder
    return `/library-assets/${showId}/${filename}`;
  } catch (error) {
    console.error(`Failed to download asset ${filename}:`, error);
    return url; // Fall back to original URL
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveAssetsRequest;
    const { showId, assets } = body;

    if (!showId || !assets) {
      return NextResponse.json(
        { error: "Missing showId or assets" },
        { status: 400 }
      );
    }

    console.log(`💾 Downloading assets for show ${showId}...`);

    const savedAssets: typeof assets = {};
    let downloadCount = 0;

    // Download character portraits
    if (assets.characterPortraits) {
      savedAssets.characterPortraits = {};
      for (const [characterId, url] of Object.entries(assets.characterPortraits)) {
        if (url && url.startsWith("http")) {
          const filename = `portrait-${characterId}.webp`;
          savedAssets.characterPortraits[characterId] = await downloadAsset(url, showId, filename);
          downloadCount++;
        } else {
          savedAssets.characterPortraits[characterId] = url;
        }
      }
    }

    // Download character videos
    if (assets.characterVideos) {
      savedAssets.characterVideos = {};
      for (const [characterId, urls] of Object.entries(assets.characterVideos)) {
        savedAssets.characterVideos[characterId] = [];
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          if (url && url.startsWith("http")) {
            const filename = `video-${characterId}-v${i + 1}.mp4`;
            savedAssets.characterVideos[characterId].push(await downloadAsset(url, showId, filename));
            downloadCount++;
          } else {
            savedAssets.characterVideos[characterId].push(url);
          }
        }
      }
    }

    // Download other assets
    if (assets.posterUrl && assets.posterUrl.startsWith("http")) {
      savedAssets.posterUrl = await downloadAsset(assets.posterUrl, showId, "poster.webp");
      downloadCount++;
    }

    if (assets.libraryPosterUrl && assets.libraryPosterUrl.startsWith("http")) {
      savedAssets.libraryPosterUrl = await downloadAsset(assets.libraryPosterUrl, showId, "library-poster.webp");
      downloadCount++;
    }

    if (assets.portraitGridUrl && assets.portraitGridUrl.startsWith("http")) {
      savedAssets.portraitGridUrl = await downloadAsset(assets.portraitGridUrl, showId, "portrait-grid.webp");
      downloadCount++;
    }

    if (assets.trailerUrl && assets.trailerUrl.startsWith("http")) {
      savedAssets.trailerUrl = await downloadAsset(assets.trailerUrl, showId, "trailer.mp4");
      downloadCount++;
    }

    console.log(`✅ Downloaded ${downloadCount} assets for show ${showId}`);

    return NextResponse.json({ 
      success: true, 
      savedAssets,
      downloadCount 
    });
  } catch (error) {
    console.error("Failed to save assets:", error);
    return NextResponse.json(
      { error: "Failed to save assets" },
      { status: 500 }
    );
  }
}

