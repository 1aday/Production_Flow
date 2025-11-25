# Stylization Guardrails Fix

## Problem

The system was **forcing non-cinematic/stylized output even when stylization guardrails were turned OFF**. The `stylizationGuardrails` toggle existed in the UI but wasn't being respected by the API endpoints.

### Root Cause (Multi-Layered Issue)

1. The `stylizationGuardrails` parameter was **not being passed** from the console page to API endpoints
2. API routes had **hardcoded style restrictions** that were always applied regardless of user preference
3. Instructions like "DO NOT use photorealistic rendering" were being added to all prompts unconditionally
4. **DEEPER ISSUE**: Even with guardrails OFF, the `show` JSON (which contains `production_style`) was being included in prompts, and the schema only allows non-photorealistic styles (Pixar, Anime, Claymation, etc.). The model would see these stylization preferences and generate cartoonish content even without explicit restrictions.

## Solution

### Changes Made

#### 1. Console Page (`src/app/console/page.tsx`)

Added `stylizationGuardrails` parameter to all API calls:

- **Portrait API** - Line ~5177
- **Poster API** - Line ~5724
- **Video API** - Line ~5570
- **Trailer API** - Line ~5992

```typescript
// Now passing guardrails to all endpoints
body: JSON.stringify({
  // ... other params
  stylizationGuardrails, // Pass guardrails setting
})
```

#### 2. Portrait API (`src/app/api/characters/portrait/route.ts`)

**Before:** Always enforced stylization with hardcoded rules
```typescript
"CRITICAL RULES:",
"- DO NOT use photorealistic rendering",
"- DO NOT create a photo-like realistic image", 
"- MUST match the specified visual style (animation style OR cinematic/theatrical treatment)",
```

**After (First Fix):** Respects user preference
```typescript
if (stylizationGuardrails && productionStyle) {
  // Guardrails ON: Enforce the production style
  styleHeader = [...enforcement rules...]
} else if (stylizationGuardrails) {
  // Guardrails ON but no production style: Basic reminder
  styleHeader = [...basic stylization...]
} else {
  // Guardrails OFF: No style restrictions
  styleHeader = [`Character portrait for "${showTitle}"`, ""];
}
```

**After (Deeper Fix):** Adds explicit photorealistic override when guardrails OFF
```typescript
} else {
  // Guardrails OFF: ENABLE photorealistic rendering
  styleHeader = [
    `Character portrait for "${showTitle}"`,
    "",
    "RENDERING APPROACH:",
    "- Photorealistic rendering is ALLOWED and ENCOURAGED if desired",
    "- Realistic, naturalistic, photographic styles are ALLOWED",
    "- Live-action appearance is ALLOWED",
    "- You may render in ANY style - realistic, stylized, animated, or illustrated",
    "",
  ];
}
```

**Why the deeper fix?** Even with guardrails OFF, the show JSON (containing `production_style.medium: "Pixar-style 3D animation"`) was being included in prompts. The model would see this and generate cartoonish content. The explicit override tells the model to IGNORE those production_style preferences and allow photorealistic rendering.

#### 3. Poster API (`src/app/api/poster/route.ts`)

**Before:** Always added "DO NOT use photorealistic rendering"

**After:** Conditionally applies style restrictions:
- **Guardrails ON + Production Style**: Full style enforcement with medium, references, treatment
- **Guardrails ON (no style)**: Basic theatrical/stylized reminder
- **Guardrails OFF**: Title requirements + explicit photorealistic override language to counteract the production_style in the show JSON

#### 4. Video API (`src/app/api/characters/video/route.ts`)

**Before:** Always added style guidance with "Do NOT use photorealistic rendering"

**After:** Conditionally applies style guidance OR photorealistic override
```typescript
const styleGuidance = stylizationGuardrails && productionStyle ? [
  "VISUAL STYLE (CRITICAL - Match exactly):",
  `Medium: ${productionStyle.medium}`,
  // ... etc
] : [
  "RENDERING APPROACH:",
  "- Photorealistic rendering is ALLOWED and ENCOURAGED if desired",
  "- Realistic, naturalistic, photographic styles are ALLOWED",
  // ... etc
];
```

#### 5. Trailer API (`src/app/api/trailer/route.ts`)

**Before:** Always added "Do NOT use photorealistic or realistic rendering"

**After:** Conditionally enforces style OR adds photorealistic override
```typescript
const styleGuidance = stylizationGuardrails && productionStyle ? `
VISUAL STYLE (CRITICAL - Follow exactly):
Medium: ${productionStyle.medium}
References: ${(productionStyle.cinematic_references || []).join(', ')}
Treatment: ${productionStyle.visual_treatment}
IMPORTANT: Match this exact visual style.` : `
RENDERING APPROACH:
- Photorealistic rendering is ALLOWED and ENCOURAGED if desired
- Realistic, naturalistic, photographic styles are ALLOWED
- Live-action appearance is ALLOWED`;
```

## Behavior

### With Guardrails ON (Default)
- ✅ Enforces production style (medium, references, treatment)
- ✅ Adds critical style rules
- ✅ Prevents photorealistic rendering when style specifies animation/stylization
- ✅ Matches show's visual aesthetic exactly

### With Guardrails OFF
- ✅ **NO forced style restrictions**
- ✅ **NO "do not use photorealistic" instructions**
- ✅ Model generates based on production_style naturally
- ✅ **If user wants realistic, they get realistic**
- ✅ **If user wants stylized, they get stylized**
- ✅ Respects user's creative intent

## Key Principle

**The system now respects what the user wants:**
- If they want realistic → do realistic
- If they want stylized → do stylized  
- If they want animation → do animation
- If they want live-action → do live-action

The guardrails are a **safety feature**, not a mandatory constraint. When OFF, the system:
1. Removes restrictive prompts
2. **Adds explicit photorealistic override language** to counteract the animation/stylization preferences baked into the show's `production_style` object
3. Trusts the user's creative intent

### Why the Override Language is Needed

Even with guardrails OFF, the show JSON (which contains `production_style.medium: "Pixar-style 3D animation"` or similar) is included in prompts for context. Without explicit override language, the model would still see these stylization preferences and generate cartoonish content. The override tells the model: "Ignore those style constraints, photorealistic is allowed."

## Files Modified

1. ✅ `/src/app/console/page.tsx` - Pass guardrails to API calls
2. ✅ `/src/app/api/characters/portrait/route.ts` - Conditional style enforcement
3. ✅ `/src/app/api/poster/route.ts` - Conditional style enforcement
4. ✅ `/src/app/api/characters/video/route.ts` - Conditional style enforcement
5. ✅ `/src/app/api/trailer/route.ts` - Conditional style enforcement

## Testing

To verify the fix:

1. **Turn Guardrails OFF** (click the toggle in console)
2. Generate a show with `production_style.medium` set to something realistic
3. Generate portraits, posters, videos, trailers
4. **Result:** Should respect the production style without forced stylization

## Backward Compatibility

- Defaults to `stylizationGuardrails = true` if not provided
- Existing behavior maintained for users who don't explicitly turn it off
- No breaking changes to existing workflows

## Notes

- The `stylizationGuardrails` state persists in localStorage
- All API endpoints now consistently respect this setting
- Production style information is still passed in the show JSON for context, but explicit photorealistic override language is added when guardrails are OFF
- Title requirements for posters are kept regardless of guardrails (important UX feature)
- The override language counteracts the animation/stylization bias in the show's `production_style` object

## Future Improvement Option

For maximum flexibility, the system could be enhanced to:
1. Add photorealistic options to the `production_style.medium` enum in the schema
2. Allow users to specify photorealistic styles directly in show generation
3. Currently, all shows are forced to choose animation/stylized styles due to schema constraints

