# Astra CMS - Migrate Your Existing Site

This guide helps you migrate your existing website to Astra CMS using your AI coding assistant (Cursor, Claude Code, Codex, etc.).

## Prerequisites

- Your old site's public URL
- Sitemap URL (optional but recommended - usually `/sitemap.xml`)
- AI coding assistant (Cursor, Claude Code, Codex, etc.)
- Asset library configured (for storing migrated media)

## Step 1: Copy This Prompt Into Your AI Tool

Copy the following prompt and paste it into your AI coding assistant. Replace the placeholder values with your actual site information.

---

```
I want to migrate my existing website to Astra CMS.

Site URL: [YOUR_SITE_URL]
Sitemap URL (optional): [YOUR_SITEMAP_URL or "none"]

Please:

1. Install Playwright temporarily:
   npm install playwright --save-dev

2. Create a migration script at scripts/migrate-site.ts that:
   - Parses sitemap.xml if provided (for complete page list)
   - Falls back to crawling from homepage if no sitemap
   - Extracts CSS custom properties and computed styles for design tokens
   - Identifies page sections (hero, features, content, CTAs, videos)
   - Maps them to Astra block types
   - Downloads images and self-hosted videos to the asset library
   - Preserves YouTube/Vimeo embed URLs

3. Run the script and generate:
   - Updated astra.config.ts with my design tokens
   - content/pages/*.json with block instances
   - Media uploaded to asset library

4. Clean up after migration:
   - Delete the scripts/ folder
   - npm uninstall playwright

Reference these Astra block types and their schemas:

hero: {
  title: string (required),
  subtitle?: string,
  description?: string,
  alignment: 'left' | 'center' | 'right' (default: 'center'),
  cta?: { label: string, href: string, variant: 'primary' | 'secondary' | 'outline' },
  secondaryCta?: { label: string, href: string, variant: 'primary' | 'secondary' | 'outline' },
  backgroundImage?: string (URL)
}

features: {
  title?: string,
  subtitle?: string,
  features: Array<{ icon: string, title: string, description: string }>,
  columns: '2' | '3' | '4' (default: '3')
}

rich-text: {
  content: string (HTML),
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md')
}

cta: {
  title: string (required),
  description?: string,
  primaryCta: { label: string, href: string },
  secondaryCta?: { label: string, href: string },
  variant: 'default' | 'centered' | 'split' (default: 'default')
}

video: {
  src: string (required - asset URL or embed URL),
  type: 'hosted' | 'embed' (default: 'hosted'),
  poster?: string (thumbnail URL),
  title?: string,
  autoplay: boolean (default: false),
  loop: boolean (default: false),
  muted: boolean (default: false),
  controls: boolean (default: true),
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' (default: '16:9')
}

Block instance format:
{
  id: string (format: "block_<timestamp>_<random>"),
  type: string (block type name),
  version: 1,
  props: { ... block-specific props }
}

Page format (content/pages/*.json):
{
  id: string,
  schemaVersion: 1,
  locale: "en-GB",
  slug: string (URL path),
  title: string,
  status: "draft",
  blocks: BlockInstance[],
  createdAt: ISO date string,
  updatedAt: ISO date string
}
```

---

## What Gets Extracted

### Design Tokens (astra.config.ts)

The AI will extract from your site's CSS and fill in sensible defaults for anything missing:

| Token Type | What's Extracted |
|------------|------------------|
| Colors | Primary, secondary, background, text colors from CSS custom properties or computed styles |
| Typography | Font families and sizes |
| Spacing | Common padding/margin values |
| Radius | Border-radius values |
| Shadows | Box-shadow values |

### Content (Blocks)

The AI identifies patterns and maps content to appropriate blocks:

| Content Pattern | Block Type |
|-----------------|------------|
| Large heading at top, centered | `hero` |
| Grid of cards with icons | `features` |
| Prominent button sections | `cta` |
| Video elements | `video` |
| YouTube/Vimeo embeds | `video` (type: embed) |
| Everything else | `rich-text` |

### Media

| Media Type | Handling |
|------------|----------|
| Images | Downloaded to asset library |
| Self-hosted videos | Downloaded to asset library |
| YouTube/Vimeo | Preserved as embed URLs |

## Step 2: Review & Customize

After the migration completes:

1. **Review astra.config.ts** - Adjust design tokens to match your brand
2. **Review content files** - Check block mappings are correct
3. **Check media** - Verify all images/videos were captured
4. **Run the dev server** - `npm run dev` to preview your migrated site

## Troubleshooting

### Sitemap not found
If your site doesn't have a sitemap, the AI will crawl from your homepage. You can also manually provide a list of URLs to migrate.

### Missing content
Some dynamic content (loaded via JavaScript) may not be captured. Provide additional context to the AI about specific pages or sections.

### Design tokens look wrong
You can always manually adjust `astra.config.ts` after migration. The extracted values are a starting point.

## Need Help?

If you encounter issues during migration, describe the problem to your AI assistant with:
- The error message (if any)
- Which page/section failed
- What you expected vs. what happened

---

## Deployment

Astra CMS uses **ISR (Incremental Static Regeneration)** for fast page loads and SEO.

### How It Works

1. **Build time**: All published pages are pre-rendered as static HTML
2. **Runtime**: New pages work immediately (rendered on-demand, then cached)
3. **Content updates**: When you publish in admin, pages are instantly revalidated

### Recommended Hosts

| Host | Setup |
|------|-------|
| **Vercel** | Zero config - ISR works automatically |
| **Railway** | Works with Node.js runtime |
| **Render** | Use Node.js web service |
| **Self-hosted** | Run `npm run build && npm start` |

### Content Update Flow

```
Editor publishes page in admin
         ↓
Server action revalidates the page
         ↓
Next visitor sees updated content
```

No additional configuration required - revalidation happens automatically when you publish content.
