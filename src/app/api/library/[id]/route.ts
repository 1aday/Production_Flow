import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const LIBRARY_DIR = join(process.cwd(), "library");

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Load a specific show
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const filePath = join(LIBRARY_DIR, `${id}.json`);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }
    
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    
    return NextResponse.json({ show: data });
  } catch (error) {
    console.error("Failed to load show:", error);
    return NextResponse.json(
      { error: "Failed to load show" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a show
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const filePath = join(LIBRARY_DIR, `${id}.json`);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }
    
    await unlink(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete show:", error);
    return NextResponse.json(
      { error: "Failed to delete show" },
      { status: 500 }
    );
  }
}

