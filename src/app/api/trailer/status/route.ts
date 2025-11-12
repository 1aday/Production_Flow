import { NextRequest, NextResponse } from "next/server";

import {
  getTrailerStatusRecord,
  pruneTrailerStatusRecords,
} from "@/lib/trailer-status";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId query parameter." },
      { status: 400 }
    );
  }

  pruneTrailerStatusRecords();
  const record = getTrailerStatusRecord(jobId);

  if (!record) {
    return NextResponse.json({ status: null });
  }

  return NextResponse.json(record);
}
