# Trailer Model Selection Feature

## Overview
Added the ability to regenerate trailers using different AI video models with a sleek UI below the trailer video player.

## Supported Models

### 1. **Sora 2** (OpenAI) - Default
- Duration: 12 seconds
- Quality: Premium
- Best for: Highest quality cinematic results
- Badge: "Best"

### 2. **VEO 3.1** (Google)
- Duration: 8 seconds
- Quality: High
- Best for: Fast, reliable generation, good for quick iterations

### 3. **Minimax Video-01**
- Duration: 6 seconds
- Quality: High
- Best for: Excellent motion and dynamic camera movements

### 4. **Kling**
- Duration: 5 seconds
- Quality: Good
- Best for: Fast generation, concept testing

### 5. **Runway Gen-3**
- Duration: 10 seconds
- Quality: High
- Best for: Creative studio standard with artistic control

## User Experience

### Location
The model selector appears below the trailer video player in the console, but only when a trailer has been generated.

### Features
- **Current Model Display**: Shows which model was used for the current trailer
- **Expandable Interface**: "Show/Hide Options" button to reveal model selection
- **Visual Selection**: Beautiful card-based UI with radio buttons
- **Model Info**: Each option displays duration, quality level, and description
- **Smart Badges**: "Best" badge for Sora 2, "Current" badge for active model
- **One-Click Regeneration**: Select a model and click "Regenerate with [Model]"

### UI/UX Details
- Dark theme matching the console aesthetic
- Smooth animations and transitions
- Loading states during generation
- Disabled state when generation is in progress
- Clear visual feedback for selected model
- Icons for each model (Crown for Sora, Zap for VEO, etc.)

## Technical Implementation

### API Changes (`/src/app/api/trailer/route.ts`)
- Added `model` parameter to request body type
- Created separate generation functions:
  - `generateWithSora()` - OpenAI Sora 2
  - `generateWithVeo()` - Google VEO 3.1
  - `generateWithMinimax()` - Minimax Video-01
  - `generateWithKling()` - Kling video model
  - `generateWithRunway()` - Runway Gen-3
- Supports explicit model selection or 'auto' mode (default Sora → VEO fallback)
- All models use the same trailer prompt and character grid

### Component (`/src/components/TrailerModelSelector.tsx`)
- Standalone React component
- Props:
  - `currentModel`: String indicating which model was used
  - `onRegenerate`: Callback function that receives selected model
  - `isLoading`: Boolean for loading state
  - `disabled`: Boolean to disable interactions
- Fully responsive design
- Expandable/collapsible interface

### Console Integration (`/src/app/console/page.tsx`)
- Updated `generateTrailer()` to accept optional model parameter
- Added TrailerModelSelector component below trailer video
- Passes model parameter to API request
- Only shows selector when trailer exists

## Usage

1. Generate a trailer using the normal flow (auto mode with Sora 2)
2. Below the video player, you'll see the current model info
3. Click "Show Options" to expand the model selector
4. Select a different model from the list
5. Click "Regenerate with [Model Name]"
6. Wait 5-10 minutes for the new trailer

## Notes
- Generation takes 5-10 minutes regardless of model
- Each model has different duration capabilities
- The character grid is used as reference for all models
- Model selection is preserved in the show's state
- Background task tracking works with all models



