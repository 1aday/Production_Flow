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

    // Canvas dimensions - 1200x630 for social media compatibility
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
            .png()
            .toBuffer();
          
          // Create the final image - poster centered on dark background
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
            .png()
            .toBuffer();
          
          console.log('OG: Poster centered, size:', finalImage.length, 'bytes');
          
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
    
    // No poster or poster failed - generate text-only fallback
    console.log('OG: No poster, generating text fallback for:', title);
    
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
