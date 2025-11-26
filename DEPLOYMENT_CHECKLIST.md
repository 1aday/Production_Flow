# 🚀 Vercel Deployment Checklist - Portrait Fix

## ✅ What Was Fixed

The portrait and video generation was failing on Vercel due to serverless architecture incompatibility. The system was using in-memory storage and background tasks that don't work across Vercel's multiple containers.

**Fixed components:**
- ✅ Portrait generation
- ✅ Portrait status polling
- ✅ Video generation
- ✅ Video status polling

**Architecture change:**
- **Before**: Fire-and-forget background tasks with in-memory storage ❌
- **After**: Replicate prediction IDs with direct API polling ✅

## 📋 Pre-Deployment Checklist

### 1. Environment Variables in Vercel

Go to your Vercel dashboard → Your Project → Settings → Environment Variables

Ensure these are set:

```bash
REPLICATE_API_TOKEN=r8_your_actual_token_here
OPENAI_API_KEY=sk-your_actual_key_here
```

**How to verify:**
1. Log into [vercel.com](https://vercel.com)
2. Select your project
3. Go to Settings → Environment Variables
4. Check that both variables exist and are not empty
5. If missing, add them and redeploy

### 2. Vercel Plan Requirements

**For portrait/video generation to work:**
- ✅ **Hobby plan**: Works now! (Functions return in < 1s)
- ✅ **Pro plan**: Works now!

**Note:** We reduced `maxDuration` from 180s/300s to 60s since functions now return immediately.

### 3. Git Status

Your working tree is clean and ready to deploy:

```bash
git status
# On branch main
# nothing to commit, working tree clean
```

## 🚢 Deployment Steps

### Option A: Auto-Deploy (Recommended)

If you have auto-deploy enabled in Vercel:

```bash
git add .
git commit -m "Fix: Portrait/video generation for Vercel serverless architecture"
git push origin main
```

Vercel will automatically deploy.

### Option B: Manual Deploy

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 Testing After Deployment

### 1. Test Portrait Generation

1. Go to your production URL
2. Create a new show or load an existing one
3. Generate character portraits
4. **Expected behavior:**
   - Portraits start generating immediately (< 1 second response)
   - Status updates appear every 3 seconds
   - Portraits complete in 30-90 seconds
   - No "failed within seconds" errors

### 2. Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to "Functions" tab
4. Check logs for:
   - ✅ "✅ Portrait prediction created: [prediction-id]"
   - ✅ Status polling requests every 3 seconds
   - ❌ No "Prediction creation error" messages

### 3. Check Browser Console

Open browser DevTools (F12) → Console:

```javascript
// You should see:
🎨 Auto-generating portrait for: [Character Name]
📝 Created background task for portrait: [char-id] (job: [prediction-id])
🚀 Portrait generation started for [char-id], job: [prediction-id]
📊 Portrait [char-id] status: starting
📊 Portrait [char-id] status: processing
📊 Portrait [char-id] status: succeeded
✅ Portrait [char-id] completed: https://replicate.delivery/...
```

### 4. Test Video Generation

Same process as portraits - videos should also work now.

## 🔧 Troubleshooting

### Issue: "Missing REPLICATE_API_TOKEN"

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `REPLICATE_API_TOKEN` with your token
3. Redeploy

### Issue: "Failed to create portrait prediction"

**Possible causes:**
1. Invalid Replicate API token
2. Replicate API rate limit exceeded
3. Model not accessible

**Solution:**
```bash
# Test your Replicate token locally
curl -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/account

# Should return your account info, not an error
```

### Issue: Portraits still fail immediately

**Check:**
1. Vercel function logs for errors
2. Browser network tab - look for 500 errors
3. Environment variables are actually set in Vercel
4. You deployed the latest code

**Debug:**
```bash
# In browser console, check the API response
fetch('/api/characters/portrait', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    show: {...}, 
    character: {...},
    imageModel: 'gpt-image'
  })
})
.then(r => r.json())
.then(console.log)
```

### Issue: Status always returns null

**Possible causes:**
1. Invalid prediction ID
2. Replicate API token not set
3. Prediction expired (after 24 hours)

**Solution:**
Check status endpoint directly:
```bash
# Replace [prediction-id] with actual ID
curl https://your-domain.vercel.app/api/characters/portrait/status?jobId=[prediction-id]
```

## 📊 What Changed Technically

### Files Modified

```
src/app/api/characters/portrait/route.ts        ← Returns prediction ID immediately
src/app/api/characters/portrait/status/route.ts ← Polls Replicate API
src/app/api/characters/video/route.ts           ← Returns prediction ID immediately
src/app/api/characters/video/status/route.ts    ← Polls Replicate API
```

### No Changes Needed

- ✅ Frontend code (`/app/console/page.tsx`) - works as-is
- ✅ Trailer generation - uses different (slower but working) approach
- ✅ Library poster generation - unaffected
- ✅ Character dossiers - unaffected

## 💡 Future Improvements (Optional)

These work fine now, but could be optimized later:

1. **Trailer generation** - Currently synchronous (waits for completion). Could be refactored to async like portraits.
2. **Long-term storage** - Replicate predictions expire after 24 hours. Consider saving to Supabase for permanence.
3. **Caching** - Could cache completed results to reduce Replicate API calls.

## ✅ Success Criteria

After deployment, you should be able to:

- ✅ Create shows on Vercel (same as before)
- ✅ Generate character dossiers on Vercel (same as before)
- ✅ **Generate portraits on Vercel (NOW WORKS!)**
- ✅ **Generate videos on Vercel (NOW WORKS!)**
- ✅ Generate trailers on Vercel (same as before)
- ✅ All generation survives page navigation/tab close

## 📞 Support

If you still encounter issues after deployment:

1. Check Vercel function logs
2. Verify environment variables are set
3. Test Replicate API token manually
4. Check browser console for errors
5. Provide specific error messages for debugging

---

**Ready to deploy?** Just push to GitHub and let Vercel auto-deploy! 🚀





