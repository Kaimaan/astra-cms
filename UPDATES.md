# Astra CMS — Update Guide

This project tracks the upstream Astra CMS via the commit SHA in `.astra-version`.
Your AI agent can compare your stored commit against the upstream main branch
to see what's changed and apply updates.

To check for updates: ask your AI agent "check for Astra CMS updates".

## File Ownership

Files AI agents should NOT overwrite during updates (user-customized):
- `astra.config.ts` — site design tokens and configuration
- `content/` — all page/post content
- `content/site.json` — header, footer, navigation
- `src/blocks/` — user-created blocks (template blocks may be updated carefully)
