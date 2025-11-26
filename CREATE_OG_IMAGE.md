# How to Create the Default OpenGraph Image

Your site now has beautiful OpenGraph metadata, but you need to add a default image at:

**`/public/og-image.png`**

## Quick Options

### Option 1: Design in Figma (Recommended)
1. Create a new design with dimensions **1200 x 630 pixels**
2. Use your brand colors (black background, red/orange accent: #E50914)
3. Add text:
   - Main: "Production Flow"
   - Subtext: "AI Show Bible Generator"
   - Optional tagline: "Turn one sentence into a complete show bible"
4. Export as PNG
5. Save to `/public/og-image.png`

### Option 2: Use Canva
1. Go to [Canva.com](https://www.canva.com)
2. Search for "Social Media" → "Facebook Post" or create custom 1200x630
3. Use template or create from scratch
4. Design with:
   - Dark background (#090909)
   - Production Flow branding
   - Bold, readable text
   - High contrast
5. Download as PNG
6. Save to `/public/og-image.png`

### Option 3: AI Generation
Use ChatGPT, Midjourney, or DALL-E:

**Prompt suggestion:**
```
Create a professional social media preview image (OpenGraph) for "Production Flow", an AI-powered show bible generator. 1200x630 pixels. Dark cinematic background with subtle grid pattern. Bold white text "PRODUCTION FLOW" at top. Subtext "AI Show Bible Generator" in elegant font. Accent color: Netflix red (#E50914). Modern, sleek, premium aesthetic. Cinematic film production theme. No actual film characters, just abstract elements and text.
```

### Option 4: Simple Text-Based (5 minutes)
Use any image editor:
1. Create 1200x630px canvas
2. Fill with solid black (#090909)
3. Add centered white text:
   - "PRODUCTION FLOW" (72px, bold, tracking: 0.32em)
   - "AI Show Bible Generator" (32px, regular)
4. Add red line or glow effect (#E50914)
5. Save as PNG

### Option 5: Use Existing Poster (Temporary)
Quick placeholder while you design:
```bash
# From project root
cp public/library-assets/show-XXXXX/poster.webp public/og-image-temp.png

# Then convert/resize to 1200x630 using online tool:
# https://www.iloveimg.com/resize-image
```

## Design Guidelines

### ✅ Do:
- Use 1200x630 pixels (standard OG size)
- Keep important content in center 1200x600 area (safe zone)
- Use high contrast (light text on dark, or vice versa)
- Make text large enough to read when thumbnail-sized
- Use your brand colors
- Save as PNG or JPG (PNG preferred)
- Keep file size under 5MB (ideally under 1MB)

### ❌ Don't:
- Don't use small text (won't be readable)
- Don't put important content near edges
- Don't use low contrast
- Don't use complex gradients (may not display well)
- Don't include clickbait or misleading content
- Don't use copyrighted imagery without permission

## Brand Colors Reference

From your app:
- **Black:** `#090909` (background)
- **Primary Red:** `#E50914` (Netflix-style accent)
- **White:** `#FFFFFF` (text)
- **Gray:** `#71717A` (secondary text)

## Verify Your Image

After creating the image:

1. **Check dimensions:**
   - Right-click → Properties/Get Info
   - Should be exactly 1200x630 pixels

2. **Test appearance:**
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Facebook Debugger: https://developers.facebook.com/tools/debug/
   - OpenGraph.xyz: https://www.opengraph.xyz/

3. **File location:**
   ```
   Production_Flow/
   └── public/
       └── og-image.png  ← Must be here!
   ```

## Example Layout Ideas

### Layout 1: Centered Text
```
┌────────────────────────────────────┐
│                                    │
│         PRODUCTION FLOW            │
│    ━━━━━━━━━━━━━━━━━━━━━━━        │
│    AI Show Bible Generator         │
│                                    │
└────────────────────────────────────┘
```

### Layout 2: Split Design
```
┌──────────────┬─────────────────────┐
│              │  PRODUCTION FLOW    │
│  [Abstract   │  ━━━━━━━━━━━━━━━   │
│   Visual     │  Transform ideas    │
│   Element]   │  into complete      │
│              │  show bibles        │
└──────────────┴─────────────────────┘
```

### Layout 3: Minimal
```
┌────────────────────────────────────┐
│  PRODUCTION FLOW                   │
│  AI Show Bible Generator           │
│                                    │
│  [Small icon/logo]                 │
│                                    │
└────────────────────────────────────┘
```

## Next Steps

1. Create the image using any method above
2. Save it to `/public/og-image.png`
3. Test with social media debuggers
4. Deploy your site
5. Share a page and admire your beautiful preview! 🎉

## Need Help?

- **Figma community templates:** Search "OpenGraph" or "Social Media"
- **Canva templates:** Search "Facebook Post 1200x630"
- **Free stock photos:** Unsplash, Pexels (for background elements)
- **Icon sets:** Lucide (already in your project), Heroicons, Phosphor

---

**Once created, delete this file - it's just a guide!**



