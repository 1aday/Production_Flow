# OpenGraph Metadata Setup Complete ✅

## Overview
Beautiful OpenGraph metadata has been added to **every page** in the application, with special attention to show pages that dynamically use show posters.

## What Was Implemented

### 1. **Root Layout** (`src/app/layout.tsx`)
- Added comprehensive default metadata with OpenGraph and Twitter Card support
- Configured `metadataBase` for absolute URLs
- Added SEO keywords, authors, and robots configuration
- Included Apple Web App metadata

### 2. **Landing Page** (`src/app/page.tsx`)
- Custom OpenGraph metadata highlighting "Your Next Hit Starts Here"
- Emphasizes the core value proposition
- Twitter Card integration

### 3. **Library Page** (`src/app/library/page.tsx`)
- Metadata focused on browsing the show collection
- Highlights character, aesthetics, poster, and trailer features

### 4. **Show Pages** (`src/app/show/[id]/page.tsx`) ⭐ **SPECIAL**
- **Dynamic metadata generation** based on each show
- **Uses the show's poster image** (library_poster_url or poster_url)
- Includes show title, logline, genre, and production medium
- Dynamic description building from show data
- Support for video metadata if trailer exists
- OpenGraph type set to "video.movie" for better social media display
- Theme color dynamically set from show blueprint
- Canonical URL generation with proper show path

### 5. **Console Page** (`src/app/console/page.tsx`)
- Production-focused metadata
- Emphasizes creation and management capabilities

### 6. **Prompts Page** (`src/app/prompts/page.tsx`)
- AI customization focused metadata
- Highlights template management

### 7. **Control Panel Page** (`src/app/control-panel/page.tsx`)
- Fine-tuning focused metadata
- Emphasizes advanced customization options

## Architecture Changes

All client component pages were refactored to support metadata:
- Original client components moved to `*Client.tsx` files
- New server component wrappers created as `page.tsx` files
- Server components export metadata and render client components
- This pattern allows Next.js to properly generate metadata for social sharing

## Show Page OpenGraph Features

When someone shares a show page, they'll see:
1. **Show Title** as the OpenGraph title
2. **Show Poster** as the large preview image (1200x1800)
3. **Logline + Genre/Medium** as the description
4. **Trailer video** metadata if available
5. **Dynamic theme color** matching the show's aesthetic
6. **Proper canonical URL** with SEO-friendly path

Example metadata for a show:
```
Title: "The Robot Family Next Door"
Description: "When a family of androids moves to suburbia, they must blend in while hiding their true nature — A Comedy Animated Series. Complete show bible with AI-generated characters, aesthetics, and production details."
Image: [Show's actual poster from Supabase storage]
Video: [Trailer URL if available]
```

## Required: Default OG Image

### ⚠️ ACTION NEEDED
You need to add a default OpenGraph image for pages without custom images:

**File needed:** `/public/og-image.png`

**Specifications:**
- Dimensions: 1200x630 pixels (standard OG image size)
- Format: PNG or JPG
- Content suggestions:
  - Production Flow logo/branding
  - Tagline: "AI Show Bible Generator"
  - Clean, high-contrast design
  - Avoid small text (will be displayed at various sizes)

**Quick options:**
1. Design in Figma/Canva using 1200x630 template
2. Use an existing show poster as temporary placeholder
3. Generate with AI image tools
4. Hire a designer for a professional branded image

**Temporary workaround:**
Until you add the image, social media crawlers will fall back to default behavior (no image preview).

## Environment Variables

Make sure you have set (or will set) in production:
```env
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

This is used to generate absolute URLs for OpenGraph images and canonical links.

## Testing OpenGraph Metadata

### 1. **Local Testing**
Use browser extensions:
- [Meta Tags](https://chrome.google.com/webstore/detail/meta-tags/eiggbnjgphjmdacobjedaboegcpdpcib) (Chrome)
- View page source and check `<meta property="og:*">` tags

### 2. **Social Media Debuggers**
Test how your pages will appear when shared:

**Twitter/X:**
- https://cards-dev.twitter.com/validator
- Enter your URL to see preview

**Facebook:**
- https://developers.facebook.com/tools/debug/
- Enter your URL to see preview
- Click "Scrape Again" to refresh cache

**LinkedIn:**
- https://www.linkedin.com/post-inspector/
- Enter your URL to see preview

**Generic OG Tester:**
- https://www.opengraph.xyz/
- Test all OpenGraph tags at once

### 3. **Testing Show Pages**
1. Create or open an existing show
2. Get the show URL (e.g., `/show/123-show-title`)
3. Test in social debuggers above
4. Should display the show's actual poster image
5. Should show dynamic title, description, and metadata

## Dynamic Show Metadata Details

The show page metadata pulls from:
- `show_title` or `title` - for OpenGraph title
- `blueprint.logline` - for description
- `blueprint.genre` - added to description
- `blueprint.production_medium` - added to description
- `library_poster_url` or `poster_url` - for OpenGraph image
- `trailer_url` - for OpenGraph video
- `blueprint.theme_color` - for theme-color meta tag

## Best Practices Applied

✅ **Image dimensions** optimized for each platform
✅ **Descriptions** are concise yet informative (under 200 chars)
✅ **Alt text** included for all images
✅ **Twitter Card** type appropriate for content
✅ **Canonical URLs** prevent duplicate content issues
✅ **Dynamic content** for show pages
✅ **Fallback metadata** if show data unavailable
✅ **Proper URL structure** with absolute paths
✅ **Type differentiation** (website vs video.movie)

## Impact

### SEO Benefits
- Better search engine understanding of content
- Rich snippets in search results
- Improved click-through rates

### Social Sharing Benefits
- Professional appearance when shared
- Increased engagement on social media
- Brand consistency across platforms
- Show posters displayed prominently

### User Experience
- Clear preview before clicking links
- Trust signals through professional metadata
- Proper mobile display

## Future Enhancements

Consider adding:
1. **Structured data (JSON-LD)** for even richer search results
2. **Apple Music/Podcast** metadata if applicable
3. **Article metadata** for blog posts (if added)
4. **Video schema** for trailers
5. **Person schema** for characters
6. **Creator profiles** with OpenGraph metadata
7. **Collections/Series** metadata for show groupings

## Maintenance

- OpenGraph images should be regenerated if branding changes
- Show metadata automatically updates when show data changes
- Test social sharing after any layout/branding updates
- Monitor social media debugger tools for any issues

---

**Status:** ✅ Complete (pending default OG image)
**Last Updated:** November 20, 2025
**Tested:** Local development ✅ | Production: Pending deployment








