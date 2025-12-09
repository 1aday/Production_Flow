import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId query parameter." },
      { status: 400 }
    );
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable." },
      { status: 500 }
    );
  }

  try {
    console.log(`🔍 Checking video status for job: ${jobId}`);
    
    // Query Replicate's API for the prediction status
    let statusResponse;
    try {
      statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
        // 3 minute timeout - Replicate can be slow
        signal: AbortSignal.timeout(180000),
      });
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : "Failed to connect to Replicate API";
      console.warn(`⚠️ Transient network error fetching from Replicate (will retry):`, errorMsg);
      return NextResponse.json(
        { 
          status: null,
          detail: `Network error: ${errorMsg}`,
          isTransient: true,
        },
        { status: 200 } // Return 200 so frontend can handle gracefully
      );
    }
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text().catch(() => "Unable to read error");
      console.error(`❌ Replicate API error (${statusResponse.status}):`, errorText);
      
      // If the prediction doesn't exist (404), return null status
      if (statusResponse.status === 404) {
        return NextResponse.json({
          status: null,
          detail: "Prediction not found. It may have expired or was created with a different API key.",
        });
      }
      
      // For other errors, return them as null status so frontend can handle
      return NextResponse.json(
        { 
          status: null,
          detail: `Replicate API error (${statusResponse.status}): ${errorText}`,
        },
        { status: 200 } // Return 200 so frontend handles this as a "failed" prediction
      );
    }
    
    // Validate content-type is JSON
    const contentType = statusResponse.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const responseText = await statusResponse.text();
      console.error("Video status returned non-JSON:", contentType, responseText.slice(0, 200));
      return NextResponse.json({
        status: null,
        detail: "Video status check returned invalid response. Please try again.",
      }, { status: 200 });
    }
    
    const prediction = await statusResponse.json() as { 
      id: string; 
      status: string; 
      error?: string; 
      output?: unknown 
    };
    
    console.log(`📊 Video status: ${prediction.status}`, prediction.error ? `Error: ${prediction.error}` : '');
    
    let outputUrl: string | undefined;
    
    // Extract URL from output (videos can have complex structures)
    if (prediction.status === "succeeded" && prediction.output) {
      if (typeof prediction.output === "string") {
        outputUrl = prediction.output;
      } else if (Array.isArray(prediction.output) && prediction.output.length > 0) {
        const first = prediction.output[0];
        if (typeof first === "string") {
          outputUrl = first;
        } else if (first && typeof first === "object" && "url" in first) {
          outputUrl = first.url as string;
        }
      } else if (typeof prediction.output === "object" && prediction.output !== null) {
        const obj = prediction.output as Record<string, unknown>;
        if ("url" in obj && typeof obj.url === "string") {
          outputUrl = obj.url;
        } else if ("video" in obj && typeof obj.video === "string") {
          outputUrl = obj.video;
        }
      }
      
      if (outputUrl) {
        console.log(`✅ Video completed, URL: ${outputUrl}`);
      } else {
        console.warn(`⚠️ Video succeeded but couldn't extract URL from output:`, prediction.output);
      }
    }
    
    return NextResponse.json({
      status: prediction.status,
      detail: prediction.error || undefined,
      outputUrl,
    });
  } catch (error) {
    console.error("❌ Failed to fetch video prediction status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to fetch prediction status",
        detail: errorMessage
      },
      { status: 500 }
    );
  }
}

