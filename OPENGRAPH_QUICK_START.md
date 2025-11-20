# 🚀 Open Graph Quick Start

## What Changed

Your show pages now have **stunning social media cards** when shared! 

## How It Works

### Automatic
Every show page at `/show/[id]` now automatically generates:
- Beautiful preview cards for Twitter, Facebook, LinkedIn, Discord, etc.
- Uses the show's poster image (or generates one dynamically)
- Includes show title, genre, logline, and more

### No Code Required
The implementation is **completely automatic**. Just share a show URL and the platform will display a beautiful card.

## Test It Out

1. **Create or open a show** in Production Flow
2. **Copy the show page URL** (e.g., `https://your-domain.com/show/abc123`)
3. **Paste it into**:
   - Twitter/X tweet composer
   - Facebook post
   - LinkedIn post
   - Discord channel
   - Slack message

You'll see a rich preview with the show poster and details!

## What Users See

### Before
```
https://your-domain.com/show/abc123
Plain link with no preview
```

### After
```
┌─────────────────────────────────┐
│                                  │
│     [Beautiful Show Poster]      │
│                                  │
├─────────────────────────────────┤
│  The Detective Chronicles        │
│  A noir mystery set in 1940s LA  │
│  Production Flow                 │
└─────────────────────────────────┘
```

## Image Priority

The system intelligently selects images:

1. **Show Library Poster** - Main poster optimized for library view
2. **Show Poster** - Original generated poster
3. **Dynamic Generated Image** - Beautiful gradient card with show details

## Configuration

### Required (Auto-configured on Vercel)
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Optional (Defaults work fine)
If not set, uses `https://productionflow.vercel.app`

## Validation Tools

Test your Open Graph implementation:

### Facebook
https://developers.facebook.com/tools/debug/

### Twitter
https://cards-dev.twitter.com/validator

### LinkedIn
https://www.linkedin.com/post-inspector/

### General
https://www.opengraph.xyz/

## Tips

1. **Clear Cache**: Social platforms cache previews. Use the validation tools above to refresh.

2. **Test Different Shows**: Some shows have posters, some don't. Both look great!

3. **Share Widely**: These rich previews significantly increase engagement and click-through rates.

## Troubleshooting

### Preview Not Showing
- Wait 5-10 seconds after pasting URL
- Some platforms need you to hit "Preview" button
- Use validation tools to force refresh cache

### Wrong Image
- Clear platform cache using validation tools
- Check that poster URL is publicly accessible
- Verify NEXT_PUBLIC_BASE_URL is correct

### No Metadata
- Ensure show exists in database
- Check server logs for errors
- Verify Supabase connection

## What's Included

Every show page now has:
- ✅ Open Graph tags (og:title, og:image, og:description, etc.)
- ✅ Twitter Card tags (twitter:card, twitter:image, etc.)
- ✅ SEO meta tags (keywords, description, etc.)
- ✅ Robots tags for search engines
- ✅ Mobile-optimized metadata

## Performance

- **Zero client impact**: Metadata generated server-side
- **Cached by platforms**: First share does the work
- **Fast image generation**: Edge runtime for dynamic images
- **Optimized sizes**: Correct dimensions for each platform

## That's It!

Your shows now look **professional and engaging** when shared anywhere on the web. Share away! 🎬✨

