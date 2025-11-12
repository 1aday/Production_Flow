import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST - Reset templates to factory defaults
export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Delete and recreate to get defaults from schema
    await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', 'default');
    
    await supabase
      .from('prompt_templates')
      .insert({ id: 'default', version: 'v1' });
    
    console.log("✅ Prompt templates reset to defaults");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset templates:", error);
    return NextResponse.json(
      { error: "Failed to reset templates" },
      { status: 500 }
    );
  }
}

