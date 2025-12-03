# Callback Dependency Bug Fix - Stylization Guardrails Not Updating

## Critical Bug Discovered

User reported: **"stylization guardrail switches after I press generate show bible, to on"**

Even when they toggled guardrails OFF, the system would use the OLD value (ON) when generating the show.

---

## Root Cause: Stale Closure Values in useCallback

### The Problem

React's `useCallback` creates a memoized version of a function with **closures over variables**. If those variables are not in the dependency array, the callback captures and **forever uses** the values from when it was first created.

### What Was Happening

1. Page loads → `stylizationGuardrails = true` (default)
2. `submitPrompt` callback created → **captures** `stylizationGuardrails = true` in closure
3. `generateCharacterSeeds` callback created → **captures** `stylizationGuardrails = true`
4. `generatePoster` callback created → **captures** `stylizationGuardrails = true`
5. User toggles guardrails OFF → State updates to `false` ✅
6. User presses "Generate Show Bible" → Uses **OLD callback** with **captured `true`** ❌
7. API receives `stylizationGuardrails: true` even though UI shows OFF

### The Result

```javascript
// User's expectation:
stylizationGuardrails = false  // What they toggled to

// What actually happened:
stylizationGuardrails = true   // What the callback captured at creation
```

Even though the state updated and the UI showed "Guardrails: OFF", the callbacks still had the old TRUE value baked in!

---

## Callbacks Affected

### 1. `submitPrompt` - Blueprint Generation
**File:** `src/app/console/page.tsx` Line 6294

**Before:**
```typescript
const submitPrompt = useCallback(
  async (value: string, chosenModel: ModelId) => {
    // ... uses stylizationGuardrails at line 6363
    body: JSON.stringify({ 
      prompt: value, 
      model: chosenModel,
      stylizationGuardrails, // ← Uses captured value
    }),
  },
  [generateCharacterSeeds, generatePoster, stopTrailerStatusPolling]
  // ❌ Missing stylizationGuardrails!
);
```

**After:**
```typescript
const submitPrompt = useCallback(
  async (value: string, chosenModel: ModelId) => {
    // ... uses stylizationGuardrails
  },
  [generateCharacterSeeds, generatePoster, stopTrailerStatusPolling, stylizationGuardrails]
  // ✅ Now includes stylizationGuardrails
);
```

---

### 2. `generateCharacterSeeds` - Character Extraction
**File:** `src/app/console/page.tsx` Line 4740

**Before:**
```typescript
const generateCharacterSeeds = useCallback(
  async (value: string, showData: ShowBlueprint, chosenModel: ModelId, specificShowId?: string) => {
    // ... uses stylizationGuardrails at line 4780
    body: JSON.stringify({ 
      prompt: value, 
      show: showData, 
      model: chosenModel,
      stylizationGuardrails, // ← Uses captured value
    }),
  },
  []
  // ❌ Empty dependency array!
);
```

**After:**
```typescript
const generateCharacterSeeds = useCallback(
  async (value: string, showData: ShowBlueprint, chosenModel: ModelId, specificShowId?: string) => {
    // ... uses stylizationGuardrails
  },
  [stylizationGuardrails]
  // ✅ Now includes stylizationGuardrails
);
```

---

### 3. `generatePoster` - Hero Poster Generation
**File:** `src/app/console/page.tsx` Line 5706

**Before:**
```typescript
const generatePoster = useCallback(
  async (value: string, gridUrl?: string, specificShowId?: string) => {
    // ... uses stylizationGuardrails at line 5753
    // ... uses imageModel at line 5752
    body: JSON.stringify({
      prompt: trimmedPrompt || value.slice(0, 4950),
      characterGridUrl: gridUrl,
      imageModel, // ← Uses captured value
      stylizationGuardrails, // ← Uses captured value
      show: blueprint ? { ... } : undefined,
    }),
  },
  [blueprint, posterLoading, currentShowId]
  // ❌ Missing stylizationGuardrails AND imageModel!
);
```

**After:**
```typescript
const generatePoster = useCallback(
  async (value: string, gridUrl?: string, specificShowId?: string) => {
    // ... uses stylizationGuardrails and imageModel
  },
  [blueprint, posterLoading, currentShowId, stylizationGuardrails, imageModel]
  // ✅ Now includes both
);
```

---

## Already Correct Callbacks ✅

These callbacks already had `stylizationGuardrails` in their dependencies:

### 1. `generateCharacterPortrait`
Line 5257: `[blueprint, characterDocs, libraryPosterUrl, currentShowId, characterSeeds, imageModel, stylizationGuardrails]` ✅

### 2. `generateCharacterVideo`
Line 5667: `[blueprint, characterDocs, characterPortraits, posterAvailable, videoAspectRatio, videoModelId, videoResolution, videoSeconds, currentShowId, characterSeeds, stylizationGuardrails]` ✅

### 3. `generateTrailer`
Line 6138: `[blueprint, portraitGridUrl, characterSeeds, characterPortraits, startTrailerStatusPolling, stopTrailerStatusPolling, currentShowId, stylizationGuardrails]` ✅

---

## Timeline of User Experience

### Before Fix:

```
1. Page loads
   ├─ stylizationGuardrails = true (default)
   └─ Callbacks created with captured value = true

2. User toggles OFF
   ├─ stylizationGuardrails = false (state updated)
   ├─ UI shows "Guardrails: OFF"
   └─ Callbacks NOT recreated (missing from dependencies)

3. User generates show
   ├─ submitPrompt called → uses captured value = true
   ├─ generateCharacterSeeds called → uses captured value = true  
   ├─ generatePoster called → uses captured value = true
   └─ APIs receive stylizationGuardrails: true ❌

4. Result: Stylized output even though UI says OFF
```

### After Fix:

```
1. Page loads
   ├─ stylizationGuardrails = true (default)
   └─ Callbacks created with captured value = true

2. User toggles OFF
   ├─ stylizationGuardrails = false (state updated)
   ├─ UI shows "Guardrails: OFF"
   └─ Callbacks RECREATED with new value = false ✅

3. User generates show
   ├─ submitPrompt called → uses current value = false
   ├─ generateCharacterSeeds called → uses current value = false
   ├─ generatePoster called → uses current value = false
   └─ APIs receive stylizationGuardrails: false ✅

4. Result: Photorealistic output as expected ✅
```

---

## Files Modified

1. ✅ `/src/app/console/page.tsx`
   - Line 6499: Added `stylizationGuardrails` to `submitPrompt` dependencies
   - Line 4880: Added `stylizationGuardrails` to `generateCharacterSeeds` dependencies
   - Line 5858: Added `stylizationGuardrails` and `imageModel` to `generatePoster` dependencies

---

## Why This Is Critical

### Impact Level: HIGH 🚨

This bug made the stylization guardrails toggle **completely non-functional**. No matter what the user set, the system would always use the default value (TRUE) captured when the page first loaded.

### Symptoms:
- Toggle appears to work (UI updates)
- State actually updates correctly
- But callbacks use old captured values
- User gets unexpected stylized output
- **Complete loss of user control over stylization**

### Similar to:
This is similar to the classic React bug where event handlers use stale state because they weren't recreated when dependencies changed.

---

## Testing

### Test Case 1: Toggle BEFORE Generating Show

1. Load page (guardrails = ON by default)
2. **Toggle guardrails OFF** 
3. Enter prompt: "A photorealistic spy thriller like James Bond"
4. Press "Generate Show Bible"
5. **Expected:** APIs receive `stylizationGuardrails: false`
6. **Expected:** Blueprint uses realistic system directive
7. **Expected:** Character descriptions allow "realistic" terms
8. **Expected:** All assets are photorealistic

**Before Fix:** APIs received `true`, got stylized output ❌  
**After Fix:** APIs receive `false`, get photorealistic output ✅

---

### Test Case 2: Toggle AFTER Generating Show

1. Load page
2. Generate show with guardrails ON
3. Toggle guardrails OFF
4. Generate another show
5. **Expected:** New show uses current guardrails setting (OFF)

**Before Fix:** Used old captured value (ON) ❌  
**After Fix:** Uses current value (OFF) ✅

---

### Test Case 3: Multiple Toggles

1. Load page (ON)
2. Toggle OFF
3. Toggle ON
4. Toggle OFF
5. Generate show
6. **Expected:** Uses final value (OFF)

**Before Fix:** Used initial value (ON) ❌  
**After Fix:** Uses final value (OFF) ✅

---

## React Hooks Lesson

### The Rule of Hooks: Dependency Arrays

When using `useCallback`, `useMemo`, or `useEffect`:

**❌ BAD:**
```typescript
const myFunction = useCallback(() => {
  doSomethingWith(someState); // Uses someState
}, []); // ← Missing someState in dependencies!
// Function captures INITIAL value of someState forever
```

**✅ GOOD:**
```typescript
const myFunction = useCallback(() => {
  doSomethingWith(someState); // Uses someState
}, [someState]); // ← Includes someState in dependencies
// Function gets recreated when someState changes
```

### Why Dependencies Matter

Dependencies tell React: **"Recreate this function when these values change"**

Without proper dependencies:
- Function uses **stale values** from when it was first created
- State updates don't propagate to the function
- User actions appear to work but have no effect
- **Silent failures that are hard to debug**

---

## Related Issues

This same bug pattern could exist elsewhere:

### Checklist for Other Callbacks:
- ✅ All callbacks using `stylizationGuardrails` are fixed
- ✅ `imageModel` also added where used
- ✅ No linter errors
- ✅ All API-calling callbacks have correct dependencies

---

## Prevention

### ESLint Rule

The `react-hooks/exhaustive-deps` ESLint rule should catch this. If it's not enabled:

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

This rule warns when dependencies are missing from useCallback/useEffect/useMemo.

---

## Summary

**Bug:** Callbacks captured stale `stylizationGuardrails` values  
**Cause:** Missing from useCallback dependency arrays  
**Impact:** Toggle appeared to work but had no effect  
**Fix:** Added to all relevant dependency arrays  
**Result:** Guardrails toggle now works correctly  

**User can now successfully toggle guardrails OFF and get photorealistic output!** ✅




