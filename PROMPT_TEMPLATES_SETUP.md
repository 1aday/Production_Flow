# 📝 Prompt Templates System

## 🎯 What This Does

Saves the actual AI prompt templates (system directives) used to generate each show, so you can:
- ✅ See exactly what instructions were sent to the AI
- ✅ Reproduce shows with the same prompts
- ✅ Version control your prompt engineering
- ✅ A/B test different prompt strategies

---

## 🗄️ Database Schema Addition

### **Option A: Add to Shows Table** (Simpler)

Run this SQL in Supabase:

```sql
-- Add prompt templates to shows table
ALTER TABLE shows ADD COLUMN IF NOT EXISTS prompt_templates JSONB DEFAULT '{}'::jsonb;

-- Add template version for tracking
ALTER TABLE shows ADD COLUMN IF NOT EXISTS template_version TEXT DEFAULT 'v1';
```

The `prompt_templates` field will store:
```json
{
  "show_generation": {
    "system_directive": "You are a visual development director...",
    "timestamp": "2025-11-12T...",
    "model": "gpt-5"
  },
  "character_extraction": {
    "system_directive": "You are the casting director...",
    "timestamp": "2025-11-12T...",
    "model": "gpt-5"
  },
  "character_build": {
    "system_directive": "You are the casting director for an ANIMATED...",
    "timestamp": "2025-11-12T...",
    "model": "gpt-4o"
  },
  "portrait_generation": {
    "base_prompt": "!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!...",
    "timestamp": "2025-11-12T..."
  },
  "video_generation": {
    "base_prompt": "Produce a N-second cinematic showcase...",
    "timestamp": "2025-11-12T..."
  },
  "poster_generation": {
    "base_prompt": "!! VISUAL STYLE - CRITICAL - MUST FOLLOW !!...",
    "timestamp": "2025-11-12T..."
  },
  "trailer_generation": {
    "base_prompt": "Create an iconic teaser trailer...",
    "timestamp": "2025-11-12T..."
  }
}
```

---

### **Option B: Separate Templates Table** (More Scalable)

```sql
-- Create prompt templates table
CREATE TABLE prompt_templates (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- System directives
  show_generation_directive TEXT NOT NULL,
  character_extraction_directive TEXT NOT NULL,
  character_build_directive TEXT NOT NULL,
  
  -- Base prompts
  portrait_generation_prompt TEXT NOT NULL,
  video_generation_prompt TEXT NOT NULL,
  poster_generation_prompt TEXT NOT NULL,
  trailer_generation_prompt TEXT NOT NULL,
  
  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT false
);

-- Link shows to template versions
ALTER TABLE shows ADD COLUMN IF NOT EXISTS template_id TEXT REFERENCES prompt_templates(id);

CREATE INDEX idx_templates_version ON prompt_templates(version);
CREATE INDEX idx_templates_active ON prompt_templates(is_active);
```

---

## 🎯 Recommended Approach: **Option A** (Simpler)

**Pros:**
- ✅ Everything in one table
- ✅ Self-contained per show
- ✅ Easy to implement
- ✅ No joins needed

**Cons:**
- Duplicates templates if unchanged
- Harder to version globally

**For your use case, Option A is better** - each show is independent.

---

## 💻 Implementation

After you run the SQL (Option A), I'll update the code to:

1. **Capture templates when generating**
   - Save system directives
   - Save base prompts
   - Add timestamps

2. **Display in Control Panel**
   - New "Prompt Templates" section
   - Show all templates used
   - Read-only (historical record)
   - Option to copy for debugging

3. **Auto-save with show**
   - Whenever show is saved
   - Templates get captured
   - Stored in `prompt_templates` JSONB field

---

## 📋 What You Need to Do:

**Step 1:** Run the SQL (Option A):

```sql
ALTER TABLE shows ADD COLUMN IF NOT EXISTS prompt_templates JSONB DEFAULT '{}'::jsonb;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS template_version TEXT DEFAULT 'v1';
```

**Step 2:** Tell me "done"

**Step 3:** I'll implement the code

---

## ✨ Control Panel Will Show:

```
⚙️ CONTROL PANEL
━━━━━━━━━━━━━━━━━━━

📝 USER PROMPTS (Editable)
- Original Show Prompt
- Custom Poster Prompt  
- Custom Trailer Prompt
- Character Prompts (per character)

📋 SYSTEM TEMPLATES (View Only)
- Show Generation Directive
- Character Extraction Directive
- Character Build Directive
- Portrait Generation Template
- Video Generation Template
- Poster Generation Template
- Trailer Generation Template

[Copy All Templates] [Export JSON]
```

Ready to add this? Run the SQL above! 🚀

