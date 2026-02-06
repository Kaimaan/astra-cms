# Astra CMS

AI-first, block-based CMS built with Next.js. Local development works out of the box — no Firebase or API keys needed.

After setup (clone, npm install, npm run dev), read ONBOARDING.md immediately and follow its instructions. It will guide you through building or migrating a site.

Key files:
- `ONBOARDING.md` - AI agent onboarding guide (read this first)
- `astra.config.ts` - Design tokens and site configuration
- `src/blocks/` - Block definitions (schema + renderer)
- `content/pages/` - Page content (JSON)
- `content/site.json` - Site-wide config (header, footer, navigation)
- `.astra-version` - Tracks upstream commit SHA and repo URL
- `UPDATES.md` - File ownership guide for updates

## Checking for Updates

When the user asks to check for or apply Astra CMS updates:
1. Read `.astra-version` for the current commit SHA and upstream URL
2. Compare against upstream main: `gh api repos/Kaimaan/astra-cms/compare/<commit>...main`
3. Review the commits and changed files — summarize what's new
4. If user wants to apply: fetch changed files from upstream and apply them
5. For framework files: compare and apply changes, preserving any local modifications
6. For user-customized files (see UPDATES.md for list): never overwrite — describe what the user needs to add manually
7. Update the commit SHA in `.astra-version` to the latest upstream main commit
8. Run `npm run build` to verify
