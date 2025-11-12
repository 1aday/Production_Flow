# 🔄 Edit & Retry UI - Current Status

## ✅ ALREADY IMPLEMENTED (Working):

### **1. Character Portraits** ✅
- Yellow/amber error card
- Shows error message
- Expandable `<details>` for prompt editing
- Pre-populates default prompt on first expand
- Retry button in expanded section
- **Location**: Character cards in Characters tab

### **2. Character Videos** ✅  
- Similar pattern to portraits
- Edit prompt + retry
- **Location**: Character dossier video section

### **3. Trailer** ✅
- Error card with expandable edit section
- Pre-populates prompt for E005 errors
- Retry button
- **Location**: Trailer tab (lines 2827-2856)

---

## ❌ MISSING (Need to Add):

### **4. Show Poster** ❌
**Currently**: Just shows error text
**Need**: Expandable edit + retry interface

### **5. Portrait Grid** ❌  
**Currently**: Shows error (portraitGridError)
**Need**: Button to regenerate with option to skip failed portraits

### **6. Library Poster** ❌
**Currently**: Silent fail (no error shown)
**Need**: Error display + retry option

### **7. Show Generation** ❌
**Currently**: Red error banner, no retry
**Need**: Edit prompt + regenerate button

### **8. Character Extraction** ❌
**Currently**: Error message, no retry
**Need**: Edit prompt + try again

---

## 🎨 CONSISTENT PATTERN TO USE:

```tsx
{error ? (
  <div className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
    <p className="text-xs font-semibold text-amber-200">[Feature] needs attention</p>
    <p className="text-xs text-amber-200/80 break-words leading-relaxed">{error}</p>
    
    <details className="group mt-3">
      <summary className="cursor-pointer text-xs font-medium text-amber-200/80 hover:text-amber-200 underline decoration-dotted">
        Edit prompt & retry →
      </summary>
      <div className="mt-3 space-y-2">
        <Textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          placeholder="Customize prompt..."
          className="min-h-[120px] resize-y rounded-xl bg-black/60 text-xs border-white/15"
        />
        <div className="flex gap-2">
          <Button onClick={retry} className="flex-1">
            Retry Generation
          </Button>
          <Button variant="ghost" onClick={clearPrompt}>
            Clear
          </Button>
        </div>
      </div>
    </details>
  </div>
) : null}
```

---

## 🎯 IMPLEMENTATION PRIORITY:

### **High Priority** (User-facing, common):
1. ✅ Portraits - DONE
2. ✅ Videos - DONE  
3. ✅ Trailer - DONE
4. ❌ **Show Poster** - ADD NOW
5. ❌ **Portrait Grid** - ADD NOW

### **Medium Priority** (Less common failures):
6. ❌ Library Poster
7. ❌ Show Generation
8. ❌ Character Extraction

---

## 📝 WHAT I'LL IMPLEMENT:

For **NEAT** implementation, I'll:

1. **Keep existing working patterns** (Portraits, Videos, Trailer)
2. **Add matching UI for Poster errors**
3. **Add Portrait Grid retry** with "skip failed" option
4. **Add Library Poster error display** (currently silent)
5. **Make all styling consistent** - same colors, same spacing, same interaction

**All will use:**
- Amber warning color scheme
- Expandable `<details>` pattern
- Pre-populated prompts where appropriate
- Clear retry buttons
- Consistent spacing/typography

---

**Ready to implement? This will add 3-4 new retry interfaces in a clean, consistent way.**

