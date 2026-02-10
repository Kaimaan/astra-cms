# Icon System

## How It Works

- Admin picks any of 1700+ Lucide icons
- Icons render server-side from registry - no bundle impact
- Curated icons (optional) for micro-optimization

## Usage

```tsx
import { IconOrImageServer } from '@/components/icons';

// Any Lucide icon by PascalCase name
<IconOrImageServer value="ShoppingBag" size="lg" />
<IconOrImageServer value="Rocket" size="md" />
```

## Adding a Curated Icon (optional)

Only if you need client-side rendering for a specific icon:

1. `types.ts` - add to `SemanticIconName` union
2. `mappings.ts` - add import + mappings

## Regenerate Registry

After updating lucide-react:

```bash
npx tsx scripts/generate-icon-registry.ts
```
