# Build Fixes Applied

## Issue 1: Undefined Function Call ✅ FIXED
**Error:** `Cannot find name 'pruneVideoStatusRecords'`  
**File:** `src/app/api/characters/video/route.ts:194`  
**Fix:** Removed the undefined function call - video route doesn't use status tracking

## Issue 2: GPT Image Model 404 Errors ✅ FIXED
**Errors:** 
- `https://api.replicate.com/v1/models/openai/gpt-image-1/versions/latest failed with status 404 Not Found`
- `Request to https://api.replicate.com/v1/predictions/[id] failed with status 404 Not Found`

**Files:** 
- `src/app/api/characters/portrait/route.ts` (creation)
- `src/app/api/characters/portrait/status/route.ts` (polling)

**Root Cause:** The Replicate SDK methods don't work properly with `openai/gpt-image-1` model

### What Was Wrong:

**Portrait Creation (route.ts):**
```typescript
// ❌ This fails - /versions/latest endpoint doesn't exist for gpt-image-1
const modelVersion = await replicate.models.versions.get(
  "openai",
  "gpt-image-1",
  "latest"
);
```

**Status Polling (status/route.ts):**
```typescript
// ❌ This also fails - SDK can't query GPT Image predictions properly
const prediction = await replicate.predictions.get(jobId);
```

### The Fix:

**Portrait Creation:**
```typescript
// ✅ Use direct API for creating predictions
const createResponse = await fetch(
  "https://api.replicate.com/v1/models/openai/gpt-image-1/predictions", 
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: {...} }),
  }
);
```

**Status Polling:**
```typescript
// ✅ Use direct API for polling status too
const statusResponse = await fetch(
  `https://api.replicate.com/v1/predictions/${jobId}`,
  {
    headers: {
      "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
    },
  }
);
```

### Why This Works:
- `openai/gpt-image-1` is a special wrapper model on Replicate that proxies to OpenAI's DALL-E API
- It doesn't have version history like normal Replicate models, so version lookups fail
- The Replicate SDK has compatibility issues with this model for both creation and polling
- Direct REST API calls bypass these SDK issues and work reliably
- Other routes (poster, library-poster) already used this pattern successfully

### Impact:
This was causing **all portrait generation to fail** when using GPT Image model. The creation would fail immediately, or if it succeeded, the status polling would fail with 404 errors, making it impossible to retrieve the generated portraits.

## Build Status: ✅ PASSING

All routes compile successfully:
- 26/26 pages generated
- No TypeScript errors
- No linter errors
- Ready for Vercel deployment

## Environment Variables Required:
- `REPLICATE_API_TOKEN` - For all image/video generation
- `OPENAI_API_KEY` - For GPT Image (DALL-E) and text generation
- `NEXT_PUBLIC_SUPABASE_URL` - Database
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side database access
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-side database access

