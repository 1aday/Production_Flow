# Trailer Generation Flow - Analysis

## ✅ Good News: Trailer System is Clean!

Unlike the poster system (which had 3 triggers), the trailer generation has a **clean, single-trigger architecture**.

---

## 📊 Trailer Generation Triggers

### ✅ Single Auto-Generation Trigger (lines 6093-6122)

**Location:** `src/app/console/page.tsx`

```typescript
useEffect(() => {
  const checkConditions = {
    hasBlueprint: !!blueprint,
    hasGrid: !!portraitGridUrl,
    hasTrailer: !!trailerUrl,
    isLoading: trailerLoading,
    hasError: !!trailerError,
    digestMatch: trailerDigestRef.current === portraitGridUrl,
    posterAvailable,
  };
  
  console.log("🎬 Trailer auto-gen check:", checkConditions);
  
  if (!blueprint) return;
  if (!portraitGridUrl) return;
  if (trailerUrl || trailerLoading || trailerError) return; // Don't auto-retry on error!
  if (!posterAvailable) return;
  if (trailerDigestRef.current === portraitGridUrl) return;
  
  console.log("✅ All conditions met - auto-generating trailer");
  void generateTrailer();
}, [
  blueprint,
  portraitGridUrl,
  trailerUrl,
  trailerLoading,
  trailerError,
  posterAvailable,
  generateTrailer,
]);
```

**Triggers when:**
- ✅ Blueprint exists
- ✅ Portrait grid URL is available
- ✅ NO existing trailer (or loading/error)
- ✅ `posterAvailable` is true (Replicate API token present)
- ✅ Digest doesn't match (prevents duplicate generations)

**Guards:**
- Won't regenerate if trailer exists
- Won't retry if error occurred (user must manually retry)
- Won't trigger if already loading
- Won't trigger if digest matches (same grid)

---

### ✅ Multiple Manual Buttons (All call same function)

All manual triggers call `onGenerateTrailer()` which maps to `generateTrailer()`:

1. **Line 1744** - Overview tab button
2. **Line 3155** - Master tab "Generate 12s Trailer" button
3. **Line 3253** - TrailerModelSelector onRegenerate callback

**This is fine!** Multiple UI buttons calling the same function is good architecture.

---

## 🔧 The `generateTrailer()` Function (lines 5700-5980)

### Guards Against Duplicates

```typescript
// Check if there's already a trailer job in progress
if (trailerStatusJobIdRef.current) {
  console.log("⏸️ Trailer generation already in progress, skipping");
  return;
}

// Check localStorage for active job
const savedJob = localStorage.getItem('production-flow.trailer-job');
if (savedJob) {
  const { jobId, startedAt } = JSON.parse(savedJob);
  const elapsed = Date.now() - startedAt;
  if (elapsed < 600000) { // 10 minutes
    console.log("⏸️ Active trailer job detected in localStorage, skipping");
    return;
  }
}
```

**Strong protection against:**
- ✅ Multiple simultaneous generations
- ✅ Re-triggering on page reload
- ✅ User spam-clicking generate button

---

## 🎯 The Correct Flow

```
User creates show
   ↓
Generates character portraits
   ↓
When 4+ portraits ready → AUTO-GENERATES PORTRAIT GRID
   ↓
When portrait grid ready → AUTO-GENERATES TRAILER (once!)
   ↓
Trailer saved to trailerUrl
   ↓
Displays in Master tab and library
```

**Single trigger:** Portrait grid becomes available
**Single generation:** One trailer per show
**No duplicates:** Strong guards in place

---

## ⚠️ Potential Issue: Misleading Dependency

### Problem: `posterAvailable` Variable Name

**Current code (line 6109):**
```typescript
if (!posterAvailable) return;
```

**What it actually checks:**
- Whether `REPLICATE_API_TOKEN` is set
- Set in `/api/generate` route (line 127): `const posterAvailable = Boolean(process.env.REPLICATE_API_TOKEN);`

**Why it's misleading:**
- Named `posterAvailable` but has nothing to do with posters
- Actually means "Replicate API Available"
- Used to gate ALL image/video features:
  - Character portraits
  - Library poster
  - Trailer
  - Character videos

**Should be renamed to:**
- `replicateApiAvailable`
- `imageGenerationAvailable`
- `mediaGenerationEnabled`

---

## 🐛 Potential Issues

### 1. Auto-Generation Might Not Fire

**If you're seeing trailers NOT auto-generating, check:**

```typescript
console.log("🎬 Trailer auto-gen check:", {
  hasBlueprint: !!blueprint,
  hasGrid: !!portraitGridUrl,
  hasTrailer: !!trailerUrl,
  isLoading: trailerLoading,
  hasError: !!trailerError,
  digestMatch: trailerDigestRef.current === portraitGridUrl,
  posterAvailable,
});
```

**Common reasons:**
1. ❌ `posterAvailable` is false (no Replicate token)
2. ❌ `trailerError` exists from previous attempt (blocks auto-retry)
3. ❌ `trailerDigestRef.current === portraitGridUrl` (already generated for this grid)
4. ❌ `trailerLoading` is stuck true (job didn't clean up)

### 2. Error State Blocks Auto-Retry

**Current behavior (line 6108):**
```typescript
if (trailerUrl || trailerLoading || trailerError) return; // Don't auto-retry on error!
```

If trailer generation fails:
- ✅ Error is displayed to user
- ❌ Auto-generation is blocked
- ❌ User must manually clear error and retry

**This is intentional** to prevent infinite retry loops on content policy violations.

---

## 🎬 Trailer Model Selection

The system supports multiple models:
- `sora-2` - OpenAI Sora 2 (12 seconds, recommended)
- `sora-2-pro` - Sora 2 Pro (1080p, high quality)
- `veo-3.1` - Google VEO 3.1 (8 seconds, fallback)
- `auto` - Try Sora 2, fallback to VEO on E005 errors

**Auto-fallback logic (lines 337-357):**
```typescript
// Auto mode: Try Sora 2 first, fallback to VEO 3.1 on E005
try {
  const soraResult = await generateWithSora(trailerPrompt, characterGridUrl, jobId, false);
  if (soraResult) {
    return NextResponse.json({ url: soraResult.url, model: soraResult.model });
  }
} catch (soraError) {
  // Check if E005 - try VEO fallback
  if (soraErrorMsg.includes("E005") || soraErrorMsg.includes("flagged as sensitive")) {
    console.warn("⚠️ Sora flagged content, falling back to VEO 3.1...");
    throw new Error("E005_FALLBACK");
  }
  throw soraError;
}
```

---

## 📝 Recommendations

### ✅ No Major Changes Needed

The trailer system is **well-architected**:
- Single auto-generation trigger ✅
- Strong duplicate prevention ✅
- Clear error handling ✅
- Model selection + fallback ✅

### 🔧 Minor Improvements (Optional)

1. **Rename `posterAvailable` → `replicateApiAvailable`**
   - More accurate name
   - Less confusing
   - Better maintainability

2. **Add Clear Error Button**
   - Currently user must call `onClearTrailer()` to reset error
   - Could add explicit "Clear Error & Retry" button in UI

3. **Better Logging**
   - Add more detailed logs for debugging
   - Track why auto-generation didn't fire

---

## 🆚 Comparison: Poster vs Trailer

| Feature | Poster System | Trailer System |
|---------|---------------|----------------|
| **Auto Triggers** | ~~3~~ → **1** (fixed) | **1** ✅ |
| **Duplicates** | ~~Yes~~ → **No** (fixed) | **No** ✅ |
| **Guards** | ~~Weak~~ → **Strong** (fixed) | **Strong** ✅ |
| **Error Handling** | Good | Good |
| **Manual Retry** | Yes | Yes |
| **Architecture** | ~~Messy~~ → **Clean** (fixed) | **Clean** ✅ |

---

## ✅ Summary

**Trailer generation is GOOD!**

Unlike the poster system (which had multiple triggers causing duplicates), the trailer system has:
- ✅ Single auto-generation trigger
- ✅ Strong duplicate prevention
- ✅ Clean architecture
- ✅ No similar issues to the poster problem

**The only "issue" is:**
- ⚠️ Misleading variable name (`posterAvailable`)
- ⚠️ Error state blocks auto-retry (intentional design)

**No fixes needed** for duplicate generation or wrong triggers. The system works as designed!

