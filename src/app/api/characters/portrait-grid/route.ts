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
const MAX_CHARACTERS = 10; // Always show 10 slots

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

  const columns = 5; // 5 columns x 2 rows = 10 slots
  const rows = 2;
  const totalSlots = MAX_CHARACTERS;

  console.log("🎨 Compositing character grid (10 slots):", {
    charactersProvided: body.portraits.length,
    grid: `${columns}x${rows}`,
    output: `${GRID_WIDTH}x${GRID_HEIGHT}`,
  });

  try {
    // Download all portrait images
    const portraitBuffers = await Promise.all(
      body.portraits.map(async (portrait) => {
        // Convert relative URLs to absolute URLs using the request origin
        let url = portrait.url;
        if (url.startsWith('/')) {
          const origin = request.headers.get('origin') || 
                         request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
                         `${request.nextUrl.protocol}//${request.nextUrl.host}`;
          url = `${origin}${url}`;
        }
        
        const response = await fetch(url);
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

    // Calculate cell dimensions for 5x2 grid (10 slots)
    const padding = 12;
    const labelHeight = 30; // Height for character name label
    
    // Calculate available space
    const availableWidth = GRID_WIDTH - (padding * (columns + 1));
    const availableHeight = GRID_HEIGHT - (padding * (rows + 1));
    
    // Cell size - account for label at bottom
    const maxCellWidth = Math.floor(availableWidth / columns);
    const maxCellHeight = Math.floor(availableHeight / rows) - labelHeight;
    const portraitSize = Math.min(maxCellWidth, maxCellHeight);

    console.log(`Grid: ${columns}x${rows} (10 slots), portrait size: ${portraitSize}x${portraitSize}, label height: ${labelHeight}px`);

    // Resize portraits to fit cells
    const resizedPortraits = await Promise.all(
      portraitBuffers.map(async ({ name, buffer }) => {
        const resized = await sharp(buffer)
          .resize(portraitSize, portraitSize, {
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

    // Create composite operations for all 10 slots
    const compositeOperations = [];
    
    for (let i = 0; i < totalSlots; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = padding + col * (maxCellWidth + padding);
      const y = padding + row * (maxCellHeight + labelHeight + padding);
      
      if (i < resizedPortraits.length) {
        // Add portrait
        compositeOperations.push({
          input: resizedPortraits[i].buffer,
          top: y,
          left: x + Math.floor((maxCellWidth - portraitSize) / 2), // Center in cell
        });
        
        // Add character name label using SVG text
        const name = resizedPortraits[i].name;
        const textSvg = Buffer.from(`
          <svg width="${maxCellWidth}" height="${labelHeight}">
            <text 
              x="50%" 
              y="20" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="16" 
              font-weight="600"
              fill="#E5E5E5"
            >${name}</text>
          </svg>
        `);
        
        compositeOperations.push({
          input: textSvg,
          top: y + portraitSize + 4,
          left: x,
        });
      }
      // Empty slots remain black background
    }

    // Composite all elements onto canvas
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
