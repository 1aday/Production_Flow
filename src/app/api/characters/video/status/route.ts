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
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
    });
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`❌ Replicate API error (${statusResponse.status}):`, errorText);
      return NextResponse.json(
        { 
          error: "Failed to fetch prediction status",
          detail: `Replicate API returned ${statusResponse.status}`,
          replicateError: errorText
        },
        { status: statusResponse.status }
      );
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

