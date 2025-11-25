# Settings Panel - Model Configuration

## Overview

Created a centralized settings panel where users can configure which AI models to use for different generation tasks. Accessed via a "Settings" button in the header with a clean popup/lightbox interface.

## Features

### Settings Button
- **Location:** Header navigation bar
- **Icon:** Sliders icon (replaced the old model selector)
- **Action:** Opens modal dialog with all model settings

### Model Categories

#### 1. Blueprint Model
**Purpose:** Generating show bibles and character documents

**Options:**
- **GPT-5** - High-reasoning structured output
- **GPT-4o** - Fast JSON mode responses

**Default:** GPT-4o

#### 2. Image Model
**Purpose:** Character portraits, posters, and all static images

**Options:**
- **GPT Image 1** - OpenAI's image model, high quality, follows prompts well
- **FLUX 1.1 Pro** - Fast, excellent for stylized art and character consistency

**Default:** GPT Image 1

**Note:** Currently both APIs use their respective models. Future implementation will route based on this setting.

#### 3. Video Generation Model
**Purpose:** Character videos and trailers

**Options:**
- **Sora 2** - Fast, good quality, 12s max
- **Sora 2 Pro** - Higher fidelity, 12s max
- **VEO 3.1** - Google's model, different style, 8s max

**Default:** Sora 2

**Note:** Trailer generation already has fallback logic (Sora 2 → VEO 3.1). This setting will control primary preference.

## UI Design

### Dialog Layout
```
┌─────────────────────────────────────┐
│ Model Settings                  [X] │
│ Configure which AI models to use... │
├─────────────────────────────────────┤
│                                     │
│ ┌─ Blueprint Model ──────────────┐ │
│ │ Used for show bibles...        │ │
│ │                                 │ │
│ │ [●] GPT-5                       │ │
│ │     High-reasoning...           │ │
│ │                                 │ │
│ │ [ ] GPT-4o                      │ │
│ │     Fast JSON...                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Image Model ──────────────────┐ │
│ │ Used for portraits, posters... │ │
│ │                                 │ │
│ │ [●] GPT Image 1                 │ │
│ │     OpenAI's image model...     │ │
│ │                                 │ │
│ │ [ ] FLUX 1.1 Pro                │ │
│ │     Fast, excellent for...      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Video Generation Model ───────┐ │
│ │ Used for videos and trailers   │ │
│ │                                 │ │
│ │ [●] Sora 2                      │ │
│ │     Fast, good quality...       │ │
│ │                                 │ │
│ │ [ ] Sora 2 Pro                  │ │
│ │     Higher fidelity...          │ │
│ │                                 │ │
│ │ [ ] VEO 3.1                     │ │
│ │     Google's model...           │ │
│ └─────────────────────────────────┘ │
│                                     │
│                          [Done]     │
└─────────────────────────────────────┘
```

### Visual States
- **Selected:** Primary border + primary background tint + filled dot indicator
- **Unselected:** White/10 border + black/20 background + no indicator
- **Hover:** White/20 border

### Interaction
- Click any option to select it immediately
- Changes apply in real-time (no "Save" needed)
- Click "Done" or press Escape to close
- Click backdrop to close

## Code Structure

### New Components

**`src/components/ui/dialog.tsx`**
- Dialog wrapper component
- DialogContent with backdrop and close button
- DialogHeader, DialogTitle, DialogDescription
- Keyboard support (Escape to close)
- Click outside to close

### State Management

**New State Variables:**
```typescript
const [imageModel, setImageModel] = useState<ImageModelId>("gpt-image");
const [videoGenModel, setVideoGenModel] = useState<VideoGenerationModelId>("sora-2");
const [showSettingsDialog, setShowSettingsDialog] = useState(false);
```

**New Types:**
```typescript
type ImageModelId = "gpt-image" | "flux";
type VideoGenerationModelId = "sora-2" | "sora-2-pro" | "veo-3.1";
```

### Files Modified

1. **`src/app/page.tsx`**
   - Added Dialog import
   - Added new model types and options
   - Added state for settings dialog and model selections
   - Added Settings button in header
   - Added Settings Dialog component
   - Changed "Prompts" icon from Settings to FileText

2. **`src/components/ui/dialog.tsx`** (New)
   - Full dialog component implementation

## Integration Points

### Current
- Blueprint model: ✅ Already wired up
- Settings UI: ✅ Fully functional

### Future Implementation Needed

#### Image Model Selection
When generating portraits/posters, check `imageModel` state and route to:
```typescript
if (imageModel === "flux") {
  // Use FLUX 1.1 Pro API
  await replicate.run("black-forest-labs/flux-1.1-pro", {...});
} else {
  // Use GPT Image 1 API
  await replicate.run("openai/gpt-image-1", {...});
}
```

**Files to update:**
- `src/app/api/characters/portrait/route.ts`
- `src/app/api/library-poster/route.ts`
- `src/app/api/poster/route.ts` (if used)

#### Video Model Selection
When generating videos/trailers, check `videoGenModel` state:
```typescript
let primaryModel = videoGenModel; // "sora-2", "sora-2-pro", or "veo-3.1"
// Use this as the first attempt before fallbacks
```

**Files to update:**
- `src/app/api/characters/video/route.ts`
- `src/app/api/trailer/route.ts`

## Benefits

✅ **Centralized Configuration** - All model settings in one place
✅ **Easy Access** - One click from header to open settings
✅ **Clear Organization** - Grouped by purpose (blueprint, images, videos)
✅ **Visual Feedback** - Clear selected state with primary color highlights
✅ **Flexible** - Easy to add more models or categories in the future
✅ **Persistent** - State persists during session (future: localStorage)

## Future Enhancements

1. **Persistence** - Save selections to localStorage or user preferences
2. **Model Routing** - Wire up image and video model selection in APIs
3. **Cost Information** - Show pricing info for each model
4. **Performance Metrics** - Track and display average generation times
5. **Advanced Settings** - Model-specific parameters (temperature, quality, etc.)
6. **Presets** - Save/load model configuration presets (Fast, Quality, Balanced)

## Usage

1. Click **Settings** button in header (Sliders icon)
2. Select preferred model for each category
3. Changes apply immediately
4. Click **Done** or press **Escape** to close
5. Selected models will be used for all future generations

The settings panel is now ready for use! Model routing logic can be implemented incrementally as needed.




