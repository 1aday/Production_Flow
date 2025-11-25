# Trailer Prompt Editing Feature

## Overview
Added the ability for users to edit the Sora trailer prompt in a clean, user-friendly way, similar to how poster and portrait prompts can be edited.

## Features Implemented

### 1. ✅ Custom Prompt Support in API
**File:** `src/app/api/trailer/route.ts`

- Added `customPrompt?: string` to `TrailerBody` type
- Updated prompt generation to use custom prompt if provided, otherwise build default
- Custom prompt bypasses all default prompt construction

### 2. ✅ Default Prompt Builder Function
**File:** `src/app/console/page.tsx`

- Created `buildDefaultTrailerPrompt()` function that constructs the full trailer prompt
- Includes:
  - Show title and logline
  - Visual style guide (production medium, references, treatment, stylization)
  - Complete trailer requirements (title card, voiceover, pacing, tone, visuals)
  - All the detailed instructions from the original prompt

### 3. ✅ Auto-fill on Focus
**File:** `src/app/console/page.tsx` (ResultView component)

- Textarea auto-fills with default prompt when user clicks to edit
- Only fills if textarea is empty (doesn't overwrite existing edits)
- Uses `onFocus` handler to detect when user wants to edit

### 4. ✅ Custom Prompt Passing
**File:** `src/app/console/page.tsx`

- Updated `generateTrailer()` to accept `customPrompt` parameter
- Updated API call to include `customPrompt` in request body
- Updated "Retry with custom prompt" button to pass edited prompt
- Updated `onGenerateTrailer` prop signature to accept custom prompt

### 5. ✅ Enhanced UI
**File:** `src/app/console/page.tsx` (ResultView component)

- Increased textarea height (`min-h-[200px]`) for better visibility
- Added `resize-y` class to allow vertical resizing
- Added helpful placeholder text: "Click to load default prompt with style guide, then edit as needed..."
- Added descriptive text below textarea explaining what's included
- Improved styling to match other prompt editing interfaces

## User Flow

1. **User clicks "Edit prompt & retry"** → Expands details section
2. **User clicks in textarea** → Auto-fills with default prompt (if empty)
3. **User edits prompt** → Can modify any part of the prompt
4. **User clicks "Retry with custom prompt"** → Generates trailer with edited prompt
5. **User can clear** → Resets textarea to empty

## Code Changes Summary

### Backend (`src/app/api/trailer/route.ts`)
- Added `customPrompt?: string` to request body type
- Modified prompt construction to use custom prompt if provided
- Wrapped default prompt construction in IIFE for cleaner code

### Frontend (`src/app/console/page.tsx`)
- Added `buildDefaultTrailerPrompt()` callback function
- Updated `generateTrailer()` to accept and pass `customPrompt`
- Updated `ResultView` props to include `buildDefaultTrailerPrompt`
- Enhanced textarea with auto-fill on focus
- Updated button handlers to pass custom prompt
- Improved UI styling and messaging

## Benefits

✅ **User Control**: Users can fine-tune trailer prompts for better results
✅ **Consistency**: Matches the editing pattern used for posters and portraits
✅ **Convenience**: Auto-fills default prompt so users don't start from scratch
✅ **Flexibility**: Users can edit any part of the prompt, from style guide to voiceover instructions
✅ **Better Results**: Custom prompts can help avoid content moderation issues

## Testing Checklist

- ✅ Generate trailer with default prompt (no custom prompt)
- ✅ Click "Edit prompt & retry" → Textarea appears
- ✅ Click in empty textarea → Auto-fills with default prompt
- ✅ Edit prompt → Changes are saved
- ✅ Click "Retry with custom prompt" → Uses edited prompt
- ✅ Click "Clear" → Resets textarea
- ✅ Generate trailer with custom prompt → API receives custom prompt
- ✅ Verify custom prompt is used instead of default in API logs




