import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId query parameter." },
      { status: 400 }
    );
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  
  if (!replicateToken) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN environment variable." },
      { status: 500 }
    );
  }

  try {
    console.log(`📊 Polling portrait status for job: ${jobId}`);
    console.log(`   URL: https://api.replicate.com/v1/predictions/${jobId}`);
    console.log(`   Using token: ${replicateToken.slice(0, 8)}...`);
    
    // Query Replicate's API for the prediction status using direct fetch
    let statusResponse;
    try {
      statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${replicateToken}`,
        },
      });
    } catch (fetchError) {
      console.error(`❌ Network error fetching from Replicate:`, fetchError);
      return NextResponse.json(
        { 
          error: "Network error",
          detail: fetchError instanceof Error ? fetchError.message : "Failed to connect to Replicate API",
          status: null
        },
        { status: 200 } // Return 200 so frontend can handle gracefully
      );
    }

    console.log(`   Response status: ${statusResponse.status}`);

    if (!statusResponse.ok) {
      const errorBody = await statusResponse.text().catch(() => "Unable to read error");
      console.error(`❌ Failed to fetch status for ${jobId}:`, errorBody);
      console.error(`   This could mean:`);
      console.error(`   1. Prediction ID doesn't exist`);
      console.error(`   2. Prediction was created under wrong account`);
      console.error(`   3. Prediction completed and was cleaned up`);
      
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
          detail: `Replicate API error (${statusResponse.status}): ${errorBody}`,
        },
        { status: 200 } // Return 200 so frontend handles this as a "failed" prediction
      );
    }

    const prediction = await statusResponse.json() as { 
      status: string; 
      error?: string; 
      output?: unknown;
    };
    
    let outputUrl: string | undefined;
    
    // Extract URL from output
    if (prediction.status === "succeeded" && prediction.output) {
      if (Array.isArray(prediction.output) && prediction.output.length > 0) {
        const first = prediction.output[0];
        if (typeof first === "string") {
          outputUrl = first;
        } else if (first && typeof first === "object" && "url" in first) {
          outputUrl = first.url as string;
        }
      } else if (typeof prediction.output === "string") {
        outputUrl = prediction.output;
      }
    }
    
    return NextResponse.json({
      status: prediction.status,
      detail: prediction.error || undefined,
      outputUrl,
    });
  } catch (error) {
    console.error("❌ Failed to fetch prediction status:", error);
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

