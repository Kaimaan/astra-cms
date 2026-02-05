/**
 * Icon System Types
 *
 * HOW TO ADD NEW CURATED ICONS:
 * Only add icons here if they're used on customer-facing pages.
 * Admin can use any of 1700+ Lucide icons via the registry.
 *
 * 1. Add the semantic name to SemanticIconName union below
 * 2. Add the Lucide import in mappings.ts
 * 3. Add to lucideIcons map in mappings.ts
 */

export type IconLibrary = 'lucide' | 'emoji';

/**
 * Curated semantic icon names - only icons actually used on the site.
 * Keep this minimal. Everything else renders server-side from registry.
 */
export type SemanticIconName =
  | 'zap'
  | 'shield'
  | 'users'
  | 'rocket'
  | 'check'
  | 'star'
  | 'heart'
  | 'globe'
  | 'lock'
  | 'target'
  | 'lightbulb'
  | 'award';

export interface IconLibraryInfo {
  id: IconLibrary;
  name: string;
  description: string;
}

export const iconLibraries: IconLibraryInfo[] = [
  {
    id: 'lucide',
    name: 'Lucide Icons',
    description: 'Clean, consistent stroke-based icons',
  },
  {
    id: 'emoji',
    name: 'Emoji',
    description: 'Native emoji icons for a friendly look',
  },
];
