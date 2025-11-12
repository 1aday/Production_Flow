# 🎬 Trailer System - Issues & Fixes Needed

## 🐛 CURRENT ISSUES:

### 1. **Trailer Auto-Generation Not Working**
- Effect exists at line 5230
- Dependencies might be preventing trigger
- Need better logging

### 2. **Status Indicator Not Showing Properly**
- Doesn't show which model is being used
- Doesn't show fallback information clearly
- Loading state not visible

### 3. **Manual Button Not Working**
- Generate button might not be calling function correctly

---

## ✨ FEATURES TO ADD:

### 1. **Trailer Model Selector**
```
┌─────────────────────────────────────┐
│ Trailer Generation Model:          │
│ ○ Sora 2 (Recommended) - 12 sec    │
│ ○ VEO 3.1 - 8 sec                  │
└─────────────────────────────────────┘
```

- Default: Sora 2
- Can switch before generation starts
- Disabled during generation
- Remembered per show

### 2. **Better Status Display**
```
🎬 Trailer Generation
━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: Processing with Sora 2
Model: Sora 2 (12 seconds)
Elapsed: 2:45

[If fallback happens:]
⚠️ Sora 2 flagged content, trying VEO 3.1...
Status: Processing with VEO 3.1
Model: VEO 3.1 (8 seconds, fallback)
Elapsed: 3:12
```

### 3. **Regenerate Poster Button**
In Overview tab, below poster image:
```
[Re-generate Poster]
  └─ (click to expand)
      ┌─────────────────────────────┐
      │ Custom Prompt (optional):   │
      │ [textarea]                  │
      │ [Generate] [Cancel]         │
      └─────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION PLAN:

### Step 1: Fix Trailer Auto-Generation
Add logging to see why it's not triggering:
```typescript
useEffect(() => {
  console.log("🎬 Trailer auto-gen check:", {
    hasBlueprint: !!blueprint,
    hasGrid: !!portraitGridUrl,
    hasTrailer: !!trailerUrl,
    isLoading: trailerLoading,
    hasError: !!trailerError,
    digestMatch: trailerDigestRef.current === portraitGridUrl,
  });
  
  if (!blueprint) return;
  if (!portraitGridUrl) return;
  if (trailerUrl || trailerLoading || trailerError) return;
  if (!posterAvailable) return;
  if (trailerDigestRef.current === portraitGridUrl) return;
  
  console.log("✅ All conditions met - auto-generating trailer");
  void generateTrailer();
}, [...]);
```

### Step 2: Add Model Selector State
Already added:
```typescript
const [trailerModelPreference, setTrailerModelPreference] = useState<"sora-2" | "veo-3.1">("sora-2");
```

### Step 3: Update generateTrailer to Use Preference
Pass model preference to API

### Step 4: Add Trailer Model UI
Radio buttons to select model before generation

### Step 5: Improve Status Display
Show current model, fallback status, elapsed time prominently

### Step 6: Add Regenerate Poster Button
Similar to regenerate portrait - expandable with custom prompt

---

## ⚠️ CIRCULAR DEPENDENCY ISSUE FIXED

Removed `saveCurrentShow` from `generateCharacterPortrait` dependencies to prevent:
```
Block-scoped variable 'saveCurrentShow' used before its declaration
```

---

**Want me to implement all these fixes now?** This will be a comprehensive update to the trailer system.

Say "yes" and I'll implement everything! 🚀

