# Trailer Model Selection - Bug Fixes

## Issue Fixed
**Error**: "Converting circular structure to JSON" when generating trailers

The error occurred because the `blueprint` object contained React Fiber nodes and other circular references that couldn't be serialized to JSON.

## Solution

### 1. Fixed Circular Reference Error (`src/app/console/page.tsx`)

**Before:**
```typescript
body: JSON.stringify({
  // ...
  show: blueprint, // ❌ Contains circular references
})
```

**After:**
```typescript
// Create a clean, serializable copy
const cleanBlueprint: Record<string, unknown> = {
  show_title: String(blueprint.show_title || ""),
  show_logline: String(blueprint.show_logline || ""),
};

// Safely extract production_style
if (blueprint.production_style) {
  const ps = blueprint.production_style;
  cleanBlueprint.production_style = {
    medium: ps.medium ? String(ps.medium) : undefined,
    cinematic_references: Array.isArray(ps.cinematic_references) 
      ? ps.cinematic_references.map(String).filter(Boolean)
      : [],
    visual_treatment: ps.visual_treatment ? String(ps.visual_treatment) : undefined,
    stylization_level: ps.stylization_level ? String(ps.stylization_level) : undefined,
  };
}

body: JSON.stringify({
  // ...
  show: cleanBlueprint, // ✅ Clean, serializable object
})
```

### 2. Simplified Model Support

**Removed Models:**
- ❌ Minimax Video-01
- ❌ Kling
- ❌ Runway Gen-3

**Current Models:**
- ✅ Sora 2 (Standard)
- ✅ Sora 2 Pro (High resolution)
- ✅ VEO 3.1 (Fallback)

### 3. Updated API Route (`src/app/api/trailer/route.ts`)

**Changes:**
- Removed duplicate `generateWithSoraPro()` function
- Updated `generateWithSora()` to accept `isPro` parameter
- Removed unused model generation functions
- Simplified model switching logic
- Updated type definitions to only include supported models

**Model Selection:**
```typescript
switch (modelName) {
  case 'sora-2':
    return generateWithSora(prompt, gridUrl, jobId, false); // Standard
  case 'sora-2-pro':
    return generateWithSora(prompt, gridUrl, jobId, true);  // Pro tier
  case 'veo-3.1':
    return generateWithVeo(prompt, gridUrl, jobId);
  default:
    return null;
}
```

### 4. Updated Component (`src/components/TrailerModelSelector.tsx`)

**Changes:**
- Removed unused model options
- Updated type definitions
- Simplified UI with only 3 models
- Default changed to `sora-2-pro` for best quality

## Testing

To test the fix:

1. ✅ Generate a trailer in auto mode (should use Sora 2)
2. ✅ Use the model selector to regenerate with Sora 2 Pro
3. ✅ Use the model selector to regenerate with VEO 3.1
4. ✅ Verify no circular reference errors occur
5. ✅ Check that all models complete successfully

## Key Improvements

1. **No more circular reference errors** - Blueprint data is properly serialized
2. **Cleaner codebase** - Removed unused model implementations
3. **Better type safety** - Explicit model types throughout
4. **Simpler UI** - Only 3 focused model options instead of 5
5. **Pro tier support** - Can now access higher quality Sora 2 Pro

## Files Modified

1. `/src/app/console/page.tsx` - Fixed serialization, updated types
2. `/src/app/api/trailer/route.ts` - Simplified models, fixed generation logic
3. `/src/components/TrailerModelSelector.tsx` - Updated UI for 3 models

All changes are backward compatible with existing trailer data.




