# Background Tasks UI Indicator

## Overview

A sleek, floating indicator panel that shows all active background generation tasks in real-time. Appears in the bottom-right corner when tasks are running.

## Visual Design

### Minimized State
```
┌─────────────────────────┐
│ ⚫⚫⚫  2 Active Tasks  ▼ X│
└─────────────────────────┘
```

### Expanded State
```
┌─────────────────────────────────┐
│ ⚫⚫⚫  3 Active Tasks       ▲ X │
├─────────────────────────────────┤
│ 🖼️ Portrait: Alice        🔄  │
│ ▓▓▓▓▓▓░░░░░░ 75%             │
│ processing • 1m 23s            │
│                                 │
│ 🎬 Video: Bob             🔄  │
│ ▓▓░░░░░░░░░░ 25%              │
│ starting • 0m 12s              │
│                                 │
│ 📺 Trailer                🔄  │
│ ▓▓▓▓▓▓▓▓▓░░░ 85%             │
│ processing • 2m 45s            │
└─────────────────────────────────┘
```

## Features

### ✅ Auto-Show/Hide
- **Appears** automatically when tasks start
- **Disappears** automatically when all tasks complete
- **Can manually hide** - will reappear when new tasks start

### ✅ Minimize/Expand
- Click **▼** to collapse (shows just count)
- Click **▲** to expand (shows all task details)
- Persistent during session

### ✅ Real-Time Updates
- Polls task list every 2 seconds
- Updates status, elapsed time automatically
- Shows progress bar animation
- Smooth transitions

### ✅ Task Information

**Each Task Shows:**
- **Icon** - Different icon per task type (Portrait, Video, Trailer)
- **Label** - Task type + character name (e.g., "Portrait: Alice")
- **Spinner** - Animated loading indicator
- **Elapsed Time** - How long it's been running (e.g., "2m 34s")
- **Status** - "starting", "processing" (with color coding)
- **Progress Bar** - Animated visual indicator

## Task Types & Icons

| Type | Icon | Example Label |
|------|------|---------------|
| portrait | 🖼️ Image | Portrait: Alice |
| video | 🎬 Video | Video: Bob |
| trailer | 📺 Film | Trailer |
| library-poster | 🖼️ Image | Poster |
| portrait-grid | 🖼️ Image | Character Grid |

## Component Props

```typescript
<BackgroundTasksIndicator 
  showId={currentShowId}  // Filter tasks by show
  onTaskUpdate={callback}  // Optional callback when tasks update
/>
```

## Styling

### Position
- **Fixed** bottom-right corner
- **Z-index 40** - Above content, below modals
- **6rem offset** from edges
- **Responsive width** - 320px expanded, 192px minimized

### Colors & Effects
- **Background:** Black/95 with backdrop blur
- **Border:** White/10 semi-transparent
- **Shadow:** Deep 3D shadow for floating effect
- **Animations:** Pulsing dots, rotating spinner, smooth expand/collapse

### Status Colors
- **Pulsing dots:** Primary color (red)
- **Progress bar:** Primary gradient
- **Spinner:** Primary/60
- **Text:** Foreground with opacity variants

## Code Structure

### Component Location
`src/components/BackgroundTasksIndicator.tsx`

### State Management
```typescript
const [tasks, setTasks] = useState<BackgroundTask[]>([]);
const [isMinimized, setIsMinimized] = useState(false);
const [isHidden, setIsHidden] = useState(false);
```

### Update Loop
```typescript
useEffect(() => {
  const updateTasks = () => {
    const activeTasks = getShowTasks(showId).filter(
      t => t.status === 'starting' || t.status === 'processing'
    );
    setTasks(activeTasks);
    
    if (activeTasks.length === 0) {
      setIsHidden(true); // Auto-hide when done
    }
  };

  updateTasks();
  const interval = setInterval(updateTasks, 2000);
  return () => clearInterval(interval);
}, [showId]);
```

### Helper Functions
- `getTaskIcon(type)` - Returns appropriate icon for task type
- `getTaskLabel(task)` - Formats display label with character name
- `getElapsedTime(startedAt)` - Calculates and formats elapsed time

## Integration

### Added to Page
```typescript
// In src/app/page.tsx (line 6586)
<BackgroundTasksIndicator showId={currentShowId} />
```

### Task Metadata
Updated task creation to include character names:
```typescript
addBackgroundTask({
  id: jobId,
  type: 'portrait',
  showId: currentShowId,
  characterId,
  status: 'starting',
  metadata: {
    characterName: 'Alice', // Now included!
  },
});
```

## User Experience

### Normal Flow
1. User clicks "Generate Portrait" for Alice
2. ✨ Indicator slides in bottom-right: "1 Active Task"
3. 📊 Shows: "Portrait: Alice • 0m 05s • starting"
4. Progress bar animates
5. Status updates: "processing"
6. ~60 seconds later, portrait completes
7. ✅ Indicator updates: "0 Active Tasks"
8. 💨 Indicator fades out after 1 second

### Multi-Task Flow
1. User generates 5 portraits simultaneously
2. ✨ Indicator shows: "5 Active Tasks"
3. Each task listed with name and progress
4. Tasks complete one by one
5. Count decreases: "4 Active", "3 Active"...
6. Last one completes → auto-hides

### Navigation Flow
1. User starts generating 3 portraits
2. Navigates to Library
3. Indicator persists (still tracking)
4. Comes back to show
5. ✅ Indicator still there, showing progress
6. Tasks complete, auto-hides

## Controls

- **▼/▲ Button** - Minimize/Expand
- **X Button** - Hide (will reappear on new tasks)
- **Click outside** - No action (stays visible)

## Responsive Behavior

- **Desktop:** 320px width (expanded), 192px (minimized)
- **Mobile:** Same width, positioned well
- **Max height:** 400px with scroll if many tasks
- **Smooth transitions:** All state changes animated

## Console Integration

Tasks shown in indicator also log to console:
```
📝 Created background task for portrait: Alice (job: abc-123)
📊 Portrait Alice status: processing
✅ Portrait Alice completed: https://...
```

## Benefits

✅ **Visibility** - Always know what's running
✅ **Peace of Mind** - Can navigate freely, tasks continue
✅ **No Guessing** - Clear status and elapsed time
✅ **Clean UI** - Minimizes when not needed
✅ **Per-Show** - Only shows tasks for current show
✅ **Real-Time** - Updates every 2 seconds
✅ **Beautiful** - Smooth animations and professional styling

## Files

**New:**
- ✅ `src/components/BackgroundTasksIndicator.tsx` - Main component
- ✅ `BACKGROUND_TASKS_UI.md` - This documentation

**Modified:**
- ✅ `src/app/page.tsx` - Added component, character names in metadata

All done! The background tasks indicator is now live and working! 🎉




