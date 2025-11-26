import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Use Node.js runtime for better image handling
export const runtime = 'nodejs';
export const maxDuration = 30;

// Helper to fetch image and convert to data URL
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    console.log('OG: Fetching poster image:', url.substring(0, 100) + '...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'image/*',
      },
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('OG: Failed to fetch image, status:', response.status);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log('OG: Successfully fetched image, size:', arrayBuffer.byteLength, 'bytes, type:', contentType);
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('OG: Failed to fetch image:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'Untitled Show';
    const genre = searchParams.get('genre') || '';
    const logline = searchParams.get('logline') || '';
    const posterUrl = searchParams.get('poster') || '';
    
    console.log('OG: Generating image for:', { title, hasPoster: !!posterUrl });
    
    // If poster is provided, fetch it and create a landscape image with the poster
    if (posterUrl) {
      const posterDataUrl = await fetchImageAsDataUrl(posterUrl);
      
      if (posterDataUrl) {
        console.log('OG: Rendering with poster');
        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                backgroundColor: '#000000',
                position: 'relative',
              }}
            >
              {/* Blurred poster background for atmosphere */}
              <img
                src={posterDataUrl}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'blur(40px) brightness(0.3)',
                  transform: 'scale(1.2)',
                }}
              />
              
              {/* Main poster - proportionally sized (9:16 in landscape frame) */}
              <div
                style={{
                  display: 'flex',
                  position: 'absolute',
                  left: 60,
                  top: 30,
                  bottom: 30,
                  width: 320,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
                }}
              >
                <img
                  src={posterDataUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
              
              {/* Text content on the right */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'absolute',
                  left: 420,
                  right: 60,
                  top: 0,
                  bottom: 0,
                  padding: '40px 0',
                }}
              >
                {/* Brand */}
                <div
                  style={{
                    display: 'flex',
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: '2px',
                    marginBottom: 16,
                  }}
                >
                  AS YOU WISH
                </div>
                
                {/* Title */}
                <div
                  style={{
                    display: 'flex',
                    fontSize: 56,
                    fontWeight: 900,
                    color: '#ffffff',
                    lineHeight: 1.1,
                    marginBottom: 20,
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  }}
                >
                  {title.length > 40 ? title.substring(0, 37) + '...' : title}
                </div>
                
                {/* Genre Badge */}
                {genre && (
                  <div
                    style={{
                      display: 'flex',
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      padding: '8px 20px',
                      borderRadius: 999,
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: 20,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {genre.toUpperCase()}
                  </div>
                )}
                
                {/* Logline */}
                {logline && (
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 22,
                      color: 'rgba(255, 255, 255, 0.85)',
                      lineHeight: 1.4,
                      maxWidth: '100%',
                    }}
                  >
                    {logline.length > 120 ? logline.substring(0, 117) + '...' : logline}
                  </div>
                )}
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        );
      } else {
        console.log('OG: Poster fetch failed, falling back to text-only');
      }
    }
    
    // Fallback: No poster or poster fetch failed - just text
    console.log('OG: Rendering text-only version');
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
            backgroundColor: '#090909',
            backgroundImage: 'linear-gradient(135deg, #090909 0%, #1a1a1a 100%)',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 40,
              left: 60,
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            AS YOU WISH
          </div>
          
          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 120px',
              maxWidth: '90%',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                textAlign: 'center',
                marginBottom: 40,
                lineHeight: 1.1,
                letterSpacing: '-2px',
              }}
            >
              {title}
            </div>
            
            {/* Genre Badge */}
            {genre && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '12px 32px',
                  borderRadius: 999,
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: 40,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {genre}
              </div>
            )}
            
            {/* Logline */}
            {logline && (
              <div
                style={{
                  fontSize: 32,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  maxWidth: '80%',
                  lineHeight: 1.4,
                }}
              >
                {logline.length > 150 ? logline.substring(0, 147) + '...' : logline}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: 40,
              right: 60,
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            AI Show Bible Generator
          </div>
          
          {/* Accent Elements */}
          <div
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -150,
              left: -150,
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG: Error generating image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
