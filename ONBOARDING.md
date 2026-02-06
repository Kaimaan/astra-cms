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

> **CRITICAL: Never delete onboarding files, migration scripts, or any scaffolding until the user has explicitly confirmed the site is complete and working.** This includes `ONBOARDING.md`, `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, and `scripts/`. Premature cleanup removes your instructions and prevents the user from fixing issues. Always wait for explicit user approval.

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

> **Goal: Reproduce the original site as closely as possible.** Do NOT add your own improvements, redesigns, or "better" layouts during migration. Match the original first. The user can iterate and improve later.

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
2. **Detects site language** - Extract `<html lang="...">` attribute from the homepage. Use this to set `i18n.defaultLocale` and `i18n.locales` in `astra.config.ts` (e.g. `fi-FI` for Finnish, `sv-SE` for Swedish). Use the correct locale in all page JSON files.
3. **For each page, extracts:**
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

From the site's CSS, extract **exact computed values** using Playwright. Use `window.getComputedStyle()` on key elements to get real values — do not guess.

**Colors** (extract from computed styles):
- Primary, secondary, accent colors
- Background color **for each distinct section** on the page (map which background goes with which block type — don't just extract a few global values)
- Text colors (headings, body, muted)
- Link colors and hover states
- Overlay opacity values (e.g. hero dark overlays)

**Typography** (extract from headings, body, buttons):
- `font-family` — exact font name (e.g. "Oswald", not "sans-serif")
- `font-size` — for h1, h2, h3, h4, body, small text, buttons
- `font-weight` — for each element (headings often differ from body)
- `line-height` — for headings and body text
- `letter-spacing` — especially for display/heading fonts

**Spacing** (extract from sections, cards, buttons):
- Section padding (top/bottom)
- Container max-width
- Card padding
- Gap between grid items
- Button padding

**Other**:
- `box-shadow` — exact CSS values, not just "light/medium/heavy"
- `border-radius` — exact values per element type (buttons, cards, images)
- `transition` values for hover effects

**Ask the user:** "I extracted these design tokens from your site: [list colors, fonts, spacing]. Should I adjust any of them?"

#### Step 5: Analyze Content Patterns

For each page, identify content sections and record **layout details** for each:

**Per section, record:**
- Section type (hero, feature grid, CTA, text+image, etc.)
- Background color or image for that section
- Column layout (1-col, 2-col side-by-side, 3-col grid, etc.)
- Image position relative to text (left, right, above, below)
- Whether image/text sides alternate across repeated sections
- Text alignment (left, center, right)

**Navigation — extract in detail:**
- Top-level nav items
- **Dropdown/mega menus** — which items have sub-menus, what's in them
- Mobile behavior (hamburger menu, slide-out, etc.)
- Sticky/fixed positioning

**Footer — extract in detail:**
- Link groups and their items
- Social links
- Copyright text

**Don't assume specific blocks.** Create blocks based on what you actually find.

**Ask the user:** "I found these content patterns: [list with layout details]. I'll create a block for each. Does this look right?"

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
4. **Register in admin editor** so the block is editable:
   - `src/components/editor/ChatPanel.tsx` — add entry to `BLOCK_META` (label, description, icon), `BLOCK_PROPERTIES` (editable fields), and `BLOCK_SCHEMAS` (schema description for AI)
   - `src/components/editor/EditableBlockRenderer.tsx` — add a preview case in the `BlockPreviewContent` switch statement

**Without step 4, blocks will render on the public site but cannot be edited in admin.**

**Use the extracted layout data in each renderer** — image position (left/right), background color, column layout, and text alignment must match what was scraped, not default to a generic layout.

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

**Every page JSON must include these fields** for the admin UI to work (edit/view/delete buttons, status badges):
```json
{
  "id": "page_[slug]",
  "schemaVersion": 2,
  "locale": "fi-FI",
  "paths": { "fi-FI": "palvelut" },
  "title": "Page Title",
  "status": "published",
  "blocks": [],
  "seo": { "metaTitle": "...", "metaDescription": "..." },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
Use the detected locale (from Step 3) in `locale` and `paths` — not the default `en-GB`.

#### Step 10: Download Assets

Save files and register them so they appear in the admin media library:

1. Download images/videos to `/public/uploads/` with naming format `{name}-{timestamp}{ext}`
2. Register each asset in `/content/assets/assets.json` with this structure:
   ```json
   {
     "id": "asset_{timestamp}_{random}",
     "type": "image",
     "filename": "hero-bg-1706000000000.jpg",
     "url": "/uploads/hero-bg-1706000000000.jpg",
     "mimeType": "image/jpeg",
     "size": 123456,
     "createdAt": "2024-01-01T00:00:00.000Z"
   }
   ```
3. Reference assets in block props as `/uploads/{filename}`
4. For YouTube/Vimeo, preserve embed URLs (no download needed)

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

#### Step 12: User Review & Testing

> **MANDATORY: Do NOT skip this step. Do NOT proceed to cleanup until the user explicitly confirms they are satisfied.**

Start the dev server and have the user test the site:

```bash
npm run dev  # Start the dev server for preview
```

Walk through this checklist **with the user** (ask them to verify each item):

- [ ] All pages load correctly
- [ ] Navigation works (header links, dropdowns, mobile menu)
- [ ] Images and assets display properly
- [ ] Layout matches the original site
- [ ] Text content is accurate
- [ ] SEO metadata is set
- [ ] Admin panel works (can view/edit pages)

**Ask the user:**

> "The site is ready for review. Please check all the pages and let me know:
> 1. Does everything look correct?
> 2. Is anything broken or missing?
> 3. Are you happy with the result?
>
> Take your time — I won't clean up any files until you confirm everything is good."

**If the user reports issues:** Fix them and repeat this step. Do not proceed until the user explicitly says they are satisfied.

#### Step 13: Cleanup (only after explicit user approval)

> **NEVER run this step automatically.** Only proceed when the user has explicitly confirmed in Step 12 that they are satisfied with the site. If in doubt, ask again.

**Ask the user before proceeding:**

> "Everything looks good! I'm ready to clean up the migration scripts and onboarding files. This will remove:
> - `scripts/` (migration scripts)
> - Playwright dependency
> - `ONBOARDING.md`, `CLAUDE.md`, and other agent instruction files
>
> These are only needed during setup — your site will work fine without them. Should I go ahead?"

Only after the user confirms:

```bash
rm -rf scripts/
npm uninstall playwright
```

Then remove onboarding files:
- `ONBOARDING.md`
- `CLAUDE.md`
- `.cursorrules`
- `.windsurfrules`
- `.clinerules`
- `.github/copilot-instructions.md`

And update `page_home.json` to replace the getting-started content with the user's actual homepage.

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
- [ ] User has previewed and tested all pages
- [ ] User has explicitly confirmed they are satisfied with the site

> **STOP — Do not continue past this point until the user has explicitly confirmed the site is complete and working. Never assume approval. Ask and wait for a clear "yes".**

- [ ] User has approved cleanup of onboarding files
- [ ] Cleaned up: removed migration scripts, playwright, onboarding files (`ONBOARDING.md`, `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`)
- [ ] Updated `page_home.json` to replace getting-started content with user's actual homepage
