import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const posterUrl = searchParams.get('poster');

    // If poster URL provided, just fetch and return it directly as-is
    if (posterUrl) {
      console.log('OG: Returning poster directly:', posterUrl.substring(0, 80) + '...');
      
      try {
        const response = await fetch(posterUrl, {
          headers: { 'Accept': 'image/*' },
        });
        
        if (!response.ok) {
          console.error('OG: Failed to fetch poster, status:', response.status);
          return new NextResponse('Poster not found', { status: 404 });
        }
        
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/png';
        
        console.log('OG: Returning poster directly, size:', imageBuffer.byteLength, 'bytes, type:', contentType);
        
        return new NextResponse(new Uint8Array(imageBuffer), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch (posterError) {
        console.error('OG: Error fetching poster:', posterError);
        return new NextResponse('Failed to fetch poster', { status: 500 });
      }
    }
    
    // No poster URL provided
    return new NextResponse('No poster URL provided', { status: 400 });
  } catch (error) {
    console.error('OG: Error:', error);
    return new NextResponse('Failed to generate image', { status: 500 });
  }
}
