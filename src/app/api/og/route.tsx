import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const posterUrl = searchParams.get('poster');
    
    // If poster URL provided, fetch and return it directly
    if (posterUrl) {
      console.log('OG: Proxying poster image:', posterUrl.substring(0, 80) + '...');
      
      const response = await fetch(posterUrl, {
        headers: {
          'Accept': 'image/*',
        },
      });
      
      if (!response.ok) {
        console.error('OG: Failed to fetch poster, status:', response.status);
        return new NextResponse('Failed to fetch image', { status: 502 });
      }
      
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/webp';
      
      console.log('OG: Returning poster, size:', imageBuffer.byteLength, 'bytes');
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    
    // No poster - return a simple fallback using ImageResponse
    const { ImageResponse } = await import('next/og');
    const title = searchParams.get('title') || 'Untitled Show';
    const genre = searchParams.get('genre') || '';
    const logline = searchParams.get('logline') || '';
    
    console.log('OG: No poster, generating text fallback for:', title);
    
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
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG: Error:', error);
    return new NextResponse('Failed to generate image', { status: 500 });
  }
}
