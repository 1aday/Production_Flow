# Background Tasks Panel - Full Integration

## Summary of Changes

### ✅ All Generation Types Now Tracked

The background tasks indicator now shows:
- ✅ **Character Portraits** - "Portrait: Alice"
- ✅ **Character Videos** - "Video: Bob"  
- ✅ **Library Poster** - "Show Poster"
- ✅ **Trailer** - "Trailer"

### ✅ Auto-Generate Poster When All Characters Done

**New Logic:**
- Poster now generates automatically AFTER all character portraits are complete
- Checks if every character has a portrait
- Waits for portrait grid to be ready
- Then triggers library poster generation

**Old Behavior:**
- Generated after FIRST portrait completed

**New Behavior:**
- Generates after ALL portraits complete

**Console Logs:**
```
🎨 Portrait completed!
   libraryPosterUrl exists? false
   All portraits complete? true
   Total characters: 7
✅ All portraits done! Triggering library poster generation in 1.5s...
📝 Created background task for library poster
```

or if not all done:
```
🎨 Portrait completed!
   All portraits complete? false
   Total characters: 7
⏳ Waiting for remaining portraits to complete
```

## Integration Points

### 1. Library Poster Tracking (lines 6172-6248)

**When Starting:**
```typescript
const posterTaskId = `library-poster-${Date.now()}`;
if (currentShowId) {
  addBackgroundTask({
    id: posterTaskId,
    type: 'library-poster',
    showId: currentShowId,
    status: 'starting',
    metadata: {
      showTitle: blueprint.show_title || "Untitled Show",
    },
  });
}
```

**On Success:**
```typescript
updateBackgroundTask(posterTaskId, { 
  status: 'succeeded', 
  outputUrl: result.url 
});
setTimeout(() => removeBackgroundTask(posterTaskId), 5000);
```

**On Failure:**
```typescript
updateBackgroundTask(posterTaskId, { 
  status: 'failed', 
  error: errorMessage
});
setTimeout(() => removeBackgroundTask(posterTaskId), 10000);
```

### 2. Trailer Tracking (lines 5357-5483)

**When Starting:**
```typescript
if (currentShowId) {
  addBackgroundTask({
    id: jobId,
    type: 'trailer',
    showId: currentShowId,
    status: 'starting',
    metadata: {
      showTitle: blueprint.show_title || "Untitled Series",
    },
  });
}
```

**On Success:**
```typescript
updateBackgroundTask(jobId, { 
  status: 'succeeded', 
  outputUrl: result.url 
});
setTimeout(() => removeBackgroundTask(jobId), 5000);
```

**On Failure:**
```typescript
updateBackgroundTask(jobId, { 
  status: 'failed', 
  error: message 
});
setTimeout(() => removeBackgroundTask(jobId), 10000);
```

### 3. Smart Poster Auto-Generation (lines 4691-4713)

**Checks:**
1. Portrait just completed
2. Library poster doesn't exist yet
3. **ALL characters have portraits** (new!)
4. Portrait grid exists

**Logic:**
```typescript
const allPortraitsComplete = characterSeeds?.every(seed => 
  characterPortraits[seed.id] || seed.id === characterId
) ?? false;

if (!libraryPosterUrl && allPortraitsComplete && portraitGridUrl) {
  console.log("✅ All portraits done! Triggering library poster generation...");
  // Generate poster
}
```

### 4. Input Box Layout Fix

**Changed:**
- Max width: `max-w-[1600px]` → `max-w-4xl` (~896px)
- Added padding: `pr-80` (320px right padding)
- Reduced size: More compact, professional
- Button: Simplified to just "Send"

**Result:**
- Input box no longer covers tasks indicator
- Clean, focused design
- Plenty of room for tasks panel

## What You'll See

### Scenario: Generate 7 Characters

**Bottom-right panel shows:**
```
┌────────────────────────────────┐
│ ●●●  7 Active Tasks       ▼ ✕ │
├────────────────────────────────┤
│ 🖼️ Portrait: Alice       🔄  │
│ ▓▓▓░░░░░░░░░ 30% • 0m 45s    │
│                                │
│ 🖼️ Portrait: Bob         🔄  │
│ ▓░░░░░░░░░░░ 15% • 0m 23s    │
│                                │
│ 🖼️ Portrait: Carol       🔄  │
│ ▓▓░░░░░░░░░░ 20% • 0m 34s    │
│                                │
│ ... (4 more)                   │
└────────────────────────────────┘
```

**As portraits complete:**
```
Count decreases: 7 → 6 → 5 → 4 → 3 → 2 → 1
```

**When last portrait completes:**
```
┌────────────────────────────────┐
│ ●●●  1 Active Task        ▼ ✕ │
├────────────────────────────────┤
│ 🖼️ Show Poster           🔄  │
│ ▓▓▓▓▓░░░░░░░ 45% • 0m 32s    │
└────────────────────────────────┘
```

**When poster completes:**
```
Panel disappears (all tasks done!)
```

### Scenario: Generate Trailer

**Panel shows:**
```
┌────────────────────────────────┐
│ ●●●  1 Active Task        ▼ ✕ │
├────────────────────────────────┤
│ 📺 Trailer               🔄  │
│ ▓▓▓▓▓▓▓▓▓░░░ 85% • 2m 15s   │
│ processing                     │
└────────────────────────────────┘
```

## Benefits

✅ **Full Visibility** - See ALL generation tasks in one place
✅ **Smart Auto-Gen** - Poster generates after all characters (not just first one)
✅ **Clean Layout** - Input box doesn't cover tasks
✅ **Professional** - Compact, focused design
✅ **Real-Time** - Live updates every 2 seconds

## Files Modified

1. ✅ `src/app/page.tsx`
   - Added background tasks for poster (line 6172)
   - Added background tasks for trailer (line 5357)
   - Updated poster auto-gen logic to wait for ALL characters (line 4696)
   - Made input box more compact (line 6862)

2. ✅ `src/components/BackgroundTasksIndicator.tsx`
   - Better label for library-poster ("Show Poster")
   - Show title metadata support

## Testing

1. **Create a show** with 5 characters
2. **Generate all portraits**
3. **Watch the panel** in bottom-right:
   - Should show "5 Active Tasks"
   - Count decreases as they complete
   - When all done, "Show Poster" task appears
   - Finally disappears when everything is complete

Perfect! Now everything is tracked in the background tasks panel! 🎉

