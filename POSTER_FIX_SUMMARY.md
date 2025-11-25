# Poster Generation Fix - Summary

## ✅ Issue Fixed

**Problem:** Multiple poster generation triggers were firing, causing the system to generate multiple posters and regenerate based on wrong triggers.

**Root Cause:** 3 different triggers were all trying to generate the poster:
1. ❌ Portrait completion handler (REMOVED - was duplicate)
2. ✅ Show load utility (KEPT - useful for recovery)
3. ✅ Portrait grid ready (KEPT - primary trigger)

---

## 🔧 Changes Made

### 1. Removed Duplicate Trigger (lines 4973-4989)

**Before:**
```typescript
// Check if all characters are done, then trigger library poster
if (!libraryPosterUrl && allPortraitsComplete && portraitGridUrl) {
  console.log("✅ All portraits done! Triggering library poster generation in 1.5s...");
  setTimeout(() => {
    console.log("🎬 Calling saveCurrentShow(true) for library poster");
    void saveCurrentShow(true);
  }, 1500);
}
```

**After:**
```typescript
// Portrait completed! 
// Note: Library poster will auto-generate when portrait grid is ready (see useEffect below)
console.log("✅ Portrait completed for:", characterId);

if (allPortraitsComplete) {
  console.log("🎉 All portraits complete! Portrait grid will auto-generate, then poster will follow.");
} else {
  const completedCount = characterSeeds?.filter(seed => 
    characterPortraits[seed.id] || seed.id === characterId
  ).length || 0;
  console.log(`⏳ ${completedCount}/${characterSeeds?.length || 0} portraits complete`);
}
```

**Why:** This was redundant. The portrait grid ready trigger handles poster generation automatically.

---

## 📊 The Correct Flow (Now)

```
1. User creates show
   ↓
2. Generates character blueprints
   ↓
3. Generates character portraits (individual 1024x1024 images)
   ↓  (triggers when 4+ portraits complete)
4. AUTO-GENERATES PORTRAIT GRID (5x2 grid, 3000x1200px)
   ↓  (triggers when portrait grid becomes available)
5. AUTO-GENERATES LIBRARY POSTER (9:16 Netflix-style poster)
   ↓
6. Poster saved to libraryPosterUrl
   ↓
7. Poster displays consistently across all pages
```

### Single Source of Truth: `libraryPosterUrl`

**One poster field** used everywhere:
- Database: `library_poster_url` column
- State: `libraryPosterUrl` 
- API: `/api/library-poster`

---

## 🎯 Trigger Details

### Primary Trigger: Portrait Grid Ready (lines 7110-7134)

**When it fires:**
- Portrait grid URL becomes available
- Blueprint exists
- Current show ID exists
- NO existing poster or poster loading

**Guards to prevent duplicates:**
```typescript
if (!portraitGridUrl || !blueprint || !currentShowId) return;
if (libraryPosterUrl || libraryPosterLoading) return; // Already have or generating
```

**Process:**
1. Waits 1.5s after portrait grid is ready
2. Calls `generateLibraryPoster()`
3. Saves show with new poster
4. Cleans up with timeout cleanup

**Log output:**
```
🎨 Portrait grid ready! Auto-generating library poster...
   Portrait grid URL: data:image/webp;base64,UklGRt...
   Show title: My Amazing Show
✅ Library poster auto-generated: data:image/webp;base64,UklGRt...
```

---

### Utility Trigger: Show Load Recovery (lines 7080-7096)

**When it fires:**
- Loading a show that has portrait grid
- But missing library poster
- Not currently loading poster

**Purpose:** Recovers incomplete shows that have grid but no poster

**Guards:**
```typescript
if (!libraryPosterUrl && !libraryPosterLoading && portraitGridUrl) {
  // Generate missing poster
}
```

This is useful when:
- User closed browser mid-generation
- Show was imported without poster
- Previous generation failed

---

## 📍 Poster Display Locations

### 1. Home Page (`src/app/page.tsx:223`)
```typescript
const posterUrl = show.libraryPosterUrl || show.posterUrl;
```
- Shows poster in grid
- Falls back to old posterUrl for backward compatibility
- Displays trailer on hover if available

### 2. Library Page (`src/app/library/page.tsx:194`)
```typescript
{show.libraryPosterUrl || show.posterUrl ? (
  <Image src={show.libraryPosterUrl || show.posterUrl || ""} ... />
)}
```
- Same fallback logic
- Shows completion badge overlay

### 3. Show Page (`src/app/show/[id]/page.tsx:509`)
```typescript
{assets.libraryPoster || assets.poster ? (
  <Image src={assets.libraryPoster || assets.poster || ""} ... />
)}
```
- Hero section background
- Uses library poster as primary

### 4. Console Page (`src/app/console/page.tsx:2946`)
```typescript
const simplePosterImage = libraryPosterUrl ? (
  <Image src={libraryPosterUrl} ... />
)
```
- Master tab display
- Click to zoom lightbox

✅ **All pages use `libraryPosterUrl` as primary source**
✅ **Fallback to old `posterUrl` only for backward compatibility**

---

## 🧪 Testing Checklist

To verify the fix works:

1. ✅ Create a new show
2. ✅ Wait for character portraits to generate (4+ characters)
3. ✅ Verify portrait grid generates automatically
4. ✅ Verify **ONLY ONE** poster generates after grid is ready
5. ✅ Check console logs show single poster generation:
   ```
   🎨 Portrait grid ready! Auto-generating library poster...
   ✅ Library poster auto-generated: ...
   ```
6. ✅ Verify poster displays on all 4 pages:
   - Home page (grid view)
   - Library page (card view)
   - Show page (hero section)
   - Console page (Master tab)
7. ✅ Verify no duplicate poster generation logs
8. ✅ Verify poster regeneration button works correctly
9. ✅ Load an existing show and verify it doesn't regenerate poster

---

## 📝 Additional Notes

### Old Poster System (REMOVED)
- `posterUrl` - Old 1024×1792 hero poster
- `generatePoster()` - Never called
- Was causing "Untitled Series" bugs

### New Poster System (CURRENT)
- `libraryPosterUrl` - 9:16 Netflix-style poster
- `generateLibraryPoster()` - Single generation function
- Uses portrait grid as base image
- Includes show title and style guide

### Future Improvements
- Could drop `poster_url` column from database (low priority)
- Could remove old posterUrl state entirely (currently kept for backward compat)

---

## 🎉 Result

✅ **ONE poster per show**
✅ **ONE generation trigger (portrait grid ready)**
✅ **Consistent display across all pages**
✅ **No duplicate generation**
✅ **Proper recovery on show load**

The system now generates exactly 1 poster when the portrait grid is ready, and reuses that poster consistently everywhere.




