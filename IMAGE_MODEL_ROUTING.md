# Image Model Routing - Three Image Generation Options

## Overview

The Settings panel controls which image model is used for portraits and posters. Users can switch between **GPT Image 1**, **FLUX 1.1 Pro**, and **Nano Banana Pro**.

## How It Works

### Settings Panel
1. User clicks **Settings** button (Sliders icon)
2. Selects **Image Model**: GPT Image 1, FLUX 1.1 Pro, or Nano Banana Pro
3. Selection is stored in `imageModel` state
4. All future image generations use the selected model

### Model Options

#### GPT Image 1 (Default)
- **Model:** `openai/gpt-image-1`
- **Best for:** Following detailed prompts, consistent results
- **Settings:**
  - Quality: medium (portraits), medium (posters)
  - Aspect ratio: 1:1 (portraits), 2:3 (posters)
  - Moderation: low
  - Can use reference images (`input_images`)

#### FLUX 1.1 Pro
- **Model:** `black-forest-labs/flux-1.1-pro`
- **Best for:** Stylized art, artistic interpretation, faster generation
- **Settings:**
  - Output format: webp
  - Output quality: 95
  - Safety tolerance: 2
  - Aspect ratio: 1:1 (portraits), 2:3 (posters)
  - Image-to-image mode for posters

#### Nano Banana Pro (NEW)
- **Model:** `google/nano-banana-pro`
- **Best for:** High quality 2K output, fast generation, Google's latest image model
- **Settings:**
  - Resolution: 2K
  - Aspect ratio: 1:1 (portraits), 2:3 (posters)
  - Output format: jpg
  - Safety filter: block_only_high (most permissive)
  - Can use reference images (`image_input`)

## Implementation

### Frontend (`src/app/console/page.tsx`)

**Type Definition:**
```typescript
type ImageModelId = "gpt-image" | "flux" | "nano-banana-pro";
```

**State:**
```typescript
const [imageModel, setImageModel] = useState<ImageModelId>("gpt-image");
```

**Model Options:**
```typescript
const IMAGE_MODEL_OPTIONS = [
  {
    id: "gpt-image",
    label: "GPT Image 1",
    description: "OpenAI's image model, high quality, follows prompts well",
  },
  {
    id: "flux",
    label: "FLUX 1.1 Pro",
    description: "Fast, excellent for stylized art and character consistency",
  },
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    description: "Google's fast image model, high quality 2K output",
  },
];
```

**Passed to APIs:**
```typescript
// Portrait generation
body: JSON.stringify({
  show: blueprint,
  character: characterWithPrompt,
  customPrompt: customPrompt || undefined,
  jobId,
  imageModel, // ← Includes all three options
})

// Library poster generation
body: JSON.stringify({
  prompt: promptToUse,
  characterImageUrl: portraitGridUrl,
  showData: blueprint,
  imageModel, // ← Includes all three options
})

// Hero poster generation
body: JSON.stringify({
  prompt: trimmedPrompt || value.slice(0, 4950),
  characterGridUrl: gridUrl,
  imageModel, // ← Includes all three options
  show: blueprint ? {...} : undefined,
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
  imageModel?: "gpt-image" | "flux" | "nano-banana-pro"; // ← Added nano-banana-pro
};
```

**Model Selection:**
```typescript
const selectedModel = body.imageModel || "gpt-image"; // Default to GPT Image

if (selectedModel === "flux") {
  // Use FLUX for portrait
  console.log("🎨 Using FLUX 1.1 Pro for portrait");
  prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-1.1-pro",
    input: {
      prompt,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 95,
      safety_tolerance: 2,
    },
  });
} else if (selectedModel === "nano-banana-pro") {
  // Use Nano Banana Pro for portrait
  console.log("🎨 Using Nano Banana Pro for portrait");
  prediction = await replicate.predictions.create({
    model: "google/nano-banana-pro",
    input: {
      prompt,
      aspect_ratio: "1:1",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    },
  });
} else {
  // Use GPT Image for portrait
  console.log("🎨 Using GPT Image 1 for portrait");
  // ... GPT Image logic
}
```

### Library Poster API (`src/app/api/library-poster/route.ts`)

**Type Definition:**
```typescript
type RequestBody = {
  prompt: string;
  characterImageUrl: string;
  imageModel?: "gpt-image" | "flux" | "nano-banana-pro"; // ← Added nano-banana-pro
  showData?: { ... };
};
```

**Model Selection:**
```typescript
const selectedModel = imageModel || "gpt-image"; // Default to GPT Image

if (selectedModel === "gpt-image") {
  console.log("🎨 Using GPT Image 1 for library poster");
  result = await replicate.run("openai/gpt-image-1", {
    input: {
      prompt: posterPrompt,
      quality: "medium",
      aspect_ratio: "2:3",
      input_images: [characterImageUrl],
      input_fidelity: "high",
      number_of_images: 1,
      moderation: "low",
      openai_api_key: process.env.OPENAI_API_KEY,
    },
  });
} else if (selectedModel === "nano-banana-pro") {
  console.log("🎨 Using Nano Banana Pro for library poster");
  result = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: posterPrompt,
      image_input: [characterImageUrl],
      aspect_ratio: "2:3",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
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

### Hero Poster API (`src/app/api/poster/route.ts`)

**Type Definition:**
```typescript
type PosterBody = {
  prompt: string;
  characterGridUrl?: string;
  imageModel?: "gpt-image" | "flux" | "nano-banana-pro"; // ← Added nano-banana-pro
  show?: { ... };
};
```

**Model Selection:**
```typescript
const selectedModel = body.imageModel || "gpt-image"; // Default to GPT Image

if (selectedModel === "gpt-image") {
  console.log("🎨 Using GPT Image 1 for poster");
  // ... GPT Image logic with 2:3 aspect ratio
} else if (selectedModel === "nano-banana-pro") {
  console.log("🎨 Using Nano Banana Pro for poster");
  result = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: compositePrompt,
      image_input: body.characterGridUrl ? [body.characterGridUrl] : undefined,
      aspect_ratio: "2:3",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    },
  });
} else {
  console.log("🎨 Using FLUX 1.1 Pro for poster");
  result = await replicate.run("black-forest-labs/flux-1.1-pro", {
    input: {
      prompt: compositePrompt,
      image: body.characterGridUrl,
      prompt_strength: 0.85,
      aspect_ratio: "2:3",
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

### Nano Banana Pro Selected:
```
🎨 Generating 1:1 character portrait...
Selected image model: nano-banana-pro
🎨 Using Nano Banana Pro for portrait
```

## Defaults

All image generation types default to **GPT Image 1**:
- **Portraits:** GPT Image 1 (1:1 aspect ratio)
- **Library Posters:** GPT Image 1 (2:3 aspect ratio)
- **Hero Posters:** GPT Image 1 (2:3 aspect ratio)

## Aspect Ratios

| Image Type | GPT Image | FLUX | Nano Banana Pro |
|------------|-----------|------|-----------------|
| Portraits | 1:1 | 1:1 | 1:1 |
| Library Posters | 2:3 | 9:16 | 2:3 |
| Hero Posters | 2:3 | 2:3 | 2:3 |

## Testing

1. Open Settings (Sliders icon in header)
2. Change Image Model to "Nano Banana Pro"
3. Generate a portrait
4. Check console - should see: `🎨 Using Nano Banana Pro for portrait`
5. Change to "FLUX 1.1 Pro"
6. Generate a poster
7. Check console - should see: `🎨 Using FLUX 1.1 Pro for poster`
8. Change to "GPT Image 1"
9. Generate another image
10. Check console - should see: `🎨 Using GPT Image 1 for...`

## Files Modified

- ✅ `src/app/console/page.tsx` - Added nano-banana-pro option, pass imageModel to all APIs
- ✅ `src/app/api/characters/portrait/route.ts` - Added nano-banana-pro model routing
- ✅ `src/app/api/library-poster/route.ts` - Added nano-banana-pro model routing
- ✅ `src/app/api/poster/route.ts` - Added nano-banana-pro model routing

The model selector now supports three models! Try changing it in Settings and watch the console to see which model is used. 🎨




