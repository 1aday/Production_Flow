# Hero Section Stacking Fix

## Problem
When the viewport width goes below 1024px, the hero section layout changes from side-by-side (trailer left, poster right) to stacked (trailer on top, poster below). At this breakpoint, the poster was becoming **massive** because it was taking the full container width with a 9:16 aspect ratio.

### Why This Happened
- Desktop (≥1024px): Grid layout with `lg:grid-cols-4`
  - Trailer takes 3/4 width (75%)
  - Poster takes 1/4 width (25%)
  - Poster looks great at ~350px wide

- Mobile/Tablet (<1024px): Single column layout
  - Both elements stack vertically
  - Poster takes 100% width (up to 1400px!)
  - With 9:16 aspect ratio: 900px wide = **1600px tall** 😱
  - This made the poster dominate the entire viewport

### Visual Example

**Before Fix (Mobile):**
```
┌────────────────────────────────┐
│                                │
│         VIDEO PLAYER           │  ← Reasonable size
│                                │
├────────────────────────────────┤
│                                │
│                                │
│                                │
│                                │
│         POSTER IMAGE           │  ← MASSIVE! 
│       (900px × 1600px)         │     Takes entire screen
│                                │     Forces tons of scrolling
│                                │
│                                │
└────────────────────────────────┘
```

**After Fix (Mobile):**
```
┌────────────────────────────────┐
│                                │
│         VIDEO PLAYER           │  ← Reasonable size
│                                │
├────────────────────────────────┤
│      ┌──────────────┐         │
│      │   POSTER     │         │  ← Constrained!
│      │  (280×498px) │         │     Perfect size
│      └──────────────┘         │
└────────────────────────────────┘
```

## Solution Implemented

### Fix #1: Poster Container Max-Width Constraints
Added responsive max-width to the poster container that only applies below the `lg` breakpoint:

```typescript
// File: src/app/console/page.tsx, line 3277-3281

{/* Show Poster - 1 column (1/4 width) - RIGHT SIDE */}
<div className="lg:col-span-1 w-full">
  <div className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto lg:max-w-none lg:mx-0">
    {simplePosterImage}
  </div>
</div>
```

### How It Works

**Responsive Breakdowns:**

| Screen Size | Max Width | Poster Size | Height |
|-------------|-----------|-------------|--------|
| Mobile (<640px) | 280px | 280px wide | 498px tall |
| Small (640px-768px) | 320px (xs) | 320px wide | 569px tall |
| Medium (768px-1024px) | 384px (sm) | 384px wide | 683px tall |
| Large (≥1024px) | none | ~350px (1/4 of grid) | ~622px tall |

**Key CSS Classes:**
- `max-w-[280px]` - Mobile: Very compact (280px max)
- `sm:max-w-xs` - Small screens: 320px max
- `md:max-w-sm` - Medium screens: 384px max
- `lg:max-w-none lg:mx-0` - Large screens: Remove constraints, use grid

### Fix #2: Video Player Constraints
Also added explicit constraints to the video player container:

```typescript
// Line 2995-2996
<div className="lg:col-span-3 w-full max-w-full">
  <div className="... w-full max-w-full">
    <video className="h-full w-full max-w-full" .../>
  </div>
</div>
```

### Fix #3: Poster Image Internal Constraints
Ensured the poster image itself has proper sizing:

```typescript
// Line 2964
<div className="relative w-full" style={{ aspectRatio: '9/16', maxWidth: '100%' }}>
  <Image fill className="object-cover" sizes="(min-width: 1024px) 25vw, 100vw" />
</div>
```

## Responsive Behavior

### 📱 Mobile (320px - 640px)
- ✅ Poster constrained to 280px wide (498px tall)
- ✅ Centered with margin auto
- ✅ Proportional to screen size
- ✅ No horizontal overflow

### 📱 Tablet Portrait (640px - 768px)  
- ✅ Poster expands to 320px wide (569px tall)
- ✅ Still centered and constrained
- ✅ Comfortable viewing size

### 💻 Tablet Landscape (768px - 1024px)
- ✅ Poster expands to 384px wide (683px tall)
- ✅ Preparing for side-by-side layout
- ✅ Maintains vertical stack

### 🖥️ Desktop (≥1024px)
- ✅ Side-by-side layout activated
- ✅ Poster uses 1/4 of grid (~350px)
- ✅ Constraints removed (`lg:max-w-none`)
- ✅ Original intended design

## Technical Details

### Why 280px for Mobile?
- 280px width × 9:16 aspect = **498px height**
- On a typical mobile screen (375px × 667px):
  - Poster takes ~75% of viewport height
  - Leaves room for header, controls, and content below
  - Feels proportional, not overwhelming

### Why Use mx-auto?
Centers the poster horizontally when constrained, creating a balanced appearance on mobile/tablet.

### Why lg:max-w-none?
Removes the constraint at desktop sizes so the poster can fill its grid column naturally.

## Files Modified

1. **src/app/console/page.tsx**
   - Line 2964: Added inline maxWidth to aspectRatio style
   - Line 2995: Added max-w-full to trailer container
   - Line 2996: Added max-w-full to trailer inner div
   - Line 3000: Added max-w-full to video element
   - Line 3277-3281: Added responsive max-width wrapper for poster

## Testing Checklist

### ✅ Mobile (375px width)
- Poster is ~280px wide, centered
- Video player fills width appropriately
- No horizontal scroll
- Content flows naturally

### ✅ Tablet (768px width)
- Poster is ~384px wide, centered
- Both elements stacked vertically
- Comfortable viewing proportions

### ✅ Desktop (1280px width)
- Side-by-side layout active
- Trailer takes 75% width
- Poster takes 25% width
- Original design intact

### ✅ Breakpoint Transitions
- Smooth resize behavior
- No layout jumps
- Constraints apply/remove cleanly

## Before & After Measurements

### Mobile (375px viewport)
| Element | Before | After | Change |
|---------|--------|-------|--------|
| Poster Width | 100% (359px) | 280px | -22% |
| Poster Height | 638px | 498px | -22% |
| Viewport Coverage | 96% | 75% | Better! |

### Tablet (768px viewport)
| Element | Before | After | Change |
|---------|--------|-------|--------|
| Poster Width | 100% (752px) | 384px | -49% |
| Poster Height | 1337px | 683px | -49% |
| Viewport Coverage | 130%+ | 67% | Much better! |

## Status: ✅ FIXED

The hero section now maintains appropriate poster sizing across all viewport widths. The poster no longer becomes massive when stacked below 1024px.

---

**Last Updated:** 2025-01-18  
**Issue:** Massive poster on mobile when stacked  
**Resolution:** Responsive max-width constraints with breakpoint-specific sizing  
**Files Changed:** 1 (`src/app/console/page.tsx`)  
**Lines Changed:** 5 locations


