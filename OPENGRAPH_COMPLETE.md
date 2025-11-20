# 🎬 Open Graph Implementation - Complete

## Overview

Implemented a **stunning Open Graph metadata system** that makes show pages look incredible when shared on social media platforms (Twitter, Facebook, LinkedIn, Discord, Slack, etc.).

## ✨ Features

### 1. **Dynamic Show Metadata**
- Server-side metadata generation using Next.js 14+ `generateMetadata()`
- Fetches show data directly from Supabase for accurate, up-to-date information
- Extracts title, logline, genre, setting, tone, and character count

### 2. **Beautiful Poster Images**
- **Primary**: Uses show's library poster or regular poster URL
- **Fallback**: Dynamic OG image generator with show details
- Optimized dimensions: 1280×1920 (poster) or 1200×630 (OG card)

### 3. **Rich Social Cards**
Every show page includes:
- ✅ Open Graph tags (Facebook, LinkedIn, Discord)
- ✅ Twitter Card tags (summary_large_image)
- ✅ SEO-optimized descriptions (155-160 characters)
- ✅ Keywords for discoverability
- ✅ Robots meta tags for search engines

### 4. **Dynamic OG Image API**
Fallback endpoint generates beautiful images on-the-fly:
- Gradient background with accent elements
- Show title with gradient text effect
- Genre badge
- Logline excerpt
- Production Flow branding

## 📁 Files Modified

### Core Implementation
```
src/app/show/[id]/page.tsx          # Server component with metadata generation
src/app/show/[id]/ShowPageClient.tsx # Client component (existing)
src/app/layout.tsx                   # Enhanced root metadata
src/app/api/og/route.tsx             # Dynamic OG image generator (NEW)
```

## 🎨 What Gets Shared

When someone shares a show page URL, they see:

### Twitter/X
```
┌─────────────────────────────────────┐
│  [Show Poster Image - 1280×1920]    │
│                                      │
│  Show Title                          │
│  Compelling logline or description   │
│  productionflow.vercel.app          │
└─────────────────────────────────────┘
```

### Facebook/LinkedIn
```
┌─────────────────────────────────────┐
│  [Show Poster Image]                 │
├─────────────────────────────────────┤
│  Show Title                          │
│  Genre • Setting • Tone • Characters │
│  Production Flow                     │
└─────────────────────────────────────┘
```

### Discord/Slack
- Large embedded preview with poster
- Show title and description
- Clickable link to show page

## 🔧 Technical Details

### Metadata Structure

```typescript
{
  title: "Show Title | Production Flow",
  description: "Optimized description under 160 chars",
  keywords: ["Show Title", "Genre", "AI show bible", ...],
  
  openGraph: {
    type: "website",
    url: "https://productionflow.vercel.app/show/[id]",
    title: "Show Title",
    description: "...",
    images: [{
      url: "https://[poster-url]",
      width: 1280,
      height: 1920,
      alt: "Show Title - Show Poster"
    }]
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Show Title",
    description: "...",
    images: ["https://[poster-url]"]
  }
}
```

### Image Priority
1. **Library Poster** (`show.library_poster_url`)
2. **Regular Poster** (`show.poster_url`)
3. **Dynamic OG Image** (`/api/og?title=...&genre=...&logline=...`)

### Dynamic OG Image Generator
- **Endpoint**: `/api/og`
- **Parameters**: `title`, `genre`, `logline`
- **Technology**: Next.js ImageResponse (Edge Runtime)
- **Output**: 1200×630 PNG with beautiful gradient design

## 🌐 Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**Note**: Defaults to `https://productionflow.vercel.app` if not set.

## 🎯 SEO Benefits

1. **Social Media Reach**
   - Eye-catching visuals increase click-through rates
   - Proper metadata ensures correct display across platforms

2. **Search Engine Optimization**
   - Rich keywords from show data
   - Proper meta descriptions (155-160 chars)
   - Robots tags for crawler instructions

3. **User Experience**
   - Professional appearance when sharing
   - Accurate show information in previews
   - Brand consistency across shares

## 🧪 Testing

### Test Open Graph Tags

1. **Facebook Sharing Debugger**
   ```
   https://developers.facebook.com/tools/debug/
   ```

2. **Twitter Card Validator**
   ```
   https://cards-dev.twitter.com/validator
   ```

3. **LinkedIn Post Inspector**
   ```
   https://www.linkedin.com/post-inspector/
   ```

4. **Open Graph Preview**
   ```
   https://www.opengraph.xyz/
   ```

### Manual Testing
```bash
# View metadata in browser
curl -s https://your-domain.com/show/[id] | grep "og:"
curl -s https://your-domain.com/show/[id] | grep "twitter:"
```

## 📊 Metadata Breakdown

### Generated from Show Data
- **Title**: `blueprint.show_title` or `title`
- **Description**: `blueprint.logline` or `blueprint.premise`
- **Genre**: `blueprint.genre`
- **Setting**: `blueprint.setting`
- **Tone**: `blueprint.tone`
- **Image**: `library_poster_url` or `poster_url`

### Smart Description Generation
If no logline exists:
```typescript
"A [genre], set in [setting], with a [tone] tone, featuring [N] characters."
```

### Keywords Array
```typescript
[
  "Show Title",
  "Genre",
  "Tone",
  "AI show bible",
  "production bible",
  "character design",
  "show development",
  "production flow"
]
```

## 🚀 Performance

- ✅ Server-side generation (no client JavaScript needed)
- ✅ Cached by social media platforms
- ✅ Edge runtime for dynamic OG images
- ✅ Optimized image dimensions for fast loading

## 🎨 Design Philosophy

The Open Graph implementation follows these principles:

1. **Visual Impact**: Use high-quality poster images
2. **Information Hierarchy**: Title → Genre → Description
3. **Brand Consistency**: Production Flow branding throughout
4. **Platform Optimization**: Correct dimensions and card types
5. **Graceful Degradation**: Fallback to generated images

## 📱 Platform Support

| Platform | Card Type | Image Size | Status |
|----------|-----------|------------|--------|
| Twitter/X | summary_large_image | 1280×1920 | ✅ |
| Facebook | website | 1280×1920 | ✅ |
| LinkedIn | article | 1280×1920 | ✅ |
| Discord | embed | 1280×1920 | ✅ |
| Slack | unfurl | 1280×1920 | ✅ |
| iMessage | preview | 1280×1920 | ✅ |
| WhatsApp | preview | 1280×1920 | ✅ |

## 🔮 Future Enhancements

Potential improvements:

1. **Character Grid OG Images**
   - Show character portraits in OG image
   - Use portrait grid URL when available

2. **Video Previews**
   - Add `og:video` tags for trailers
   - Twitter Player Card for in-feed video

3. **Multiple Images**
   - Gallery view with poster + characters
   - Carousel support for platforms that support it

4. **Localization**
   - Multi-language metadata
   - Region-specific content

5. **Analytics**
   - Track social media referrals
   - Measure share performance

## ✅ Checklist

- [x] Server-side metadata generation
- [x] Show poster as OG image
- [x] Dynamic OG image fallback
- [x] Twitter Card support
- [x] Facebook/OG support
- [x] SEO optimization
- [x] Keywords generation
- [x] Robots meta tags
- [x] Description optimization
- [x] Brand consistency
- [x] Environment variable support
- [x] Error handling
- [x] Type safety

## 🎉 Result

Show pages now create **stunning social media cards** that:
- Showcase the show's poster prominently
- Display professional, engaging metadata
- Drive higher click-through rates
- Maintain brand consistency
- Work across all major platforms

**Share your shows with confidence!** 🚀

