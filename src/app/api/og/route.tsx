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

    // Canvas dimensions - WhatsApp compatible 1.91:1 ratio
    const WIDTH = 1200;
    const HEIGHT = 630;

    // If poster URL provided, composite it into landscape format
    if (posterUrl) {
      console.log('OG: Compositing poster into landscape:', posterUrl.substring(0, 80) + '...');
      
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
          
          // Calculate poster placement - fit to left side with padding
          const posterAreaWidth = Math.floor(WIDTH * 0.4); // 40% of width for poster
          const padding = 40;
          const availableHeight = HEIGHT - (padding * 2);
          const availableWidth = posterAreaWidth - (padding * 2);
          
          // Scale poster to fit
          const scale = Math.min(
            availableWidth / posterWidth,
            availableHeight / posterHeight
          );
          const scaledWidth = Math.floor(posterWidth * scale);
          const scaledHeight = Math.floor(posterHeight * scale);
          
          // Center the poster vertically in its area
          const posterX = padding + Math.floor((availableWidth - scaledWidth) / 2);
          const posterY = padding + Math.floor((availableHeight - scaledHeight) / 2);
          
          // Resize poster
          const resizedPoster = await sharp(posterBuffer)
            .resize(scaledWidth, scaledHeight, { fit: 'inside' })
            .png()
            .toBuffer();
          
          // Create text area SVG for the right side
          const textAreaX = posterAreaWidth + 20;
          const textAreaWidth = WIDTH - textAreaX - padding;
          
          // Truncate title if too long
          const displayTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
          const displayLogline = logline.length > 150 ? logline.substring(0, 147) + '...' : logline;
          
          // Create SVG overlay with text
          const svgText = `
            <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
              <style>
                .title { fill: #ffffff; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-weight: 800; font-size: 48px; }
                .genre { fill: #ffffff; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-weight: 600; font-size: 20px; }
                .logline { fill: #aaaaaa; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-weight: 400; font-size: 22px; }
                .brand { fill: #ffffff; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-weight: 700; font-size: 20px; }
                .tagline { fill: #666666; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-weight: 400; font-size: 16px; }
              </style>
              
              <!-- Brand -->
              <text x="${textAreaX}" y="60" class="brand">AS YOU WISH</text>
              
              <!-- Title -->
              <text x="${textAreaX}" y="${HEIGHT / 2 - 40}" class="title">
                ${escapeXml(displayTitle)}
              </text>
              
              <!-- Genre pill -->
              ${genre ? `
                <rect x="${textAreaX}" y="${HEIGHT / 2}" width="${Math.min(genre.length * 12 + 40, 200)}" height="36" rx="18" fill="#333333"/>
                <text x="${textAreaX + 20}" y="${HEIGHT / 2 + 25}" class="genre">${escapeXml(genre.toUpperCase())}</text>
              ` : ''}
              
              <!-- Logline -->
              ${displayLogline ? `
                <foreignObject x="${textAreaX}" y="${HEIGHT / 2 + 60}" width="${textAreaWidth}" height="120">
                  <div xmlns="http://www.w3.org/1999/xhtml" style="color: #aaaaaa; font-family: Inter, Helvetica Neue, Arial, sans-serif; font-size: 20px; line-height: 1.4; overflow: hidden;">
                    ${escapeXml(displayLogline)}
                  </div>
                </foreignObject>
              ` : ''}
              
              <!-- Tagline -->
              <text x="${textAreaX}" y="${HEIGHT - 40}" class="tagline">AI Show Bible Generator</text>
            </svg>
          `;
          
          // Create the final composite image
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
              {
                input: Buffer.from(svgText),
                left: 0,
                top: 0,
              },
            ])
            .png()
            .toBuffer();
          
          console.log('OG: Composited image size:', finalImage.length, 'bytes');
          
          return new NextResponse(new Uint8Array(finalImage), {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      } catch (posterError) {
        console.error('OG: Error processing poster:', posterError);
        // Fall through to text-only generation
      }
    }
    
    // No poster or poster failed - generate text-only image using ImageResponse
    console.log('OG: Generating text fallback for:', title);
    
    const { ImageResponse } = await import('next/og');
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 40,
              left: 60,
              fontSize: 24,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            AS YOU WISH
          </div>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              maxWidth: '90%',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 72,
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 30,
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
            
            {genre && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#222222',
                  padding: '12px 28px',
                  borderRadius: 30,
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#ffffff',
                  marginBottom: 30,
                }}
              >
                {genre.toUpperCase()}
              </div>
            )}
            
            {logline && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  color: '#aaaaaa',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                {logline.length > 150 ? logline.substring(0, 147) + '...' : logline}
              </div>
            )}
          </div>
          
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: 40,
              right: 60,
              fontSize: 18,
              color: '#666666',
            }}
          >
            AI Show Bible Generator
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      }
    );
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
