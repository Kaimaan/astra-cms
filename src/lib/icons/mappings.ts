/**
 * Icon Mappings
 *
 * HOW TO ADD NEW CURATED ICONS:
 * Only add icons that are used on customer-facing pages.
 * 1. Import the Lucide icon component below
 * 2. Add to lucideIcons map
 * 3. Add emoji mapping in semanticToEmojiMap
 * 4. Update types.ts SemanticIconName union
 */

import {
  Zap,
  Shield,
  Users,
  Rocket,
  Check,
  Star,
  Heart,
  Globe,
  Lock,
  Target,
  Lightbulb,
  Award,
  type LucideIcon,
} from 'lucide-react';

import type { SemanticIconName } from './types';

/**
 * Curated icons bundled in the frontend.
 * Keep minimal - other icons render server-side from registry.
 */
export const lucideIcons: Record<SemanticIconName, LucideIcon> = {
  zap: Zap,
  shield: Shield,
  users: Users,
  rocket: Rocket,
  check: Check,
  star: Star,
  heart: Heart,
  globe: Globe,
  lock: Lock,
  target: Target,
  lightbulb: Lightbulb,
  award: Award,
};

/**
 * Emoji equivalents for curated icons.
 */
export const semanticToEmojiMap: Record<SemanticIconName, string> = {
  zap: '⚡',
  shield: '🛡️',
  users: '👥',
  rocket: '🚀',
  check: '✓',
  star: '⭐',
  heart: '❤️',
  globe: '🌍',
  lock: '🔒',
  target: '🎯',
  lightbulb: '💡',
  award: '🏆',
};

/**
 * Reverse emoji mapping.
 */
export const emojiToSemanticMap: Record<string, SemanticIconName> = Object.entries(
  semanticToEmojiMap
).reduce(
  (acc, [name, emoji]) => {
    acc[emoji] = name as SemanticIconName;
    return acc;
  },
  {} as Record<string, SemanticIconName>
);

/**
 * Aliases for backwards compatibility and PascalCase Lucide names.
 */
export const legacyNameAliases: Record<string, SemanticIconName> = {
  // Common alternatives
  lightning: 'zap',
  bolt: 'zap',
  people: 'users',
  team: 'users',
  bulb: 'lightbulb',
  // PascalCase Lucide names
  Zap: 'zap',
  Shield: 'shield',
  Users: 'users',
  Rocket: 'rocket',
  Check: 'check',
  Star: 'star',
  Heart: 'heart',
  Globe: 'globe',
  Lock: 'lock',
  Target: 'target',
  Lightbulb: 'lightbulb',
  Award: 'award',
};
