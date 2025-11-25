# 🔧 CRITICAL FIXES NEEDED

## 🐛 ISSUE 1: Library Poster Not Generating

**Problem**: "Show poster" section says it will auto-generate but doesn't

**Root Cause**: Likely the `libraryPosterUrl` dependency issue

**Debug Steps Added:**
```
🎨 Portrait completed!
   libraryPosterUrl exists? false
   Will trigger library poster generation? true
✅ Triggering library poster generation in 1.5s...
🎬 Calling saveCurrentShow(true) for library poster
💾 Save params: { forceLibraryPoster: true, ... }
📝 Can generate library poster? true
🎬 Force-generating library poster...
   Blueprint show_title: "Actual Title"
   Blueprint being sent: { show_title: "...", ... }
```

**Action**: Check console logs on next portrait generation to see where it stops!

---

## 🐛 ISSUE 2: Trailer Restarts on Navigation

**Problem**: 
1. User starts trailer generation
2. Navigates to library
3. Comes back
4. Trailer restarts from beginning (loses progress!)

**Root Cause**: The `generateTrailer` function is being called again

**Current "Resume" Logic**:
- ✅ Polling resumes (works)
- ❌ But function might be called again
- ❌ Might create duplicate job

**Why This Happens:**
```typescript
useEffect(() => {
  // This effect runs when component mounts
  if (conditions met) {
    void generateTrailer(); // ← CALLED AGAIN!
  }
}, [dependencies]);
```

---

## ✅ SOLUTION: Background Task System

**I've created**: `src/lib/background-tasks.ts`

**Features:**
- ✅ Persistent task tracking (localStorage)
- ✅ Prevents duplicate jobs
- ✅ Tracks all task types
- ✅ Auto-expires old tasks (30 min)
- ✅ Show-specific task queries

**Next Steps:**

### **1. Update generateTrailer to use task system**
```typescript
const generateTrailer = async () => {
  // Check for existing task FIRST
  const existingTask = getShowTasks(currentShowId)
    .find(t => t.type === 'trailer');
  
  if (existingTask && existingTask.status === 'processing') {
    console.log("⏸️ Trailer task already in progress, skipping");
    return; // Don't restart!
  }
  
  // Create task
  const task = addBackgroundTask({
    id: jobId,
    type: 'trailer',
    showId: currentShowId,
    status: 'starting',
  });
  
  // ... rest of generation
}
```

### **2. Create Background Task Indicator UI**
Subtle bottom-right corner indicator:
```
┌─────────────────────────────────┐
│ 🔄 2 tasks running              │
│                                  │
│ ⚡ Trailer (2:34)                │
│ 🎨 Library Poster (0:45)         │
└─────────────────────────────────┘
```

Features:
- Floats bottom-right
- Minimizable
- Shows all active tasks
- Click to see details
- Persists across pages

### **3. Update ALL Generation Functions**
- Trailer ✅
- Library Poster
- Portrait Grid
- Individual Portraits (batch)
- Videos

---

## 🎯 IMMEDIATE FIXES:

### **Fix 1: Prevent Trailer Restart**
```typescript
const generateTrailer = async () => {
  // ADD THIS CHECK FIRST:
  const existing = getBackgroundTask(trailerJobId);
  if (existing?.status === 'processing') {
    console.log("Already generating, resuming polling only");
    startTrailerStatusPolling(existing.id);
    return; // DON'T restart!
  }
  
  // Rest of code...
}
```

### **Fix 2: Library Poster Debug**
Already added comprehensive logging - check console!

---

## 📊 WHAT YOU'LL SEE:

**After implementing:**

```
Bottom-right corner:
┌──────────────────┐
│ ⚡ 1 Active Task │
│                   │
│ 🎬 Trailer       │
│ ⏱️  2:34          │
│ Status: Sora 2    │
└──────────────────┘
```

Navigate anywhere → Task continues → Come back → Still running!

---

## 🚀 IMMEDIATE ACTION:

**RESTART SERVER FIRST:**
```bash
rm -rf .next && npm run dev
```

**Then:**
1. Generate a show
2. Generate first portrait
3. **Watch console** for library poster logs
4. Tell me where it stops!

For trailer issue, I need to implement the full background task integration (will take more changes).

**Want me to implement the full background task system now?** 

Or focus on fixing the immediate library poster issue first?




