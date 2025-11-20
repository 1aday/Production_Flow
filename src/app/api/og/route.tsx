import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'Untitled Show';
    const genre = searchParams.get('genre') || '';
    const logline = searchParams.get('logline') || '';
    
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
            fontFamily: 'Inter, sans-serif',
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
                WebkitBackgroundClip: 'text',
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
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

