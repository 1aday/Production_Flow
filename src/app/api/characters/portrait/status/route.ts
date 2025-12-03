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
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : "Failed to connect to Replicate API";
      console.warn(`⚠️ Transient network error fetching from Replicate (will retry):`, errorMsg);
      // Return a special response that frontend knows to retry
      return NextResponse.json(
        { 
          status: null, // null status indicates "unknown" not "failed"
          detail: `Network error: ${errorMsg}`,
          isTransient: true, // Flag for frontend to know this is retryable
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
      logs?: string;
    };
    
    console.log(`   Prediction status: ${prediction.status}`);
    if (prediction.error) {
      console.log(`   Prediction error: ${prediction.error}`);
    }
    if (prediction.status === "failed" && !prediction.error && prediction.logs) {
      // Try to extract error from logs
      console.log(`   Checking logs for error info...`);
      const logLines = prediction.logs.split('\n').slice(-5);
      console.log(`   Last log lines:`, logLines.join(' | '));
    }
    
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
    
    // Build error detail - try multiple sources
    let errorDetail = prediction.error;
    if (!errorDetail && prediction.status === "failed") {
      // Try to get error from logs
      if (prediction.logs) {
        const logLines = prediction.logs.split('\n').filter(l => l.trim());
        const errorLine = logLines.find(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('failed'));
        if (errorLine) {
          errorDetail = errorLine.trim();
        } else if (logLines.length > 0) {
          errorDetail = `Generation failed. Last log: ${logLines[logLines.length - 1].slice(0, 200)}`;
        }
      }
      if (!errorDetail) {
        errorDetail = "Generation failed with no error message. This may be due to content moderation.";
      }
    }
    
    return NextResponse.json({
      status: prediction.status,
      detail: errorDetail,
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

