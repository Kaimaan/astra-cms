# Astra CMS Updates

This file tracks changes to the Astra CMS framework.
If you're running a customized copy, your AI agent can compare your
`.astra-version` against this log to see what's new.

To apply updates: ask your AI agent to check for Astra CMS updates.
It will read your current version, review this changelog, and fetch
the relevant changes from the upstream GitHub repo.

## File Ownership

Files AI agents should NOT overwrite during updates (user-customized):
- `astra.config.ts` — site design tokens and configuration
- `content/` — all page/post content
- `content/site.json` — header, footer, navigation
- `src/blocks/` — user-created blocks (template blocks may be updated carefully)

---

## 0.1.0 (2026-02-06)

Initial release — baseline version.
