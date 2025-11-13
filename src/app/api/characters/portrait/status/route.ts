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
    // Query Replicate's API for the prediction status using direct fetch
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
    });

    if (!statusResponse.ok) {
      const errorBody = await statusResponse.text();
      console.error(`Failed to fetch status for ${jobId}:`, errorBody);
      throw new Error(`Replicate API error: ${statusResponse.status}`);
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
    console.error("Failed to fetch prediction status:", error);
    return NextResponse.json(
      { error: "Failed to fetch prediction status" },
      { status: 500 }
    );
  }
}

