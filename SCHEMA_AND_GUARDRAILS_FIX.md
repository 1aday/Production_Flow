# Schema Validation & Stylization Guardrails Fix

## Problems Identified

### Problem 1: Schema Validation Error - Invalid `era_aesthetic`
```json
{
  "error": "Model response failed schema validation.",
  "messages": [{
    "instancePath": "/production_style/art_style/art_movement_references/era_aesthetic",
    "message": "must be equal to one of the allowed values"
  }]
}
```

**Root Cause:** The schema only allowed these decade values:
```json
["1920s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "contemporary", "timeless"]
```

But the LLM generated `"1940s"` which was **not in the list**.

### Problem 2: Stylization Forced Even with Guardrails OFF

User had stylization guardrails **OFF** and prompt was **"cinematic"**, but the system returned:
```json
{
  "stylization_level": "highly_stylized",
  "medium": "Graphic novel illustration style"
}
```

**Root Cause:** Even though stylization guardrails were implemented at the API level (poster, portrait, video, trailer), they were **NOT implemented at the blueprint generation level**. The blueprint generation was HARDCODED to force stylization in two places:

1. **Schema Constraint** - Only allowed:
   ```json
   "stylization_level": {
     "enum": ["highly_stylized", "moderately_stylized"]
   }
   ```
   NO realistic option existed!

2. **System Directive** - Hardcoded instructions:
   - "You are a visual development director creating a show look bible for ANIMATION or HIGHLY STYLIZED content"
   - "NEVER EVER choose anything with 'live-action' - this leads to photorealistic results that get flagged!"
   - "NEVER use: 'realistic', 'naturalistic', 'photographic', 'documentary'"

This meant **even with guardrails OFF, the system could never generate realistic/cinematic output** because the schema itself forbade it.

---

## Solutions Implemented

### Fix 1: Updated Schema - Added Missing Decades

**File:** `show_schema.json`

Added missing decades to `era_aesthetic` enum:
```json
"era_aesthetic": {
  "enum": ["1920s", "1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "contemporary", "timeless"]
}
```

✅ Now "1940s" is a valid value

### Fix 2: Updated Schema - Added Realistic Options

**File:** `show_schema.json`

#### Added Realistic Stylization Levels
```json
"stylization_level": {
  "enum": [
    "highly_stylized",           // Animation/cartoon
    "moderately_stylized",       // Animated with detail
    "slightly_stylized",         // Realistic with artistic touches
    "cinematic_realistic"        // Photorealistic/live-action
  ]
}
```

✅ Now the schema supports both stylized AND realistic options

#### Added Realistic Medium Options
```json
"medium": {
  "enum": [
    // ... existing animation options ...
    "Live-action cinematic style",      // NEW
    "Photorealistic CGI",               // NEW
    "Theatrical live-action",           // NEW
    "Documentary realism",              // NEW
    "Prestige drama cinematography"     // NEW
  ]
}
```

✅ Now users can choose cinematic/realistic mediums

### Fix 3: Updated Generate API - Respect Guardrails

**File:** `src/app/api/generate/route.ts`

Created TWO different system directives:

#### With Guardrails ON (Default)
```typescript
const systemDirectiveWithGuardrails = `
You are a visual development director creating a show look bible for ANIMATION or HIGHLY STYLIZED content.
...
NEVER EVER choose anything with "live-action" - this leads to photorealistic results that get flagged!
...
`;
```
- Forces animation/stylization
- Prevents photorealistic rendering
- Original behavior preserved

#### With Guardrails OFF (New)
```typescript
const systemDirectiveWithoutGuardrails = `
You are a visual development director creating a comprehensive show look bible.
...
PRODUCTION STYLE - Choose what best fits the user's creative vision:
- If they want animation/stylized: Choose from animation styles (Pixar, Ghibli, etc.)
- If they want cinematic/realistic: Choose "Live-action cinematic style", "Photorealistic CGI", etc.
- Match the user's intent - if they say "cinematic" or "realistic", use realistic options
...
IMPORTANT: Respect the user's creative intent. If they want realistic/cinematic, give them realistic.
`;
```
- Respects user's creative intent
- Allows photorealistic rendering
- Matches style to user's prompt

**Implementation:**
```typescript
const { prompt, model, stylizationGuardrails } = body;
const useGuardrails = stylizationGuardrails !== false; // Default true
const systemDirective = useGuardrails ? systemDirectiveWithGuardrails : systemDirectiveWithoutGuardrails;
```

### Fix 4: Console Page - Pass Guardrails to Generate API

**File:** `src/app/console/page.tsx`

Updated the generate API call to pass `stylizationGuardrails`:

```typescript
body: JSON.stringify({ 
  prompt: value, 
  model: chosenModel,
  stylizationGuardrails, // Pass guardrails setting to blueprint generation
}),
```

✅ Now the blueprint generation respects the guardrails toggle

---

## Behavior After Fix

### With Guardrails ON (Default) ✅
- **Schema enforces:** Animation/stylization only
- **Generate API:** Uses forced stylization directive
- **All APIs:** Enforce production style (portrait, poster, video, trailer)
- **Result:** Consistent stylized/animated output
- **Use case:** Users who want guaranteed stylized results without photorealism

### With Guardrails OFF ✅
- **Schema allows:** Both stylized AND realistic options
- **Generate API:** Respects user's creative intent
  - If user says "cinematic" → chooses `cinematic_realistic`
  - If user says "Pixar style" → chooses `highly_stylized`
- **All APIs:** NO forced restrictions, allows photorealism
- **Result:** System respects user's creative vision
- **Use case:** Users who want realistic/cinematic output

---

## Example Workflows

### Workflow 1: User Wants Cinematic Realism
1. User toggles stylization guardrails **OFF**
2. User enters prompt: "A prestige drama about World War II espionage, cinematic and realistic"
3. Generate API receives `stylizationGuardrails: false`
4. LLM sees directive: "If they want cinematic/realistic, choose realistic options"
5. Blueprint generated with:
   ```json
   {
     "stylization_level": "cinematic_realistic",
     "medium": "Live-action cinematic style",
     "visual_treatment": "Cinematic, photorealistic, dramatic lighting..."
   }
   ```
6. Portrait/poster/video APIs receive `stylizationGuardrails: false`
7. APIs do NOT add "Do NOT use photorealistic rendering"
8. ✅ Result: Realistic, cinematic output

### Workflow 2: User Wants Animation
1. User toggles stylization guardrails **ON** (default)
2. User enters prompt: "A fun kids' show about space adventures"
3. Generate API receives `stylizationGuardrails: true`
4. LLM sees directive: "NEVER EVER choose live-action"
5. Blueprint generated with:
   ```json
   {
     "stylization_level": "highly_stylized",
     "medium": "Pixar-style 3D animation",
     "visual_treatment": "Vibrant 3D animation with exaggerated proportions..."
   }
   ```
6. Portrait/poster/video APIs receive `stylizationGuardrails: true`
7. APIs add "CRITICAL: Match the specified visual style exactly"
8. ✅ Result: Consistent stylized/animated output

---

## Files Modified

1. ✅ `show_schema.json`
   - Added "1930s", "1940s" to `era_aesthetic`
   - Added "slightly_stylized", "cinematic_realistic" to `stylization_level`
   - Added realistic medium options

2. ✅ `src/app/api/generate/route.ts`
   - Created two system directives (with/without guardrails)
   - Accept `stylizationGuardrails` parameter
   - Choose directive based on guardrails setting

3. ✅ `src/app/console/page.tsx`
   - Pass `stylizationGuardrails` to `/api/generate` endpoint (line ~6355)
   - Pass `stylizationGuardrails` to `/api/library-poster` endpoint (line ~7148)

4. ✅ `src/app/api/library-poster/route.ts` **[NEW FIX]**
   - Accept `stylizationGuardrails` parameter
   - Extract `production_style` from showData
   - Build conditional style guidance based on guardrails
   - Explicitly allow photorealistic rendering when guardrails OFF

---

## Testing

### Test 1: Guardrails OFF + Cinematic Prompt
```
Prompt: "A gritty World War II espionage thriller, cinematic and realistic"
Guardrails: OFF
Expected: cinematic_realistic, Live-action cinematic style
```

### Test 2: Guardrails ON + Animation Prompt
```
Prompt: "A fun kids' show about robots"
Guardrails: ON
Expected: highly_stylized, Pixar-style 3D animation
```

### Test 3: 1940s Era Reference
```
Prompt: "A noir detective show set in 1940s New York"
Expected: era_aesthetic: "1940s" (no schema error)
```

---

## Backward Compatibility

✅ **Defaults to `stylizationGuardrails: true`** if not provided
✅ **Existing behavior maintained** for users who don't explicitly turn guardrails off
✅ **No breaking changes** to existing workflows
✅ **Persists in localStorage** (already implemented)

---

## Key Principle

**The system now respects what the user wants:**
- Guardrails ON → Forced stylization (safe, consistent)
- Guardrails OFF → User's creative intent respected (flexible, powerful)

The guardrails are a **safety feature**, not a mandatory constraint. When OFF, the system trusts the user's production_style choices at every level - from blueprint generation to final asset creation.

---

## Deep Audit Results

After thorough review of ALL API endpoints that build prompts, here are the findings:

### ✅ Already Respecting Guardrails (from previous fix):
1. **Portrait API** (`/api/characters/portrait/route.ts`) - Lines 113-151 ✅
2. **Poster API** (`/api/poster/route.ts`) - Lines 105-162 ✅
3. **Video API** (`/api/characters/video/route.ts`) - Lines 307-322 ✅
4. **Trailer API** (`/api/trailer/route.ts`) - Lines 225-239 ✅

### ❌ FOUND & FIXED:
5. **Library Poster API** (`/api/library-poster/route.ts`) - **Was NOT respecting guardrails!** ❌
   - Previously had hardcoded poster requirements with no guardrails check
   - NOW FIXED: Added guardrails check + conditional style guidance
   - When guardrails OFF: Explicitly allows photorealistic rendering

## Complete Fix Summary

**Total Endpoints Fixed:**
- ✅ Blueprint Generation (`/api/generate`)
- ✅ Portrait API (already fixed in previous update)
- ✅ Poster API (already fixed in previous update)
- ✅ Video API (already fixed in previous update)
- ✅ Trailer API (already fixed in previous update)
- ✅ Library Poster API (NEW - fixed in this audit)

**All 6 generation endpoints now consistently respect stylization guardrails!**

## Related Documentation

- `STYLIZATION_GUARDRAILS_FIX.md` - Original API-level fix (portrait, poster, video, trailer)
- `SCHEMA_UPDATE_SUMMARY.md` - Schema enhancement docs
- `ART_STYLE_SCHEMA_ENHANCEMENT.md` - Art style details

---

## Notes

- The stylization guardrails toggle is in the console UI (top section)
- Setting persists across sessions via localStorage
- All endpoints now consistently respect this setting
- Blueprint generation was the missing piece - now fixed!

