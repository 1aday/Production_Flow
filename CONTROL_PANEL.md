# ⚙️ Control Panel - Prompt Editor

## ✅ NO DATABASE CHANGES NEEDED!

Your database already has all the prompt columns:
- ✅ `original_prompt`
- ✅ `custom_portrait_prompts` (JSONB)
- ✅ `custom_video_prompts` (JSONB)
- ✅ `custom_poster_prompt`
- ✅ `custom_trailer_prompt`

**You're ready to use the Control Panel immediately!**

---

## 🎨 What I Built:

### **1. Beautiful Control Panel Page** (`/control-panel?show=[id]`)

**Features:**
- ✨ Stunning dark UI matching your app's aesthetic
- 📝 Edit ALL prompts in one place
- 💾 Real-time save detection ("Unsaved changes" badge)
- 🔄 Reset/clear individual prompts
- 📊 Organized by section (Show, Poster, Trailer, Characters)

**Sections:**

**A. Original Show Prompt**
- The initial prompt that created the show
- Full editing capability
- Clear button to reset

**B. Custom Poster Prompt**
- Override default poster generation
- Leave empty = use default
- Clear button

**C. Custom Trailer Prompt**
- Override default trailer generation
- Leave empty = use default
- Clear button

**D. Character Prompts** (per character)
- Portrait prompt for each character
- Video prompt for each character
- Shows character name and ID
- Individual reset buttons
- Grid layout (2 columns on desktop)

---

## 🎯 How to Access:

### **Option 1: From Main Page**
When you have a show loaded:
1. Click **⚙️ Prompts** button in header
2. Opens control panel for current show

### **Option 2: From Library**
On each show card:
1. Hover over the card
2. Click **⚙️ Settings** icon (top right, blue on hover)
3. Opens control panel for that show

### **Option 3: Direct URL**
Navigate to:
```
/control-panel?show=show-1762964726870-7mohy4esj
```

---

## 💾 How Saving Works:

**Auto-Detection:**
- Edit any prompt → "Unsaved changes" badge appears
- **Save All** button activates (glows red)

**Save All Button:**
- Saves ALL prompts to Supabase at once
- Updates `updated_at` timestamp
- Shows "Saving..." state
- Success = badge disappears

**Database Update:**
```sql
UPDATE shows SET
  original_prompt = '...',
  custom_portrait_prompts = '{"char-1": "..."}',
  custom_video_prompts = '{"char-2": "..."}',
  custom_poster_prompt = '...',
  custom_trailer_prompt = '...',
  updated_at = NOW()
WHERE id = 'show-123';
```

---

## 🎨 UI/UX Features:

### **Visual Design:**
- 🌑 Dark theme with red accents
- 💳 Card-based layout
- 🔲 Rounded corners and subtle shadows
- ✨ Smooth transitions
- 📱 Responsive (mobile → desktop)

### **User Experience:**
- ⚡ Real-time change detection
- 🎯 Clear visual hierarchy
- 🔄 Individual reset buttons
- 💾 Sticky save button (always visible at bottom)
- 🏷️ Icons for each section type
- 📊 Character count badge

### **Smart Interactions:**
- Click character card = expands prompts
- Edit prompt = marks as changed
- Clear button = removes custom prompt
- Save = persists to Supabase
- Back arrow = returns to main/library

---

## 🚀 Usage Example:

**Scenario**: You want to make a character more dramatic

1. **Open Control Panel**
   - Click ⚙️ Prompts button (or Settings icon in library)

2. **Find the Character**
   - Scroll to character cards
   - Find "John Smith"

3. **Edit Portrait Prompt**
   - Type: "Make the portrait more dramatic with intense shadows and a brooding expression"
   - "Unsaved changes" badge appears

4. **Save**
   - Click "Save All Changes" button
   - Prompts save to database

5. **Regenerate**
   - Go back to main page
   - Click "Re-generate Portrait" for that character
   - Uses your custom prompt automatically!

---

## 📊 What Gets Saved:

```typescript
{
  originalPrompt: "Create a hotel comedy show...",
  
  customPortraitPrompts: {
    "john-smith": "More dramatic lighting...",
    "jane-doe": "Softer expression..."
  },
  
  customVideoPrompts: {
    "john-smith": "Show him laughing..."
  },
  
  customPosterPrompt: "Add more drama to composition...",
  
  customTrailerPrompt: "Focus on comedic moments..."
}
```

---

## ✅ Ready to Use!

**No database changes needed** - Just restart your server:

```bash
rm -rf .next && npm run dev
```

Then:
1. Load a show
2. Click **⚙️ Prompts** button
3. Edit prompts
4. Save!

All changes persist forever in Supabase! 🎉

---

## 🎯 Button Locations:

**Main Page Header:**
```
[New Show] [⚙️ Prompts] [🔗 Share] [📚 Library] [Model Selector]
```

**Library Cards** (on hover):
```
Top right corner:
[⚙️ Settings] [🔗 Share] [🗑️ Delete]
```

Everything is connected and ready! 🚀

