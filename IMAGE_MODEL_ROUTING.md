# Image Model Routing - GPT Image vs FLUX

## Overview

The Settings panel now actually controls which image model is used for portraits and posters. Users can switch between GPT Image 1 and FLUX 1.1 Pro.

## How It Works

### Settings Panel
1. User clicks **Settings** button (Sliders icon)
2. Selects **Image Model**: GPT Image 1 or FLUX 1.1 Pro
3. Selection is stored in `imageModel` state
4. All future image generations use the selected model

### Model Options

#### GPT Image 1 (Default)
- **Model:** `openai/gpt-image-1`
- **Best for:** Following detailed prompts, consistent results
- **Settings:**
  - Quality: high
  - Aspect ratio: Configurable (1:1 for portraits, 9:16 for posters)
  - Moderation: low
  - Can use reference images (`input_images`)

#### FLUX 1.1 Pro
- **Model:** `black-forest-labs/flux-1.1-pro`
- **Best for:** Stylized art, artistic interpretation, faster generation
- **Settings:**
  - Output format: webp
  - Output quality: 95
  - Safety tolerance: 2
  - Image-to-image mode for posters

## Implementation

### Frontend (`src/app/page.tsx`)

**State:**
```typescript
const [imageModel, setImageModel] = useState<ImageModelId>("gpt-image");
```

**Passed to APIs:**
```typescript
// Portrait generation (line 4758)
body: JSON.stringify({
  show: blueprint,
  character: characterWithPrompt,
  customPrompt: customPrompt || undefined,
  jobId,
  imageModel, // ← Now included
})

// Library poster generation (line 6180)
body: JSON.stringify({
  prompt: promptToUse,
  characterImageUrl: portraitGridUrl,
  showData: blueprint,
  imageModel, // ← Now included
})
```

### Portrait API (`src/app/api/characters/portrait/route.ts`)

**Type Definition:**
```typescript
type PortraitBody = {
  show: unknown;
  character: unknown;
  customPrompt?: string;
  jobId?: string;
  imageModel?: "gpt-image" | "flux"; // ← Added
};
```

**Model Selection (lines 64, 172-198):**
```typescript
const selectedModel = body.imageModel || "gpt-image"; // Default to GPT Image

// Later in generateAsync:
if (selectedModel === "flux") {
  // Use FLUX for portrait
  console.log("🎨 Using FLUX 1.1 Pro for portrait");
  result = await replicate.run("black-forest-labs/flux-1.1-pro", {
    input: {
      prompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 95,
      safety_tolerance: 2,
    },
  });
} else {
  // Use GPT Image for portrait
  console.log("🎨 Using GPT Image 1 for portrait");
  result = await replicate.run("openai/gpt-image-1", {
    input: {
      prompt,
      quality: "high",
      aspect_ratio: "1:1",
      background: "auto",
      number_of_images: 1,
      moderation: "low",
      openai_api_key: process.env.OPENAI_API_KEY,
    },
  });
}
```

### Library Poster API (`src/app/api/library-poster/route.ts`)

**Type Definition:**
```typescript
type RequestBody = {
  prompt: string;
  characterImageUrl: string;
  imageModel?: "gpt-image" | "flux"; // ← Added
  showData?: { ... };
};
```

**Model Selection (lines 82, 127-156):**
```typescript
const selectedModel = imageModel || "flux"; // Default to FLUX

// Later:
if (selectedModel === "gpt-image") {
  console.log("🎨 Using GPT Image 1 for library poster");
  result = await replicate.run("openai/gpt-image-1", {
    input: {
      prompt: posterPrompt,
      quality: "high",
      aspect_ratio: "9:16",
      input_images: [characterImageUrl], // Reference image
      input_fidelity: "high",
      number_of_images: 1,
      moderation: "low",
      openai_api_key: process.env.OPENAI_API_KEY,
    },
  });
} else {
  console.log("🎨 Using FLUX 1.1 Pro for library poster");
  result = await replicate.run("black-forest-labs/flux-1.1-pro", {
    input: {
      prompt: posterPrompt,
      image: characterImageUrl,
      prompt_strength: 0.85,
      aspect_ratio: "9:16",
      output_format: "webp",
      output_quality: 95,
      safety_tolerance: 2,
    },
  });
}
```

## Console Logs

You'll now see which model is being used:

### GPT Image Selected:
```
🎨 Generating 1:1 character portrait...
Selected image model: gpt-image
🎨 Using GPT Image 1 for portrait
```

### FLUX Selected:
```
🎨 Generating 1:1 character portrait...
Selected image model: flux
🎨 Using FLUX 1.1 Pro for portrait
```

## Defaults

- **Portraits:** GPT Image 1 (better prompt following)
- **Posters:** FLUX (was hardcoded, now respects setting but defaults to FLUX)

## Testing

1. Open Settings (Sliders icon in header)
2. Change Image Model to "FLUX 1.1 Pro"
3. Generate a portrait
4. Check console - should see: `🎨 Using FLUX 1.1 Pro for portrait`
5. Change to "GPT Image 1"
6. Generate another portrait
7. Check console - should see: `🎨 Using GPT Image 1 for portrait`

## Files Modified

- ✅ `src/app/page.tsx` - Pass imageModel to APIs
- ✅ `src/app/api/characters/portrait/route.ts` - Model routing logic
- ✅ `src/app/api/library-poster/route.ts` - Model routing logic

The model selector now actually works! Try changing it in Settings and watch the console to see which model is used. 🎨

