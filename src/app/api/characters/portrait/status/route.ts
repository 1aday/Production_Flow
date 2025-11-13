import { NextRequest, NextResponse } from "next/server";

import {
  getPortraitStatusRecord,
  prunePortraitStatusRecords,
} from "@/lib/portrait-status";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId query parameter." },
      { status: 400 }
    );
  }

  prunePortraitStatusRecords();
  const record = getPortraitStatusRecord(jobId);

  if (!record) {
    return NextResponse.json({ status: null });
  }

  return NextResponse.json({
    status: record.status,
    detail: record.detail,
    outputUrl: record.outputUrl,
  });
}

