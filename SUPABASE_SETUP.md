# 🚀 Supabase Migration Guide

## ✅ What I've Implemented

All code is ready! I've updated:
- ✅ Supabase client utilities (`src/lib/supabase.ts`)
- ✅ Library API to use Supabase database (`src/app/api/library/route.ts`)
- ✅ Individual show API (`src/app/api/library/[id]/route.ts`)
- ✅ Frontend to track and save ALL essential data
- ✅ Automatic asset uploads to Supabase Storage

## 📊 What Gets Saved Now

### **Core Data**
- Show ID, title, timestamps
- Model used (gpt-5/gpt-4o)
- Blueprint JSON (all visual aesthetics)
- Raw JSON response
- API usage stats

### **Character Data**
- Character seeds (summaries)
- Character docs (full dossiers)
- Character portraits (URLs)
- Character videos (arrays of URLs)

### **Prompts** ⭐ NEW
- **Original prompt** - Your input that created the show
- **Custom portrait prompts** - Per-character custom prompts
- **Custom video prompts** - Per-character custom prompts
- **Custom poster prompt** - If you customized the poster
- **Custom trailer prompt** - If you customized the trailer

### **Assets**
- Poster image (uploaded to Supabase Storage)
- Library poster (9:16 version)
- Portrait grid (character composite)
- Trailer video
- All character portraits (auto-uploaded)
- All character videos (auto-uploaded)

### **Generation Metadata** ⭐ NEW
- **Trailer model** - Which succeeded (sora-2, veo-3.1, sora-2-fallback)

### **User Preferences** ⭐ NEW
- Video model preference
- Video duration preference (4/8/12 seconds)
- Video aspect ratio (landscape/portrait)
- Video resolution (standard/high)

---

## 🛠️ YOUR SETUP STEPS

### **STEP 1: Create Supabase Project**
1. Go to https://supabase.com
2. Click "New Project"
3. Name: `production-flow`
4. Set database password (SAVE IT!)
5. Choose region
6. Wait 2 minutes

### **STEP 2: Get Credentials**
Dashboard → **Settings** → **API**:
- Copy **Project URL**: `https://xxx.supabase.co`
- Copy **anon public** key
- Copy **service_role** key

### **STEP 3: Add Environment Variables**
Create/edit `.env.local`:
```bash
# Existing
OPENAI_API_KEY=your-key
REPLICATE_API_TOKEN=your-token

# NEW - Add these:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

### **STEP 4: Create Database Table**
Dashboard → **SQL Editor** → **New Query** → Paste and RUN:

```sql
-- Shows table with all essential data
CREATE TABLE shows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Core data
  model TEXT NOT NULL,
  original_prompt TEXT,
  blueprint JSONB NOT NULL,
  raw_json TEXT,
  usage JSONB,
  
  -- Character data
  character_seeds JSONB DEFAULT '[]'::jsonb,
  character_docs JSONB DEFAULT '{}'::jsonb,
  character_portraits JSONB DEFAULT '{}'::jsonb,
  character_videos JSONB DEFAULT '{}'::jsonb,
  
  -- Custom prompts (for regeneration)
  custom_portrait_prompts JSONB DEFAULT '{}'::jsonb,
  custom_video_prompts JSONB DEFAULT '{}'::jsonb,
  custom_poster_prompt TEXT,
  custom_trailer_prompt TEXT,
  
  -- Asset URLs (Supabase Storage)
  poster_url TEXT,
  library_poster_url TEXT,
  portrait_grid_url TEXT,
  trailer_url TEXT,
  
  -- Generation metadata
  trailer_model TEXT,
  
  -- User preferences
  video_model_id TEXT DEFAULT 'openai/sora-2',
  video_seconds INTEGER DEFAULT 8,
  video_aspect_ratio TEXT DEFAULT 'landscape',
  video_resolution TEXT DEFAULT 'standard'
);

-- Indexes for performance
CREATE INDEX idx_shows_updated_at ON shows(updated_at DESC);
CREATE INDEX idx_shows_created_at ON shows(created_at DESC);
CREATE INDEX idx_shows_title ON shows USING gin(to_tsvector('english', title));

-- Enable Row Level Security
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (add user auth later)
CREATE POLICY "Enable all access" ON shows
  FOR ALL USING (true) WITH CHECK (true);
```

### **STEP 5: Create Storage Bucket**
Dashboard → **Storage** → **New bucket**:
1. Name: `show-assets`
2. **Public bucket**: ✅ YES
3. Click "Create"

### **STEP 6: Set Storage Policies**
In `show-assets` bucket → **Policies**:

Policy 1 - Public Read:
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'show-assets');
```

Policy 2 - Authenticated Upload:
```sql
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'show-assets');
```

Policy 3 - Allow Updates:
```sql
CREATE POLICY "Allow updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'show-assets');
```

Policy 4 - Allow Deletes:
```sql
CREATE POLICY "Allow deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'show-assets');
```

### **STEP 7: Restart Dev Server**
```bash
# Stop current server (Ctrl+C)
rm -rf .next
npm run dev
```

---

## ✅ TESTING

After setup, try:
1. **Create a new show** - Should save to Supabase
2. **Check Supabase** Dashboard → Table Editor → shows table
3. **Check Storage** → show-assets bucket for uploaded files
4. **Load the show** from library - Should restore everything including prompts!

---

## 🎯 Benefits You Get

✅ **Cloud storage** - Works on Vercel, no file system needed
✅ **Automatic backups** - Supabase handles this
✅ **CDN delivery** - Fast asset loading worldwide
✅ **No 50MB limit** - Unlike Vercel file storage
✅ **Prompts saved** - Can see what created everything
✅ **Preferences saved** - Video settings persist per show
✅ **Searchable** - Can query/filter shows in future
✅ **Multi-device** - Access from anywhere

---

## 🔄 Migration (Optional)

Want to migrate your 39 existing shows? Let me know and I'll create a migration script!

---

## ⚠️ Important Notes

1. **Asset uploads** happen automatically - data URLs convert to Supabase Storage URLs
2. **Old file system** (`library/` folder) is no longer used after migration
3. **All new saves** go to Supabase
4. **Loading shows** pulls from Supabase with all prompts/preferences restored

---

Ready! Add your Supabase credentials to `.env.local` and restart! 🎉

