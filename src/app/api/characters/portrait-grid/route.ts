import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const maxDuration = 120;

type PortraitGridBody = {
  portraits: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  columns?: number;
};

const GRID_WIDTH = 1280;
const GRID_HEIGHT = 720;
const BACKGROUND_COLOR = { r: 18, g: 18, b: 18 }; // #121212

export async function POST(request: NextRequest) {
  let body: PortraitGridBody;
  try {
    body = (await request.json()) as PortraitGridBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.portraits || body.portraits.length === 0) {
    return NextResponse.json(
      { error: "At least one portrait required." },
      { status: 400 }
    );
  }

  const columns = body.columns ?? 3;
  const portraitCount = body.portraits.length;
  const rows = Math.ceil(portraitCount / columns);

  console.log("🎨 Compositing character grid from actual portraits:", {
    characters: portraitCount,
    grid: `${columns}x${rows}`,
    output: `${GRID_WIDTH}x${GRID_HEIGHT}`,
  });

  try {
    // Download all portrait images
    const portraitBuffers = await Promise.all(
      body.portraits.map(async (portrait) => {
        const response = await fetch(portrait.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch portrait: ${portrait.name}`);
        }
        const buffer = await response.arrayBuffer();
        return {
          name: portrait.name,
          buffer: Buffer.from(buffer),
        };
      })
    );

    console.log(`Downloaded ${portraitBuffers.length} portraits`);

    // Calculate cell dimensions with padding
    const padding = 20;
    const cellWidth = Math.floor((GRID_WIDTH - padding * (columns + 1)) / columns);
    const cellHeight = Math.floor((GRID_HEIGHT - padding * (rows + 1)) / rows);

    console.log(`Grid cells: ${cellWidth}x${cellHeight}`);

    // Resize all portraits to fit cells (maintaining aspect ratio)
    const resizedPortraits = await Promise.all(
      portraitBuffers.map(async ({ name, buffer }) => {
        const resized = await sharp(buffer)
          .resize(cellWidth, cellHeight, {
            fit: "contain",
            background: BACKGROUND_COLOR,
          })
          .toBuffer();
        return { name, buffer: resized };
      })
    );

    // Create base canvas
    const canvas = sharp({
      create: {
        width: GRID_WIDTH,
        height: GRID_HEIGHT,
        channels: 3,
        background: BACKGROUND_COLOR,
      },
    });

    // Position each portrait in the grid
    const compositeOperations = resizedPortraits.map((portrait, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = padding + col * (cellWidth + padding);
      const y = padding + row * (cellHeight + padding);

      return {
        input: portrait.buffer,
        top: y,
        left: x,
      };
    });

    // Composite all portraits onto canvas
    const gridBuffer = await canvas.composite(compositeOperations).webp({ quality: 95 }).toBuffer();

    console.log(`✅ Character grid composited: ${GRID_WIDTH}x${GRID_HEIGHT}`);

    // Convert to base64 data URL
    const base64 = gridBuffer.toString("base64");
    const dataUrl = `data:image/webp;base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    console.error("[portrait-grid] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate portrait grid.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
