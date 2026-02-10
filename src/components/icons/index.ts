/**
 * Icon System
 *
 * A performant icon system that supports:
 * - 70+ curated semantic icons (bundled, tree-shaken)
 * - 1700+ Lucide icons via server-side rendering (not bundled)
 * - Emoji library alternative
 * - Image URLs
 *
 * See ICONS.md for documentation on adding new icons.
 */

// Types
export type { IconLibrary, SemanticIconName, IconLibraryInfo } from './types';
export { iconLibraries } from './types';

// Mappings
export {
  lucideIcons,
  semanticToEmojiMap,
  emojiToSemanticMap,
  legacyNameAliases,
} from './mappings';

// Provider
export { IconProvider, useIconLibrary } from './IconProvider';

// Components
export { IconOrImage, type IconSize } from './IconOrImage';
export { IconOrImageServer } from './IconOrImageServer';
export { ServerIcon } from './ServerIcon';
