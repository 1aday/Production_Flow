import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import sharp from "sharp";

export const maxDuration = 300; // 5 minutes for migration

type ShowRecord = {
  id: string;
  title: string;
  poster_url: string | null;
  library_poster_url: string | null;
  portrait_grid_url: string | null;
  character_portraits: Record<string, string | null> | null;
};

async function convertAndUpload(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  url: string,
  showId: string,
  filename: string
): Promise<{ newUrl: string | null; converted: boolean; sizeInfo: string }> {
  try {
    // Skip if already PNG or not a URL
    if (!url || !url.startsWith('http')) {
      return { newUrl: url, converted: false, sizeInfo: 'skipped (not a URL)' };
    }
    if (url.includes('.png')) {
      return { newUrl: url, converted: false, sizeInfo: 'skipped (already PNG)' };
    }
    
    // Fetch the image
    const fetchStart = Date.now();
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`    ❌ Failed to fetch: HTTP ${response.status}`);
      return { newUrl: url, converted: false, sizeInfo: `fetch failed (${response.status})` };
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const originalSize = inputBuffer.length;
    const fetchTime = Date.now() - fetchStart;
    
    // Convert to PNG using sharp
    const convertStart = Date.now();
    const pngBuffer = await sharp(inputBuffer)
      .png()
      .toBuffer();
    const newSize = pngBuffer.length;
    const convertTime = Date.now() - convertStart;
    
    // Upload to Supabase with .png extension
    const uploadStart = Date.now();
    const storagePath = `${showId}/${filename}`;
    
    const { error: uploadError } = await supabase.storage
      .from('show-assets')
      .upload(storagePath, pngBuffer, {
        contentType: 'image/png',
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`    ❌ Upload error: ${uploadError.message}`);
      return { newUrl: url, converted: false, sizeInfo: `upload failed: ${uploadError.message}` };
    }
    const uploadTime = Date.now() - uploadStart;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('show-assets')
      .getPublicUrl(storagePath);
    
    const sizeChange = ((newSize - originalSize) / originalSize * 100).toFixed(1);
    const sizeInfo = `${(originalSize/1024).toFixed(0)}KB → ${(newSize/1024).toFixed(0)}KB (${sizeChange}%) | fetch:${fetchTime}ms convert:${convertTime}ms upload:${uploadTime}ms`;
    
    return { newUrl: publicUrl, converted: true, sizeInfo };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'unknown error';
    console.error(`    ❌ Error: ${errMsg}`);
    return { newUrl: url, converted: false, sizeInfo: `error: ${errMsg}` };
  }
}

export async function POST() {
  const migrationStart = Date.now();
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           🖼️  WEBP → PNG MIGRATION STARTING                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    const supabase = createServerSupabaseClient();
    
    // Get all shows with image URLs
    console.log('📊 Fetching shows from database...');
    const { data: shows, error } = await supabase
      .from('shows')
      .select('id, title, poster_url, library_poster_url, portrait_grid_url, character_portraits');
    
    if (error) {
      console.error('❌ Failed to fetch shows:', error);
      return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 });
    }
    
    const totalShows = shows?.length || 0;
    console.log(`✅ Found ${totalShows} shows in database\n`);
    
    // Count webp images
    let webpCount = 0;
    for (const show of (shows || [])) {
      if (show.poster_url?.includes('.webp')) webpCount++;
      if (show.library_poster_url?.includes('.webp')) webpCount++;
      if (show.portrait_grid_url?.includes('.webp')) webpCount++;
      if (show.character_portraits) {
        for (const url of Object.values(show.character_portraits)) {
          if (url?.includes('.webp')) webpCount++;
        }
      }
    }
    console.log(`🔍 Found ${webpCount} WEBP images to convert\n`);
    console.log('─'.repeat(70));
    
    const results = {
      showsProcessed: 0,
      imagesConverted: 0,
      imagesSkipped: 0,
      imagesFailed: 0,
      details: [] as string[],
    };
    
    let currentImage = 0;
    
    for (let i = 0; i < (shows || []).length; i++) {
      const show = (shows as ShowRecord[])[i];
      results.showsProcessed++;
      
      const progress = ((i + 1) / totalShows * 100).toFixed(0);
      console.log(`\n┌─ SHOW ${i + 1}/${totalShows} (${progress}%) ──────────────────────────────────`);
      console.log(`│ ID: ${show.id}`);
      console.log(`│ Title: ${show.title || 'Untitled'}`);
      console.log('│');
      
      const updates: Partial<ShowRecord> = {};
      let showConverted = 0;
      
      // Convert poster_url
      if (show.poster_url) {
        currentImage++;
        const label = show.poster_url.includes('.webp') ? '🔄' : '⏭️';
        console.log(`│ ${label} poster_url [${currentImage}/${webpCount}]`);
        
        if (show.poster_url.includes('.webp')) {
          const result = await convertAndUpload(supabase, show.poster_url, show.id, 'poster.png');
          console.log(`│    ${result.converted ? '✅' : '⚠️'} ${result.sizeInfo}`);
          if (result.converted) {
            updates.poster_url = result.newUrl;
            results.imagesConverted++;
            showConverted++;
          } else if (result.sizeInfo.includes('error') || result.sizeInfo.includes('failed')) {
            results.imagesFailed++;
          } else {
            results.imagesSkipped++;
          }
        }
      }
      
      // Convert library_poster_url
      if (show.library_poster_url) {
        currentImage++;
        const label = show.library_poster_url.includes('.webp') ? '🔄' : '⏭️';
        console.log(`│ ${label} library_poster_url [${currentImage}/${webpCount}]`);
        
        if (show.library_poster_url.includes('.webp')) {
          const result = await convertAndUpload(supabase, show.library_poster_url, show.id, 'library-poster.png');
          console.log(`│    ${result.converted ? '✅' : '⚠️'} ${result.sizeInfo}`);
          if (result.converted) {
            updates.library_poster_url = result.newUrl;
            results.imagesConverted++;
            showConverted++;
          } else if (result.sizeInfo.includes('error') || result.sizeInfo.includes('failed')) {
            results.imagesFailed++;
          } else {
            results.imagesSkipped++;
          }
        }
      }
      
      // Convert portrait_grid_url
      if (show.portrait_grid_url) {
        currentImage++;
        const label = show.portrait_grid_url.includes('.webp') ? '🔄' : '⏭️';
        console.log(`│ ${label} portrait_grid_url [${currentImage}/${webpCount}]`);
        
        if (show.portrait_grid_url.includes('.webp')) {
          const result = await convertAndUpload(supabase, show.portrait_grid_url, show.id, 'portrait-grid.png');
          console.log(`│    ${result.converted ? '✅' : '⚠️'} ${result.sizeInfo}`);
          if (result.converted) {
            updates.portrait_grid_url = result.newUrl;
            results.imagesConverted++;
            showConverted++;
          } else if (result.sizeInfo.includes('error') || result.sizeInfo.includes('failed')) {
            results.imagesFailed++;
          } else {
            results.imagesSkipped++;
          }
        }
      }
      
      // Convert character portraits
      if (show.character_portraits && Object.keys(show.character_portraits).length > 0) {
        const newPortraits: Record<string, string | null> = {};
        let portraitsChanged = false;
        
        const portraitEntries = Object.entries(show.character_portraits);
        console.log(`│ 👥 Character portraits: ${portraitEntries.length} found`);
        
        for (const [charId, url] of portraitEntries) {
          if (url?.includes('.webp')) {
            currentImage++;
            console.log(`│    🔄 ${charId} [${currentImage}/${webpCount}]`);
            
            const result = await convertAndUpload(supabase, url, show.id, `portraits/${charId}.png`);
            console.log(`│       ${result.converted ? '✅' : '⚠️'} ${result.sizeInfo}`);
            
            if (result.converted) {
              newPortraits[charId] = result.newUrl;
              portraitsChanged = true;
              results.imagesConverted++;
              showConverted++;
            } else {
              newPortraits[charId] = url;
              if (result.sizeInfo.includes('error') || result.sizeInfo.includes('failed')) {
                results.imagesFailed++;
              } else {
                results.imagesSkipped++;
              }
            }
          } else {
            newPortraits[charId] = url;
          }
        }
        
        if (portraitsChanged) {
          updates.character_portraits = newPortraits;
        }
      }
      
      // Update database if any changes
      if (Object.keys(updates).length > 0) {
        console.log(`│`);
        console.log(`│ 💾 Updating database...`);
        const { error: updateError } = await supabase
          .from('shows')
          .update(updates)
          .eq('id', show.id);
        
        if (updateError) {
          console.log(`│ ❌ Database update failed: ${updateError.message}`);
          results.imagesFailed++;
        } else {
          console.log(`│ ✅ Database updated (${Object.keys(updates).length} fields)`);
          results.details.push(`${show.title || show.id}: ${showConverted} images converted`);
        }
      } else {
        console.log(`│`);
        console.log(`│ ⏭️ No updates needed`);
      }
      
      console.log(`└${'─'.repeat(69)}`);
    }
    
    const totalTime = ((Date.now() - migrationStart) / 1000).toFixed(1);
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           ✅ MIGRATION COMPLETE                                ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Shows processed:    ${String(results.showsProcessed).padStart(6)}                                 ║`);
    console.log(`║  Images converted:   ${String(results.imagesConverted).padStart(6)}                                 ║`);
    console.log(`║  Images skipped:     ${String(results.imagesSkipped).padStart(6)}                                 ║`);
    console.log(`║  Images failed:      ${String(results.imagesFailed).padStart(6)}                                 ║`);
    console.log(`║  Total time:         ${String(totalTime + 's').padStart(6)}                                 ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    return NextResponse.json({
      success: true,
      ...results,
      totalTimeSeconds: parseFloat(totalTime),
    });
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Migration failed' 
    }, { status: 500 });
  }
}
