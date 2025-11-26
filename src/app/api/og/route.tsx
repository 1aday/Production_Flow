import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const posterUrl = searchParams.get('poster');
    const title = searchParams.get('title') || 'Untitled Show';
    const genre = searchParams.get('genre') || '';
    const logline = searchParams.get('logline') || '';

    // Canvas dimensions - 1200x630 for WhatsApp (requires WEBP format)
    const WIDTH = 1200;
    const HEIGHT = 630;

    // If poster URL provided, center it on a dark canvas
    if (posterUrl) {
      console.log('OG: Centering poster on canvas:', posterUrl.substring(0, 80) + '...');
      
      try {
        const response = await fetch(posterUrl, {
          headers: { 'Accept': 'image/*' },
        });
        
        if (!response.ok) {
          console.error('OG: Failed to fetch poster, status:', response.status);
          // Fall through to text-only generation
        } else {
          const imageBuffer = await response.arrayBuffer();
          const posterBuffer = Buffer.from(imageBuffer);
          
          // Get poster dimensions
          const posterMeta = await sharp(posterBuffer).metadata();
          const posterWidth = posterMeta.width || 720;
          const posterHeight = posterMeta.height || 1280;
          
          // Calculate how to fit poster in the canvas while maintaining aspect ratio
          const padding = 20;
          const availableWidth = WIDTH - (padding * 2);
          const availableHeight = HEIGHT - (padding * 2);
          
          // Scale poster to fit within available space
          const scale = Math.min(
            availableWidth / posterWidth,
            availableHeight / posterHeight
          );
          const scaledWidth = Math.floor(posterWidth * scale);
          const scaledHeight = Math.floor(posterHeight * scale);
          
          // Center the poster on the canvas
          const posterX = Math.floor((WIDTH - scaledWidth) / 2);
          const posterY = Math.floor((HEIGHT - scaledHeight) / 2);
          
          // Resize poster
          const resizedPoster = await sharp(posterBuffer)
            .resize(scaledWidth, scaledHeight, { fit: 'inside' })
            .png() // Keep as PNG for compositing
            .toBuffer();
          
          // Create the final image - poster centered on dark background, output as WEBP for WhatsApp
          const finalImage = await sharp({
            create: {
              width: WIDTH,
              height: HEIGHT,
              channels: 4,
              background: { r: 10, g: 10, b: 10, alpha: 1 }, // #0a0a0a
            },
          })
            .composite([
              {
                input: resizedPoster,
                left: posterX,
                top: posterY,
              },
            ])
            .webp({ quality: 90 })
            .toBuffer();
          
          console.log('OG: Poster centered (WEBP), size:', finalImage.length, 'bytes');
          
          return new NextResponse(new Uint8Array(finalImage), {
            headers: {
              'Content-Type': 'image/webp',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      } catch (posterError) {
        console.error('OG: Error processing poster:', posterError);
        // Fall through to text-only generation
      }
    }
    
    // No poster or poster failed - generate text-only fallback as WEBP
    console.log('OG: No poster, generating text fallback (WEBP) for:', title);
    
    const displayTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
    const displayLogline = logline.length > 120 ? logline.substring(0, 117) + '...' : logline;
    
    // Create SVG text overlay
    const svgText = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .brand { fill: #ffffff; font-family: system-ui, -apple-system, sans-serif; font-weight: 700; font-size: 24px; }
          .title { fill: #ffffff; font-family: system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 64px; }
          .genre { fill: #ffffff; font-family: system-ui, -apple-system, sans-serif; font-weight: 600; font-size: 22px; }
          .logline { fill: #aaaaaa; font-family: system-ui, -apple-system, sans-serif; font-weight: 400; font-size: 24px; }
          .tagline { fill: #666666; font-family: system-ui, -apple-system, sans-serif; font-weight: 400; font-size: 18px; }
        </style>
        
        <!-- Brand -->
        <text x="60" y="60" class="brand">AS YOU WISH</text>
        
        <!-- Title (centered) -->
        <text x="${WIDTH / 2}" y="${HEIGHT / 2 - 30}" text-anchor="middle" class="title">${escapeXml(displayTitle)}</text>
        
        <!-- Genre pill -->
        ${genre ? `
          <rect x="${WIDTH / 2 - 80}" y="${HEIGHT / 2 + 10}" width="160" height="36" rx="18" fill="#333333"/>
          <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 35}" text-anchor="middle" class="genre">${escapeXml(genre.toUpperCase())}</text>
        ` : ''}
        
        <!-- Logline -->
        ${displayLogline ? `
          <text x="${WIDTH / 2}" y="${HEIGHT / 2 + 90}" text-anchor="middle" class="logline">${escapeXml(displayLogline)}</text>
        ` : ''}
        
        <!-- Tagline -->
        <text x="${WIDTH - 60}" y="${HEIGHT - 40}" text-anchor="end" class="tagline">AI Show Bible Generator</text>
      </svg>
    `;
    
    // Create WEBP image with text
    const fallbackImage = await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 4,
        background: { r: 10, g: 10, b: 10, alpha: 1 },
      },
    })
      .composite([
        {
          input: Buffer.from(svgText),
          left: 0,
          top: 0,
        },
      ])
      .webp({ quality: 90 })
      .toBuffer();
    
    return new NextResponse(new Uint8Array(fallbackImage), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('OG: Error:', error);
    return new NextResponse('Failed to generate image', { status: 500 });
  }
}

// Helper to escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
