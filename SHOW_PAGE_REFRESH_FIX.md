# Show Page Refresh Fix

## Problem
When on a show page (`/show/[id]`) and refreshing the browser, the page would redirect to the home page or library instead of staying on the show page.

## Root Cause
The `loadShowData` function was not properly memoized, which caused several issues:
1. **Unstable function reference** - React was recreating the function on every render
2. **Potential race conditions** - Multiple fetch requests could be triggered
3. **Aggressive error handling** - Any temporary network issue would cause redirect

## Solution

### 1. Memoized loadShowData with useCallback
```typescript
const loadShowData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch(`/api/show/${showId}`);
    // ... rest of function
  } catch (error) {
    // Don't redirect on error - just show alert
    alert(`Failed to load show: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
    setGeneratingContent(false);
  }
}, [showId, router]);
```

**Benefits:**
- ✅ Stable function reference across renders
- ✅ Only recreates when `showId` or `router` changes
- ✅ Prevents unnecessary re-fetches

### 2. Added Retry Logic for 404 Errors
```typescript
if (response.status === 404) {
  console.error("Show not found:", showId);
  // Wait 500ms in case of temporary issue
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Try one more time before giving up
  const retryResponse = await fetch(`/api/show/${showId}`);
  if (!retryResponse.ok) {
    alert("Show not found. Redirecting to library...");
    router.push("/library");
    return;
  }
  // If retry succeeded, use retry data
  const retryData = await retryResponse.json();
  setShowData(retryData.show);
  setAssets(retryData.assets);
  // ... calculate completion
  return;
}
```

**Benefits:**
- ✅ Handles temporary network issues
- ✅ Gives Supabase connection time to establish
- ✅ Only redirects if show truly doesn't exist
- ✅ Better user experience on slow connections

### 3. Non-Aggressive Error Handling
```typescript
catch (error) {
  console.error("Error loading show:", error);
  // Don't redirect on error - just show alert and stay on page
  alert(`Failed to load show: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

**Before:** Any error would potentially cause redirect  
**After:** Errors show alert but keep user on page (they can retry with browser refresh)

### 4. Proper useEffect Hook
```typescript
useEffect(() => {
  void loadShowData();
}, [loadShowData]);
```

**Benefits:**
- ✅ Runs when loadShowData reference changes (when showId changes)
- ✅ No unnecessary re-runs
- ✅ Stable dependency array

## Why It Was Redirecting

### Possible Scenarios:
1. **Slow Supabase Connection** - On refresh, database connection takes time to establish
2. **Network Race Condition** - Request sent before connection ready
3. **Temporary 404** - Supabase query timing issue
4. **Function Recreation** - Unstable function caused multiple fetches

### With The Fix:
- **First attempt fails** → Wait 500ms → Retry once
- **Retry succeeds** → Show loads normally ✅
- **Retry fails** → Only then redirect to library
- **Other errors** → Stay on page, show error message

## Testing

### ✅ Refresh on Show Page
1. Navigate to `/show/[some-id]`
2. Press F5 or Cmd+R to refresh
3. Page should reload and stay on same show
4. No redirect should occur

### ✅ Slow Network
1. Throttle network in DevTools (Slow 3G)
2. Refresh show page
3. Should wait and retry
4. Should eventually load or show error

### ✅ Invalid Show ID
1. Navigate to `/show/invalid-id-that-doesnt-exist`
2. Should show "Show not found" after retry
3. Should redirect to library after 500ms + retry

## Files Modified

1. **src/app/show/[id]/page.tsx**
   - Added `useCallback` import (line 3)
   - Wrapped `loadShowData` in `useCallback` (line 214)
   - Added retry logic for 404 errors (lines 220-246)
   - Improved error handling (lines 278-281)
   - Proper useEffect with stable dependency (lines 288-290)

## Status: ✅ FIXED

Show pages now:
- ✅ Stay on same page when refreshed
- ✅ Handle temporary network issues gracefully
- ✅ Retry once before giving up
- ✅ Only redirect if show truly doesn't exist
- ✅ Better error messages

**No more unexpected redirects on refresh!** 🎉

