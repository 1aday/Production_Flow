# Library Poster Prompt Editing with Style Guide

## Features Implemented

### 1. ✅ Pre-filled Prompt with Style Guide
**Feature:** Textarea automatically fills with default prompt including full style guide when user clicks to edit.

**How it works:**
- When user focuses the textarea (clicks in it), if it's empty, it auto-fills with:
  - Style guide header (production medium, visual references, stylization level)
  - Critical rules about avoiding photorealism
  - Show logline
- User can then edit any part of the prompt
- Uses `font-mono` for better readability of structured prompt

### 2. ✅ Style Guide Integration
**Feature:** Library poster prompt includes same style guide structure as character portraits.

**Structure:**
```
!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!

Show Title: "Show Name"
Production Medium: Stylized cinematic
Visual References: Reference1 + Reference2
Stylization Level: moderately stylized

Style Treatment: Cinematic theatrical style

CRITICAL RULES:
- DO NOT use photorealistic rendering
- MUST match the specified visual style exactly
- Use artistic/stylized interpretation, NOT documentary realism
- The title should be prominently displayed with bold theatrical typography

---

[Show logline goes here]
```

### 3. ✅ API Update
**Feature:** API now accepts full `prompt` field instead of just `logline`.

**Changes:**
- New field: `prompt` (primary)
- Legacy support: `logline` (fallback)
- API uses the full prompt directly with additional Netflix-style poster requirements

## Code Changes

### Frontend (`src/app/page.tsx`)

**New Function - Build Default Prompt (lines 5657-5695):**
```typescript
const buildDefaultLibraryPosterPrompt = useCallback(() => {
  if (!blueprint) return "";
  
  const showTitle = blueprint.show_title || "Untitled Show";
  const logline = blueprint.show_logline || "";
  const productionStyle = blueprint.production_style;
  
  const styleHeader = productionStyle ? [
    "!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!",
    "",
    `Show Title: "${showTitle}"`,
    `Production Medium: ${productionStyle.medium || 'Stylized cinematic'}`,
    // ... full style guide ...
  ].join("\n") : [
    "!! CRITICAL - DO NOT CREATE PHOTOREALISTIC IMAGE !!",
    // ... simplified version ...
  ].join("\n");
  
  return `${styleHeader}${logline}`;
}, [blueprint]);
```

**Updated Textarea with Auto-fill (lines 1527-1578):**
```typescript
<Textarea
  value={editedLibraryPosterPrompt}
  onChange={(e) => setEditedLibraryPosterPrompt(e.target.value)}
  onFocus={(e) => {
    // Pre-fill with default prompt on first focus if empty
    if (!e.target.value && blueprint) {
      const defaultPrompt = /* build prompt inline */;
      setEditedLibraryPosterPrompt(defaultPrompt);
    }
  }}
  placeholder="Click to load default prompt with style guide, then edit as needed..."
  className="min-h-[120px] resize-none rounded-2xl border-white/10 bg-black/40 text-sm font-mono"
/>
<p className="text-xs text-foreground/50">
  Includes style guide from your show bible. Edit to customize the poster.
</p>
```

**Updated Generation Call (line 5729):**
```typescript
body: JSON.stringify({
  prompt: promptToUse, // Send full prompt with style guide
  characterImageUrl: portraitGridUrl,
  showData: blueprint,
})
```

### Backend (`src/app/api/library-poster/route.ts`)

**Updated Type Definition:**
```typescript
type RequestBody = {
  prompt: string; // Full prompt with style guide
  characterImageUrl: string;
  showData?: { /* ... */ };
  logline?: string; // Legacy support
};
```

**Updated Handler:**
```typescript
const { prompt, logline, characterImageUrl, showData } = body;

// Use prompt if provided, otherwise fall back to logline (legacy)
const userPrompt = prompt || logline;

const posterPrompt = `${userPrompt}

Netflix-style movie poster requirements:
- Modern streaming service aesthetic with bold typography
- Character-focused composition with moody atmospheric background
// ... additional requirements ...
`;
```

## User Experience

### Initial State (No Poster)
1. Textarea shows placeholder: "Click to load default prompt with style guide, then edit as needed..."
2. User clicks in textarea
3. Textarea auto-fills with full style guide + logline
4. User can edit any part

### With Existing Poster
1. Textarea starts empty (or with previous custom prompt)
2. User clicks in textarea
3. If empty, auto-fills with default prompt
4. User edits as desired
5. Clicks "Re-generate" to create new poster with edited prompt

### Prompt Structure Benefits
- **Consistency:** Same style guide structure as character portraits
- **Visibility:** User can see and edit all style parameters
- **Control:** User can adjust any aspect (style, rules, description)
- **Guidance:** Critical rules ensure proper stylization

## Console Logs

When generating with custom prompt:
```
🎬 GENERATING LIBRARY POSTER
   Custom prompt: YES
   User prompt length: 487
   Character grid image: https://...
   
--- PROMPT PREVIEW (first 500 chars) ---
!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!

Show Title: "My Show"
Production Medium: 2D hand-drawn animation
...
--- END PROMPT PREVIEW ---
```

## Usage Tips

1. **Quick Regenerate:** Leave prompt empty to use default with style guide
2. **Full Control:** Click in textarea to load and edit full prompt
3. **Style Adjustments:** Modify production medium, references, or rules in the prompt
4. **Description Changes:** Edit the logline portion at the bottom of the prompt
5. **Clear to Reset:** Click "Clear" button to remove custom edits and start fresh

## Benefits

✅ Users can now fully control library poster generation
✅ Style guide ensures consistency with show bible
✅ Same prompt structure as character portraits for familiarity
✅ Easy to edit specific aspects without regenerating entire show
✅ Clear visibility into what instructions the AI receives




