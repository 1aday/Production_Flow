# 🔗 Show Page Slug URLs - Complete

## Overview

Show pages now use **human-readable URLs** with show titles instead of random IDs!

## ✨ What Changed

### Before:
```
/show/show-1762898469654-qsq3fudte
/show/show-1762899074500-svg58z3bk
```

### After:
```
/show/the-detective-chronicles-show-1762898469654-qsq3fudte
/show/neon-nights-show-1762899074500-svg58z3bk
```

The URL now includes:
1. **Slugified show title** (readable, SEO-friendly)
2. **Show ID** (ensures uniqueness)

## 🎯 Benefits

1. **SEO**: Search engines prefer descriptive URLs
2. **User-Friendly**: Users can see what show they're viewing
3. **Shareable**: URLs look professional when shared
4. **Backward Compatible**: Old ID-only URLs still work
5. **Unique**: ID suffix ensures no collisions

## 📁 Files Created/Modified

### New Files:
- **`src/lib/slug.ts`** - Slug generation and ID extraction utilities

### Modified Files:
- **`src/app/show/[id]/page.tsx`** - Extract ID from slug in metadata
- **`src/app/show/[id]/ShowPageClient.tsx`** - (uses extracted ID)
- **`src/app/api/show/[id]/route.ts`** - Handle slugs in API
- **`src/app/api/show/[id]/download/route.ts`** - Handle slugs in downloads
- **`src/app/api/show/[id]/generate-content/route.ts`** - Handle slugs in generation
- **`src/app/library/page.tsx`** - Generate slug URLs for links
- **`src/app/page.tsx`** - Generate slug URLs for homepage links

## 🔧 How It Works

### 1. Slug Generation

```typescript
import { getShowUrl } from "@/lib/slug";

const url = getShowUrl({
  id: "show-1762898469654-qsq3fudte",
  title: "The Detective Chronicles"
});
// Returns: "/show/the-detective-chronicles-show-1762898469654-qsq3fudte"
```

### 2. Slug Rules

Titles are transformed:
- Lowercase
- Special characters removed
- Spaces → hyphens
- Multiple hyphens → single hyphen
- Leading/trailing hyphens removed

Examples:
- `"The Detective Chronicles"` → `"the-detective-chronicles"`
- `"Neon Nights: A Cyber Story!"` → `"neon-nights-a-cyber-story"`
- `"Space    Adventures"` → `"space-adventures"`

### 3. ID Extraction

The route automatically extracts the show ID:

```typescript
import { extractShowId } from "@/lib/slug";

// From slug URL
extractShowId("the-detective-chronicles-show-1762898469654-qsq3fudte")
// Returns: "show-1762898469654-qsq3fudte"

// From plain ID (backward compatible)
extractShowId("show-1762898469654-qsq3fudte")
// Returns: "show-1762898469654-qsq3fudte"
```

### 4. Backward Compatibility

Old URLs still work:
- `/show/show-1762898469654-qsq3fudte` ✅ Works
- `/show/the-detective-chronicles-show-1762898469654-qsq3fudte` ✅ Works

The system detects whether it's a slug or plain ID and handles both.

## 🛠️ Utility Functions

### `generateSlug(title: string): string`
Creates a URL-friendly slug from a title.

```typescript
generateSlug("The Detective Chronicles");
// "the-detective-chronicles"
```

### `getShowUrl(show): string`
Generates complete show URL with slug.

```typescript
getShowUrl({
  id: "show-123",
  title: "My Show"
});
// "/show/my-show-show-123"
```

### `extractShowId(slugOrId: string): string`
Extracts show ID from slug or returns ID if already plain.

```typescript
extractShowId("my-show-show-123");
// "show-123"
```

### `isShowId(str: string): boolean`
Checks if string is a show ID vs. slug.

```typescript
isShowId("show-1762898469654-qsq3fudte");  // true
isShowId("the-detective-chronicles");       // false
```

## 📝 URL Format

### Structure:
```
/show/{slug}-{id}
```

### Components:
1. **{slug}**: Slugified show title (e.g., `the-detective-chronicles`)
2. **{id}**: Original show ID (e.g., `show-1762898469654-qsq3fudte`)

### Separator:
The slug and ID are separated by the **last hyphen before the ID pattern**.

Pattern detection:
- `show-TIMESTAMP-RANDOMCHARS` (e.g., `show-1762898469654-qsq3fudte`)
- Or UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## 🚀 Usage Examples

### In Components:

```tsx
import { getShowUrl } from "@/lib/slug";
import { useRouter } from "next/navigation";

function ShowCard({ show }) {
  const router = useRouter();
  
  const handleClick = () => {
    const url = getShowUrl({
      id: show.id,
      title: show.title,
      showTitle: show.showTitle,
      blueprint: show.blueprint
    });
    router.push(url);
  };
  
  return <div onClick={handleClick}>View Show</div>;
}
```

### In Links:

```tsx
import { getShowUrl } from "@/lib/slug";
import Link from "next/link";

function ShowLink({ show }) {
  const url = getShowUrl(show);
  return <Link href={url}>View {show.title}</Link>;
}
```

## 🎨 SEO Impact

### Before:
- URL: `/show/show-1762898469654-qsq3fudte`
- Search engines see: Random ID, no context
- Social shares: Looks technical

### After:
- URL: `/show/the-detective-chronicles-show-1762898469654-qsq3fudte`
- Search engines see: "the detective chronicles" + unique ID
- Social shares: Looks professional

### Open Graph Impact:
URLs now appear in Open Graph metadata with descriptive slugs:

```html
<meta property="og:url" content="https://domain.com/show/the-detective-chronicles-show-123" />
```

## 🔒 Security & Validation

- **IDs are still required**: Slug is cosmetic, ID is authoritative
- **No slug collision**: ID ensures uniqueness
- **Input sanitization**: Special chars stripped from slugs
- **XSS prevention**: Slugs are sanitized and URL-encoded

## 🎯 Best Practices

1. **Always use `getShowUrl()`** when creating show links
2. **Never construct URLs manually** - use the utility functions
3. **IDs remain unique** - slugs are just for display
4. **Old links work** - maintain backward compatibility

## ✅ Testing

### Test Cases:

```typescript
// Special characters
getShowUrl({ id: "show-123", title: "The Show! #1" })
// "/show/the-show-1-show-123"

// Multiple spaces
getShowUrl({ id: "show-123", title: "The    Big    Show" })
// "/show/the-big-show-show-123"

// Unicode characters
getShowUrl({ id: "show-123", title: "Café Noir" })
// "/show/caf-noir-show-123"

// No title
getShowUrl({ id: "show-123" })
// "/show/show-123"

// Extract from slug
extractShowId("the-detective-chronicles-show-123")
// "show-123"

// Extract from plain ID
extractShowId("show-123")
// "show-123"
```

## 📊 Performance

- **Zero impact**: Slug generation is instant (simple string operations)
- **No database changes**: Slugs generated on-the-fly
- **Cached by browsers**: URLs work with standard HTTP caching
- **SEO crawlers**: Can index descriptive URLs immediately

## 🎉 Result

Show URLs are now:
- ✅ **Readable**: Users can see show names
- ✅ **SEO-Friendly**: Search engines prefer descriptive URLs
- ✅ **Professional**: Look great when shared
- ✅ **Unique**: ID suffix prevents collisions
- ✅ **Backward Compatible**: Old URLs still work
- ✅ **Automatic**: No manual slug management needed

**Example from your shows:**

Before: `/show/show-1762898469654-qsq3fudte`

After: `/show/your-show-title-show-1762898469654-qsq3fudte`

Much better! 🎬✨

