import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/show/[id]/download
 * Redirects to the existing download-show endpoint
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: showId } = await context.params;
  
  // Redirect to the existing download endpoint with showId as query param
  const url = new URL('/api/download-show', request.url);
  url.searchParams.set('showId', showId);
  
  // Forward the request to the existing download endpoint
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to download show" },
      { status: response.status }
    );
  }
  
  // Return the zip file
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  
  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/zip',
      'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="show-${showId}.zip"`,
    },
  });
}

