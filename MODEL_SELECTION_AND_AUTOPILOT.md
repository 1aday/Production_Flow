# Model Selection & Autopilot Mode Implementation

## Overview
Added comprehensive model selection controls and autopilot mode to the home page, giving users full control over which AI models to use for generation and whether to auto-generate assets or manually control each stage.

## Features Implemented

### 1. **Image Model Selector (Home Page)**
- **Location**: Home page prompt input section
- **Models Available**:
  - GPT Image 1 (OpenAI's high quality model)
  - FLUX 1.1 Pro (Fast, excellent for stylized art)
  - Nano Banana Pro (Google's fast 2K output)
- **Usage**: Used for character portraits, posters, and all static images
- **Persistence**: Selection saved to localStorage as `production-flow.image-model`

### 2. **Video Model Selector (Home Page)**
- **Location**: Home page prompt input section
- **Models Available**:
  - Sora 2 (Fast, good quality)
  - Sora 2 Pro (High quality, slower)
  - Veo 3.1 (Google's video model)
- **Usage**: Used for character videos and trailers
- **Persistence**: Selection saved to localStorage as `production-flow.video-model`

### 3. **Autopilot Mode Toggle**
- **Location**: Home page prompt input section
- **Modes**:
  - **ON**: Auto-generate all assets sequentially
    - Blueprint → Character Seeds → Dossiers → Portraits → Portrait Grid → Library Poster → Trailer
    - Everything happens automatically once you submit the initial prompt
  - **OFF**: Manual control at each stage
    - User gets a button at each stage to start the next step
    - Allows for review and editing between stages
- **Persistence**: Selection saved to localStorage as `production-flow.autopilot-mode`

### 4. **Settings Sync with Console**
- Console page automatically reads all settings from localStorage
- No need to reconfigure settings when moving between pages
- Settings persist across browser sessions

## UI Design

### Compact Layout
- Settings organized in a clean 2-column grid
- Toggle buttons with visual indicators (colored dots)
- Model selection cards with:
  - Model name
  - Brief description
  - Active state indicator (primary border + dot)
  - Hover effects for better UX

### Visual Indicators
- **Active Toggle**: Primary color border + filled dot
- **Inactive Toggle**: Subtle border + hollow dot
- **Selected Model**: Primary border with shadow glow + dot indicator
- **Unselected Model**: Subtle border on dark background

## Technical Implementation

### State Management
```typescript
// Home Page State
const [imageModel, setImageModel] = useState<ImageModelId>("gpt-image");
const [videoModel, setVideoModel] = useState<VideoModelId>("sora-2");
const [autopilotMode, setAutopilotMode] = useState(false);
```

### Auto-Generation Logic (Console)
Modified the following useEffect hooks to respect `autopilotMode`:

1. **Portrait Generation**: Only auto-generates when autopilotMode is ON and dossiers are complete
2. **Portrait Grid**: Only auto-generates when autopilotMode is ON and 4+ portraits are ready
3. **Library Poster**: Only auto-generates when autopilotMode is ON and portrait grid is ready
4. **Trailer**: Only auto-generates when autopilotMode is ON and library poster is ready

### Storage Keys
- `production-flow.image-model` - Selected image generation model
- `production-flow.video-model` - Selected video generation model
- `production-flow.autopilot-mode` - Autopilot enabled/disabled state
- `production-flow.stylization-guardrails` - Stylization mode (existing)

## User Flow

### With Autopilot ON:
1. User enters prompt on home page
2. Selects desired image and video models
3. Enables autopilot mode
4. Clicks "Generate Show Bible"
5. System automatically generates everything in sequence
6. User can monitor progress via the Production Pipeline panel

### With Autopilot OFF:
1. User enters prompt on home page
2. Selects desired image and video models
3. Keeps autopilot mode off
4. Clicks "Generate Show Bible"
5. Blueprint is generated
6. User reviews blueprint, then clicks button to generate character seeds
7. User reviews seeds, then clicks button to build dossiers
8. User reviews dossiers, then clicks button to generate portraits
9. And so on... (manual control at each stage)

## Console Logs
All auto-generation actions now include `[AUTOPILOT]` prefix in console logs for easy debugging:
- `🎨 [AUTOPILOT] Auto-generating portrait for: CharacterName`
- `[AUTOPILOT] Generating portrait grid with N portraits`
- `✅ [AUTOPILOT] Portrait grid generated`
- `🎨 [AUTOPILOT] Portrait grid ready! Auto-generating library poster...`
- `✅ [AUTOPILOT] All conditions met - auto-generating trailer`

## Benefits

### For Users
- **Full Control**: Choose exactly which AI models to use for different asset types
- **Flexibility**: Switch between hands-off (autopilot) and hands-on (manual) workflows
- **Consistency**: Settings persist across sessions and pages
- **Visibility**: Clear visual feedback on what's selected and what mode is active

### For Development
- **Clean Separation**: Autopilot logic clearly separated from manual triggers
- **Easy Debugging**: Console logs identify autopilot actions
- **Maintainable**: Centralized settings management via localStorage
- **Extensible**: Easy to add new models or settings in the future

## Files Modified
- `/src/app/page.tsx` - Added model selectors and autopilot toggle
- `/src/app/console/page.tsx` - Updated to read settings and respect autopilot mode

## Next Steps (Optional Enhancements)
- Add tooltips explaining each model's strengths
- Add estimated generation time/cost for each model
- Add "advanced settings" panel for fine-tuning parameters
- Add model comparison view
- Add preset workflows (e.g., "Fast Draft", "High Quality", "Experimental")


