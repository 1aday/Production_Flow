# Show Pages - Quick Start Guide

## 🎬 What's New?

Every show in your library now has a **unique, shareable URL** that displays a comprehensive, AI-powered breakdown of your show!

## 🚀 How to Use

### 1. Share a Show

From the **Library page** (`/library`):
- Hover over any show card
- Click the **Share** button (share icon)
- URL is automatically copied to clipboard
- Share the link with anyone!

**Example URL format:**
```
https://your-domain.com/show/show-1762963525122-wgw7rs9ap
```

### 2. View a Show Page

When someone opens the link, they'll see:

#### Hero Section
- Full-screen poster or trailer
- Show title & AI-generated tagline
- Logline and tone keywords
- Toggle between poster/trailer view

#### About Section  
- AI-generated expanded description (2-3 paragraphs)
- Comprehensive overview of the show concept

#### Characters Section
- Grid of all character portraits
- Name, role, and age
- AI-generated character highlights
- Personality traits

#### Visual Identity
- Production style breakdown
- Color palette with hex codes
- Lighting and camera details
- Cinematic references

#### Unique Features
- AI-generated selling points
- What makes the show special

#### Behind the Scenes
- Production insights and creative process

#### Story Concepts (optional)
- Potential episode ideas
- Generated story arcs

### 3. Download Show Assets

From the show page:
- Click **Download** button in the header
- Gets a ZIP file containing:
  - `show.json` - Complete show data
  - `assets/` - All portraits, posters, trailers

## 🤖 AI Content Generation

When a show page loads, OpenAI automatically generates:
- **Hero Tagline** (10-15 words)
- **Expanded Description** (2-3 paragraphs)
- **Character Highlights** (per character)
- **Visual Identity Summary**
- **Unique Features** (3-5 points)
- **Behind the Scenes** insights
- **Story Concepts** (episode ideas)
- **Tone Keywords** (7 keywords)

*Generation happens on page load and typically takes 3-5 seconds.*

## 📁 File Structure

The system uses your local `library/` folder:

```
library/
  └── show-[id].json          # Show data

public/
  └── library-assets/
      └── show-[id]/
          ├── portrait-*.webp  # Character portraits
          ├── poster.webp      # Main poster
          ├── library-poster.webp  # Library poster
          └── trailer.mp4      # Trailer video
```

## 🎨 Design Features

### Responsive Layout
- Mobile-first design
- 1-4 column grids (responsive)
- Touch-friendly buttons

### Animations
- Smooth hover effects
- Scale animations on character cards
- Bounce scroll indicator
- Fade transitions

### Color Scheme
- Dark background (`bg-black`)
- Primary red accent
- Gradient overlays
- Varying text opacity for hierarchy

## 🔗 API Endpoints

### GET `/api/show/[id]`
Fetches show data and assets from library folder.

**Response:**
```json
{
  "show": { /* show data */ },
  "assets": {
    "portraits": ["/library-assets/show-id/portrait-1.webp"],
    "poster": "/library-assets/show-id/poster.webp",
    "trailer": "/library-assets/show-id/trailer.mp4"
  }
}
```

### POST `/api/show/[id]/generate-content`
Generates AI-powered page content using OpenAI.

**Uses:** GPT-4o with structured output

### GET `/api/show/[id]/download`
Downloads show as ZIP file.

## 🎯 Use Cases

### For Creators
- **Portfolio**: Share your work with a professional link
- **Pitch**: Send to potential collaborators/investors  
- **Archive**: Download complete show packages

### For Teams
- **Review**: Share for feedback and collaboration
- **Handoff**: Download complete assets for production
- **Documentation**: Comprehensive show reference

### For Fans
- **Discovery**: Explore show details and characters
- **Sharing**: Spread the word about shows you love
- **Collection**: Bookmark favorite shows

## 💡 Tips

### Best Practices
1. **Generate Complete Shows**: Pages look best with all assets (portraits, poster, trailer)
2. **Rich Descriptions**: Better show data = better AI-generated content
3. **High Quality Images**: Use high-res assets for impressive presentations

### Customization
The AI content is generated fresh each time. If you want:
- Different tone/style → Adjust the system prompt in `/api/show/[id]/generate-content/route.ts`
- Cached content → Add caching layer to store generated content
- Custom sections → Edit the show page component

### Performance
- Hero images use `priority` loading
- Other images lazy load
- AI generation is async and doesn't block page load
- Download packaging is efficient (level 9 compression)

## 🔧 Technical Details

### Dependencies
```json
{
  "archiver": "^7.0.1",        // ZIP creation
  "@types/archiver": "^6.0.2"  // TypeScript support
}
```

### Route Structure
```
/show/[id]                   → Show display page
/api/show/[id]               → Fetch show data
/api/show/[id]/generate-content  → Generate AI content
/api/show/[id]/download      → Download ZIP
```

### TypeScript Types
All types are defined in the show page component including:
- `ShowData` - Complete show structure
- `ShowAssets` - Asset URLs
- `GeneratedContent` - AI-generated content structure

## 🐛 Troubleshooting

### Show Not Found
- Verify show exists in `library/` folder
- Check the show ID matches the filename

### Missing Assets
- Check `public/library-assets/[show-id]/` exists
- Verify asset filenames match expected patterns

### AI Generation Failed
- Check OpenAI API key in `.env.local`
- Verify API has credits/quota available
- Check console for error details

### Download Failed
- Ensure `archiver` package is installed
- Check file permissions on library folder
- Verify assets are accessible

## 📊 Example Show Page Flow

```
User clicks Share → URL copied
                    
Recipient opens URL → Show page loads
                    ↓
                    Fetch show data from library
                    ↓
                    Display assets (poster/portraits)
                    ↓
                    Generate AI content (3-5 sec)
                    ↓
                    Render complete page
                    ↓
User clicks Download → Create ZIP → Download starts
```

## 🎉 That's It!

You now have professional, shareable show pages for every show in your library!

**Try it:**
1. Go to `/library`
2. Click share on any show
3. Open the URL in a new tab
4. Watch the magic happen! ✨

---

For more details, see `SHAREABLE_SHOW_PAGES.md`

