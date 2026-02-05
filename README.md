# Astra CMS

AI-first, block-based content management system built with Next.js.

## Getting Started

**AI Agents:** Read [ONBOARDING.md](./ONBOARDING.md) first. It contains instructions for helping users build or migrate websites.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- A cloud platform account (e.g. Firebase, Supabase, AWS) — optional for local-only development

### 1. Clone the repository

```bash
git clone https://github.com/Kaimaan/astra-cms.git
cd astra-cms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values. See `.env.example` for details on each variable.

To enable AI features (inline editing, AI assistant), add your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

Get a key at [Google AI Studio](https://aistudio.google.com/apikey). Note that Gemini API usage may incur charges — check [Google's pricing](https://ai.google.dev/pricing) for details.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.
Open [http://localhost:3000/admin](http://localhost:3000/admin) to access the admin panel.

## Documentation

- [ONBOARDING.md](./ONBOARDING.md) - AI agent onboarding guide
- [astra.config.ts](./astra.config.ts) - Design tokens and site configuration
- [src/blocks/](./src/blocks/) - Block definitions (examples)
- [content/](./content/) - Page content (JSON)
