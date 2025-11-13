# 📊 POSTER CONSOLIDATION PLAN

## 🎯 GOAL: One Poster System

**Current (Messy)**:
- `posterUrl` - Old hero poster (1024×1792) - NO LONGER USED
- `libraryPosterUrl` - 9:16 Netflix-style poster - THE ONE WE USE

**Target (Clean)**:
- Remove ALL traces of old `posterUrl`
- `libraryPosterUrl` = THE poster (period)
- Simplify everywhere

---

## 🔍 CURRENT STATE ANALYSIS:

### **Database:**
- `poster_url` column - exists but unused
- `library_poster_url` column - actively used ✅

### **Frontend State:**
- `posterUrl` - unused ❌
- `posterLoading` - unused ❌
- `posterError` - unused ❌
- `editedPosterPrompt` - unused ❌
- `libraryPosterUrl` - used ✅
- `libraryPosterLoading` - used ✅

### **Functions:**
- `generatePoster()` - exists but never called ❌
- `generateLibraryPoster()` - actively used ✅

### **UI:**
- `posterSection` - removed ✅
- `libraryPosterSection` - used ✅

---

## ✅ ACTIONS TO TAKE:

### **1. Remove Old State (Frontend)**
```typescript
// DELETE these:
const [posterUrl, setPosterUrl] = useState<string | null>(null);
const [posterLoading, setPosterLoading] = useState(false);
const [posterError, setPosterError] = useState<string | null>(null);
const [editedPosterPrompt, setEditedPosterPrompt] = useState<string>("");
```

### **2. Remove generatePoster Function**
Delete entire function (~100 lines)

### **3. Clean Up Save/Load**
Remove posterUrl from:
- saveCurrentShow
- loadShow  
- SavedShow type
- All save data objects

### **4. Update Completion Tracking**
Remove poster_url check from show-completion.ts

### **5. Database (Optional - Later)**
Could drop `poster_url` column, but not critical

---

## 🎯 SIMPLIFIED FLOW:

**After cleanup:**

```
User creates show
  ↓
Generates characters
  ↓
First portrait completes
  ↓
Auto-generates LIBRARY POSTER (9:16)
  ↓
That's THE show poster (period)
  ↓
Saves to library_poster_url
  ↓
Displays everywhere
```

**No more:**
- ❌ Old poster system
- ❌ Two poster types
- ❌ Confusion
- ❌ "Untitled Series" bugs

**Just:**
- ✅ ONE poster
- ✅ 9:16 format
- ✅ Auto-generates
- ✅ Clean code

---

**Ready to execute? This will clean up ~200 lines of dead code and simplify everything!**

