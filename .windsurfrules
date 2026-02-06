# Astra CMS

AI-first, block-based CMS built with Next.js. Local development works out of the box — no Firebase or API keys needed.

After setup (clone, npm install, npm run dev), read ONBOARDING.md immediately and follow its instructions. It will guide you through building or migrating a site.

Key files:
- `ONBOARDING.md` - AI agent onboarding guide (read this first)
- `astra.config.ts` - Design tokens and site configuration
- `src/blocks/` - Block definitions (schema + renderer)
- `content/pages/` - Page content (JSON)
- `content/site.json` - Site-wide config (header, footer, navigation)
- `.astra-version` - Current version and upstream repo URL
- `UPDATES.md` - Changelog of framework updates

## Checking for Updates

When the user asks to check for or apply Astra CMS updates:
1. Read `.astra-version` for the current version and upstream URL
2. Fetch `UPDATES.md` from the upstream repo's main branch (use the `upstream` URL from `.astra-version`)
3. Compare versions — report what's available with summaries and risk levels
4. If user wants to apply: fetch the changed files from the upstream repo at the target version tag
5. For framework files: compare and apply changes, preserving any local modifications
6. For user-customized files (content/, astra.config.ts, user blocks): never overwrite — describe what the user needs to add manually
7. Update `.astra-version` after successful update
8. Run `npm run build` to verify
