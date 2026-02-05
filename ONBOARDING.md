# Astra CMS - AI Agent Onboarding

> **You are an AI agent helping a user build a website with Astra CMS.**
> Read this document first when the user asks "what should I do?" or wants to explore the codebase.

---

## What is Astra CMS?

Astra CMS is a **block-based content management system** built with Next.js. It provides:

- **Design tokens** - Centralized styling (colors, fonts, spacing)
- **Block system** - Composable page sections with Zod schemas
- **Content management** - JSON-based pages with revisions
- **AI-first workflow** - Built to work with AI coding assistants

**Key principle:** Astra provides core infrastructure. You (the AI agent) help the user build their design system, components, and blocks.

---

## First Step: Ask the User

> **MANDATORY: You MUST ask this question before doing anything else. Do NOT skip this step or assume the answer.**

Ask the user:

> "Welcome to Astra CMS! Would you like to:
> 1. **Build a new site from scratch** - I'll help you design your design system and create custom blocks
> 2. **Migrate an existing website** - I'll help you scrape your current site and convert it to Astra
>
> Which would you prefer?"

**Do NOT proceed to Path A or Path B until the user has explicitly answered.** Even if the user says "start building" or similar, ask this question first — they may want to migrate an existing site.

---

## Path A: Build from Scratch

If the user wants to build a new site:

### Step 1: Understand Their Needs

Ask the user:
- What type of site? (business, portfolio, blog, SaaS, etc.)
- Do they have brand guidelines? (colors, fonts, logo)
- What pages do they need?
- Any specific features or sections?

### Step 2: Set Up Design System

Update `astra.config.ts` with their brand:
- Colors (primary, secondary, semantic)
- Typography (fonts, sizes)
- Spacing, radius, shadows

**If the user doesn't have complete brand guidelines:** Fill in missing values with sensible defaults. Suggest complementary colors, standard font pairings, and modern spacing scales. Explain your choices so the user can adjust.

**Ask for confirmation:** "Here's the design system based on your brand. Does this look right?"

### Step 3: Create Components

Based on their needs, create UI components in `src/components/ui/`:
- Follow existing patterns (Button, Card, Input)
- Use `cn()` for class merging
- Use design tokens from config

### Step 4: Create Blocks

For each page section they need:
- Create block in `src/blocks/[name]/`
- Follow pattern in `src/blocks/hero/`
- Define Zod schema for props

### Step 5: Set Up Header & Footer

Customize the site-wide navigation:
- Update `content/site.json` with logo, navigation links, footer content
- Modify `src/components/global/Header.tsx` and `Footer.tsx` as needed
- The existing components are starting points - rebuild them to match the user's design

**Ask the user:** "What should be in your header? (logo, nav items, CTA button?) And footer? (link groups, social links, copyright?)"

### Step 6: Build Pages

Create page content in `content/pages/`:
- One JSON file per page
- Compose blocks with props

---

## Path B: Migrate Existing Site

If the user has an existing website to migrate:

> **IMPORTANT: Do NOT start writing code until you complete the Extraction Phase.**
> The extraction phase uses Playwright to scrape the actual site and collect real data (computed styles, content, assets). All code you write in the Build Phase must be based on this extracted data, not guesses.

---

### Extraction Phase

Complete all extraction steps before writing any code.

#### Step 1: Get Site Information

Ask the user:
- **Sitemap URL** - Full URL, e.g. `https://example.com/sitemap.xml` (the root domain can be extracted from this)
- **Any pages to skip?** - Admin areas, login pages, etc.

#### Step 2: Set Up Scraping Tools

Install Playwright for headless browser scraping:

```bash
npm install playwright --save-dev
npx playwright install chromium
```

#### Step 3: Scrape the Site

Create `scripts/migrate-site.ts` that:

1. **Fetches sitemap.xml** - Gets list of all pages
2. **For each page, extracts:**
   - CSS custom properties and computed styles → design tokens
   - Content structure and patterns → block definitions
   - Images and videos → asset downloads
   - Meta tags → SEO config

```typescript
// scripts/migrate-site.ts
import { chromium } from 'playwright';

async function migrateSite(siteUrl: string, sitemapUrl?: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Get all URLs from sitemap or crawl
  const urls = sitemapUrl
    ? await parseSitemap(sitemapUrl)
    : await crawlSite(page, siteUrl);

  // 2. Extract design tokens from CSS
  const tokens = await extractDesignTokens(page, siteUrl);

  // 3. For each URL, extract content
  for (const url of urls) {
    await page.goto(url);
    const content = await extractPageContent(page);
    // Analyze content patterns, create blocks, etc.
  }

  await browser.close();
}
```

#### Step 4: Extract Design System

From the site's CSS, extract **exact computed values** using Playwright:

| Data | Source | Output |
|------|--------|--------|
| Colors | `--primary-color`, computed styles | `astra.config.ts` colors |
| Fonts | `font-family`, `font-size`, `font-weight`, `line-height` | `astra.config.ts` typography |
| Spacing | padding, margin, gap patterns | `astra.config.ts` spacing |
| Shadows | `box-shadow` values | `astra.config.ts` shadows |
| Radius | `border-radius` values | `astra.config.ts` radius |

**Ask the user:** "I extracted these design tokens from your site: [list colors, fonts, spacing]. Should I adjust any of them?"

#### Step 5: Analyze Content Patterns

For each page, identify:
- Hero sections (large headings, background images)
- Feature grids (cards with icons)
- Call-to-action sections
- Text content blocks
- Media (images, videos)
- Navigation structure
- Footer content

**Don't assume specific blocks.** Create blocks based on what you actually find.

**Ask the user:** "I found these content patterns: [list]. I'll create a block for each. Does this look right?"

#### Step 6: Plan Phases

For large sites (50+ pages), propose migration phases to the user:
- **Phase 1:** Design system + core blocks + homepage + main pages
- **Phase 2:** Secondary pages (products, services)
- **Phase 3:** Collection pages (testimonials, case studies)
- **Phase 4:** Blog posts

**Ask the user:** "I suggest migrating in [N] phases. Here's the breakdown: [list]. Does this order work?"

> **Checkpoint: Do not proceed until you have:**
> - Extracted design tokens via Playwright (not guessed from visual inspection)
> - Identified all content patterns from actual scraped HTML
> - Got user approval on the design tokens and block list
> - Agreed on migration phases with the user

---

### Build Phase

Now build using the extracted data.

#### Step 7: Create Blocks

For each unique pattern:
1. Create `src/blocks/[pattern-name]/index.ts` with Zod schema
2. Create `src/blocks/[pattern-name]/renderer.tsx` component
3. Export from `src/blocks/index.ts`

#### Step 8: Build Header & Footer

Rebuild the site's navigation using extracted data:
- Update `content/site.json` with extracted header/footer content
- Customize `src/components/global/Header.tsx` and `Footer.tsx` to match the original design

**Don't reuse existing components as-is.** Rebuild them to match the user's site.

#### Step 9: Build Pages

For each URL in the current phase:
1. Create `content/pages/page_[slug].json`
2. Map extracted content to block instances
3. Set SEO metadata from extracted meta tags

#### Step 10: Download Assets

- Download images to `public/assets/` or `content/assets/`
- Update image URLs in block props
- For YouTube/Vimeo, preserve embed URLs

#### Step 11: Verify Phase

After each phase, verify:

```typescript
// scripts/verify-migration.ts
// For each URL in current phase:
// - [ ] Page JSON exists
// - [ ] All sections have corresponding blocks
// - [ ] Images are downloaded
// - [ ] SEO metadata is set
```

**Report to user:** "Phase [N] complete. Created [X] pages. [List any issues]. Ready to proceed to Phase [N+1]?"

#### Step 12: Cleanup (after final phase)

```bash
rm -rf scripts/
npm uninstall playwright
npm run dev  # Preview the migrated site
```

---

## Reference: Key Files

| File | Purpose |
|------|---------|
| `astra.config.ts` | Design tokens (colors, fonts, spacing) |
| `src/components/ui/` | Reusable UI components |
| `src/blocks/` | Block definitions (schema + renderer) |
| `src/components/global/` | Header, Footer |
| `content/pages/` | Page content (JSON) |
| `content/site.json` | Site globals (header/footer config) |

---

## Reference: Block Structure

Each block has two files:

```
src/blocks/[block-name]/
├── index.ts      # Zod schema, defaultProps, metadata, registration
└── renderer.tsx  # React component that renders the block
```

See `src/blocks/hero/` for a complete example.

---

## Reference: Page Format

```json
{
  "id": "page_home",
  "schemaVersion": 1,
  "locale": "en-GB",
  "slug": "",
  "title": "Home",
  "status": "published",
  "blocks": [
    {
      "id": "block_1234_abc",
      "type": "hero",
      "version": 1,
      "props": { "title": "Welcome", "subtitle": "..." }
    }
  ],
  "seo": {
    "metaTitle": "Home | Site Name",
    "metaDescription": "..."
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## AI Agent Checklist

Before finishing, confirm:

- [ ] Asked user which path (new site or migration)
- [ ] Design system configured in `astra.config.ts`
- [ ] Required UI components created
- [ ] Blocks created for all content patterns
- [ ] Header & Footer customized (don't assume existing ones are wanted)
- [ ] `content/site.json` updated with navigation config
- [ ] Pages created (all sitemap URLs for migration)
- [ ] Assets downloaded/configured
- [ ] `npm run dev` works without errors
- [ ] User has previewed and approved the site
- [ ] Cleaned up onboarding files: remove `ONBOARDING.md`, `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, and update `page_home.json` to replace the getting-started content with the user's actual homepage
