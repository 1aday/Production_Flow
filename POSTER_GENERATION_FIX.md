# Poster Generation Flow - Issue & Fix

## Problem Identified

**Multiple triggers are generating the show poster:**

### Trigger 1: Portrait Completion (WRONG - DUPLICATE)
**Location:** Lines 4985-4990 in `src/app/console/page.tsx`
```typescript
if (!libraryPosterUrl && allPortraitsComplete && portraitGridUrl) {
  console.log("✅ All portraits done! Triggering library poster generation in 1.5s...");
  setTimeout(() => {
    console.log("🎬 Calling saveCurrentShow(true) for library poster");
    void saveCurrentShow(true);
  }, 1500);
}
```
- Fires when ALL character portraits complete
- Checks if portrait grid exists
- Calls `saveCurrentShow(true)` which generates poster
- **Issue:** Redundant with Trigger 3

### Trigger 2: Show Load Check (UTILITY - KEEP)
**Location:** Lines 7087-7096 in `src/app/console/page.tsx`
```typescript
if (!libraryPosterUrl && !libraryPosterLoading && portraitGridUrl) {
  console.log("🎨 Auto-generating missing library poster (portrait grid exists)");
  setTimeout(async () => {
    const newUrl = await generateLibraryPoster();
    if (newUrl) {
      setTimeout(() => void saveCurrentShow(false), 500);
    }
  }, 2000);
}
```
- Fires when loading a show that has portrait grid but no poster
- Useful for recovering incomplete shows
- **Status:** KEEP (utility function)

### Trigger 3: Portrait Grid Ready (CORRECT - KEEP)
**Location:** Lines 7117-7140 in `src/app/console/page.tsx`
```typescript
useEffect(() => {
  if (!portraitGridUrl || !blueprint || !currentShowId) return;
  if (libraryPosterUrl || libraryPosterLoading) return;
  
  const canGenerate = canGenerateLibraryPoster();
  if (!canGenerate) return;
  
  console.log("🎨 Portrait grid ready! Auto-generating library poster...");
  
  const timer = setTimeout(async () => {
    const newUrl = await generateLibraryPoster();
    if (newUrl) {
      setTimeout(() => void saveCurrentShow(false), 500);
    }
  }, 1500);
  
  return () => clearTimeout(timer);
}, [portraitGridUrl, libraryPosterUrl, libraryPosterLoading, ...]);
```
- Fires when portrait grid becomes available
- Has proper guards (checks if poster already exists/loading)
- **Status:** KEEP (primary trigger)

---

## The Correct Flow

```
1. User creates show
   ↓
2. Generates character blueprints
   ↓
3. Generates character portraits (individual images)
   ↓
4. When 4+ portraits ready → AUTO-GENERATES PORTRAIT GRID
   ↓
5. When portrait grid ready → AUTO-GENERATES LIBRARY POSTER (9:16)
   ↓
6. Poster is saved to libraryPosterUrl
   ↓
7. Poster displays on: Home, Library, Show Page, Console
```

---

## Solution

1. **Remove Trigger 1** (portrait completion handler)
   - This is redundant because portrait grid triggers it automatically
   - Causes duplicate poster generation
   
2. **Keep Trigger 2** (show load utility)
   - Useful for recovering shows with missing poster
   - Has proper guards to prevent duplicates
   
3. **Keep Trigger 3** (portrait grid ready)
   - This is the PRIMARY and CORRECT trigger
   - Fires exactly when it should: when portrait grid is ready
   - Has proper guards

---

## Poster Display Locations

The `libraryPosterUrl` is the SINGLE source of truth for the poster and is displayed in:

1. **Home Page** (`src/app/page.tsx` line 223)
   ```typescript
   const posterUrl = show.libraryPosterUrl || show.posterUrl;
   ```

2. **Library Page** (`src/app/library/page.tsx` line 194)
   ```typescript
   {show.libraryPosterUrl || show.posterUrl ? (
     <Image src={show.libraryPosterUrl || show.posterUrl || ""} ... />
   )}
   ```

3. **Show Page** (`src/app/show/[id]/page.tsx` line 509)
   ```typescript
   {assets.libraryPoster || assets.poster ? (
     <Image src={assets.libraryPoster || assets.poster || ""} ... />
   )}
   ```

4. **Console Page** (`src/app/console/page.tsx` line 2946)
   ```typescript
   const simplePosterImage = libraryPosterUrl ? (
     <Image src={libraryPosterUrl} ... />
   )
   ```

✅ All locations use `libraryPosterUrl` as primary source
✅ Only falls back to old `posterUrl` for backward compatibility

---

## Implementation

Remove the duplicate trigger in portrait completion handler and rely on the portrait grid ready trigger.

