# Video Model Selection Implementation

## Overview
Added support for users to select which video model to use for generating character videos and trailers, including Google VEO 3.1 with reference image support.

## Features Implemented

### 1. Character Video Model Selection

#### API Support (`src/app/api/characters/video/route.ts`)
- **Added VEO 3.1 Model**: `google/veo-3.1` now available alongside Sora 2 and Sora 2 Pro
- **Reference Image Support**: VEO 3.1 uses the character portrait as a reference image via `reference_images` parameter
- **Flexible Duration**: VEO 3.1 supports 4, 6, and 8-second videos
- **Resolution Options**: VEO 3.1 supports 720p and 1080p resolutions
- **Aspect Ratios**: Both 9:16 (portrait) and 16:9 (landscape) supported

**Model Configuration:**
```typescript
"google/veo-3.1": {
  modelPath: "google/veo-3.1",
  seconds: [4, 6, 8],
  aspectRatios: ["portrait", "landscape"],
  resolutions: ["720p", "1080p"],
  buildInput: ({ prompt, seconds, aspectRatio, portraitUrl, resolution }) => {
    const veoAspectRatio = aspectRatio === "portrait" ? "9:16" : "16:9";
    return {
      prompt,
      duration: seconds,
      aspect_ratio: veoAspectRatio,
      resolution: resolution ?? "1080p",
      generate_audio: true,
      reference_images: [portraitUrl], // Character portrait used as reference
    };
  },
}
```

#### UI Component (`src/components/CharacterVideoModelSelector.tsx`)
- **New Component**: CharacterVideoModelSelector for easy model selection
- **Visual Model Cards**: Shows model details including duration, quality, and description
- **Current Model Display**: Shows which model is currently selected
- **Expandable Interface**: Clean collapsible UI to reduce clutter
- **Mobile Responsive**: Touch-friendly buttons and layout

**Available Models:**
1. **Sora 2 Pro** (Best)
   - Duration: 4-12 seconds
   - Quality: Premium
   - Description: OpenAI's top tier with highest quality

2. **Sora 2**
   - Duration: 4-12 seconds
   - Quality: High
   - Description: OpenAI's standard model, fast and high-quality

3. **VEO 3.1** (New!)
   - Duration: 4-8 seconds
   - Quality: High
   - Description: Google's model with reference image support for great consistency

### 2. Console Page Integration (`src/app/console/page.tsx`)

#### Updated Types:
```typescript
type VideoModelId = "openai/sora-2" | "openai/sora-2-pro" | "google/veo-3.1";
type VideoDuration = 4 | 6 | 8 | 12;
type VideoResolution = "standard" | "high" | "720p" | "1080p";
```

#### Updated Options:
- Added VEO 3.1 to `VIDEO_MODEL_OPTIONS`
- Added 6-second duration option
- Added 720p and 1080p resolution labels
- All existing dropdown selectors now support VEO 3.1

### 3. Trailer Video Model Selection (Already Implemented)

The trailer generation already supports model selection via `TrailerModelSelector` component:
- **Sora 2 Pro**: 12-second premium trailers
- **Sora 2**: 12-second standard trailers
- **VEO 3.1**: 8-second trailers with character grid as reference
- **Auto Mode**: Automatically falls back to VEO 3.1 if Sora flags content

## Environment Setup

Ensure your `.env.local` file has the Replicate API token:

```bash
REPLICATE_API_TOKEN=r8_23y**********************************
```

## How It Works

### Character Videos
1. User generates a character portrait
2. User selects video model (Sora 2, Sora 2 Pro, or VEO 3.1)
3. User configures duration, aspect ratio, and resolution
4. API sends the character portrait as a reference image to the selected model
5. **VEO 3.1 Advantage**: Uses `reference_images` parameter to maintain character consistency

### Trailer Videos
1. User generates character portraits and portrait grid
2. User selects trailer model in the trailer section
3. **VEO 3.1**: Uses the character grid as a reference image
4. **Auto Fallback**: If Sora flags content (E005), automatically falls back to VEO 3.1

## Key Benefits

### VEO 3.1 Reference Images
- **Character Videos**: Portrait image used as reference for consistent character appearance
- **Trailer Videos**: Character grid used as reference to show all characters
- **Better Consistency**: Reference images help maintain visual continuity across generations

### Flexible Model Selection
- Choose based on quality needs (Premium vs High)
- Choose based on duration needs (4-12s)
- Choose based on budget (different models have different costs)
- Choose based on style preferences

### Automatic Fallbacks
- Trailer generation automatically falls back to VEO 3.1 if Sora flags content
- Provides resilience against content moderation issues

## API Schema Example

### Replicate VEO 3.1 Input Schema:
```typescript
{
  prompt: string;              // Text prompt for video generation
  duration: 4 | 6 | 8;        // Video duration in seconds
  aspect_ratio: "16:9" | "9:16"; // Video aspect ratio
  resolution: "720p" | "1080p";  // Resolution
  generate_audio: boolean;       // Whether to generate audio
  reference_images: string[];    // Array of 1-3 reference image URLs
  negative_prompt?: string;      // Optional negative prompt
  seed?: number;                 // Optional random seed
}
```

## Testing

To test VEO 3.1:
1. Generate a show in the console
2. Generate character portraits
3. Go to the "Videos" tab
4. Select "VEO 3.1" from the model dropdown
5. Configure duration (4, 6, or 8 seconds)
6. Select resolution (720p or 1080p)
7. Click "Generate Video" for a character
8. The portrait will be sent as a reference image

## Model Comparison

| Feature | Sora 2 | Sora 2 Pro | VEO 3.1 |
|---------|---------|------------|---------|
| Duration | 4-12s | 4-12s | 4-8s |
| Max Resolution | 720p | 1024p | 1080p |
| Reference Images | ✅ (input_reference) | ✅ (input_reference) | ✅ (reference_images) |
| Quality | High | Premium | High |
| Speed | Fast | Moderate | Fast |
| Audio | ❌ | ❌ | ✅ |
| Provider | OpenAI | OpenAI | Google |

## Files Modified

1. `/src/app/api/characters/video/route.ts` - Added VEO 3.1 support
2. `/src/app/console/page.tsx` - Updated types and options
3. `/src/components/CharacterVideoModelSelector.tsx` - New component (created)
4. `/src/components/TrailerModelSelector.tsx` - Already existed for trailers

## Next Steps

- Monitor VEO 3.1 generation quality and consistency
- Gather user feedback on model preferences
- Consider adding more video models as they become available
- Potentially add model-specific prompt optimization

## Notes

- VEO 3.1 only supports reference images with 16:9 aspect ratio for 8-second durations (per Replicate docs)
- For character videos, we pass the portrait as reference regardless of settings
- Generation times vary by model: typically 5-10 minutes for all models
- All models support async generation with polling for status updates




