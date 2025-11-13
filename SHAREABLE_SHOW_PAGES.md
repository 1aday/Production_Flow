# Shareable Show Pages

## Overview

Each show in your library now has a unique, shareable URL that displays a comprehensive, beautifully designed single-page breakdown of the show with all its assets and AI-generated insights.

## Features

### 🎬 Dynamic Show URLs
- Each show gets a unique URL: `/show/[showId]`
- URLs are shareable and can be accessed directly
- Example: `https://your-domain.com/show/show-1762963525122-wgw7rs9ap`

### 🤖 AI-Generated Content
When a show page loads, OpenAI automatically generates:
- **Hero Tagline**: Compelling 10-15 word tagline
- **Expanded Description**: 2-3 paragraphs about the show
- **Character Highlights**: 2-3 sentences per character
- **Visual Identity Summary**: Overview of the show's aesthetic
- **Unique Features**: 3-5 bullet points of what makes it special
- **Behind the Scenes**: Production insights
- **Story Concepts**: Potential episode ideas
- **Tone Keywords**: 5-7 keywords capturing the show's vibe

### 📸 Asset Display
The page showcases all show assets:
- **Hero Section**: Full-screen poster with overlay
- **Trailer Playback**: Toggle between poster and trailer
- **Character Grid**: All character portraits with bios
- **Visual Identity**: Production style breakdown
- **Color Palette**: Show color scheme with hex codes

### ⚡ Key Actions
- **Share Button**: Copy shareable URL to clipboard
- **Download Button**: Download all show assets as ZIP
- **Trailer Toggle**: Switch between poster and video
- **Navigation**: Back to library

## Architecture

### File Structure
```
src/app/
├── show/
│   └── [showId]/
│       └── page.tsx              # Show page component
└── api/
    ├── show/
    │   └── [showId]/
    │       ├── route.ts           # Fetch show data + assets
    │       └── generate-content/
    │           └── route.ts       # AI content generation
    └── download-show/
        └── [showId]/
            └── route.ts           # ZIP download endpoint
```

### API Endpoints

#### GET `/api/show/[showId]`
Fetches complete show data and assets.

**Response:**
```json
{
  "show": {
    "id": "show-xxx",
    "title": "Show Title",
    "blueprint": {...},
    "characterSeeds": [...],
    ...
  },
  "assets": {
    "portraits": ["/library-assets/show-xxx/portrait-1.webp", ...],
    "poster": "/library-assets/show-xxx/poster.webp",
    "libraryPoster": "/library-assets/show-xxx/library-poster.webp",
    "trailer": "/library-assets/show-xxx/trailer.mp4"
  }
}
```

#### POST `/api/show/[showId]/generate-content`
Uses OpenAI to generate structured page content.

**Response:**
```json
{
  "content": {
    "hero_tagline": "Compelling tagline here",
    "expanded_description": ["Paragraph 1", "Paragraph 2"],
    "character_highlights": {
      "character-id": "Character description..."
    },
    "visual_identity": "Visual style description...",
    "unique_features": ["Feature 1", "Feature 2"],
    "behind_the_scenes": "Production insights...",
    "episode_concepts": [
      {
        "title": "Episode Title",
        "description": "Episode description"
      }
    ],
    "tone_keywords": ["dramatic", "comedic", ...]
  },
  "tokens_used": 1234
}
```

#### GET `/api/download-show/[showId]`
Downloads all show assets as a ZIP file.

**Response:** Binary ZIP file containing:
- `show.json` - Complete show data
- `assets/` - All character portraits, posters, trailers

### Dependencies Added
```json
{
  "dependencies": {
    "archiver": "^7.0.1"
  },
  "devDependencies": {
    "@types/archiver": "^6.0.2"
  }
}
```

## Page Sections

### 1. Hero Section (Full Screen)
- Background: Poster or trailer (toggleable)
- Show title (large, serif font)
- Hero tagline (AI-generated)
- Logline from blueprint
- Tone keywords as badges
- Scroll indicator

### 2. About Section
- Film icon header
- 2-3 expanded description paragraphs
- Engaging, AI-generated content

### 3. Characters Section
- Users icon header
- Grid layout (responsive: 1-4 columns)
- Each character card shows:
  - Portrait image
  - Name and role
  - AI-generated highlights
  - Top 3 personality traits
  - Hover effects with scaling

### 4. Visual Identity Section
- Split into two panels:
  
  **Production Style Panel:**
  - Medium (animation style)
  - Stylization level
  - Visual treatment description
  - Cinematic references list
  
  **Visual Aesthetics Panel:**
  - Color palette with hex swatches
  - Lighting description
  - Camera/lens information
  - AI-generated visual identity summary

### 5. Unique Features Section
- Sparkles icon header
- 3-column grid of feature cards
- AI-generated selling points

### 6. Behind the Scenes
- Production insights paragraph
- AI-generated content about the creation

### 7. Story Concepts (if generated)
- Numbered episode concept cards
- Title and description for each
- Professional presentation

### 8. Footer
- Copyright info
- CTA to create own show

## Integration with Library

The library page already has the share functionality:
- Share button on each show card
- Copies URL: `/show/[showId]`
- Visual feedback when copied

```tsx
const copyShowUrl = async (showId: string, event: React.MouseEvent) => {
  event.stopPropagation();
  const url = `${window.location.origin}/show/${showId}`;
  await navigator.clipboard.writeText(url);
};
```

## Design Highlights

### Color Scheme
- Dark background (`bg-black`)
- Primary accent for CTAs
- White/foreground text with varying opacity
- Gradient overlays for depth

### Typography
- **Hero Title**: `font-serif text-6xl lg:text-7xl`
- **Section Headers**: `font-serif text-4xl`
- **Body Text**: `text-lg leading-relaxed`
- **Small Text**: `text-sm text-foreground/80`

### Animations
- Smooth transitions on hover
- Bounce animation on scroll indicator
- Scale effects on character cards
- Fade transitions between poster/trailer

### Responsive Design
- Mobile-first approach
- Responsive grids: 1-4 columns
- Flexible image sizing
- Touch-friendly buttons

## Usage Flow

1. **From Library**: Click share button → Copy URL
2. **Share URL**: Send link to anyone
3. **Recipient Opens**: Loads show page
4. **Auto-Generate**: AI creates content on first load
5. **Explore**: Scroll through sections
6. **Download**: Get all assets as ZIP

## Performance Optimizations

- **Lazy Loading**: Images below fold load lazily
- **Priority Loading**: Hero image loads with `priority`
- **Responsive Images**: `sizes` attribute for optimal loading
- **Quality**: 95 for hero, 85 for thumbnails
- **Caching**: Assets served from public directory

## Error Handling

- Show not found → 404, redirect to library
- Failed AI generation → Show page still loads (content gracefully degrades)
- Missing assets → Fallback to gradient placeholders
- Download fails → User-friendly error message

## Future Enhancements

### Potential Additions
- [ ] Social media meta tags (OG, Twitter cards)
- [ ] PDF export option
- [ ] Embed codes for iframe
- [ ] Custom themes per show
- [ ] Analytics tracking
- [ ] Comments/feedback section
- [ ] Version history
- [ ] Collaborative editing
- [ ] AI-powered cast lists
- [ ] Production timeline visualization

### SEO Optimization
- [ ] Dynamic meta tags
- [ ] Structured data (JSON-LD)
- [ ] Sitemap generation
- [ ] Canonical URLs
- [ ] Open Graph tags

## Testing Checklist

- [ ] Load show page with all assets
- [ ] Load show page with missing assets
- [ ] AI content generation
- [ ] Trailer toggle functionality
- [ ] Share button copies URL
- [ ] Download creates valid ZIP
- [ ] Responsive design on mobile
- [ ] Character grid layout
- [ ] Color palette display
- [ ] Navigation back to library
- [ ] Show not found handling
- [ ] API error handling

## Notes

- AI content generation happens on every page load (could be cached in future)
- All show data comes from library JSON files
- Assets must be in `/public/library-assets/[showId]/`
- Download includes everything needed to reconstruct show
- Page is fully client-side rendered for dynamic content

## Example Show Page Structure

```
┌─────────────────────────────────────┐
│  ← [Navigation]         [Actions]   │  Header (fixed)
├─────────────────────────────────────┤
│                                     │
│         [POSTER/TRAILER]            │  Hero (100vh)
│                                     │
│         Show Title                  │
│         Hero Tagline                │
│         [Tone Keywords]             │
│         ↓                           │
├─────────────────────────────────────┤
│  📽 About the Show                  │
│  [Description paragraphs]           │
├─────────────────────────────────────┤
│  👥 Characters                      │
│  [Grid of character cards]          │
├─────────────────────────────────────┤
│  🎨 Visual Identity                 │
│  [Production] │ [Aesthetics]        │
├─────────────────────────────────────┤
│  ✨ What Makes It Special           │
│  [Feature cards grid]               │
├─────────────────────────────────────┤
│  🎬 Behind the Scenes               │
│  [Production insights]              │
├─────────────────────────────────────┤
│  📺 Story Concepts                  │
│  [Episode concept cards]            │
├─────────────────────────────────────┤
│  Footer                             │
└─────────────────────────────────────┘
```

This creates a comprehensive, professional show page that's perfect for sharing with collaborators, investors, or fans!

